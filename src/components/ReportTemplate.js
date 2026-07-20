/**
 * ReportTemplate.js
 * Genera el documento HTML profesional utilizado por expo-print para compilar
 * el archivo PDF. Diseñado con tipografías elegantes, tablas estructuradas
 * y colores corporativos de Vendix.
 */

import { 
  calculateSummaryMetrics, 
  calculatePaymentBreakdown, 
  calculateTopSellingProducts, 
  generateRecommendations 
} from './reportUtils';

export function generateHtmlReport(salesHistory, products, loggedUser, branchName = "Mi Sucursal") {
  const safeSales = Array.isArray(salesHistory) ? salesHistory : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const metrics = calculateSummaryMetrics(safeSales, safeProducts);
  const paymentBreakdown = calculatePaymentBreakdown(safeSales);
  const topProducts = calculateTopSellingProducts(safeSales, safeProducts, 5);
  const recommendations = generateRecommendations(safeSales, safeProducts);
  
  // Obtener las últimas 10 ventas
  const recentSales = safeSales.slice(0, 10);

  // Listado de productos con stock bajo (crítico)
  const lowStockProducts = safeProducts.filter(p => p && p.stock > 0 && p.stock <= 5);

  const currentDate = new Date().toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reporte Vendix</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          background-color: #fff;
          margin: 0;
          padding: 20px;
          line-height: 1.5;
        }
        .header {
          border-bottom: 2px solid #00A859;
          padding-bottom: 15px;
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .logo-section {
          display: flex;
          align-items: center;
        }
        .logo-text {
          font-size: 28px;
          font-weight: 800;
          color: #00A859;
          margin: 0;
          letter-spacing: 0.5px;
        }
        .meta-section {
          text-align: right;
          font-size: 11px;
          color: #666;
        }
        .report-title {
          font-size: 22px;
          font-weight: 800;
          color: #111;
          text-align: center;
          margin-top: 0;
          margin-bottom: 25px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        /* Grid de KPIs */
        .kpi-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 30px;
        }
        .kpi-card {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }
        .kpi-title {
          font-size: 10px;
          font-weight: 700;
          color: #6c757d;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .kpi-value {
          font-size: 16px;
          font-weight: 800;
          color: #00A859;
          margin: 0;
        }
        .kpi-sub {
          font-size: 9px;
          color: #888;
          margin-top: 2px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 800;
          color: #111;
          border-left: 4px solid #00A859;
          padding-left: 8px;
          margin-top: 25px;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        /* Tablas */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #00A859;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          text-align: left;
          padding: 8px 10px;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #dee2e6;
          font-size: 11px;
          color: #495057;
        }
        tr:nth-child(even) td {
          background-color: #f8f9fa;
        }
        /* Desglose Métodos Pago */
        .payment-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 25px;
        }
        .payment-card {
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
          background-color: #ffffff;
        }
        .payment-name {
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .payment-value {
          font-size: 13px;
          font-weight: 800;
          color: #333;
        }
        .payment-sub {
          font-size: 9px;
          color: #888;
        }
        /* Inventario Alertas */
        .inventory-summary {
          display: flex;
          justify-content: space-between;
          background-color: #fdfefe;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 15px;
        }
        .inventory-item {
          text-align: center;
          flex: 1;
        }
        .inventory-val {
          font-size: 14px;
          font-weight: 800;
        }
        .inventory-val.danger { color: #dc3545; }
        .inventory-val.warning { color: #ffc107; }
        .inventory-val.success { color: #28a745; }
        .inventory-lbl {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }
        /* Recomendaciones */
        .recommendations-box {
          background-color: #f4fbf7;
          border: 1px solid #c3edd5;
          border-radius: 8px;
          padding: 15px;
          margin-top: 30px;
          margin-bottom: 30px;
        }
        .recommendations-box ul {
          margin: 0;
          padding-left: 20px;
        }
        .recommendations-box li {
          font-size: 11.5px;
          color: #1e7e46;
          margin-bottom: 8px;
        }
        .recommendations-box li:last-child {
          margin-bottom: 0;
        }
        /* Footer */
        .footer {
          border-top: 1px solid #dee2e6;
          padding-top: 10px;
          margin-top: 40px;
          text-align: center;
          font-size: 9px;
          color: #888;
          display: flex;
          justify-content: space-between;
        }
      </style>
    </head>
    <body>

      <!-- Encabezado -->
      <div class="header">
        <div class="logo-section">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="margin-right: 8px; vertical-align: middle;">
            <path d="M3 16.5 L6.5 13.5 V21 H3 V16.5 Z" fill="#00A859" />
            <path d="M8.5 11.5 L12 8.5 V21 H8.5 V11.5 Z" fill="#00A859" />
            <path d="M14 6.5 L17.5 3.5 V21 H14 V6.5 Z" fill="#00A859" />
            <path d="M2 18 L19.5 3" stroke="#00A859" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M13.5 3 H19.5 V9" stroke="#00A859" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="logo-text">Vendix</span>
        </div>
        <div class="meta-section">
          <div><strong>Sucursal:</strong> ${branchName}</div>
          <div><strong>Fecha:</strong> ${currentDate} | <strong>Hora:</strong> ${currentTime}</div>
          <div><strong>Usuario:</strong> ${loggedUser || 'invitado@vendix.com'}</div>
        </div>
      </div>

      <!-- Título de Reporte -->
      <div class="report-title">Reporte General de Ventas e Inventario</div>

      <!-- Resumen General KPIs -->
      <div class="kpi-container">
        <div class="kpi-card">
          <div class="kpi-title">Total Vendido</div>
          <div class="kpi-value">S/ ${metrics.totalSalesVolume.toFixed(2)}</div>
          <div class="kpi-sub">Ingresos acumulados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Ventas Totales</div>
          <div class="kpi-value">${metrics.totalTransactions}</div>
          <div class="kpi-sub">Transacciones</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Ticket Promedio</div>
          <div class="kpi-value">S/ ${metrics.averageTicket.toFixed(2)}</div>
          <div class="kpi-sub">Por cliente</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Productos Registrados</div>
          <div class="kpi-value">${metrics.registeredCount}</div>
          <div class="kpi-sub">En catálogo</div>
        </div>
      </div>

      <!-- Catálogo Completo de Productos e Inventario -->
      <div class="section-title">Catálogo Completo de Productos Registrados</div>
      <table>
        <thead>
          <tr>
            <th>Código / Barcode</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th style="text-align: center;">Stock</th>
            <th style="text-align: right;">Precio Unitario</th>
          </tr>
        </thead>
        <tbody>
          ${safeProducts.map(p => `
            <tr>
              <td><strong>${p.barcode || p.id}</strong></td>
              <td>${p.avatar || '📦'} ${p.name}</td>
              <td>${p.category || 'General'}</td>
              <td style="text-align: center; font-weight: 700; color: ${p.stock === 0 ? '#dc3545' : p.stock <= 5 ? '#ffc107' : '#28a745'};">
                ${p.stock} und.
              </td>
              <td style="text-align: right; font-weight: 700; color: #00A859;">S/ ${(p.price || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
          ${safeProducts.length === 0 ? '<tr><td colspan="5" style="text-align: center;">No hay productos en el catálogo.</td></tr>' : ''}
        </tbody>
      </table>

      <!-- Productos Más Vendidos -->
      <div class="section-title">Top 5 Productos más Vendidos</div>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Posición</th>
            <th>Producto</th>
            <th style="text-align: center; width: 120px;">Cantidad Vendida</th>
            <th style="text-align: right; width: 150px;">Ingresos Generados</th>
          </tr>
        </thead>
        <tbody>
          ${topProducts.map((p, idx) => {
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            return `
              <tr>
                <td><strong>${medals[idx] || idx + 1}</strong></td>
                <td>${p.name}</td>
                <td style="text-align: center;">${p.qty} unidades</td>
                <td style="text-align: right; font-weight: 700; color: #00A859;">S/ ${p.total.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
          ${topProducts.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No hay registros de ventas para esta categoría.</td></tr>' : ''}
        </tbody>
      </table>

      <!-- Métodos de Pago -->
      <div class="section-title">Distribución de Métodos de Pago</div>
      <div class="payment-grid">
        ${paymentBreakdown.map(p => `
          <div class="payment-card">
            <div class="payment-name">${p.method}</div>
            <div class="payment-value">S/ ${p.total.toFixed(2)}</div>
            <div class="payment-sub">${p.count} ventas (${p.percentage.toFixed(0)}%)</div>
          </div>
        `).join('')}
      </div>

      <!-- Estado de Inventario -->
      <div class="section-title">Resumen de Stock e Inventario</div>
      <div class="inventory-summary">
        <div class="inventory-item" style="border-right: 1px solid #dee2e6;">
          <div class="inventory-val success">${safeProducts.filter(p => p && p.stock > 5).length}</div>
          <div class="inventory-lbl">Productos Disponibles</div>
        </div>
        <div class="inventory-item" style="border-right: 1px solid #dee2e6;">
          <div class="inventory-val danger">${metrics.outOfStockCount}</div>
          <div class="inventory-lbl">Productos Agotados</div>
        </div>
        <div class="inventory-item">
          <div class="inventory-val warning">${metrics.lowStockCount}</div>
          <div class="inventory-lbl">Stock Crítico (&le; 5)</div>
        </div>
      </div>

      ${lowStockProducts.length > 0 ? `
        <div style="font-size: 11px; margin-bottom: 25px; padding: 10px; border: 1px dashed #ffc107; background-color: #fffdf6; border-radius: 6px;">
          <strong>Atención:</strong> Los siguientes productos requieren reabastecimiento: 
          ${lowStockProducts.map(p => `${p.name} (${p.stock} und.)`).join(', ')}.
        </div>
      ` : ''}

      <!-- Ventas Recientes (Últimas 10) -->
      <div class="section-title">Ventas Recientes (Últimas 10)</div>
      <table>
        <thead>
          <tr>
            <th>ID Venta</th>
            <th>Tiempo / Relativo</th>
            <th>Cliente</th>
            <th style="text-align: center;">Productos</th>
            <th>Método de Pago</th>
            <th style="text-align: right;">Total Cobrado</th>
          </tr>
        </thead>
        <tbody>
          ${recentSales.map(s => `
            <tr>
              <td><strong>${s.id}</strong></td>
              <td>${s.time}</td>
              <td>${s.client}</td>
              <td style="text-align: center;">${s.items} items</td>
              <td><span style="padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; 
                background-color: ${s.method === 'Efectivo' ? '#e2f7eb' : s.method === 'Yape' ? '#e2ecf7' : '#fff3e2'};
                color: ${s.method === 'Efectivo' ? '#1e7e46' : s.method === 'Yape' ? '#1a5ea8' : '#a85f1a'};">
                ${s.method}
              </span></td>
              <td style="text-align: right; font-weight: 700;">S/ ${s.total.toFixed(2)}</td>
            </tr>
          `).join('')}
          ${recentSales.length === 0 ? '<tr><td colspan="6" style="text-align: center;">No hay transacciones registradas.</td></tr>' : ''}
        </tbody>
      </table>

      <!-- Recomendaciones Automáticas -->
      <div class="recommendations-box">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #1e7e46; text-transform: uppercase;">Recomendaciones del Asistente Comercial</h4>
        <ul>
          ${recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      <!-- Pie de Página -->
      <div class="footer">
        <div>Documento generado automáticamente por Vendix.</div>
        <div>Generado el: ${currentDate} a las ${currentTime}</div>
        <div>App Vendix v1.0.0 | Página 1 de 1</div>
      </div>

    </body>
    </html>
  `;
}
