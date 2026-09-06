import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { BudgetProgressBar } from '../components/BudgetProgressBar';
import { Product } from '../types';
import { SEED_PRODUCTS } from '../data/seedProducts';
import { 
  Sparkles, 
  ArrowRight, 
  Heart, 
  Scale, 
  Search, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Gamepad2, 
  Headphones, 
  GraduationCap, 
  X, 
  Check
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onAskAi: (prompt: string) => void;
}

const DEMO_PROMPTS = [
  {
    id: 'gaming-laptop',
    title: 'Gaming laptop under ₹80,000',
    budget: 'Under ₹80,000',
    category: 'Laptops',
    description: 'High-FPS gaming, RTX 4050 6GB GPU & 144Hz IPS display',
    icon: Gamepad2,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
  },
  {
    id: 'best-headphones',
    title: 'Best headphones under ₹5,000',
    budget: 'Under ₹5,000',
    category: 'Audio',
    description: 'Hybrid Active Noise Cancellation & 40-hour battery life',
    icon: Headphones,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/70',
  },
  {
    id: 'college-essentials',
    title: 'College essentials under ₹10,000',
    budget: 'Under ₹10,000',
    category: 'Student Setup',
    description: 'Silent multi-device keyboard, mouse & student audio',
    icon: GraduationCap,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onAskAi }) => {
  const { user, cart, cartSubtotal, savedItems, compareList, preferences, formatPrice } = useApp();
  const [searchInput, setSearchInput] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // First-Time Demo Experience state
  const [showDemoExperience, setShowDemoExperience] = useState<boolean>(() => {
    return localStorage.getItem('smartcart_demo_dismissed') !== 'true';
  });
  const [selectedDemoPrompt, setSelectedDemoPrompt] = useState<string | null>(null);

  // Live Gemini Budget Insight
  const [budgetInsight, setBudgetInsight] = useState<any>(null);
  const [loadingBudgetInsight, setLoadingBudgetInsight] = useState(false);
  const [budgetInsightError, setBudgetInsightError] = useState<string | null>(null);

  // Live Gemini Personalized Recommendations
  const [personalizedProducts, setPersonalizedProducts] = useState<Product[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onAskAi(searchInput.trim());
  };

  const handleSelectDemoPrompt = (promptText: string, instantSubmit = false) => {
    setSearchInput(promptText);
    setSelectedDemoPrompt(promptText);
    if (instantSubmit) {
      onAskAi(promptText);
    } else {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  };

  const dismissDemo = () => {
    setShowDemoExperience(false);
    localStorage.setItem('smartcart_demo_dismissed', 'true');
  };

  const replayDemo = () => {
    setShowDemoExperience(true);
    localStorage.removeItem('smartcart_demo_dismissed');
  };

  // Fetch live budget insight from Gemini
  const fetchBudgetInsight = async () => {
    setLoadingBudgetInsight(true);
    setBudgetInsightError(null);
    try {
      const res = await fetch('/api/budget-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSpend: cartSubtotal,
          currentTotal: cartSubtotal,
          budget: preferences.defaultBudget,
          shoppingStyle: preferences.shoppingStyle,
          cartItemsCount: cart.length,
          itemCount: cart.length
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch Gemini budget insight');
      }
      setBudgetInsight(data);
    } catch (err: any) {
      setBudgetInsightError(err.message || 'Unable to load budget insight');
      setBudgetInsight(null);
    } finally {
      setLoadingBudgetInsight(false);
    }
  };

  // Fetch personalized recommendations from Gemini
  const fetchPersonalizedRecommendations = async () => {
    setLoadingRecommendations(true);
    setRecommendationsError(null);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPreferences: preferences,
          currentCart: cart,
          savedCount: savedItems.length
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to load Gemini recommendations');
      }
      if (data.recommendations && data.recommendations.length > 0) {
        setPersonalizedProducts(data.recommendations);
      } else {
        setPersonalizedProducts(SEED_PRODUCTS.slice(0, 4));
      }
    } catch (err: any) {
      setRecommendationsError(err.message || 'Unable to fetch personalized recommendations');
      // Graceful fallback to initial seed products so page remains navigable
      setPersonalizedProducts(SEED_PRODUCTS.slice(0, 4));
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchPersonalizedRecommendations();
    const timer = setTimeout(() => {
      fetchBudgetInsight();
    }, 1200);
    return () => clearTimeout(timer);
  }, [preferences.defaultBudget, preferences.shoppingStyle, cart.length, cartSubtotal]);

  return (
    <div className="space-y-8 pb-16">
      {/* Short Welcome Section: First-Time Demo Experience for SmartCart AI */}
      {showDemoExperience ? (
        <section className="relative overflow-hidden rounded-[24px] border border-blue-200/90 bg-gradient-to-br from-white via-[#FCFBF8] to-blue-50/50 p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.08),0_1px_3px_rgba(24,24,27,0.04)] transition-all">
          {/* Subtle decorative background gradient orbs */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top meta bar */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200/80 text-[#1D4ED8] text-xs font-bold tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#1D4ED8] animate-pulse" />
              <span>First-Time Demo Experience</span>
              <span className="text-stone-300 font-normal">|</span>
              <span className="text-blue-900/80 font-semibold">Hackathon Interactive Tour</span>
            </div>

            <button
              onClick={dismissDemo}
              className="text-xs text-[#57534E] hover:text-[#18181B] font-semibold px-2.5 py-1 rounded-lg hover:bg-stone-100/80 transition-colors flex items-center gap-1 cursor-pointer"
              title="Dismiss demo experience"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dismiss</span>
            </button>
          </div>

          {/* Exact Required Title & Subtitle */}
          <div className="max-w-2xl mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight mb-2 flex items-center gap-2.5">
              <span>Welcome to SmartCart AI</span>
              <Sparkles className="w-6 h-6 text-[#1D4ED8] inline-block shrink-0" />
            </h2>
            <p className="text-base sm:text-lg text-[#57534E] font-medium leading-relaxed">
              Tell me what you're shopping for and I'll help you build the right cart.
            </p>
          </div>

          {/* Three Clickable Example Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {DEMO_PROMPTS.map((item) => {
              const Icon = item.icon;
              const isSelected = searchInput === item.title;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectDemoPrompt(item.title, false)}
                  className={`group relative text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20 shadow-md'
                      : 'bg-white hover:bg-stone-50/80 border-stone-200/90 shadow-2xs hover:shadow-xs hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Header: Icon + Budget Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isSelected ? 'bg-[#1D4ED8] text-white' : 'bg-stone-100 text-[#18181B]'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                        {item.budget}
                      </span>
                    </div>

                    {/* Exact Clickable Prompt Text */}
                    <h3 className="text-sm font-bold text-[#18181B] mb-1.5 group-hover:text-[#1D4ED8] transition-colors leading-snug">
                      "{item.title}"
                    </h3>

                    <p className="text-xs text-[#57534E] leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs">
                    {isSelected ? (
                      <>
                        <span className="flex items-center gap-1 font-bold text-[#1D4ED8]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Placed in AI Input</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskAi(item.title);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#1D4ED8] hover:bg-blue-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          <span>Submit to Gemini</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[#57534E] group-hover:text-[#18181B] font-semibold transition-colors">
                          Click to load prompt
                        </span>
                        <span className="text-stone-400 group-hover:text-[#1D4ED8] group-hover:translate-x-0.5 transition-all">
                          ↓
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Status Tip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200/60 text-xs text-[#57534E]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1D4ED8] shrink-0" />
              <span>
                {searchInput.trim() ? (
                  <span>
                    Prompt ready: <strong className="text-[#18181B]">"{searchInput}"</strong>. Click <strong>Ask SmartCart</strong> or press Enter to generate with live Gemini.
                  </span>
                ) : (
                  <span>
                    Click any example above to automatically populate the AI input, or type your custom shopping request.
                  </span>
                )}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
              ✓ 100% Genuine Gemini API
            </div>
          </div>
        </section>
      ) : (
        /* Minimized banner when dismissed - allows replaying anytime for hackathon presentation */
        <div className="flex items-center justify-between bg-blue-50/60 border border-blue-200/70 px-4 py-2.5 rounded-2xl text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-semibold">
            <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
            <span>Welcome to SmartCart AI — Ready to build your cart with Gemini.</span>
          </div>
          <button
            onClick={replayDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-stone-50 text-[#1D4ED8] font-bold border border-blue-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <span>✨ Replay First-Time Demo</span>
          </button>
        </div>
      )}

      {/* Greeting & Hero Search Banner */}
      <section className="relative pt-2">
        <div className="flex items-center justify-between gap-4 mb-2">
          <p className="text-xs font-bold text-[#57534E] uppercase tracking-wider">
            {getGreeting()}, {user?.displayName ? user.displayName.split(' ')[0] : 'Shopper'}
          </p>
          {!showDemoExperience && (
            <button
              onClick={replayDemo}
              className="text-xs font-bold text-[#1D4ED8] hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Show Demo Prompts</span>
            </button>
          )}
        </div>

        <h1 className="clamp-hero text-[#18181B] mb-3 tracking-tight">
          Shop smarter. Let AI<br />
          <span className="text-[#1D4ED8]">
            build your cart.
          </span>
        </h1>

        <p className="text-sm text-[#57534E] mb-8 max-w-xl leading-relaxed">
          Tell Gemini your budget ceiling, intended use, or specific brands. Receive instant verified product setups and price comparisons.
        </p>

        {/* Large AI Search Input Box */}
        <form 
          onSubmit={handleSearchSubmit}
          className="relative max-w-2xl"
        >
          <div className={`relative bg-white rounded-[20px] border p-2 flex items-center transition-all ${
            searchInput 
              ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20 shadow-[0_4px_16px_rgba(29,78,216,0.08)]' 
              : 'border-stone-200/90 shadow-[0_2px_8px_rgba(24,24,27,0.04),0_12px_28px_-6px_rgba(24,24,27,0.06)] focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/15'
          }`}>
            <Search className={`w-5 h-5 ml-3.5 shrink-0 transition-colors ${searchInput ? 'text-[#1D4ED8]' : 'text-[#57534E]'}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. Gaming laptop under ₹80,000 or Best headphones under ₹5,000"
              className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-sm sm:text-base text-[#18181B] placeholder:text-[#57534E]/60 font-medium"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSelectedDemoPrompt(null); }}
                className="text-stone-400 hover:text-stone-600 p-2 mr-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="bg-[#18181B] hover:bg-black text-white px-6 sm:px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#60A5FA]" />
              <span>Ask SmartCart</span>
            </button>
          </div>
          {searchInput && (
            <div className="flex items-center justify-between text-xs text-[#57534E] mt-2 px-2">
              <span className="flex items-center gap-1 text-[#1D4ED8] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Prompt loaded! Click "Ask SmartCart" or press Enter to generate with Gemini.
              </span>
              <span className="text-[11px] text-stone-400 hidden sm:inline flex items-center gap-1">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 font-mono text-[10px]">Enter ↵</kbd>
              </span>
            </div>
          )}
        </form>

        {/* Quick query suggestion chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-[#57534E]">
          <span className="font-bold text-[#18181B]">Popular:</span>
          <button
            type="button"
            onClick={() => handleSelectDemoPrompt('Best headphones under ₹5,000', false)}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200/80 transition-colors text-xs font-semibold text-[#18181B] shadow-2xs cursor-pointer"
          >
            "Best headphones under ₹5,000"
          </button>
          <button
            type="button"
            onClick={() => handleSelectDemoPrompt('Gaming laptop under ₹80,000', false)}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200/80 transition-colors text-xs font-semibold text-[#18181B] shadow-2xs cursor-pointer"
          >
            "Gaming laptop under ₹80,000"
          </button>
          <button
            type="button"
            onClick={() => handleSelectDemoPrompt('College essentials under ₹10,000', false)}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200/80 transition-colors text-xs font-semibold text-[#18181B] shadow-2xs cursor-pointer"
          >
            "College essentials under ₹10,000"
          </button>
        </div>
      </section>

      {/* Main Grid: Products + Side Dashboard Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
        {/* Left Column: AI Smart Recommendations */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#18181B] tracking-tight flex items-center gap-2.5">
                <span>Personalized Recommendations</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200/60 uppercase">
                  Gemini Grounded
                </span>
              </h2>
              <p className="text-xs text-[#57534E] mt-0.5">Customized for your "{preferences.shoppingStyle}" shopping profile</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchPersonalizedRecommendations}
                disabled={loadingRecommendations}
                title="Refresh Gemini Recommendations"
                className="p-2 text-stone-500 hover:text-[#1D4ED8] rounded-lg hover:bg-stone-100 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRecommendations ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs font-bold text-[#1D4ED8] hover:text-[#1E40AF] flex items-center gap-1 group"
              >
                <span>Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {loadingRecommendations ? (
            <div className="p-12 text-center bg-white rounded-[20px] border border-stone-200/80">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D4ED8] mx-auto mb-2" />
              <p className="text-xs text-[#57534E]">Gemini is selecting personalized products matching your profile...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {personalizedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Budget Control & Smart Context */}
        <div className="lg:col-span-4 space-y-6">
          {/* Budget Widget */}
          <div className="rounded-[20px] p-6 border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm text-[#18181B]">Financial Control</h3>
                <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                  ACTIVE GUARD
                </span>
              </div>

              <BudgetProgressBar />

              {/* Live Gemini Optimization Insight Callout */}
              <div className="p-4 bg-[#F9F8F5] rounded-[16px] border border-stone-200/80 mt-5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini Optimization Insight</span>
                  </div>
                  {!loadingBudgetInsight && (
                    <button
                      onClick={fetchBudgetInsight}
                      className="text-[10px] text-stone-400 hover:text-[#1D4ED8]"
                      title="Refresh Insight"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {loadingBudgetInsight ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-[#57534E]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1D4ED8]" />
                    <span>Analyzing budget pacing with Gemini...</span>
                  </div>
                ) : budgetInsightError ? (
                  <div className="text-xs text-amber-800 flex items-start gap-1.5 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{budgetInsightError}</p>
                      <button onClick={fetchBudgetInsight} className="text-[#1D4ED8] font-bold hover:underline mt-1">
                        Retry
                      </button>
                    </div>
                  </div>
                ) : budgetInsight ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs leading-relaxed text-[#18181B]">
                      {budgetInsight.headline || budgetInsight.insight}
                    </p>
                    {budgetInsight.tip && (
                      <p className="text-[11px] text-[#57534E] leading-normal pt-1 border-t border-stone-200/60">
                        <strong>Advice:</strong> {budgetInsight.tip}
                      </p>
                    )}
                    {budgetInsight.savingsOpportunity && (
                      <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {budgetInsight.savingsOpportunity}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <button
              onClick={() => onNavigate('cart')}
              className="w-full py-3.5 mt-5 bg-[#18181B] hover:bg-black text-white rounded-xl font-bold text-xs transition-all shadow-xs"
            >
              Review & Optimize Cart ({cart.length} items)
            </button>
          </div>

          {/* Quick Shortcuts Bento */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => onNavigate('saved')}
              className="rounded-[20px] p-5 bg-white border border-stone-200/80 text-left hover:border-stone-300 shadow-2xs hover:shadow-xs transition-all group"
            >
              <Heart className="w-5 h-5 text-rose-500 mb-2.5 group-hover:scale-105 transition-transform" />
              <p className="text-xs font-bold text-[#18181B]">Saved Items</p>
              <p className="text-[11px] text-[#57534E] mt-0.5">{savedItems.length} items saved</p>
            </button>

            <button
              onClick={() => onNavigate('compare')}
              className="rounded-[20px] p-5 bg-white border border-stone-200/80 text-left hover:border-stone-300 shadow-2xs hover:shadow-xs transition-all group"
            >
              <Scale className="w-5 h-5 text-[#1D4ED8] mb-2.5 group-hover:scale-105 transition-transform" />
              <p className="text-xs font-bold text-[#18181B]">Compare</p>
              <p className="text-[11px] text-[#57534E] mt-0.5">{compareList.length} in queue</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
