import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NavTab } from './Sidebar';
import { 
  Search, 
  Sparkles, 
  Bell, 
  Menu, 
  ShoppingCart,
  Check
} from 'lucide-react';

interface TopBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileMenu: () => void;
  onSearchSubmit?: (searchTerm: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
  onSearchSubmit
}) => {
  const { user, cart } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery);
      }
      onSelectTab('products');
    }
  };

  const getPageTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'assistant': return 'AI Shopping Assistant';
      case 'products': return 'Product Discovery';
      case 'cart': return 'My Cart';
      case 'compare': return 'Product Comparison';
      case 'saved': return 'Saved Items';
      case 'lists': return 'Shopping Lists';
      case 'history': return 'Activity History';
      case 'settings': return 'Preferences & Settings';
      default: return 'SmartCart AI';
    }
  };

  return (
    <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-stone-200/80 bg-[#F9F8F5]/95 backdrop-blur-md sticky top-0 z-30">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="p-2 -ml-2 rounded-xl text-[#18181B] hover:bg-stone-200/60 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center text-xs font-semibold text-[#57534E]">
          <span className="hidden sm:inline">SmartCart</span>
          <span className="mx-2 opacity-40 hidden sm:inline">/</span>
          <span className="text-[#18181B] font-bold">{getPageTitle(currentTab)}</span>
        </div>
      </div>

      {/* Center/Right: Search + AI Assistant Button + Notifications + Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Instant Search input */}
        <div className="relative hidden md:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search items, specs, brands..."
            className="pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none w-56 sm:w-64 focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 transition-all text-[#18181B] shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#57534E]" />
        </div>

        {/* Quick Ask AI button */}
        <button
          onClick={() => onSelectTab('assistant')}
          className="bg-[#18181B] hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span className="hidden sm:inline">Ask SmartCart AI</span>
        </button>

        {/* Cart Shortcut on mobile */}
        <button
          onClick={() => onSelectTab('cart')}
          className="relative w-9 h-9 bg-white border border-stone-200 rounded-xl flex items-center justify-center text-[#18181B] hover:bg-stone-50 transition-colors lg:hidden shadow-2xs"
        >
          <ShoppingCart className="w-4 h-4" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1D4ED8] text-white text-[9px] font-bold flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="w-9 h-9 bg-white border border-stone-200 rounded-xl flex items-center justify-center text-[#18181B] hover:bg-stone-50 transition-colors relative shadow-2xs"
          >
            <Bell className="w-4 h-4 text-[#57534E]" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1D4ED8]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-[20px] p-5 shadow-xl z-50 border border-stone-200/90 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <span className="text-xs font-extrabold text-[#18181B]">SmartCart Insights</span>
                <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">Live</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#F9F8F5] border border-stone-200/70 text-xs">
                  <p className="font-bold text-[#1D4ED8] text-[11px] mb-0.5">Budget Alert</p>
                  <p className="text-[#18181B] text-xs leading-relaxed">
                    You have ₹17,600 remaining in your monthly target. Keychron V1 is at its best price this month.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F9F8F5] border border-stone-200/70 text-xs">
                  <p className="font-bold text-[#18181B] text-[11px] mb-0.5">Gemini Optimization Ready</p>
                  <p className="text-[#57534E] text-xs leading-relaxed">
                    Head to My Cart to verify accessories and discover bundling savings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {user && (
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
            alt="User"
            className="w-8 h-8 rounded-full border border-stone-300 object-cover cursor-pointer hover:ring-2 hover:ring-[#1D4ED8]/40 transition-all"
            onClick={() => onSelectTab('settings')}
            title={user.displayName || 'Profile Settings'}
          />
        )}
      </div>
    </header>
  );
};
