import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeDisplay from '../components/DateTimeDisplay';

const LandingPage = ({ navigation }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    console.log('[SCMS] LandingPage mounted');
    console.log('[SCMS] Environment:', process.env.NODE_ENV);

    const screenDimensions = Dimensions.get('window');
    console.log('[SCMS] Window dimensions:', screenDimensions.width, screenDimensions.height);

    return () => console.log('[SCMS] LandingPage unmounted');
  }, []);

  const toggleMenu = () => {
    console.log('[SCMS] Toggle menu clicked, current state:', menuOpen);
    setMenuOpen(!menuOpen);
  };

  const navigateTo = (route) => {
    setMenuOpen(false);
    // Store the intended destination in session storage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('intendedDestination', route);
    }
    
    // Redirect to login page
    router.push('/login');
  };

  console.log('[SCMS] Rendering LandingPage, menuOpen:', menuOpen);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with hamburger icon */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name="menu" size={32} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Management System</Text>
      </View>

      {/* Date and Time Display */}
      <View style={styles.dateTimeContainer}>
        <DateTimeDisplay />
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
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
  },
  dateTimeContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1001,
  },
  menuItems: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    width: '80%',
  },
  menuText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 50,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  featureCards: {
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LandingPage;