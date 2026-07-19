import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  Modal 
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useTutorial } from './TutorialProvider';
import { TUTORIAL_STEPS } from './tutorialData';
import { THEME } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TutorialOverlay() {
  const { 
    activeStep, 
    isTutorialActive, 
    layouts, 
    goToNextStep, 
    goToPrevStep, 
    skipTutorial 
  } = useTutorial();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Anima la opacidad general de la tarjeta al cambiar de paso
  useEffect(() => {
    if (isTutorialActive) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [activeStep, isTutorialActive]);

  // Anima la barra de progreso
  useEffect(() => {
    if (isTutorialActive) {
      const targetProgress = activeStep === 0 ? 0 : activeStep / 8;
      Animated.timing(progressAnim, {
        toValue: targetProgress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [activeStep, isTutorialActive]);

  if (!isTutorialActive) return null;

  const currentStepData = TUTORIAL_STEPS[activeStep];
  const targetId = currentStepData.target;
  const targetLayout = targetId ? layouts[targetId] : null;

  // Barra de progreso animada
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Determinar la ubicación de la tarjeta explicativa
  let cardStyle = styles.centeredCard;
  let hasCutout = false;
  let cutoutStyle = null;

  if (targetLayout) {
    const { x, y, width, height } = targetLayout;
    hasCutout = true;

    // Cutout coordinates
    cutoutStyle = {
      x,
      y,
      width,
      height
    };

    // Determina si poner la tarjeta explicativa arriba o abajo del elemento iluminado
    const placement = (y + height / 2) < (SCREEN_HEIGHT / 2) ? 'below' : 'above';
    const margin = 18;

    if (placement === 'below') {
      cardStyle = {
        position: 'absolute',
        top: y + height + margin,
        left: 20,
        right: 20,
      };
    } else {
      cardStyle = {
        position: 'absolute',
        bottom: (SCREEN_HEIGHT - y) + margin,
        left: 20,
        right: 20,
      };
    }
  }

  // Renderizar los 4 paneles de fondo oscuro para generar el recorte (cutout)
  const renderCutoutOverlay = () => {
    if (!hasCutout || !cutoutStyle) {
      return <View style={styles.fullDarkOverlay} />;
    }

    const { x, y, width, height } = cutoutStyle;

    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Panel superior */}
        <View style={[styles.darkPanel, { top: 0, left: 0, right: 0, height: y }]} />
        {/* Panel inferior */}
        <View style={[styles.darkPanel, { top: y + height, left: 0, right: 0, bottom: 0 }]} />
        {/* Panel izquierdo */}
        <View style={[styles.darkPanel, { top: y, left: 0, width: x, height: height }]} />
        {/* Panel derecho */}
        <View style={[styles.darkPanel, { top: y, left: x + width, right: 0, height: height }]} />

        {/* Borde verde luminoso alrededor del componente iluminado */}
        <View style={[styles.glowingBorder, { top: y - 3, left: x - 3, width: width + 6, height: height + 6 }]} />
      </View>
    );
  };

  return (
    <Modal
      visible={isTutorialActive}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.container} pointerEvents="box-none">
        {/* Capas oscuras recortadas */}
        {renderCutoutOverlay()}

        {/* Tarjeta Explicativa */}
        <Animated.View style={[styles.explanationCard, cardStyle, { opacity: fadeAnim }]}>
          {/* Cabecera con indicador de pasos */}
          {activeStep > 0 && (
            <View style={styles.cardHeader}>
              <Text style={styles.stepIndicatorText}>Paso {activeStep} de 8</Text>
              <View style={styles.progressBarTrack}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>
            </View>
          )}

          {/* Contenido principal */}
          {activeStep === 8 ? (
            // Pantalla final con animación
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Svg viewBox="0 0 24 24" width="36" height="36" fill="none">
                  <Path 
                    d="M20 6L9 17L4 12" 
                    stroke={THEME.colors.primary} 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </Svg>
              </View>
              <Text style={styles.cardTitle}>{currentStepData.title}</Text>
              <Text style={styles.cardDescription}>{currentStepData.description}</Text>
            </View>
          ) : (
            // Pantallas regulares
            <View>
              <Text style={styles.cardTitle}>{currentStepData.title}</Text>
              <Text style={styles.cardDescription}>{currentStepData.description}</Text>
            </View>
          )}

          {/* Fila de Botones */}
          <View style={styles.buttonsRow}>
            {activeStep === 0 ? (
              // Botones para la pantalla de bienvenida
              <>
                <TouchableOpacity style={styles.btnSecondary} onPress={skipTutorial}>
                  <Text style={styles.btnSecondaryText}>Saltar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={goToNextStep}>
                  <Text style={styles.btnPrimaryText}>Comenzar</Text>
                  <ChevronRight size={16} color={THEME.colors.textWhite} />
                </TouchableOpacity>
              </>
            ) : activeStep === 8 ? (
              // Botón de la pantalla final
              <TouchableOpacity style={[styles.btnPrimary, { flex: 1, justifyContent: 'center' }]} onPress={goToNextStep}>
                <Text style={styles.btnPrimaryText}>Comenzar a usar Vendix</Text>
              </TouchableOpacity>
            ) : (
              // Botones de pasos interactivos intermedios
              <>
                <TouchableOpacity style={styles.btnSkipText} onPress={skipTutorial}>
                  <Text style={styles.btnSkipTextOnly}>Saltar</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={styles.btnNavCircle} onPress={goToPrevStep}>
                    <ChevronLeft size={18} color={THEME.colors.textWhite} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={goToNextStep}>
                    <Text style={styles.btnPrimaryText}>Siguiente</Text>
                    <ChevronRight size={16} color={THEME.colors.textWhite} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  darkPanel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  glowingBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00D26A',
    borderRadius: 12,
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  centeredCard: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 360,
  },
  explanationCard: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 1000,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stepIndicatorText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    width: 100,
    height: 4,
    backgroundColor: THEME.colors.borderDark,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
  },
  cardTitle: {
    color: THEME.colors.textWhite,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  cardDescription: {
    color: THEME.colors.textGray,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: THEME.colors.success,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnPrimaryText: {
    color: THEME.colors.textWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  btnSecondaryText: {
    color: THEME.colors.textGray,
    fontWeight: '600',
    fontSize: 14,
  },
  btnSkipText: {
    paddingVertical: 8,
  },
  btnSkipTextOnly: {
    color: THEME.colors.textGray,
    fontSize: 14,
    fontWeight: '600',
  },
  btnNavCircle: {
    backgroundColor: THEME.colors.borderDark,
    borderRadius: 14,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 10,
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
});
