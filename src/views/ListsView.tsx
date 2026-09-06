import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingList, ShoppingListItem } from '../types';
import { 
  ListChecks, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  Pencil, 
  AlertCircle 
} from 'lucide-react';

export const ListsView: React.FC = () => {
  const { 
    shoppingLists, 
    createShoppingList, 
    updateShoppingList, 
    renameShoppingList,
    deleteShoppingList, 
    formatPrice, 
    addToCart, 
    showToast,
    preferences,
    loadingData,
    firestoreError
  } = useApp();

  const [newListName, setNewListName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  
  // AI generation modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [aiBudget, setAiBudget] = useState(preferences.defaultBudget || 50000);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiModalError, setAiModalError] = useState<string | null>(null);

  // New manual item input state per list
  const [activeListId, setActiveListId] = useState<string | null>(shoppingLists[0]?.id || null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const currentList = shoppingLists.find(l => l.id === activeListId) || shoppingLists[0];

  const handleCreateManualList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const listId = await createShoppingList(newListName.trim(), []);
    setNewListName('');
    setShowCreateModal(false);
    setActiveListId(listId);
  };

  const handleGenerateAiList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoal.trim()) return;
    setGeneratingAi(true);
    setAiModalError(null);
    try {
      const response = await fetch('/api/generate-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: aiGoal.trim(),
          budget: Number(aiBudget),
          currency: preferences.currency,
          shoppingStyle: preferences.shoppingStyle
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to synthesize list with Gemini AI');
      }
      
      const items: ShoppingListItem[] = (data.items || []).map((item: any) => ({
        id: 'item_' + Math.random().toString(36).substring(2, 9),
        title: item.title,
        brand: item.brand || 'Selected Brand',
        price: Number(item.price) || 2500,
        quantity: Number(item.quantity) || 1,
        purchased: false,
        notes: item.notes || ''
      }));

      const listId = await createShoppingList(data.name || aiGoal, items);
      setActiveListId(listId);
      setShowAiModal(false);
      setAiGoal('');
      showToast(`SmartCart AI synthesized list "${data.name || aiGoal}"`, 'success');
    } catch (err: any) {
      setAiModalError(err.message || 'Error generating AI list. Please try again.');
      showToast(err.message || 'Error generating AI list', 'error');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleToggleItemStatus = async (item: ShoppingListItem) => {
    if (!currentList) return;
    const updatedItems = currentList.items.map(i => 
      i.id === item.id ? { ...i, purchased: !i.purchased } : i
    );
    await updateShoppingList({ ...currentList, items: updatedItems });
  };

  const handleAddItemToList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentList || !newItemTitle.trim()) return;
    const priceNum = parseFloat(newItemPrice) || 0;
    const newItem: ShoppingListItem = {
      id: 'item_' + Date.now(),
      title: newItemTitle.trim(),
      price: priceNum,
      quantity: 1,
      purchased: false
    };
    const updatedItems = [...currentList.items, newItem];
    await updateShoppingList({ ...currentList, items: updatedItems });
    setNewItemTitle('');
    setNewItemPrice('');
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!currentList) return;
    const updatedItems = currentList.items.filter(i => i.id !== itemId);
    await updateShoppingList({ ...currentList, items: updatedItems });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight flex items-center gap-2.5">
            <span>Shopping Lists</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200/60">
              {shoppingLists.length} Lists
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E] mt-1">
            Plan multi-component projects or let Gemini auto-compile full setups within your budget.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAiModal(true)}
            className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Generate with AI</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white hover:bg-[#F4F2EC] border border-stone-200/90 text-[#18181B] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>New List</span>
          </button>
        </div>
      </div>

      {firestoreError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{firestoreError}</span>
        </div>
      )}

      {loadingData ? (
        <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 text-center rounded-[20px] border border-stone-200/80 bg-white shadow-2xs space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#1D4ED8] mx-auto" />
          <p className="text-xs font-semibold text-[#57534E]">Loading shopping lists from Cloud Firestore...</p>
        </div>
      ) : shoppingLists.length === 0 ? (
        <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 text-center rounded-[20px] border border-stone-200/80 bg-white shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F4F2EC] text-[#18181B] flex items-center justify-center mx-auto">
            <ListChecks className="w-8 h-8 text-[#1D4ED8]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#18181B]">No shopping lists yet</h2>
          <p className="text-xs sm:text-sm text-[#57534E] max-w-sm mx-auto leading-relaxed">
            Create an empty project checklist or ask Gemini to automatically build a complete component list.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAiModal(true)}
              className="bg-[#18181B] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Generate Setup with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lists Sidebar / Selector */}
          <div className="lg:col-span-4 space-y-2">
            {shoppingLists.map((list) => {
              const isActive = (currentList?.id === list.id);
              const completedCount = list.items.filter(i => i.purchased).length;
              return (
                <div
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                    isActive 
                      ? 'bg-white border-[#1D4ED8] shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_18px_-4px_rgba(24,24,27,0.06)] ring-1 ring-[#1D4ED8]/10' 
                      : 'bg-white/80 border-stone-200/70 hover:bg-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#18181B] truncate">{list.name}</h4>
                    <p className="text-[11px] text-[#57534E] mt-0.5">
                      {completedCount} of {list.items.length} completed • <strong className="text-[#18181B]">{formatPrice(list.estimatedTotal || 0)}</strong>
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ml-2 ${isActive ? 'text-[#1D4ED8]' : 'text-[#57534E]'}`} />
                </div>
              );
            })}
          </div>

          {/* Active List Detail Container */}
          {currentList && (
            <div className="lg:col-span-8 p-6 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex-1 pr-4">
                  {isEditingName ? (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (editNameValue.trim() && editNameValue.trim() !== currentList.name) {
                          await renameShoppingList(currentList.id, editNameValue.trim());
                        }
                        setIsEditingName(false);
                      }} 
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        autoFocus
                        className="px-3 py-1.5 text-base font-bold bg-[#F4F2EC] rounded-lg border border-stone-300 focus:bg-white focus:border-[#1D4ED8] outline-none text-[#18181B]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-bold bg-[#18181B] text-white rounded-lg hover:bg-black"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className="px-2.5 py-1.5 text-xs text-[#57534E] hover:text-[#18181B]"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h2 className="text-lg font-bold text-[#18181B]">{currentList.name}</h2>
                      <button
                        onClick={() => {
                          setEditNameValue(currentList.name);
                          setIsEditingName(true);
                        }}
                        title="Edit list title"
                        className="p-1 text-stone-400 hover:text-[#18181B] hover:bg-stone-100 rounded-md transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Estimated Total: <strong className="text-[#18181B]">{formatPrice(currentList.estimatedTotal || 0)}</strong>
                  </p>
                </div>

                <button
                  onClick={() => deleteShoppingList(currentList.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-xs flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete List</span>
                </button>
              </div>

              {/* Items Table / Checklist */}
              <div className="space-y-2">
                {currentList.items.length === 0 ? (
                  <p className="text-xs text-[#57534E] py-6 text-center italic">
                    This list is currently empty. Add items manually or use the AI generator.
                  </p>
                ) : (
                  currentList.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        item.purchased 
                          ? 'bg-[#F9F8F5] border-stone-200/50 opacity-60' 
                          : 'bg-white border-stone-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleItemStatus(item)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                            item.purchased 
                              ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white' 
                              : 'border-stone-300 bg-white hover:border-[#1D4ED8]'
                          }`}
                        >
                          {item.purchased && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold text-[#18181B] truncate ${item.purchased ? 'line-through text-[#57534E]' : ''}`}>
                            {item.title}
                          </p>
                          {item.notes && <p className="text-[10px] text-[#57534E] truncate">{item.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-extrabold text-[#18181B]">{formatPrice(item.price * item.quantity)}</span>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-stone-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Item Form */}
              <form onSubmit={handleAddItemToList} className="pt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Add item (e.g. Ergonomic Desk Mat)..."
                  className="flex-1 px-4 py-2.5 bg-[#F4F2EC] rounded-xl text-xs outline-none text-[#18181B] border border-stone-200/60 focus:border-[#1D4ED8] focus:bg-white transition-all"
                />
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="Estimated Price (₹)"
                  className="w-full sm:w-36 px-4 py-2.5 bg-[#F4F2EC] rounded-xl text-xs outline-none text-[#18181B] border border-stone-200/60 focus:border-[#1D4ED8] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-stone-300" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Manual Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] p-6 max-w-sm w-full border border-stone-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#18181B]">Create New Shopping List</h3>
            <form onSubmit={handleCreateManualList} className="space-y-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. Audio Upgrade 2026"
                autoFocus
                className="w-full px-4 py-2.5 bg-[#F4F2EC] rounded-xl text-xs outline-none text-[#18181B] border border-stone-200/60 focus:border-[#1D4ED8] focus:bg-white transition-all"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#57534E] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-colors"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generate List Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#18181B] flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 text-[#60A5FA]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#18181B]">SmartCart AI List Generator</h3>
                <p className="text-xs text-[#57534E]">Specify your setup goal and budget ceiling</p>
              </div>
            </div>

            {aiModalError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Gemini Notice</span>
                <span>{aiModalError}</span>
              </div>
            )}

            <form onSubmit={handleGenerateAiList} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#18181B] block mb-1">What are you setting up?</label>
                <input
                  type="text"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="e.g. Home office desk setup for remote software engineer"
                  required
                  className="w-full px-4 py-3 bg-[#F4F2EC] rounded-xl outline-none text-[#18181B] border border-stone-200/60 focus:border-[#1D4ED8] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="font-bold text-[#18181B] block mb-1">Total Target Budget ({preferences.currency})</label>
                <input
                  type="number"
                  value={aiBudget}
                  onChange={(e) => setAiBudget(Number(e.target.value))}
                  required
                  className="w-full px-4 py-3 bg-[#F4F2EC] rounded-xl outline-none text-[#18181B] border border-stone-200/60 focus:border-[#1D4ED8] focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  disabled={generatingAi}
                  className="px-4 py-2.5 rounded-xl font-semibold text-[#57534E] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingAi}
                  className="px-6 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold flex items-center gap-2 shadow-xs disabled:opacity-60 transition-colors"
                >
                  {generatingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Components...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-200" />
                      <span>Compile Shopping List</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
