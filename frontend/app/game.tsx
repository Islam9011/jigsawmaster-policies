import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  username: string;
}

export default function GameScreen() {
  const { category, categoryName, difficulty, difficultyName } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [puzzleImage, setPuzzleImage] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const puzzleSize = Math.sqrt(Number(difficulty));

  useEffect(() => {
    initializeGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeGame = async () => {
    try {
      // Get user data
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Generate puzzle
      await generatePuzzle();
    } catch (error) {
      console.error('Error initializing game:', error);
      Alert.alert('Error', 'Failed to initialize game');
    }
  };

  const generatePuzzle = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/puzzles/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          difficulty: Number(difficulty),
          language: 'en'
        }),
      });

      const puzzleData = await response.json();
      
      if (response.ok) {
        setPuzzleImage(puzzleData.image_base64);
        setGameStarted(true);
        startTimer();
      } else {
        Alert.alert('Error', puzzleData.detail || 'Failed to generate puzzle');
      }
    } catch (error) {
      console.error('Error generating puzzle:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  const completePuzzle = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (user) {
      try {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/progress/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            puzzle_id: `generated_${Date.now()}`,
            time_taken: timeElapsed,
            difficulty: Number(difficulty)
          }),
        });
        
        const result = await response.json();
        if (response.ok) {
          Alert.alert(
            'Congratulations! 🎉',
            `Puzzle completed!\\nTime: ${formatTime(timeElapsed)}\\nScore: ${result.score}`,
            [
              { text: 'Play Again', onPress: () => router.replace('/categories') },
              { text: 'Home', onPress: () => router.replace('/') }
            ]
          );
        }
      } catch (error) {
        console.error('Error saving progress:', error);
        Alert.alert(
          'Puzzle Complete! 🎉',
          `Time: ${formatTime(timeElapsed)}`,
          [
            { text: 'Play Again', onPress: () => router.replace('/categories') },
            { text: 'Home', onPress: () => router.replace('/') }
          ]
        );
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const goBack = () => {
    Alert.alert(
      'Leave Game?',
      'Are you sure you want to leave? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', onPress: () => router.back() }
      ]
    );
  };

  if (loading || generating) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={styles.logoContainer}>
          <Ionicons name="extension-puzzle-outline" size={80} color="#4A90E2" />
        </View>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>
          {generating ? 'Generating your puzzle...' : 'Loading...'}
        </Text>
        <Text style={styles.loadingSubtext}>
          {generating ? 'Creating a beautiful AI-generated image for your jigsaw puzzle. This may take up to 60 seconds.' : 'Please wait'}
        </Text>
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
        
        <View style={styles.gameInfo}>
          <Text style={styles.categoryText}>{categoryName}</Text>
          <Text style={styles.difficultyText}>{difficultyName} ({difficulty} pieces)</Text>
        </View>
        
        <View style={styles.stats}>
          <Text style={styles.timeText}>{formatTime(timeElapsed)}</Text>
        </View>
      </View>

      {/* Game Area */}
      <ScrollView style={styles.gameArea} contentContainerStyle={styles.gameContent}>
        {/* Puzzle Image Display */}
        <View style={styles.puzzleContainer}>
          <Text style={styles.instructionText}>
            Your {puzzleSize}x{puzzleSize} jigsaw puzzle is ready!
          </Text>
          
          {puzzleImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: `data:image/png;base64,${puzzleImage}` }}
                style={styles.puzzleImage}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.puzzleInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="extension-puzzle" size={20} color="#4A90E2" />
              <Text style={styles.infoText}>Difficulty: {difficultyName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="grid" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>Grid: {puzzleSize}×{puzzleSize} pieces</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.infoText}>Time: {formatTime(timeElapsed)}</Text>
            </View>
          </View>

          {/* Simulate Puzzle Completion Button (for demo) */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>🎯 Demo Mode</Text>
            <Text style={styles.demoText}>
              In the full game, you would drag and drop puzzle pieces to solve this image!
              For now, tap the button below to simulate completing the puzzle.
            </Text>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={completePuzzle}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.completeButtonText}>Complete Puzzle (Demo)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresList}>
            <Text style={styles.featuresTitle}>🚀 Coming Soon: Full Game Features</Text>
            
            <View style={styles.featureItem}>
              <Ionicons name="move" size={20} color="#4A90E2" />
              <Text style={styles.featureText}>Drag & drop puzzle pieces</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="resize" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Piece snapping & rotation</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.featureText}>Score based on time & difficulty</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="people" size={20} color="#FF6B35" />
              <Text style={styles.featureText}>Global leaderboards</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  gameInfo: {
    alignItems: 'center',
  },
  categoryText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  stats: {
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
  },
  gameContent: {
    padding: 20,
  },
  puzzleContainer: {
    alignItems: 'center',
  },
  instructionText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    marginBottom: 20,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  puzzleImage: {
    width: width - 80,
    height: width - 80,
    borderRadius: 8,
  },
  puzzleInfo: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  demoSection: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    width: '100%',
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FFC107',
  },
  demoText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.9,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  featuresList: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    width: '100%',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#4A90E2',
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    opacity: 0.9,
  },
});