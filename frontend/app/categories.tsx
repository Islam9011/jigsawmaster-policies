import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MonetizationManager from '../utils/MonetizationManager';

const { width } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Category {
  id: string;
  name: string;
  icon: string;
  isUnlocked?: boolean;
  isPremium?: boolean;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [remainingPuzzles, setRemainingPuzzles] = useState<number>(0);
  const [isPremium, setIsPremium] = useState(false);
  
  const monetization = MonetizationManager.getInstance();

  useEffect(() => {
    loadCategoriesAndStatus();
  }, []);

  const loadCategoriesAndStatus = async () => {
    try {
      // Load categories with premium status
      const data = [
        {"id":"animals","name":"Animals","icon":"🐾", isPremium: false},
        {"id":"nature","name":"Nature","icon":"🌿", isPremium: false},
        {"id":"food","name":"Food","icon":"🍎", isPremium: false},
        {"id":"objects","name":"Objects","icon":"📱", isPremium: true},
        {"id":"vehicles","name":"Vehicles","icon":"🚗", isPremium: true},
        {"id":"buildings","name":"Buildings","icon":"🏢", isPremium: true}
      ];
      
      // Check which categories are unlocked
      const categoriesWithStatus = await Promise.all(
        data.map(async (category) => {
          const isUnlocked = await monetization.isCategoryUnlocked(category.id);
          return { ...category, isUnlocked };
        })
      );
      
      setCategories(categoriesWithStatus);
      
      // Load user status
      const remaining = await monetization.getRemainingPuzzles();
      const limits = await monetization.getUserLimits();
      setRemainingPuzzles(remaining);
      setIsPremium(limits.isPremium);
      
    } catch (error) {
      console.error('Error loading categories:', error);
    }
    setLoading(false);
  };

  const handleCategoryPress = async (category: Category) => {
    if (!category.isUnlocked) {
      Alert.alert(
        'Premium Category 🌟',
        `${category.name} puzzles are part of our premium collection. Upgrade to Premium to unlock all categories!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade Now', onPress: () => router.push('/premium') }
        ]
      );
      return;
    }

    // Check daily puzzle limit
    const canPlay = await monetization.canPlayPuzzle();
    if (!canPlay.canPlay) {
      Alert.alert(
        'Daily Limit Reached 📱',
        canPlay.reason,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade to Premium', onPress: () => router.push('/premium') }
        ]
      );
      return;
    }

    router.push(`/difficulty?category=${category.id}&categoryName=${category.name}`);
  };

  const goBack = () => {
    router.back();
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryIcon}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#4A90E2" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading categories...</Text>
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
        <Text style={styles.title}>Choose Category</Text>
        <Text style={styles.subtitle}>Select a puzzle theme</Text>
      </View>

      {/* Categories List */}
      <View style={styles.content}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.categoriesContainer}
          showsVerticalScrollIndicator={false}
        />
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
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    paddingBottom: 20,
  },
  categoryCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 150,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 28,
  },
  categoryName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
});
