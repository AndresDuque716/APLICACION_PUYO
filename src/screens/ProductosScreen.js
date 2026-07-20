import React, { useState, useEffect } from 'react';
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
  Scan 
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, Camera } from 'expo-camera';
import { THEME } from '../constants/theme';
import TutorialStep from '../components/TutorialStep';

export default function ProductosScreen({ 
  products = [], 
  categories = ['Todos', 'Bebidas', 'Snacks', 'Golosinas', 'Abarrotes', 'Lácteos'],
  onAddProduct, 
  onNewProductClick,
  onUpdateProductsList,
  onAddCategory
}) {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Category prompt state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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

    const categoryAvatars = {
      Bebidas: '🥤', Snacks: '🥔', Golosinas: '🍫', Abarrotes: '🍚', Lácteos: '🥛', Limpieza: '🧼', Librería: '📓', Otro: '📦'
    };

    const categoryImages = {
      Bebidas: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop',
      Snacks: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=600&auto=format&fit=crop',
      Golosinas: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=600&auto=format&fit=crop',
      Abarrotes: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop',
      Lácteos: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=600&auto=format&fit=crop',
      Limpieza: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=600&auto=format&fit=crop',
      Librería: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=600&auto=format&fit=crop',
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
    setNewCategoryName('');
    setCategoryModalVisible(false);
    Alert.alert('Categoría Creada', `Categoría "${nameClean}" registrada exitosamente.`);
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesHorizontalScroll}
            contentContainerStyle={{ gap: 8 }}
          >
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => setCategoriaActiva(cat)}
                style={categoriaActiva === cat ? styles.tagCategoryActive : styles.tagCategoryInactive}
              >
                <Text style={{ 
                  color: categoriaActiva === cat ? THEME.colors.textWhite : THEME.colors.textGray, 
                  fontSize: 13, 
                  fontWeight: '600' 
                }}>
                  {cat}
                </Text>
                <View style={styles.tagCountBadge}>
                  <Text style={{ color: THEME.colors.textWhite, fontSize: 10, fontWeight: '700' }}>
                    {getCategoryCount(cat)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
 
          {/* Plus button to add custom categories */}
          <TouchableOpacity 
            style={styles.btnAddCatCircle}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Plus size={16} color={THEME.colors.textWhite} />
          </TouchableOpacity>
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
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { maxWidth: 300 }]}>
            <Text style={styles.modalTitle}>Filtrar y Ordenar</Text>
            
            <Text style={{ color: THEME.colors.textGray, fontSize: 11, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>ORDENAR POR</Text>
            
            {[
              { label: '🔤 Nombre (A - Z)', value: 'name-asc' },
              { label: '💵 Menor Precio primero', value: 'price-asc' },
              { label: '💰 Mayor Precio primero', value: 'price-desc' },
              { label: '📉 Menor Stock primero', value: 'stock-asc' },
              { label: '📈 Mayor Stock primero', value: 'stock-desc' }
            ].map((option) => {
              const isSelected = sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalListItem}
                  onPress={() => {
                    setSortBy(option.value);
                    setSortModalVisible(false);
                  }}
                >
                  <Text style={{ color: isSelected ? THEME.colors.primary : THEME.colors.textWhite, fontSize: 15, fontWeight: isSelected ? '700' : '500' }}>
                    {option.label}
                  </Text>
                  {isSelected && <Check size={16} color={THEME.colors.primary} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity 
              style={[styles.modalBtn, { width: '100%', marginTop: 15, backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.colors.borderDark }]} 
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
  categoriesHorizontalScroll: {
    flex: 1,
  },
  tagCategoryActive: {
    backgroundColor: THEME.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tagCategoryInactive: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tagCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  btnAddCatCircle: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
