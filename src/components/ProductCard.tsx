import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, Scale, ShoppingBag, Star, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenDetails?: (product: Product) => void;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { 
    formatPrice, 
    addToCart, 
    toggleSaveItem, 
    isSaved, 
    addToCompare, 
    compareList,
    removeFromCompare,
    setSelectedProduct
  } = useApp();

  const saved = isSaved(product.id);
  const isInCompare = compareList.some(p => p.id === product.id);

  const handleCardClick = () => {
    if (onOpenDetails) {
      onOpenDetails(product);
    } else {
      setSelectedProduct(product);
    }
  };

  return (
    <div 
      style={{ contain: 'layout paint' }}
      className="rounded-[20px] p-5 flex flex-col justify-between group relative border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] hover:border-stone-300 hover:-translate-y-1 transition-transform duration-200 ease-out will-change-transform"
    >
      <div>
        {/* Image Stage */}
        <div 
          onClick={handleCardClick}
          className="w-full aspect-[4/3] bg-[#F4F2EC] rounded-[16px] mb-4 relative overflow-hidden flex items-center justify-center cursor-pointer group-hover:bg-stone-200/70 transition-colors duration-200"
        >
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-full object-cover mix-blend-multiply opacity-95 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />

          {/* AI Match Badge */}
          <div className="absolute top-3 left-3 bg-white/95 text-[10px] font-extrabold px-2.5 py-1 rounded-full text-[#1D4ED8] border border-blue-200/80 shadow-2xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#1D4ED8]" />
            <span>{product.matchScore}% MATCH</span>
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveItem(product);
            }}
            aria-label={saved ? 'Remove from saved' : 'Save item'}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
              saved 
                ? 'bg-rose-50 text-rose-500 shadow-2xs border border-rose-200' 
                : 'bg-white/90 text-[#57534E] hover:text-[#18181B] hover:bg-white border border-stone-200/80 shadow-2xs'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Brand & Category */}
        <div className="flex items-center justify-between text-xs text-[#57534E] mb-1.5">
          <span className="font-bold uppercase tracking-wider text-[10px] text-[#1D4ED8]">{product.brand}</span>
          <span className="bg-[#F4F2EC] px-2 py-0.5 rounded-md text-[10px] font-semibold text-[#57534E]">{product.category}</span>
        </div>

        {/* Title */}
        <h4 
          onClick={handleCardClick}
          className="font-bold text-sm text-[#18181B] line-clamp-2 leading-snug mb-2 hover:text-[#1D4ED8] transition-colors cursor-pointer"
          title={product.title}
        >
          {product.title}
        </h4>

        {/* Rating & reviews */}
        <div className="flex items-center gap-1.5 text-xs text-[#57534E] mb-4">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="ml-1 font-bold text-[#18181B]">{product.rating}</span>
          </div>
          <span>•</span>
          <span className="text-[11px] font-medium">{product.reviewsCount.toLocaleString()} reviews</span>
        </div>
      </div>

      {/* Pricing & Actions */}
      <div className="pt-3 border-t border-stone-100">
        <div className="flex items-baseline justify-between mb-3.5">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-[#18181B]">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-[#57534E] line-through font-normal">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
              SAVE {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addToCart(product)}
            className="flex-1 py-2.5 px-3 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-stone-300" />
            <span>Add to Cart</span>
          </button>

          <button
            onClick={() => {
              if (isInCompare) {
                removeFromCompare(product.id);
              } else {
                addToCompare(product);
              }
            }}
            title={isInCompare ? 'Remove from compare' : 'Compare product'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all text-xs ${
              isInCompare 
                ? 'bg-blue-50 text-[#1D4ED8] border-blue-200 font-bold' 
                : 'border-stone-200 text-[#57534E] hover:text-[#18181B] hover:bg-stone-50'
            }`}
          >
            <Scale className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
