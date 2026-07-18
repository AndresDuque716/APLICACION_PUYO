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
  Dimensions
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
  Camera as CameraIcon 
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

export default function VendixApp() {
  const [currentRoute, setCurrentRoute] = useState('splash'); // 'splash', 'login', 'dashboard', 'products', 'new-product', 'sales', 'scanner', 'reports'
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  
  // Database States
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [salesHistory, setSalesHistory] = useState(INITIAL_SALES);
  const [categories, setCategories] = useState(['Todos', 'Bebidas', 'Snacks', 'Golosinas', 'Abarrotes', 'Lácteos']);
  const [cart, setCart] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Camera permissions states
  const [cameraScannerVisible, setCameraScannerVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [permissionExplanationVisible, setPermissionExplanationVisible] = useState(false);

  // Continuous scanning states
  const [continuousScan, setContinuousScan] = useState(false);
  const [scanToastMessage, setScanToastMessage] = useState('');
  const [lastScannedBarcode, setLastScannedBarcode] = useState(null);
  const [lastScannedTimestamp, setLastScannedTimestamp] = useState(0);

  // 1. Initial Load of Persisted Data
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const storedProducts = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        } else {
          await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        }

        const storedSalesHistory = await AsyncStorage.getItem(STORAGE_KEYS.SALES_HISTORY);
        if (storedSalesHistory) {
          setSalesHistory(JSON.parse(storedSalesHistory));
        } else {
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
        Alert.alert('Escaneo', 'Habilitando escaneo de simulación.');
        runMockScan();
      }
    } else {
      setPermissionExplanationVisible(true);
    }
  };

  const handleRequestCameraPermission = async () => {
    setPermissionExplanationVisible(false);
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(status === 'granted');
    if (status === 'granted') {
      setCameraScannerVisible(true);
    } else {
      Alert.alert(
        'Permiso denegado', 
        'No se pudo acceder a la cámara. Se usará el simulador.',
        [{ text: 'Entendido', onPress: runMockScan }]
      );
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
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const handleUpdateProductsList = async (updatedList) => {
    try {
      setProducts(updatedList);
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedList));
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
  const handleLoginSuccess = async () => {
    const userMail = email || 'duque@gmail.com';
    setLoggedInUser(userMail);
    await AsyncStorage.setItem(STORAGE_KEYS.LOGGED_USER, userMail);
    setCurrentRoute('dashboard');
  };

  const handleLogout = async () => {
    setLoggedInUser('');
    setEmail('');
    setPassword('');
    setCart([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.LOGGED_USER);
    await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    setSidebarOpen(false);
    setCurrentRoute('login');
  };

  return (
    <SafeAreaView style={styles.deviceViewport}>
      <StatusBar style="light" backgroundColor={THEME.colors.background} />

      {/* HEADER PRINCIPAL */}
      {currentRoute !== 'login' && currentRoute !== 'splash' && currentRoute !== 'new-product' && (
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
          
          <TouchableOpacity onPress={() => Alert.alert('Notificaciones', 'No tienes notificaciones pendientes.')}>
             <View style={{ position: 'relative' }}>
               <Bell size={22} color={THEME.colors.textWhite} />
               <View style={styles.notificationDot} />
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
          />
        )}
      </View>

      {/* BARRA DE NAVEGACIÓN INFERIOR */}
      {currentRoute !== 'login' && currentRoute !== 'splash' && currentRoute !== 'new-product' && (
        <View style={styles.bottomTabNavigation}>
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
            onPress={() => Alert.alert('Más', 'Más opciones próximamente.')}
          >
            <MoreHorizontal size={20} color={THEME.colors.textGray} />
            <Text style={{ fontSize: 11, color: THEME.colors.textGray, marginTop: 4 }}>Más</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SIDEBAR DRAWER PANEL */}
      <Modal
        visible={sidebarOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setSidebarOpen(false)} 
          />
          
          <View style={styles.sidebarContent}>
            <View style={styles.sidebarHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.sidebarAvatar}>
                  <Text style={{ fontSize: 20 }}>🏪</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: THEME.colors.textWhite }}>Vendix Pucallpa</Text>
                  <Text style={{ fontSize: 11, color: THEME.colors.textGray }}>Sucursal Principal</Text>
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
                  onPress={() => { setSidebarOpen(false); Alert.alert('Sucursal', 'Sucursal Principal seleccionada.'); }}
                >
                  <Text style={{ color: THEME.colors.primaryDark, fontSize: 13.5, fontWeight: '600' }}>Sucursal Pucallpa</Text>
                  <ChevronRight size={14} color={THEME.colors.primaryDark} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.sidebarMenuBtn}
                  onPress={() => { setSidebarOpen(false); Alert.alert('Configuraciones', 'Configuraciones de negocio abiertas.'); }}
                >
                  <Text style={{ color: THEME.colors.textWhite, fontSize: 13.5 }}>Configuraciones</Text>
                  <ChevronRight size={14} color={THEME.colors.textGray} />
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 'auto', gap: 12 }}>
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
                  <Text style={{ color: THEME.colors.danger, fontSize: 13.5, fontWeight: '600', textAlign: 'center' }}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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
    height: 70,
    backgroundColor: THEME.colors.card,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 15 : 5,
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
  }
});
