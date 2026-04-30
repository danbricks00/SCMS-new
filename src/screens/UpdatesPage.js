import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ActivityLog from '../components/ActivityLog';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';

const UpdatesPage = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'student';
  const [parentActivityIds, setParentActivityIds] = useState(null);
  const [parentActivityNames, setParentActivityNames] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user?.role !== 'parent') {
        setParentActivityIds(null);
        setParentActivityNames(null);
        return;
      }
      const sid = String(user?.linkedStudentId || user?.studentId || '')
        .trim()
        .toUpperCase();
      if (!sid) {
        if (!cancelled) {
          setParentActivityIds([]);
          setParentActivityNames([]);
        }
        return;
      }
      try {
        const student = await DatabaseService.getStudentById(sid);
        const name =
          student?.name ||
          `${student?.firstName || ''} ${student?.lastName || ''}`.trim() ||
          '';
        if (!cancelled) {
          setParentActivityIds([sid]);
          setParentActivityNames(name ? [name] : []);
        }
      } catch {
        if (!cancelled) {
          setParentActivityIds([sid]);
          setParentActivityNames([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role, user?.linkedStudentId, user?.studentId]);

  return (
    <ProtectedRoute requiredRole={userRole}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#4a90e2" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>All Updates</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.activityLogContainer}>
            <ActivityLog
              userRole={userRole}
              maxItems={100}
              linkedStudentIds={userRole === 'parent' ? parentActivityIds ?? [] : null}
              linkedStudentNames={userRole === 'parent' ? parentActivityNames ?? [] : null}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    color: '#4a90e2',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  activityLogContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minHeight: 300,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});

export default UpdatesPage;
