import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated()) {
        // No user logged in, redirect to login
        router.replace('/login');
        return;
      }

      if (requiredRole && !hasRole(requiredRole)) {
        // User doesn't have required role, redirect to their appropriate portal
        const roleRoutes = {
          'admin': '/admin',
          'teacher': '/teacher',
          'student': '/student',
          'parent': '/parent'
        };
        
        const userRoute = roleRoutes[user.role];
        if (userRoute) {
          router.replace(userRoute);
        } else {
          router.replace('/login');
        }
        return;
      }
    }
  }, [user, loading, isAuthenticated, hasRole, requiredRole]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated()) {
    return null; // Will redirect to login
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null; // Will redirect to appropriate portal
  }

  return children;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default ProtectedRoute;
