import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResponsiveScreen from '../components/ResponsiveScreen';
import { isFirebaseConfigured } from '../config/firebase';
import { fetchDemoUsersByRole, loginWithAppUser } from '../services/appUsersAuth';
import { useAuth } from '../contexts/AuthContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const LoginPage = () => {
  const { isMobile, isTablet } = useResponsiveLayout();
  const headerIconSize = isMobile ? 56 : isTablet ? 64 : 72;
  const headerFontSize = isMobile ? 20 : isTablet ? 26 : 30;
  const headerLineHeight = isMobile ? 26 : isTablet ? 32 : 36;
  const headerIconGap = isMobile ? 18 : 24;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [demoLogins, setDemoLogins] = useState({});
  const { login } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const demos = await fetchDemoUsersByRole();
        if (!cancelled) {
          setDemoLogins(demos);
        }
      } catch (e) {
        console.warn('[Login] Could not load demo accounts from Firestore:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async () => {
    setFormError('');

    if (!username.trim() || !password.trim()) {
      setFormError('Enter your school email or account id and your password.');
      return;
    }

    setLoading(true);

    try {
      const user = await loginWithAppUser(username, password);

      login({
        username: user.username,
        role: user.role,
        name: user.name,
        profileId: user.profileId,
        email: user.email,
        class: user.class,
        studentId: user.studentId,
        linkedStudentIds: user.linkedStudentIds,
        linkedStudentId: user.linkedStudentId
      });

      let redirectRoute = null;
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const intendedDestination = sessionStorage.getItem('intendedDestination');
        if (intendedDestination) {
          const destinationMap = {
            StudentPortal: '/student',
            ParentPortal: '/parent',
            TeacherPortal: '/teacher',
            AdminPortal: '/admin'
          };
          redirectRoute = destinationMap[intendedDestination];
          sessionStorage.removeItem('intendedDestination');
        }
      }

      if (!redirectRoute) {
        const roleRoutes = {
          admin: '/admin',
          teacher: '/teacher',
          student: '/student',
          parent: '/parent'
        };
        redirectRoute = roleRoutes[user.role];
      }

      if (redirectRoute) {
        setFormError('');
        router.replace(redirectRoute);
      } else {
        setFormError('Your account is missing a valid role. Please contact support.');
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      setFormError(
        error?.message || 'Could not sign in. Check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    setFormError('');
    const demoUser = demoLogins[role];
    if (!demoUser) {
      setFormError(
        `No demo user with role "${role}" is set up yet. Add a user in Firestore with that role (and matching Authentication).`
      );
      return;
    }
    setUsername(demoUser.username);
    setPassword(demoUser.password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#ffffff', '#edf2f8', '#d9e2ef']} style={styles.gradientBg}>
        <ResponsiveScreen>
      <View style={styles.content}>
        <View style={[styles.header, { paddingTop: isMobile ? 38 : 54 }]}>
          <View style={[styles.headerTitleRow, { gap: headerIconGap }]}>
            <Ionicons name="school" size={headerIconSize} color="#4a90e2" />
            <Text style={[styles.title, { fontSize: headerFontSize, lineHeight: headerLineHeight }]}>
              School Class{'\n'}Management System
            </Text>
          </View>
          {!isFirebaseConfigured && (
            <Text style={styles.configWarning}>
              Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_* in your environment before signing in.
            </Text>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.formSubtitle}>Please login to continue</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email or account id</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(t) => {
                setFormError('');
                setUsername(t);
              }}
              placeholder="School email or profile code"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordFieldRow}>
              <TextInput
                style={styles.passwordInputFlex}
                value={password}
                onChangeText={(t) => {
                  setFormError('');
                  setPassword(t);
                }}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.passwordEyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {!!formError && (
            <View accessibilityLiveRegion="polite">
              <Text style={styles.formError}>{formError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.loginButton,
              (loading || !isFirebaseConfigured) && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={loading || !isFirebaseConfigured}
          >
            <Ionicons name="log-in" size={20} color="#fff" />
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Accounts</Text>
          <Text style={styles.demoSubtitle}>Click to auto-fill credentials</Text>
          
          <View style={styles.demoButtons}>
          <TouchableOpacity
            style={[
              styles.demoButton,
              styles.adminButton,
              (!demoLogins.admin || loading) && styles.demoButtonDisabled
            ]}
            onPress={() => handleDemoLogin('admin')}
            disabled={!demoLogins.admin || loading}
          >
              <Ionicons name="shield" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.demoButton,
                styles.teacherButton,
                (!demoLogins.teacher || loading) && styles.demoButtonDisabled
              ]}
              onPress={() => handleDemoLogin('teacher')}
              disabled={!demoLogins.teacher || loading}
            >
              <Ionicons name="person" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Teacher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.demoButton,
                styles.studentButton,
                (!demoLogins.student || loading) && styles.demoButtonDisabled
              ]}
              onPress={() => handleDemoLogin('student')}
              disabled={!demoLogins.student || loading}
            >
              <Ionicons name="school" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Student</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.demoButton,
                styles.parentButton,
                (!demoLogins.parent || loading) && styles.demoButtonDisabled
              ]}
              onPress={() => handleDemoLogin('parent')}
              disabled={!demoLogins.parent || loading}
            >
              <Ionicons name="people" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Parent</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.credentials}>
          <Text style={styles.credentialsTitle}>How sign-in works</Text>
          <Text style={styles.credentialsText}>
            Use your school email or the same profile code you use at school (we match your Firestore user and sign you
            in with Firebase). Demo buttons fill a sample account per role when available.
          </Text>
        </View>
      </View>
      </ResponsiveScreen>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradientBg: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    paddingHorizontal: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
    flexShrink: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  configWarning: {
    marginTop: 12,
    fontSize: 14,
    color: '#c0392b',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingRight: 4,
  },
  passwordInputFlex: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    fontSize: 16,
  },
  passwordEyeButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formError: {
    color: '#c0392b',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    marginTop: -4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a90e2',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  demoSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  demoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
    gap: 6,
  },
  demoButtonDisabled: {
    opacity: 0.45,
  },
  adminButton: {
    backgroundColor: '#e74c3c',
  },
  teacherButton: {
    backgroundColor: '#3498db',
  },
  studentButton: {
    backgroundColor: '#2ecc71',
  },
  parentButton: {
    backgroundColor: '#f39c12',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  credentials: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  credentialsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

export default LoginPage;
