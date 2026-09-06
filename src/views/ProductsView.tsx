import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { SEED_PRODUCTS, CATEGORIES } from '../data/seedProducts';
import { Search, SlidersHorizontal, ArrowUpDown, Filter, Sparkles, X } from 'lucide-react';

interface ProductsViewProps {
  initialSearchQuery?: string;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ initialSearchQuery = '' }) => {
  const { preferences, formatPrice } = useApp();
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [sortBy, setSortBy] = useState<'match' | 'price-asc' | 'price-desc' | 'rating'>('match');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return SEED_PRODUCTS.filter((product) => {
      // Search match
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm || 
        product.title.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower);

      // Category match
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

      // Price match
      const matchesPrice = product.price <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.matchScore || 80) - (a.matchScore || 80);
    });
  }, [searchTerm, selectedCategory, maxPrice, sortBy]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setMaxPrice(150000);
    setSortBy('match');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E] mt-1">
            Explore high-performance gear scored by SmartCart AI's component evaluation model
          </p>
        </div>

        {/* Search Field */}
        <div className="relative max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keywords, specs, or brand..."
            className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-stone-200/90 text-xs sm:text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 text-[#18181B] placeholder:text-[#57534E]/60 shadow-2xs transition-all"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#57534E]" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3 text-[#57534E] hover:text-[#18181B]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="p-5 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-[#F4F2EC] text-[#57534E] hover:text-[#18181B] hover:bg-stone-200/70'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-[#F4F2EC] text-[#57534E] hover:text-[#18181B] hover:bg-stone-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Controls: Price Slider + Sort Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-100 text-xs">
          {/* Price Range */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#57534E]">Budget Ceiling:</span>
            <input
              type="range"
              min={2000}
              max={150000}
              step={2000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-32 sm:w-44 accent-[#1D4ED8]"
            />
            <span className="font-extrabold text-[#18181B] min-w-[70px]">{formatPrice(maxPrice)}</span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#57534E]" />
            <span className="font-semibold text-[#57534E]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#F4F2EC] border border-stone-200/80 rounded-xl px-3 py-1.5 font-bold text-xs text-[#18181B] outline-none cursor-pointer focus:border-[#1D4ED8]"
            >
              <option value="match">Smart AI Match %</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Reset Filter Indicator */}
      <div className="flex items-center justify-between text-xs text-[#57534E] px-1">
        <span>Showing <strong>{filteredProducts.length}</strong> items</span>
        {(selectedCategory !== 'All' || maxPrice < 150000 || searchTerm) && (
          <button
            onClick={clearAllFilters}
            className="text-[#1D4ED8] hover:underline font-bold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-[20px] border border-stone-200/80 bg-white space-y-3">
          <Sparkles className="w-8 h-8 text-[#1D4ED8] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-[#18181B]">No products matched your criteria</h3>
          <p className="text-xs text-[#57534E] max-w-sm mx-auto">
            Try adjusting your budget limit or search terms to uncover more verified items.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-5 py-2.5 rounded-xl bg-[#18181B] text-white text-xs font-bold mt-2 hover:bg-black transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
