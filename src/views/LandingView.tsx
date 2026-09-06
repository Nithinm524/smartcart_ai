import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  ArrowRight, 
  Scale, 
  Sliders, 
  CheckCircle2, 
  Shield, 
  Star, 
  ShoppingBag,
  TrendingDown,
  Cpu,
  Heart,
  ChevronRight
} from 'lucide-react';
import { SEED_PRODUCTS } from '../data/seedProducts';

interface LandingViewProps {
  onGetStarted: () => void;
  onOpenAssistant: (initialQuery?: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onOpenAssistant }) => {
  const { signInWithGoogle, user } = useApp();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const heroFeaturedProduct = SEED_PRODUCTS[0]; // Sony WH-1000XM5
  const heroSecondaryProduct = SEED_PRODUCTS[1]; // Keychron V1

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#18181B] flex flex-col selection:bg-[#1D4ED8]/10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F9F8F5]/90 backdrop-blur-md border-b border-stone-200/80 px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-xl bg-[#18181B] flex items-center justify-center text-white font-extrabold text-base shadow-xs">
            S
          </div>
          <span className="font-extrabold text-xl text-[#18181B] tracking-tight">
            SmartCart <span className="text-[#1D4ED8]">AI</span>
          </span>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#57534E]">
          <a href="#hero" className="text-[#18181B] hover:text-[#1D4ED8] transition-colors">Home</a>
          <a href="#features" className="hover:text-[#18181B] transition-colors">Capabilities</a>
          <a href="#assistant-preview" className="hover:text-[#18181B] transition-colors">AI Assistant</a>
          <a href="#cta" className="hover:text-[#18181B] transition-colors">Get Started</a>
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#18181B] text-white hover:bg-black transition-all shadow-xs"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={signInWithGoogle}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#18181B] hover:bg-stone-200/60 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={signInWithGoogle}
                className="bg-[#18181B] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="px-6 lg:px-12 pt-12 pb-20 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#1D4ED8] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intelligent Shopping Assistant</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#18181B] tracking-tight leading-[1.08]">
              Shop smarter.<br />
              <span className="text-[#1D4ED8]">
                Let AI build the cart.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#57534E] leading-relaxed max-w-xl">
              SmartCart AI understands what you need, finds the right options, compares your choices, and helps you stay comfortably within budget.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onGetStarted}
                className="px-7 py-3.5 rounded-xl font-bold text-sm bg-[#1D4ED8] hover:bg-[#1E40AF] text-white flex items-center gap-2 shadow-xs transition-all active:scale-[0.98]"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4 text-blue-200" />
              </button>

              <button
                onClick={() => onOpenAssistant('Find me the best tech desk setup under ₹50,000')}
                className="px-7 py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-stone-50 text-[#18181B] border border-stone-200/90 flex items-center gap-2 shadow-2xs transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
                <span>Ask SmartCart AI</span>
              </button>
            </div>

            {/* Micro proof badges */}
            <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-[#57534E]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1D4ED8]" />
                <span>Verified Spec Evaluations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1D4ED8]" />
                <span>Active Budget Guardian</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Interactive Visual Dashboard Preview */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-[24px] p-6 border border-stone-200/80 shadow-[0_1px_3px_rgba(24,24,27,0.03),0_16px_36px_-6px_rgba(24,24,27,0.06)] bg-white">
              
              {/* Header preview inside stage */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                  <span className="text-[11px] font-bold text-[#57534E] ml-2">SmartCart AI Neural Engine</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  LIVE SESSION
                </span>
              </div>

              {/* Floating Product Card 1: Sony Headphones */}
              <div className="p-4 rounded-xl mb-3 flex items-center gap-4 bg-[#F9F8F5] border border-stone-200/70">
                <div className="w-16 h-16 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-stone-200/60">
                  <img 
                    src={heroFeaturedProduct.image} 
                    alt="Headphones" 
                    className="w-full h-full object-contain rounded-lg mix-blend-multiply" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      98% MATCH
                    </span>
                    <span className="text-[10px] text-[#57534E] font-semibold">{heroFeaturedProduct.brand}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#18181B] truncate">{heroFeaturedProduct.title}</h4>
                  <p className="text-xs font-extrabold text-[#18181B]">₹{heroFeaturedProduct.price.toLocaleString()}</p>
                </div>
                <span className="text-[11px] font-bold text-[#1D4ED8] bg-blue-50 px-3 py-1.5 rounded-full shrink-0 border border-blue-200/60">
                  In Cart
                </span>
              </div>

              {/* Live AI Optimization Suggestion Pill */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 mb-3 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#1D4ED8] text-[11px] uppercase tracking-wider">AI Budget Optimizer</p>
                  <p className="text-[#18181B] text-[11px] leading-snug">
                    "Switching from stock wireless accessories saved <strong>₹3,200</strong>. Your setup is <strong>₹17,600 under budget</strong>."
                  </p>
                </div>
              </div>

              {/* Mini Budget Bar Preview */}
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 text-xs">
                <div className="flex justify-between font-semibold text-[11px] text-[#57534E] mb-1.5">
                  <span>Cart Allocation</span>
                  <span className="text-[#18181B] font-bold">₹32,400 / ₹50,000</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1D4ED8] rounded-full w-[64%]" />
                </div>
              </div>

              {/* Floating aesthetic badge */}
              <div className="absolute -bottom-4 -right-4 bg-white p-3.5 rounded-xl shadow-lg border border-stone-200/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-200">
                  ✓
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#18181B]">Verified Cart</p>
                  <p className="text-[10px] text-[#57534E]">Optimized with Gemini</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Feature Cards */}
      <section id="features" className="px-6 lg:px-12 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-[#18181B] mb-3 tracking-tight">Designed for Intentional Buying</h2>
          <p className="text-sm text-[#57534E]">
            No bloated sponsored ad slots. No hidden markups. Pure, mathematical shopping intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#F4F2EC] text-[#1D4ED8] flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#18181B] mb-2">AI Recommendations</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                SmartCart AI parses your natural language criteria, preferred brands, and strict specs to discover the optimal matches from trusted catalogs.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#F4F2EC] text-[#1D4ED8] flex items-center justify-center mb-6">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#18181B] mb-2">Smart Comparisons</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Side-by-side matrices dissecting battery endurance, raw compute, acoustic profiles, and ergonomics—with a natural language synthesis verdict.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#F4F2EC] text-[#1D4ED8] flex items-center justify-center mb-6">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#18181B] mb-2">Budget Control</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Visual budget gauges monitor your target allocation in real-time, highlighting duplicate purchases, lower-cost identical components, and bundling savings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Your Personal AI Shopping Assistant (Chat Demo showcase) */}
      <section id="assistant-preview" className="px-6 lg:px-12 py-20 bg-[#F4F2EC]/60 border-y border-stone-200/80">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8] block mb-2">
              Conversational Engine
            </span>
            <h2 className="text-3xl font-extrabold text-[#18181B] tracking-tight">Your personal AI shopping assistant</h2>
            <p className="text-sm text-[#57534E] mt-2">
              Speak to SmartCart AI exactly as you would to a trusted advisor who knows hardware inside and out.
            </p>
          </div>

          {/* Interactive Chat Dialogue Mockup */}
          <div className="p-6 sm:p-8 rounded-[20px] border border-stone-200/80 shadow-[0_1px_3px_rgba(24,24,27,0.03),0_12px_28px_-6px_rgba(24,24,27,0.05)] bg-white">
            {/* User prompt message */}
            <div className="flex justify-end mb-6">
              <div className="bg-[#18181B] text-white px-5 py-3 rounded-2xl rounded-tr-xs max-w-md text-sm shadow-xs font-medium">
                "I need wireless headphones under ₹5,000 with good battery life."
              </div>
            </div>

            {/* AI Assistant reply */}
            <div className="flex items-start gap-3.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-[#18181B] flex items-center justify-center text-white shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-[#60A5FA]" />
              </div>
              <div className="bg-[#F9F8F5] border border-stone-200/80 text-[#18181B] p-5 rounded-2xl rounded-tl-xs max-w-2xl text-sm leading-relaxed space-y-3">
                <p>
                  "Based on your budget and requirements, these are the strongest options. I prioritized battery life, comfort, sound quality, and overall value."
                </p>

                {/* Recommended Product Cards Underneath */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-white rounded-xl border border-stone-200/80 flex items-center gap-3">
                    <img 
                      src={SEED_PRODUCTS[6].image} 
                      alt="OnePlus Nord Buds 2" 
                      className="w-12 h-12 rounded-xl object-contain mix-blend-multiply" 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#18181B] truncate">OnePlus Nord Buds 2</p>
                      <p className="text-xs font-extrabold text-[#18181B]">₹2,999</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">36h Total Battery • 25dB ANC</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-stone-200/80 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#1D4ED8] font-bold text-xs shrink-0 border border-blue-200/60">
                      +1 Option
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#18181B] truncate">Explore Audio Alternatives</p>
                      <button 
                        onClick={() => onOpenAssistant('Show me all audio options under ₹5,000')}
                        className="text-[11px] font-bold text-[#1D4ED8] hover:underline"
                      >
                        Ask Gemini Now →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated chat input */}
            <div className="pt-4 border-t border-stone-100 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="Try: laptop for coding under ₹70,000"
                className="flex-1 bg-[#F4F2EC] px-5 py-3 rounded-xl text-xs text-[#57534E] outline-none cursor-pointer hover:bg-stone-200/70 transition-colors border border-stone-200/60"
                onClick={() => onOpenAssistant('laptop for coding under ₹70,000')}
              />
              <button
                onClick={() => onOpenAssistant('laptop for coding under ₹70,000')}
                className="bg-[#18181B] hover:bg-black text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs"
              >
                Ask SmartCart AI
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section: "Ready to build a smarter cart?" */}
      <section id="cta" className="px-6 lg:px-12 py-20 max-w-5xl mx-auto w-full text-center">
        <div className="p-10 sm:p-14 rounded-[24px] border border-stone-200/80 shadow-[0_1px_3px_rgba(24,24,27,0.03),0_12px_28px_-6px_rgba(24,24,27,0.05)] relative overflow-hidden bg-white">
          <div className="w-14 h-14 rounded-2xl bg-[#18181B] text-white mx-auto mb-6 flex items-center justify-center shadow-xs">
            <Sparkles className="w-7 h-7 text-[#60A5FA]" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#18181B] mb-4 tracking-tight">
            Ready to build a smarter cart?
          </h2>

          <p className="text-sm sm:text-base text-[#57534E] max-w-xl mx-auto mb-8 leading-relaxed">
            Join smart shoppers using AI to make high-confidence purchase decisions while staying comfortably within budget.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-8 py-3.5 rounded-xl font-bold text-sm bg-[#18181B] hover:bg-black text-white shadow-xs hover:shadow-sm transition-all active:scale-[0.98]"
            >
              Get Started
            </button>
            <button
              onClick={signInWithGoogle}
              className="px-8 py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-stone-50 text-[#18181B] border border-stone-200/90 transition-all shadow-2xs"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/80 bg-white/90 py-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#18181B] flex items-center justify-center text-white font-black text-xs">
              S
            </div>
            <span className="font-extrabold text-sm text-[#18181B]">SmartCart AI</span>
            <span className="text-xs text-[#57534E] ml-2">© 2026 Intelligent Commerce</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-[#57534E]">
            <a href="#hero" className="hover:text-[#18181B]">SmartCart AI</a>
            <a href="#hero" className="hover:text-[#18181B]">Privacy</a>
            <a href="#hero" className="hover:text-[#18181B]">Terms</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#18181B]">GitHub</a>
            <a href="#hero" className="hover:text-[#18181B]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
