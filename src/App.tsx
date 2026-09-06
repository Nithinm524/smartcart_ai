import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/ToastContainer';
import { ProductDetailsModal } from './components/ProductDetailsModal';

// Views
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { AssistantView } from './views/AssistantView';
import { ProductsView } from './views/ProductsView';
import { CartView } from './views/CartView';
import { CompareView } from './views/CompareView';
import { SavedItemsView } from './views/SavedItemsView';
import { ListsView } from './views/ListsView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';

type AppRoute = 'landing' | 'login' | 'app';

const MainAppContent: React.FC = () => {
  const { user, loadingAuth, selectedProduct, setSelectedProduct, isOnline, firestoreError } = useApp();

  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Cross-view state passing
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string>('');
  const [productsInitialQuery, setProductsInitialQuery] = useState<string>('');

  // Handle URL hash sync
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (!hash || hash === 'landing') {
        if (!user) setCurrentRoute('landing');
      } else if (hash === 'login') {
        setCurrentRoute('login');
      } else if (['dashboard', 'assistant', 'products', 'cart', 'compare', 'saved', 'lists', 'history', 'settings'].includes(hash)) {
        setCurrentRoute('app');
        setCurrentTab(hash as NavTab);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [user]);

  // When user signs in, auto-transition to app dashboard if they were on landing or login
  useEffect(() => {
    if (user && (currentRoute === 'landing' || currentRoute === 'login')) {
      setCurrentRoute('app');
      window.location.hash = `/${currentTab}`;
    }
  }, [user]);

  // Synchronize landing cinema scroll with active route to save GPU memory and eliminate background loops
  useEffect(() => {
    const cinemaEl = document.querySelector('.cinema-scroll') as HTMLElement | null;
    if (cinemaEl) {
      if (currentRoute === 'app' || currentRoute === 'login') {
        cinemaEl.style.display = 'none';
      } else {
        cinemaEl.style.display = 'block';
      }
    }
  }, [currentRoute]);

  const navigateToTab = (tab: NavTab) => {
    setCurrentTab(tab);
    setCurrentRoute('app');
    window.location.hash = `/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAi = (prompt: string) => {
    setAssistantInitialQuery(prompt);
    navigateToTab('assistant');
  };

  const handleSearchProducts = (search: string) => {
    setProductsInitialQuery(search);
    navigateToTab('products');
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F9F8F5] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[#18181B] flex items-center justify-center text-white font-black text-xl shadow-xs animate-pulse mb-4">
          S
        </div>
        <p className="text-xs font-bold text-[#57534E] tracking-widest uppercase">
          Initializing SmartCart AI...
        </p>
      </div>
    );
  }

  // Unauthenticated Landing Page
  if (!user && currentRoute === 'landing') {
    return (
      <>
        <LandingView
          onGetStarted={() => {
            setCurrentRoute('login');
            window.location.hash = '/login';
          }}
          onOpenAssistant={(initial) => {
            if (initial) setAssistantInitialQuery(initial);
            setCurrentRoute('login');
            window.location.hash = '/login';
          }}
        />
        <ToastContainer />
      </>
    );
  }

  // Login View
  if (!user && currentRoute === 'login') {
    return (
      <>
        <LoginView
          onSuccess={() => {
            setCurrentRoute('app');
            window.location.hash = '/dashboard';
          }}
          onBackToLanding={() => {
            setCurrentRoute('landing');
            window.location.hash = '/landing';
          }}
        />
        <ToastContainer />
      </>
    );
  }

  // Authenticated App Shell
  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#18181B] flex flex-col selection:bg-[#1D4ED8]/10">
      {/* Sidebar for navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={navigateToTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar width on lg) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {!isOnline && (
          <div className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center">
            You are currently offline. Local changes will synchronize with Cloud Firestore automatically once reconnected.
          </div>
        )}
        {firestoreError && (
          <div className="bg-rose-600 text-white text-xs font-semibold py-1.5 px-4 text-center">
            {firestoreError}
          </div>
        )}

        {/* TopBar with search, notifications, avatar */}
        <TopBar
          currentTab={currentTab}
          onSelectTab={navigateToTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onSearchSubmit={handleSearchProducts}
        />

        {/* Dynamic View container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={navigateToTab}
              onAskAi={handleAskAi}
            />
          )}

          {currentTab === 'assistant' && (
            <AssistantView
              initialQuery={assistantInitialQuery}
              onClearInitialQuery={() => setAssistantInitialQuery('')}
            />
          )}

          {currentTab === 'products' && (
            <ProductsView
              initialSearchQuery={productsInitialQuery}
            />
          )}

          {currentTab === 'cart' && (
            <CartView
              onNavigateToProducts={() => navigateToTab('products')}
              onNavigateToAssistant={handleAskAi}
            />
          )}

          {currentTab === 'compare' && (
            <CompareView />
          )}

          {currentTab === 'saved' && (
            <SavedItemsView
              onNavigateToProducts={() => navigateToTab('products')}
            />
          )}

          {currentTab === 'lists' && (
            <ListsView />
          )}

          {currentTab === 'history' && (
            <HistoryView
              onReopenQuery={handleAskAi}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onNavigateToAssistant={handleAskAi}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
