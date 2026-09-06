import React from 'react';
import { useApp } from '../context/AppContext';
import { SEED_PRODUCTS } from '../data/seedProducts';
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  Scale, 
  ArrowRight,
  Sparkles,
  Star
} from 'lucide-react';

interface SavedItemsViewProps {
  onNavigateToProducts: () => void;
}

export const SavedItemsView: React.FC<SavedItemsViewProps> = ({ onNavigateToProducts }) => {
  const { 
    savedItems, 
    toggleSaveItem, 
    addToCart, 
    addToCompare, 
    formatPrice,
    setSelectedProduct,
    loadingData,
    firestoreError
  } = useApp();

  if (loadingData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 text-center rounded-[20px] border border-stone-200/80 bg-white shadow-2xs space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#57534E]">Loading your saved items from Cloud Firestore...</p>
      </div>
    );
  }

  if (savedItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 text-center rounded-[20px] border border-stone-200/80 bg-white shadow-2xs space-y-4">
        {firestoreError && (
          <div className="p-3 mb-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            {firestoreError}
          </div>
        )}
        <div className="w-16 h-16 rounded-2xl bg-[#F4F2EC] text-[#57534E] flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#18181B]">No saved items yet</h2>
        <p className="text-xs sm:text-sm text-[#57534E] max-w-sm mx-auto leading-relaxed">
          Bookmark products while browsing so SmartCart AI can monitor price drops and bundle opportunities for you.
        </p>
        <button
          onClick={onNavigateToProducts}
          className="px-6 py-3 bg-[#18181B] hover:bg-black text-white rounded-xl font-bold text-xs transition-all shadow-xs"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight flex items-center gap-2.5">
            <span>Saved Items</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
              {savedItems.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E] mt-1">
            Your private wishlist synced in real time with Cloud Firestore
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {savedItems.map((item) => {
          const fullProduct = SEED_PRODUCTS.find((p) => p.id === item.productId) || {
            id: item.productId,
            title: item.title,
            brand: item.brand,
            category: item.category,
            price: item.price,
            rating: item.rating || 4.8,
            reviewsCount: 120,
            image: item.image,
            description: '',
            specs: {},
            matchScore: 92
          };

          return (
            <div 
              key={item.id}
              className="p-5 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] flex flex-col justify-between hover:shadow-xs transition-all"
            >
              <div>
                <div className="relative aspect-[4/3] bg-[#F4F2EC] rounded-xl p-2 flex items-center justify-center mb-3">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover mix-blend-multiply rounded-lg"
                  />
                  <button
                    onClick={() => toggleSaveItem(fullProduct)}
                    title="Remove from saved"
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 hover:bg-rose-50 text-rose-500 flex items-center justify-center shadow-xs transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-wider mb-1">{item.brand}</div>
                <h4 className="font-bold text-xs sm:text-sm text-[#18181B] line-clamp-2 mb-2">{item.title}</h4>
                <p className="text-sm sm:text-base font-extrabold text-[#18181B] mb-3">{formatPrice(item.price)}</p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => addToCart(fullProduct)}
                  className="flex-1 py-2.5 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-300" />
                  <span>Move to Cart</span>
                </button>
                <button
                  onClick={() => addToCompare(fullProduct)}
                  title="Compare"
                  className="p-2.5 border border-stone-200/80 rounded-xl text-[#57534E] hover:text-[#18181B] hover:bg-stone-50 transition-colors"
                >
                  <Scale className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
