import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeDisplay from '../components/DateTimeDisplay';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Sample user database - in production, this would come from Firebase
  const users = {
    'admin': { password: 'admin123', role: 'admin', name: 'Admin User' },
    'teacher1': { password: 'teacher123', role: 'teacher', name: 'Ms. Johnson' },
    'teacher2': { password: 'teacher123', role: 'teacher', name: 'Mr. Smith' },
    'student1': { password: 'student123', role: 'student', name: 'John Doe', class: '10A' },
    'student2': { password: 'student123', role: 'student', name: 'Jane Smith', class: '9B' },
    'parent1': { password: 'parent123', role: 'parent', name: 'Parent User', studentId: 'student1' },
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const user = users[username.toLowerCase()];
      
      if (user && user.password === password) {
        // Login user through context
        login({
          username: username.toLowerCase(),
          role: user.role,
          name: user.name,
          class: user.class,
          studentId: user.studentId
        });

        // Redirect based on role
        const roleRoutes = {
          'admin': '/admin',
          'teacher': '/teacher',
          'student': '/student',
          'parent': '/parent'
        };

        const redirectRoute = roleRoutes[user.role];
        if (redirectRoute) {
          router.replace(redirectRoute);
        } else {
          Alert.alert('Error', 'Invalid user role');
        }
      } else {
        Alert.alert('Error', 'Invalid username or password');
      }
      setLoading(false);
    }, 1000);
  };

  const handleDemoLogin = (role) => {
    const demoUsers = {
      'admin': { username: 'admin', password: 'admin123' },
      'teacher': { username: 'teacher1', password: 'teacher123' },
      'student': { username: 'student1', password: 'student123' },
      'parent': { username: 'parent1', password: 'parent123' }
    };

    const demoUser = demoUsers[role];
    setUsername(demoUser.username);
    setPassword(demoUser.password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <DateTimeDisplay />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>School Management System</Text>
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
          <Text style={styles.credentialsText}>Admin: admin / admin123</Text>
          <Text style={styles.credentialsText}>Teacher: teacher1 / teacher123</Text>
          <Text style={styles.credentialsText}>Student: student1 / student123</Text>
          <Text style={styles.credentialsText}>Parent: parent1 / parent123</Text>
        </View>
      </View>
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
    padding: 20,
    justifyContent: 'center',
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
