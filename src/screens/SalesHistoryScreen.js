import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { 
  Receipt, 
  Clock, 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ShoppingBag, 
  TrendingUp, 
  CalendarDays,
  Filter,
  User,
  CheckCircle2,
  Share2,
  ChevronRight,
  Circle
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { THEME } from '../constants/theme';
import TutorialStep from '../components/TutorialStep';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days}d`;
  const d = new Date(timestamp);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function getDateKey(timestamp) {
  if (!timestamp) return 'other';
  const d = new Date(timestamp);
  const now = new Date();
  const saleDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (saleDate.getTime() === today.getTime()) return 'today';
  if (saleDate.getTime() === yesterday.getTime()) return 'yesterday';
  return 'older';
}

function formatDateHeader(key, timestamp) {
  if (key === 'today') return 'Hoy';
  if (key === 'yesterday') return 'Ayer';
  if (timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' });
  }
  return 'Anteriores';
}

const METHOD_CONFIG = {
  'Efectivo': { color: '#22B15B', bg: 'rgba(34,177,91,0.12)', icon: Banknote },
  'Yape': { color: '#A0C1F7', bg: 'rgba(160,193,247,0.12)', icon: Smartphone },
  'Plin': { color: '#00D4AA', bg: 'rgba(0,212,170,0.12)', icon: Smartphone },
  'Tarjeta': { color: '#FF9500', bg: 'rgba(255,149,0,0.12)', icon: CreditCard },
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todas' },
  { key: 'Efectivo', label: 'Efectivo' },
  { key: 'Yape', label: 'Yape' },
  { key: 'Plin', label: 'Plin' },
  { key: 'Tarjeta', label: 'Tarjeta' },
];

function BoletaContent({ sale }) {
  const method = METHOD_CONFIG[sale.method] || METHOD_CONFIG['Efectivo'];
  const MethodIcon = method.icon;
  const products = sale.productsList || [];
  const subtotal = products.reduce((sum, p) => sum + (p.price * p.qty), 0);
  const igv = subtotal * 0.18;
  const dateStr = sale.timestamp 
    ? new Date(sale.timestamp).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';
  const hourStr = sale.timestamp
    ? new Date(sale.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';
  const dayStr = sale.timestamp
    ? new Date(sale.timestamp).toLocaleDateString('es-PE', { weekday: 'long' })
    : '';
  const relTime = getRelativeTime(sale.timestamp);
  const totalUnits = products.reduce((sum, p) => sum + p.qty, 0);
  const uniqueProducts = products.length;

  return (
    <View style={[styles.boleta, { width: 320, alignSelf: 'center' }]}>
      <View style={styles.boletaHeader}>
        <View style={styles.boletaStoreIcon}>
          <Text style={{ fontSize: 24 }}>🏪</Text>
        </View>
        <Text style={styles.boletaStoreName}>VENDIX POS</Text>
        <Text style={styles.boletaStoreSub}>Sistema de Punto de Venta</Text>
        <View style={styles.boletaDashLine} />
      </View>

      <View style={styles.boletaIdSection}>
        <View style={styles.boletaIdLeft}>
          <Text style={styles.boletaIdLabel}>COMPROBANTE</Text>
          <Text style={styles.boletaIdValue}>{sale.id}</Text>
        </View>
        <View style={styles.boletaStatusBadge}>
          <CheckCircle2 size={12} color="#22B15B" />
          <Text style={styles.boletaStatusText}>COMPLETADA</Text>
        </View>
      </View>
      <View style={styles.boletaDashLine} />

      <View style={styles.boletaDateTimeBlock}>
        <View style={styles.boletaDTRow}>
          <Text style={styles.boletaDTLabel}>DIA</Text>
          <Text style={styles.boletaDTValue}>{dayStr}</Text>
        </View>
        <View style={styles.boletaDTDivider} />
        <View style={styles.boletaDTRow}>
          <Text style={styles.boletaDTLabel}>FECHA</Text>
          <Text style={styles.boletaDTValue}>{dateStr}</Text>
        </View>
        <View style={styles.boletaDTDivider} />
        <View style={styles.boletaDTRow}>
          <Text style={styles.boletaDTLabel}>HORA</Text>
          <Text style={styles.boletaDTValue}>{hourStr}</Text>
        </View>
        <View style={styles.boletaDTDivider} />
        <View style={styles.boletaDTRow}>
          <Text style={styles.boletaDTLabel}>TRANSCURRIDO</Text>
          <Text style={styles.boletaDTValue}>{relTime}</Text>
        </View>
      </View>
      <View style={styles.boletaDashLine} />

      <View style={styles.boletaClientSection}>
        <Text style={styles.boletaClientLabel}>CLIENTE</Text>
        <Text style={styles.boletaClientName}>{sale.client || 'General'}</Text>
      </View>
      <View style={styles.boletaDashLine} />

      <View style={styles.boletaPaymentSection}>
        <Text style={styles.boletaPaymentLabel}>MÉTODO DE PAGO</Text>
        <View style={[styles.boletaPaymentCard, { borderColor: method.color + '40' }]}>
          <View style={[styles.boletaPaymentIcon, { backgroundColor: method.bg }]}>
            <MethodIcon size={20} color={method.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.boletaPaymentMethod, { color: method.color }]}>{sale.method}</Text>
            <Text style={styles.boletaPaymentSub}>Pago confirmado</Text>
          </View>
          <CheckCircle2 size={18} color={method.color} />
        </View>
      </View>
      <View style={styles.boletaDashLine} />

      {products.length > 0 ? (
        <View style={styles.boletaProductsSection}>
          <Text style={styles.boletaSectionTitle}>DETALLE DE PRODUCTOS</Text>
          <View style={styles.boletaTableHeader}>
            <Text style={[styles.boletaTableHeaderText, { flex: 0.5 }]}>#</Text>
            <Text style={[styles.boletaTableHeaderText, { flex: 2 }]}>PRODUCTO</Text>
            <Text style={[styles.boletaTableHeaderText, { flex: 0.8, textAlign: 'center' }]}>CANT.</Text>
            <Text style={[styles.boletaTableHeaderText, { flex: 1, textAlign: 'right' }]}>P.UNIT.</Text>
            <Text style={[styles.boletaTableHeaderText, { flex: 1.2, textAlign: 'right' }]}>SUBTOTAL</Text>
          </View>
          {products.map((p, i) => (
            <View key={i} style={styles.boletaProductRow}>
              <Text style={[styles.boletaProductNum, { flex: 0.5 }]}>{i + 1}</Text>
              <View style={{ flex: 2 }}>
                <Text style={styles.boletaProductName} numberOfLines={1}>{p.name}</Text>
              </View>
              <Text style={[styles.boletaProductCell, { flex: 0.8, textAlign: 'center' }]}>{p.qty}</Text>
              <Text style={[styles.boletaProductCell, { flex: 1, textAlign: 'right' }]}>{p.price.toFixed(2)}</Text>
              <Text style={[styles.boletaProductCellBold, { flex: 1.2, textAlign: 'right' }]}>{(p.price * p.qty).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.boletaDashLine} />
          <View style={styles.boletaTotalsBlock}>
            <View style={styles.boletaTotalRow}>
              <Text style={styles.boletaTotalLabel}>Subtotal</Text>
              <Text style={styles.boletaTotalValue}>S/ {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.boletaTotalRow}>
              <Text style={styles.boletaTotalLabel}>IGV (18%)</Text>
              <Text style={styles.boletaTotalValue}>S/ {igv.toFixed(2)}</Text>
            </View>
            <View style={styles.boletaTotalFinalDivider} />
            <View style={styles.boletaTotalRowFinal}>
              <Text style={styles.boletaTotalFinalLabel}>TOTAL</Text>
              <Text style={styles.boletaTotalFinalValue}>S/ {sale.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.boletaEmptyProducts}>
          <Text style={styles.boletaEmptyEmoji}>📋</Text>
          <Text style={styles.boletaEmptyText}>Detalle no disponible</Text>
        </View>
      )}
      <View style={styles.boletaDashLine} />

      <View style={styles.boletaStatsSection}>
        <View style={styles.boletaStatItem}>
          <Text style={styles.boletaStatNum}>{totalUnits}</Text>
          <Text style={styles.boletaStatLabel}>Unidades</Text>
        </View>
        <View style={styles.boletaStatDivider} />
        <View style={styles.boletaStatItem}>
          <Text style={styles.boletaStatNum}>{uniqueProducts}</Text>
          <Text style={styles.boletaStatLabel}>Productos</Text>
        </View>
        <View style={styles.boletaStatDivider} />
        <View style={styles.boletaStatItem}>
          <Text style={styles.boletaStatNum}>S/ {uniqueProducts > 0 ? (sale.total / totalUnits).toFixed(2) : '0.00'}</Text>
          <Text style={styles.boletaStatLabel}>Prom. Unit.</Text>
        </View>
      </View>
      <View style={styles.boletaDashLine} />

      <View style={styles.boletaFooter}>
        <Text style={styles.boletaFooterText}>Gracias por su compra</Text>
        <Text style={styles.boletaFooterSub}>Vendix POS — {dateStr}</Text>
        <View style={styles.boletaBarcode}>
          <Text style={styles.boletaBarcodeText}>||||| {sale.id} |||||</Text>
        </View>
      </View>
    </View>
  );
}

function SaleDetailModal({ sale, visible, onClose }) {
  const [sharing, setSharing] = useState(false);

  const generateBoletaHTML = (sale) => {
    const products = sale.productsList || [];
    const subtotal = products.reduce((sum, p) => sum + (p.price * p.qty), 0);
    const igv = subtotal * 0.18;
    const totalUnits = products.reduce((sum, p) => sum + p.qty, 0);
    const dateStr = sale.timestamp
      ? new Date(sale.timestamp).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
      : '';
    const hourStr = sale.timestamp
      ? new Date(sale.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '';
    const dayStr = sale.timestamp
      ? new Date(sale.timestamp).toLocaleDateString('es-PE', { weekday: 'long' })
      : '';

    const productRows = products.map((p, i) => `
      <tr>
        <td style="text-align:center; padding:6px 4px; border-bottom:1px solid #222;">${i + 1}</td>
        <td style="padding:6px 4px; border-bottom:1px solid #222; font-weight:600;">${p.name}</td>
        <td style="text-align:center; padding:6px 4px; border-bottom:1px solid #222;">${p.qty}</td>
        <td style="text-align:right; padding:6px 4px; border-bottom:1px solid #222;">S/ ${p.price.toFixed(2)}</td>
        <td style="text-align:right; padding:6px 4px; border-bottom:1px solid #222; font-weight:700;">S/ ${(p.price * p.qty).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#0a0a0a; color:#e0e0e0; font-family: -apple-system, Helvetica, Arial, sans-serif; padding:20px; width:595px; }
        .ticket { width:100%; background:#111; border-radius:12px; padding:28px 24px; border:1px solid #222; }
        .header { text-align:center; margin-bottom:18px; }
        .header h1 { font-size:36px; color:#22B15B; margin-bottom:4px; }
        .header p { font-size:16px; color:#777; }
        .divider { border-top:2px dashed #333; margin:14px 0; }
        .id-row { display:flex; justify-content:space-between; align-items:center; }
        .id-label { font-size:14px; color:#777; letter-spacing:1.5px; }
        .id-value { font-size:18px; color:#aaa; font-weight:600; margin-top:4px; }
        .badge { background:rgba(34,177,91,0.15); color:#22B15B; font-size:14px; font-weight:700; padding:5px 12px; border-radius:4px; }
        .dt-table { width:100%; }
        .dt-row { display:flex; justify-content:space-between; padding:6px 0; }
        .dt-label { font-size:14px; color:#777; letter-spacing:0.5px; }
        .dt-value { font-size:17px; color:#ccc; font-weight:600; }
        .section-label { font-size:14px; color:#777; letter-spacing:1.5px; margin-bottom:8px; }
        .client-name { font-size:22px; color:#fff; font-weight:700; }
        .payment-card { display:flex; align-items:center; gap:12px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:10px; padding:14px 16px; }
        .payment-method { font-size:20px; font-weight:700; color:#22B15B; }
        .payment-sub { font-size:13px; color:#666; }
        table { width:100%; border-collapse:collapse; margin-top:10px; }
        th { font-size:12px; color:#777; text-transform:uppercase; letter-spacing:1.5px; padding:8px 6px; border-bottom:1px solid #333; text-align:left; }
        td { font-size:16px; }
        th:last-child, td:last-child { text-align:right; }
        .total-section { margin-top:10px; }
        .total-row { display:flex; justify-content:space-between; padding:4px 0; }
        .total-label { font-size:16px; color:#888; }
        .total-value { font-size:16px; color:#ccc; }
        .total-final { display:flex; justify-content:space-between; padding:10px 0; border-top:3px solid #22B15B; margin-top:8px; }
        .total-final-label { font-size:22px; font-weight:800; color:#fff; }
        .total-final-value { font-size:24px; font-weight:800; color:#22B15B; }
        .stats { display:flex; justify-content:space-around; text-align:center; padding:14px 0; }
        .stat-num { font-size:22px; font-weight:800; color:#22B15B; }
        .stat-label { font-size:13px; color:#777; margin-top:4px; }
        .footer { text-align:center; margin-top:16px; }
        .footer p { font-size:14px; color:#555; }
        .barcode { font-family:monospace; font-size:20px; color:#444; letter-spacing:4px; margin-top:10px; }
      </style></head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>VENDIX POS</h1>
            <p>Sistema de Punto de Venta</p>
          </div>
          <div class="divider"></div>
          <div class="id-row">
            <div><div class="id-label">COMPROBANTE</div><div class="id-value">${sale.id}</div></div>
            <div class="badge">COMPLETADA</div>
          </div>
          <div class="divider"></div>
          <div class="dt-table">
            <div class="dt-row"><span class="dt-label">DÍA</span><span class="dt-value">${dayStr}</span></div>
            <div class="dt-row"><span class="dt-label">FECHA</span><span class="dt-value">${dateStr}</span></div>
            <div class="dt-row"><span class="dt-label">HORA</span><span class="dt-value">${hourStr}</span></div>
          </div>
          <div class="divider"></div>
          <div class="section-label">CLIENTE</div>
          <div class="client-name">${sale.client || 'General'}</div>
          <div class="divider"></div>
          <div class="section-label">MÉTODO DE PAGO</div>
          <div class="payment-card">
            <div>
              <div class="payment-method">${sale.method || 'Efectivo'}</div>
              <div class="payment-sub">Pago confirmado</div>
            </div>
          </div>
          <div class="divider"></div>
          ${products.length > 0 ? `
            <div class="section-label">DETALLE DE PRODUCTOS</div>
            <table>
              <thead><tr><th>#</th><th>PRODUCTO</th><th style="text-align:center">CANT.</th><th style="text-align:right">P.UNIT.</th><th>SUBTOTAL</th></tr></thead>
              <tbody>${productRows}</tbody>
            </table>
            <div class="total-section">
              <div class="total-row"><span class="total-label">Subtotal</span><span class="total-value">S/ ${subtotal.toFixed(2)}</span></div>
              <div class="total-row"><span class="total-label">IGV (18%)</span><span class="total-value">S/ ${igv.toFixed(2)}</span></div>
              <div class="total-final"><span class="total-final-label">TOTAL</span><span class="total-final-value">S/ ${sale.total.toFixed(2)}</span></div>
            </div>
          ` : '<p style="text-align:center;color:#555;padding:12px;">Detalle no disponible</p>'}
          <div class="divider"></div>
          <div class="stats">
            <div><div class="stat-num">${totalUnits}</div><div class="stat-label">Unidades</div></div>
            <div><div class="stat-num">${products.length}</div><div class="stat-label">Productos</div></div>
            <div><div class="stat-num">S/ ${products.length > 0 ? (sale.total / totalUnits).toFixed(2) : '0.00'}</div><div class="stat-label">Prom. Unit.</div></div>
          </div>
          <div class="divider"></div>
          <div class="footer">
            <p>Gracias por su compra</p>
            <p>Vendix POS — ${dateStr}</p>
            <div class="barcode">||||| ${sale.id} |||||</div>
          </div>
        </div>
      </body></html>
    `;
  };

  const handleShareBoleta = async () => {
    if (sharing || !sale) return;
    try {
      setSharing(true);
      const html = generateBoletaHTML(sale);
      const { uri } = await Print.printToFileAsync({ 
        html, 
        base64: false,
        width: 595,
        height: 842,
        margins: { left: 0, right: 0, top: 0, bottom: 0 },
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Boleta ${sale.id}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      console.log('Error sharing:', err);
    } finally {
      setSharing(false);
    }
  };

  if (!sale) return null;
  const method = METHOD_CONFIG[sale.method] || METHOD_CONFIG['Efectivo'];
  const MethodIcon = method.icon;
  const products = sale.productsList || [];
  const subtotal = products.reduce((sum, p) => sum + (p.price * p.qty), 0);
  const igv = subtotal * 0.18;

  const dateStr = sale.timestamp 
    ? new Date(sale.timestamp).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';
  const hourStr = sale.timestamp
    ? new Date(sale.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';
  const dayStr = sale.timestamp
    ? new Date(sale.timestamp).toLocaleDateString('es-PE', { weekday: 'long' })
    : '';
  const relTime = getRelativeTime(sale.timestamp);

  const totalUnits = products.reduce((sum, p) => sum + p.qty, 0);
  const uniqueProducts = products.length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#050505' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Close Button */}
          <View style={styles.boletaCloseRow}>
            <TouchableOpacity style={styles.boletaCloseBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={THEME.colors.textWhite} />
            </TouchableOpacity>
          </View>

          {/* ═══ BOLETA TICKET ═══ */}
          <BoletaContent sale={sale} />

          {/* Action Buttons */}
          <View style={styles.boletaActions}>
            <TouchableOpacity 
              style={[styles.boletaActionBtn, sharing && { opacity: 0.5 }]} 
              activeOpacity={0.7}
              onPress={handleShareBoleta}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              ) : (
                <Share2 size={16} color={THEME.colors.primary} />
              )}
              <Text style={styles.boletaActionText}>{sharing ? 'Capturando...' : 'Compartir Boleta'}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function SalesHistoryScreen({ salesHistory = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [detailSale, setDetailSale] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredSales = useMemo(() => {
    if (activeFilter === 'all') return salesHistory;
    return salesHistory.filter(s => s.method === activeFilter);
  }, [salesHistory, activeFilter]);

  const totalInvoicedToday = useMemo(() => {
    return salesHistory
      .filter(s => {
        if (!s.timestamp) return false;
        const d = new Date(s.timestamp);
        const saleDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return saleDate.getTime() === today.getTime();
      })
      .reduce((sum, s) => sum + s.total, 0);
  }, [salesHistory]);

  const todayCount = useMemo(() => {
    return salesHistory.filter(s => {
      if (!s.timestamp) return false;
      const d = new Date(s.timestamp);
      const saleDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return saleDate.getTime() === today.getTime();
    }).length;
  }, [salesHistory]);

  const totalFilteredAmount = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.total, 0);
  }, [filteredSales]);

  const methodBreakdown = useMemo(() => {
    const counts = { 'Efectivo': 0, 'Yape': 0, 'Plin': 0, 'Tarjeta': 0 };
    salesHistory.forEach(s => { if (counts[s.method] !== undefined) counts[s.method]++; });
    return counts;
  }, [salesHistory]);

  const groupedSales = useMemo(() => {
    const groups = {};
    const sorted = [...filteredSales].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    sorted.forEach(s => {
      const key = getDateKey(s.timestamp);
      if (!groups[key]) {
        groups[key] = { key, label: formatDateHeader(key, s.timestamp), sales: [], total: 0, count: 0 };
      }
      groups[key].sales.push(s);
      groups[key].total += s.total;
      groups[key].count++;
    });

    const order = ['today', 'yesterday', 'other'];
    return order.filter(k => groups[k]).map(k => groups[k]);
  }, [filteredSales]);

  const openDetail = (sale) => {
    setDetailSale(sale);
    setDetailVisible(true);
  };

  const totalSales = salesHistory.reduce((sum, s) => sum + s.total, 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitleText}>Mis Ventas</Text>
          <Text style={styles.pageSubtitle}>{salesHistory.length} boletas · S/ {totalSales.toFixed(2)} total</Text>
        </View>
        <View style={styles.headerDateBadge}>
          <CalendarDays size={14} color={THEME.colors.primary} />
          <Text style={styles.headerDateText}>
            {new Date().toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' })}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <TutorialStep stepName="sales_history_view">
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardMain]}>
            <View style={styles.statCardTop}>
              <TrendingUp size={16} color="#22B15B" />
              <Text style={styles.statCardLabel}>Ventas de Hoy</Text>
            </View>
            <Text style={styles.statCardAmount}>S/ {totalInvoicedToday.toFixed(2)}</Text>
            <Text style={styles.statCardSub}>{todayCount} transaccion{todayCount !== 1 ? 'es' : ''}</Text>
          </View>
          <View style={styles.statCardSide}>
            <View style={[styles.statCard, styles.statCardSmall, { borderLeftColor: '#22B15B', borderLeftWidth: 2 }]}>
              <Text style={styles.statCardSmallNum}>{methodBreakdown['Efectivo']}</Text>
              <Text style={styles.statCardSmallLabel}>Efectivo</Text>
            </View>
            <View style={[styles.statCard, styles.statCardSmall, { borderLeftColor: '#A0C1F7', borderLeftWidth: 2 }]}>
              <Text style={styles.statCardSmallNum}>{methodBreakdown['Yape'] + methodBreakdown['Plin']}</Text>
              <Text style={styles.statCardSmallLabel}>Digital</Text>
            </View>
            <View style={[styles.statCard, styles.statCardSmall, { borderLeftColor: '#FF9500', borderLeftWidth: 2 }]}>
              <Text style={styles.statCardSmallNum}>{methodBreakdown['Tarjeta']}</Text>
              <Text style={styles.statCardSmallLabel}>Tarjeta</Text>
            </View>
          </View>
        </View>
      </TutorialStep>

      {/* Summary Bar */}
      {filteredSales.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryBarItem}>
            <Text style={styles.summaryBarNum}>{filteredSales.length}</Text>
            <Text style={styles.summaryBarLabel}>ventas</Text>
          </View>
          <View style={styles.summaryBarDivider} />
          <View style={styles.summaryBarItem}>
            <Text style={styles.summaryBarNum}>S/ {totalFilteredAmount.toFixed(2)}</Text>
            <Text style={styles.summaryBarLabel}>total</Text>
          </View>
          <View style={styles.summaryBarDivider} />
          <View style={styles.summaryBarItem}>
            <Text style={styles.summaryBarNum}>
              {filteredSales.length > 0 ? 'S/ ' + (totalFilteredAmount / filteredSales.length).toFixed(2) : 'S/ 0.00'}
            </Text>
            <Text style={styles.summaryBarLabel}>promedio</Text>
          </View>
        </View>
      )}

      {/* Filter Pills */}
      <View style={styles.filterSection}>
        <Filter size={14} color={THEME.colors.textGray} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          {FILTER_OPTIONS.map((f) => {
            const isActive = activeFilter === f.key;
            const count = f.key === 'all' ? salesHistory.length : (methodBreakdown[f.key] || 0);
            const methodColor = f.key !== 'all' ? (METHOD_CONFIG[f.key]?.color || THEME.colors.textGray) : THEME.colors.primary;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, isActive && { backgroundColor: methodColor + '20', borderColor: methodColor + '50' }]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.7}
              >
                {f.key !== 'all' && (
                  <Circle size={7} color={methodColor} fill={methodColor} />
                )}
                <Text style={[styles.filterPillText, isActive && { color: methodColor }]}>{f.label}</Text>
                <View style={[styles.filterPillCount, isActive && { backgroundColor: methodColor + '30' }]}>
                  <Text style={[styles.filterPillCountText, isActive && { color: '#FFF' }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Grouped Sales */}
      {groupedSales.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Receipt size={40} color={THEME.colors.textGray} />
          </View>
          <Text style={styles.emptyTitle}>Sin ventas</Text>
          <Text style={styles.emptySub}>
            {activeFilter !== 'all' 
              ? `No hay ventas con el filtro "${activeFilter}"`
              : 'Las ventas aparecerán aquí cuando registres una'
            }
          </Text>
        </View>
      ) : (
        groupedSales.map((group) => (
          <View key={group.key} style={{ marginTop: 24 }}>
            {/* Date Header */}
            <View style={styles.dateHeader}>
              <View style={styles.dateHeaderLine} />
              <View style={styles.dateHeaderBadge}>
                <Text style={styles.dateHeaderLabel}>{group.label}</Text>
                <View style={styles.dateHeaderInfo}>
                  <Text style={styles.dateHeaderCount}>{group.count} venta{group.count !== 1 ? 's' : ''}</Text>
                  <Text style={styles.dateHeaderDot}>•</Text>
                  <Text style={styles.dateHeaderTotal}>S/ {group.total.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.dateHeaderLine} />
            </View>

            {/* Sales */}
            <View style={{ gap: 10, marginTop: 12 }}>
              {group.sales.map((s) => {
                const method = METHOD_CONFIG[s.method] || METHOD_CONFIG['Efectivo'];
                const MethodIcon = method.icon;
                const relTime = getRelativeTime(s.timestamp);
                const products = s.productsList || [];
                const productNames = products.slice(0, 2).map(p => p.name).join(', ');
                const moreProducts = products.length > 2 ? ` +${products.length - 2} más` : '';

                return (
                  <TouchableOpacity 
                    key={s.id} 
                    style={styles.saleCard}
                    onPress={() => openDetail(s)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.saleCardAccent, { backgroundColor: method.color }]} />
                    <View style={styles.saleCardContent}>
                      <View style={styles.saleCardTop}>
                        <View style={[styles.saleCardMethodIcon, { backgroundColor: method.bg }]}>
                          <MethodIcon size={18} color={method.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.saleCardIdRow}>
                            <Text style={styles.saleCardId}>{s.id}</Text>
                            <View style={[styles.saleCardMethodPill, { backgroundColor: method.color + '18' }]}>
                              <Text style={[styles.saleCardMethodText, { color: method.color }]}>{s.method}</Text>
                            </View>
                          </View>
                          <View style={styles.saleCardMetaRow}>
                            <Clock size={10} color={THEME.colors.textGray} />
                            <Text style={styles.saleCardTime}>{relTime}</Text>
                            {s.client && s.client !== 'General' && (
                              <>
                                <Text style={styles.saleCardDot}>•</Text>
                                <User size={10} color={THEME.colors.textGray} />
                                <Text style={styles.saleCardClient}>{s.client}</Text>
                              </>
                            )}
                          </View>
                        </View>
                        <View style={styles.saleCardRight}>
                          <Text style={styles.saleCardTotal}>S/ {s.total.toFixed(2)}</Text>
                          <Text style={styles.saleCardItems}>{s.items} ítem{s.items !== 1 ? 's' : ''}</Text>
                        </View>
                      </View>

                      {/* Product Preview */}
                      {productNames ? (
                        <View style={styles.saleCardProductPreview}>
                          <ShoppingBag size={11} color={THEME.colors.textGray} />
                          <Text style={styles.saleCardProductPreviewText} numberOfLines={1}>
                            {productNames}{moreProducts}
                          </Text>
                          <ChevronRight size={12} color={THEME.colors.textGray} />
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))
      )}

      {/* Detail Modal */}
      <SaleDetailModal 
        sale={detailSale} 
        visible={detailVisible} 
        onClose={() => { setDetailVisible(false); setDetailSale(null); }} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageTitleText: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.textWhite,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: THEME.colors.textGray,
    marginTop: 4,
  },
  headerDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,177,91,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,177,91,0.2)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  headerDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  statCardMain: {
    flex: 1,
    backgroundColor: '#0F1A14',
    borderWidth: 1,
    borderColor: 'rgba(34,177,91,0.2)',
    borderRadius: 16,
    padding: 16,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  statCardAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.success,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  statCardSub: {
    fontSize: 12,
    color: THEME.colors.textGray,
    marginTop: 4,
  },
  statCardSide: {
    gap: 8,
  },
  statCardSmall: {
    width: 108,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    padding: 10,
  },
  statCardSmallNum: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textWhite,
  },
  statCardSmallLabel: {
    fontSize: 10,
    color: THEME.colors.textGray,
    fontWeight: '600',
    marginTop: 2,
  },

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  summaryBarItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBarNum: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textWhite,
  },
  summaryBarLabel: {
    fontSize: 10,
    color: THEME.colors.textGray,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryBarDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 4,
  },

  // Filter
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  filterPills: {
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textGray,
  },
  filterPillCount: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  filterPillCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textGray,
  },

  // Date Headers
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dateHeaderBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 18,
  },
  dateHeaderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    textTransform: 'capitalize',
  },
  dateHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  dateHeaderCount: {
    fontSize: 10,
    color: THEME.colors.textGray,
  },
  dateHeaderDot: {
    fontSize: 10,
    color: THEME.colors.textGray,
  },
  dateHeaderTotal: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.success,
  },

  // Sale Cards
  saleCard: {
    flexDirection: 'row',
    backgroundColor: '#0E0E0E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  saleCardAccent: {
    width: 3,
  },
  saleCardContent: {
    flex: 1,
    padding: 14,
  },
  saleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saleCardMethodIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleCardIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saleCardId: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    letterSpacing: -0.3,
  },
  saleCardMethodPill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  saleCardMethodText: {
    fontSize: 10,
    fontWeight: '700',
  },
  saleCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  saleCardTime: {
    fontSize: 11,
    color: THEME.colors.textGray,
  },
  saleCardDot: {
    fontSize: 11,
    color: THEME.colors.textGray,
  },
  saleCardClient: {
    fontSize: 11,
    color: THEME.colors.textGray,
  },
  saleCardRight: {
    alignItems: 'flex-end',
  },
  saleCardTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textWhite,
    letterSpacing: -0.3,
  },
  saleCardItems: {
    fontSize: 11,
    color: THEME.colors.textGray,
    marginTop: 2,
  },
  saleCardProductPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.06)',
  },
  saleCardProductPreviewText: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.textGray,
    fontStyle: 'italic',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    marginTop: 18,
  },
  emptySub: {
    fontSize: 13,
    color: THEME.colors.textGray,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Detail Modal - Boleta Ticket
  boletaCloseRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  boletaCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boleta: {
    backgroundColor: '#111614',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 22,
  },
  boletaHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  boletaStoreIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(34,177,91,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,177,91,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  boletaStoreName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textWhite,
    letterSpacing: 2,
  },
  boletaStoreSub: {
    fontSize: 11,
    color: THEME.colors.textGray,
    marginTop: 2,
  },
  boletaDashLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  boletaIdSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boletaIdLeft: {},
  boletaIdLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textGray,
    letterSpacing: 1,
  },
  boletaIdValue: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textWhite,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  boletaStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,177,91,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,177,91,0.3)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  boletaStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22B15B',
    letterSpacing: 0.5,
  },
  boletaDateTimeBlock: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
  },
  boletaDTRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  boletaDTLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textGray,
    letterSpacing: 0.5,
  },
  boletaDTValue: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textWhite,
    textTransform: 'capitalize',
  },
  boletaDTDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginVertical: 3,
  },
  boletaClientSection: {
    paddingVertical: 4,
  },
  boletaClientLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textGray,
    letterSpacing: 1,
  },
  boletaClientName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    marginTop: 4,
  },
  boletaPaymentSection: {
    paddingVertical: 4,
  },
  boletaPaymentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textGray,
    letterSpacing: 1,
    marginBottom: 8,
  },
  boletaPaymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  boletaPaymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boletaPaymentMethod: {
    fontSize: 15,
    fontWeight: '700',
  },
  boletaPaymentSub: {
    fontSize: 11,
    color: THEME.colors.textGray,
    marginTop: 1,
  },

  // Products Table
  boletaProductsSection: {
    paddingVertical: 4,
  },
  boletaSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textGray,
    letterSpacing: 1,
    marginBottom: 10,
  },
  boletaTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  boletaTableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textGray,
    letterSpacing: 0.5,
  },
  boletaProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  boletaProductNum: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  boletaProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textWhite,
  },
  boletaProductCell: {
    fontSize: 12,
    color: THEME.colors.textGray,
  },
  boletaProductCellBold: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  boletaTotalsBlock: {
    paddingTop: 4,
  },
  boletaTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  boletaTotalLabel: {
    fontSize: 12,
    color: THEME.colors.textGray,
  },
  boletaTotalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textWhite,
  },
  boletaTotalFinalDivider: {
    height: 2,
    backgroundColor: 'rgba(34,177,91,0.3)',
    marginVertical: 6,
    borderRadius: 1,
  },
  boletaTotalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boletaTotalFinalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textWhite,
    letterSpacing: 1,
  },
  boletaTotalFinalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.success,
  },

  // Stats
  boletaStatsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  boletaStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  boletaStatNum: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textWhite,
  },
  boletaStatLabel: {
    fontSize: 10,
    color: THEME.colors.textGray,
    marginTop: 2,
  },
  boletaStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Footer
  boletaFooter: {
    alignItems: 'center',
    paddingTop: 4,
  },
  boletaFooterText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textGray,
  },
  boletaFooterSub: {
    fontSize: 10,
    color: THEME.colors.textGray,
    marginTop: 2,
  },
  boletaBarcode: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  boletaBarcodeText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: THEME.colors.textGray,
    letterSpacing: 2,
  },

  // Empty Products
  boletaEmptyProducts: {
    alignItems: 'center',
    padding: 24,
  },
  boletaEmptyEmoji: {
    fontSize: 28,
  },
  boletaEmptyText: {
    color: THEME.colors.textGray,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  boletaEmptySub: {
    color: THEME.colors.textGray,
    fontSize: 11,
    marginTop: 4,
  },

  // Action Buttons
  boletaActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  boletaActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,177,91,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,177,91,0.25)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  boletaActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
});
