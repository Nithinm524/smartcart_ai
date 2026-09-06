import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Currency, ShoppingStyle } from '../types';
import { CATEGORIES, BRANDS } from '../data/seedProducts';
import { 
  Wallet, 
  Sliders, 
  Save, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, preferences, updatePreferences, logout, showToast } = useApp();

  const [currency, setCurrency] = useState<Currency>(preferences.currency || 'INR');
  const [budget, setBudget] = useState<number>(preferences.defaultBudget || 50000);
  const [shoppingStyle, setShoppingStyle] = useState<ShoppingStyle>(preferences.shoppingStyle || 'Best Value');
  const [categories, setCategories] = useState<string[]>(preferences.preferredCategories || ['Audio', 'Laptops', 'Workspace']);
  const [brands, setBrands] = useState<string[]>(preferences.preferredBrands || ['Sony', 'Apple', 'Keychron', 'Logitech']);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (preferences) {
      if (preferences.currency) setCurrency(preferences.currency);
      if (preferences.defaultBudget) setBudget(preferences.defaultBudget);
      if (preferences.shoppingStyle) setShoppingStyle(preferences.shoppingStyle);
      if (preferences.preferredCategories) setCategories(preferences.preferredCategories);
      if (preferences.preferredBrands) setBrands(preferences.preferredBrands);
    }
  }, [preferences]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePreferences({
        currency,
        defaultBudget: Number(budget),
        shoppingStyle,
        preferredCategories: categories,
        preferredBrands: brands
      });
      showToast('Settings saved successfully', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleBrand = (brand: string) => {
    setBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
          Shopping Preferences & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-1">
          Tune the parameters Gemini uses when evaluating products and recommending alternatives
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Budget & Currency */}
        <div className="p-6 sm:p-8 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
            <Wallet className="w-5 h-5 text-[#1D4ED8]" />
            <h3 className="font-bold text-sm sm:text-base text-[#18181B]">Budget & Currency</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-bold text-[#18181B] block mb-1.5">Default Target Budget</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                step={1000}
                min={5000}
                className="w-full px-4 py-2.5 bg-[#F4F2EC] rounded-xl outline-none font-bold text-[#18181B] border border-stone-200/60 focus:border-[#1D4ED8] focus:bg-white transition-all"
              />
              <p className="text-[11px] text-[#57534E] mt-1">SmartCart AI warns you whenever cart allocation nears this threshold.</p>
            </div>

            <div>
              <label className="font-bold text-[#18181B] block mb-1.5">Display Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-4 py-2.5 bg-[#F4F2EC] rounded-xl outline-none font-bold text-[#18181B] border border-stone-200/60 focus:border-[#1D4ED8] focus:bg-white transition-all cursor-pointer"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Shopping Style Persona */}
        <div className="p-6 sm:p-8 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
            <Sliders className="w-5 h-5 text-[#1D4ED8]" />
            <h3 className="font-bold text-sm sm:text-base text-[#18181B]">Recommendation Tuning & Style</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(['Best Value', 'Premium Quality', 'Budget Strict', 'Sustainable'] as ShoppingStyle[]).map((style) => {
              const selected = shoppingStyle === style;
              return (
                <div
                  key={style}
                  onClick={() => setShoppingStyle(style)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all text-left ${
                    selected 
                      ? 'bg-blue-50/80 border-[#1D4ED8] shadow-2xs' 
                      : 'bg-[#F9F8F5] border-stone-200/80 hover:bg-[#F4F2EC]'
                  }`}
                >
                  <p className={`text-xs font-bold mb-1 ${selected ? 'text-[#1D4ED8]' : 'text-[#18181B]'}`}>
                    {style}
                  </p>
                  <p className="text-[10px] text-[#57534E] leading-tight">
                    {style === 'Best Value' && 'Balances performance, build, and price'}
                    {style === 'Premium Quality' && 'Top tier materials and flagship specs'}
                    {style === 'Budget Strict' && 'Aggressive savings & minimum cost'}
                    {style === 'Sustainable' && 'Durability, repairability, longevity'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Categories & Preferred Brands */}
        <div className="p-6 sm:p-8 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] space-y-6">
          <div>
            <span className="font-bold text-xs text-[#18181B] block mb-2">Focused Categories</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected 
                        ? 'bg-[#18181B] text-white shadow-2xs' 
                        : 'bg-[#F4F2EC] text-[#57534E] hover:text-[#18181B]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="font-bold text-xs text-[#18181B] block mb-2">Preferred Brands</span>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((brand) => {
                const isSelected = brands.includes(brand);
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected 
                        ? 'bg-[#1D4ED8] text-white shadow-2xs' 
                        : 'bg-[#F4F2EC] text-[#57534E] hover:text-[#18181B]'
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Account Info */}
        <div className="p-6 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'shopper'}`} 
              alt="User profile"
              className="w-12 h-12 rounded-full border border-stone-200 object-cover" 
            />
            <div>
              <p className="font-bold text-sm text-[#18181B]">{user?.displayName || 'SmartCart User'}</p>
              <p className="text-xs text-[#57534E]">{user?.email || 'shopper@smartcart.ai'}</p>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Firestore Cloud Encrypted
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <Save className="w-4 h-4 text-stone-300" />
            <span>{isSaving ? 'Saving to Firestore...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
