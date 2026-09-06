import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { SEED_PRODUCTS } from '../data/seedProducts';

export const apiRouter = express.Router();

apiRouter.use(express.json());

// Health route
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SmartCart AI API' });
});

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseGeminiError(error: any): string {
  if (!error) return 'An unexpected error occurred while communicating with Gemini AI.';
  const msg = error.message || String(error);
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) {
      if (parsed.error.code === 503) {
        return 'Gemini AI is currently experiencing high demand. Please try again in a few moments.';
      }
      if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
        return 'Gemini AI rate limit or quota reached. Please try again shortly.';
      }
      return parsed.error.message;
    }
  } catch {
    // raw string
  }
  if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
    return 'Gemini AI is currently experiencing high demand. Please try again in a few moments.';
  }
  if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate-limit') || msg.includes('429')) {
    return 'Gemini AI rate limit or quota reached. Please try again shortly.';
  }
  return msg;
}

// Resilient runner with automatic model fallback for transient 503s or quota limits
async function callGemini(ai: GoogleGenAI, contents: string, isJson: boolean = true) {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const model of models) {
      try {
        const config: any = {};
        if (isJson) {
          config.responseMimeType = 'application/json';
        }
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        return response.text || '';
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        // If 429 burst limit or 503, wait 1.8s for rate limit window to clear and try next model
        if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
          await new Promise(r => setTimeout(r, 1800));
          continue;
        }
        if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand')) {
          await new Promise(r => setTimeout(r, 800));
          continue;
        }
        throw err;
      }
    }
  }
  throw lastError;
}

function extractJson(raw: string): any {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    // Try to strip markdown code fences
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // fall through
      }
    }
    return {};
  }
}

// Input sanitization and bounds enforcement helpers for production security
function sanitizeString(input: any, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

function sanitizeNumber(input: any, min = 0, max = 100000000, fallback = 0): number {
  const num = Number(input);
  if (isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

const CATALOG_SUMMARY = SEED_PRODUCTS.map(p => 
  `ID: ${p.id} | ${p.title} | Brand: ${p.brand} | Cat: ${p.category} | Price: ₹${p.price} | Rating: ${p.rating} | Specs: ${JSON.stringify(p.specs)}`
).join('\n');

// 1. Assistant Chat & Shopping Recommendations
apiRouter.post('/chat', async (req, res) => {
  try {
    if (!req.body || typeof req.body.message !== 'string' || !req.body.message.trim()) {
      return res.status(400).json({ error: 'A valid message text is required' });
    }

    const message = sanitizeString(req.body.message, 2000);
    const history = Array.isArray(req.body.history)
      ? req.body.history.slice(-20).map((h: any) => ({
          role: sanitizeString(h?.role, 50) || 'user',
          content: sanitizeString(h?.content, 1000),
        }))
      : [];
    const context = req.body.context && typeof req.body.context === 'object' ? req.body.context : {};

    const ai = getGeminiClient();

    const userBudget = context.budget ? `₹${sanitizeNumber(context.budget, 0, 10000000)}` : 'Flexible';
    const shoppingStyle = sanitizeString(context.shoppingStyle, 50) || 'Best Value';
    const preferredCats = Array.isArray(context.preferredCategories)
      ? context.preferredCategories.map((c: any) => sanitizeString(c, 50)).filter(Boolean).join(', ') || 'All categories'
      : 'All categories';
    const preferredBrands = Array.isArray(context.preferredBrands)
      ? context.preferredBrands.map((b: any) => sanitizeString(b, 50)).filter(Boolean).join(', ') || 'Any reputable brand'
      : 'Any reputable brand';
    const cartSummary = Array.isArray(context.cartItems)
      ? context.cartItems.slice(0, 50).map((c: any) => `${sanitizeString(c?.title, 100)} (₹${sanitizeNumber(c?.price)} x ${sanitizeNumber(c?.quantity, 1, 100, 1)})`).join(', ') || 'Empty'
      : 'Empty';
    const savedSummary = Array.isArray(context.savedItems)
      ? context.savedItems.slice(0, 50).map((s: any) => `${sanitizeString(s?.title, 100)} (₹${sanitizeNumber(s?.price)})`).join(', ') || 'None'
      : 'None';

    const prompt = `You are SmartCart AI, a premier intelligent shopping advisor powered by Gemini.
User Profile:
- Target Budget: ${userBudget}
- Shopping Style: ${shoppingStyle}
- Preferred Categories: ${preferredCats}
- Preferred Brands: ${preferredBrands}
- Current Cart: ${cartSummary}
- Saved Items: ${savedSummary}

Available Catalog Products:
${CATALOG_SUMMARY}

Recent Chat History:
${history.map((h: any) => `${h.role}: ${h.content}`).join('\n')}

User Query: "${message}"

Instructions:
1. Provide an insightful, direct, and helpful response addressing the user's intent.
2. If suggesting or discussing products, recommend relevant items from the Available Catalog above whenever appropriate.
3. Include the exact product IDs of any recommended catalog products in "recommendedProductIds".
4. Return your output in pure JSON matching this structure:
{
  "reply": "Your clear, formatted response (markdown is supported)",
  "recommendedProductIds": ["id1", "id2"]
}`;

    const raw = await callGemini(ai, prompt, true);
    const parsed = extractJson(raw);

    const recommendedIds: string[] = Array.isArray(parsed.recommendedProductIds) 
      ? parsed.recommendedProductIds 
      : [];
    
    // Map IDs to actual product objects from catalog
    let recommendedProducts = SEED_PRODUCTS.filter(p => recommendedIds.includes(p.id));
    if (recommendedProducts.length === 0 && parsed.reply) {
      const replyLower = parsed.reply.toLowerCase();
      recommendedProducts = SEED_PRODUCTS.filter(p => 
        replyLower.includes(p.title.toLowerCase()) || 
        (replyLower.includes(p.brand.toLowerCase()) && replyLower.includes(p.category.toLowerCase()))
      ).slice(0, 3);
    }

    return res.json({
      reply: parsed.reply || raw || 'Here is my shopping analysis based on your criteria.',
      recommendedProducts,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

// 2. Personalized Recommendations
apiRouter.post('/recommendations', async (req, res) => {
  try {
    // Gracefully support both req.body.context and userPreferences from DashboardView
    const rawContext = req.body.context || {
      budget: req.body.userPreferences?.defaultBudget,
      shoppingStyle: req.body.userPreferences?.shoppingStyle,
      preferredCategories: req.body.userPreferences?.preferredCategories,
      preferredBrands: req.body.userPreferences?.preferredBrands,
      cartItems: req.body.currentCart,
      savedItems: req.body.savedItems,
    };

    const budget = sanitizeNumber(rawContext.budget, 0, 10000000, 0);
    const shoppingStyle = sanitizeString(rawContext.shoppingStyle, 50) || 'Best Value';
    const preferredCats = Array.isArray(rawContext.preferredCategories)
      ? rawContext.preferredCategories.map((c: any) => sanitizeString(c, 50)).filter(Boolean).join(', ') || 'All'
      : 'All';
    const preferredBrands = Array.isArray(rawContext.preferredBrands)
      ? rawContext.preferredBrands.map((b: any) => sanitizeString(b, 50)).filter(Boolean).join(', ') || 'Any'
      : 'Any';
    const cartSummary = Array.isArray(rawContext.cartItems)
      ? rawContext.cartItems.slice(0, 30).map((c: any) => sanitizeString(c?.title, 100)).join(', ') || 'Empty'
      : 'Empty';
    const savedSummary = Array.isArray(rawContext.savedItems)
      ? rawContext.savedItems.slice(0, 30).map((s: any) => sanitizeString(s?.title, 100)).join(', ') || 'None'
      : 'None';

    const ai = getGeminiClient();

    const prompt = `You are SmartCart AI. Generate 3 to 4 personalized product recommendations for this shopper:
- Budget: ${budget > 0 ? `₹${budget}` : 'Flexible'}
- Shopping Style: ${shoppingStyle}
- Preferred Categories: ${preferredCats}
- Preferred Brands: ${preferredBrands}
- Current Cart: ${cartSummary}
- Saved Items: ${savedSummary}

Catalog Products:
${CATALOG_SUMMARY}

Select the 3-4 best matching products from the catalog. Return JSON:
{
  "insight": "A 1-2 sentence personalized rationale for why this selection matches their profile",
  "recommendedProductIds": ["id1", "id2", "id3"]
}`;

    const raw = await callGemini(ai, prompt, true);
    const parsed = extractJson(raw);
    const recommendedIds: string[] = Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [];
    const recommendedProducts = SEED_PRODUCTS.filter(p => recommendedIds.includes(p.id));

    return res.json({
      insight: parsed.insight || 'Curated to maximize your shopping preferences and budget.',
      recommendedProducts: recommendedProducts.length > 0 ? recommendedProducts : SEED_PRODUCTS.slice(0, 4),
    });
  } catch (error: any) {
    console.error('Gemini recommendations error:', error);
    return res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

// 3. Product Explanations ("Why SmartCart AI recommends this")
apiRouter.post('/explain-product', async (req, res) => {
  try {
    const { product, userPreference } = req.body;
    if (!product || typeof product !== 'object' || !product.title) {
      return res.status(400).json({ error: 'A valid product object is required' });
    }

    const title = sanitizeString(product.title, 200);
    const brand = sanitizeString(product.brand, 100);
    const category = sanitizeString(product.category, 100);
    const price = sanitizeNumber(product.price, 0, 10000000);
    const rating = sanitizeNumber(product.rating, 0, 5, 4.5);
    const reviewsCount = sanitizeNumber(product.reviewsCount, 0, 1000000, 100);
    const description = sanitizeString(product.description, 500);

    const ai = getGeminiClient();
    const prompt = `Analyze this product for a shopper whose preference profile is:
- Shopping Style: ${sanitizeString(userPreference?.shoppingStyle, 50) || 'Best Value'}
- Target Budget Ceiling: ${userPreference?.defaultBudget ? `₹${sanitizeNumber(userPreference.defaultBudget)}` : 'Flexible'}

Product Details:
- Title: ${title}
- Brand: ${brand}
- Category: ${category}
- Price: ₹${price}
- Rating: ${rating}/5 (${reviewsCount} reviews)
- Description: ${description}
- Specs: ${JSON.stringify(product.specs || {})}
- Known Strengths: ${(Array.isArray(product.pros) ? product.pros : []).slice(0, 5).map((p: any) => sanitizeString(p, 100)).join(', ')}
- Known Considerations: ${(Array.isArray(product.considerations) ? product.considerations : []).slice(0, 5).map((c: any) => sanitizeString(c, 100)).join(', ')}

Provide an editorial explanation structured as JSON:
{
  "explanation": "2-3 crisp paragraphs highlighting technical engineering, practical daily benefits, and alignment with the user's shopping style.",
  "valueVerdict": "1 sentence summarizing whether this represents optimal value or a justifiable splurge.",
  "keyTradeoff": "1 honest tradeoff to be aware of before purchasing."
}`;

    const raw = await callGemini(ai, prompt, true);
    const parsed = extractJson(raw);

    return res.json({
      explanation: parsed.explanation || 'Analyzed product specifications and verified user reviews.',
      valueVerdict: parsed.valueVerdict || '',
      keyTradeoff: parsed.keyTradeoff || '',
    });
  } catch (error: any) {
    console.error('Gemini explain product error:', error);
    return res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

// 4. Product Comparison
apiRouter.post('/compare', async (req, res) => {
  try {
    const { products, userContext } = req.body;
    if (!products || !Array.isArray(products) || products.length < 2) {
      return res.status(400).json({ error: 'At least 2 products required for comparison' });
    }

    if (products.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 products can be compared at once' });
    }

    const ai = getGeminiClient();
    const productDescriptions = products.map((p: any, idx: number) => 
      `Option ${idx + 1} (ID: ${sanitizeString(p.id, 50)}):\n- Title: ${sanitizeString(p.title, 100)}\n- Brand: ${sanitizeString(p.brand, 50)}\n- Price: ₹${sanitizeNumber(p.price)}\n- Rating: ${sanitizeNumber(p.rating, 0, 5)}/5\n- Specs: ${JSON.stringify(p.specs || {})}\n- Pros: ${(Array.isArray(p.pros) ? p.pros : []).slice(0, 4).map((x: any) => sanitizeString(x, 80)).join(', ')}\n- Considerations: ${(Array.isArray(p.considerations) ? p.considerations : []).slice(0, 4).map((x: any) => sanitizeString(x, 80)).join(', ')}`
    ).join('\n\n');

    const prompt = `Perform a rigorous, objective side-by-side technical comparison between these ${products.length} products:

${productDescriptions}

User Context:
- Target Budget: ${userContext?.budget ? `₹${sanitizeNumber(userContext.budget)}` : 'Flexible'}
- Shopping Style: ${sanitizeString(userContext?.shoppingStyle, 50) || 'Best Value'}

Evaluate build quality, specs, everyday ergonomics, and value-for-money.
Return pure JSON in this format:
{
  "summary": "A detailed 2-paragraph comparative analysis explaining how these options differ fundamentally.",
  "keyDifferences": [
    "Differentiator 1 regarding hardware/performance",
    "Differentiator 2 regarding usability or battery",
    "Differentiator 3 regarding price-to-feature value"
  ],
  "bestForWhom": {
    "${sanitizeString(products[0]?.title, 60)}": "Specific archetype of shopper who should pick this option",
    "${sanitizeString(products[1]?.title, 60)}": "Specific archetype of shopper who should pick this option"
  },
  "winnerId": "${sanitizeString(products[0]?.id, 50)}",
  "verdict": "Clear, decisive SmartCart verdict recommending the ideal option for the user's budget and style."
}`;

    const raw = await callGemini(ai, prompt, true);
    const parsed = extractJson(raw);

    return res.json({
      summary: parsed.summary || 'Side-by-side comparison evaluated.',
      keyDifferences: parsed.keyDifferences || [],
      bestForWhom: parsed.bestForWhom || {},
      winnerId: parsed.winnerId || products[0]?.id,
      verdict: parsed.verdict || 'Both products offer strong capabilities in their respective categories.',
    });
  } catch (error: any) {
    console.error('Gemini compare error:', error);
    return res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

// 5. Cart Optimization & Budget Optimization
apiRouter.post('/optimize-cart', async (req, res) => {
  try {
    const { cartItems, budget: rawBudget = 50000, shoppingStyle: rawStyle = 'Best Value' } = req.body;
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (cartItems.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 items allowed for cart optimization' });
    }

    const budget = sanitizeNumber(rawBudget, 100, 10000000, 50000);
    const shoppingStyle = sanitizeString(rawStyle, 50) || 'Best Value';

    const ai = getGeminiClient();
    const total = cartItems.reduce((acc: number, c: any) => acc + (sanitizeNumber(c?.price) * sanitizeNumber(c?.quantity, 1, 100, 1)), 0);
    const cartSummary = cartItems.map((c: any) => 
      `- ${sanitizeString(c.title, 80)} (${sanitizeString(c.category, 40)}, ${sanitizeString(c.brand, 40)}): ₹${sanitizeNumber(c.price)} x ${sanitizeNumber(c.quantity, 1, 100, 1)} = ₹${sanitizeNumber(c.price) * sanitizeNumber(c.quantity, 1, 100, 1)} [ID: ${sanitizeString(c.id, 50)}]`
    ).join('\n');

    const prompt = `You are SmartCart AI's Cart & Budget Optimization Engine.
Current Cart:
${cartSummary}
Total Cart Subtotal: ₹${total}
Target User Budget Ceiling: ₹${budget}
User Shopping Style: ${shoppingStyle}

Available Alternative Catalog for Swaps:
${CATALOG_SUMMARY}

Instructions:
1. Thoroughly audit this basket for overspending, duplicate categories, or suboptimal value picks.
2. Determine if the cart is "within", "near", or "over" the user's budget ceiling (₹${budget}).
3. Calculate realistic potential savings achievable by smart choices or catalog substitutions.
4. Provide specific actionable advice items in "recommendations".
5. If an item can be swapped with a better or cheaper alternative from the catalog, include it in "alternativeSuggestions".

Return pure JSON:
{
  "analysis": "A thorough paragraph analyzing the current basket composition and financial alignment with budget.",
  "suggestedSavings": 3500,
  "budgetStatus": "within",
  "recommendations": [
    {
      "title": "Clear concise title",
      "advice": "Actionable recommendation details",
      "type": "budget"
    }
  ],
  "alternativeSuggestions": [
    {
      "originalItemTitle": "Item in cart",
      "suggestedProductId": "catalog_id",
      "suggestedProductTitle": "Catalog item title",
      "reason": "Why this swap saves money or increases value",
      "estimatedSavings": 2000
    }
  ]
}`;

    const raw = await callGemini(ai, prompt, true);
    const parsed = extractJson(raw);

    return res.json({
      analysis: parsed.analysis || 'Cart analyzed against budget limits.',
      suggestedSavings: Number(parsed.suggestedSavings) || 0,
      budgetStatus: parsed.budgetStatus || (total > budget ? 'over' : 'within'),
      recommendations: parsed.recommendations || [],
      alternativeSuggestions: parsed.alternativeSuggestions || [],
    });
  } catch (error: any) {
    console.error('Gemini cart optimize error:', error);
    return res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

// 6. Alternative Suggestions for a Specific Product
apiRouter.post('/alternatives', async (req, res) => {
  try {
    const { product, budget: rawBudget, shoppingStyle: rawStyle = 'Best Value' } = req.body;
    if (!product || typeof product !== 'object' || !product.title) {
      return res.status(400).json({ error: 'Valid product object is required' });
    }

    const title = sanitizeString(product.title, 100);
    const brand = sanitizeString(product.brand, 50);
    const category = sanitizeString(product.category, 50);
    const price = sanitizeNumber(product.price);
    const budget = rawBudget ? sanitizeNumber(rawBudget) : null;
    const shoppingStyle = sanitizeString(rawStyle, 50) || 'Best Value';

    const ai = getGeminiClient();
    const prompt = `Suggest 1 to 2 alternatives from the catalog for this product:
Selected Product: ${title} (${brand}, ₹${price}, ${category})
Target User Budget: ${budget ? `₹${budget}` : 'Flexible'}
User Shopping Style: ${shoppingStyle}

Available Catalog:
${CATALOG_SUMMARY}

Identify catalog items in the same or related category that offer either better value, lower cost, or a compelling spec tradeoff.
Return JSON:
{
  "alternatives": [
    {
      "productId": "id from catalog",
      "reason": "Why this is a strong alternative",
      "priceDifference": 1500,
      "tradeOff": "What you gain or sacrifice"
    }
  ]
}`;

    const raw = await callGemini(ai, prompt, true);
    const parsed = extractJson(raw);
    const alternativesRaw: any[] = Array.isArray(parsed.alternatives) ? parsed.alternatives : [];
    
    // Attach full product objects
    const alternatives = alternativesRaw.map(alt => {
      const match = SEED_PRODUCTS.find(p => p.id === alt.productId);
      return {
        ...alt,
        product: match || null,
      };
    }).filter(alt => alt.product !== null && alt.product.id !== product.id);

    return res.json({ alternatives });
  } catch (error: any) {
    console.error('Gemini alternatives error:', error);
    return res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

// 7. Shopping List Generator
apiRouter.post('/generate-list', async (req, res) => {
  try {
    const { goal: rawGoal, budget: rawBudget = 50000, shoppingStyle: rawStyle = 'Best Value' } = req.body;
    if (!rawGoal || typeof rawGoal !== 'string' || !rawGoal.trim()) {
      return res.status(400).json({ error: 'A valid goal string is required' });
    }

    const goal = sanitizeString(rawGoal, 500);
    const budget = sanitizeNumber(rawBudget, 500, 10000000, 50000);
    const shoppingStyle = sanitizeString(rawStyle, 50) || 'Best Value';

    const ai = getGeminiClient();

    const prompt = `You are SmartCart AI. Create a complete, itemized shopping list for this setup/goal:
- Goal: "${goal}"
- Target Budget: ₹${budget}
- Shopping Style: ${shoppingStyle}

Available Catalog to draw from (prioritize these exact products where relevant, or suggest realistic market equivalents):
${CATALOG_SUMMARY}

Instructions:
1. Create a curated list of 4 to 6 items that together fulfill the user's goal within the ₹${budget} budget.
2. For each item provide realistic pricing, brand, quantity, and brief advice notes.
3. Return pure JSON:
{
  "name": "Concise creative name for the list (e.g. Minimalist WFH Coding Setup)",
  "description": "Short explanation of the curated kit",
  "estimatedTotal": 45000,
  "items": [
    {
      "title": "Exact product name",
      "brand": "Brand name",
      "price": 8999,
      "quantity": 1,
      "notes": "Why this specific item is included"
    }
  ]
}`;

    const raw = await callGemini(ai, prompt, true);
    const parsed = extractJson(raw);

    return res.json({
      name: parsed.name || goal,
      description: parsed.description || `Curated shopping list for ${goal}`,
      estimatedTotal: Number(parsed.estimatedTotal) || 0,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    });
  } catch (error: any) {
    console.error('Gemini generate list error:', error);
    return res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

// 8. Budget Insight for Dashboard Widget
apiRouter.post('/budget-insight', async (req, res) => {
  try {
    const currentTotal = sanitizeNumber(req.body?.currentTotal ?? req.body?.currentSpend, 0, 100000000, 0);
    const budget = sanitizeNumber(req.body?.budget, 100, 100000000, 50000);
    const shoppingStyle = sanitizeString(req.body?.shoppingStyle, 50) || 'Best Value';
    const itemCount = sanitizeNumber(req.body?.itemCount ?? req.body?.cartItemsCount, 0, 500, 0);

    const ai = getGeminiClient();

    const prompt = `You are SmartCart AI's Financial Guard.
The user has ${itemCount} items in their cart totaling ₹${currentTotal}.
Their budget ceiling is ₹${budget}.
Shopping Style: ${shoppingStyle}.

Generate a 1-2 sentence high-signal financial insight or advice about their spending pace and whether they have room for upgrades or need to trim items.
Return JSON:
{
  "headline": "Punchy 1-sentence insight on current cart spend pace.",
  "insight": "Punchy 1-sentence insight on current cart spend pace.",
  "tip": "Specific actionable financial advice.",
  "status": "safe" | "warning" | "exceeded"
}`;

    const raw = await callGemini(ai, prompt, true);
    const parsed = extractJson(raw);
    const textInsight = parsed.headline || parsed.insight || 'Keep your purchases aligned with your target budget.';

    return res.json({
      headline: textInsight,
      insight: textInsight,
      tip: parsed.tip || parsed.advice || null,
      status: parsed.status || (currentTotal > budget ? 'exceeded' : 'safe'),
    });
  } catch (error: any) {
    console.error('Gemini budget insight error:', error);
    return res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});
