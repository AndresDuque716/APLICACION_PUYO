import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView 
} from 'react-native';
import { Receipt } from 'lucide-react-native';
import { THEME } from '../constants/theme';

export default function SalesHistoryScreen({ salesHistory }) {
  // Compute today invoiced total dynamically
  const totalInvoicedToday = salesHistory
    .filter(s => s.time.includes('min') || s.time.includes('hora') || s.time.includes('momento'))
    .reduce((sum, s) => sum + s.total, 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.pageTitleText}>Historial de Ventas</Text>
      
      <View style={styles.salesHeaderCard}>
        <View>
          <Text style={{ fontSize: 11, color: THEME.colors.textGray }}>Total Facturado Hoy</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: THEME.colors.success, marginTop: 2 }}>
            S/ {totalInvoicedToday.toFixed(2)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 12, color: THEME.colors.textGray }}>{salesHistory.length} Transacciones</Text>
          <Text style={{ fontSize: 12, color: THEME.colors.textGray }}>
            Promedio: S/ {(salesHistory.length > 0 ? (salesHistory.reduce((sum, s) => sum + s.total, 0) / salesHistory.length) : 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={{ gap: 10, marginTop: 15 }}>
        {salesHistory.map((s) => (
          <View key={s.id} style={styles.cartItem}>
            <View style={styles.cartItemLeft}>
              <View style={styles.productAvatar}>
                <Receipt size={18} color={THEME.colors.success} />
              </View>
              <View>
                <Text style={styles.productName}>Venta {s.id}</Text>
                <Text style={styles.productPriceText}>{s.time} • {s.client}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: THEME.colors.textWhite }}>S/ {s.total.toFixed(2)}</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={styles.itemsCountBadge}>
                  <Text style={{ fontSize: 9, color: THEME.colors.textGray }}>{s.items} items</Text>
                </View>
                <View style={[styles.methodBadge, {
                  backgroundColor: s.method === 'Efectivo' ? 'rgba(34, 177, 91, 0.1)' : s.method === 'Yape' ? 'rgba(160, 193, 247, 0.15)' : 'rgba(255, 149, 0, 0.15)'
                }]}>
                  <Text style={{
                    fontSize: 9,
                    fontWeight: '700',
                    color: s.method === 'Efectivo' ? '#22B15B' : s.method === 'Yape' ? '#A0C1F7' : '#ff9500'
                  }}>{s.method}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  salesHeaderCard: {
    backgroundColor: 'rgba(0, 168, 89, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 89, 0.25)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
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
  itemsCountBadge: {
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  methodBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
});
