import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Star, 
  ShoppingCart, 
  Heart, 
  Scale, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onNavigateToCompare?: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
  product, 
  onClose,
  onNavigateToCompare
}) => {
  const { 
    formatPrice, 
    addToCart, 
    toggleSaveItem, 
    isSaved, 
    addToCompare, 
    compareList, 
    preferences 
  } = useApp();

  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [valueVerdict, setValueVerdict] = useState<string>('');
  const [keyTradeoff, setKeyTradeoff] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Alternative suggestions from Gemini
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState<boolean>(false);
  const [alternativesError, setAlternativesError] = useState<string | null>(null);

  const fetchExplanation = async () => {
    if (!product) return;
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/explain-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          userPreference: preferences
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to get Gemini analysis');
      }
      setAiExplanation(data.explanation || '');
      setValueVerdict(data.valueVerdict || '');
      setKeyTradeoff(data.keyTradeoff || '');
    } catch (err: any) {
      setAiError(err.message || 'Unable to connect to Gemini AI.');
      setAiExplanation('');
    } finally {
      setLoadingAi(false);
    }
  };

  const fetchAlternatives = async () => {
    if (!product) return;
    setLoadingAlternatives(true);
    setAlternativesError(null);
    try {
      const res = await fetch('/api/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          budget: preferences.defaultBudget,
          shoppingStyle: preferences.shoppingStyle
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch alternatives');
      }
      setAlternatives(data.alternatives || []);
    } catch (err: any) {
      setAlternativesError(err.message || 'Failed to load alternatives');
      setAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  useEffect(() => {
    if (!product) return;
    fetchExplanation();
    fetchAlternatives();
  }, [product?.id, preferences.defaultBudget, preferences.shoppingStyle]);

  if (!product) return null;

  const saved = isSaved(product.id);
  const inCompare = compareList.some(p => p.id === product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-stone-200/90 rounded-[24px] shadow-2xl p-6 sm:p-8 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-[#F4F2EC] hover:bg-stone-200 flex items-center justify-center text-[#57534E] hover:text-[#18181B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Grid: Image + Core Info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Product Image Stage */}
          <div className="md:col-span-5 bg-[#F4F2EC] rounded-[18px] p-6 flex flex-col items-center justify-center relative border border-stone-200/60">
            <img 
              src={product.image} 
              alt={product.title}
              className="w-full max-h-72 object-contain mix-blend-multiply"
            />
            <div className="absolute top-4 left-4 bg-white/95 text-xs font-bold px-3 py-1 rounded-full text-[#1D4ED8] border border-blue-200/60 shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{product.matchScore}% Smart Match</span>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#1D4ED8] tracking-wider uppercase">{product.brand}</span>
                <span className="text-stone-300">•</span>
                <span className="text-xs text-[#57534E] bg-stone-100 px-2 py-0.5 rounded-md">{product.category}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#18181B] tracking-tight mb-3">
                {product.title}
              </h2>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-amber-900">{product.rating}</span>
                </div>
                <span className="text-xs text-[#57534E]">
                  ({product.reviewsCount.toLocaleString()} verified reviews)
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> In Stock
                </span>
              </div>

              {/* Price Block */}
              <div className="mb-6 p-4 rounded-2xl bg-[#F9F8F5] border border-stone-200/80">
                <span className="text-xs text-[#57534E] block mb-1">Optimized Price</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-[#18181B]">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-[#57534E] line-through font-medium">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Save {formatPrice(product.originalPrice - product.price)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-6">
                {product.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-stone-200/80">
              <button
                onClick={() => addToCart(product)}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#18181B] hover:bg-black text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={() => toggleSaveItem(product)}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-bold w-full sm:w-auto ${
                  saved 
                    ? 'border-rose-200 bg-rose-50 text-rose-600' 
                    : 'border-stone-200 hover:border-stone-300 text-[#18181B]'
                }`}
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500' : ''}`} />
                <span>{saved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={() => addToCompare(product)}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-bold w-full sm:w-auto ${
                  inCompare 
                    ? 'border-blue-200 bg-blue-50 text-[#1D4ED8]' 
                    : 'border-stone-200 hover:border-stone-300 text-[#18181B]'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>{inCompare ? 'In Compare' : 'Compare'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Explanation Section (Loading → Gemini request → AI response / Friendly error) */}
        <div className="p-6 bg-blue-50/60 border border-blue-200/70 rounded-[18px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#18181B] flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
              </div>
              <h3 className="text-xs font-bold text-[#1D4ED8] tracking-wider uppercase">
                Why SmartCart AI Recommends This
              </h3>
            </div>
            {!loadingAi && (
              <button
                onClick={fetchExplanation}
                title="Regenerate Gemini Analysis"
                className="text-xs text-[#1D4ED8] hover:text-[#1E40AF] flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh AI</span>
              </button>
            )}
          </div>

          {loadingAi ? (
            <div className="flex items-center gap-3 text-xs text-[#57534E] py-4 bg-white/70 rounded-xl px-4 border border-blue-100">
              <Loader2 className="w-4 h-4 animate-spin text-[#1D4ED8]" />
              <span>Analyzing product specifications and user budget with Gemini AI...</span>
            </div>
          ) : aiError ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Gemini AI Analysis Notice</p>
                  <p className="text-amber-800 mt-0.5">{aiError}</p>
                </div>
              </div>
              <button
                onClick={fetchExplanation}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg font-bold text-amber-900 shrink-0 text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-[#18181B] leading-relaxed whitespace-pre-line">
                {aiExplanation}
              </p>

              {valueVerdict && (
                <div className="p-3 bg-white/90 border border-blue-200 rounded-xl text-xs flex items-start gap-2">
                  <span className="font-bold text-[#1D4ED8] uppercase shrink-0">Verdict:</span>
                  <span className="text-[#18181B] font-medium">{valueVerdict}</span>
                </div>
              )}

              {keyTradeoff && (
                <div className="p-3 bg-white/90 border border-amber-200/80 rounded-xl text-xs flex items-start gap-2">
                  <span className="font-bold text-amber-800 uppercase shrink-0">Tradeoff:</span>
                  <span className="text-[#18181B]">{keyTradeoff}</span>
                </div>
              )}
            </div>
          )}

          {/* Pros & Considerations pills */}
          {product.pros && product.pros.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1.5">
                  Verified Strengths:
                </span>
                <ul className="space-y-1">
                  {product.pros.map((pro, i) => (
                    <li key={i} className="text-xs text-stone-700 flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {product.considerations && (
                <div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1.5">
                    Considerations:
                  </span>
                  <ul className="space-y-1">
                    {product.considerations.map((con, i) => (
                      <li key={i} className="text-xs text-stone-700 flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature 6: Gemini Alternative Suggestions */}
        <div className="p-6 bg-stone-50 border border-stone-200/80 rounded-[18px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#1D4ED8]" />
              <h3 className="text-xs font-bold text-[#18181B] tracking-wider uppercase">
                Gemini Alternative Suggestions
              </h3>
            </div>
            {loadingAlternatives && (
              <div className="flex items-center gap-1.5 text-xs text-[#57534E]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1D4ED8]" />
                <span>Evaluating catalog alternatives...</span>
              </div>
            )}
          </div>

          {alternativesError ? (
            <div className="text-xs text-[#57534E] flex items-center justify-between">
              <span>{alternativesError}</span>
              <button
                onClick={fetchAlternatives}
                className="text-[#1D4ED8] font-bold hover:underline"
              >
                Retry
              </button>
            </div>
          ) : alternatives.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {alternatives.map((alt: any, idx: number) => {
                const altProduct = alt.product;
                if (!altProduct) return null;
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#18181B] line-clamp-1">{altProduct.title}</span>
                        <span className="text-xs font-black text-[#1D4ED8]">{formatPrice(altProduct.price)}</span>
                      </div>
                      <p className="text-[11px] text-[#57534E] leading-relaxed mb-2">
                        {alt.reason}
                      </p>
                      {alt.tradeOff && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-md border border-amber-200/60 mb-2">
                          <strong>Tradeoff:</strong> {alt.tradeOff}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => {
                          addToCompare(altProduct);
                          addToCompare(product);
                          onClose();
                          if (onNavigateToCompare) onNavigateToCompare();
                        }}
                        className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-[#18181B] rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Scale className="w-3 h-3 text-[#1D4ED8]" />
                        <span>Compare Side-by-Side</span>
                      </button>
                      <button
                        onClick={() => addToCart(altProduct)}
                        className="py-1.5 px-3 bg-[#18181B] hover:bg-black text-white rounded-lg text-[11px] font-bold transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !loadingAlternatives ? (
            <p className="text-xs text-[#57534E]">
              This product stands out as the optimal choice in its class based on your budget and preferences.
            </p>
          ) : null}
        </div>

        {/* Specifications Table */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-[#18181B] mb-3">Key Technical Specifications</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between p-3 rounded-xl bg-[#F9F8F5] border border-stone-200/60">
                  <span className="text-[#57534E] font-medium">{key}</span>
                  <span className="text-[#18181B] font-semibold text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
