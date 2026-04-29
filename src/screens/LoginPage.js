import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeDisplay from '../components/DateTimeDisplay';
import ResponsiveScreen from '../components/ResponsiveScreen';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Sample user database - in production, this would come from Firebase
  const users = {
    'hq1001': { username: 'HQ1001', password: 'Admin-HQ1001', role: 'admin', name: 'Harper Quill', profileId: 'HQ1001' },
    'mk1203': { username: 'MK1203', password: 'Teach-MK1203', role: 'teacher', name: 'Mila Kensley', profileId: 'MK1203' },
    'rp2207': { username: 'RP2207', password: 'Teach-RP2207', role: 'teacher', name: 'Rowan Prescott', profileId: 'RP2207' },
    'ac0611': { username: 'AC0611', password: 'Stud-AC0611', role: 'student', name: 'Avery Coleman', class: '10A', studentId: 'AC0611' },
    'nr1904': { username: 'NR1904', password: 'Stud-NR1904', role: 'student', name: 'Niko Ramsey', class: '10A', studentId: 'NR1904' },
    'kc1001': { username: 'KC1001', password: 'Par-KC1001', role: 'parent', name: 'Keira Coleman', studentId: 'AC0611', profileId: 'KC1001' },
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const user = users[username.trim().toLowerCase()];
      
      if (user && user.password === password) {
        // Login user through context
        login({
          username: user.username || username.trim().toUpperCase(),
          role: user.role,
          name: user.name,
          profileId: user.profileId,
          class: user.class,
          studentId: user.studentId
        });

        // Check for intended destination first
        let redirectRoute = null;
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const intendedDestination = sessionStorage.getItem('intendedDestination');
          if (intendedDestination) {
            // Map the intended destination to the correct route
            const destinationMap = {
              'StudentPortal': '/student',
              'ParentPortal': '/parent',
              'TeacherPortal': '/teacher',
              'AdminPortal': '/admin'
            };
            redirectRoute = destinationMap[intendedDestination];
            // Clear the intended destination
            sessionStorage.removeItem('intendedDestination');
          }
        }

        // If no intended destination, use role-based routing
        if (!redirectRoute) {
          const roleRoutes = {
            'admin': '/admin',
            'teacher': '/teacher',
            'student': '/student',
            'parent': '/parent'
          };
          redirectRoute = roleRoutes[user.role];
        }

        if (redirectRoute) {
          router.replace(redirectRoute);
        } else {
          Alert.alert('Error', 'Invalid user role or destination');
        }
      } else {
        Alert.alert('Error', 'Invalid username or password');
      }
      setLoading(false);
    }, 1000);
  };

  const handleDemoLogin = (role) => {
    const demoUsers = {
      'admin': { username: 'HQ1001', password: 'Admin-HQ1001' },
      'teacher': { username: 'MK1203', password: 'Teach-MK1203' },
      'student': { username: 'AC0611', password: 'Stud-AC0611' },
      'parent': { username: 'KC1001', password: 'Par-KC1001' }
    };

    const demoUser = demoUsers[role];
    setUsername(demoUser.username);
    setPassword(demoUser.password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <DateTimeDisplay />
      <ResponsiveScreen>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>School Class Management System</Text>
          <Text style={styles.subtitle}>Please login to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
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
              style={[styles.demoButton, styles.adminButton]}
              onPress={() => handleDemoLogin('admin')}
            >
              <Ionicons name="shield" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoButton, styles.teacherButton]}
              onPress={() => handleDemoLogin('teacher')}
            >
              <Ionicons name="person" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Teacher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoButton, styles.studentButton]}
              onPress={() => handleDemoLogin('student')}
            >
              <Ionicons name="school" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Student</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoButton, styles.parentButton]}
              onPress={() => handleDemoLogin('parent')}
            >
              <Ionicons name="people" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Parent</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.credentials}>
          <Text style={styles.credentialsTitle}>Demo Credentials:</Text>
          <Text style={styles.credentialsText}>Admin: HQ1001 / Admin-HQ1001</Text>
          <Text style={styles.credentialsText}>Teacher: MK1203 / Teach-MK1203</Text>
          <Text style={styles.credentialsText}>Student: AC0611 / Stud-AC0611</Text>
          <Text style={styles.credentialsText}>Parent: KC1001 / Par-KC1001</Text>
        </View>
      </View>
      </ResponsiveScreen>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingVertical: 20,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
