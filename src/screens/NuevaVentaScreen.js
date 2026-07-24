import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Image 
} from 'react-native';

const YAPE_LOGO = require('../../assets/yape-logo.png');
const PLIN_LOGO = require('../../assets/plin-logo.png');
import { Search, Camera as CameraIcon, Minus, Plus, Trash2, Check } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import TutorialStep from '../components/TutorialStep';

export default function NuevaVentaScreen({ 
  products = [],
  cart, 
  onAddQty, 
  onSubQty, 
  onDeleteItem, 
  onScanClick, 
  flashActive, 
  onSearchAdd, 
  onCompleteSale 
}) {
  const [manualSearch, setManualSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');

  const PAYMENT_METHODS = [
    { label: 'Efectivo', icon: '💵', brandColor: '#2ECC71', useImage: false },
    { label: 'Yape', image: YAPE_LOGO, brandColor: '#7B2FA2', useImage: true },
    { label: 'Plin', image: PLIN_LOGO, brandColor: '#00C9B1', useImage: true },
    { label: 'Tarjeta', icon: '💳', brandColor: '#FF6B00', useImage: false },
  ];

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = subtotal > 15 ? 1.50 : 0.00;
  const total = subtotal - discount;

  // Filter suggestions instantly based on manual search query
  const suggestions = manualSearch.trim().length > 0 
    ? products.filter(p => 
        p.name.toLowerCase().includes(manualSearch.toLowerCase()) || 
        p.barcode.includes(manualSearch)
      ).slice(0, 5)
    : [];

  const handleSearchSubmit = () => {
    if (manualSearch.trim()) {
      onSearchAdd(manualSearch);
      setManualSearch('');
    }
  };

  const handleProcessSale = () => {
    if (cart.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos antes de procesar la venta.');
      return;
    }
    onCompleteSale(total, paymentMethod);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitleText}>Nueva venta</Text>
      
      {/* Principal Scanner Trigger */}
      <TutorialStep stepName="new_sale_view">
        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.mainScannerCard} 
          onPress={onScanClick}
        >
          {flashActive && <View style={styles.flashOverlay} />}

          <Text style={styles.scannerHeaderTitle}>Escanear producto</Text>
          <Text style={styles.scannerHeaderSub}>Presiona aquí para usar la cámara o simular escaneo</Text>
          <View style={styles.scannerFrameTarget}>
            <View style={styles.scannerLaser} />
            <CameraIcon size={32} color={THEME.colors.textWhite} />
          </View>
        </TouchableOpacity>
      </TutorialStep>

      {/* Input de Búsqueda Manual */}
      <View style={{ position: 'relative', zIndex: 10 }}>
        <View style={styles.searchBarContainer}>
           <Search size={18} color={THEME.colors.textGray} />
           <TextInput 
             placeholder="Buscar producto manualmente..." 
             placeholderTextColor={THEME.colors.textGray}
             style={styles.searchInput} 
             value={manualSearch}
             onChangeText={setManualSearch}
             onSubmitEditing={handleSearchSubmit}
             returnKeyType="search"
           />
        </View>

        {/* Dynamic Search Suggestions Popover */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((p) => (
              <TouchableOpacity 
                key={p.id} 
                style={styles.suggestionItem}
                onPress={() => {
                  onSearchAdd(p.name);
                  setManualSearch('');
                }}
              >
                <View>
                  <Text style={styles.suggestionNameText}>{p.name}</Text>
                  <Text style={styles.suggestionCategoryText}>{p.category} • Stock: {p.stock}</Text>
                </View>
                <Text style={styles.suggestionPriceText}>S/ {p.price.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Carrito de Compras */}
      <Text style={[styles.sectionHeader, { marginTop: 15 }]}>Productos en la venta ({cart.reduce((sum, item) => sum + item.qty, 0)})</Text>
      <View style={{ gap: 10, marginTop: 10 }}>
        {cart.length > 0 ? (
          cart.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.cartItemLeft}>
                <View style={styles.productAvatar}>
                  <Text style={{ fontSize: 18 }}>{item.avatar || '🥤'}</Text>
                </View>
                <View>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPriceText}>S/ {item.price.toFixed(2)}</Text>
                </View>
              </View>
              
              <View style={styles.cartItemRight}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={styles.qtyCounter}>
                    <TouchableOpacity style={{ padding: 4 }} onPress={() => onSubQty(item.id)}>
                      <Minus size={12} color={THEME.colors.textWhite} />
                    </TouchableOpacity>
                    <Text style={{ minWidth: 16, textAlign: 'center', color: THEME.colors.textWhite, fontWeight: '600' }}>{item.qty}</Text>
                    {(() => {
                      const prod = products.find(p => p.name === item.name);
                      const atMax = prod && item.qty >= prod.stock;
                      return (
                        <TouchableOpacity 
                          style={{ padding: 4, opacity: atMax ? 0.3 : 1 }} 
                          onPress={() => onAddQty(item.id)}
                          disabled={atMax}
                        >
                          <Plus size={12} color={THEME.colors.textWhite} />
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                  <TouchableOpacity 
                    style={{ padding: 6 }}
                    onPress={() => onDeleteItem(item.id)}
                  >
                    <Trash2 size={16} color={THEME.colors.danger} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemTotalRow}>S/ {(item.price * item.qty).toFixed(2)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ color: THEME.colors.textGray, fontSize: 13 }}>El carrito está vacío. Escanea o agrega productos.</Text>
          </View>
        )}
      </View>

      {/* Método de pago */}
      {cart.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.inputLabel}>MÉTODO DE PAGO</Text>
          <View style={styles.paymentMethodsRow}>
            {PAYMENT_METHODS.map((method) => {
              const isSelected = paymentMethod === method.label;
              return (
                <TouchableOpacity
                  key={method.label}
                  style={[
                    styles.paymentMethodCard,
                    isSelected && { borderColor: method.brandColor, backgroundColor: method.brandColor + '25' }
                  ]}
                  onPress={() => setPaymentMethod(method.label)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.paymentMethodIcon, { backgroundColor: method.brandColor + '25' }]}>
                    {method.useImage ? (
                      <Image 
                        source={method.image} 
                        style={styles.paymentMethodLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={[styles.paymentMethodIconText, { color: method.brandColor }]}>{method.icon}</Text>
                    )}
                  </View>
                  <Text style={[styles.paymentMethodLabel, isSelected && { color: method.brandColor, fontWeight: '700' }]}>
                    {method.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.paymentMethodCheck, { backgroundColor: method.brandColor }]}>
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Resumen de Caja */}
      <View style={styles.checkoutSummaryCard}>
        <View style={styles.summaryRow}>
          <Text style={{ color: THEME.colors.textGray, fontSize: 14 }}>Subtotal</Text>
          <Text style={{ color: THEME.colors.textWhite, fontSize: 14 }}>S/ {subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: THEME.colors.textGray, fontSize: 14 }}>Descuento</Text>
          <Text style={{ color: THEME.colors.success, fontSize: 14 }}>- S/ {discount.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRowBlock}>
          <Text style={{ color: THEME.colors.textWhite, fontSize: 18, fontWeight: '800' }}>TOTAL</Text>
          <Text style={{ color: THEME.colors.success, fontSize: 18, fontWeight: '800' }}>S/ {total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.btnPrimaryAction} 
        onPress={handleProcessSale}
      >
        <Text style={{ color: THEME.colors.textWhite, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>Completar venta</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  mainScannerCard: {
    backgroundColor: THEME.colors.primaryDark,
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 15,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.textWhite,
    opacity: 0.8,
    borderRadius: 20,
    zIndex: 5,
  },
  scannerHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    marginBottom: 4,
  },
  scannerHeaderSub: {
    fontSize: 12,
    color: THEME.colors.textWhite,
    opacity: 0.9,
    marginBottom: 20,
    textAlign: 'center',
  },
  scannerFrameTarget: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: THEME.colors.textWhite,
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scannerLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: THEME.colors.danger,
    top: '50%',
  },
  searchBarContainer: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.textWhite,
    fontSize: 14,
    padding: 0,
  },
  
  // Suggestions popover styling
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderDark,
  },
  suggestionNameText: {
    color: THEME.colors.textWhite,
    fontWeight: '600',
    fontSize: 13.5,
  },
  suggestionCategoryText: {
    color: THEME.colors.textGray,
    fontSize: 11,
    marginTop: 2,
  },
  suggestionPriceText: {
    color: THEME.colors.success,
    fontWeight: '700',
    fontSize: 14,
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.textWhite,
    marginTop: 10,
  },
  cartItem: {
    backgroundColor: THEME.colors.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productAvatar: {
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    padding: 8,
    borderRadius: 8,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textWhite,
  },
  productPriceText: {
    fontSize: 12,
    color: THEME.colors.textGray,
    marginTop: 2,
  },
  cartItemRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  qtyCounter: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemTotalRow: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textWhite,
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
  checkoutSummaryCard: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 16,
    gap: 8,
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRowBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderDark,
    borderStyle: 'dashed',
    paddingTop: 10,
  },
  btnPrimaryAction: {
    backgroundColor: THEME.colors.success,
    borderRadius: 16,
    padding: 16,
    marginTop: 15,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  paymentMethodCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodLogo: {
    width: 32,
    height: 32,
  },
  paymentMethodIconText: {
    fontSize: 22,
    fontWeight: '800',
  },
  paymentMethodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textGray,
    textAlign: 'center',
  },
  paymentMethodCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
