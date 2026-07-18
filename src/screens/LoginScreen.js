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
  Dimensions
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { User, Lock, Eye, EyeOff, Check } from 'lucide-react-native';
import { THEME } from '../constants/theme';

export default function LoginScreen({ onLoginSuccess, email, setEmail, password, setPassword }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Datos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1000);
  };

  const handleFacebookLogin = async () => {
    try {
      setEmail('facebook.user@vendix.com');
      Alert.alert('Simulación Facebook', 'Redirigiendo a Facebook...');
      await WebBrowser.openBrowserAsync('https://www.facebook.com');
      onLoginSuccess();
    } catch (err) {
      console.log(err);
    }
  };

  const handleGoogleLogin = async () => {
    setEmail('google.user@vendix.com');
    Alert.alert('Simulación Google', 'Vinculando con Google...');
    setTimeout(() => onLoginSuccess(), 800);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.loginScrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.brandHeader}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={{ height: 48, width: 120, resizeMode: 'contain' }} 
            />
            <Text style={styles.logoText}>Vendix</Text>
          </View>
          <Text style={styles.slogan}>
            Controla. Vende. <Text style={{ color: THEME.colors.primary, fontWeight: '700' }}>Crece.</Text>
          </Text>
        </View>

        <View style={styles.loginCard}>
          <Text style={styles.cardTitle}>Bienvenido</Text>
          <Text style={styles.cardSubtitle}>Ingresa tus credenciales para acceder a Vendix.</Text>
          
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

          <View style={styles.rowUtilities}>
            <TouchableOpacity style={styles.checkboxLabel} activeOpacity={0.8}>
              <View style={styles.mockCheckbox}>
                <Check size={10} color={THEME.colors.textWhite} />
              </View>
              <Text style={{ color: THEME.colors.textGray, fontSize: 12 }}>Recordarme</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Recuperación', 'Recuperación de contraseña en desarrollo.')}>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleFormSubmit} disabled={isLoading}>
            <Text style={styles.btnPrimaryText}>{isLoading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsRow}>
            <TouchableOpacity style={styles.btnSocial} onPress={handleGoogleLogin}>
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

          <TouchableOpacity style={styles.btnSecondary} onPress={() => {
            setEmail('invitado@vendix.com');
            onLoginSuccess();
          }}>
             <Text style={{ color: THEME.colors.textWhite, fontWeight: '500' }}>Modo Invitado</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('Registro', 'Registro disponible pronto.')}>
            <Text style={styles.registerText}>
              ¿No tienes cuenta? <Text style={styles.linkTextHighlight}>Registra tu negocio aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.securityFooter}>
           <Check size={14} color={THEME.colors.success} style={{ marginRight: 4 }} />
           <Text style={{ color: THEME.colors.textGray, fontSize: 12 }}>Tu información está segura con nosotros</Text>
        </View>
      </ScrollView>
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
    marginBottom: 32,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 32,
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
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
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
    marginTop: 10,
  },
  registerText: {
    textAlign: 'center',
    fontSize: 13,
    color: THEME.colors.textGray,
    marginTop: 24,
  },
  linkTextHighlight: {
    color: THEME.colors.success,
    fontWeight: '600',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
});
