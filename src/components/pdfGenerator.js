/**
 * pdfGenerator.js
 * Lógica principal del generador de PDF utilizando expo-print, expo-sharing y expo-file-system.
 * Genera el documento temporal, lo copia a un directorio de caché con nombre limpio
 * y abre el menú nativo para compartir en el dispositivo.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateHtmlReport } from './ReportTemplate';

/**
 * Genera el reporte PDF de manera asíncrona, lo almacena en el almacenamiento temporal
 * del dispositivo, y abre la hoja de compartir del sistema.
 * 
 * @param {Array} salesHistory Historial de ventas
 * @param {Array} products Catálogo de productos
 * @param {string} loggedUser Correo del usuario actual
 * @param {object} callbacks Objeto con funciones onStart, onUpdateStatus, onSuccess, onError
 */
export async function generateAndSharePdfReport(salesHistory, products, loggedUser, callbacks = {}) {
  const { 
    onStart = () => {}, 
    onUpdateStatus = () => {}, 
    onSuccess = () => {}, 
    onError = () => {} 
  } = callbacks;

  try {
    // 1. Iniciando proceso
    onStart();
    onUpdateStatus("Preparando información...");
    
    // Pequeño retraso artificial para asegurar que la animación se muestre fluida
    await new Promise(resolve => setTimeout(resolve, 800));

    // 2. Creando el HTML
    onUpdateStatus("Creando documento PDF...");
    const selectedBranch = await AsyncStorage.getItem('@vendix_selected_branch') || 'Bodega San Martín';
    const htmlContent = generateHtmlReport(salesHistory, products, loggedUser, selectedBranch);
    
    await new Promise(resolve => setTimeout(resolve, 600));

    // 3. Imprimiendo a PDF temporal
    onUpdateStatus("Generando reporte...");
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    // 4. Copiando el archivo temporal a una ruta con nombre limpio para compartir
    const cleanFilename = `Vendix_Reporte_Ventas_${Date.now()}.pdf`;
    const destinationUri = `${FileSystem.cacheDirectory}${cleanFilename}`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: destinationUri
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. Éxito
    onSuccess(destinationUri);

  } catch (error) {
    console.error("Error generating PDF:", error);
    onError(error);
  }
}

/**
 * Comparte el PDF generado utilizando la hoja de compartir del dispositivo móvil.
 * @param {string} fileUri Ruta local del archivo PDF
 */
export async function sharePdfFile(fileUri) {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      alert("La opción de compartir no está disponible en este dispositivo.");
      return;
    }
    
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir Reporte de Ventas Vendix',
      UTI: 'com.adobe.pdf'
    });
  } catch (error) {
    console.error("Error sharing PDF file:", error);
  }
}
