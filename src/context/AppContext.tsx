import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Product, 
  CartItem, 
  SavedItem, 
  ShoppingList, 
  ShoppingListItem, 
  HistoryItem, 
  ChatMessage,
  UserPreferences,
  Currency
} from '../types';
import { SEED_PRODUCTS } from '../data/seedProducts';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface AppContextType {
  user: User | null;
  loadingAuth: boolean;
  loadingData: boolean;
  firestoreError: string | null;
  clearFirestoreError: () => void;
  isOnline: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Cart
  cart: CartItem[];
  cartSubtotal: number;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateCartQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  saveForLater: (cartItem: CartItem) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Saved Items
  savedItems: SavedItem[];
  toggleSaveItem: (product: Product) => Promise<void>;
  isSaved: (productId: string) => boolean;
  
  // Comparison
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  
  // Shopping Lists
  shoppingLists: ShoppingList[];
  createShoppingList: (name: string, items?: ShoppingListItem[]) => Promise<string>;
  updateShoppingList: (list: ShoppingList) => Promise<void>;
  renameShoppingList: (listId: string, newName: string) => Promise<void>;
  deleteShoppingList: (listId: string) => Promise<void>;
  
  // History & AI Conversations
  history: HistoryItem[];
  addHistoryItem: (query: string, summary: string, products?: string[]) => Promise<void>;
  activeConversationMessages: ChatMessage[];
  saveConversationMessages: (messages: ChatMessage[]) => Promise<void>;
  clearConversationMessages: () => Promise<void>;
  
  // Preferences
  preferences: UserPreferences;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
  formatPrice: (amount: number) => string;
  
  // Modals & Navigation
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  
  // Toast notifications
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'INR',
  defaultBudget: 50000,
  preferredCategories: ['Audio', 'Laptops', 'Workspace'],
  preferredBrands: ['Sony', 'Apple', 'Keychron', 'Logitech'],
  shoppingStyle: 'Best Value'
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeConversationMessages, setActiveConversationMessages] = useState<ChatMessage[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  const clearFirestoreError = () => {
    setFirestoreError(null);
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network restored. Reconnected to SmartCart AI Cloud.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Network offline. Data will sync when connection returns.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      
      if (currentUser) {
        setLoadingData(true);
        // Sync user profile document in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'SmartCart Shopper',
            photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.warn('Could not sync user profile to Firestore:', err);
        }
      } else {
        setLoadingData(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Firestore listeners for user data
  useEffect(() => {
    if (!user) {
      setCart([]);
      setSavedItems([]);
      setShoppingLists([]);
      setHistory([]);
      setActiveConversationMessages([]);
      setLoadingData(false);
      return;
    }

    const userId = user.uid;
    setLoadingData(true);
    let pendingSnapshots = 6;
    const checkAllLoaded = () => {
      pendingSnapshots--;
      if (pendingSnapshots <= 0) {
        setLoadingData(false);
      }
    };

    const handleSnapshotErr = (err: unknown, path: string, featureName: string) => {
      console.error(`Error loading ${featureName}:`, err);
      const isPermDenied = err instanceof Error && err.message.toLowerCase().includes('permission');
      const isUnavailable = err instanceof Error && (err.message.toLowerCase().includes('offline') || err.message.toLowerCase().includes('unavailable'));
      
      if (isPermDenied) {
        setFirestoreError('Access permission error: Only authorized user can access this private partition.');
        showToast('Permission denied for user data partition', 'error');
      } else if (isUnavailable) {
        setFirestoreError('Database temporarily unavailable or offline. Please check network.');
      } else {
        setFirestoreError(`Firestore sync error on ${featureName}`);
      }

      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (e) {
        // Logged and encapsulated
      }
      checkAllLoaded();
    };

    // 1. Cart listener
    const cartPath = `users/${userId}/cart`;
    const cartRef = collection(db, 'users', userId, 'cart');
    const unsubCart = onSnapshot(cartRef, (snapshot) => {
      const items: CartItem[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as CartItem);
      });
      setCart(items);
      checkAllLoaded();
    }, (error) => {
      handleSnapshotErr(error, cartPath, 'Cart');
    });

    // 2. Saved items listener
    const savedPath = `users/${userId}/saved`;
    const savedRef = collection(db, 'users', userId, 'saved');
    const unsubSaved = onSnapshot(savedRef, (snapshot) => {
      const items: SavedItem[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as SavedItem);
      });
      setSavedItems(items);
      checkAllLoaded();
    }, (error) => {
      handleSnapshotErr(error, savedPath, 'Saved Items');
    });

    // 3. Shopping Lists listener
    const listsPath = `users/${userId}/lists`;
    const listsRef = collection(db, 'users', userId, 'lists');
    const unsubLists = onSnapshot(listsRef, (snapshot) => {
      const lists: ShoppingList[] = [];
      snapshot.forEach(docSnap => {
        lists.push({ id: docSnap.id, ...docSnap.data() } as ShoppingList);
      });
      setShoppingLists(lists);
      checkAllLoaded();
    }, (error) => {
      handleSnapshotErr(error, listsPath, 'Shopping Lists');
    });

    // 4. History listener
    const historyPath = `users/${userId}/history`;
    const historyRef = collection(db, 'users', userId, 'history');
    const unsubHistory = onSnapshot(historyRef, (snapshot) => {
      const hist: HistoryItem[] = [];
      snapshot.forEach(docSnap => {
        hist.push({ id: docSnap.id, ...docSnap.data() } as HistoryItem);
      });
      // Sort newest first
      hist.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(hist);
      checkAllLoaded();
    }, (error) => {
      handleSnapshotErr(error, historyPath, 'History');
    });

    // 5. Preferences listener
    const prefPath = `users/${userId}/preferences/current`;
    const prefDocRef = doc(db, 'users', userId, 'preferences', 'current');
    const unsubPref = onSnapshot(prefDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...docSnap.data() } as UserPreferences);
      } else {
        // Initialize default preferences in Firestore
        setDoc(prefDocRef, { ...DEFAULT_PREFERENCES, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
      checkAllLoaded();
    }, (error) => {
      handleSnapshotErr(error, prefPath, 'Preferences');
    });

    // 6. Active AI Conversation History listener
    const convPath = `users/${userId}/conversations/active`;
    const convDocRef = doc(db, 'users', userId, 'conversations', 'active');
    const unsubConv = onSnapshot(convDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.messages)) {
          setActiveConversationMessages(data.messages as ChatMessage[]);
        }
      }
      checkAllLoaded();
    }, (error) => {
      handleSnapshotErr(error, convPath, 'Conversations');
    });

    return () => {
      unsubCart();
      unsubSaved();
      unsubLists();
      unsubHistory();
      unsubPref();
      unsubConv();
    };
  }, [user]);

  // Google Sign-In with robust error handling
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Welcome to SmartCart AI!', 'success');
    } catch (err: any) {
      console.warn('Google Sign-In response:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        showToast('Google Sign-In was cancelled or popup closed.', 'info');
      } else if (err.code === 'auth/popup-blocked') {
        showToast('Sign-in popup was blocked by browser. Please allow popups.', 'warning');
      } else if (err.code === 'auth/network-request-failed') {
        showToast('Network error during authentication. Check connection.', 'error');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Subsequent popup triggered
      } else {
        showToast(err.message || 'Authentication error with Google Sign-In.', 'error');
      }
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setCart([]);
      setSavedItems([]);
      setShoppingLists([]);
      setHistory([]);
      setActiveConversationMessages([]);
      setCompareList([]);
      showToast('You have been signed out.', 'info');
    } catch (err) {
      showToast('Error signing out', 'error');
    }
  };

  // Cart operations
  const addToCart = async (product: Product, quantity = 1) => {
    if (!user) {
      showToast('Please sign in to add items to your cart', 'warning');
      return;
    }

    const path = `users/${user.uid}/cart/${product.id}`;
    try {
      const existing = cart.find(c => c.productId === product.id);
      const newQty = existing ? existing.quantity + quantity : quantity;
      
      const cartItemData = {
        productId: product.id,
        title: product.title,
        brand: product.brand,
        category: product.category,
        price: product.price,
        quantity: newQty,
        image: product.image,
        addedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid, 'cart', product.id), cartItemData);
      showToast(`Added "${product.title.slice(0, 24)}..." to cart`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateCartQuantity = async (cartItemId: string, quantity: number) => {
    if (!user) return;
    const path = `users/${user.uid}/cart/${cartItemId}`;
    try {
      if (quantity <= 0) {
        await deleteDoc(doc(db, 'users', user.uid, 'cart', cartItemId));
        showToast('Item removed from cart', 'info');
      } else {
        await updateDoc(doc(db, 'users', user.uid, 'cart', cartItemId), { quantity });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/cart/${cartItemId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'cart', cartItemId));
      showToast('Item removed from cart', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const saveForLater = async (cartItem: CartItem) => {
    if (!user) return;
    const path = `users/${user.uid}/cart/${cartItem.id}`;
    try {
      const product = SEED_PRODUCTS.find(p => p.id === cartItem.productId) || {
        id: cartItem.productId,
        title: cartItem.title,
        brand: cartItem.brand,
        category: cartItem.category,
        price: cartItem.price,
        rating: 4.8,
        reviewsCount: 120,
        image: cartItem.image,
        description: '',
        specs: {},
        matchScore: 90
      };

      await toggleSaveItem(product);
      await removeFromCart(cartItem.id);
      showToast(`Moved "${cartItem.title.slice(0, 20)}..." to Saved Items`, 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    const path = `users/${user.uid}/cart`;
    try {
      const deletePromises = cart.map(item => 
        deleteDoc(doc(db, 'users', user.uid, 'cart', item.id))
      );
      await Promise.all(deletePromises);
      showToast('Cart cleared', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Saved items operations
  const toggleSaveItem = async (product: Product) => {
    if (!user) {
      showToast('Please sign in to save items', 'warning');
      return;
    }

    const path = `users/${user.uid}/saved/${product.id}`;
    const alreadySaved = savedItems.some(s => s.productId === product.id);

    try {
      if (alreadySaved) {
        await deleteDoc(doc(db, 'users', user.uid, 'saved', product.id));
        showToast('Removed from saved items', 'info');
      } else {
        await setDoc(doc(db, 'users', user.uid, 'saved', product.id), {
          productId: product.id,
          title: product.title,
          brand: product.brand,
          category: product.category,
          price: product.price,
          rating: product.rating || 4.8,
          image: product.image,
          savedAt: new Date().toISOString()
        });
        showToast('Saved to your wishlist', 'success');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const isSaved = (productId: string) => {
    return savedItems.some(s => s.productId === productId);
  };

  // Comparison operations (max 3)
  const addToCompare = (product: Product) => {
    if (compareList.some(p => p.id === product.id)) {
      showToast('Item already in comparison list', 'info');
      return;
    }
    if (compareList.length >= 3) {
      showToast('You can compare up to 3 products at a time', 'warning');
      return;
    }
    setCompareList(prev => [...prev, product]);
    showToast(`Added ${product.title.slice(0, 20)} to compare list`, 'success');
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  // Shopping Lists
  const createShoppingList = async (name: string, items: ShoppingListItem[] = []): Promise<string> => {
    if (!user) throw new Error('User not signed in');
    const listId = 'list_' + Date.now();
    const path = `users/${user.uid}/lists/${listId}`;
    const estTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const listData: ShoppingList = {
      id: listId,
      name,
      items,
      estimatedTotal: estTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'lists', listId), listData);
      showToast(`Created shopping list "${name}"`, 'success');
      return listId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateShoppingList = async (list: ShoppingList) => {
    if (!user) return;
    const path = `users/${user.uid}/lists/${list.id}`;
    const estTotal = list.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    try {
      await setDoc(doc(db, 'users', user.uid, 'lists', list.id), {
        ...list,
        estimatedTotal: estTotal,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast(`Updated "${list.name}"`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const renameShoppingList = async (listId: string, newName: string) => {
    if (!user || !newName.trim()) return;
    const path = `users/${user.uid}/lists/${listId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'lists', listId), {
        name: newName.trim(),
        updatedAt: new Date().toISOString()
      });
      showToast(`Renamed list to "${newName.trim()}"`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteShoppingList = async (listId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/lists/${listId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'lists', listId));
      showToast('Deleted shopping list', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Activity History operations
  const addHistoryItem = async (queryText: string, summaryText: string, products: string[] = []) => {
    if (!user) return;
    const histId = 'hist_' + Date.now();
    const path = `users/${user.uid}/history/${histId}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'history', histId), {
        query: queryText,
        summary: summaryText,
        productsSelected: products,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // AI Conversation History persistence
  const saveConversationMessages = async (msgs: ChatMessage[]) => {
    if (!user) return;
    const path = `users/${user.uid}/conversations/active`;
    try {
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].text.slice(0, 100) : '';
      await setDoc(doc(db, 'users', user.uid, 'conversations', 'active'), {
        id: 'active',
        userId: user.uid,
        messages: msgs,
        lastMessage: lastMsg,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const clearConversationMessages = async () => {
    if (!user) return;
    const path = `users/${user.uid}/conversations/active`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'conversations', 'active'));
      setActiveConversationMessages([]);
      showToast('Conversation reset', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Preferences
  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!user) return;
    const path = `users/${user.uid}/preferences/current`;
    try {
      const merged = { ...preferences, ...newPrefs, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'users', user.uid, 'preferences', 'current'), merged, { merge: true });
      setPreferences(merged);
      showToast('Preferences updated successfully', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Currency formatting
  const formatPrice = (amount: number) => {
    const symbolMap: Record<Currency, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£'
    };
    const symbol = symbolMap[preferences.currency] || '₹';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <AppContext.Provider
      value={{
        user,
        loadingAuth,
        loadingData,
        firestoreError,
        clearFirestoreError,
        isOnline,
        signInWithGoogle,
        logout,
        cart,
        cartSubtotal,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        saveForLater,
        clearCart,
        savedItems,
        toggleSaveItem,
        isSaved,
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        shoppingLists,
        createShoppingList,
        updateShoppingList,
        renameShoppingList,
        deleteShoppingList,
        history,
        addHistoryItem,
        activeConversationMessages,
        saveConversationMessages,
        clearConversationMessages,
        preferences,
        updatePreferences,
        formatPrice,
        selectedProduct,
        setSelectedProduct,
        toasts,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

