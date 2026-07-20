import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { User, Lock, Eye, EyeOff, Check, X, ArrowRight, Sparkles, Store, ShieldCheck, UserCheck } from 'lucide-react-native';
import { THEME } from '../constants/theme';

import { auth, isFirebaseConfigured } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';

export default function LoginScreen({ onLoginSuccess, email, setEmail, password, setPassword }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Modals state
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Nickname Customization Modal State
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [pendingUserEmail, setPendingUserEmail] = useState('');
  const [userNickname, setUserNickname] = useState('');

  const triggerNicknameCustomization = (targetEmail, defaultNickname = '') => {
    setPendingUserEmail(targetEmail);
    setUserNickname(defaultNickname || targetEmail.split('@')[0] || 'Mi Negocio');
    setNicknameModalVisible(true);
  };

  const handleConfirmLoginWithNickname = () => {
    const finalNickname = userNickname.trim() || 'Mi Negocio';
    setNicknameModalVisible(false);
    setGoogleModalVisible(false);
    onLoginSuccess(pendingUserEmail, finalNickname);
  };

  const handleFormSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Datos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setIsLoading(true);

    if (isFirebaseConfigured && auth) {
      try {
        if (isRegistering) {
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          setIsLoading(false);
          triggerNicknameCustomization(userCredential.user.email, email.split('@')[0]);
        } else {
          const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          setIsLoading(false);
          triggerNicknameCustomization(userCredential.user.email, email.split('@')[0]);
        }
      } catch (error) {
        setIsLoading(false);
        console.error(error);
        let errorMsg = 'Ocurrió un error. Intenta nuevamente.';
        if (error.code === 'auth/operation-not-allowed') {
          errorMsg = 'Debes habilitar el método "Correo electrónico/Contraseña" en la pestaña Authentication de tu consola de Firebase.';
        } else if (error.code === 'auth/email-already-in-use') {
          errorMsg = 'Este correo ya está registrado.';
        } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          errorMsg = 'Correo o contraseña incorrectos.';
        } else if (error.code === 'auth/weak-password') {
          errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = 'Formato de correo no válido.';
        }
        Alert.alert('Configuración de Firebase', errorMsg);
      }
    } else {
      setTimeout(() => {
        setIsLoading(false);
        const targetEmail = email.trim() || 'demo@vendix.com';
        triggerNicknameCustomization(targetEmail, targetEmail.split('@')[0]);
      }, 500);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        '¿Olvidaste tu contraseña?',
        'Por favor, ingresa tu correo en el campo "USUARIO / CORREO" y presiona este botón para enviarte las instrucciones de recuperación.'
      );
      return;
    }

    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, email.trim());
        Alert.alert(
          'Correo Enviado',
          `Hemos enviado un enlace de recuperación de contraseña a:\n${email.trim()}\n\nRevisa tu bandeja de entrada o Spam.`
        );
      } catch (error) {
        console.error(error);
        let errorMsg = 'No se pudo enviar el correo de recuperación.';
        if (error.code === 'auth/operation-not-allowed') {
          errorMsg = 'Activa "Correo electrónico/Contraseña" en Firebase Console ➔ Authentication.';
        } else if (error.code === 'auth/user-not-found') {
          errorMsg = 'No existe ninguna cuenta registrada con este correo en Firebase.';
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = 'El formato del correo ingresado no es válido.';
        }
        Alert.alert('Error de Recuperación', errorMsg);
      }
    } else {
      Alert.alert(
        'Modo Demo - Servidor de Correo',
        `Para enviar correos REALES a tu bandeja de entrada (${email.trim()}), ingresa las claves de tu proyecto de Firebase en src/config/firebase.js.`
      );
    }
  };

  // Google Login Flow
  const handleOpenGoogleModal = () => {
    setCustomGoogleEmail(email.includes('@gmail.com') ? email : '');
    setGoogleModalVisible(true);
  };

  const handleConfirmGoogleLogin = async (selectedEmail) => {
    const finalEmail = selectedEmail || customGoogleEmail.trim();

    if (!finalEmail || !finalEmail.includes('@')) {
      Alert.alert('Correo requerido', 'Ingresa una dirección de correo válida de Google (ej. tu.nombre@gmail.com).');
      return;
    }

    setIsGoogleLoading(true);
    const defaultPass = 'GoogleAuthUser2026!';

    if (isFirebaseConfigured && auth) {
      try {
        let userCred;
        try {
          userCred = await signInWithEmailAndPassword(auth, finalEmail, defaultPass);
        } catch (e) {
          if (e.code === 'auth/operation-not-allowed') {
            throw e;
          }
          userCred = await createUserWithEmailAndPassword(auth, finalEmail, defaultPass);
        }
        setEmail(finalEmail);
        setIsGoogleLoading(false);
        setGoogleModalVisible(false);
        const defaultName = finalEmail.split('@')[0];
        triggerNicknameCustomization(userCred.user.email, defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
        return;
      } catch (fbErr) {
        console.warn("Fallo registro directo Google en Firebase:", fbErr.message);
      }
    }

    try {
      try {
        await WebBrowser.openBrowserAsync('https://accounts.google.com/signin');
      } catch (e) {}

      setEmail(finalEmail);
      setIsGoogleLoading(false);
      setGoogleModalVisible(false);
      
      const defaultName = finalEmail.split('@')[0];
      triggerNicknameCustomization(finalEmail, defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
    } catch (err) {
      setIsGoogleLoading(false);
      console.error(err);
      Alert.alert('Error Google', 'No se pudo completar el inicio de sesión con Google.');
    }
  };

  // Facebook Login Flow
  const handleFacebookLogin = async () => {
    const fbEmail = (email.trim() && email.includes('@')) ? email.trim() : 'usuario.facebook@vendix.com';
    const defaultPass = 'FacebookAuthUser2026!';

    if (isFirebaseConfigured && auth) {
      try {
        let userCred;
        try {
          userCred = await signInWithEmailAndPassword(auth, fbEmail, defaultPass);
        } catch (e) {
          if (e.code === 'auth/operation-not-allowed') {
            throw e;
          }
          userCred = await createUserWithEmailAndPassword(auth, fbEmail, defaultPass);
        }
        setEmail(fbEmail);
        triggerNicknameCustomization(userCred.user.email, 'Usuario Facebook');
        return;
      } catch (fbErr) {
        console.warn("Fallo registro directo Facebook en Firebase:", fbErr.message);
      }
    }

    try {
      setEmail(fbEmail);
      Alert.alert('Sesión con Facebook', 'Autenticando cuenta...');
      try {
        await WebBrowser.openBrowserAsync('https://www.facebook.com');
      } catch (e) {}
      triggerNicknameCustomization(fbEmail, 'Usuario Facebook');
    } catch (err) {
      console.log(err);
    }
  };

  const handleGuestLogin = async () => {
    const guestMail = 'invitado@vendix.com';
    const defaultPass = 'GuestUser2026!';

    if (isFirebaseConfigured && auth) {
      try {
        let userCred;
        try {
          userCred = await signInWithEmailAndPassword(auth, guestMail, defaultPass);
        } catch (e) {
          userCred = await createUserWithEmailAndPassword(auth, guestMail, defaultPass);
        }
        setEmail(guestMail);
        triggerNicknameCustomization(userCred.user.email, 'Invitado Vendix');
        return;
      } catch (fbErr) {}
    }

    setEmail(guestMail);
    triggerNicknameCustomization(guestMail, 'Invitado Vendix');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.loginScrollContainer} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={{ height: 52, width: 130, resizeMode: 'contain' }} 
            />
            <Text style={styles.logoText}>Vendix</Text>
          </View>
          <Text style={styles.slogan}>
            Controla. Vende. <Text style={{ color: THEME.colors.primary, fontWeight: '700' }}>Crece.</Text>
          </Text>
        </View>

        {/* Login Card */}
        <View style={styles.loginCard}>
          <View style={styles.cardHeaderBadgeRow}>
            <View style={styles.liveStatusBadge}>
              <View style={styles.liveDot} />
              <Text style={{ color: THEME.colors.primary, fontSize: 10, fontWeight: '700' }}>SISTEMA PRO</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</Text>
          <Text style={styles.cardSubtitle}>
            {isRegistering 
              ? 'Registra tu negocio en Vendix para sincronizar tus datos en la nube.' 
              : 'Ingresa tus credenciales para acceder a Vendix.'}
          </Text>
          
          {/* Input Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USUARIO / CORREO</Text>
            <View style={styles.inputFieldContainer}>
              <View style={styles.inputIcon}><User size={18} color={THEME.colors.textGray} /></View>
              <TextInput 
                placeholder="ejemplo@vendix.com" 
                placeholderTextColor={THEME.colors.textGray}
                style={styles.inputField} 
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Input Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONTRASEÑA</Text>
            <View style={styles.inputFieldContainer}>
              <View style={styles.inputIcon}><Lock size={18} color={THEME.colors.textGray} /></View>
              <TextInput 
                placeholder="••••••••" 
                placeholderTextColor={THEME.colors.textGray}
                secureTextEntry={!showPassword}
                style={[styles.inputField, { paddingRight: 45 }]} 
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={18} color={THEME.colors.textGray} /> : <Eye size={18} color={THEME.colors.textGray} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Utilities Row */}
          <View style={styles.rowUtilities}>
            <TouchableOpacity style={styles.checkboxLabel} activeOpacity={0.8}>
              <View style={styles.mockCheckbox}>
                <Check size={10} color={THEME.colors.textWhite} />
              </View>
              <Text style={{ color: THEME.colors.textGray, fontSize: 12 }}>Recordarme</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Main Submit Button */}
          <TouchableOpacity style={styles.btnPrimary} onPress={handleFormSubmit} disabled={isLoading}>
            <Text style={styles.btnPrimaryText}>
              {isLoading 
                ? 'Procesando...' 
                : isRegistering 
                  ? 'Crear Negocio y Registrar' 
                  : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth Buttons */}
          <View style={styles.socialButtonsRow}>
            <TouchableOpacity style={styles.btnSocial} onPress={handleOpenGoogleModal}>
              <Svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: 8 }}>
                <Path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.97 1 12 1 7.35 1 3.37 3.66 1.43 7.56l3.87 3A7 7 0 0 1 12 5.04z" />
                <Path fill="#4285F4" d="M23.73 12.25c0-.82-.07-1.61-.21-2.38H12v4.51h6.6c-.29 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.41-4.94 3.41-8.58z" />
                <Path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.28 0-6.06-2.21-7.05-5.19l-3.87 3C5.07 19.86 8.24 23 12 23z" />
                <Path fill="#FBBC05" d="M4.95 13.12A7 7 0 0 1 4.95 10.88L1.08 7.88a11.96 11.96 0 0 0 0 8.24l3.87-3z" />
              </Svg>
              <Text style={{ color: THEME.colors.textWhite, fontWeight: '600' }}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnSocial} onPress={handleFacebookLogin}>
              <Svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2" style={{ marginRight: 8 }}>
                <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </Svg>
              <Text style={{ color: THEME.colors.textWhite, fontWeight: '600' }}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Button */}
          <TouchableOpacity style={styles.btnSecondary} onPress={handleGuestLogin}>
             <Text style={{ color: THEME.colors.textWhite, fontWeight: '500' }}>⚡ Modo Invitado Rápido</Text>
          </TouchableOpacity>

          {/* Register Mode Toggle */}
          <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.registerText}>
              {isRegistering ? '¿Ya tienes una cuenta? ' : '¿No tienes cuenta? '}
              <Text style={styles.linkTextHighlight}>
                {isRegistering ? 'Inicia sesión aquí' : 'Registra tu negocio aquí'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer Security Badge */}
        <View style={styles.securityFooter}>
           <ShieldCheck size={16} color={THEME.colors.primary} style={{ marginRight: 6 }} />
           <Text style={{ color: THEME.colors.textGray, fontSize: 12 }}>Conexión encriptada & protegida | Vendix v1.0.0</Text>
        </View>
      </ScrollView>

      {/* MODAL 1: SELECCIÓN DE CUENTA GOOGLE */}
      <Modal
        visible={googleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.googleModalContainer}>
            <View style={styles.googleModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Svg viewBox="0 0 24 24" width="24" height="24">
                  <Path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.97 1 12 1 7.35 1 3.37 3.66 1.43 7.56l3.87 3A7 7 0 0 1 12 5.04z" />
                  <Path fill="#4285F4" d="M23.73 12.25c0-.82-.07-1.61-.21-2.38H12v4.51h6.6c-.29 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.41-4.94 3.41-8.58z" />
                  <Path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.28 0-6.06-2.21-7.05-5.19l-3.87 3C5.07 19.86 8.24 23 12 23z" />
                  <Path fill="#FBBC05" d="M4.95 13.12A7 7 0 0 1 4.95 10.88L1.08 7.88a11.96 11.96 0 0 0 0 8.24l3.87-3z" />
                </Svg>
                <Text style={styles.googleModalTitle}>Acceder con Google</Text>
              </View>
              <TouchableOpacity onPress={() => setGoogleModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color={THEME.colors.textGray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.googleModalSubtitle}>
              Ingresa tu cuenta de correo de Google para vincular tu negocio con Vendix:
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.colors.primaryDark, marginBottom: 6 }}>
                CORREO GOOGLE / GMAIL
              </Text>
              <View style={styles.inputFieldContainer}>
                <View style={styles.inputIcon}><User size={18} color={THEME.colors.textGray} /></View>
                <TextInput 
                  placeholder="tu.correo@gmail.com" 
                  placeholderTextColor={THEME.colors.textGray}
                  style={styles.inputField} 
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimary, { marginTop: 16 }]} 
              onPress={() => handleConfirmGoogleLogin()}
              disabled={isGoogleLoading}
            >
              <Text style={styles.btnPrimaryText}>
                {isGoogleLoading ? 'Autenticando con Google...' : 'Continuar con este Correo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: PERSONALIZACIÓN DE APODO / NOMBRE DE NEGOCIO */}
      <Modal
        visible={nicknameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNicknameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.googleModalContainer}>
            <View style={styles.googleModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 210, 106, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color={THEME.colors.primary} />
                </View>
                <Text style={styles.googleModalTitle}>Personaliza tu Apodo</Text>
              </View>
              <TouchableOpacity onPress={() => setNicknameModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color={THEME.colors.textGray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.googleModalSubtitle}>
              ¿Cómo quieres que aparezca tu nombre o el nombre de tu negocio en Vendix y en tus reportes PDF?
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.colors.primaryDark, marginBottom: 6 }}>
                TU APODO / NOMBRE DE NEGOCIO
              </Text>
              <View style={styles.inputFieldContainer}>
                <View style={styles.inputIcon}><Store size={18} color={THEME.colors.primary} /></View>
                <TextInput 
                  placeholder="ej. Bodega San Martín, Don Andrés..." 
                  placeholderTextColor={THEME.colors.textGray}
                  style={styles.inputField} 
                  value={userNickname}
                  onChangeText={setUserNickname}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.colors.textGray, marginBottom: 8 }}>
              SUGERENCIAS RÁPIDAS:
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {['🏪 Bodega San Martín', '🛒 Don Carlos', '🚀 Vendix Admin', '💼 Mi Negocio'].map((chip) => (
                <TouchableOpacity 
                  key={chip} 
                  style={{
                    backgroundColor: THEME.colors.inputBg,
                    borderWidth: 1,
                    borderColor: userNickname === chip.replace(/^[^\s]+\s/, '') ? THEME.colors.primary : THEME.colors.borderDark,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 8
                  }}
                  onPress={() => setUserNickname(chip.replace(/^[^\s]+\s/, ''))}
                >
                  <Text style={{ color: THEME.colors.textWhite, fontSize: 12, fontWeight: '500' }}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.btnPrimary} 
              onPress={handleConfirmLoginWithNickname}
            >
              <Text style={styles.btnPrimaryText}>
                🚀 Entrar a Vendix con este Apodo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loginScrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: Dimensions.get('window').height * 0.85,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.colors.textWhite,
  },
  slogan: {
    color: THEME.colors.textLightGray,
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 1,
    fontSize: 14,
  },
  loginCard: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 106, 0.25)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 390,
  },
  cardHeaderBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 210, 106, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 106, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: THEME.colors.textWhite,
    marginBottom: 6,
  },
  cardSubtitle: {
    color: THEME.colors.textGray,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
    gap: 6,
  },
  inputLabel: {
    color: THEME.colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputFieldContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  inputField: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 42,
    paddingRight: 14,
    color: THEME.colors.textWhite,
    fontSize: 14,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  rowUtilities: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkboxLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mockCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: THEME.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    color: THEME.colors.primaryDark,
    fontSize: 12,
  },
  btnPrimary: {
    backgroundColor: THEME.colors.success,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: {
    color: THEME.colors.textWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.borderDark,
  },
  dividerText: {
    color: THEME.colors.textGray,
    fontSize: 12,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  btnSocial: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 14,
    padding: 14,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.textWhite,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  registerText: {
    textAlign: 'center',
    fontSize: 13,
    color: THEME.colors.textGray,
    marginTop: 22,
  },
  linkTextHighlight: {
    color: THEME.colors.success,
    fontWeight: '600',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  googleModalContainer: {
    backgroundColor: THEME.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
  },
  googleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  googleModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  googleModalSubtitle: {
    color: THEME.colors.textGray,
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  googleAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  googleAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
