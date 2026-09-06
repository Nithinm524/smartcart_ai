export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ShoppingStyle = 
  | 'Best Value' 
  | 'Budget Friendly' 
  | 'Premium' 
  | 'Performance First'
  | 'Premium Quality'
  | 'Budget Strict'
  | 'Sustainable';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface UserPreferences {
  currency: Currency;
  defaultBudget: number;
  preferredCategories: string[];
  preferredBrands: string[];
  shoppingStyle: ShoppingStyle;
  updatedAt?: string;
}

export interface ProductSpecs {
  [key: string]: string;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  description: string;
  specs: ProductSpecs;
  matchScore: number;
  featured?: boolean;
  inStock?: boolean;
  pros?: string[];
  considerations?: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  addedAt: string;
}

export interface SavedItem {
  id: string;
  productId: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  savedAt: string;
}

export interface ShoppingListItem {
  id: string;
  productId?: string;
  title: string;
  price: number;
  quantity: number;
  priority?: 'High' | 'Medium' | 'Low';
  purchased?: boolean;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  estimatedTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  query: string;
  summary: string;
  productsSelected?: string[];
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendedProducts?: Product[];
  extractedIntent?: {
    category?: string;
    budget?: number;
    preferredBrands?: string[];
    features?: string[];
    intendedUse?: string;
  };
  structuredRecommendation?: {
    productName: string;
    whyItMatches: string;
    specs: string;
    estimatedPrice: string;
    pros: string[];
    considerations: string[];
    action: string;
  }[];
}

export interface CartOptimizationResult {
  overview: string;
  totalSavings: number;
  suggestions: {
    type: 'cheaper_alternative' | 'redundant' | 'better_value' | 'budget_alert';
    title: string;
    description: string;
    potentialSavings: number;
    recommendedProduct?: Product;
    targetProductId?: string;
  }[];
}

export interface ProductComparisonResult {
  summary: string;
  winner: {
    productId: string;
    productTitle: string;
    reason: string;
  };
  metrics: {
    feature: string;
    scores: { [productId: string]: string | number };
  }[];
  verdict: string;
}
