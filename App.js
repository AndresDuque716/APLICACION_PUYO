import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Text, 
  SafeAreaView, 
  Modal, 
  Alert, 
  Platform,
  Vibration,
  Dimensions,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { CameraView, Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Home as HomeIcon, 
  Package, 
  Plus, 
  Receipt, 
  MoreHorizontal, 
  Menu, 
  Bell, 
  X, 
  ChevronRight, 
  Camera as CameraIcon,
  Settings,
  HelpCircle,
  RotateCcw,
  Trash2
} from 'lucide-react-native';

// Constants and Screens
import { THEME, STORAGE_KEYS, INITIAL_PRODUCTS, INITIAL_SALES } from './src/constants/theme';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProductosScreen from './src/screens/ProductosScreen';
import NuevoProductoScreen from './src/screens/NuevoProductoScreen';
import SalesHistoryScreen from './src/screens/SalesHistoryScreen';
import NuevaVentaScreen from './src/screens/NuevaVentaScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import { TutorialProvider, useTutorial } from './src/components/TutorialProvider';
import TutorialStep from './src/components/TutorialStep';
import TutorialOverlay from './src/components/TutorialOverlay';
import { auth, db, isFirebaseConfigured } from './src/config/firebase';
import { deleteUser } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';

import { logScreenView, logSaleAnalytics } from './src/config/analytics';

import { StatusBar as RNStatusBar } from 'react-native';

let SafeAreaProvider = ({ children }) => <View style={{ flex: 1 }}>{children}</View>;
let useSafeAreaInsets = () => {
  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;
  return {
    top: statusBarHeight,
    bottom: Platform.OS === 'ios' ? 15 : (Platform.OS === 'android' ? 12 : 0),
    left: 0,
    right: 0
  };
};

try {
  const SafeAreaContext = require('react-native-safe-area-context');
  if (SafeAreaContext && SafeAreaContext.SafeAreaProvider) {
    SafeAreaProvider = SafeAreaContext.SafeAreaProvider;
    useSafeAreaInsets = SafeAreaContext.useSafeAreaInsets;
  }
} catch (e) {
  console.log("Safe area context fallback activo");
}

export default function VendixApp() {
  const [currentRoute, setCurrentRoute] = useState('splash'); // 'splash', 'login', 'dashboard', 'products', 'new-product', 'sales', 'scanner', 'reports'
  const [loggedInUser, setLoggedInUser] = useState('');

  return (
    <SafeAreaProvider>
      <TutorialProvider 
        currentRoute={currentRoute} 
        setCurrentRoute={setCurrentRoute} 
        loggedInUser={loggedInUser}
      >
        <VendixAppContent 
          currentRoute={currentRoute}
          setCurrentRoute={setCurrentRoute}
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
        />
      </TutorialProvider>
    </SafeAreaProvider>
  );
}

function VendixAppContent({ currentRoute, setCurrentRoute, loggedInUser, setLoggedInUser }) {
  const insets = useSafeAreaInsets();
  const { resetTutorial } = useTutorial();

  // Insets dinámicos que se adaptan a Android (Xiaomi, Redmi, POCO, Samsung, Motorola, Pixel) e iOS
  const dynamicBottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 15 : 10);
  const dynamicTopInset = Math.max(insets.top, Platform.OS === 'android' ? 25 : 0);

  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  
  // Database States
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [categories, setCategories] = useState(['Todos', 'Bebidas', 'Snacks', 'Golosinas', 'Abarrotes', 'Lácteos']);
  const [cart, setCart] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Mi Sucursal');
  const [branches, setBranches] = useState(['Mi Sucursal']);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Camera permissions states
  const [cameraScannerVisible, setCameraScannerVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [permissionExplanationVisible, setPermissionExplanationVisible] = useState(false);

  // Continuous scanning states
  const [continuousScan, setContinuousScan] = useState(false);
  const [scanToastMessage, setScanToastMessage] = useState('');
  const [lastScannedBarcode, setLastScannedBarcode] = useState(null);
  const [lastScannedTimestamp, setLastScannedTimestamp] = useState(0);

  // Dynamic Real-time Notifications list
  const getNotificationsList = () => {
    if (!Array.isArray(products) || !Array.isArray(salesHistory)) {
      return [];
    }
    const list = [];
    
    // 1. Out of stock alerts
    const outOfStock = products.filter(p => p && typeof p.stock === 'number' && p.stock === 0);
    outOfStock.forEach(p => {
      list.push({
        id: `out-stock-${p.id}`,
        type: 'danger',
        icon: '❌',
        title: 'Producto Agotado',
        message: `El producto "${p.name}" se ha quedado sin stock. Reabastécelo.`,
        time: 'Ahora'
      });
    });

    // 2. Low stock alerts
    const lowStock = products.filter(p => p && typeof p.stock === 'number' && p.stock > 0 && p.stock <= 5);
    lowStock.forEach(p => {
      list.push({
        id: `low-stock-${p.id}`,
        type: 'warning',
        icon: '⚠️',
        title: 'Stock Crítico',
        message: `Quedan pocas unidades de "${p.name}" (${p.stock} restante).`,
        time: 'Ahora'
      });
    });

    // 3. Daily target achieved
    const todaySales = salesHistory.filter(s => 
      s && typeof s.time === 'string' && (s.time.includes('min') || s.time.includes('hora') || s.time.includes('momento'))
    );
    const totalToday = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    const DAILY_TARGET = 1500.00;
    if (totalToday >= DAILY_TARGET) {
      list.push({
        id: 'target-achieved',
        type: 'success',
        icon: '🏆',
        title: 'Meta Diaria Alcanzada',
        message: `¡Felicitaciones! Se alcanzó la meta con S/ ${totalToday.toFixed(2)} vendidos hoy.`,
        time: 'Hoy'
      });
    }

    // 4. Latest transactions
    if (salesHistory.length > 0 && salesHistory[0]) {
      const latestSale = salesHistory[0];
      list.push({
        id: `sale-${latestSale.id}`,
        type: 'info',
        icon: '✅',
        title: 'Venta Registrada',
        message: `Se procesó la venta ${latestSale.id} por un total de S/ ${typeof latestSale.total === 'number' ? latestSale.total.toFixed(2) : '0.00'}.`,
        time: latestSale.time || 'Ahora'
      });
    }

    return list;
  };

  // 1. Initial Load of Persisted Data
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        // Limpieza automática única para vaciar la app de datos demo anteriores
        const storedProducts = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (storedProducts && JSON.parse(storedProducts).length > 0) {
          setProducts(JSON.parse(storedProducts));
        } else {
          setProducts(INITIAL_PRODUCTS);
          await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        }

        const storedSalesHistory = await AsyncStorage.getItem(STORAGE_KEYS.SALES_HISTORY);
        if (storedSalesHistory && JSON.parse(storedSalesHistory).length > 0) {
          setSalesHistory(JSON.parse(storedSalesHistory));
        } else {
          setSalesHistory(INITIAL_SALES);
          await AsyncStorage.setItem(STORAGE_KEYS.SALES_HISTORY, JSON.stringify(INITIAL_SALES));
        }

        const storedCart = await AsyncStorage.getItem(STORAGE_KEYS.CART);
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }

        const storedCategories = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (storedCategories) {
          setCategories(JSON.parse(storedCategories));
        } else {
          await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(['Todos', 'Bebidas', 'Snacks', 'Golosinas', 'Abarrotes', 'Lácteos']));
        }

        const storedSelected = await AsyncStorage.getItem('@vendix_selected_branch');
        if (storedSelected) {
          setSelectedBranch(storedSelected);
        } else {
          await AsyncStorage.setItem('@vendix_selected_branch', 'Mi Sucursal');
        }

        const storedList = await AsyncStorage.getItem('@vendix_branches_list');
        if (storedList) {
          setBranches(JSON.parse(storedList));
        } else {
          await AsyncStorage.setItem('@vendix_branches_list', JSON.stringify(['Mi Sucursal']));
        }

        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.LOGGED_USER);
        if (storedUser) {
          setLoggedInUser(storedUser);
          setEmail(storedUser);
        }
      } catch (error) {
        console.error('Error loading persisted data:', error);
      }
    };

    loadPersistedData();
  }, []);

  useEffect(() => {
    if (currentRoute) {
      logScreenView(currentRoute, loggedInUser);
    }
  }, [currentRoute, loggedInUser]);

  const getUserProductsKey = (userMail) => {
    const safeUser = (userMail || 'guest').replace(/[^a-zA-Z0-9]/g, '_');
    return `@vendix_products_${safeUser}`;
  };

  const getUserSalesKey = (userMail) => {
    const safeUser = (userMail || 'guest').replace(/[^a-zA-Z0-9]/g, '_');
    return `@vendix_sales_history_${safeUser}`;
  };

  const loadUserDataForAccount = async (accountMail) => {
    if (!accountMail) return;
    try {
      // 1. Limpiar inmediatamente estados anteriores para que no se mezclen datos entre cuentas
      setProducts([]);
      setSalesHistory([]);
      setCart([]);

      const prodKey = getUserProductsKey(accountMail);
      const salesKey = getUserSalesKey(accountMail);

      // 2. Cargar almacenamiento local propio de esta cuenta
      const localProds = await AsyncStorage.getItem(prodKey);
      if (localProds && JSON.parse(localProds).length > 0) {
        setProducts(JSON.parse(localProds));
      } else {
        setProducts(INITIAL_PRODUCTS);
        await AsyncStorage.setItem(prodKey, JSON.stringify(INITIAL_PRODUCTS));
      }

      const localSales = await AsyncStorage.getItem(salesKey);
      if (localSales && JSON.parse(localSales).length > 0) {
        setSalesHistory(JSON.parse(localSales));
      } else {
        setSalesHistory(INITIAL_SALES);
        await AsyncStorage.setItem(salesKey, JSON.stringify(INITIAL_SALES));
      }

      // 3. Sincronizar con Firestore de esta cuenta
      if (isFirebaseConfigured && db) {
        const uid = (auth && auth.currentUser && auth.currentUser.uid) 
          ? auth.currentUser.uid 
          : accountMail.replace(/[^a-zA-Z0-9]/g, '_');

        const productsColRef = collection(db, "users", uid, "products");
        const productsSnapshot = await getDocs(productsColRef);
        const cloudProducts = [];
        productsSnapshot.forEach(docSnap => {
          cloudProducts.push({ id: docSnap.id, ...docSnap.data() });
        });

        setProducts(cloudProducts);
        await AsyncStorage.setItem(prodKey, JSON.stringify(cloudProducts));

        const salesColRef = collection(db, "users", uid, "sales");
        const salesSnapshot = await getDocs(salesColRef);
        const cloudSales = [];
        salesSnapshot.forEach(docSnap => {
          cloudSales.push({ id: docSnap.id, ...docSnap.data() });
        });
        cloudSales.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        setSalesHistory(cloudSales);
        await AsyncStorage.setItem(salesKey, JSON.stringify(cloudSales));
        console.log(`☁️ Datos aislados y sincronizados correctamente para (${accountMail}).`);
      }
    } catch (err) {
      console.error("Error cargando datos de cuenta aislada:", err);
    }
  };

  // Sincronizar datos con Cloud Firestore
  const syncDataWithCloud = async () => {
    if (!loggedInUser) return;
    await loadUserDataForAccount(loggedInUser);
  };

  // Escuchador de autenticación de Firebase
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setLoggedInUser(user.email);
          setEmail(user.email);
          AsyncStorage.setItem(STORAGE_KEYS.LOGGED_USER, user.email).catch(console.error);
          loadUserDataForAccount(user.email);
        } else {
          setLoggedInUser('');
          setEmail('');
          setProducts([]);
          setSalesHistory([]);
          setCart([]);
          AsyncStorage.removeItem(STORAGE_KEYS.LOGGED_USER).catch(console.error);
        }
      });
      return unsubscribe;
    }
  }, []);

  // 2. Splash screen loading progress simulation
  useEffect(() => {
    if (currentRoute === 'splash') {
      setProgress(0);
      setIsExiting(false);
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            setIsExiting(true);
            setTimeout(() => {
              if (loggedInUser) {
                setCurrentRoute('dashboard');
              } else {
                setCurrentRoute('login');
              }
            }, 500);
            return 100;
          }
          return prevProgress + 2.5;
        });
      }, 45);
      return () => clearInterval(interval);
    }
  }, [currentRoute, loggedInUser]);

  // 3. Scan & Simulator Actions
  const triggerScanFlash = () => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 250);
  };

  const handleScanAction = async () => {
    try {
      if (Platform.OS === 'web') {
        runMockScan();
        return;
      }
      const { status } = await Camera.getCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');

      if (status === 'granted') {
        setCameraScannerVisible(true);
      } else if (status === 'undetermined') {
        const requestResult = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(requestResult.status === 'granted');
        if (requestResult.status === 'granted') {
          setCameraScannerVisible(true);
        } else {
          runMockScan();
        }
      } else {
        setPermissionExplanationVisible(true);
      }
    } catch (err) {
      console.log('Camera permission check note:', err);
      runMockScan();
    }
  };

  const handleRequestCameraPermission = async () => {
    setPermissionExplanationVisible(false);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
      if (status === 'granted') {
        setCameraScannerVisible(true);
      } else {
        Alert.alert(
          'Permiso denegado', 
          'No se pudo acceder a la cámara. Se activará la simulación de escaneo.',
          [{ text: 'Entendido', onPress: () => runMockScan() }]
        );
      }
    } catch (err) {
      console.log('Request camera error:', err);
      runMockScan();
    }
  };

  const playBeepSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav' }
      );
      await sound.playAsync();
      setTimeout(() => {
        sound.unloadAsync();
      }, 1000);
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  const triggerBeepAndVibrate = () => {
    Vibration.vibrate(100);
    playBeepSound();
  };

  const handleBarcodeScanned = ({ type, data }) => {
    const now = Date.now();
    if (data === lastScannedBarcode && (now - lastScannedTimestamp) < 2000) {
      return;
    }
    
    setLastScannedBarcode(data);
    setLastScannedTimestamp(now);
    triggerScanFlash();
    triggerBeepAndVibrate();

    const found = products.find(p => p.barcode === data);
    const prodName = found ? found.name : `Producto (${data})`;
    
    const updatedCart = [...cart];
    const existing = updatedCart.find(item => item.name === (found ? found.name : data));
    if (existing) {
      existing.qty += 1;
    } else {
      updatedCart.push({
        id: Date.now(),
        name: found ? found.name : data,
        price: found ? found.price : 4.50,
        qty: 1,
        avatar: found ? found.avatar : '📦'
      });
    }
    saveCartState(updatedCart);

    if (continuousScan) {
      setScanToastMessage(`Agregado: ${prodName} (+1)`);
      setTimeout(() => setScanToastMessage(''), 2000);
    } else {
      setCameraScannerVisible(false);
      Alert.alert('Código Escaneado', `Producto agregado: ${prodName}`);
    }
  };

  const runMockScan = () => {
    triggerScanFlash();
    const randProd = products[Math.floor(Math.random() * products.length)];
    if (!randProd) {
      Alert.alert('Error', 'No hay productos registrados.');
      return;
    }
    
    const updatedCart = [...cart];
    const existing = updatedCart.find(item => item.name === randProd.name);
    if (existing) {
      existing.qty += 1;
    } else {
      updatedCart.push({
        id: Date.now(),
        name: randProd.name,
        price: randProd.price,
        qty: 1,
        avatar: randProd.avatar
      });
    }

    saveCartState(updatedCart);
    Alert.alert('[Simulación]', `Producto detectado: ${randProd.name}`);
  };

  const handleAddProductFromCatalog = (product) => {
    const updatedCart = [...cart];
    const existing = updatedCart.find(item => item.name === product.name);
    if (existing) {
      existing.qty += 1;
    } else {
      updatedCart.push({
        id: Date.now(),
        name: product.name,
        price: product.price,
        qty: 1,
        avatar: product.avatar
      });
    }
    saveCartState(updatedCart);
  };

  const handleSearchAdd = (name) => {
    const found = products.find(p => 
      p.name.toLowerCase().includes(name.toLowerCase()) || 
      p.barcode === name
    );
    const productToAdd = found || { name: name, price: 4.50, avatar: '📦', stock: 10 };
    handleAddProductFromCatalog(productToAdd);
  };

  const handleAddQty = (id) => {
    const updatedCart = cart.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
    saveCartState(updatedCart);
  };

  const handleSubQty = (id) => {
    const updatedCart = cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty - 1;
        return { ...item, qty: newQty < 1 ? 1 : newQty };
      }
      return item;
    });
    saveCartState(updatedCart);
  };

  const handleDeleteItem = (id) => {
    const updatedCart = cart.filter(item => item.id !== id);
    saveCartState(updatedCart);
  };

  const saveCartState = async (newCart) => {
    try {
      setCart(newCart);
      await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(newCart));
    } catch (e) {
      console.error(e);
    }
  };

  // Complete sale, update stock, register transaction with dynamic products list for ReportsScreen
  const handleCompleteSale = async (total, method) => {
    try {
      // 1. Deduct stock from products
      const updatedProducts = products.map(prod => {
        const cartItem = cart.find(item => item.name === prod.name);
        if (cartItem) {
          const newStock = Math.max(0, prod.stock - cartItem.qty);
          return { ...prod, stock: newStock };
        }
        return prod;
      });
      setProducts(updatedProducts);
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));

      // 2. Add to sales history
      const newSale = {
        id: 'VEN-' + Math.floor(1000 + Math.random() * 9000),
        time: 'Hace un momento',
        total: total,
        items: cart.reduce((sum, item) => sum + item.qty, 0),
        method: method,
        client: 'General',
        productsList: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price })),
        timestamp: Date.now()
      };
      const updatedSales = [newSale, ...salesHistory];
      setSalesHistory(updatedSales);
      await AsyncStorage.setItem(STORAGE_KEYS.SALES_HISTORY, JSON.stringify(updatedSales));

      // Helper para obtener el UID activo
      const getActiveUid = () => {
        if (auth && auth.currentUser && auth.currentUser.uid) {
          return auth.currentUser.uid;
        }
        if (loggedInUser) {
          return loggedInUser.replace(/[^a-zA-Z0-9]/g, '_');
        }
        return 'vendix_user_main';
      };

      // Sync to cloud if configured
      if (isFirebaseConfigured && db) {
        try {
          const uid = getActiveUid();
          console.log(`🔥 Sincronizando venta ${newSale.id} en Firestore para usuario (${uid})...`);
          
          // Save sale
          await setDoc(doc(db, "users", uid, "sales", newSale.id), newSale);
          
          // Update changed products in cloud
          for (const prod of updatedProducts) {
            const isCartItem = cart.some(item => item.name === prod.name);
            if (isCartItem) {
              await setDoc(doc(db, "users", uid, "products", prod.id), prod);
            }
          }
          console.log("✅ ¡Venta e inventario registrados con éxito en Firebase Firestore!");
          logSaleAnalytics(total, cart.reduce((sum, item) => sum + item.qty, 0), method);
        } catch (cloudErr) {
          console.error("⚠️ Error guardando en Firebase Firestore:", cloudErr);
        }
      }

      // 3. Clear cart
      setCart([]);
      await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));

      // 4. Alert & Go to dashboard
      Alert.alert(
        'Venta Exitosa',
        `Venta registrada exitosamente por S/ ${total.toFixed(2)} (${method}).`,
        [{ text: 'Ok', onPress: () => setCurrentRoute('dashboard') }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la venta.');
      console.error(error);
    }
  };

  // Update product stock from Dashboard Alerts
  const handleUpdateProductStock = async (prodId, qtyToAdd) => {
    try {
      const updatedProducts = products.map(p => {
        if (p.id === prodId) {
          return { ...p, stock: p.stock + qtyToAdd };
        }
        return p;
      });
      setProducts(updatedProducts);
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));

      if (isFirebaseConfigured && auth && auth.currentUser) {
        const uid = auth.currentUser.uid;
        const prod = updatedProducts.find(p => p.id === prodId);
        if (prod) {
          await setDoc(doc(db, "users", uid, "products", prod.id), prod);
        }
      }
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const handleUpdateProductsList = async (updatedList) => {
    try {
      setProducts(updatedList);
      const prodKey = getUserProductsKey(loggedInUser);
      await AsyncStorage.setItem(prodKey, JSON.stringify(updatedList));

      if (isFirebaseConfigured && db) {
        const uid = getActiveUid();
        
        // Get existing products in Cloud to check for deletions
        const productsColRef = collection(db, "users", uid, "products");
        const productsSnapshot = await getDocs(productsColRef);
        const currentCloudIds = [];
        productsSnapshot.forEach(doc => currentCloudIds.push(doc.id));
        
        // Write all current products to cloud
        for (const prod of updatedList) {
          await setDoc(doc(db, "users", uid, "products", prod.id), prod);
        }

        // Delete deleted products in cloud
        const updatedListIds = updatedList.map(p => p.id);
        for (const cloudId of currentCloudIds) {
          if (!updatedListIds.includes(cloudId)) {
            await deleteDoc(doc(db, "users", uid, "products", cloudId));
          }
        }
      }
    } catch (err) {
      console.error('Error updating products list:', err);
    }
  };

  const handleAddCategory = async (newCatName) => {
    try {
      const updatedCats = [...categories, newCatName];
      setCategories(updatedCats);
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updatedCats));
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  // Auth actions
  const handleLoginSuccess = async (userMail, userNickname) => {
    const finalMail = userMail || email || 'invitado@vendix.com';
    const displayIdentity = userNickname ? `${userNickname} (${finalMail})` : finalMail;
    setLoggedInUser(displayIdentity);
    await AsyncStorage.setItem(STORAGE_KEYS.LOGGED_USER, displayIdentity);
    await loadUserDataForAccount(finalMail);
    setCurrentRoute('dashboard');
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await auth.signOut();
      } catch (err) {
        console.error(err);
      }
    }
    setLoggedInUser('');
    setEmail('');
    setPassword('');
    setProducts([]);
    setSalesHistory([]);
    setCart([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.LOGGED_USER);
    await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    setSidebarOpen(false);
    setCurrentRoute('login');
  };

  const handleDeleteAccount = () => {
    setSidebarOpen(false);
    Alert.alert(
      '⚠️ Eliminar Cuenta Definitivamente',
      'Esta acción eliminará tu cuenta de usuario y borrará permanentemente todos tus datos, productos e historial de ventas de forma irreversible.\n\n¿Estás completamente seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, Eliminar Cuenta', 
          style: 'destructive',
          onPress: () => {
            performAccountDeletion();
          }
        }
      ]
    );
  };

  const performAccountDeletion = async () => {
    setIsDeletingAccount(true);
    try {
      // 1. Borrar datos e inventarios de la base de datos Cloud Firestore
      if (isFirebaseConfigured && db) {
        try {
          const uidsToDelete = new Set();
          if (auth && auth.currentUser && auth.currentUser.uid) {
            uidsToDelete.add(auth.currentUser.uid);
          }
          if (loggedInUser) {
            uidsToDelete.add(loggedInUser.replace(/[^a-zA-Z0-9]/g, '_'));
          }
          uidsToDelete.add('vendix_user_main');

          for (const uid of uidsToDelete) {
            try {
              // Borrar todos los productos de Firestore
              const productsColRef = collection(db, "users", uid, "products");
              const productsSnapshot = await getDocs(productsColRef);
              for (const docSnap of productsSnapshot.docs) {
                await deleteDoc(doc(db, "users", uid, "products", docSnap.id));
              }

              // Borrar todas las ventas de Firestore
              const salesColRef = collection(db, "users", uid, "sales");
              const salesSnapshot = await getDocs(salesColRef);
              for (const docSnap of salesSnapshot.docs) {
                await deleteDoc(doc(db, "users", uid, "sales", docSnap.id));
              }

              // Borrar el documento principal del usuario
              await deleteDoc(doc(db, "users", uid));
              console.log(`🔥 Datos borrados completamente de Cloud Firestore para (${uid}).`);
            } catch (delErr) {
              console.log(`Nota eliminación UID (${uid}):`, delErr);
            }
          }
        } catch (fsDelErr) {
          console.log("Nota eliminación general Firestore:", fsDelErr);
        }
      }

      // 2. Borrar cuenta de Firebase Auth
      if (isFirebaseConfigured && auth && auth.currentUser) {
        try {
          await Promise.race([
            deleteUser(auth.currentUser),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 3000))
          ]);
        } catch (fbErr) {
          console.log('Firebase user delete note:', fbErr);
          try { await auth.signOut(); } catch (e) {}
        }
      }

      // Limpiar almacenamiento de forma segura
      await AsyncStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      await AsyncStorage.removeItem(STORAGE_KEYS.SALES_HISTORY);
      await AsyncStorage.removeItem(STORAGE_KEYS.CART);
      await AsyncStorage.removeItem(STORAGE_KEYS.LOGGED_USER);
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.SALES_HISTORY, JSON.stringify([]));

      // Vaciar estados
      setProducts([]);
      setSalesHistory([]);
      setCart([]);
      setLoggedInUser('');
      setEmail('');
      setPassword('');

      // Pausa para mostrar la animación de pantalla de carga
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
    } finally {
      setIsDeletingAccount(false);
      setCurrentRoute('login');
      setTimeout(() => {
        Alert.alert('Cuenta Eliminada', 'Tu cuenta y todos tus datos se borraron correctamente.');
      }, 400);
    }
  };

  return (
    <SafeAreaView style={[styles.deviceViewport, { paddingTop: dynamicTopInset }]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* TOP NAVIGATION BAR HEADER */}
      {currentRoute !== 'splash' && currentRoute !== 'login' && currentRoute !== 'new-product' && (
        <View style={styles.navbarTop}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setSidebarOpen(true)}>
             <Menu size={24} color={THEME.colors.textWhite} />
          </TouchableOpacity>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M3 16.5 L6.5 13.5 V21 H3 V16.5 Z" fill={THEME.colors.primary} />
              <Path d="M8.5 11.5 L12 8.5 V21 H8.5 V11.5 Z" fill={THEME.colors.primary} />
              <Path d="M14 6.5 L17.5 3.5 V21 H14 V6.5 Z" fill={THEME.colors.primary} />
              <Path d="M2 18 L19.5 3" stroke={THEME.colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M13.5 3 H19.5 V9" stroke={THEME.colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.topBarLogoName}>Vendix</Text>
          </View>
          
          <TouchableOpacity onPress={() => setNotificationsModalVisible(true)}>
             <View style={{ position: 'relative' }}>
                <Bell size={22} color={THEME.colors.textWhite} />
                {getNotificationsList().length > 0 && <View style={styles.notificationDot} />}
             </View>
          </TouchableOpacity>
        </View>
      )}

      {/* RENDERIZADO DE PANTALLAS MODULARES */}
      <View style={styles.appViewContainer}>
        {currentRoute === 'splash' && (
          <SplashScreen progress={progress} isExiting={isExiting} />
        )}
        {currentRoute === 'login' && (
          <LoginScreen 
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onLoginSuccess={handleLoginSuccess} 
          />
        )}
        {currentRoute === 'dashboard' && (
          <DashboardScreen 
            onMetaClick={(route) => setCurrentRoute(route)} 
            products={products}
            salesHistory={salesHistory}
            onUpdateProductStock={handleUpdateProductStock}
            loggedInUser={loggedInUser}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
            branches={branches}
            setBranches={setBranches}
          />
        )}
        {currentRoute === 'products' && (
          <ProductosScreen 
            products={products}
            categories={categories}
            onAddProduct={handleAddProductFromCatalog} 
            onNewProductClick={() => setCurrentRoute('new-product')} 
            onUpdateProductsList={handleUpdateProductsList}
            onAddCategory={handleAddCategory}
          />
        )}
        {currentRoute === 'new-product' && (
          <NuevoProductoScreen 
            products={products}
            categories={categories}
            onSave={async (newProd) => {
              const updatedProducts = [newProd, ...products];
              setProducts(updatedProducts);
              await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
              setCurrentRoute('products');
            }}
            onCancel={() => setCurrentRoute('products')}
          />
        )}
        {currentRoute === 'sales' && (
          <SalesHistoryScreen salesHistory={salesHistory} />
        )}
        {currentRoute === 'scanner' && (
          <NuevaVentaScreen 
            products={products}
            cart={cart}
            onAddQty={handleAddQty}
            onSubQty={handleSubQty}
            onDeleteItem={handleDeleteItem}
            onScanClick={handleScanAction}
            flashActive={flashActive}
            onSearchAdd={handleSearchAdd}
            onCompleteSale={handleCompleteSale}
          />
        )}
        {currentRoute === 'reports' && (
          <ReportsScreen 
            onBack={() => setCurrentRoute('dashboard')}
            salesHistory={salesHistory}
            products={products}
            loggedUser={loggedInUser}
            onResetSalesHistory={async () => {
              try {
                await AsyncStorage.setItem(STORAGE_KEYS.SALES_HISTORY, JSON.stringify([]));
                setSalesHistory([]);
                Alert.alert('Ventas Reiniciadas', 'Las ventas acumuladas se han puesto en S/ 0.00 para iniciar tu nuevo reporte.');
              } catch (e) {
                console.error(e);
              }
            }}
          />
        )}
      </View>

      {/* BARRA DE NAVEGACIÓN INFERIOR CON RESPETO DE SAFE AREA PARA BOTONES DE ANDROID */}
      {currentRoute !== 'login' && currentRoute !== 'splash' && currentRoute !== 'new-product' && (
        <TutorialStep stepName="bottom_tab_bar">
          <View style={[
            styles.bottomTabNavigation,
            {
              paddingBottom: dynamicBottomInset,
              height: 60 + dynamicBottomInset
            }
          ]}>
            <TouchableOpacity 
              style={styles.tabItem} 
              onPress={() => setCurrentRoute('dashboard')}
            >
              <HomeIcon size={20} color={currentRoute === 'dashboard' || currentRoute === 'reports' ? THEME.colors.primary : THEME.colors.textGray} />
              <Text style={{ 
                fontSize: 11, 
                color: currentRoute === 'dashboard' || currentRoute === 'reports' ? THEME.colors.primary : THEME.colors.textGray,
                fontWeight: currentRoute === 'dashboard' || currentRoute === 'reports' ? '600' : 'normal',
                marginTop: 4 
              }}>
                Inicio
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.tabItem} 
              onPress={() => setCurrentRoute('products')}
            >
              <Package size={20} color={currentRoute === 'products' ? THEME.colors.primary : THEME.colors.textGray} />
              <Text style={{ 
                fontSize: 11, 
                color: currentRoute === 'products' ? THEME.colors.primary : THEME.colors.textGray,
                fontWeight: currentRoute === 'products' ? '600' : 'normal',
                marginTop: 4 
              }}>
                Productos
              </Text>
            </TouchableOpacity>
            
            {/* BOTÓN CENTRAL FLOTANTE NUEVA VENTA */}
            <View style={{ alignItems: 'center', marginTop: -20 }}>
              <TouchableOpacity style={styles.centerFloatingBtn} onPress={() => setCurrentRoute('scanner')}>
                <Plus size={26} color={THEME.colors.textWhite} />
              </TouchableOpacity>
              <Text style={{ fontSize: 10, color: THEME.colors.textGray, marginTop: 4 }}>Nueva venta</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.tabItem} 
              onPress={() => setCurrentRoute('sales')}
            >
              <Receipt size={20} color={currentRoute === 'sales' ? THEME.colors.primary : THEME.colors.textGray} />
              <Text style={{ 
                fontSize: 11, 
                color: currentRoute === 'sales' ? THEME.colors.primary : THEME.colors.textGray,
                fontWeight: currentRoute === 'sales' ? '600' : 'normal',
                marginTop: 4 
              }}>
                Ventas
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.tabItem} 
              onPress={resetTutorial}
            >
              <MoreHorizontal size={20} color={THEME.colors.textGray} />
              <Text style={{ fontSize: 11, color: THEME.colors.textGray, marginTop: 4 }}>Tutorial</Text>
            </TouchableOpacity>
          </View>
        </TutorialStep>
      )}

      {/* SIDEBAR DRAWER PANEL */}
      <Modal
        visible={sidebarOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={styles.sidebarOverlay}>
          <View style={styles.sidebarContent}>
            <View style={styles.sidebarHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.sidebarAvatar}>
                  <Text style={{ fontSize: 20 }}>🏪</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: THEME.colors.textWhite }}>Vendix App</Text>
                  <Text style={{ fontSize: 11, color: THEME.colors.textGray }}>{selectedBranch}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                <X size={20} color={THEME.colors.textGray} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sidebarBody}>
              <View style={{ gap: 8 }}>
                <Text style={styles.sidebarSectionTitle}>Mi Negocio</Text>
                <TouchableOpacity 
                  style={styles.sidebarMenuBtnActive}
                  onPress={() => { setSidebarOpen(false); }}
                >
                  <Text style={{ color: THEME.colors.primaryDark, fontSize: 13.5, fontWeight: '600' }}>{selectedBranch}</Text>
                  <ChevronRight size={14} color={THEME.colors.primaryDark} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.sidebarMenuBtn}
                  onPress={() => { 
                    setSidebarOpen(false); 
                    setSettingsModalOpen(true);
                  }}
                >
                  <Text style={{ color: THEME.colors.textWhite, fontSize: 13.5 }}>Configuraciones</Text>
                  <ChevronRight size={14} color={THEME.colors.textGray} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sidebarMenuBtn}
                  onPress={() => { 
                    setSidebarOpen(false); 
                    setCurrentRoute('reports'); 
                  }}
                >
                  <Text style={{ color: THEME.colors.textWhite, fontSize: 13.5 }}>Reportes e Indicadores</Text>
                  <ChevronRight size={14} color={THEME.colors.textGray} />
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 'auto', gap: 10 }}>
                <Text 
                  numberOfLines={1} 
                  style={{ fontSize: 12, color: THEME.colors.textGray, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12 }}
                >
                  {loggedInUser || 'duque@gmail.com'}
                </Text>
                <TouchableOpacity 
                  onPress={handleLogout}
                  style={styles.sidebarLogoutBtn}
                >
                  <Text style={{ color: THEME.colors.textWhite, fontSize: 13.5, fontWeight: '600', textAlign: 'center' }}>Cerrar Sesión</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleDeleteAccount}
                  style={[styles.sidebarLogoutBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#ef4444' }]}
                >
                  <Text style={{ color: THEME.colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>🗑️ Eliminar Cuenta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setSidebarOpen(false)} 
          />
        </View>
      </Modal>

      {/* CONFIGURACIONES MODAL */}
      <Modal
        visible={settingsModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSettingsModalOpen(false)}
      >
        <TouchableOpacity 
          style={styles.settingsModalOverlay}
          activeOpacity={1}
          onPress={() => setSettingsModalOpen(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation?.()} 
            style={styles.settingsModalContent}
          >
            <View style={styles.settingsModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.settingsModalIconWrapper}>
                  <Settings size={20} color={THEME.colors.primary} />
                </View>
                <Text style={styles.settingsModalTitle}>Configuraciones</Text>
              </View>
              <TouchableOpacity onPress={() => setSettingsModalOpen(false)} style={{ padding: 4 }}>
                <X size={20} color={THEME.colors.textGray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.settingsModalSubtitle}>
              Selecciona una opción de configuración:
            </Text>

            <View style={{ gap: 10, marginBottom: 16 }}>
              {/* Option 1: Tutorial */}
              <TouchableOpacity 
                style={styles.settingsOptionBtn}
                onPress={() => {
                  setSettingsModalOpen(false);
                  resetTutorial();
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <HelpCircle size={18} color={THEME.colors.primary} />
                  <Text style={styles.settingsOptionText}>Ver tutorial nuevamente</Text>
                </View>
                <ChevronRight size={16} color={THEME.colors.textGray} />
              </TouchableOpacity>

              {/* Option 2: Reset DB */}
              <TouchableOpacity 
                style={styles.settingsOptionBtn}
                onPress={() => {
                  setSettingsModalOpen(false);
                  Alert.alert(
                    'Confirmación',
                    '¿Estás seguro de que deseas borrar todos los productos y ventas? Esta acción no se puede deshacer.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { 
                        text: 'Borrar todo', 
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
                            await AsyncStorage.setItem(STORAGE_KEYS.SALES_HISTORY, JSON.stringify([]));
                            setProducts([]);
                            setSalesHistory([]);
                            Alert.alert('Éxito', 'La base de datos ha sido vaciada por completo.');
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <RotateCcw size={18} color="#f59e0b" />
                  <Text style={styles.settingsOptionText}>Restablecer base de datos (Vaciar)</Text>
                </View>
                <ChevronRight size={16} color={THEME.colors.textGray} />
              </TouchableOpacity>

              {/* Option 3: Delete Account */}
              <TouchableOpacity 
                style={[styles.settingsOptionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
                onPress={() => {
                  setSettingsModalOpen(false);
                  handleDeleteAccount();
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Trash2 size={18} color={THEME.colors.danger} />
                  <Text style={[styles.settingsOptionText, { color: THEME.colors.danger }]}>Eliminar Cuenta Definitivamente</Text>
                </View>
                <ChevronRight size={16} color={THEME.colors.danger} />
              </TouchableOpacity>
            </View>

            {/* Cancel button */}
            <TouchableOpacity 
              style={styles.settingsCancelBtn}
              onPress={() => setSettingsModalOpen(false)}
            >
              <Text style={{ color: THEME.colors.textGray, fontSize: 13.5, fontWeight: '600' }}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* CAMERA BARCODE SCANNER MODAL */}
      <Modal
        visible={cameraScannerVisible}
        animationType="slide"
        onRequestClose={() => setCameraScannerVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          <View style={styles.cameraHeader}>
            <Text style={{ color: THEME.colors.textWhite, fontSize: 18, fontWeight: '700' }}>Escáner</Text>
            <TouchableOpacity 
              onPress={() => setContinuousScan(!continuousScan)}
              style={[
                styles.btnContinuousToggle,
                continuousScan && styles.btnContinuousToggleActive
              ]}
            >
              <Text style={{ color: THEME.colors.textWhite, fontSize: 12, fontWeight: '600' }}>
                {continuousScan ? 'Continuo: ON' : 'Continuo: OFF'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCameraScannerVisible(false)} style={styles.cameraCloseBtn}>
              <X size={24} color={THEME.colors.textWhite} />
            </TouchableOpacity>
          </View>
          
          <View style={{ flex: 1, position: 'relative' }}>
            {cameraScannerVisible && Platform.OS !== 'web' ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "ean13", "ean8", "code128"],
                }}
              />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' }]}>
                <CameraIcon size={48} color={THEME.colors.textGray} />
                <Text style={{ color: THEME.colors.textWhite, marginTop: 10, fontSize: 15, fontWeight: '600' }}>Cámara no disponible en Web</Text>
              </View>
            )}
            
            <View style={styles.scannerTargetContainer}>
              <View style={styles.scannerFrameCorners}>
                <View style={styles.scannerLaserActive} />
              </View>
              <Text style={styles.scannerInstructionText}>Apunta al código de barras del producto</Text>
            </View>

            {/* Continuous Scan toast banner */}
            {scanToastMessage !== '' && (
              <View style={styles.toastBanner}>
                <Text style={styles.toastText}>{scanToastMessage}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cameraFooter}>
            <TouchableOpacity 
              style={styles.btnSimulateScan}
              onPress={() => {
                setCameraScannerVisible(false);
                runMockScan();
              }}
            >
              <Text style={{ color: THEME.colors.textWhite, fontSize: 14, fontWeight: '600' }}>Simular Escaneo (Fallback)</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* GOOGLE PLAY CAMERA REQUIREMENT EXPLANATION DIALOG */}
      <Modal
        visible={permissionExplanationVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPermissionExplanationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 320, padding: 24 }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <CameraIcon size={40} color={THEME.colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { fontSize: 19 }]}>Permiso de Cámara Requerido</Text>
            <Text style={{ color: THEME.colors.textGray, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
              Vendix requiere acceso a la cámara de tu dispositivo para poder utilizar el escáner de códigos de barra integrado y registrar ventas de productos rápidamente.
            </Text>
            <View style={{ gap: 10 }}>
              <TouchableOpacity 
                style={styles.btnPrimaryAction} 
                onPress={handleRequestCameraPermission}
              >
                <Text style={{ color: THEME.colors.textWhite, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>Habilitar Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnSecondaryCancel} 
                onPress={() => {
                  setPermissionExplanationVisible(false);
                  runMockScan();
                }}
              >
                <Text style={{ color: THEME.colors.textGray, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>Cancelar e ir a Simulación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* MODAL: NOTIFICATION CENTER */}
      <Modal
        visible={notificationsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%', maxHeight: '80%', padding: 20 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>Notificaciones</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <X size={20} color={THEME.colors.textGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ gap: 10 }}>
              {getNotificationsList().length > 0 ? (
                getNotificationsList().map((notif) => (
                  <View 
                    key={notif.id} 
                    style={{ 
                      flexDirection: 'row', 
                      gap: 12, 
                      backgroundColor: THEME.colors.inputBg, 
                      borderWidth: 1, 
                      borderColor: notif.type === 'danger' ? 'rgba(255,59,48,0.2)' : notif.type === 'warning' ? 'rgba(255,149,0,0.2)' : THEME.colors.border, 
                      borderRadius: 14, 
                      padding: 12,
                      alignItems: 'center'
                    }}
                  >
                    <View style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 18, 
                      backgroundColor: notif.type === 'danger' ? 'rgba(255,59,48,0.1)' : notif.type === 'warning' ? 'rgba(255,149,0,0.1)' : 'rgba(0,210,106,0.1)', 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}>
                      <Text style={{ fontSize: 16 }}>{notif.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: THEME.colors.textWhite, fontWeight: '700', fontSize: 13 }}>{notif.title}</Text>
                        <Text style={{ color: THEME.colors.textGray, fontSize: 10 }}>{notif.time}</Text>
                      </View>
                      <Text style={{ color: THEME.colors.textGray, fontSize: 11.5, marginTop: 2, lineHeight: 16 }}>{notif.message}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 32, marginBottom: 12 }}>🔔</Text>
                  <Text style={{ color: THEME.colors.textWhite, fontWeight: '600', fontSize: 14 }}>Sin notificaciones</Text>
                  <Text style={{ color: THEME.colors.textGray, fontSize: 12, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                    Tu negocio está al día. Las alertas de stock y metas aparecerán aquí.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.btnPrimaryAction, { width: '100%', marginTop: 15, paddingVertical: 12, backgroundColor: THEME.colors.primaryDark }]} 
              onPress={() => setNotificationsModalVisible(false)}
            >
              <Text style={{ color: THEME.colors.textWhite, fontWeight: '700', textAlign: 'center', fontSize: 14 }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DELETING ACCOUNT LOADING MODAL */}
      <Modal
        visible={isDeletingAccount}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}>
          <View style={{
            backgroundColor: THEME.colors.card,
            borderRadius: 20,
            padding: 30,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: THEME.colors.borderDark,
            maxWidth: 320,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 10
          }}>
            <ActivityIndicator size="large" color={THEME.colors.danger} style={{ marginBottom: 20 }} />
            <Text style={{ color: THEME.colors.textWhite, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
              Eliminando cuenta...
            </Text>
            <Text style={{ color: THEME.colors.textGray, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
              Borrando tu usuario, inventario y cerrando sesión de forma segura.
            </Text>
          </View>
        </View>
      </Modal>

      {currentRoute !== 'splash' && currentRoute !== 'login' && <TutorialOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  deviceViewport: { 
    flex: 1, 
    backgroundColor: THEME.colors.background, 
    paddingTop: Platform.OS === 'android' ? 30 : 0,
    height: Platform.OS === 'web' ? '100vh' : '100%'
  },
  appViewContainer: { 
    flex: 1 
  },
  navbarTop: { 
    height: 60, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    backgroundColor: THEME.colors.background, 
    borderBottomWidth: 1, 
    borderBottomColor: '#141414' 
  },
  hamburgerBtn: { 
    padding: 8, 
    marginLeft: -8 
  },
  topBarLogoName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: THEME.colors.textWhite, 
    letterSpacing: 0.5 
  },
  notificationDot: { 
    position: 'absolute', 
    top: 1, 
    right: 1, 
    width: 8, 
    height: 8, 
    backgroundColor: THEME.colors.primary, 
    borderRadius: 4, 
    borderWidth: 1.5, 
    borderColor: '#080808' 
  },

  // Bottom Navigation Bar Styles
  bottomTabNavigation: {
    backgroundColor: THEME.colors.card,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  centerFloatingBtn: {
    width: 52,
    height: 52,
    backgroundColor: THEME.colors.primaryDark,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 5,
  },

  // Sidebar Drawer Styles
  sidebarOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    flexDirection: 'row',
  },
  sidebarContent: {
    width: 280,
    height: '100%',
    backgroundColor: THEME.colors.card,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.borderDark,
    shadowColor: '#000000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderDark,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  sidebarAvatar: {
    backgroundColor: 'rgba(0, 168, 89, 0.1)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBody: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sidebarMenuBtnActive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 168, 89, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 89, 0.2)',
  },
  sidebarMenuBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  sidebarLogoutBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    padding: 10,
  },

  // Modal explanation styling
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 16,
    width: '100%',
    maxWidth: 300,
    padding: 20,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    marginBottom: 15,
    textAlign: 'center',
  },
  btnPrimaryAction: {
    backgroundColor: THEME.colors.success,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  btnSecondaryCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 16,
    padding: 16,
  },

  // Camera Modal Styles
  cameraHeader: {
    height: 60,
    backgroundColor: '#000000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cameraCloseBtn: {
    padding: 8,
  },
  scannerTargetContainer: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    height: Dimensions.get('window').height * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrameCorners: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00D26A',
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
  },
  scannerLaserActive: {
    height: 2,
    backgroundColor: THEME.colors.danger,
    position: 'absolute',
    left: 10,
    right: 10,
  },
  scannerInstructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  cameraFooter: {
    height: 80,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 15 : 0,
  },
  btnSimulateScan: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  btnContinuousToggle: {
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  btnContinuousToggleActive: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  toastBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 210, 106, 0.95)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Settings Modal Styles
  settingsModalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay || 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  settingsModalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.colors.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  settingsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsModalIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  settingsModalSubtitle: {
    fontSize: 13,
    color: THEME.colors.textGray,
    marginBottom: 18,
  },
  settingsOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.inputBg,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
  },
  settingsOptionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: THEME.colors.textWhite,
  },
  settingsCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
  }
});
