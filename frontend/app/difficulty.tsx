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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Difficulty {
  level: number;
  name: string;
  pieces: string;
}

export default function DifficultyScreen() {
  const { category, categoryName } = useLocalSearchParams();
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDifficulties();
  }, []);

  const fetchDifficulties = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/puzzles/difficulties`);
      const data = await response.json();
      setDifficulties(data);
    } catch (error) {
      console.error('Error fetching difficulties:', error);
    }
    setLoading(false);
  };

  const handleDifficultyPress = (difficulty: Difficulty) => {
    router.push(`/game?category=${category}&categoryName=${categoryName}&difficulty=${difficulty.level}&difficultyName=${difficulty.name}`);
  };

  const goBack = () => {
    router.back();
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 16) return '#4CAF50'; // Green for easy
    if (level <= 36) return '#FF9800'; // Orange for medium
    return '#f44336'; // Red for hard
  };

  const renderDifficulty = ({ item }: { item: Difficulty }) => (
    <TouchableOpacity
      style={styles.difficultyCard}
      onPress={() => handleDifficultyPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.difficultyIcon, { backgroundColor: getDifficultyColor(item.level) + '20' }]}>
        <Ionicons 
          name={item.level <= 16 ? "happy" : item.level <= 36 ? "warning" : "skull"} 
          size={32} 
          color={getDifficultyColor(item.level)} 
        />
      </View>
      <Text style={styles.difficultyName}>{item.name}</Text>
      <Text style={styles.difficultyPieces}>{item.pieces} ({item.level} pieces)</Text>
      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.level) }]}>
        <Text style={styles.difficultyLevel}>Level {item.level}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading difficulties...</Text>
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
        <Text style={styles.title}>Choose Difficulty</Text>
        <Text style={styles.subtitle}>{categoryName} puzzles</Text>
      </View>

      {/* Difficulties List */}
      <View style={styles.content}>
        <FlatList
          data={difficulties}
          renderItem={renderDifficulty}
          keyExtractor={(item) => item.level.toString()}
          contentContainerStyle={styles.difficultiesContainer}
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
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  difficultiesContainer: {
    paddingBottom: 20,
  },
  difficultyCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
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
  difficultyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  difficultyPieces: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyLevel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
