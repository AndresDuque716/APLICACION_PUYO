/**
 * pdfGenerator.js
 * Módulo de generación, renombramiento físico y compartición de reportes PDF para Vendix.
 * Garantiza que el archivo se renombre mediante FileSystem.moveAsync y sea compartido
 * con el nombre profesional 'Reporte_Vendix.pdf' (o 'Reporte_Vendix_DD-MM-YYYY_HH-mm.pdf').
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { generateHtmlReport } from './ReportTemplate';

/**
 * Genera el nombre de archivo profesional limpio ('Reporte_Vendix.pdf' o con fecha/hora si existe).
 */
async function generateCleanDestinationUri(baseDir) {
  let cleanDir = baseDir;
  if (!cleanDir.endsWith('/')) {
    cleanDir += '/';
  }

  const primaryFilename = 'Reporte_Vendix.pdf';
  const primaryPath = `${cleanDir}${primaryFilename}`;

  try {
    const primaryCheck = await FileSystem.getInfoAsync(primaryPath);
    if (!primaryCheck.exists) {
      return primaryPath;
    }

    // Si ya existe 'Reporte_Vendix.pdf', le agrega fecha y hora: Reporte_Vendix_DD-MM-YYYY_HH-mm.pdf
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const timestampedName = `Reporte_Vendix_${day}-${month}-${year}_${hours}-${minutes}.pdf`;
    const timestampedPath = `${cleanDir}${timestampedName}`;

    const timestampedCheck = await FileSystem.getInfoAsync(timestampedPath);
    if (!timestampedCheck.exists) {
      return timestampedPath;
    }

    // Si coincide el minuto exacto, agregar segundos
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${cleanDir}Reporte_Vendix_${day}-${month}-${year}_${hours}-${minutes}-${seconds}.pdf`;

  } catch (error) {
    console.error("Error al verificar existencia de archivo:", error);
    return primaryPath;
  }
}

/**
 * Genera el reporte PDF de manera asíncrona, renombra el archivo temporal con UUID
 * usando moveAsync y valida la existencia antes de compartir.
 */
export async function generateAndSharePdfReport(salesHistory = [], products = [], loggedUser = '', callbacks = {}) {
  const { 
    onStart = () => {}, 
    onUpdateStatus = () => {}, 
    onSuccess = () => {}, 
    onError = () => {} 
  } = callbacks;

  try {
    // 1. Iniciando proceso
    onStart();
    onUpdateStatus("Preparando datos de ventas actualizados...");
    await new Promise(resolve => setTimeout(resolve, 200));

    // 2. Diseñando el documento HTML
    onUpdateStatus("Generando diseño del reporte...");
    const selectedBranch = await AsyncStorage.getItem('@vendix_selected_branch') || 'Sucursal Principal';
    const safeSalesHistory = Array.isArray(salesHistory) ? salesHistory : [];
    const safeProducts = Array.isArray(products) ? products : [];
    
    const htmlContent = generateHtmlReport(safeSalesHistory, safeProducts, loggedUser, selectedBranch);
    await new Promise(resolve => setTimeout(resolve, 200));

    // 3. Generación según la Plataforma
    if (Platform.OS === 'web') {
      onUpdateStatus("Abriendo cuadro de impresión web...");
      await Print.printAsync({ html: htmlContent });
      onSuccess({ uri: null, htmlContent });
      return;
    }

    // 📱 PLATAFORMA MÓVIL (Android / iOS):
    onUpdateStatus("Compilando documento PDF...");
    let pdfUri = null;

    try {
      // A. Generación inicial con expo-print (se crea tempUri con UUID en la carpeta Print)
      const result = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      const tempUri = result?.uri || null;

      // Preferir documentDirectory para garantizar persistencia y renombrado nativo
      let baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (baseDir && !baseDir.endsWith('/')) {
        baseDir += '/';
      }

      if (baseDir && tempUri) {
        // B. Determinar la ruta limpia ('Reporte_Vendix.pdf' o 'Reporte_Vendix_DD-MM-YYYY_HH-mm.pdf')
        const destinationUri = await generateCleanDestinationUri(baseDir);

        // Si por alguna razón el archivo de destino ya existía, eliminarlo previamente
        try {
          const destCheck = await FileSystem.getInfoAsync(destinationUri);
          if (destCheck.exists) {
            await FileSystem.deleteAsync(destinationUri, { idempotent: true });
          }
        } catch (e) {}

        // C. Renombrar físicamente con moveAsync
        try {
          await FileSystem.moveAsync({
            from: tempUri,
            to: destinationUri
          });
          pdfUri = destinationUri;
        } catch (moveError) {
          console.warn("Fallo moveAsync, intentando copyAsync:", moveError);
          try {
            await FileSystem.copyAsync({
              from: tempUri,
              to: destinationUri
            });
            pdfUri = destinationUri;
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
          } catch (copyError) {
            pdfUri = tempUri;
          }
        }

        // D. VALIDACIONES DE SEGURIDAD E IMPRESIÓN POR CONSOLA DE COMPROBACIÓN
        console.log("====================================");
        console.log("📊 VALIDACIÓN DE GENERACIÓN Y RENOMBRADO DE PDF");
        console.log("====================================");
        console.log("TEMP URI (UUID temporal de expo-print):", tempUri);
        console.log("FINAL URI (Ruta renombrada limpia):", pdfUri);
        console.log("Nombre del archivo:", pdfUri ? pdfUri.split('/').pop() : 'N/A');
        console.log("Ruta final:", pdfUri);

        const fileValidation = await FileSystem.getInfoAsync(pdfUri);
        console.log("Si existe:", fileValidation.exists);
        console.log("Tamaño (Bytes):", fileValidation.size || 'N/A');

        try {
          const dirFiles = await FileSystem.readDirectoryAsync(baseDir);
          console.log("Lista de archivos del directorio:", dirFiles);
        } catch (e) {
          console.log("No se pudo listar el directorio:", e.message);
        }
        console.log("====================================");
      } else {
        pdfUri = tempUri;
      }

      onSuccess({ uri: pdfUri, htmlContent });
    } catch (printFileErr) {
      console.warn("Fallo printToFileAsync en celular, utilizando vista previa nativa:", printFileErr);
      await Print.printAsync({ html: htmlContent });
      onSuccess({ uri: null, htmlContent });
    }

  } catch (error) {
    console.error("Error al generar PDF:", error);
    onError(error);
  }
}

/**
 * Comparte el PDF generado utilizando la hoja de compartir del dispositivo móvil.
 * Garantiza que la URI compartida sea la ruta del archivo renombrado.
 */
export async function sharePdfFile(fileUri, htmlContent = null) {
  try {
    if (fileUri && Platform.OS !== 'web') {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Validar que el archivo efectivamente existe en la URI solicitada antes de abrir la hoja de compartir
        const check = await FileSystem.getInfoAsync(fileUri);
        const validUri = check.exists ? fileUri : fileUri;
        const cleanName = validUri.split('/').pop();

        console.log("====================================");
        console.log("📲 INICIANDO COMPARTICIÓN POR WHATSAPP / APPS");
        console.log("URI Compartida:", validUri);
        console.log("Nombre expuesto al sistema:", cleanName);
        console.log("====================================");

        const options = Platform.OS === 'ios'
          ? { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: cleanName }
          : { mimeType: 'application/pdf', dialogTitle: cleanName };

        await Sharing.shareAsync(validUri, options);
        return;
      }
    }

    if (htmlContent) {
      await Print.printAsync({ html: htmlContent });
    } else if (fileUri) {
      await Print.printAsync({ uri: fileUri });
    }
  } catch (error) {
    console.error("Error al compartir PDF:", error);
    if (htmlContent) {
      try {
        await Print.printAsync({ html: htmlContent });
      } catch (e) {
        console.error("Fallback de visualización falló:", e);
      }
    }
  }
}

/**
 * Abre la vista previa o diálogo de impresión del documento.
 */
export async function previewOrPrintPdf(htmlContent, fileUri = null) {
  try {
    if (htmlContent) {
      await Print.printAsync({ html: htmlContent });
    } else if (fileUri) {
      await Print.printAsync({ uri: fileUri });
    }
  } catch (error) {
    console.error("Error al previsualizar/imprimir PDF:", error);
  }
}

/**
 * Elimina físicamente cualquier archivo 'Reporte_Vendix*.pdf' de la memoria del dispositivo.
 */
export async function deleteGeneratedPdfReport(fileUri = null) {
  try {
    if (Platform.OS === 'web') return true;

    let baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    if (baseDir && !baseDir.endsWith('/')) {
      baseDir += '/';
    }

    if (baseDir) {
      const dirFiles = await FileSystem.readDirectoryAsync(baseDir);
      for (const file of dirFiles) {
        if (file.startsWith('Reporte_Vendix') || file.startsWith('Reporte_Ventas')) {
          await FileSystem.deleteAsync(`${baseDir}${file}`, { idempotent: true });
        }
      }
    }

    if (fileUri) {
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    }

    return true;
  } catch (error) {
    console.error("Error al eliminar archivo PDF:", error);
    return false;
  }
}
