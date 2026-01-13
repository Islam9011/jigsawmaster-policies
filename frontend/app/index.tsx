import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  username: string;
  email: string;
  total_score: number;
  puzzles_completed: number;
  preferred_language: string;
}

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    // For demo purposes, we'll skip user session checking
    setLoading(false);
  };

  const handlePlayPress = () => {
    // For demo purposes, go directly to categories
    router.push('/categories');
  };

  const handleProfilePress = () => {
    if (user) {
      router.push('/profile');
    } else {
      router.push('/auth/login');
    }
  };

  const handleLeaderboardPress = () => {
    router.push('/leaderboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Jigsaw Master</Text>
        <Text style={styles.subtitle}>Challenge Your Mind</Text>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome back, {user.username}!</Text>
            <Text style={styles.scoreText}>Score: {user.total_score} | Puzzles: {user.puzzles_completed}</Text>
          </View>
        )}
      </View>

      {/* Game Logo/Icon */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="extension-puzzle-outline" size={80} color="#4A90E2" />
        </View>
      </View>

      {/* Main Menu Buttons */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.playButton} onPress={handlePlayPress}>
          <Ionicons name="play-circle" size={30} color="white" />
          <Text style={styles.playButtonText}>Start Playing</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleProfilePress}>
            <Ionicons name="person-circle" size={24} color="#4A90E2" />
            <Text style={styles.secondaryButtonText}>{user ? 'Profile' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleLeaderboardPress}>
            <Ionicons name="trophy" size={24} color="#4A90E2" />
            <Text style={styles.secondaryButtonText}>Leaderboard</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by AI • Multiple Categories • Global Leaderboards</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'space-between',
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
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  userInfo: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  welcomeText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  menuContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  secondaryButton: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    flex: 0.45,
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});
