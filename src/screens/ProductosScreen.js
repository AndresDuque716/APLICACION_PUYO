import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Alert, 
  Modal, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { 
  Search, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Pencil, 
  Trash2, 
  Plus, 
  Camera as CameraIcon, 
  Check, 
  X, 
  Scan,
  MoreHorizontal
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '../constants/theme';
import TutorialStep from '../components/TutorialStep';

const CATEGORY_EMOJIS = {
  'Todos': '📋',
  'Bebidas': '🥤',
  'Snacks': '🥔',
  'Golosinas': '🍫',
  'Abarrotes': '🍚',
  'Lácteos': '🥛',
  'Limpieza': '🧼',
  'Otros': '📦',
};

const VISIBLE_CATEGORY_COUNT = 6;

export default function ProductosScreen({ 
  products = [], 
  categories = ['Todos', 'Bebidas', 'Snacks', 'Golosinas', 'Abarrotes', 'Lácteos'],
  onAddProduct, 
  onNewProductClick,
  onUpdateProductsList,
  onAddCategory,
  onDeleteCategory
}) {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Category prompt state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📦');
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const emojiInputRef = useRef(null);
  const tempEmojiRef = useRef('');
  const [customEmojis, setCustomEmojis] = useState({});
  const [allCategoriesModalVisible, setAllCategoriesModalVisible] = useState(false);
  const [deleteCategoriesMode, setDeleteCategoriesMode] = useState(false);

  // Editing state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editImage, setEditImage] = useState('');
  
  // Pickers & camera modals
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);

  // Dynamic Pagination & Sorting states
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'price-asc', 'price-desc', 'stock-asc', 'stock-desc'
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Reset to first page when filters or sorting options change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoriaActiva, searchQuery, sortBy]);

  // Load custom emojis from storage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@vendix_custom_emojis');
        if (saved) setCustomEmojis(JSON.parse(saved));
      } catch (e) {}
    })();
  }, []);

  const mergedEmojis = { ...CATEGORY_EMOJIS, ...customEmojis };

  // Filter and Sort products dynamically
  const getSortedAndFilteredProducts = () => {
    const list = [...products].filter(p => {
      const matchesCategory = categoriaActiva === 'Todos' || p.category === categoriaActiva;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.barcode.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });

    if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock-asc') {
      list.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'stock-desc') {
      list.sort((a, b) => b.stock - a.stock);
    }
    return list;
  };

  const sortedAndFilteredProducts = getSortedAndFilteredProducts();
  const totalPages = Math.ceil(sortedAndFilteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = sortedAndFilteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Category counts builder dynamically
  const getCategoryCount = (catName) => {
    if (catName === 'Todos') return products.length;
    return products.filter(p => p.category === catName).length;
  };

  // Open product editor
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category);
    setEditPrice(product.price.toString());
    setEditStock(product.stock.toString());
    setEditBarcode(product.barcode);
    setEditImage(product.image);
  };

  // Quick direct delete action from row
  const handleQuickDelete = (product) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de que deseas eliminar permanentemente "${product.name}" del catálogo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: () => {
            const updated = products.filter(p => p.id !== product.id);
            onUpdateProductsList(updated);
            Alert.alert('Éxito', 'Producto eliminado.');
          }
        }
      ]
    );
  };

  const handleBarcodeGenerate = () => {
    let code;
    let isDuplicate = true;
    while (isDuplicate) {
      code = "775" + Math.floor(1000000000 + Math.random() * 9000000000);
      // Ensure generated code doesn't collide, except for current product code itself
      isDuplicate = products.some(p => p.barcode === code && p.id !== editingProduct.id);
    }
    setEditBarcode(code);
  };

  const handleBarcodeScanPress = async () => {
    const { status } = await Camera.getCameraPermissionsAsync();
    if (status === 'granted') {
      setBarcodeScannerVisible(true);
    } else {
      const requestResult = await Camera.requestCameraPermissionsAsync();
      if (requestResult.status === 'granted') {
        setBarcodeScannerVisible(true);
      } else {
        Alert.alert('Permiso Requerido', 'Se necesita acceso a la cámara para escanear el código.');
      }
    }
  };

  const handleBarcodeScanned = ({ type, data }) => {
    setBarcodeScannerVisible(false);
    setEditBarcode(data);
    Alert.alert('Código Escaneado', `Código asignado: ${data}`);
  };

  // Pick Image handlers
  const handlePickImage = () => {
    Alert.alert(
      'Imagen del Producto',
      'Elige una opción para actualizar la foto:',
      [
        { text: 'Tomar Foto', onPress: takePhoto },
        { text: 'Seleccionar de Galería', onPress: pickImageFromGallery },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Requerido', 'Vendix necesita acceso a la cámara.');
      return;
    }
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setEditImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Requerido', 'Vendix necesita acceso a tu galería.');
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setEditImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
    }
  };



  // Delete product action
  const handleDeleteProduct = () => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de que deseas eliminar permanentemente "${editingProduct.name}" del catálogo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: () => {
            const updated = products.filter(p => p.id !== editingProduct.id);
            onUpdateProductsList(updated);
            setEditingProduct(null);
            Alert.alert('Producto Eliminado', 'El producto ha sido eliminado del catálogo.');
          } 
        }
      ]
    );
  };

  // Save modified product
  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Por favor, ingresa el nombre.');
      return;
    }
    if (!editPrice || parseFloat(editPrice) < 0 || isNaN(parseFloat(editPrice))) {
      Alert.alert('Error', 'Por favor, ingresa un precio de venta válido.');
      return;
    }
    if (!editStock || parseInt(editStock) < 0 || isNaN(parseInt(editStock))) {
      Alert.alert('Error', 'Por favor, ingresa un stock válido.');
      return;
    }

    const finalBarcode = editBarcode.trim();
    if (!finalBarcode) {
      Alert.alert('Error', 'El código de barras es requerido.');
      return;
    }

    // Barcode unique validation
    const isDuplicate = products.some(p => p.barcode === finalBarcode && p.id !== editingProduct.id);
    if (isDuplicate) {
      Alert.alert('Código Duplicado', 'El código de barras ya pertenece a otro producto en tu catálogo.');
      return;
    }

    const categoryAvatars = mergedEmojis;

    const categoryImages = {
      Bebidas: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop',
      Snacks: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=600&auto=format&fit=crop',
      Golosinas: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=600&auto=format&fit=crop',
      Abarrotes: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop',
      Lácteos: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=600&auto=format&fit=crop',
      Limpieza: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=600&auto=format&fit=crop',
      Otro: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop'
    };

    const finalImage = editImage.trim() || categoryImages[editCategory] || categoryImages.Otro;

    const updatedProduct = {
      ...editingProduct,
      name: editName.trim(),
      category: editCategory,
      price: parseFloat(editPrice),
      stock: parseInt(editStock),
      barcode: finalBarcode,
      image: finalImage,
      avatar: categoryAvatars[editCategory] || '📦'
    };

    const updatedList = products.map(p => p.id === editingProduct.id ? updatedProduct : p);
    onUpdateProductsList(updatedList);
    setEditingProduct(null);
    Alert.alert('Éxito', 'Cambios guardados correctamente.');
  };

  // Add category handler
  const handleAddNewCategory = () => {
    const nameClean = newCategoryName.trim();
    if (!nameClean) return;
    
    // Check if category already exists
    const exists = categories.some(cat => cat.toLowerCase() === nameClean.toLowerCase());
    if (exists) {
      Alert.alert('Categoría Existente', 'Esa categoría ya está registrada.');
      return;
    }

    onAddCategory(nameClean);
    
    // Save emoji mapping
    const updatedEmojis = { ...customEmojis, [nameClean]: selectedEmoji };
    setCustomEmojis(updatedEmojis);
    AsyncStorage.setItem('@vendix_custom_emojis', JSON.stringify(updatedEmojis));
    
    setNewCategoryName('');
    setSelectedEmoji('📦');
    setCategoryModalVisible(false);
    Alert.alert('Categoría Creada', `Categoría "${nameClean}" registrada exitosamente.`);
  };

  // Delete category handler
  const handleDeleteCategory = (catName) => {
    if (catName === 'Todos') return;
    
    const productsInCategory = products.filter(p => p.category === catName).length;
    const message = productsInCategory > 0
      ? `Hay ${productsInCategory} producto(s) en "${catName}". ¿Deseas eliminar la categoría? Los productos no se eliminarán.`
      : `¿Eliminar la categoría "${catName}"?`;

    Alert.alert(
      'Eliminar Categoría',
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            onDeleteCategory(catName);
            if (categoriaActiva === catName) {
              setCategoriaActiva('Todos');
            }
            Alert.alert('Eliminada', `Categoría "${catName}" eliminada.`);
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.headerBiblioteca}>
          <View>
            <Text style={styles.pageTitleText}>Productos</Text>
            <Text style={styles.subtextHeader}>Total: {products.length} productos</Text>
          </View>
          <TutorialStep stepName="new_product_btn">
            <TouchableOpacity style={styles.btnAñadirProducto} onPress={onNewProductClick}>
              <Text style={{ color: THEME.colors.textWhite, fontWeight: 'bold', fontSize: 13 }}>+ Nuevo producto</Text>
            </TouchableOpacity>
          </TutorialStep>
        </View>

        {/* Search */}
        <View style={styles.searchRowContainer}>
          <View style={styles.searchBarContainerExpanded}>
            <Search size={18} color={THEME.colors.textGray} />
            <TextInput 
              placeholder="Buscar producto..." 
              placeholderTextColor={THEME.colors.textGray}
              style={styles.searchInputText} 
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.btnFiltroIcon} onPress={() => setSortModalVisible(true)}>
            <SlidersHorizontal size={16} color={THEME.colors.textWhite} />
            <Text style={{ color: THEME.colors.textWhite, fontSize: 13 }}>Filtros</Text>
          </TouchableOpacity>
        </View>
 
        {/* Categories Carousel */}
        <View style={styles.categoriesSectionContainer}>
          <Text style={styles.inputLabel}>CATEGORÍAS</Text>
          <View style={styles.categoriesRow}>
            <View style={styles.categoriesScrollWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: 8 }}
              >
                {categories.map((cat) => {
                  const emoji = mergedEmojis[cat] || '📦';
                  const isActive = categoriaActiva === cat;
                  return (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => setCategoriaActiva(cat)}
                      style={[
                        styles.categoryCard,
                        isActive && styles.categoryCardActive
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.categoryEmojiCircle,
                        { backgroundColor: isActive ? '#22B15B25' : THEME.colors.inputBg }
                      ]}>
                        <Text style={styles.categoryEmojiText}>{emoji}</Text>
                      </View>
                      <Text style={[
                        styles.categoryCardLabel,
                        isActive && styles.categoryCardLabelActive
                      ]}>
                        {cat}
                      </Text>
                      <View style={[
                        styles.categoryCountBadge,
                        { backgroundColor: isActive ? '#22B15B30' : 'rgba(255,255,255,0.08)' }
                      ]}>
                        <Text style={[
                          styles.categoryCountText,
                          isActive && { color: THEME.colors.primary }
                        ]}>
                          {getCategoryCount(cat)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.categoryActionsColumn}>
              <TouchableOpacity 
                style={styles.btnAllCategories}
                onPress={() => setAllCategoriesModalVisible(true)}
                activeOpacity={0.7}
              >
                <MoreHorizontal size={16} color={THEME.colors.textGray} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnAddCatCircle}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Plus size={16} color={THEME.colors.textWhite} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
 
        {/* List Grid of Products */}
        <TutorialStep stepName="products_view">
          <View style={styles.productRowsListContainer}>
            {paginatedProducts.map((prod) => {
              const isOutOfStock = prod.stock === 0;
              const isLowStock = prod.stock > 0 && prod.stock <= 5;
              return (
                <View 
                  key={prod.id} 
                  style={[styles.productListItemRow, { opacity: isOutOfStock ? 0.65 : 1 }]}
                >
                  <TouchableOpacity 
                    activeOpacity={isOutOfStock ? 0.8 : 0.6}
                    style={styles.productListLeftSection}
                    onPress={() => {
                      if (prod.stock > 0) {
                        onAddProduct(prod);
                        Alert.alert('Catálogo', `${prod.name} agregado a la venta.`);
                      } else {
                        Alert.alert('Alerta', 'Este producto no tiene stock disponible.');
                      }
                    }}
                  >
                    <Image source={{ uri: prod.image }} style={styles.productRowThumbnailImage} />
                    <View style={styles.productRowDetailsBlock}>
                      <Text style={styles.productRowTitleName} numberOfLines={1} ellipsisMode="tail">
                        {prod.name}
                      </Text>
                      <View style={styles.productRowSubDetails}>
                        <Text style={styles.productRowCategoryLabel}>{prod.category}</Text>
                        <Text style={styles.productRowDivider}>•</Text>
                        <Text style={styles.productRowBarcodeText} numberOfLines={1} ellipsisMode="tail">
                          {prod.barcode ? `Cod: ${prod.barcode}` : 'Sin código'}
                        </Text>
                      </View>
                      {isOutOfStock && (
                        <View style={styles.badgeWrapper}>
                          <Text style={[styles.stockBadge, { backgroundColor: 'rgba(255,59,48,0.15)', color: '#FF3B30' }]}>
                            Agotado
                          </Text>
                        </View>
                      )}
                      {isLowStock && (
                        <View style={styles.badgeWrapper}>
                          <Text style={[styles.stockBadge, { backgroundColor: 'rgba(255,149,0,0.15)', color: '#FF9500' }]}>
                            Bajo Stock ({prod.stock})
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.productListRightSection}>
                    <View style={styles.productRowStockBlock}>
                      <Text style={styles.stockLabelTitle}>Stock</Text>
                      <Text style={prod.stock <= 5 ? styles.stockValueAlertNumber : styles.stockValueNormalNumber}>
                        {prod.stock}
                      </Text>
                    </View>
                    <Text style={styles.productRowPriceValue}>S/ {prod.price.toFixed(2)}</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      {/* Edit Pencil Icon button */}
                      <TouchableOpacity 
                        style={styles.btnEditProductRow} 
                        onPress={() => handleOpenEdit(prod)}
                      >
                        <Pencil size={12} color={THEME.colors.textWhite} />
                      </TouchableOpacity>
                      
                      {/* Quick Delete Trash button */}
                      <TouchableOpacity 
                        style={[styles.btnEditProductRow, { backgroundColor: 'rgba(255,59,48,0.12)', borderColor: 'rgba(255,59,48,0.2)', borderWidth: 1 }]} 
                        onPress={() => handleQuickDelete(prod)}
                      >
                        <Trash2 size={12} color={THEME.colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
            {paginatedProducts.length === 0 && (
              <Text style={{ color: THEME.colors.textGray, textAlign: 'center', marginVertical: 30 }}>
                No hay productos en esta sección.
              </Text>
            )}
          </View>
        </TutorialStep>
 
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <View style={styles.paginationFooterRow}>
            <TouchableOpacity 
              style={[styles.arrowPaginationBtn, currentPage === 1 && { opacity: 0.4 }]} 
              disabled={currentPage === 1}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} color={THEME.colors.textWhite} />
            </TouchableOpacity>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = currentPage === pageNum;
              return (
                <TouchableOpacity 
                  key={pageNum}
                  style={isActive ? styles.pageNumberBtnActive : styles.pageNumberBtn} 
                  onPress={() => setCurrentPage(pageNum)}
                >
                  <Text style={{ 
                    color: isActive ? THEME.colors.textWhite : THEME.colors.textGray, 
                    fontWeight: isActive ? '700' : '600', 
                    fontSize: 13 
                  }}>
                    {pageNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity 
              style={[styles.arrowPaginationBtn, currentPage === totalPages && { opacity: 0.4 }]} 
              disabled={currentPage === totalPages}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight size={16} color={THEME.colors.textWhite} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MODAL: ADD CUSTOM CATEGORY */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Categoría</Text>

            <TouchableOpacity
              style={styles.emojiSelectorBtn}
              onPress={() => setEmojiPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiSelectorEmoji}>{selectedEmoji}</Text>
              <Text style={styles.emojiSelectorLabel}>Tocar para cambiar emoji</Text>
            </TouchableOpacity>
            
            <View style={styles.inputFieldContainer}>
              <TextInput 
                placeholder="Ej. Limpieza" 
                placeholderTextColor={THEME.colors.textGray}
                style={styles.inputFieldOnly}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.modalBtn, { flex: 1, backgroundColor: THEME.colors.success }]} 
                onPress={handleAddNewCategory}
              >
                <Text style={styles.modalBtnText}>Agregar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.colors.borderDark }]} 
                onPress={() => { setCategoryModalVisible(false); setNewCategoryName(''); }}
              >
                <Text style={{ color: THEME.colors.textGray, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: EMOJI PICKER */}
      <Modal
        visible={emojiPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEmojiPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEmojiPickerVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.emojiPickerContent}>
            <Text style={styles.modalTitle}>Elige un Emoji</Text>
            <Text style={{ color: THEME.colors.textGray, fontSize: 12, textAlign: 'center', marginBottom: 14 }}>
              Escribe o pega un solo carácter (emoji o letra)
            </Text>

            <View style={styles.emojiInputPreview}>
              <Text style={styles.emojiInputPreviewEmoji}>{selectedEmoji}</Text>
            </View>

            <View style={styles.emojiInputContainer}>
              <TextInput
                ref={emojiInputRef}
                style={styles.emojiInputField}
                placeholder="Escribe aquí"
                placeholderTextColor={THEME.colors.textGray}
                autoFocus
                textAlign="center"
                multiline={false}
                numberOfLines={1}
                onChangeText={(text) => {
                  const graphemes = [...text];
                  const firstChar = graphemes[0] || '';
                  tempEmojiRef.current = firstChar;
                  setSelectedEmoji(firstChar || '📦');
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1, backgroundColor: THEME.colors.success }]}
                onPress={() => {
                  const text = tempEmojiRef.current;
                  if (text && text.length > 0) {
                    const graphemes = [...text];
                    setSelectedEmoji(graphemes[graphemes.length - 1]);
                  }
                  setEmojiPickerVisible(false);
                }}
              >
                <Text style={styles.modalBtnText}>Listo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.colors.borderDark }]}
                onPress={() => { setSelectedEmoji('📦'); setEmojiPickerVisible(false); }}
              >
                <Text style={{ color: THEME.colors.textGray, fontWeight: '600' }}>Reset</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: ALL CATEGORIES SELECTOR */}
      <Modal
        visible={allCategoriesModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { setAllCategoriesModalVisible(false); setDeleteCategoriesMode(false); }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setAllCategoriesModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.allCategoriesModalContent}>
            <Text style={styles.modalTitle}>Todas las Categorías</Text>
            <Text style={{ color: THEME.colors.textGray, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
              Selecciona una categoría para filtrar productos
            </Text>
            
            <TouchableOpacity
              style={[styles.deleteModeBtn, deleteCategoriesMode && styles.deleteModeBtnActive]}
              onPress={() => setDeleteCategoriesMode(!deleteCategoriesMode)}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color={deleteCategoriesMode ? '#FFFFFF' : THEME.colors.danger} />
              <Text style={[styles.deleteModeBtnText, deleteCategoriesMode && { color: '#FFFFFF' }]}>
                {deleteCategoriesMode ? 'Cancelar' : 'Eliminar Categorías'}
              </Text>
            </TouchableOpacity>
            
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={styles.allCategoriesGrid}>
                {categories.map((cat) => {
                  const emoji = mergedEmojis[cat] || '📦';
                const isActive = categoriaActiva === cat;
                const isProtected = cat === 'Todos';
                return (
                  <View key={cat} style={styles.allCategoryItemWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.allCategoryItem,
                        isActive && { borderColor: THEME.colors.primary, backgroundColor: '#22B15B18' }
                      ]}
                      onPress={() => {
                        setCategoriaActiva(cat);
                        setAllCategoriesModalVisible(false);
                        setDeleteCategoriesMode(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.allCategoryEmoji}>{emoji}</Text>
                      <Text style={[
                        styles.allCategoryLabel,
                        isActive && { color: THEME.colors.primary, fontWeight: '700' }
                      ]}>
                        {cat}
                      </Text>
                      <Text style={styles.allCategoryCount}>{getCategoryCount(cat)}</Text>
                      {isActive && (
                        <View style={styles.allCategoryCheck}>
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                    {!isProtected && deleteCategoriesMode && (
                      <TouchableOpacity
                        style={styles.allCategoryDeleteBtn}
                        onPress={() => handleDeleteCategory(cat)}
                        activeOpacity={0.6}
                      >
                        <Trash2 size={10} color={THEME.colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalBtn, { width: '100%', marginTop: 16, backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.colors.borderDark }]} 
              onPress={() => { setAllCategoriesModalVisible(false); setDeleteCategoriesMode(false); }}
            >
              <Text style={{ color: THEME.colors.textGray, fontWeight: '600', textAlign: 'center' }}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: SORT & FILTER OPTIONS */}
      <Modal
        visible={sortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sortModalContent}>
            
            <View style={styles.sortModalHeader}>
              <View style={styles.sortModalIconCircle}>
                <SlidersHorizontal size={20} color={THEME.colors.primary} />
              </View>
              <View>
                <Text style={styles.sortModalTitle}>Filtrar y Ordenar</Text>
                <Text style={styles.sortModalSubtitle}>Ordena tu lista de productos</Text>
              </View>
            </View>

            <View style={styles.sortModalDivider} />

            <Text style={styles.sortModalSectionLabel}>ORDENAR POR</Text>

            {[
              { label: 'Nombre (A - Z)', value: 'name-asc', icon: '🔤' },
              { label: 'Menor Precio', value: 'price-asc', icon: '💵' },
              { label: 'Mayor Precio', value: 'price-desc', icon: '💰' },
              { label: 'Menor Stock', value: 'stock-asc', icon: '📉' },
              { label: 'Mayor Stock', value: 'stock-desc', icon: '📈' }
            ].map((option) => {
              const isSelected = sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.sortOptionItem, isSelected && styles.sortOptionItemActive]}
                  onPress={() => {
                    setSortBy(option.value);
                    setSortModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sortOptionIcon}>{option.icon}</Text>
                  <Text style={[styles.sortOptionLabel, isSelected && { color: THEME.colors.primary, fontWeight: '700' }]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.sortOptionCheck}>
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity 
              style={styles.sortModalCloseBtn} 
              onPress={() => setSortModalVisible(false)}
            >
              <Text style={{ color: THEME.colors.textGray, fontWeight: '600', textAlign: 'center' }}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: EDIT PRODUCT DETAILS */}
      <Modal
        visible={editingProduct !== null}
        animationType="slide"
        onRequestClose={() => setEditingProduct(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: THEME.colors.background }}>
          <View style={styles.editHeader}>
            <Text style={styles.editHeaderTitle}>Editar Producto</Text>
            <TouchableOpacity onPress={() => setEditingProduct(null)}>
              <X size={24} color={THEME.colors.textWhite} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              
              {/* Image Picker */}
              <TouchableOpacity 
                style={styles.imageUploadBox}
                onPress={handlePickImage}
              >
                {editImage ? (
                  <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <Image source={{ uri: editImage }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    <View style={styles.changeImageOverlay}>
                      <Text style={{ color: THEME.colors.success, fontSize: 12, fontWeight: '700' }}>Cambiar foto del producto</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <CameraIcon size={28} color={THEME.colors.success} />
                    <Text style={{ color: THEME.colors.textGray, fontSize: 13, fontWeight: '500' }}>+ Cargar imagen del producto</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* URL de Imagen */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>URL DE LA IMAGEN (OPCIONAL)</Text>
                <View style={styles.inputFieldContainer}>
                  <TextInput 
                    placeholder="https://ejemplo.com/imagen.jpg" 
                    placeholderTextColor={THEME.colors.textGray}
                    style={styles.inputFieldOnly} 
                    value={editImage} 
                    onChangeText={setEditImage}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              </View>

              <View style={{ gap: 16, marginTop: 20 }}>
                {/* Nombre */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NOMBRE DEL PRODUCTO</Text>
                  <View style={styles.inputFieldContainer}>
                    <TextInput 
                      placeholder="Ej. Coca Cola 1L" 
                      placeholderTextColor={THEME.colors.textGray}
                      style={styles.inputFieldOnly} 
                      value={editName} 
                      onChangeText={setEditName}
                    />
                  </View>
                </View>

                {/* Categoría */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CATEGORÍA</Text>
                  <TouchableOpacity 
                    style={[styles.inputFieldContainer, { justifyContent: 'space-between', paddingRight: 14 }]}
                    onPress={() => setShowCategoryPicker(true)}
                  >
                    <Text style={{ color: THEME.colors.textWhite, fontSize: 14 }}>{editCategory}</Text>
                    <ChevronDown size={16} color={THEME.colors.textGray} />
                  </TouchableOpacity>
                </View>

                {/* Código de barras */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CÓDIGO DE BARRAS / SKU</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={[styles.inputFieldContainer, { flex: 1 }]}>
                      <TextInput 
                        placeholder="Ej. 7750101001234" 
                        placeholderTextColor={THEME.colors.textGray}
                        style={styles.inputFieldOnly} 
                        value={editBarcode} 
                        onChangeText={setEditBarcode}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <TouchableOpacity 
                      onPress={handleBarcodeScanPress}
                      style={styles.btnBarcodeScan}
                    >
                      <Scan size={18} color={THEME.colors.textWhite} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={handleBarcodeGenerate}
                      style={styles.btnBarcodeGenerate}
                    >
                      <Text style={{ color: THEME.colors.success, fontSize: 12, fontWeight: '600' }}>Generar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Precio y Stock */}
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>PRECIO DE VENTA (S/)</Text>
                    <View style={styles.inputFieldContainer}>
                      <TextInput 
                        placeholder="0.00" 
                        placeholderTextColor={THEME.colors.textGray}
                        style={styles.inputFieldOnly} 
                        value={editPrice} 
                        onChangeText={setEditPrice}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>STOCK ACTUAL</Text>
                    <View style={styles.inputFieldContainer}>
                      <TextInput 
                        placeholder="0" 
                        placeholderTextColor={THEME.colors.textGray}
                        style={styles.inputFieldOnly} 
                        value={editStock} 
                        onChangeText={setEditStock}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </View>

                {/* Guardar / Eliminar Botones */}
                <View style={{ gap: 10, marginTop: 15 }}>
                  <TouchableOpacity style={styles.btnPrimaryAction} onPress={handleSaveEdit}>
                    <Text style={styles.btnText}>Guardar Cambios</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.btnDeleteProduct} 
                    onPress={handleDeleteProduct}
                  >
                    <Trash2 size={18} color={THEME.colors.textWhite} style={{ marginRight: 6 }} />
                    <Text style={styles.btnText}>Eliminar Producto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Modal edit category picker */}
        <Modal
          visible={showCategoryPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCategoryPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona una Categoría</Text>
              <ScrollView>
                {/* Exclude 'Todos' from category creation pickers */}
                {categories.filter(c => c !== 'Todos').map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={styles.categoryItem} 
                    onPress={() => {
                      setEditCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={{ color: THEME.colors.textWhite, fontSize: 16 }}>{cat}</Text>
                    {editCategory === cat && <Check size={18} color={THEME.colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Local Barcode Scanner Modal inside Editor */}
        <Modal
          visible={barcodeScannerVisible}
          animationType="slide"
          onRequestClose={() => setBarcodeScannerVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <View style={styles.cameraHeader}>
              <Text style={{ color: THEME.colors.textWhite, fontSize: 18, fontWeight: '700' }}>Escanear Código</Text>
              <TouchableOpacity onPress={() => setBarcodeScannerVisible(false)} style={styles.cameraCloseBtn}>
                <X size={24} color={THEME.colors.textWhite} />
              </TouchableOpacity>
            </View>
            
            <View style={{ flex: 1, position: 'relative' }}>
              {barcodeScannerVisible && Platform.OS !== 'web' ? (
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
            </View>
          </SafeAreaView>
        </Modal>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBiblioteca: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pageTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  subtextHeader: {
    fontSize: 12,
    color: THEME.colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  btnAñadirProducto: {
    backgroundColor: THEME.colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  searchRowContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  searchBarContainerExpanded: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flex: 1,
  },
  searchInputText: {
    flex: 1,
    color: THEME.colors.textWhite,
    fontSize: 14,
    padding: 0,
  },
  btnFiltroIcon: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoriesSectionContainer: {
    marginBottom: 16,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  categoriesScrollWrapper: {
    flex: 1,
  },
  categoryCard: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
    minWidth: 68,
  },
  categoryCardActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#00d26a18',
  },
  categoryEmojiCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmojiText: {
    fontSize: 14,
    color: THEME.colors.primary,
  },
  categoryCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textGray,
    textAlign: 'center',
  },
  categoryCardLabelActive: {
    color: THEME.colors.textWhite,
    fontWeight: '700',
  },
  categoryCountBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  categoryCountText: {
    color: THEME.colors.textGray,
    fontSize: 9,
    fontWeight: '700',
  },
  categoryActionsColumn: {
    gap: 6,
  },
  btnAllCategories: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAddCatCircle: {
    backgroundColor: THEME.colors.success,
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allCategoriesModalContent: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 14,
    width: '100%',
    maxWidth: 320,
    padding: 16,
    maxHeight: 420,
  },
  allCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allCategoryItemWrapper: {
    width: '30%',
    minWidth: 82,
    position: 'relative',
  },
  deleteModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.4)',
    backgroundColor: 'rgba(255,59,48,0.1)',
    marginBottom: 14,
    alignSelf: 'center',
  },
  deleteModeBtnActive: {
    backgroundColor: THEME.colors.danger,
    borderColor: THEME.colors.danger,
  },
  deleteModeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.danger,
  },
  emojiSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    backgroundColor: THEME.colors.inputBg,
  },
  emojiSelectorEmoji: {
    fontSize: 32,
  },
  emojiSelectorLabel: {
    fontSize: 12,
    color: THEME.colors.textGray,
  },
  emojiPickerContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: '88%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  emojiInputPreview: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  emojiInputPreviewEmoji: {
    fontSize: 44,
  },
  emojiInputContainer: {
    backgroundColor: THEME.colors.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
  },
  emojiInputField: {
    fontSize: 36,
    paddingVertical: 12,
    color: THEME.colors.textWhite,
  },
  allCategoryItem: {
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  allCategoryEmoji: {
    fontSize: 18,
    marginBottom: 3,
  },
  allCategoryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textWhite,
    textAlign: 'center',
  },
  allCategoryCount: {
    fontSize: 9,
    color: THEME.colors.textGray,
    marginTop: 1,
  },
  allCategoryCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allCategoryDeleteBtn: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,59,48,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productRowsListContainer: {
    gap: 10,
    marginBottom: 20,
  },
  productListItemRow: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productListLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  productRowThumbnailImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: THEME.colors.inputBg,
  },
  productRowDetailsBlock: {
    gap: 3,
    flex: 1,
    justifyContent: 'center',
  },
  productRowTitleName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  productRowSubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  productRowCategoryLabel: {
    color: THEME.colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  productRowDivider: {
    color: THEME.colors.textGray,
    fontSize: 10,
  },
  productRowBarcodeText: {
    color: THEME.colors.textGray,
    fontSize: 11,
    flexShrink: 1,
  },
  badgeWrapper: {
    flexDirection: 'row',
    marginTop: 2,
  },
  productListRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productRowStockBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  stockLabelTitle: {
    fontSize: 10,
    color: THEME.colors.textGray,
    textTransform: 'uppercase',
  },
  stockValueNormalNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  stockValueAlertNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.warning,
  },
  productRowPriceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    width: 54,
    textAlign: 'right',
  },
  btnEditProductRow: {
    backgroundColor: THEME.colors.borderDark,
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  paginationFooterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  pageNumberBtn: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberBtnActive: {
    backgroundColor: THEME.colors.success,
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPaginationBtn: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationEllipsis: {
    color: '#48484A',
    paddingHorizontal: 4,
  },

  // Modal styling
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
  inputFieldContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
  },
  inputFieldOnly: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: THEME.colors.textWhite,
    fontSize: 14,
  },
  modalBtn: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: THEME.colors.textWhite,
    fontWeight: '700',
  },
  sortModalContent: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 20,
    width: '88%',
    maxWidth: 320,
    padding: 20,
  },
  sortModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sortModalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22B15B18',
    borderWidth: 1,
    borderColor: '#22B15B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  sortModalSubtitle: {
    fontSize: 12,
    color: THEME.colors.textGray,
    marginTop: 2,
  },
  sortModalDivider: {
    height: 1,
    backgroundColor: THEME.colors.borderDark,
    marginBottom: 14,
  },
  sortModalSectionLabel: {
    color: THEME.colors.textGray,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  sortOptionItemActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#22B15B12',
  },
  sortOptionIcon: {
    fontSize: 16,
  },
  sortOptionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: THEME.colors.textWhite,
  },
  sortOptionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortModalCloseBtn: {
    width: '100%',
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    alignItems: 'center',
  },

  // Edit Panel Screen Styles
  editHeader: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderDark,
    backgroundColor: THEME.colors.card,
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  imageUploadBox: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.success,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 140,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    padding: 6,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: THEME.colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnBarcodeScan: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBarcodeGenerate: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.success,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnPrimaryAction: {
    backgroundColor: THEME.colors.success,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  btnDeleteProduct: {
    backgroundColor: THEME.colors.danger,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: THEME.colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderDark,
  },

  // Camera scanner modal styles
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
  stockBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
});
