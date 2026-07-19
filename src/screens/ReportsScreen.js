import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { ChevronLeft, TrendingUp, DollarSign, Award, CreditCard } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import TutorialStep from '../components/TutorialStep';
import { generateAndSharePdfReport, sharePdfFile } from '../components/pdfGenerator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReportsScreen({ onBack, salesHistory, products, loggedUser }) {
  const [pdfStatus, setPdfStatus] = useState('idle'); // 'idle' | 'generating' | 'success' | 'error'
  const [pdfMessage, setPdfMessage] = useState('');
  const [pdfUri, setPdfUri] = useState('');

  const handleGeneratePdf = () => {
    generateAndSharePdfReport(salesHistory, products, loggedUser, {
      onStart: () => {
        setPdfStatus('generating');
        setPdfUri('');
      },
      onUpdateStatus: (msg) => {
        setPdfMessage(msg);
      },
      onSuccess: (uri) => {
        setPdfStatus('success');
        setPdfUri(uri);
        // Abre automáticamente el menú de compartir
        sharePdfFile(uri);
      },
      onError: (err) => {
        setPdfStatus('error');
      }
    });
  };
  
  // 1. Calculate General Aggregations
  const totalSalesVolume = salesHistory.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = salesHistory.length;
  const averageTicket = totalTransactions > 0 ? totalSalesVolume / totalTransactions : 0;
  
  // 2. Calculate Payment Method Breakdown
  const paymentTotals = { Efectivo: 0, Yape: 0, Plin: 0, Tarjeta: 0 };
  salesHistory.forEach(s => {
    const method = s.method || 'Efectivo';
    if (paymentTotals[method] !== undefined) {
      paymentTotals[method] += s.total;
    } else {
      paymentTotals.Efectivo += s.total;
    }
  });

  // 3. Top Selling Products Calculation
  // We parse the product list from salesHistory items. If sales history has mock items without productLists, we do fallbacks.
  const productSalesMap = {};
  
  salesHistory.forEach(sale => {
    if (sale.productsList && Array.isArray(sale.productsList)) {
      sale.productsList.forEach(item => {
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { name: item.name, qty: 0, total: 0 };
        }
        productSalesMap[item.name].qty += item.qty;
        productSalesMap[item.name].total += (item.qty * item.price);
      });
    } else {
      // Mock fallback: map random sales to products to populate reports with nice data
      const mockProdName = products[Math.floor(sale.total % products.length)]?.name || "Coca Cola 500 ml";
      const itemQty = sale.items || 1;
      if (!productSalesMap[mockProdName]) {
        productSalesMap[mockProdName] = { name: mockProdName, qty: 0, total: 0 };
      }
      productSalesMap[mockProdName].qty += itemQty;
      productSalesMap[mockProdName].total += sale.total;
    }
  });

  const sortedProductsList = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5); // top 5 products

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header with back navigation */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ChevronLeft size={24} color={THEME.colors.textWhite} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reportes & Analíticas</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Botón Generar PDF */}
        <TouchableOpacity 
          style={styles.btnPdfReport} 
          onPress={handleGeneratePdf}
        >
          <Text style={{ fontSize: 18 }}>📄</Text>
          <Text style={styles.btnPdfReportText}>Generar Reporte PDF</Text>
        </TouchableOpacity>

        {/* Summary Cards */}
        <TutorialStep stepName="reports_view">
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <DollarSign size={16} color={THEME.colors.primary} />
                <Text style={styles.cardLabel}>Ventas Totales</Text>
              </View>
              <Text style={styles.cardValue}>S/ {totalSalesVolume.toFixed(2)}</Text>
              <Text style={styles.cardSub}>Acumulado total</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <TrendingUp size={16} color={THEME.colors.primary} />
                <Text style={styles.cardLabel}>Ticket Promedio</Text>
              </View>
              <Text style={styles.cardValue}>S/ {averageTicket.toFixed(2)}</Text>
              <Text style={styles.cardSub}>Por transacción</Text>
            </View>
          </View>
        </TutorialStep>

        {/* Payment Methods Chart */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Distribución por Métodos de Pago</Text>
          <View style={{ gap: 16, marginTop: 15 }}>
            {Object.entries(paymentTotals).map(([method, total]) => {
              const percentage = totalSalesVolume > 0 ? (total / totalSalesVolume) * 100 : 0;
              
              // Assign custom colors for payment tags
              let progressColor = THEME.colors.success;
              if (method === 'Yape') progressColor = '#A0C1F7';
              if (method === 'Plin') progressColor = '#E080F0';
              if (method === 'Tarjeta') progressColor = THEME.colors.info;

              return (
                <View key={method} style={styles.progressBarWrapper}>
                  <View style={styles.progressBarLabelRow}>
                    <Text style={styles.methodNameText}>{method}</Text>
                    <Text style={styles.methodTotalText}>
                      S/ {total.toFixed(2)} ({percentage.toFixed(0)}%)
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill, 
                      { 
                        width: `${percentage}%`, 
                        backgroundColor: progressColor 
                      }
                    ]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Products Section */}
        <View style={[styles.sectionCard, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Top 5 Productos Más Vendidos</Text>
          <View style={{ gap: 12, marginTop: 15 }}>
            {sortedProductsList.length > 0 ? (
              sortedProductsList.map((item, idx) => (
                <View key={idx} style={styles.topProductRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={styles.productNameText}>{item.name}</Text>
                      <Text style={styles.productSubText}>{item.qty} unidades vendidas</Text>
                    </View>
                  </View>
                  <Text style={styles.productEarningsText}>S/ {item.total.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay ventas registradas para analizar productos.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal de estado PDF */}
      <Modal
        visible={pdfStatus !== 'idle'}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPdfStatus('idle')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {pdfStatus === 'generating' && (
              <View style={styles.modalInner}>
                <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginBottom: 20 }} />
                <Text style={styles.modalTitle}>Generando reporte...</Text>
                <Text style={styles.modalSub}>{pdfMessage}</Text>
              </View>
            )}

            {pdfStatus === 'success' && (
              <View style={styles.modalInner}>
                <View style={styles.successIconCircle}>
                  <Text style={{ fontSize: 30 }}>✅</Text>
                </View>
                <Text style={styles.modalTitle}>Reporte generado correctamente</Text>
                <Text style={styles.modalSub}>El archivo PDF está listo para compartir o guardar.</Text>

                <View style={{ gap: 10, width: '100%', marginTop: 20 }}>
                  <TouchableOpacity 
                    style={styles.btnPrimaryAction} 
                    onPress={() => sharePdfFile(pdfUri)}
                  >
                    <Text style={styles.btnText}>Compartir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnSecondaryCancel} 
                    onPress={() => setPdfStatus('idle')}
                  >
                    <Text style={{ color: THEME.colors.textGray, fontWeight: '700', textAlign: 'center' }}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {pdfStatus === 'error' && (
              <View style={styles.modalInner}>
                <View style={styles.errorIconCircle}>
                  <Text style={{ fontSize: 30 }}>❌</Text>
                </View>
                <Text style={styles.modalTitle}>Error al generar PDF</Text>
                <Text style={styles.modalSub}>Ocurrió un inconveniente al compilar el documento.</Text>
                
                <TouchableOpacity 
                  style={[styles.btnSecondaryCancel, { width: '100%', marginTop: 20 }]} 
                  onPress={() => setPdfStatus('idle')}
                >
                  <Text style={{ color: THEME.colors.textGray, fontWeight: '700', textAlign: 'center' }}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: THEME.colors.textGray,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textWhite,
  },
  cardSub: {
    fontSize: 10,
    color: THEME.colors.textGray,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textWhite,
  },
  progressBarWrapper: {
    gap: 6,
  },
  progressBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodNameText: {
    fontSize: 13,
    color: THEME.colors.textWhite,
    fontWeight: '600',
  },
  methodTotalText: {
    fontSize: 12,
    color: THEME.colors.textGray,
  },
  barTrack: {
    width: '100%',
    height: 6,
    backgroundColor: THEME.colors.borderDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  topProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.inputBg,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  rankBadge: {
    backgroundColor: THEME.colors.primaryDark,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: THEME.colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  productNameText: {
    color: THEME.colors.textWhite,
    fontWeight: '600',
    fontSize: 14,
  },
  productSubText: {
    color: THEME.colors.textGray,
    fontSize: 11,
    marginTop: 2,
  },
  productEarningsText: {
    color: THEME.colors.success,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    color: THEME.colors.textGray,
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Estilos de la ventana de carga / éxito del PDF
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalInner: {
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    color: THEME.colors.textWhite,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSub: {
    color: THEME.colors.textGray,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successIconCircle: {
    backgroundColor: 'rgba(0, 210, 106, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 106, 0.25)',
    borderRadius: 36,
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconCircle: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 48, 0.25)',
    borderRadius: 36,
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  btnPrimaryAction: {
    backgroundColor: THEME.colors.success,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  btnText: {
    color: THEME.colors.textWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondaryCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  btnPdfReport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: THEME.colors.success,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPdfReportText: {
    color: THEME.colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  }
});
