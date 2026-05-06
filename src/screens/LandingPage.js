import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeDisplay from '../components/DateTimeDisplay';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const LandingPage = () => {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
  const headerIconSize = isMobile ? 48 : isTablet ? 58 : 70;
  const headerFontSize = isMobile ? 20 : isTablet ? 28 : 32;
  const headerLineHeight = isMobile ? 25 : isTablet ? 32 : 36;
  const headerIconGap = isMobile ? 24 : 30;
  const dateLeftOffset = headerIconSize + headerIconGap;
  const heroTitleSize = isMobile ? 26 : isTablet ? 66 : 78;
  const heroSubtitleSize = isMobile ? 18 : isTablet ? 45 : 54;
  const heroLoginIconSize = isMobile ? 22 : isTablet ? 28 : 32;
  const heroLoginFontSize = isMobile ? 18 : isTablet ? 24 : 28;
  const heroLoginPaddingVertical = isMobile ? 14 : isTablet ? 18 : 22;
  const heroLoginPaddingHorizontal = isMobile ? 30 : isTablet ? 44 : 56;
  const sectionGap = 56;
  const heroSectionTop = sectionGap;
  const heroTitleBottom = isMobile ? 8 : 16;
  const heroSubtitleBottom = isMobile ? 20 : 40;

  const navigateToLogin = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#ffffff', '#edf2f8', '#d9e2ef']} style={styles.gradientBg}>
        <View style={styles.fullWidthContent}>
          <View style={[styles.headerCenterBlock, !isMobile && styles.headerCornerBlock]}>
            <View style={[styles.headerTitleRow, { gap: headerIconGap }, !isMobile && styles.headerTitleRowLeft]}>
              <Ionicons name="school" size={headerIconSize} color="#4a90e2" />
              <Text
                style={[
                  styles.headerTitle,
                  { fontSize: headerFontSize, lineHeight: headerLineHeight },
                  !isMobile && styles.headerTitleLeft
                ]}
              >
                School Class{'\n'}Management System
              </Text>
            </View>
            <DateTimeDisplay
              style={[styles.dateTimeInline, { alignSelf: 'flex-start', marginLeft: dateLeftOffset }]}
              textStyle={styles.dateTimeInlineText}
              showIcon={false}
            />
          </View>

          <View style={[styles.content, !isMobile && styles.contentCenteredDesktop]}>
            <View
              style={[
                styles.heroSection,
                { paddingTop: heroSectionTop },
                isMobile && styles.heroSectionMobileCentered,
                !isMobile && styles.heroSectionDesktopCentered
              ]}
            >
              <Text
                style={[
                  styles.heroTitle,
                  { fontSize: heroTitleSize, lineHeight: isMobile ? 32 : isTablet ? 74 : 86, marginBottom: heroTitleBottom }
                ]}
              >
                Welcome to Our School
              </Text>
              <Text
                style={[
                  styles.heroSubtitle,
                  { fontSize: heroSubtitleSize, lineHeight: isMobile ? 24 : isTablet ? 56 : 64, marginBottom: heroSubtitleBottom }
                ]}
              >
                Attendance Management System
              </Text>
              <TouchableOpacity
                style={[
                  styles.heroLoginButton,
                  {
                    marginBottom: sectionGap,
                    paddingVertical: heroLoginPaddingVertical,
                    paddingHorizontal: heroLoginPaddingHorizontal,
                  }
                ]}
                onPress={navigateToLogin}
              >
                <Ionicons name="log-in-outline" size={heroLoginIconSize} color="#fff" />
                <Text style={[styles.heroLoginButtonText, { fontSize: heroLoginFontSize }]}>Login</Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.featureCards,
                  isMobile && styles.featureCardsMobileInset,
                  !isMobile && styles.featureCardsRow,
                ]}
              >
                <View style={[styles.card, isMobile && styles.cardMobile, !isMobile && styles.cardGrid]}>
                  <Ionicons name="calendar" size={40} color="#4a90e2" />
                  <Text style={styles.cardTitle}>Attendance Tracking</Text>
                  <Text style={styles.cardDescription}>Real-time attendance monitoring for students</Text>
                </View>

                <View style={[styles.card, isMobile && styles.cardMobile, !isMobile && styles.cardGrid]}>
                  <Ionicons name="stats-chart" size={40} color="#4a90e2" />
                  <Text style={styles.cardTitle}>Performance Analytics</Text>
                  <Text style={styles.cardDescription}>Detailed reports and analytics</Text>
                </View>

                <View style={[styles.card, isMobile && styles.cardMobile, !isMobile && styles.cardGrid]}>
                  <Ionicons name="notifications" size={40} color="#4a90e2" />
                  <Text style={styles.cardTitle}>Instant Notifications</Text>
                  <Text style={styles.cardDescription}>Get alerts for absences and events</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
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
  fullWidthContent: {
    flex: 1,
    width: '100%',
  },
  headerCenterBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 22,
    paddingBottom: 4,
    gap: 8,
    width: '100%',
    paddingHorizontal: 14,
  },
  headerCornerBlock: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  headerTitleRowLeft: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    maxWidth: 520,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
    flex: 1,
    flexShrink: 1,
  },
  headerTitleLeft: {
    textAlign: 'left',
  },
  dateTimeInline: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  dateTimeInlineText: {
    color: '#5b6470',
    fontWeight: '500',
    fontSize: 12,
  },
  content: {
    flex: 1,
    paddingVertical: 10,
  },
  contentCenteredDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 32,
    width: '100%',
  },
  heroSectionMobileCentered: {
    minHeight: '68%',
    justifyContent: 'center',
    paddingTop: 56,
  },
  heroSectionDesktopCentered: {
    justifyContent: 'center',
    maxWidth: 980,
    alignSelf: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  heroTitleLarge: {
    fontSize: 44,
  },
  heroSubtitle: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 12,
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
    marginBottom: 0,
  },
  heroLoginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  featureCards: {
    width: '100%',
    marginTop: 0,
  },
  featureCardsMobileInset: {
    paddingHorizontal: 12,
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
  cardMobile: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 12,
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
    marginTop: 10,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LandingPage;
