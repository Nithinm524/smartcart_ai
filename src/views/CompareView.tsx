import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { SEED_PRODUCTS } from '../data/seedProducts';
import { 
  Scale, 
  Trash2, 
  Plus, 
  Sparkles, 
  Check, 
  Star, 
  ShoppingCart, 
  ShieldAlert,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const CompareView: React.FC = () => {
  const { 
    compareList, 
    addToCompare,
    removeFromCompare, 
    clearCompare, 
    addToCart, 
    formatPrice, 
    preferences 
  } = useApp();

  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchComparison = async () => {
    if (compareList.length < 2) {
      setAiAnalysis(null);
      setAiError(null);
      return;
    }

    setLoadingAi(true);
    setAiError(null);
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: compareList,
          userContext: {
            budget: preferences.defaultBudget,
            shoppingStyle: preferences.shoppingStyle
          }
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to synthesize product comparison with Gemini AI');
      }
      setAiAnalysis(data);
    } catch (err: any) {
      setAiError(err.message || 'Unable to complete comparison with Gemini AI.');
      setAiAnalysis(null);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [compareList.length, preferences.defaultBudget, preferences.shoppingStyle]);

  // Available products to add to compare
  const availableToAdd = SEED_PRODUCTS.filter(
    (p) => !compareList.some((c) => c.id === p.id)
  );

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight flex items-center gap-2.5">
            <span>Product Comparison</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200/60">
              {compareList.length} / 3 Items
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E] mt-1">
            Side-by-side technical dissection and Gemini-powered decision synthesis
          </p>
        </div>

        {compareList.length > 0 && (
          <button
            onClick={clearCompare}
            className="text-xs font-semibold text-rose-500 hover:text-rose-700 self-start sm:self-auto transition-colors"
          >
            Clear Comparison Queue
          </button>
        )}
      </div>

      {/* Empty State */}
      {compareList.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-stone-300 p-12 text-center bg-white">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center mx-auto mb-4 border border-blue-200/60">
            <Scale className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#18181B] mb-2">Your Comparison Queue is Empty</h2>
          <p className="text-xs sm:text-sm text-[#57534E] max-w-md mx-auto mb-6">
            Add 2 or 3 items from the catalog to trigger deep Gemini spec comparison and trade-off analysis.
          </p>

          <div className="max-w-xl mx-auto">
            <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wider mb-3 text-left">Quick add suggestions:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableToAdd.slice(0, 4).map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-[#F9F8F5] text-left hover:border-stone-300 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={product.image} alt={product.title} className="w-10 h-10 object-contain mix-blend-multiply shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#18181B] truncate">{product.title}</p>
                      <p className="text-[11px] text-[#57534E]">{formatPrice(product.price)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (compareList.length < 3) {
                        addToCompare(product);
                      }
                    }}
                    title="Add to comparison"
                    className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-xs font-bold text-[#18181B] shrink-0 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1 Item prompt */}
      {compareList.length === 1 && (
        <div className="rounded-[18px] p-6 bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">Add at least one more item to generate comparison</p>
              <p className="text-[11px] text-amber-800 mt-0.5">Gemini requires 2 or 3 items to evaluate comparative advantages and value trade-offs.</p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      {compareList.length > 0 && (
        <div className={
          compareList.length === 1 
            ? 'grid grid-cols-1 gap-6 max-w-md mx-auto' 
            : compareList.length === 2 
            ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
            : 'grid grid-cols-1 md:grid-cols-3 gap-6'
        }>
          {compareList.map((product) => (
            <div 
              key={product.id}
              className="rounded-[20px] border border-stone-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] flex flex-col justify-between relative"
            >
              <button
                onClick={() => removeFromCompare(product.id)}
                className="absolute top-4 right-4 p-2 rounded-lg text-[#57534E] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove from comparison"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div>
                <div className="h-44 flex items-center justify-center p-4 bg-[#F9F8F5] rounded-xl mb-4 border border-stone-200/60">
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    className="max-h-full max-w-full object-contain mix-blend-multiply" 
                  />
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-wider">{product.brand}</span>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-[#18181B]">{product.rating}</span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-[#18181B] mb-2 line-clamp-2">{product.title}</h3>
                <p className="text-xl font-black text-[#18181B] mb-4">{formatPrice(product.price)}</p>

                {/* Specs list */}
                <div className="space-y-2 text-xs border-t border-stone-100 pt-3">
                  <span className="font-bold text-[11px] text-[#57534E] uppercase tracking-wider block">Key Specs</span>
                  {product.specs && Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-stone-50">
                      <span className="text-[#57534E]">{k}</span>
                      <span className="font-semibold text-[#18181B] text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => addToCart(product)}
                className="w-full mt-6 py-3 px-4 rounded-xl bg-[#18181B] hover:bg-black text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Select & Add to Cart</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI Comparison Analysis Report (Loading → Gemini request → AI response / Friendly error) */}
      {compareList.length >= 2 && (
        <div className="p-6 sm:p-8 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_12px_28px_-6px_rgba(24,24,27,0.05)] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#18181B] flex items-center justify-center text-white font-bold">
                <Sparkles className="w-4 h-4 text-[#60A5FA]" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#18181B]">
                  Gemini Side-by-Side Synthesis Verdict
                </h3>
                <p className="text-xs text-[#57534E]">Objective analytical breakdown of technical specifications, daily ergonomics, and budget alignment</p>
              </div>
            </div>
            {!loadingAi && (
              <button
                onClick={fetchComparison}
                className="text-xs font-bold text-[#1D4ED8] hover:text-[#1E40AF] flex items-center gap-1.5 transition-colors"
                title="Regenerate Gemini Comparison"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Synthesis</span>
              </button>
            )}
          </div>

          {loadingAi ? (
            <div className="flex items-center gap-3 p-6 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-[#57534E]">
              <Loader2 className="w-5 h-5 animate-spin text-[#1D4ED8]" />
              <span>Analyzing full component matrix with Gemini AI...</span>
            </div>
          ) : aiError ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Gemini Comparison Notice</p>
                  <p className="text-amber-800 mt-0.5">{aiError}</p>
                </div>
              </div>
              <button
                onClick={fetchComparison}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg font-bold text-amber-900 shrink-0 text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-4 text-xs sm:text-sm">
              <p className="text-[#18181B] leading-relaxed whitespace-pre-line">
                {aiAnalysis.summary}
              </p>

              {aiAnalysis.keyDifferences && aiAnalysis.keyDifferences.length > 0 && (
                <div className="p-4 rounded-xl bg-[#F9F8F5] border border-stone-200/80">
                  <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider mb-2">Key Differentiators:</h4>
                  <ul className="space-y-2 text-xs text-[#57534E]">
                    {aiAnalysis.keyDifferences.map((diff: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0 mt-0.5" />
                        <span className="text-[#18181B]">{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnalysis.bestForWhom && Object.keys(aiAnalysis.bestForWhom).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(aiAnalysis.bestForWhom).map(([title, desc]: [string, any]) => (
                    <div key={title} className="p-3.5 rounded-xl border border-stone-200/80 bg-white">
                      <span className="text-xs font-bold text-[#18181B] block mb-1">Ideal For: {title}</span>
                      <p className="text-[11px] text-[#57534E] leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {aiAnalysis.verdict && (
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs sm:text-sm">
                  <strong className="text-[#1D4ED8] block mb-1 uppercase tracking-wider text-[11px]">Final SmartCart Verdict:</strong>
                  <span className="text-[#18181B] leading-relaxed font-medium">{aiAnalysis.verdict}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
