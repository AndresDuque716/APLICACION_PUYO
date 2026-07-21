import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  Dimensions,
  Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { 
  ShoppingCart, 
  ShoppingBag, 
  Receipt, 
  Package, 
  Users, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  Target, 
  TrendingUp,
  X,
  Check,
  Plus,
  Pencil,
  Store
} from 'lucide-react-native';
import { THEME } from '../constants/theme';
import TutorialStep from '../components/TutorialStep';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DashboardScreen({ 
  onMetaClick, 
  products, 
  salesHistory, 
  onUpdateProductStock,
  loggedInUser,
  selectedBranch,
  setSelectedBranch,
  branches,
  setBranches
}) {
  // Local UI Modal States
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [lowStockModalVisible, setLowStockModalVisible] = useState(false);
  const [agotadosModalVisible, setAgotadosModalVisible] = useState(false);
  const [metaModalVisible, setMetaModalVisible] = useState(false);
  
  // Branch & Filter states
  const [newBranchInput, setNewBranchInput] = useState('');
  const [dateFilter, setDateFilter] = useState('Hoy'); // 'Hoy', 'Ayer', 'Esta semana'

  // Automatic store name prompt on first login or default
  useEffect(() => {
    const checkStorePrompt = async () => {
      try {
        const storePrompted = await AsyncStorage.getItem('@vendix_store_prompted');
        if (!storePrompted && (selectedBranch === 'Mi Sucursal' || selectedBranch === 'Mi Negocio' || loggedInUser?.toLowerCase().includes('invitado'))) {
          setBranchModalVisible(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkStorePrompt();
  }, []);

  const handleSelectBranch = async (branch) => {
    setSelectedBranch(branch);
    try {
      await AsyncStorage.setItem('@vendix_selected_branch', branch);
      await AsyncStorage.setItem('@vendix_store_prompted', 'true');
      if (isFirebaseConfigured && auth && auth.currentUser) {
        const uid = auth.currentUser.uid;
        await setDoc(doc(db, "users", uid, "settings", "branches"), {
          selectedBranch: branch,
          branches: branches
        }, { merge: true });
      }
    } catch (err) {
      console.error(err);
    }
    setBranchModalVisible(false);
  };

  const handleAddNewBranch = async () => {
    if (newBranchInput && newBranchInput.trim()) {
      const name = newBranchInput.trim();
      
      if (branches.includes(name)) {
        Alert.alert('Atención', 'Esta sucursal ya existe.');
        return;
      }

      const updated = [...branches, name];
      setBranches(updated);
      setSelectedBranch(name);
      setNewBranchInput('');
      setBranchModalVisible(false);
      try {
        await AsyncStorage.setItem('@vendix_branches_list', JSON.stringify(updated));
        await AsyncStorage.setItem('@vendix_selected_branch', name);
        if (isFirebaseConfigured && auth && auth.currentUser) {
          const uid = auth.currentUser.uid;
          await setDoc(doc(db, "users", uid, "settings", "branches"), {
            selectedBranch: name,
            branches: updated
          }, { merge: true });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      Alert.alert('Atención', 'Por favor ingresa un nombre válido.');
    }
  };

  const getUserDisplayName = (userStr) => {
    if (!userStr) return selectedBranch || 'Mi Local';
    
    if (userStr.includes('(')) {
      const nickname = userStr.split('(')[0].trim();
      if (nickname && nickname.toLowerCase() !== 'invitado' && nickname.toLowerCase() !== 'invitado vendix' && nickname.toLowerCase() !== 'mi negocio') {
        return nickname;
      }
    }
    
    const parts = userStr.split('@');
    const name = parts[0];
    if (!name || name.toLowerCase() === 'invitado' || name.toLowerCase() === 'demo') {
      return selectedBranch || 'Mi Local';
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  // Re-stock quantity states
  const [selectedProductToRestock, setSelectedProductToRestock] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  // Daily target constant
  const DAILY_TARGET = 1500.00;

  // ----------------------------------------------------
  // Metric Calculations based on Date Filter
  // ----------------------------------------------------
  
  // Helper to filter sales history
  const getFilteredSales = () => {
    if (dateFilter === 'Hoy') {
      return salesHistory.filter(s => 
        s.time?.includes('min') || s.time?.includes('hora') || s.time?.includes('momento') || !s.time
      );
    } else if (dateFilter === 'Ayer') {
      return salesHistory.filter(s => s.time?.includes('2 horas') || s.time?.includes('3 horas'));
    } else {
      return salesHistory;
    }
  };

  const filteredSales = getFilteredSales();
  const salesTotal = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const earningsTotal = salesTotal * 0.30; // Estimate 30% profit margin
  const ordersCount = filteredSales.length;
  const productsSold = filteredSales.reduce((sum, s) => sum + (s.items || 0), 0);
  
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);
  const agotadosProducts = products.filter(p => p.stock === 0);

  // ----------------------------------------------------
  // Dynamic Weekly Sales Chart Calculations
  // ----------------------------------------------------
  const getWeeklySalesData = () => {
    const chartDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const now = new Date();
    const currentDayIdx = (now.getDay() + 6) % 7; // 0 = Lun, 1 = Mar, ..., 6 = Dom

    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayIdx);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const dayTotals = [0, 0, 0, 0, 0, 0, 0];

    salesHistory.forEach(sale => {
      let saleDate = null;
      if (sale.timestamp) {
        saleDate = new Date(sale.timestamp);
      } else if (sale.date) {
        saleDate = new Date(sale.date);
      }
      
      if (!saleDate || isNaN(saleDate.getTime())) {
        saleDate = now;
      }

      if (saleDate >= monday && saleDate <= sunday) {
        let dayIdx = (saleDate.getDay() + 6) % 7;
        if (dayIdx >= 0 && dayIdx <= 6) {
          dayTotals[dayIdx] += (sale.total || 0);
        }
      }
    });

    const isAllZero = dayTotals.every(t => t === 0);
    const displayTotals = isAllZero ? [120.0, 240.0, 180.0, 310.0, 450.0, 520.0, 390.0] : dayTotals;
    const maxVal = Math.max(...displayTotals, 500);
    const weeklyTotalSum = displayTotals.reduce((a, b) => a + b, 0);

    return {
      chartDays,
      displayTotals,
      actualTotals: dayTotals,
      maxVal,
      currentDayIdx,
      weeklyTotalSum,
      isDemoData: isAllZero
    };
  };

  const {
    chartDays,
    displayTotals,
    maxVal: maxWeeklySale,
    currentDayIdx,
    weeklyTotalSum,
    isDemoData
  } = getWeeklySalesData();

  // ----------------------------------------------------
  // Stock Refill Handler
  // ----------------------------------------------------
  const handleRestock = () => {
    const qty = parseInt(restockQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Cantidad Inválida', 'Por favor ingresa una cantidad mayor a cero.');
      return;
    }
    if (!selectedProductToRestock) return;

    onUpdateProductStock(selectedProductToRestock.id, qty);
    Alert.alert(
      'Reabastecimiento Exitoso', 
      `Se agregaron ${qty} unidades a ${selectedProductToRestock.name}.`
    );

    // Reset local states & close modals
    setRestockQty('');
    setSelectedProductToRestock(null);
    setLowStockModalVisible(false);
    setAgotadosModalVisible(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 1. Greeting Row */}
      <View style={styles.greetingRow}>
        <TouchableOpacity onPress={() => setBranchModalVisible(true)} activeOpacity={0.8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.greetingTitle}>¡Bienvenido, {getUserDisplayName(loggedInUser)}!</Text>
            <View style={{ backgroundColor: 'rgba(0, 210, 106, 0.15)', padding: 4, borderRadius: 12 }}>
              <Pencil size={12} color={THEME.colors.primary} />
            </View>
          </View>
          <View style={styles.branchSelector}>
            <Text style={styles.branchText}>{selectedBranch}</Text>
            <ChevronDown size={14} color={THEME.colors.primary} />
          </View>
        </TouchableOpacity>
        
        {/* Date Selector */}
        <TouchableOpacity 
          style={styles.dateDropdown}
          onPress={() => setDateModalVisible(true)}
        >
          <Calendar size={14} color={THEME.colors.textGray} />
          <Text style={styles.dateText}>{dateFilter}</Text>
          <ChevronDown size={14} color={THEME.colors.textGray} />
        </TouchableOpacity>
      </View>

      {/* 2. Grid de KPIs */}
      <TutorialStep stepName="dashboard_view">
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <ShoppingCart size={14} color={THEME.colors.primary} />
              <Text style={styles.kpiTitle}>Ventas {dateFilter.toLowerCase()}</Text>
            </View>
            <Text style={styles.kpiValue}>S/ {salesTotal.toFixed(2)}</Text>
            <Text style={styles.kpiTrend}>↗ Procesado</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <ShoppingBag size={14} color={THEME.colors.primary} />
              <Text style={styles.kpiTitle}>Ganancias</Text>
            </View>
            <Text style={styles.kpiValue}>S/ {earningsTotal.toFixed(2)}</Text>
            <Text style={styles.kpiTrend}>Est. (30%)</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Receipt size={14} color={THEME.colors.primary} />
              <Text style={styles.kpiTitle}>Órdenes</Text>
            </View>
            <Text style={styles.kpiValue}>{ordersCount}</Text>
            <Text style={styles.kpiTrend}>↗ Hoy</Text>
          </View>
        </View>

        <View style={[styles.kpiGrid, { marginTop: 10 }]}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Package size={14} color={THEME.colors.primary} />
              <Text style={styles.kpiTitle}>Prod. Vend.</Text>
            </View>
            <Text style={styles.kpiValue}>{productsSold}</Text>
            <Text style={{ fontSize: 10, color: THEME.colors.textGray, marginTop: 2 }}>unidades vendidas</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Package size={14} color={THEME.colors.primary} />
              <Text style={styles.kpiTitle}>Stock total</Text>
            </View>
            <Text style={styles.kpiValue}>{totalStock}</Text>
            <Text style={{ fontSize: 10, color: THEME.colors.textGray, marginTop: 2 }}>en almacén</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Users size={14} color={THEME.colors.primary} />
              <Text style={styles.kpiTitle}>Clientes</Text>
            </View>
            <Text style={styles.kpiValue}>{ordersCount + 2}</Text>
            <Text style={styles.kpiTrend}>Estimados</Text>
          </View>
        </View>
      </TutorialStep>

      {/* 3. Gráfico de la semana */}
      <View style={{ marginTop: 24 }}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.sectionHeaderTitle}>Ventas de la semana</Text>
            {isDemoData && (
              <View style={{ backgroundColor: 'rgba(0, 210, 106, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ color: THEME.colors.primary, fontSize: 10, fontWeight: '700' }}>DEMO</Text>
              </View>
            )}
          </View>
          <View style={styles.periodSelector}>
            <Text style={{ fontSize: 12, color: THEME.colors.textWhite, fontWeight: '600' }}>
              Total: S/ {weeklyTotalSum.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.chartCardNew}>
          {/* Y Axis scale Ticks */}
          <View style={styles.chartYAxisNew}>
            <Text style={styles.chartYText}>S/ {maxWeeklySale >= 1000 ? `${(maxWeeklySale/1000).toFixed(1)}k` : maxWeeklySale.toFixed(0)}</Text>
            <Text style={styles.chartYText}>S/ {(maxWeeklySale * 0.5).toFixed(0)}</Text>
            <Text style={styles.chartYText}>S/ 0</Text>
          </View>

          {/* 7 Columns Container (Flex 1 each) */}
          <View style={styles.chartColumnsContainer}>
            {chartDays.map((day, idx) => {
              const val = displayTotals[idx];
              const heightPct = Math.min(100, Math.max(10, (val / maxWeeklySale) * 100));
              const isToday = idx === currentDayIdx;

              return (
                <View key={day} style={styles.chartColumn}>
                  {/* Top Value Tooltip */}
                  <Text 
                    style={[
                      styles.chartBarValue, 
                      isToday && { color: THEME.colors.primary, fontWeight: '700' }
                    ]} 
                    numberOfLines={1}
                  >
                    {val >= 1000 ? `${(val/1000).toFixed(1)}k` : `${val.toFixed(0)}`}
                  </Text>

                  {/* Bar Container Track */}
                  <View style={styles.chartBarTrack}>
                    <View 
                      style={[
                        styles.chartBarFill,
                        { 
                          height: `${heightPct}%`,
                          backgroundColor: isToday 
                            ? THEME.colors.primary 
                            : val > 0 
                              ? 'rgba(0, 210, 106, 0.45)' 
                              : 'rgba(255, 255, 255, 0.08)',
                          borderColor: isToday ? '#ffffff' : 'transparent',
                          borderWidth: isToday ? 1 : 0
                        }
                      ]}
                    />
                  </View>

                  {/* X Axis Day Label Badge */}
                  <View style={[styles.chartDayBadge, isToday && styles.chartDayBadgeToday]}>
                    <Text style={[styles.chartXTextNew, isToday && { color: '#000000', fontWeight: '700' }]}>
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* 4. Sección de Alertas importantes */}
      <View style={{ marginTop: 24 }}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Alertas importantes</Text>
        </View>

        <View style={{ gap: 8, marginTop: 10 }}>
          {/* Stock bajo */}
          <TouchableOpacity 
            style={styles.alertRow} 
            onPress={() => setLowStockModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.alertIconBox, { backgroundColor: 'rgba(255, 149, 0, 0.1)', borderColor: 'rgba(255, 149, 0, 0.25)' }]}>
                <AlertTriangle size={18} color={THEME.colors.warning} />
              </View>
              <View>
                <Text style={styles.alertMainText}>Stock bajo</Text>
                <Text style={styles.alertSubText}>{lowStockCount} productos con stock bajo (Presiona para reabastecer)</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#3A3A3C" />
          </TouchableOpacity>

          {/* Productos agotados */}
          <TouchableOpacity 
            style={styles.alertRow} 
            onPress={() => setAgotadosModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.alertIconBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.25)' }]}>
                <Package size={18} color={THEME.colors.danger} />
              </View>
              <View>
                <Text style={styles.alertMainText}>Productos agotados</Text>
                <Text style={styles.alertSubText}>{outOfStockCount} productos sin stock (Presiona para reabastecer)</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#3A3A3C" />
          </TouchableOpacity>

          {/* Meta de ventas */}
          <TouchableOpacity 
            style={styles.alertRow} 
            onPress={() => setMetaModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.alertIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.1)', borderColor: 'rgba(10, 132, 255, 0.25)' }]}>
                <Target size={18} color={THEME.colors.info} />
              </View>
              <View>
                <Text style={styles.alertMainText}>Meta de ventas</Text>
                <Text style={styles.alertSubText}>Llevas el {((salesTotal / DAILY_TARGET) * 100).toFixed(0)}% de tu meta diaria de S/ {DAILY_TARGET}</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#3A3A3C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Accesos rápidos */}
      <View style={{ marginTop: 24 }}>
        <Text style={styles.sectionHeaderTitle}>Accesos rápidos</Text>
        <View style={styles.quickAccessRow}>
          <TouchableOpacity style={styles.quickAccessCard} onPress={() => onMetaClick('products')}>
            <View style={styles.quickAccessIconWrapper}>
              <Package size={20} color={THEME.colors.primary} />
            </View>
            <Text style={styles.quickAccessLabel}>Productos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessCard} onPress={() => onMetaClick('scanner')}>
            <View style={styles.quickAccessIconWrapper}>
              <ShoppingCart size={20} color={THEME.colors.primary} />
            </View>
            <Text style={styles.quickAccessLabel}>Nueva venta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessCard} onPress={() => onMetaClick('sales')}>
            <View style={styles.quickAccessIconWrapper}>
              <Receipt size={20} color={THEME.colors.primary} />
            </View>
            <Text style={styles.quickAccessLabel}>Ventas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessCard} onPress={() => onMetaClick('reports')}>
            <View style={styles.quickAccessIconWrapper}>
              <TrendingUp size={20} color={THEME.colors.primary} />
            </View>
            <Text style={styles.quickAccessLabel}>Reportes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL: Branch / Store Name Selector */}
      <Modal
        visible={branchModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setBranchModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={[styles.modalContent, { width: '85%', maxWidth: 360, padding: 20 }]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Store size={20} color={THEME.colors.primary} />
                <Text style={styles.modalTitle}>Nombre de tu Local</Text>
              </View>
              <TouchableOpacity onPress={() => setBranchModalVisible(false)}>
                <X size={18} color={THEME.colors.textGray} />
              </TouchableOpacity>
            </View>
            
            <Text style={{ color: THEME.colors.textGray, fontSize: 12, marginBottom: 14 }}>
              Configura el nombre de tu negocio o sucursal activa:
            </Text>

            {branches.map((branch) => (
              <TouchableOpacity 
                key={branch}
                style={styles.modalListItem}
                onPress={() => handleSelectBranch(branch)}
              >
                <Text style={{ color: THEME.colors.textWhite, fontSize: 14.5, fontWeight: '500' }}>{branch}</Text>
                {selectedBranch === branch && <Check size={18} color={THEME.colors.primary} />}
              </TouchableOpacity>
            ))}

            {/* Sugerencias rápidas */}
            <Text style={{ color: THEME.colors.textGray, fontSize: 11, fontWeight: '700', marginTop: 12, marginBottom: 8, letterSpacing: 0.5 }}>
              SUGERENCIAS RÁPIDAS:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {['🏪 Bodega San Martín', '🛒 Minimarket El Sol', '🏬 Comercial Puyo', '🏠 Mi Tienda'].map((chip) => {
                const cleanName = chip.replace(/^[^\s]+\s/, '');
                return (
                  <TouchableOpacity 
                    key={chip} 
                    style={{
                      backgroundColor: THEME.colors.inputBg,
                      borderWidth: 1,
                      borderColor: selectedBranch === cleanName ? THEME.colors.primary : THEME.colors.borderDark,
                      borderRadius: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 6
                    }}
                    onPress={() => handleSelectBranch(cleanName)}
                  >
                    <Text style={{ color: THEME.colors.textWhite, fontSize: 11.5, fontWeight: '500' }}>{chip}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sección para agregar sucursal / nombre personalizado */}
            <View style={{ borderTopWidth: 1, borderTopColor: THEME.colors.borderDark, paddingTop: 14, marginTop: 4, width: '100%' }}>
              <Text style={{ color: THEME.colors.textGray, fontSize: 11, marginBottom: 8, fontWeight: '700', letterSpacing: 0.5 }}>ESCRIBIR OTRO NOMBRE DE LOCAL</Text>
              <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: THEME.colors.inputBg,
                    borderWidth: 1,
                    borderColor: THEME.colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 40,
                    color: THEME.colors.textWhite,
                    fontSize: 13.5
                  }}
                  placeholder="ej. Don Andrés, Bodega..."
                  placeholderTextColor={THEME.colors.textGray}
                  value={newBranchInput}
                  onChangeText={setNewBranchInput}
                />
                <TouchableOpacity 
                  style={{
                    backgroundColor: THEME.colors.primary,
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 40
                  }}
                  onPress={handleAddNewBranch}
                >
                  <Text style={{ color: THEME.colors.textWhite, fontWeight: '700', fontSize: 13 }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: Date Selector */}
      <Modal
        visible={dateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDateModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDateModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar Datos</Text>
            {['Hoy', 'Ayer', 'Esta semana'].map((filter) => (
              <TouchableOpacity 
                key={filter}
                style={styles.modalListItem}
                onPress={() => {
                  setDateFilter(filter);
                  setDateModalVisible(false);
                }}
              >
                <Text style={{ color: THEME.colors.textWhite, fontSize: 16 }}>{filter}</Text>
                {dateFilter === filter && <Check size={18} color={THEME.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: Low Stock list & Re-supply */}
      <Modal
        visible={lowStockModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLowStockModalVisible(false)}
      >
        <View style={styles.modalFullOverlay}>
          <View style={styles.modalFullContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Productos con Stock Bajo</Text>
              <TouchableOpacity onPress={() => {
                setLowStockModalVisible(false);
                setSelectedProductToRestock(null);
                setRestockQty('');
              }}>
                <X size={24} color={THEME.colors.textWhite} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 20 }}>
              {selectedProductToRestock ? (
                <View style={styles.restockContainer}>
                  <Text style={styles.restockProductName}>Abastecer: {selectedProductToRestock.name}</Text>
                  <Text style={styles.restockProductInfo}>Stock Actual: {selectedProductToRestock.stock} unidades</Text>
                  
                  <View style={[styles.inputFieldContainer, { marginTop: 15 }]}>
                    <TextInput 
                      placeholder="Cantidad a agregar (Ej. 20)" 
                      placeholderTextColor={THEME.colors.textGray}
                      style={styles.inputField}
                      keyboardType="number-pad"
                      value={restockQty}
                      onChangeText={setRestockQty}
                    />
                  </View>

                  <View style={{ gap: 10, marginTop: 20 }}>
                    <TouchableOpacity style={styles.btnPrimaryAction} onPress={handleRestock}>
                      <Text style={styles.btnText}>Confirmar Ingreso</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.btnSecondaryCancel} 
                      onPress={() => {
                        setSelectedProductToRestock(null);
                        setRestockQty('');
                      }}
                    >
                      <Text style={{ color: THEME.colors.textGray, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>Volver al listado</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((p) => (
                      <TouchableOpacity 
                        key={p.id}
                        style={styles.productListItemRow}
                        onPress={() => setSelectedProductToRestock(p)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Image source={{ uri: p.image }} style={styles.productThumbnail} />
                          <View>
                            <Text style={{ color: THEME.colors.textWhite, fontWeight: '600' }}>{p.name}</Text>
                            <Text style={{ color: THEME.colors.warning, fontSize: 12 }}>Stock actual: {p.stock} unidades</Text>
                          </View>
                        </View>
                        <View style={styles.plusIconBadge}>
                          <Plus size={16} color={THEME.colors.textWhite} />
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No hay productos con stock bajo en este momento.</Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Out of stock (Agotados) list & Re-supply */}
      <Modal
        visible={agotadosModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAgotadosModalVisible(false)}
      >
        <View style={styles.modalFullOverlay}>
          <View style={styles.modalFullContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Productos Agotados</Text>
              <TouchableOpacity onPress={() => {
                setAgotadosModalVisible(false);
                setSelectedProductToRestock(null);
                setRestockQty('');
              }}>
                <X size={24} color={THEME.colors.textWhite} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 20 }}>
              {selectedProductToRestock ? (
                <View style={styles.restockContainer}>
                  <Text style={styles.restockProductName}>Abastecer: {selectedProductToRestock.name}</Text>
                  <Text style={styles.restockProductInfo}>Stock Actual: AGOTADO</Text>
                  
                  <View style={[styles.inputFieldContainer, { marginTop: 15 }]}>
                    <TextInput 
                      placeholder="Cantidad a agregar (Ej. 50)" 
                      placeholderTextColor={THEME.colors.textGray}
                      style={styles.inputField}
                      keyboardType="number-pad"
                      value={restockQty}
                      onChangeText={setRestockQty}
                    />
                  </View>

                  <View style={{ gap: 10, marginTop: 20 }}>
                    <TouchableOpacity style={styles.btnPrimaryAction} onPress={handleRestock}>
                      <Text style={styles.btnText}>Confirmar Ingreso</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.btnSecondaryCancel} 
                      onPress={() => {
                        setSelectedProductToRestock(null);
                        setRestockQty('');
                      }}
                    >
                      <Text style={{ color: THEME.colors.textGray, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>Volver al listado</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {agotadosProducts.length > 0 ? (
                    agotadosProducts.map((p) => (
                      <TouchableOpacity 
                        key={p.id}
                        style={styles.productListItemRow}
                        onPress={() => setSelectedProductToRestock(p)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Image source={{ uri: p.image }} style={styles.productThumbnail} />
                          <View>
                            <Text style={{ color: THEME.colors.textWhite, fontWeight: '600' }}>{p.name}</Text>
                            <Text style={{ color: THEME.colors.danger, fontSize: 12, fontWeight: '600' }}>AGOTADO</Text>
                          </View>
                        </View>
                        <View style={styles.plusIconBadge}>
                          <Plus size={16} color={THEME.colors.textWhite} />
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>¡Excelente! No tienes productos agotados.</Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Sales Target progress (Meta de ventas) */}
      <Modal
        visible={metaModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMetaModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMetaModalVisible(false)}
        >
          <View style={[styles.modalContent, { maxWidth: 330, padding: 24 }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Target size={42} color={THEME.colors.info} />
            </View>
            
            <Text style={[styles.modalTitle, { marginBottom: 10 }]}>Meta de Ventas Diaria</Text>
            
            <Text style={{ color: THEME.colors.textGray, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
              S/ {salesTotal.toFixed(2)} de S/ {DAILY_TARGET.toFixed(2)}
            </Text>

            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <View style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(100, (salesTotal / DAILY_TARGET) * 100)}%`,
                  backgroundColor: THEME.colors.info 
                }
              ]} />
            </View>
            
            <Text style={{ color: THEME.colors.textWhite, fontSize: 13, textAlign: 'center', marginTop: 10, fontWeight: '500' }}>
              Faltan S/ {Math.max(0, DAILY_TARGET - salesTotal).toFixed(2)} para completar la meta de hoy.
            </Text>

            <View style={styles.metaStatsRow}>
              <View style={styles.metaStatBlock}>
                <Text style={styles.metaStatLabel}>Ticket Promedio</Text>
                <Text style={styles.metaStatValue}>S/ {(ordersCount > 0 ? (salesTotal / ordersCount) : 0).toFixed(2)}</Text>
              </View>
              <View style={styles.metaStatBlock}>
                <Text style={styles.metaStatLabel}>Transacciones</Text>
                <Text style={styles.metaStatValue}>{ordersCount}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimaryAction, { backgroundColor: THEME.colors.info, marginTop: 24 }]}
              onPress={() => setMetaModalVisible(false)}
            >
              <Text style={styles.btnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  branchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  branchText: {
    fontSize: 13,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  dateDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 13,
    color: THEME.colors.textWhite,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 92,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kpiTitle: {
    fontSize: 11,
    color: THEME.colors.textGray,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    marginTop: 4,
  },
  kpiTrend: {
    fontSize: 10,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textWhite,
  },
  periodSelector: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chartCard: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    height: 160,
  },
  chartCardNew: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 180,
  },
  chartYAxisNew: {
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 22,
    paddingTop: 18,
  },
  chartColumnsContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  chartColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    fontSize: 9.5,
    color: THEME.colors.textGray,
    marginBottom: 4,
    textAlign: 'center',
  },
  chartBarTrack: {
    flex: 1,
    width: '100%',
    maxWidth: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 8,
  },
  chartDayBadge: {
    marginTop: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
  },
  chartDayBadgeToday: {
    backgroundColor: THEME.colors.primary,
  },
  chartXTextNew: {
    color: THEME.colors.textGray,
    fontSize: 10.5,
    fontWeight: '600',
  },
  chartYAxis: {
    justifyContent: 'space-between',
    paddingBottom: 20,
    height: '100%',
  },
  chartYText: {
    color: THEME.colors.textGray,
    fontSize: 10,
  },
  chartMain: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  chartXText: {
    color: THEME.colors.textGray,
    fontSize: 10,
  },
  alertRow: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertIconBox: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertMainText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: THEME.colors.textWhite,
  },
  alertSubText: {
    fontSize: 11,
    color: THEME.colors.textGray,
    marginTop: 2,
    paddingRight: 10,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 10,
  },
  quickAccessCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickAccessIconWrapper: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 14,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessLabel: {
    fontSize: 10,
    color: THEME.colors.textGray,
    textAlign: 'center',
    fontWeight: '500',
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
  modalListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderDark,
  },

  // Full Screen Modal Styles (Alert Details)
  modalFullOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalFullContent: {
    backgroundColor: THEME.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.7,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderDark,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textWhite,
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
    marginBottom: 10,
  },
  productThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: THEME.colors.inputBg,
  },
  plusIconBadge: {
    backgroundColor: THEME.colors.primaryDark,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: THEME.colors.textGray,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },

  // Restock View inside list
  restockContainer: {
    padding: 10,
  },
  restockProductName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  restockProductInfo: {
    fontSize: 14,
    color: THEME.colors.textGray,
    marginTop: 4,
  },
  inputFieldContainer: {
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
  },
  inputField: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: THEME.colors.textWhite,
    fontSize: 15,
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
  btnText: {
    color: THEME.colors.textWhite,
    fontSize: 15,
    fontWeight: '600',
  },

  // Meta Target Modal styles
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: THEME.colors.borderDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBarFill: {
    height: '100%',
  },
  metaStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderDark,
    paddingTop: 20,
  },
  metaStatBlock: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metaStatLabel: {
    fontSize: 11,
    color: THEME.colors.textGray,
  },
  metaStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    marginTop: 4,
  }
});
