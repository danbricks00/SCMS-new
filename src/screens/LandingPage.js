import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeDisplay from '../components/DateTimeDisplay';
import ResponsiveScreen from '../components/ResponsiveScreen';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const LandingPage = ({ navigation }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
  const showInlineNav = !isMobile;

  useEffect(() => {
    return () => {};
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const navigateToLogin = () => {
    setMenuOpen(false);
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ResponsiveScreen>
        <View style={[styles.header, showInlineNav && styles.headerDesktop]}>
          {!showInlineNav ? (
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
              <Ionicons name="menu" size={32} color="#333" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBrand}>
              <Ionicons name="school" size={28} color="#4a90e2" />
            </View>
          )}
          <Text
            style={[styles.headerTitle, showInlineNav && styles.headerTitleDesktop]}
            numberOfLines={showInlineNav ? 1 : 2}
          >
            School Class Management System
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.dateTimeContainer}>
          <DateTimeDisplay />
        </View>

        {menuOpen && !showInlineNav && (
          <View style={styles.sideMenu}>
            <TouchableOpacity style={styles.closeButton} onPress={toggleMenu}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <View style={styles.menuItems}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={navigateToLogin}
              >
                <Ionicons name="log-in-outline" size={24} color="#fff" />
                <Text style={styles.menuText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleLarge]}>Welcome to Our School</Text>
            <Text style={[styles.heroSubtitle, isTablet && styles.heroSubtitleLarge]}>
              Attendance Management System
            </Text>
            <TouchableOpacity style={styles.heroLoginButton} onPress={navigateToLogin}>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.heroLoginButtonText}>Login</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.featureCards,
                !isMobile && styles.featureCardsRow,
              ]}
            >
              <View style={[styles.card, !isMobile && styles.cardGrid]}>
                <Ionicons name="calendar" size={40} color="#4a90e2" />
                <Text style={styles.cardTitle}>Attendance Tracking</Text>
                <Text style={styles.cardDescription}>Real-time attendance monitoring for students</Text>
              </View>

              <View style={[styles.card, !isMobile && styles.cardGrid]}>
                <Ionicons name="stats-chart" size={40} color="#4a90e2" />
                <Text style={styles.cardTitle}>Performance Analytics</Text>
                <Text style={styles.cardDescription}>Detailed reports and analytics</Text>
              </View>

              <View style={[styles.card, !isMobile && styles.cardGrid]}>
                <Ionicons name="notifications" size={40} color="#4a90e2" />
                <Text style={styles.cardTitle}>Instant Notifications</Text>
                <Text style={styles.cardDescription}>Get alerts for absences and events</Text>
              </View>
            </View>
          </View>
        </View>
      </ResponsiveScreen>
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
  headerDesktop: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerBrand: {
    marginRight: 8,
  },
  headerSpacer: {
    width: 40,
  },
  menuButton: {
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
  },
  headerTitleDesktop: {
    flexGrow: 1,
    flexBasis: 120,
    fontSize: 20,
    marginLeft: 8,
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
    paddingVertical: 20,
    justifyContent: 'center',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroTitleLarge: {
    fontSize: 44,
  },
  heroSubtitle: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  heroSubtitleLarge: {
    fontSize: 28,
    marginBottom: 48,
  },
  heroLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginBottom: 28,
  },
  heroLoginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  featureCards: {
    width: '100%',
    marginTop: 8,
  },
  featureCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
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
  cardGrid: {
    width: '30%',
    minWidth: 220,
    maxWidth: 360,
    marginBottom: 0,
    flexGrow: 1,
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
