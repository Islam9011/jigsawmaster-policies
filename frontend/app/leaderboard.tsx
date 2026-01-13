import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_score: number;
  puzzles_completed: number;
  average_time: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function LeaderboardScreen() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [categoryLeaderboard, setCategoryLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('global');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchGlobalLeaderboard(),
      fetchCategories(),
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedCategory === 'global') {
      await fetchGlobalLeaderboard();
    } else {
      await fetchCategoryLeaderboard(selectedCategory);
    }
    setRefreshing(false);
  };

  const fetchGlobalLeaderboard = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/leaderboard/global`);
      const data = await response.json();
      if (response.ok) {
        setGlobalLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
    }
  };

  const fetchCategoryLeaderboard = async (category: string) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/leaderboard/category/${category}`);
      const data = await response.json();
      if (response.ok) {
        setCategoryLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching category leaderboard:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/puzzles/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    if (category === 'global') {
      if (globalLeaderboard.length === 0) {
        await fetchGlobalLeaderboard();
      }
    } else {
      await fetchCategoryLeaderboard(category);
    }
  };

  const goBack = () => {
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return { name: 'trophy', color: '#FFD700' };
    if (position === 2) return { name: 'medal', color: '#C0C0C0' };
    if (position === 3) return { name: 'medal', color: '#CD7F32' };
    return { name: 'person', color: '#4A90E2' };
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const position = index + 1;
    const rankIcon = getRankIcon(position);

    return (
      <View style={[
        styles.leaderboardItem,
        position <= 3 && styles.topThreeItem
      ]}>
        <View style={styles.rankContainer}>
          <Ionicons name={rankIcon.name as any} size={24} color={rankIcon.color} />
          <Text style={[styles.rankText, { color: rankIcon.color }]}>#{position}</Text>
        </View>

        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.username}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={14} color="#4A90E2" />
              <Text style={styles.statText}>{item.total_score}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="extension-puzzle-outline" size={14} color="#4CAF50" />
              <Text style={styles.statText}>{item.puzzles_completed}</Text>
            </View>
            {item.average_time > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color="#FF9800" />
                <Text style={styles.statText}>{formatTime(item.average_time)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.total_score}</Text>
          <Text style={styles.scoreLabel}>points</Text>
        </View>
      </View>
    );
  };

  const getCurrentLeaderboard = () => {
    return selectedCategory === 'global' ? globalLeaderboard : categoryLeaderboard;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
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
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.headerSpace} />
      </View>

      {/* Category Selector */}
      <View style={styles.categorySelector}>
        <FlatList
          data={[{ id: 'global', name: 'Global', icon: '🌍' }, ...categories]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryTab,
                selectedCategory === item.id && styles.selectedCategoryTab
              ]}
              onPress={() => handleCategoryChange(item.id)}
            >
              <Text style={styles.categoryTabIcon}>{item.icon}</Text>
              <Text style={[
                styles.categoryTabText,
                selectedCategory === item.id && styles.selectedCategoryTabText
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Leaderboard */}
      <View style={styles.leaderboardContainer}>
        {getCurrentLeaderboard().length > 0 ? (
          <FlatList
            data={getCurrentLeaderboard()}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => item.user_id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4A90E2']}
                tintColor="#4A90E2"
              />
            }
            contentContainerStyle={styles.leaderboardList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptyText}>
              Be the first to complete a puzzle and claim your spot!
            </Text>
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={() => router.push('/categories')}
            >
              <Text style={styles.playButtonText}>Start Playing</Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerSpace: {
    width: 40, // Same width as back button for centering
  },
  categorySelector: {
    paddingVertical: 15,
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  categoryList: {
    paddingHorizontal: 15,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  selectedCategoryTab: {
    backgroundColor: '#4A90E2',
  },
  categoryTabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryTabText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryTabText: {
    color: 'white',
  },
  leaderboardContainer: {
    flex: 1,
    padding: 20,
  },
  leaderboardList: {
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  topThreeItem: {
    borderColor: '#4A90E2',
    borderWidth: 2,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#666',
    fontSize: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
    lineHeight: 22,
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