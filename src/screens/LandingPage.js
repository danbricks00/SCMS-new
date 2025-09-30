import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LandingPage = ({ navigation }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dimensions, setDimensions] = useState(null);

  useEffect(() => {
    console.log('[SCMS] LandingPage mounted');
    console.log('[SCMS] Environment:', process.env.NODE_ENV);
    
    // Set window dimensions after component mounts (client-side only)
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      console.log('[SCMS] Window dimensions:', window.innerWidth, window.innerHeight);
    }
    
    return () => console.log('[SCMS] LandingPage unmounted');
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const navigateTo = (route) => {
    setMenuOpen(false);
    // Map the portal names to the correct routes
    const routeMap = {
      'StudentPortal': 'student',
      'ParentPortal': 'parent',
      'TeacherPortal': 'teacher',
      'AdminPortal': 'admin'
    };
    
    // Use the router imported at the top level
    router.push(`/${routeMap[route] || route.toLowerCase()}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with hamburger icon */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name="menu" size={32} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Management System</Text>
      </View>

      {/* Sidebar Menu */}
      {menuOpen && (
        <View style={styles.sideMenu}>
          <TouchableOpacity style={styles.closeButton} onPress={toggleMenu}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('StudentPortal')}>
              <Ionicons name="school" size={24} color="#fff" />
              <Text style={styles.menuText}>Student Portal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('ParentPortal')}>
              <Ionicons name="people" size={24} color="#fff" />
              <Text style={styles.menuText}>Parent Portal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('TeacherPortal')}>
              <Ionicons name="book" size={24} color="#fff" />
              <Text style={styles.menuText}>Teacher Portal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('AdminPortal')}>
              <Ionicons name="settings" size={24} color="#fff" />
              <Text style={styles.menuText}>Admin Portal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Welcome to Our School</Text>
          <Text style={styles.heroSubtitle}>Attendance Management System</Text>
          
          <View style={styles.featureCards}>
            <View style={styles.card}>
              <Ionicons name="calendar" size={40} color="#4a90e2" />
              <Text style={styles.cardTitle}>Attendance Tracking</Text>
              <Text style={styles.cardDescription}>Real-time attendance monitoring for students</Text>
            </View>
            
            <View style={styles.card}>
              <Ionicons name="stats-chart" size={40} color="#4a90e2" />
              <Text style={styles.cardTitle}>Performance Analytics</Text>
              <Text style={styles.cardDescription}>Detailed reports and analytics</Text>
            </View>
            
            <View style={styles.card}>
              <Ionicons name="notifications" size={40} color="#4a90e2" />
              <Text style={styles.cardTitle}>Instant Notifications</Text>
              <Text style={styles.cardDescription}>Get alerts for absences and events</Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: '100%',
    backgroundColor: '#333',
    zIndex: 999,
    paddingTop: 50,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  menuItems: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  menuText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  featureCards: {
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default LandingPage;