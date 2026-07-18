import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated 
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { THEME } from '../constants/theme';

export default function SplashScreen({ progress, isExiting }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isExiting) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isExiting]);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <View style={styles.wavesTopLeft}>
        <Svg width="220" height="220" viewBox="0 0 100 100">
          {[20, 30, 40, 50, 60, 70, 80, 90, 100].map((r) => (
            <Circle key={r} cx="0" cy="0" r={r} fill="none" stroke={THEME.colors.primary} strokeWidth="0.5" />
          ))}
        </Svg>
      </View>

      <View style={styles.wavesBottomRight}>
        <Svg width="220" height="220" viewBox="0 0 100 100">
          {[20, 30, 40, 50, 60, 70, 80, 90, 100].map((r) => (
            <Circle key={r} cx="100" cy="100" r={r} fill="none" stroke={THEME.colors.primary} strokeWidth="0.5" />
          ))}
        </Svg>
      </View>

      <View style={styles.splashContent}>
        <View style={styles.splashLogoWrapper}>
          <Svg width="100" height="100" viewBox="0 0 24 24" fill="none">
            <Path d="M3 16.5 L6.5 13.5 V21 H3 V16.5 Z" fill={THEME.colors.primary} />
            <Path d="M8.5 11.5 L12 8.5 V21 H8.5 V11.5 Z" fill={THEME.colors.primary} />
            <Path d="M14 6.5 L17.5 3.5 V21 H14 V6.5 Z" fill={THEME.colors.primary} />
            <Path d="M2 18 L19.5 3" stroke={THEME.colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M13.5 3 H19.5 V9" stroke={THEME.colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <Text style={styles.splashTitle}>Vendix</Text>
        <Text style={styles.splashSlogan}>
          Controla. Vende. <Text style={{ color: THEME.colors.primary, fontWeight: '700' }}>Crece.</Text>
        </Text>
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  glowTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 210, 106, 0.08)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 210, 106, 0.08)',
  },
  wavesTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.12,
  },
  wavesBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    opacity: 0.12,
  },
  splashContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  splashLogoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: THEME.colors.textWhite,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  splashSlogan: {
    fontSize: 16,
    color: THEME.colors.textLightGray,
    fontWeight: '500',
  },
  progressBarTrack: {
    width: '60%',
    maxWidth: 250,
    height: 6,
    backgroundColor: THEME.colors.borderDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
  },
});
