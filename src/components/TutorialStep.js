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
