import React, { useState } from 'react';
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
import { Camera as CameraIcon, ChevronDown, Check, X, Scan, DollarSign } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, Camera } from 'expo-camera';
import { THEME } from '../constants/theme';
import { triggerBeepAndVibrate } from '../utils/playBeepSound';

export default function NuevoProductoScreen({ products = [], categories = [], onSave, onCancel }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bebidas');
  const [barcode, setBarcode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [image, setImage] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);

  const categoriesList = categories.length > 0 
    ? categories.filter(c => c !== 'Todos') 
    : ['Bebidas', 'Snacks', 'Golosinas', 'Abarrotes', 'Lácteos', 'Limpieza', 'Librería', 'Otro'];

  const handleBarcodeGenerate = () => {
    let code;
    let isDuplicate = true;
    
    // Make sure we generate a unique code not present in catalog
    while (isDuplicate) {
      code = "775" + Math.floor(1000000000 + Math.random() * 9000000000);
      isDuplicate = products.some(p => p.barcode === code);
    }
    
    setBarcode(code);
  };

  const handleSelectCategory = (cat) => {
    setCategory(cat);
    setShowCategoryPicker(false);
  };

  // Image capturing actions (Take Photo / Gallery / URL)
  const handlePickImage = () => {
    Alert.alert(
      'Imagen del Producto',
      'Elige una opción para cargar la foto:',
      [
        { text: 'Tomar Foto con Cámara', onPress: takePhoto },
        { text: 'Seleccionar de Galería', onPress: pickImageFromGallery },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido', 
        'Vendix necesita acceso a la cámara para tomar una foto del producto.'
      );
      return;
    }
    
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // square aspect ratio fits list views nicely
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la cámara.');
      console.error(e);
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido', 
        'Vendix necesita acceso a tu galería de fotos para seleccionar la imagen del producto.'
      );
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
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la galería.');
      console.error(e);
    }
  };



  // Barcode scanning actions
  const handleBarcodeScanPress = async () => {
    const { status } = await Camera.getCameraPermissionsAsync();
    if (status === 'granted') {
      setBarcodeScannerVisible(true);
    } else {
      const requestResult = await Camera.requestCameraPermissionsAsync();
      if (requestResult.status === 'granted') {
        setBarcodeScannerVisible(true);
      } else {
        Alert.alert(
          'Permiso Requerido', 
          'Se necesita acceso a la cámara para escanear el código de barras del producto.'
        );
      }
    }
  };

  const handleBarcodeScanned = ({ type, data }) => {
    setBarcodeScannerVisible(false);
    setBarcode(data);
    triggerBeepAndVibrate();
    Alert.alert('Código Escaneado', `Código de barras: ${data}`);
  };

  // Submit product registration
  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor, ingresa el nombre del producto.');
      return;
    }
    if (!purchasePrice || parseFloat(purchasePrice) < 0 || isNaN(parseFloat(purchasePrice))) {
      Alert.alert('Error', 'Por favor, ingresa un precio de compra válido.');
      return;
    }
    if (!price || parseFloat(price) < 0 || isNaN(parseFloat(price))) {
      Alert.alert('Error', 'Por favor, ingresa un precio de venta válido.');
      return;
    }
    if (!stock || parseInt(stock) < 0 || isNaN(parseInt(stock))) {
      Alert.alert('Error', 'Por favor, ingresa un stock válido.');
      return;
    }

    const finalBarcode = barcode.trim();
    if (!finalBarcode) {
      Alert.alert('Código Requerido', 'Por favor ingresa, escanea o genera un código de barras.');
      return;
    }

    // Barcode duplicate validation
    const isDuplicate = products.some(p => p.barcode === finalBarcode);
    if (isDuplicate) {
      Alert.alert(
        'Código Duplicado',
        `El código "${finalBarcode}" ya se encuentra registrado con otro producto. Por favor escanea o genera uno diferente.`
      );
      return;
    }

    const categoryAvatars = {
      Bebidas: '🥤',
      Snacks: '🥔',
      Golosinas: '🍫',
      Abarrotes: '🍚',
      Lácteos: '🥛',
      Limpieza: '🧼',
      Librería: '📓',
      Otro: '📦'
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

    const finalImage = image.trim() || categoryImages[category] || categoryImages.Otro;

    const newProd = {
      id: "PROD-" + Date.now().toString().slice(-4),
      name: name.trim(),
      category: category,
      purchasePrice: parseFloat(purchasePrice),
      price: parseFloat(price),
      stock: parseInt(stock),
      minStock: minStock ? parseInt(minStock) : 5,
      barcode: finalBarcode,
      image: finalImage,
      avatar: categoryAvatars[category] || '📦'
    };

    onSave(newProd);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 45 }}>
        <View style={styles.headerBiblioteca}>
          <View>
            <Text style={styles.pageTitleText}>Nuevo producto</Text>
            <Text style={styles.subtextHeader}>Registra un nuevo artículo en tu inventario</Text>
          </View>
        </View>

        <View style={{ gap: 16, marginTop: 15 }}>
          {/* Cargar imagen */}
          <TouchableOpacity 
            style={styles.imageUploadBox}
            onPress={handlePickImage}
          >
            {image ? (
              <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image source={{ uri: image }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                <View style={styles.changeImageOverlay}>
                  <Text style={{ color: THEME.colors.success, fontSize: 12, fontWeight: '700' }}>Cambiar foto del producto</Text>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <CameraIcon size={28} color={THEME.colors.success} />
                <Text style={{ color: THEME.colors.textGray, fontSize: 13, fontWeight: '500' }}>+ Cargar imagen del producto</Text>
                <Text style={{ color: THEME.colors.textMuted, fontSize: 10 }}>Cámara, Galería o URL (Opcional)</Text>
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
                value={image} 
                onChangeText={setImage}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NOMBRE DEL PRODUCTO</Text>
            <View style={styles.inputFieldContainer}>
              <TextInput 
                placeholder="Ej. Coca Cola 1L" 
                placeholderTextColor={THEME.colors.textGray}
                style={styles.inputFieldOnly} 
                value={name} 
                onChangeText={setName}
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
              <Text style={{ color: THEME.colors.textWhite, fontSize: 14 }}>{category}</Text>
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
                  value={barcode} 
                  onChangeText={setBarcode}
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

          {/* Precio Compra, Precio Venta, Stock */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>PRECIO COMPRA (S/)</Text>
              <View style={styles.inputFieldContainer}>
                <TextInput 
                  placeholder="0.00" 
                  placeholderTextColor={THEME.colors.textGray}
                  style={styles.inputFieldOnly} 
                  value={purchasePrice} 
                  onChangeText={setPurchasePrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>PRECIO VENTA (S/)</Text>
              <View style={styles.inputFieldContainer}>
                <TextInput 
                  placeholder="0.00" 
                  placeholderTextColor={THEME.colors.textGray}
                  style={styles.inputFieldOnly} 
                  value={price} 
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>STOCK INICIAL</Text>
              <View style={styles.inputFieldContainer}>
                <TextInput 
                  placeholder="0" 
                  placeholderTextColor={THEME.colors.textGray}
                  style={styles.inputFieldOnly} 
                  value={stock} 
                  onChangeText={setStock}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Ganancias preview */}
          {purchasePrice !== '' && price !== '' && !isNaN(parseFloat(purchasePrice)) && !isNaN(parseFloat(price)) && (
            <View style={styles.profitRow}>
              <DollarSign size={14} color={THEME.colors.primary} />
              <Text style={styles.profitText}>
                Ganancia por unidad: S/ {(parseFloat(price) - parseFloat(purchasePrice)).toFixed(2)}
              </Text>
            </View>
          )}

          {/* Stock mínimo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>STOCK MÍNIMO</Text>
            <View style={styles.inputFieldContainer}>
              <TextInput 
                placeholder="5" 
                placeholderTextColor={THEME.colors.textGray}
                style={styles.inputFieldOnly} 
                value={minStock} 
                onChangeText={setMinStock}
                keyboardType="number-pad"
              />
            </View>
            <Text style={{ color: THEME.colors.textGray, fontSize: 10, marginTop: 4 }}>Si el stock baja de este número, recibirás una alerta</Text>
          </View>

          {/* Botones de acción */}
          <View style={{ gap: 10, marginTop: 10 }}>
            <TouchableOpacity style={styles.btnPrimaryAction} onPress={handleSubmit}>
              <Text style={{ color: THEME.colors.textWhite, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>Guardar producto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnSecondaryCancel} onPress={onCancel}>
              <Text style={{ color: THEME.colors.textGray, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal picker de categorías */}
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
                {categoriesList.map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={styles.categoryItem} 
                    onPress={() => handleSelectCategory(cat)}
                  >
                    <Text style={{ color: THEME.colors.textWhite, fontSize: 16 }}>{cat}</Text>
                    {category === cat && <Check size={18} color={THEME.colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Local Barcode Scanner Modal */}
        <Modal
          visible={barcodeScannerVisible}
          animationType="slide"
          onRequestClose={() => setBarcodeScannerVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <View style={styles.cameraHeader}>
              <Text style={{ color: THEME.colors.textWhite, fontSize: 18, fontWeight: '700' }}>Escanear Código del Producto</Text>
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
                <Text style={styles.scannerInstructionText}>Apunta al código de barras del empaque</Text>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
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
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(0, 210, 106, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 106, 0.2)',
  },
  profitText: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  btnPrimaryAction: {
    backgroundColor: THEME.colors.success,
    borderRadius: 16,
    padding: 16,
    marginTop: 15,
  },
  btnSecondaryCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 16,
    padding: 16,
  },
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderDark,
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
});
