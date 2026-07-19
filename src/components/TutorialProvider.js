import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TUTORIAL_STEPS } from './tutorialData';

const TutorialContext = createContext(null);

export function TutorialProvider({ children, currentRoute, setCurrentRoute, loggedInUser }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [layouts, setLayouts] = useState({});

  // 1. Check if tutorial is completed on mount or when user logs in
  useEffect(() => {
    const checkTutorialStatus = async () => {
      // Only show tutorial if user is logged in
      if (!loggedInUser) {
        setIsTutorialActive(false);
        return;
      }
      try {
        const completed = await AsyncStorage.getItem('@vendix_tutorial_completed');
        if (completed !== 'true') {
          setIsTutorialActive(true);
          setActiveStep(0);
        } else {
          setIsTutorialActive(false);
        }
      } catch (err) {
        console.error('Error checking tutorial status:', err);
      }
    };
    checkTutorialStatus();
  }, [loggedInUser]);

  // 2. Control navigation during tutorial step changes
  useEffect(() => {
    if (isTutorialActive) {
      const step = TUTORIAL_STEPS[activeStep];
      if (step && step.route && step.route !== currentRoute) {
        setCurrentRoute(step.route);
      }
    }
  }, [activeStep, isTutorialActive]);

  const registerLayout = (stepName, layout) => {
    setLayouts((prev) => ({
      ...prev,
      [stepName]: layout,
    }));
  };

  const goToNextStep = async () => {
    if (activeStep < TUTORIAL_STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      // Completed last step (Final Screen)
      try {
        await AsyncStorage.setItem('@vendix_tutorial_completed', 'true');
        setIsTutorialActive(false);
        setActiveStep(0);
        setCurrentRoute('dashboard');
      } catch (err) {
        console.error('Error saving tutorial completed state:', err);
      }
    }
  };

  const goToPrevStep = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const skipTutorial = async () => {
    try {
      await AsyncStorage.setItem('@vendix_tutorial_completed', 'true');
      setIsTutorialActive(false);
      setActiveStep(0);
      setCurrentRoute('dashboard');
    } catch (err) {
      console.error('Error skipping tutorial:', err);
    }
  };

  const resetTutorial = async () => {
    try {
      await AsyncStorage.removeItem('@vendix_tutorial_completed');
      setActiveStep(0);
      setIsTutorialActive(true);
      setCurrentRoute('dashboard');
    } catch (err) {
      console.error('Error resetting tutorial:', err);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        activeStep,
        isTutorialActive,
        layouts,
        registerLayout,
        goToNextStep,
        goToPrevStep,
        skipTutorial,
        resetTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
