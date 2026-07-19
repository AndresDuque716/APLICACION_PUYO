import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { useTutorial } from './TutorialProvider';

export default function TutorialStep({ stepName, children, style }) {
  const { registerLayout, activeStep, isTutorialActive } = useTutorial();
  const viewRef = useRef(null);

  const measureElement = () => {
    if (viewRef.current && isTutorialActive) {
      viewRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          registerLayout(stepName, { x, y, width, height });
        }
      });
    }
  };

  useEffect(() => {
    if (isTutorialActive) {
      // Agrega un pequeño retraso para asegurar que la pantalla haya cambiado y el renderizado finalice
      const timer = setTimeout(measureElement, 350);
      return () => clearTimeout(timer);
    }
  }, [activeStep, isTutorialActive]);

  return (
    <View
      ref={viewRef}
      onLayout={measureElement}
      style={style}
      collapsable={false}
    >
      {children}
    </View>
  );
}
