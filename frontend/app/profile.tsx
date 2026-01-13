import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  username: string;
  email: string;
  total_score: number;
  puzzles_completed: number;
  preferred_language: string;
}

interface UserProgress {
  user: User;
  progress: any[];
  total_score: number;
  puzzles_completed: number;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
        await fetchUserProgress(user.id);
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/auth/login');
    }
    setLoading(false);
  };

  const fetchUserProgress = async (userId: string) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/progress/user/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserProgress(data);
        // Update local user data with latest stats
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('user');
            router.replace('/');
          }
        }
      ]
    );
  };

  const goBack = () => {
    router.back();
  };

  const calculateAverageTime = () => {
    if (!userProgress?.progress || userProgress.progress.length === 0) return 0;
    
    const totalTime = userProgress.progress.reduce((sum, p) => sum + p.time_taken, 0);
    return Math.round(totalTime / userProgress.progress.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRank = () => {
    const score = userProgress?.total_score || 0;
    if (score >= 1000) return 'Master';
    if (score >= 500) return 'Expert';
    if (score >= 200) return 'Advanced';
    if (score >= 50) return 'Intermediate';
    return 'Beginner';
  };

  const getRankColor = () => {
    const rank = getRank();
    switch (rank) {
      case 'Master': return '#FFD700';
      case 'Expert': return '#FF6B35';
      case 'Advanced': return '#4A90E2';
      case 'Intermediate': return '#4CAF50';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!user || !userProgress) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle" size={80} color="#666" />
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>

      {/* Profile Content */}
      <View style={styles.content}>
        {/* User Avatar & Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={100} color="#4A90E2" />
          </View>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          
          <View style={[styles.rankBadge, { backgroundColor: getRankColor() }]}>
            <Text style={styles.rankText}>{getRank()}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={32} color="#FFD700" />
            <Text style={styles.statValue}>{userProgress.total_score}</Text>
            <Text style={styles.statLabel}>Total Score</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="extension-puzzle" size={32} color="#4A90E2" />
            <Text style={styles.statValue}>{userProgress.puzzles_completed}</Text>
            <Text style={styles.statLabel}>Puzzles</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>{formatTime(calculateAverageTime())}</Text>
            <Text style={styles.statLabel}>Avg Time</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={32} color="#FF6B35" />
            <Text style={styles.statValue}>
              {userProgress.puzzles_completed > 0 ? Math.round(userProgress.total_score / userProgress.puzzles_completed) : 0}
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        {/* Achievement Section */}
        <View style={styles.achievementSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {userProgress.progress.length > 0 ? (
            <View style={styles.activityList}>
              {userProgress.progress.slice(0, 5).map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityText}>
                      Completed {activity.difficulty}-piece puzzle
                    </Text>
                    <Text style={styles.activityTime}>
                      Score: {activity.score} | Time: {formatTime(activity.time_taken)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="extension-puzzle-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No puzzles completed yet</Text>
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={() => router.push('/categories')}
              >
                <Text style={styles.playButtonText}>Start Playing</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 144, 226, 0.3)',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  rankBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  achievementSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 15,
  },
  activityList: {
    flex: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  activityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  activityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginVertical: 16,
  },
  playButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
