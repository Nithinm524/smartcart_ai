import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ChatMessage } from '../types';
import { SEED_PRODUCTS } from '../data/seedProducts';
import { 
  Sparkles, 
  Send, 
  ShoppingBag, 
  Scale, 
  Sliders, 
  HelpCircle, 
  RotateCcw, 
  Loader2, 
  Check, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface AssistantViewProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

interface ChatMessageItemProps {
  msg: ChatMessage;
  formatPrice: (p: number) => string;
  addToCart: (p: Product) => void;
  addToCompare: (p: Product) => void;
  setSelectedProduct: (p: Product) => void;
}

const ChatMessageItem = React.memo<ChatMessageItemProps>(({ 
  msg, 
  formatPrice, 
  addToCart, 
  addToCompare, 
  setSelectedProduct 
}) => {
  return (
    <div 
      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
    >
      <div className={`max-w-2xl flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        {msg.sender === 'assistant' && (
          <div className="w-7 h-7 rounded-lg bg-[#18181B] flex items-center justify-center text-white shrink-0 mt-1 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
          </div>
        )}

        <div className={`rounded-[18px] p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
          msg.sender === 'user'
            ? 'bg-[#18181B] text-white rounded-tr-xs shadow-2xs'
            : 'bg-[#F9F8F5] border border-stone-200/80 text-[#18181B] rounded-tl-xs shadow-2xs'
        }`}>
          <div className="whitespace-pre-line mb-1.5">{msg.text}</div>
          <div className={`text-[10px] ${msg.sender === 'user' ? 'text-stone-400 text-right' : 'text-[#57534E]'}`}>
            {msg.timestamp}
          </div>

          {/* Recommended Product Cards inside AI Message */}
          {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-stone-200/70 space-y-2.5">
              <p className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider">
                Matched Catalog Recommendations:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {msg.recommendedProducts.map((prod) => (
                  <div 
                    key={prod.id}
                    style={{ contain: 'layout paint' }}
                    className="p-3.5 rounded-[16px] bg-white border border-stone-200/80 flex flex-col justify-between hover:border-stone-300 shadow-2xs transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="w-12 h-12 rounded-xl bg-[#F4F2EC] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        <img 
                          src={prod.image} 
                          alt={prod.title} 
                          className="w-full h-full object-cover mix-blend-multiply" 
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-[#18181B] line-clamp-1">{prod.title}</h5>
                        <p className="text-[10px] text-[#57534E] font-medium">{prod.brand} • {prod.category}</p>
                        <p className="text-xs font-extrabold text-[#18181B] mt-0.5">{formatPrice(prod.price)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => addToCart(prod)}
                        className="flex-1 py-2 bg-[#18181B] hover:bg-black text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3 text-stone-300" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        onClick={() => addToCompare(prod)}
                        title="Compare this item"
                        className="p-2 rounded-lg border border-stone-200 text-[#57534E] hover:text-[#18181B] hover:bg-stone-50 bg-white transition-colors"
                      >
                        <Scale className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setSelectedProduct(prod)}
                        title="View details"
                        className="p-2 rounded-lg border border-stone-200 text-[#57534E] hover:text-[#18181B] hover:bg-stone-50 bg-white transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const AssistantView: React.FC<AssistantViewProps> = ({ 
  initialQuery, 
  onClearInitialQuery 
}) => {
  const { 
    user, 
    cart, 
    savedItems, 
    preferences, 
    formatPrice, 
    addToCart, 
    addToCompare,
    setSelectedProduct,
    addHistoryItem,
    activeConversationMessages,
    saveConversationMessages,
    clearConversationMessages,
    loadingData
  } = useApp();

  const welcomeMessage: ChatMessage = {
    id: 'welcome-msg',
    sender: 'assistant',
    text: `Hello! I'm SmartCart AI, your shopping intelligence copilot.\n\nTell me what you need—whether it's "wireless ANC headphones under ₹5,000", "a complete ergonomic desk setup", or "finding a cheaper alternative to my cart". I will analyze specs, verify real value, and keep you within your ₹${(preferences.defaultBudget || 50000).toLocaleString()} budget.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    recommendedProducts: [SEED_PRODUCTS[0], SEED_PRODUCTS[1]]
  };

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with Firestore persisted conversation
  useEffect(() => {
    if (activeConversationMessages && activeConversationMessages.length > 0) {
      setMessages(activeConversationMessages);
    }
  }, [activeConversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initial query if routed from Dashboard or Landing
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const intermediateMessages = [...messages, userMessage];
    setMessages(intermediateMessages);
    if (user) {
      saveConversationMessages(intermediateMessages);
    }
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: intermediateMessages.slice(-4).map(m => ({ role: m.sender, content: m.text })),
          context: {
            budget: preferences.defaultBudget,
            shoppingStyle: preferences.shoppingStyle,
            preferredCategories: preferences.preferredCategories,
            preferredBrands: preferences.preferredBrands,
            cartItems: cart,
            savedItems: savedItems
          }
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gemini shopping assistant encountered an error');
      }
      
      const assistantMessage: ChatMessage = {
        id: 'assistant_' + Date.now(),
        sender: 'assistant',
        text: data.reply || 'Here are the recommended items matching your criteria.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProducts: data.recommendedProducts || []
      };

      const finalMessages = [...intermediateMessages, assistantMessage];
      setMessages(finalMessages);
      if (user) {
        saveConversationMessages(finalMessages);
      }

      // Save to history in Firestore
      addHistoryItem(trimmed, data.reply?.slice(0, 100) || 'AI Shopping query', data.recommendedProducts?.map((p: any) => p.title));
    } catch (err: any) {
      const fallbackMessage: ChatMessage = {
        id: 'assistant_err_' + Date.now(),
        sender: 'assistant',
        text: `Gemini Assistant Notice: ${err.message || 'Unable to complete AI shopping recommendation at this moment. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProducts: []
      };
      const finalMessages = [...intermediateMessages, fallbackMessage];
      setMessages(finalMessages);
      if (user) {
        saveConversationMessages(finalMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = async () => {
    if (user) {
      await clearConversationMessages();
    }
    setMessages([welcomeMessage]);
  };

  const handleQuickAction = (actionPrompt: string) => {
    handleSendMessage(actionPrompt);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-6">
      {/* Left/Main: Conversation Area */}
      <div className="flex-1 flex flex-col rounded-[20px] border border-stone-200/80 bg-white overflow-hidden shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)]">
        {/* Assistant Header */}
        <div className="p-4 sm:px-6 border-b border-stone-200/70 bg-[#F9F8F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#18181B] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <Sparkles className="w-4 h-4 text-[#60A5FA]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-[#18181B]">SmartCart Copilot</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200/60">
                  Gemini Flash Grounded
                </span>
              </div>
              <p className="text-[11px] text-[#57534E]">Trained to extract intent, compare specs, and enforce budget discipline</p>
            </div>
          </div>

          <button
            onClick={handleClearConversation}
            title="Reset conversation"
            className="p-2 text-[#57534E] hover:text-[#18181B] hover:bg-stone-200/60 rounded-xl transition-colors text-xs flex items-center gap-1.5 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              msg={msg}
              formatPrice={formatPrice}
              addToCart={addToCart}
              addToCompare={addToCompare}
              setSelectedProduct={setSelectedProduct}
            />
          ))}

          {/* Loading typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#18181B] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
              </div>
              <div className="p-4 rounded-[18px] rounded-tl-xs bg-[#F9F8F5] border border-stone-200/80 flex items-center gap-2 text-xs text-[#57534E]">
                <Loader2 className="w-4 h-4 animate-spin text-[#1D4ED8]" />
                <span>SmartCart AI is parsing requirements, checking prices and verifying specifications...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#F9F8F5] border-t border-stone-200/70 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-[#57534E] uppercase tracking-wider shrink-0">Suggestions:</span>
          <button
            onClick={() => handleQuickAction('Recommend the best wireless headphones with longest battery life under ₹15,000')}
            className="px-3.5 py-1 rounded-full bg-white border border-stone-200/80 hover:border-stone-300 text-xs font-semibold text-[#18181B] whitespace-nowrap shadow-2xs transition-colors"
          >
            Recommend Best Headphones
          </button>
          <button
            onClick={() => handleQuickAction('Compare Keychron V1 mechanical keyboard with standard office keyboards')}
            className="px-3.5 py-1 rounded-full bg-white border border-stone-200/80 hover:border-stone-300 text-xs font-semibold text-[#18181B] whitespace-nowrap shadow-2xs transition-colors"
          >
            Compare Keyboards
          </button>
          <button
            onClick={() => handleQuickAction('Find budget alternatives to Apple MacBook Air that are powerful for coding')}
            className="px-3.5 py-1 rounded-full bg-white border border-stone-200/80 hover:border-stone-300 text-xs font-semibold text-[#18181B] whitespace-nowrap shadow-2xs transition-colors"
          >
            Find Laptop Alternatives
          </button>
          <button
            onClick={() => handleQuickAction('How can I stay within my monthly budget while shopping for a complete desk setup?')}
            className="px-3.5 py-1 rounded-full bg-white border border-stone-200/80 hover:border-stone-300 text-xs font-semibold text-[#18181B] whitespace-nowrap shadow-2xs transition-colors"
          >
            Stay Within Budget
          </button>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-stone-200/80">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tell me what you're looking for (specs, budget, intended use)..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#F4F2EC] rounded-xl text-xs sm:text-sm outline-none text-[#18181B] placeholder:text-[#57534E]/60 focus:bg-white focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 border border-transparent transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="w-11 h-11 rounded-xl bg-[#18181B] hover:bg-black text-white flex items-center justify-center shadow-xs transition-all active:scale-95 disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right: "SmartCart Context" Panel */}
      <div className="w-full lg:w-80 rounded-[20px] border border-stone-200/80 bg-white p-6 flex flex-col justify-between space-y-6 shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] overflow-y-auto max-h-screen">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-extrabold text-sm text-[#18181B]">Active Session Context</h3>
            <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              LIVE
            </span>
          </div>

          {/* Budget Snapshot */}
          <div>
            <span className="text-[10px] font-bold text-[#57534E] uppercase tracking-wider block mb-2">
              Monthly Budget Guard
            </span>
            <div className="p-3.5 bg-[#F9F8F5] rounded-[16px] border border-stone-200/70">
              <div className="flex justify-between text-xs font-bold text-[#18181B] mb-1.5">
                <span>Ceiling:</span>
                <span>{formatPrice(preferences.defaultBudget || 50000)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#57534E]">
                <span>Shopping Profile:</span>
                <span className="text-[#1D4ED8] font-bold capitalize">{preferences.shoppingStyle}</span>
              </div>
            </div>
          </div>

          {/* Preferred Categories & Brands */}
          <div>
            <span className="text-[10px] font-bold text-[#57534E] uppercase tracking-wider block mb-2">
              Tuned Categories
            </span>
            <div className="flex flex-wrap gap-1.5">
              {preferences.preferredCategories?.map((cat) => (
                <span key={cat} className="text-[10px] font-semibold px-2.5 py-1 bg-[#F9F8F5] border border-stone-200/80 rounded-md text-[#18181B]">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#57534E] uppercase tracking-wider block mb-2">
              Preferred Brands
            </span>
            <div className="flex flex-wrap gap-1.5">
              {preferences.preferredBrands?.map((brand) => (
                <span key={brand} className="text-[10px] font-semibold px-2.5 py-1 bg-[#F9F8F5] border border-stone-200/80 rounded-md text-[#18181B]">
                  {brand}
                </span>
              ))}
            </div>
          </div>

          {/* Current Cart Preview in Context */}
          <div>
            <span className="text-[10px] font-bold text-[#57534E] uppercase tracking-wider block mb-2">
              Current Cart ({cart.length} items)
            </span>
            {cart.length === 0 ? (
              <p className="text-xs text-[#57534E] italic p-3 bg-[#F9F8F5] rounded-xl border border-stone-200/60">Your cart is empty.</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {cart.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-[#F9F8F5] border border-stone-200/70 flex items-center justify-between text-xs">
                    <span className="truncate font-semibold max-w-[140px] text-[#18181B]">{item.title}</span>
                    <span className="font-extrabold text-[11px] text-[#18181B]">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom helper tip */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-[16px] text-xs text-[#1D4ED8] leading-relaxed">
          <p className="font-semibold">
            SmartCart AI factors in all items in your cart when recommending complementary peripherals.
          </p>
        </div>
      </div>
    </div>
  );
};
