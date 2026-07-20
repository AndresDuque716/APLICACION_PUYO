import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  Modal,
  ScrollView
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
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
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
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [activeStep, isTutorialActive]);

  if (!isTutorialActive) return null;

  const currentStepData = TUTORIAL_STEPS[activeStep] || TUTORIAL_STEPS[0];
  const targetId = currentStepData.target;
  const targetLayout = targetId ? layouts[targetId] : null;

  // Barra de progreso animada
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Determinar la ubicación segura de la tarjeta explicativa
  let cardStyle = styles.centeredCard;
  let hasCutout = false;
  let cutoutStyle = null;

  if (targetLayout && targetLayout.width > 0 && targetLayout.height > 0) {
    const { x, y, width, height } = targetLayout;
    hasCutout = true;
    cutoutStyle = { x, y, width, height };

    const placement = (y + height / 2) < (SCREEN_HEIGHT / 2) ? 'below' : 'above';
    const margin = 14;

    if (placement === 'below') {
      const calculatedTop = Math.min(y + height + margin, SCREEN_HEIGHT - 320);
      cardStyle = {
        position: 'absolute',
        top: Math.max(50, calculatedTop),
        left: 16,
        right: 16,
      };
    } else {
      const calculatedBottom = Math.min((SCREEN_HEIGHT - y) + margin, SCREEN_HEIGHT - 320);
      cardStyle = {
        position: 'absolute',
        bottom: Math.max(75, calculatedBottom),
        left: 16,
        right: 16,
      };
    }
  }

  // Renderizar los 4 paneles oscuros de enfoque (cutout)
  const renderCutoutOverlay = () => {
    if (!hasCutout || !cutoutStyle) {
      return <View style={styles.fullDarkOverlay} />;
    }

    const { x, y, width, height } = cutoutStyle;

    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Panel superior */}
        <View style={[styles.darkPanel, { top: 0, left: 0, right: 0, height: Math.max(0, y) }]} />
        {/* Panel inferior */}
        <View style={[styles.darkPanel, { top: y + height, left: 0, right: 0, bottom: 0 }]} />
        {/* Panel izquierdo */}
        <View style={[styles.darkPanel, { top: y, left: 0, width: Math.max(0, x), height: height }]} />
        {/* Panel derecho */}
        <View style={[styles.darkPanel, { top: y, left: x + width, right: 0, height: height }]} />

        {/* Borde verde luminoso de enfoque */}
        <View style={[styles.glowingBorder, { top: y - 4, left: x - 4, width: width + 8, height: height + 8 }]} />
      </View>
    );
  };

  return (
    <Modal
      visible={isTutorialActive}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={skipTutorial}
    >
      <View style={styles.container} pointerEvents="box-none">
        {/* Capas oscuras con foco */}
        {renderCutoutOverlay()}

        {/* Tarjeta Explicativa */}
        <Animated.View style={[styles.explanationCard, cardStyle, { opacity: fadeAnim }]}>
          {/* Cabecera con paso actual */}
          {activeStep > 0 && (
            <View style={styles.cardHeader}>
              <Text style={styles.stepIndicatorText}>PASO {activeStep} DE 8</Text>
              <View style={styles.progressBarTrack}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>
            </View>
          )}

          {/* Contenido adaptable con ScrollView para evitar desbordamiento de texto */}
          <ScrollView 
            style={styles.scrollContent} 
            contentContainerStyle={styles.scrollContentContainer} 
            showsVerticalScrollIndicator={false}
          >
            {activeStep === 8 ? (
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
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.cardTitle}>{currentStepData.title}</Text>
                <Text style={styles.cardDescription}>{currentStepData.description}</Text>
              </View>
            )}
          </ScrollView>

          {/* Botones de Acción */}
          <View style={styles.buttonsRow}>
            {activeStep === 0 ? (
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
              <TouchableOpacity style={[styles.btnPrimary, { flex: 1, justifyContent: 'center' }]} onPress={goToNextStep}>
                <Text style={styles.btnPrimaryText}>🚀 Comenzar a usar Vendix</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.btnSkipText} onPress={skipTutorial}>
                  <Text style={styles.btnSkipTextOnly}>Saltar</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  darkPanel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  glowingBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00D26A',
    borderRadius: 12,
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  centeredCard: {
    width: '90%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  explanationCard: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 106, 0.25)',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepIndicatorText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    width: 90,
    height: 4,
    backgroundColor: THEME.colors.borderDark,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
  },
  scrollContent: {
    maxHeight: 220,
    marginBottom: 16,
  },
  scrollContentContainer: {
    paddingVertical: 4,
  },
  cardTitle: {
    color: THEME.colors.textWhite,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 24,
  },
  cardDescription: {
    color: THEME.colors.textLightGray,
    fontSize: 13,
    lineHeight: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnPrimary: {
    backgroundColor: THEME.colors.success,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnPrimaryText: {
    color: THEME.colors.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  btnSecondaryText: {
    color: THEME.colors.textGray,
    fontWeight: '600',
    fontSize: 13,
  },
  btnSkipText: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  btnSkipTextOnly: {
    color: THEME.colors.textGray,
    fontSize: 13,
    fontWeight: '600',
  },
  btnNavCircle: {
    backgroundColor: THEME.colors.borderDark,
    borderRadius: 12,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  successIconCircle: {
    backgroundColor: 'rgba(0, 210, 106, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 106, 0.25)',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
