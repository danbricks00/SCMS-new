import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { DatabaseService } from '../services/database';

const AnnouncementBanner = ({ targetAudience = 'all', style }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const allAnnouncements = await DatabaseService.getActiveAnnouncements();
      
      // Filter by target audience
      const filteredAnnouncements = allAnnouncements.filter(announcement => 
        announcement.targetAudience === 'all' || 
        announcement.targetAudience === targetAudience
      );
      
      // Sort by priority (urgent first, then high, then normal)
      const sortedAnnouncements = filteredAnnouncements.sort((a, b) => {
        const priorityOrder = { urgent: 3, high: 2, normal: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      setAnnouncements(sortedAnnouncements);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]);
    }
  };

  if (announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'warning';
      case 'high':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return '#f44336';
      case 'high':
        return '#ff9800';
      default:
        return '#2196f3';
    }
  };

  const nextAnnouncement = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const prevAnnouncement = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  if (showAll) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Announcements</Text>
          <TouchableOpacity onPress={() => setShowAll(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.announcementList}>
          {announcements.map((announcement, index) => (
            <View key={announcement.id} style={styles.announcementItem}>
              <View style={styles.announcementHeader}>
                <View style={styles.announcementTitleRow}>
                  <Ionicons 
                    name={getPriorityIcon(announcement.priority)} 
                    size={20} 
                    color={getPriorityColor(announcement.priority)} 
                  />
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(announcement.priority) }]}>
                    {announcement.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.announcementMessage}>{announcement.message}</Text>
              <Text style={styles.announcementDate}>
                {new Date(announcement.createdAt).toLocaleDateString()} • Target: {announcement.targetAudience}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.bannerContainer, style]}>
      <View style={[styles.banner, { borderLeftColor: getPriorityColor(currentAnnouncement.priority) }]}>
        <View style={styles.bannerContent}>
          <Ionicons 
            name={getPriorityIcon(currentAnnouncement.priority)} 
            size={20} 
            color={getPriorityColor(currentAnnouncement.priority)} 
          />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{currentAnnouncement.title}</Text>
            <Text style={styles.bannerMessage} numberOfLines={2}>
              {currentAnnouncement.message}
            </Text>
          </View>
        </View>
        
        <View style={styles.bannerActions}>
          {announcements.length > 1 && (
            <>
              <TouchableOpacity onPress={prevAnnouncement} style={styles.navButton}>
                <Ionicons name="chevron-back" size={20} color="#666" />
              </TouchableOpacity>
              <Text style={styles.navText}>{currentIndex + 1}/{announcements.length}</Text>
              <TouchableOpacity onPress={nextAnnouncement} style={styles.navButton}>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={() => setShowAll(true)} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  announcementList: {
    maxHeight: 400,
  },
  announcementItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  announcementMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
  },
  bannerContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  banner: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bannerText: {
    flex: 1,
    marginLeft: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bannerMessage: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  bannerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 4,
  },
  navText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  viewAllButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AnnouncementBanner;
