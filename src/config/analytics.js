/**
 * analytics.js
 * Módulo de integración para Google Analytics 4 (GA4) y Firebase Analytics en Vendix.
 * Permite registrar vistas de pantalla, ventas realizadas y eventos de usuarios.
 */

// ------------------------------------------------------------------------
// CONFIGURACIÓN DE GOOGLE ANALYTICS (GA4)
// ------------------------------------------------------------------------
// 1. Ve a https://analytics.google.com/
// 2. Crea un flujo de datos (Data Stream) para tu app Vendix.
// 3. Copia tu ID de Medición (Measurement ID) y pégalo abajo.
//    Ejemplo de ID: "G-ABC123XYZ"
// ------------------------------------------------------------------------
export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-YOUR_MEASUREMENT_ID";

const isAnalyticsConfigured = GOOGLE_ANALYTICS_MEASUREMENT_ID && GOOGLE_ANALYTICS_MEASUREMENT_ID !== "G-YOUR_MEASUREMENT_ID";

/**
 * Registra eventos de usuario en Google Analytics
 */
export function logAnalyticsEvent(eventName, params = {}) {
  try {
    console.log(`📊 [Google Analytics] Evento '${eventName}':`, params);

    if (isAnalyticsConfigured) {
      // Envío vía Google Analytics Measurement Protocol
      fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}&api_secret=vendix_secret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: params.userId || 'vendix_user_anon',
          events: [{
            name: eventName,
            params: params
          }]
        })
      }).catch(err => console.log("Google Analytics ping omnitido:", err.message));
    }
  } catch (error) {
    console.error("Error al enviar evento a Google Analytics:", error);
  }
}

/**
 * Registra vistas de pantalla en Google Analytics
 */
export function logScreenView(screenName, loggedUser = '') {
  logAnalyticsEvent('screen_view', {
    screen_name: screenName,
    user: loggedUser || 'invitado'
  });
}

/**
 * Registra una venta completada en Google Analytics (e-commerce event)
 */
export function logSaleAnalytics(saleTotal, itemCount, paymentMethod) {
  logAnalyticsEvent('purchase', {
    value: saleTotal,
    currency: 'PEN',
    items_count: itemCount,
    payment_method: paymentMethod
  });
}
