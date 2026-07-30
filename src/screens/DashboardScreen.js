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
import { 
  ShoppingCart, 
  Receipt, 
  Package, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  Target, 
  TrendingUp,
  X,
  Check,
  Plus,
  Store,
  PenLine,
  RotateCcw
} from 'lucide-react-native';
import { THEME } from '../constants/theme';
import TutorialStep from '../components/TutorialStep';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_GAP = 12;

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
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [lowStockModalVisible, setLowStockModalVisible] = useState(false);
  const [agotadosModalVisible, setAgotadosModalVisible] = useState(false);
  const [metaModalVisible, setMetaModalVisible] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [dateFilter, setDateFilter] = useState('Hoy');
  const [dailyTarget, setDailyTarget] = useState(1500);
  const [editingTarget, setEditingTarget] = useState(false);
  const [editTargetValue, setEditTargetValue] = useState('1500');

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

  useEffect(() => {
    AsyncStorage.getItem('@vendix_daily_target').then(val => {
      if (val) {
        const n = parseFloat(val);
        if (!isNaN(n) && n > 0) {
          setDailyTarget(n);
          setEditTargetValue(String(n));
        }
      }
    }).catch(() => {});
  }, []);

  const handleSaveTarget = async () => {
    const n = parseFloat(editTargetValue);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Valor inválido', 'Ingresa un monto mayor a cero.');
      return;
    }
    setDailyTarget(n);
    setEditingTarget(false);
    await AsyncStorage.setItem('@vendix_daily_target', String(n)).catch(() => {});
  };

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

  const [selectedProductToRestock, setSelectedProductToRestock] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  const getFilteredSales = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(endOfToday);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    const dayOfWeek = now.getDay();
    const mondayOffset = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);
    const endOfWeek = new Date(endOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + (6 - ((dayOfWeek + 6) % 7)));

    if (dateFilter === 'Hoy') {
      return salesHistory.filter(s => {
        const ts = s.timestamp ? new Date(s.timestamp) : null;
        return ts && ts >= startOfToday && ts <= endOfToday;
      });
    } else if (dateFilter === 'Ayer') {
      return salesHistory.filter(s => {
        const ts = s.timestamp ? new Date(s.timestamp) : null;
        return ts && ts >= startOfYesterday && ts <= endOfYesterday;
      });
    } else {
      return salesHistory.filter(s => {
        const ts = s.timestamp ? new Date(s.timestamp) : null;
        return ts && ts >= startOfWeek && ts <= endOfWeek;
      });
    }
  };

  const filteredSales = getFilteredSales();
  const salesTotal = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const ordersCount = filteredSales.length;
  const productsSold = filteredSales.reduce((sum, s) => sum + (s.items || 0), 0);
  const profitTotal = filteredSales.reduce((sum, s) => {
    const list = s.productsList || [];
    return sum + list.reduce((sub, item) => sub + ((item.price || 0) - (item.purchasePrice || 0)) * (item.qty || 1), 0);
  }, 0);
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5)).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5));
  const agotadosProducts = products.filter(p => p.stock === 0);

  // Payment method breakdown for filtered period
  const methodColors = { Efectivo: '#00D26A', Yape: '#7B2FF5', Plin: '#FF2D55', Tarjeta: '#0A84FF', Transferencia: '#FF9500' };
  const methodData = {};
  filteredSales.forEach(s => {
    const m = s.method || 'Efectivo';
    if (!methodData[m]) methodData[m] = { total: 0, count: 0 };
    methodData[m].total += s.total || 0;
    methodData[m].count += 1;
  });
  const paymentMethods = ['Efectivo', 'Yape', 'Plin', 'Tarjeta'];
  const avgTicket = ordersCount > 0 ? salesTotal / ordersCount : 0;

  const getWeeklySalesData = () => {
    const chartDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const now = new Date();
    const currentDayIdx = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayIdx);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    salesHistory.forEach(sale => {
      let saleDate = null;
      if (sale.timestamp) saleDate = new Date(sale.timestamp);
      else if (sale.date) saleDate = new Date(sale.date);
      if (!saleDate || isNaN(saleDate.getTime())) saleDate = now;
      if (saleDate >= monday && saleDate <= sunday) {
        let dayIdx = (saleDate.getDay() + 6) % 7;
        if (dayIdx >= 0 && dayIdx <= 6) dayTotals[dayIdx] += (sale.total || 0);
      }
    });
    const maxVal = Math.max(...dayTotals, 500);
    const rawSum = dayTotals.reduce((a, b) => a + b, 0);
    const weeklyTotalSum = salesHistory.length === 0 ? 0 : rawSum;
    return { chartDays, displayTotals: dayTotals, maxVal, currentDayIdx, weeklyTotalSum };
  };

  const { chartDays, displayTotals, maxVal: maxWeeklySale, currentDayIdx, weeklyTotalSum } = getWeeklySalesData();

  const handleRestock = () => {
    const qty = parseInt(restockQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Cantidad Inválida', 'Por favor ingresa una cantidad mayor a cero.');
      return;
    }
    if (!selectedProductToRestock) return;
    onUpdateProductStock(selectedProductToRestock.id, qty);
    Alert.alert('Reabastecimiento Exitoso', `Se agregaron ${qty} unidades a ${selectedProductToRestock.name}.`);
    setRestockQty('');
    setSelectedProductToRestock(null);
    setLowStockModalVisible(false);
    setAgotadosModalVisible(false);
  };

  const KPI_COLORS = {
    sales: { bg: 'rgba(0, 210, 106, 0.12)', icon: THEME.colors.primary, value: '#00d26a' },
    ticket: { bg: 'rgba(10, 132, 255, 0.12)', icon: '#0A84FF', value: '#0A84FF' },
    orders: { bg: 'rgba(255, 149, 0, 0.12)', icon: '#FF9500', value: '#FF9500' },
    stock: { bg: 'rgba(175, 82, 222, 0.12)', icon: '#AF52DE', value: '#AF52DE' },
    products: { bg: 'rgba(255, 45, 85, 0.12)', icon: '#FF2D55', value: '#FF2D55' },
  };
  const QUICK_COLORS = [
    { bg: 'rgba(0, 210, 106, 0.12)', icon: THEME.colors.primary },
    { bg: 'rgba(10, 132, 255, 0.12)', icon: '#0A84FF' },
    { bg: 'rgba(255, 149, 0, 0.12)', icon: '#FF9500' },
    { bg: 'rgba(175, 82, 222, 0.12)', icon: '#AF52DE' },
  ];

  const pctComplete = Math.min(100, Math.round((salesTotal / dailyTarget) * 100));
  const pctColor = pctComplete >= 100
    ? { fill: '#22B15B', bg: 'rgba(34,177,91,0.12)', border: 'rgba(34,177,91,0.3)' }
    : pctComplete >= 70
    ? { fill: '#FF9500', bg: 'rgba(255,149,0,0.12)', border: 'rgba(255,149,0,0.3)' }
    : { fill: '#FF3B30', bg: 'rgba(255,59,48,0.12)', border: 'rgba(255,59,48,0.3)' };
  const getMetaMessage = () => {
    if (pctComplete >= 100) return '¡Meta del día alcanzada! Excelente trabajo.';
    if (pctComplete >= 75) return '¡Muy cerca de la meta! Sigue así.';
    if (pctComplete >= 50) return 'Vas bien, sigue trabajando para alcanzar la meta.';
    if (pctComplete >= 25) return 'Buen inicio, aún hay tiempo para llegar a la meta.';
    return 'Empieza a vender para alcanzar tu meta diaria.';
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.contentContainer} showsVerticalScrollIndicator={false}>
      {/* GREETING */}
      <View style={s.greetingCard}>
        <TouchableOpacity onPress={() => setBranchModalVisible(true)} activeOpacity={0.7} style={{ flex: 1 }}>
          <Text style={s.greetingTitle} numberOfLines={1}>¡Bienvenido, {getUserDisplayName(loggedInUser)}!</Text>
          <View style={s.branchRow}>
            <Store size={12} color={THEME.colors.primary} />
            <Text style={s.branchText} numberOfLines={1}>{selectedBranch}</Text>
            <ChevronDown size={10} color={THEME.colors.primary} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.dateChip} onPress={() => setDateModalVisible(true)} activeOpacity={0.7}>
          <Calendar size={13} color={THEME.colors.primary} />
          <Text style={s.dateChipText}>{dateFilter}</Text>
        </TouchableOpacity>
      </View>

      {/* KPIs */}
      <TutorialStep stepName="dashboard_view">
        <View style={s.kpiGrid}>
          <View style={[s.kpiCard, { borderLeftColor: KPI_COLORS.sales.value, borderLeftWidth: 3 }]}>
            <View style={[s.kpiIconWrap, { backgroundColor: KPI_COLORS.sales.bg }]}>
              <ShoppingCart size={16} color={KPI_COLORS.sales.icon} />
            </View>
            <Text style={[s.kpiValue, { color: KPI_COLORS.sales.value }]}>S/ {salesTotal.toFixed(2)}</Text>
            <Text style={s.kpiLabel}>Ventas {dateFilter.toLowerCase()}</Text>
          </View>
          <View style={[s.kpiCard, { borderLeftColor: KPI_COLORS.ticket.value, borderLeftWidth: 3 }]}>
            <View style={[s.kpiIconWrap, { backgroundColor: KPI_COLORS.ticket.bg }]}>
              <TrendingUp size={16} color={KPI_COLORS.ticket.icon} />
            </View>
            <Text style={[s.kpiValue, { color: KPI_COLORS.ticket.value }]}>S/ {avgTicket.toFixed(2)}</Text>
            <Text style={s.kpiLabel}>Ticket promedio</Text>
          </View>
        </View>
        <View style={[s.kpiGrid, { marginTop: CARD_GAP }]}>
          <View style={[s.kpiCard, { borderLeftColor: KPI_COLORS.orders.value, borderLeftWidth: 3 }]}>
            <View style={[s.kpiIconWrap, { backgroundColor: KPI_COLORS.orders.bg }]}>
              <Receipt size={16} color={KPI_COLORS.orders.icon} />
            </View>
            <Text style={[s.kpiValue, { color: KPI_COLORS.orders.value }]}>{ordersCount}</Text>
            <Text style={s.kpiLabel}>Órdenes {dateFilter.toLowerCase()}</Text>
          </View>
          <View style={[s.kpiCard, { borderLeftColor: KPI_COLORS.stock.value, borderLeftWidth: 3 }]}>
            <View style={[s.kpiIconWrap, { backgroundColor: KPI_COLORS.stock.bg }]}>
              <Package size={16} color={KPI_COLORS.stock.icon} />
            </View>
            <Text style={[s.kpiValue, { color: KPI_COLORS.stock.value }]}>{totalStock}</Text>
            <Text style={s.kpiLabel}>Stock total</Text>
          </View>
        </View>
        <View style={[s.kpiGrid, { marginTop: CARD_GAP }]}>
          <View style={[s.kpiCard, { borderLeftColor: '#00D26A', borderLeftWidth: 3 }]}>
            <View style={[s.kpiIconWrap, { backgroundColor: 'rgba(0,210,106,0.12)' }]}>
              <TrendingUp size={16} color="#00D26A" />
            </View>
            <Text style={[s.kpiValue, { color: '#00D26A' }]}>S/ {profitTotal.toFixed(2)}</Text>
            <Text style={s.kpiLabel}>Ganancias {dateFilter.toLowerCase()}</Text>
          </View>
          <View style={[s.kpiCard, { borderLeftColor: KPI_COLORS.products.value, borderLeftWidth: 3 }]}>
            <View style={[s.kpiIconWrap, { backgroundColor: KPI_COLORS.products.bg }]}>
              <ShoppingCart size={16} color={KPI_COLORS.products.icon} />
            </View>
            <Text style={[s.kpiValue, { color: KPI_COLORS.products.value }]}>{productsSold}</Text>
            <Text style={s.kpiLabel}>Productos vendidos</Text>
          </View>
        </View>
      </TutorialStep>

      {/* WEEKLY CHART */}
      <View style={s.sectionCard}>
        <View style={s.sectionHead}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <TrendingUp size={15} color={THEME.colors.primary} />
            <Text style={s.sectionTitle}>Ventas semanales</Text>
          </View>
          <Text style={s.sectionTotal}>S/ {weeklyTotalSum.toFixed(2)}</Text>
        </View>
        <View style={s.chartBox}>
          <View style={s.chartY}>
            <Text style={s.chartYT}>S/ {maxWeeklySale >= 1000 ? `${(maxWeeklySale/1000).toFixed(1)}k` : maxWeeklySale.toFixed(0)}</Text>
            <Text style={s.chartYT}>S/ {(maxWeeklySale * 0.5).toFixed(0)}</Text>
            <Text style={s.chartYT}>S/ 0</Text>
          </View>
          <View style={s.chartCols}>
            {chartDays.map((day, idx) => {
              const val = displayTotals[idx];
              const h = Math.min(100, Math.max(8, (val / maxWeeklySale) * 100));
              const isToday = idx === currentDayIdx;
              return (
                <View key={day} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Text style={[s.chartV, isToday && { color: THEME.colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                    {val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0)}
                  </Text>
                  <View style={s.chartTrack}>
                    <View style={[s.chartFill, { height: `${h}%`, backgroundColor: isToday ? THEME.colors.primary : val > 0 ? 'rgba(0,210,106,0.35)' : 'rgba(255,255,255,0.05)' }]} />
                  </View>
                  <View style={[s.chartDay, isToday && s.chartDayActive]}>
                    <Text style={[s.chartDayTxt, isToday && { color: '#000', fontWeight: '700' }]}>{day}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* PAYMENT METHODS */}
      {filteredSales.length > 0 && (
        <View style={s.sectionCard}>
          <View style={s.sectionHead}>
            <Receipt size={15} color="#0A84FF" />
            <Text style={s.sectionTitle}>Métodos de pago {dateFilter.toLowerCase()}</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontSize: 11, color: '#888' }}>{ordersCount} ventas</Text>
          </View>
          <View style={{ gap: 8 }}>
            {paymentMethods.map(method => {
              const data = methodData[method];
              if (!data) return null;
              const pct = salesTotal > 0 ? (data.total / salesTotal) * 100 : 0;
              const color = methodColors[method] || '#888';
              return (
                <View key={method} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
                  <Text style={{ flex: 1, fontSize: 12.5, color: THEME.colors.textWhite, fontWeight: '500' }}>{method}</Text>
                  <Text style={{ fontSize: 12, color: THEME.colors.textGray, fontWeight: '600', minWidth: 70, textAlign: 'right' }}>S/ {data.total.toFixed(2)}</Text>
                  <Text style={{ fontSize: 12, color: color, fontWeight: '700', minWidth: 44, textAlign: 'right' }}>{pct.toFixed(0)}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ALERTS */}
      <View style={s.sectionCard}>
        <View style={s.sectionHead}>
          <AlertTriangle size={15} color={THEME.colors.warning} />
          <Text style={s.sectionTitle}>Alertas</Text>
          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <View style={s.alertBadge}><Text style={s.alertBadgeTxt}>{lowStockCount + outOfStockCount}</Text></View>
          )}
        </View>
        <View style={{ gap: 8 }}>
          <TouchableOpacity style={s.alertRow} onPress={() => setLowStockModalVisible(true)} activeOpacity={0.7}>
            <View style={s.alertLeft}>
              <View style={[s.alertIcon, { backgroundColor: 'rgba(255, 149, 0, 0.12)' }]}>
                <AlertTriangle size={16} color="#FF9500" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>Stock bajo</Text>
                <Text style={s.alertDesc}>{lowStockCount} productos</Text>
              </View>
            </View>
            <ChevronRight size={14} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={s.alertRow} onPress={() => setAgotadosModalVisible(true)} activeOpacity={0.7}>
            <View style={s.alertLeft}>
              <View style={[s.alertIcon, { backgroundColor: 'rgba(255, 59, 48, 0.12)' }]}>
                <Package size={16} color="#FF3B30" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>Agotados</Text>
                <Text style={s.alertDesc}>{outOfStockCount} productos</Text>
              </View>
            </View>
            <ChevronRight size={14} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={s.alertRow} onPress={() => setMetaModalVisible(true)} activeOpacity={0.7}>
            <View style={s.alertLeft}>
              <View style={[s.alertIcon, { backgroundColor: 'rgba(0, 210, 106, 0.12)' }]}>
                <Target size={16} color={THEME.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>Meta diaria</Text>
                <Text style={s.alertDesc}>
                  <Text style={{ color: salesTotal >= dailyTarget ? THEME.colors.success : THEME.colors.warning, fontWeight: '700' }}>
                    {((salesTotal / dailyTarget) * 100).toFixed(0)}%
                  </Text>
                  {' · '}S/ {salesTotal.toFixed(2)} de S/ {dailyTarget.toFixed(2)}
                </Text>
              </View>
            </View>
            <ChevronRight size={14} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {/* INVENTARIO SUMMARY */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[s.sectionCard, { flex: 1, padding: 12 }]}>
          <Text style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Productos</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: THEME.colors.textWhite, marginTop: 2 }}>{products.length}</Text>
          <Text style={{ fontSize: 10, color: THEME.colors.textGray, marginTop: 1 }}>{totalStock} und. en stock</Text>
        </View>
        <View style={[s.sectionCard, { flex: 1, padding: 12 }]}>
          <Text style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Categorías</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: THEME.colors.textWhite, marginTop: 2 }}>{[...new Set(products.map(p => p.category).filter(Boolean))].length}</Text>
          <Text style={{ fontSize: 10, color: THEME.colors.textGray, marginTop: 1 }}>en catálogo</Text>
        </View>
        <View style={[s.sectionCard, { flex: 1, padding: 12 }]}>
          <Text style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Valorización</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: THEME.colors.primary, marginTop: 2 }}>S/ {products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0).toFixed(0)}</Text>
          <Text style={{ fontSize: 10, color: THEME.colors.textGray, marginTop: 1 }}>stock total</Text>
        </View>
      </View>

      {/* QUICK ACCESS */}
      <View style={s.sectionCard}>
        <View style={s.sectionHead}>
          <Store size={15} color={THEME.colors.primary} />
          <Text style={s.sectionTitle}>Accesos rápidos</Text>
        </View>
        <View style={s.quickGrid}>
          {[
            { label: 'Productos', icon: Package, route: 'products', color: QUICK_COLORS[0] },
            { label: 'Nueva venta', icon: ShoppingCart, route: 'scanner', color: QUICK_COLORS[1] },
            { label: 'Ventas', icon: Receipt, route: 'sales', color: QUICK_COLORS[2] },
            { label: 'Reportes', icon: TrendingUp, route: 'reports', color: QUICK_COLORS[3] },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={item.route} style={s.quickBtn} onPress={() => onMetaClick(item.route)} activeOpacity={0.7}>
                <View style={[s.quickIcon, { backgroundColor: item.color.bg }]}>
                  <Icon size={22} color={item.color.icon} />
                </View>
                <Text style={s.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* MODAL: Branch */}
      <Modal visible={branchModalVisible} transparent animationType="fade" onRequestClose={() => setBranchModalVisible(false)}>
        <TouchableOpacity style={s.modalOver} activeOpacity={1} onPress={() => setBranchModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[s.modalBox, { width: '88%', maxWidth: 360, padding: 20 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Store size={20} color={THEME.colors.primary} />
                <Text style={s.modalTitle}>Nombre de tu Local</Text>
              </View>
              <TouchableOpacity onPress={() => setBranchModalVisible(false)}><X size={18} color="#666" /></TouchableOpacity>
            </View>
            <Text style={{ color: THEME.colors.textGray, fontSize: 12, marginBottom: 14 }}>Configura el nombre de tu negocio o sucursal activa:</Text>
            {branches.map((branch) => (
              <TouchableOpacity key={branch} style={s.modalItem} onPress={() => handleSelectBranch(branch)}>
                <Text style={{ color: THEME.colors.textWhite, fontSize: 14.5, fontWeight: '500' }}>{branch}</Text>
                {selectedBranch === branch && <Check size={18} color={THEME.colors.primary} />}
              </TouchableOpacity>
            ))}
            <Text style={{ color: '#666', fontSize: 11, fontWeight: '700', marginTop: 12, marginBottom: 8, letterSpacing: 0.5 }}>SUGERENCIAS RÁPIDAS:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {['🏪 Bodega San Martín', '🛒 Minimarket El Sol', '🏬 Comercial Puyo', '🏠 Mi Tienda'].map((chip) => {
                const cleanName = chip.replace(/^[^\s]+\s/, '');
                return (
                  <TouchableOpacity key={chip} style={{ backgroundColor: THEME.colors.inputBg, borderWidth: 1, borderColor: selectedBranch === cleanName ? THEME.colors.primary : THEME.colors.borderDark, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 }} onPress={() => handleSelectBranch(cleanName)}>
                    <Text style={{ color: THEME.colors.textWhite, fontSize: 11.5, fontWeight: '500' }}>{chip}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: THEME.colors.borderDark, paddingTop: 14, marginTop: 4 }}>
              <Text style={{ color: '#666', fontSize: 11, marginBottom: 8, fontWeight: '700', letterSpacing: 0.5 }}>ESCRIBIR OTRO NOMBRE</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={{ flex: 1, backgroundColor: THEME.colors.inputBg, borderWidth: 1, borderColor: THEME.colors.border, borderRadius: 10, paddingHorizontal: 12, height: 40, color: THEME.colors.textWhite, fontSize: 13.5 }} placeholder="ej. Don Andrés, Bodega..." placeholderTextColor={THEME.colors.textGray} value={newBranchInput} onChangeText={setNewBranchInput} />
                <TouchableOpacity style={{ backgroundColor: THEME.colors.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', height: 40 }} onPress={handleAddNewBranch}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: Date */}
      <Modal visible={dateModalVisible} transparent animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
        <TouchableOpacity style={s.modalOver} activeOpacity={1} onPress={() => setDateModalVisible(false)}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Filtrar Datos</Text>
            {['Hoy', 'Ayer', 'Esta semana'].map((filter) => (
              <TouchableOpacity key={filter} style={s.modalItem} onPress={() => { setDateFilter(filter); setDateModalVisible(false); }}>
                <Text style={{ color: THEME.colors.textWhite, fontSize: 16 }}>{filter}</Text>
                {dateFilter === filter && <Check size={18} color={THEME.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: Low Stock */}
      <Modal visible={lowStockModalVisible} transparent animationType="slide" onRequestClose={() => setLowStockModalVisible(false)}>
        <View style={s.modalFullOver}>
          <View style={s.modalFullBox}>
            <View style={s.modalFullHead}>
              <Text style={s.modalFullTitle}>Productos con Stock Bajo</Text>
              <TouchableOpacity onPress={() => { setLowStockModalVisible(false); setSelectedProductToRestock(null); setRestockQty(''); }}>
                <X size={24} color={THEME.colors.textWhite} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, padding: 16 }}>
              {selectedProductToRestock ? (
                <View>
                  <Text style={s.restockName}>Abastecer: {selectedProductToRestock.name}</Text>
                  <Text style={s.restockInfo}>Stock Actual: {selectedProductToRestock.stock} unidades</Text>
                  <Text style={{ color: THEME.colors.textGray, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>Se incrementará el stock actual al ingresar la cantidad</Text>
                  <View style={[s.inputWrap, { marginTop: 15 }]}>
                    <TextInput placeholder="Cantidad a agregar" placeholderTextColor={THEME.colors.textGray} style={s.input} keyboardType="number-pad" value={restockQty} onChangeText={setRestockQty} />
                  </View>
                  {restockQty.trim() !== '' && !isNaN(parseInt(restockQty)) && parseInt(restockQty) > 0 && (
                    <View>
                      <View style={s.stockCalcRow}>
                        <View style={s.stockCalcItem}>
                          <Text style={s.stockCalcLabel}>Stock actual</Text>
                          <Text style={s.stockCalcNum}>{selectedProductToRestock.stock}</Text>
                        </View>
                        <Text style={s.stockCalcOp}>+</Text>
                        <View style={s.stockCalcItem}>
                          <Text style={s.stockCalcLabel}>A añadir</Text>
                          <Text style={s.stockCalcAdd}>{parseInt(restockQty)}</Text>
                        </View>
                        <Text style={s.stockCalcOp}>=</Text>
                        <View style={s.stockCalcItem}>
                          <Text style={s.stockCalcLabel}>Stock final</Text>
                          <Text style={s.stockCalcRes}>{selectedProductToRestock.stock + parseInt(restockQty)}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                  <View style={{ gap: 10, marginTop: 20 }}>
                    <TouchableOpacity style={s.btnPrimary} onPress={handleRestock}><Text style={s.btnText}>Confirmar Ingreso</Text></TouchableOpacity>
                    <TouchableOpacity style={s.btnSecondary} onPress={() => { setSelectedProductToRestock(null); setRestockQty(''); }}><Text style={{ color: THEME.colors.textGray, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>Volver al listado</Text></TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {lowStockProducts.length > 0 ? lowStockProducts.map((p) => (
                    <TouchableOpacity key={p.id} style={s.productRow} onPress={() => setSelectedProductToRestock(p)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Image source={{ uri: p.image }} style={s.thumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: THEME.colors.textWhite, fontWeight: '600', fontSize: 13 }}>{p.name}</Text>
                          <Text style={{ color: '#FF9500', fontSize: 11 }}>Stock: {p.stock} und.</Text>
                        </View>
                      </View>
                      <View style={s.plusBtn}><Plus size={16} color="#fff" /></View>
                    </TouchableOpacity>
                  )) : <Text style={s.emptyTxt}>No hay productos con stock bajo.</Text>}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Agotados */}
      <Modal visible={agotadosModalVisible} transparent animationType="slide" onRequestClose={() => setAgotadosModalVisible(false)}>
        <View style={s.modalFullOver}>
          <View style={s.modalFullBox}>
            <View style={s.modalFullHead}>
              <Text style={s.modalFullTitle}>Productos Agotados</Text>
              <TouchableOpacity onPress={() => { setAgotadosModalVisible(false); setSelectedProductToRestock(null); setRestockQty(''); }}>
                <X size={24} color={THEME.colors.textWhite} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, padding: 16 }}>
              {selectedProductToRestock ? (
                <View>
                  <Text style={s.restockName}>Abastecer: {selectedProductToRestock.name}</Text>
                  <Text style={s.restockInfo}>Stock Actual: AGOTADO</Text>
                  <Text style={{ color: THEME.colors.textGray, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>Se incrementará el stock actual al ingresar la cantidad</Text>
                  <View style={[s.inputWrap, { marginTop: 15 }]}>
                    <TextInput placeholder="Cantidad a agregar" placeholderTextColor={THEME.colors.textGray} style={s.input} keyboardType="number-pad" value={restockQty} onChangeText={setRestockQty} />
                  </View>
                  {restockQty.trim() !== '' && !isNaN(parseInt(restockQty)) && parseInt(restockQty) > 0 && (
                    <View>
                      <View style={s.stockCalcRow}>
                        <View style={s.stockCalcItem}>
                          <Text style={s.stockCalcLabel}>Stock actual</Text>
                          <Text style={s.stockCalcNum}>0</Text>
                        </View>
                        <Text style={s.stockCalcOp}>+</Text>
                        <View style={s.stockCalcItem}>
                          <Text style={s.stockCalcLabel}>A añadir</Text>
                          <Text style={s.stockCalcAdd}>{parseInt(restockQty)}</Text>
                        </View>
                        <Text style={s.stockCalcOp}>=</Text>
                        <View style={s.stockCalcItem}>
                          <Text style={s.stockCalcLabel}>Stock final</Text>
                          <Text style={s.stockCalcRes}>{parseInt(restockQty)}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                  <View style={{ gap: 10, marginTop: 20 }}>
                    <TouchableOpacity style={s.btnPrimary} onPress={handleRestock}><Text style={s.btnText}>Confirmar Ingreso</Text></TouchableOpacity>
                    <TouchableOpacity style={s.btnSecondary} onPress={() => { setSelectedProductToRestock(null); setRestockQty(''); }}><Text style={{ color: THEME.colors.textGray, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>Volver al listado</Text></TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {agotadosProducts.length > 0 ? agotadosProducts.map((p) => (
                    <TouchableOpacity key={p.id} style={s.productRow} onPress={() => setSelectedProductToRestock(p)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Image source={{ uri: p.image }} style={s.thumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: THEME.colors.textWhite, fontWeight: '600', fontSize: 13 }}>{p.name}</Text>
                          <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: '600' }}>AGOTADO</Text>
                        </View>
                      </View>
                      <View style={s.plusBtn}><Plus size={16} color="#fff" /></View>
                    </TouchableOpacity>
                  )) : <Text style={s.emptyTxt}>¡Excelente! No tienes productos agotados.</Text>}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Meta */}
      <Modal visible={metaModalVisible} transparent animationType="fade" onRequestClose={() => { setMetaModalVisible(false); setEditingTarget(false); }}>
        <TouchableOpacity style={s.modalOver} activeOpacity={1} onPress={() => { setMetaModalVisible(false); setEditingTarget(false); }}>
          <TouchableOpacity activeOpacity={1} style={[s.metaModalBox]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Header */}
              <View style={{ alignItems: 'center', paddingTop: 28, paddingHorizontal: 24, paddingBottom: 20 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: pctColor.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Target size={28} color={pctColor.fill} />
                </View>
                <Text style={[s.modalTitle, { marginBottom: 4 }]}>Meta de Ventas Diaria</Text>
                <Text style={{ color: THEME.colors.textGray, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>{getMetaMessage()}</Text>
              </View>

              <View style={{ borderBottomWidth: 1, borderBottomColor: THEME.colors.borderDark }} />

              {/* Progress Section */}
              <View style={{ padding: 20 }}>
                {/* Big Percentage Circle */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 5, borderColor: pctColor.border, alignItems: 'center', justifyContent: 'center', backgroundColor: pctColor.bg }}>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: pctColor.fill }}>{pctComplete}%</Text>
                  </View>
                </View>

                {/* Amount Display */}
                {editingTarget ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <Text style={{ color: THEME.colors.textGray, fontSize: 14, fontWeight: '600' }}>S/</Text>
                    <TextInput
                      style={[s.input, { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', paddingVertical: 10 }]}
                      value={editTargetValue}
                      onChangeText={setEditTargetValue}
                      keyboardType="decimal-pad"
                      placeholder="1500"
                      placeholderTextColor="#555"
                    />
                    <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center' }} onPress={handleSaveTarget} activeOpacity={0.7}>
                      <Check size={16} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: THEME.colors.inputBg, borderWidth: 1, borderColor: THEME.colors.borderDark, alignItems: 'center', justifyContent: 'center' }} onPress={() => { setEditingTarget(false); setEditTargetValue(String(dailyTarget)); }} activeOpacity={0.7}>
                      <X size={14} color={THEME.colors.textGray} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => { setEditTargetValue(String(dailyTarget)); setEditingTarget(true); }} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
                    <Text style={{ color: THEME.colors.textWhite, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>S/ {dailyTarget.toFixed(2)}</Text>
                    <PenLine size={13} color={THEME.colors.textGray} />
                  </TouchableOpacity>
                )}

                {/* Progress Bar */}
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${Math.min(100, pctComplete)}%`, backgroundColor: pctColor.fill }]} />
                </View>

                {/* Stats Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: THEME.colors.textGray }}>S/ {salesTotal.toFixed(2)}</Text>
                  <Text style={{ fontSize: 11, color: THEME.colors.textGray }}>S/ {dailyTarget.toFixed(2)}</Text>
                </View>

                {/* Remaining / Surplus */}
                <View style={{ alignItems: 'center', marginTop: 12 }}>
                  {salesTotal >= dailyTarget ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 13, color: THEME.colors.success, fontWeight: '700' }}>🎉 Meta cumplida</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: THEME.colors.warning, fontWeight: '600' }}>
                      Faltan S/ {(dailyTarget - salesTotal).toFixed(2)} para la meta
                    </Text>
                  )}
                </View>

                {/* Detail Stats */}
                <View style={s.metaRow}>
                  <View style={s.metaBlock}>
                    <Text style={s.metaLabel}>Ventas hoy</Text>
                    <Text style={s.metaValue}>S/ {salesTotal.toFixed(2)}</Text>
                  </View>
                  <View style={s.metaBlock}>
                    <Text style={s.metaLabel}>Ticket Prom.</Text>
                    <Text style={s.metaValue}>S/ {avgTicket.toFixed(2)}</Text>
                  </View>
                  <View style={s.metaBlock}>
                    <Text style={s.metaLabel}>Transacciones</Text>
                    <Text style={s.metaValue}>{ordersCount}</Text>
                  </View>
                </View>

                {/* Remaining transactions hint */}
                {salesTotal < dailyTarget && ordersCount > 0 && (
                  <View style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 11, color: THEME.colors.textGray, textAlign: 'center', lineHeight: 16 }}>
                      Con ticket promedio de S/ {avgTicket.toFixed(2)}, 
                      necesitas <Text style={{ color: THEME.colors.textWhite, fontWeight: '700' }}>
                        {Math.ceil((dailyTarget - salesTotal) / avgTicket)}
                      </Text> venta{Math.ceil((dailyTarget - salesTotal) / avgTicket) !== 1 ? 's' : ''} más
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: THEME.colors.primary, marginTop: 16, paddingVertical: 12 }]} onPress={() => { setMetaModalVisible(false); setEditingTarget(false); }}>
                  <Text style={s.btnText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  contentContainer: { padding: 14, paddingBottom: 32, gap: 14 },

  greetingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: THEME.colors.card, borderRadius: 18,
    borderWidth: 1, borderColor: THEME.colors.borderDark,
    padding: 14, paddingVertical: 12,
  },
  greetingTitle: { fontSize: 16, fontWeight: '700', color: THEME.colors.textWhite },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  branchText: { fontSize: 12, color: THEME.colors.primary, fontWeight: '600', maxWidth: SCREEN_WIDTH * 0.4 },
  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: THEME.colors.inputBg, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 11,
    borderWidth: 1, borderColor: THEME.colors.borderDark,
  },
  dateChipText: { fontSize: 12, color: THEME.colors.textWhite, fontWeight: '600' },

  kpiGrid: { flexDirection: 'row', gap: CARD_GAP },
  kpiCard: {
    flex: 1, backgroundColor: THEME.colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: THEME.colors.borderDark,
    padding: 14, gap: 6,
  },
  kpiIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  kpiLabel: { fontSize: 11, color: THEME.colors.textGray, fontWeight: '500' },

  sectionCard: {
    backgroundColor: THEME.colors.card, borderRadius: 18,
    borderWidth: 1, borderColor: THEME.colors.borderDark, padding: 14,
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: THEME.colors.textWhite },
  sectionTotal: { fontSize: 13, fontWeight: '700', color: THEME.colors.primary },

  alertBadge: {
    backgroundColor: THEME.colors.danger, minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  alertBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },

  chartBox: { flexDirection: 'row', gap: 8, height: 140, alignItems: 'center' },
  chartY: { justifyContent: 'space-between', height: '100%', paddingBottom: 20, paddingTop: 12 },
  chartYT: { color: '#666', fontSize: 9 },
  chartCols: { flex: 1, flexDirection: 'row', height: '100%', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
  chartV: { fontSize: 8, color: '#666', marginBottom: 2, textAlign: 'center' },
  chartTrack: { flex: 1, width: '100%', maxWidth: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  chartFill: { width: '100%', borderRadius: 6 },
  chartDay: { marginTop: 4, paddingHorizontal: 3, paddingVertical: 2, borderRadius: 4, alignItems: 'center' },
  chartDayActive: { backgroundColor: THEME.colors.primary },
  chartDayTxt: { color: '#666', fontSize: 9, fontWeight: '600' },

  alertRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: THEME.colors.inputBg, borderRadius: 12, padding: 11,
  },
  alertLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  alertIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontWeight: '600', color: THEME.colors.textWhite },
  alertDesc: { fontSize: 11, color: THEME.colors.textGray, marginTop: 1 },

  quickGrid: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, alignItems: 'center', gap: 8, backgroundColor: THEME.colors.inputBg, borderRadius: 14, paddingVertical: 14 },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, color: THEME.colors.textWhite, fontWeight: '600', textAlign: 'center' },

  modalOver: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: THEME.colors.card, borderWidth: 1, borderColor: THEME.colors.borderDark, borderRadius: 20, width: '100%', maxWidth: 300, padding: 20, maxHeight: 480 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: THEME.colors.textWhite },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: THEME.colors.borderDark },

  modalFullOver: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalFullBox: { backgroundColor: THEME.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: SCREEN_HEIGHT * 0.65, borderWidth: 1, borderColor: THEME.colors.borderDark },
  modalFullHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: THEME.colors.borderDark },
  modalFullTitle: { fontSize: 17, fontWeight: '700', color: THEME.colors.textWhite },
  productRow: { backgroundColor: THEME.colors.card, borderWidth: 1, borderColor: THEME.colors.border, borderRadius: 14, padding: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: THEME.colors.inputBg },
  plusBtn: { backgroundColor: THEME.colors.primaryDark, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 14 },
  restockName: { fontSize: 17, fontWeight: '700', color: THEME.colors.textWhite },
  restockInfo: { fontSize: 13, color: '#888', marginTop: 3 },
  stockCalcRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 8 },
  stockCalcItem: { alignItems: 'center' },
  stockCalcLabel: { fontSize: 10, color: '#888', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  stockCalcNum: { fontSize: 22, fontWeight: '800', color: THEME.colors.textWhite },
  stockCalcOp: { fontSize: 18, fontWeight: '600', color: '#555', marginHorizontal: 2 },
  stockCalcAdd: { fontSize: 22, fontWeight: '800', color: THEME.colors.primary },
  stockCalcRes: { fontSize: 22, fontWeight: '800', color: '#0A84FF' },
  inputWrap: { backgroundColor: THEME.colors.inputBg, borderWidth: 1, borderColor: THEME.colors.borderDark, borderRadius: 12 },
  input: { paddingVertical: 13, paddingHorizontal: 15, color: THEME.colors.textWhite, fontSize: 15 },
  btnPrimary: { backgroundColor: THEME.colors.success, borderRadius: 14, padding: 15, alignItems: 'center' },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.colors.borderDark, borderRadius: 14, padding: 15 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  progressTrack: { width: '100%', height: 8, backgroundColor: THEME.colors.borderDark, borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', backgroundColor: THEME.colors.primary },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 16, borderTopWidth: 1, borderTopColor: THEME.colors.borderDark, paddingTop: 16 },
  metaBlock: { flex: 1, backgroundColor: THEME.colors.inputBg, borderWidth: 1, borderColor: THEME.colors.borderDark, padding: 10, borderRadius: 10, alignItems: 'center' },
  metaLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 15, fontWeight: '800', color: THEME.colors.textWhite, marginTop: 4 },
  metaModalBox: { backgroundColor: THEME.colors.card, borderWidth: 1, borderColor: THEME.colors.borderDark, borderRadius: 20, width: '88%', maxWidth: 360, maxHeight: SCREEN_HEIGHT * 0.75, overflow: 'hidden' },
});
