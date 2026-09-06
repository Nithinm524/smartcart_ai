import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Sparkles, 
  ShoppingBag, 
  ShoppingCart, 
  Scale, 
  Heart, 
  ListChecks, 
  History, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'assistant'
  | 'products'
  | 'cart'
  | 'compare'
  | 'saved'
  | 'lists'
  | 'history'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { user, logout, cart, savedItems, compareList } = useApp();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant' as NavTab, label: 'AI Assistant', icon: Sparkles, badge: 'Gemini' },
    { id: 'products' as NavTab, label: 'Products', icon: ShoppingBag },
    { id: 'cart' as NavTab, label: 'My Cart', icon: ShoppingCart, count: cart.length },
    { id: 'compare' as NavTab, label: 'Compare', icon: Scale, count: compareList.length },
    { id: 'saved' as NavTab, label: 'Saved Items', icon: Heart, count: savedItems.length },
    { id: 'lists' as NavTab, label: 'Shopping Lists', icon: ListChecks },
    { id: 'history' as NavTab, label: 'History', icon: History },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const handleNav = (tabId: NavTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-stone-200/80 flex flex-col p-5 transition-transform duration-300
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav('dashboard')}
          className="flex items-center gap-3 mb-8 px-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#18181B] flex items-center justify-center text-white font-extrabold text-base shadow-xs group-hover:scale-105 transition-transform relative">
            <span>S</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] absolute top-1.5 right-1.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-[#18181B] tracking-tight flex items-center gap-1">
              SmartCart <span className="text-[#1D4ED8] text-xs font-black px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200/60">AI</span>
            </span>
            <span className="text-[10px] font-semibold text-[#57534E] tracking-wider uppercase">Shopping Copilot</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'bg-[#18181B] text-white shadow-xs' 
                    : 'text-[#57534E] hover:text-[#18181B] hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#60A5FA]' : 'text-[#57534E]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-900/60 text-blue-200' : 'bg-blue-50 text-[#1D4ED8] border border-blue-200/60'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {typeof item.count === 'number' && item.count > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#1D4ED8] text-white' : 'bg-stone-100 text-[#18181B] border border-stone-200/60'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout bottom card */}
        <div className="pt-4 border-t border-stone-200/80 mt-auto">
          {user ? (
            <div className="flex items-center justify-between p-2.5 rounded-[16px] bg-[#F9F8F5] border border-stone-200/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full bg-stone-200 object-cover border border-stone-300/80 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#18181B] truncate">
                    {user.displayName || 'SmartCart User'}
                  </p>
                  <p className="text-[10px] text-[#57534E] truncate">
                    {user.email || 'shopper@smartcart.ai'}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-lg text-[#57534E] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-3 bg-[#F9F8F5] rounded-[16px] border border-stone-200/70 text-center">
              <p className="text-xs font-bold text-[#18181B] mb-2">Guest Session</p>
              <button
                onClick={() => handleNav('dashboard')}
                className="w-full py-2 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
