import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BudgetProgressBar } from '../components/BudgetProgressBar';
import { SEED_PRODUCTS } from '../data/seedProducts';
import { 
  ShoppingBag, 
  Trash2, 
  Heart, 
  Plus, 
  Minus, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeftRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartViewProps {
  onNavigateToProducts: () => void;
  onNavigateToAssistant: (prompt: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({ 
  onNavigateToProducts, 
  onNavigateToAssistant 
}) => {
  const { 
    cart, 
    cartSubtotal, 
    updateCartQuantity, 
    removeFromCart, 
    saveForLater, 
    clearCart, 
    formatPrice, 
    preferences,
    showToast,
    addToCart
  } = useApp();

  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Trigger Gemini AI Cart Optimization
  const handleOptimizeCart = async () => {
    if (cart.length === 0) return;
    setOptimizing(true);
    setOptimizationError(null);
    try {
      const response = await fetch('/api/optimize-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          budget: preferences.defaultBudget,
          shoppingStyle: preferences.shoppingStyle,
          preferredCategories: preferences.preferredCategories
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to optimize cart with Gemini AI');
      }
      setOptimizationResult(data);
      showToast('SmartCart AI analyzed your cart', 'success');
    } catch (err: any) {
      setOptimizationError(err.message || 'Unable to connect to Gemini AI.');
      setOptimizationResult(null);
      showToast(err.message || 'Error running cart optimization', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  // Swap item based on Gemini alternative recommendation
  const handleSwapItem = (originalTitle: string, suggestedProductId: string) => {
    const originalItem = cart.find(c => c.title.toLowerCase().includes(originalTitle.toLowerCase()));
    const suggestedProduct = SEED_PRODUCTS.find(p => p.id === suggestedProductId);
    if (suggestedProduct) {
      if (originalItem) {
        removeFromCart(originalItem.id);
      }
      addToCart(suggestedProduct);
      showToast(`Swapped to ${suggestedProduct.title}`, 'success');
    }
  };

  // Checkout flow with confetti celebration
  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setTimeout(async () => {
      setIsCheckingOut(false);
      setOrderComplete(true);
      
      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }

      await clearCart();
    }, 1200);
  };

  if (orderComplete) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#18181B] tracking-tight">Order Placed Successfully!</h1>
          <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed max-w-md mx-auto">
            Your items are being secured across authorized retailers at the verified optimal rates. An itemized invoice has been queued.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setOrderComplete(false);
              onNavigateToProducts();
            }}
            className="w-full sm:w-auto px-6 py-3 bg-[#18181B] hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 text-[#57534E] flex items-center justify-center mx-auto border border-stone-200">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#18181B] tracking-tight">Your Cart is Empty</h1>
          <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed max-w-sm mx-auto">
            Explore high-rated catalog hardware or ask Gemini to compose an itemized shopping list matching your budget.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onNavigateToProducts}
            className="w-full sm:w-auto px-6 py-3 bg-[#18181B] hover:bg-black text-white rounded-xl font-bold text-xs transition-all shadow-xs"
          >
            Explore Catalog
          </button>
          <button
            onClick={() => onNavigateToAssistant('Recommend items for a productive workspace under ₹25,000')}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-stone-50 border border-stone-200 text-[#18181B] rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>Ask Gemini for Setup</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight flex items-center gap-2.5">
          <span>Shopping Cart</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-[#57534E] border border-stone-200">
            {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-1">
          Review basket items, verify budget boundaries, and run Gemini basket optimization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-3">
            {cart.map((item) => (
              <div 
                key={item.id}
                className="p-4 sm:p-5 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] flex flex-col sm:flex-row items-center gap-4 transition-all"
              >
                {/* Product Image */}
                <div className="w-20 h-20 bg-[#F9F8F5] rounded-xl p-2 flex items-center justify-center border border-stone-200/60 shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="max-h-full max-w-full object-contain mix-blend-multiply" 
                  />
                </div>

                {/* Details */}
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-wider">{item.brand}</span>
                  <h3 className="font-bold text-sm text-[#18181B] line-clamp-1">{item.title}</h3>
                  <p className="text-xs font-extrabold text-[#18181B] mt-1">
                    {formatPrice(item.price)}
                    {item.quantity > 1 && (
                      <span className="text-[#57534E] font-normal text-[11px] ml-1.5">
                        ({formatPrice(item.price * item.quantity)})
                      </span>
                    )}
                  </p>
                </div>

                {/* Actions & Quantity */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 p-1">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 flex items-center justify-center text-[#18181B] shadow-2xs transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#18181B]">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 flex items-center justify-center text-[#18181B] shadow-2xs transition-colors"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => saveForLater(item)}
                      title="Save for later"
                      className="p-2 rounded-xl text-[#57534E] hover:text-[#18181B] hover:bg-stone-100 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      title="Remove from cart"
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Optimization Error Notice */}
          {optimizationError && (
            <div className="p-4 rounded-[20px] bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Gemini Cart Optimization Notice</p>
                  <p className="text-amber-800 mt-0.5">{optimizationError}</p>
                </div>
              </div>
              <button
                onClick={handleOptimizeCart}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg font-bold text-amber-900 shrink-0 text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* AI Optimization Insight Panel (when available) */}
          {optimizationResult && (
            <div className="p-6 rounded-[20px] bg-[#F9F8F5] border border-stone-200/80 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#18181B] flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wide">
                    Gemini Cart Optimization Report
                  </h3>
                </div>
                {optimizationResult.suggestedSavings > 0 && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                    Potential Savings: {formatPrice(optimizationResult.suggestedSavings)}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#18181B] leading-relaxed">
                {optimizationResult.analysis}
              </p>

              {/* Actionable recommendations */}
              {optimizationResult.recommendations && optimizationResult.recommendations.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-[11px] font-bold text-[#57534E] uppercase tracking-wider">Recommendations:</h4>
                  {optimizationResult.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-stone-200/80 text-xs">
                      <strong className="text-[#1D4ED8] block mb-0.5">{rec.title}</strong>
                      <span className="text-[#57534E] leading-relaxed">{rec.advice}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Feature 6: Alternative Suggestions to Save Budget */}
              {optimizationResult.alternativeSuggestions && optimizationResult.alternativeSuggestions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-200/60">
                  <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Suggested Budget Alternatives:</span>
                  </h4>
                  {optimizationResult.alternativeSuggestions.map((alt: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-[#18181B] font-bold">
                          Swap "{alt.originalItemTitle}" → <span className="text-emerald-800">{alt.suggestedProductTitle || alt.suggestedProductId}</span>
                        </p>
                        <p className="text-[11px] text-[#57534E] mt-0.5">{alt.reason}</p>
                        {alt.estimatedSavings > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 mt-1 inline-block">
                            Saves ~{formatPrice(alt.estimatedSavings)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleSwapItem(alt.originalItemTitle, alt.suggestedProductId)}
                        className="px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-black text-white text-[11px] font-bold shrink-0 self-start sm:self-auto transition-colors"
                      >
                        Apply Swap
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary & Budget Guard */}
        <div className="lg:col-span-5 space-y-6">
          <BudgetProgressBar currentCartOnly />

          {/* Summary Card */}
          <div className="p-6 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] space-y-4">
            <h3 className="text-base font-bold text-[#18181B]">Cart Summary</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#57534E]">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#18181B]">{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-[#57534E]">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-[#57534E]">
                <span>Estimated Tax (Inclusive)</span>
                <span className="font-semibold text-[#18181B]">{formatPrice(Math.round(cartSubtotal * 0.05))}</span>
              </div>

              <div className="pt-3 border-t border-stone-200/80 flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#18181B]">Total Amount</span>
                <span className="text-xl font-extrabold text-[#18181B]">{formatPrice(cartSubtotal)}</span>
              </div>
            </div>

            {/* AI Optimization Trigger */}
            <button
              onClick={handleOptimizeCart}
              disabled={optimizing}
              className="w-full py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100/70 text-[#1D4ED8] border border-blue-200/80 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Cart with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Optimize Cart with AI</span>
                </>
              )}
            </button>

            {/* Primary Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 px-6 rounded-xl bg-[#18181B] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isCheckingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#57534E] pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct retail fulfillment • Price match protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
