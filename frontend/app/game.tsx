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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface PuzzlePiece {
  id: string;
  x: number;
  y: number;
  currentX: number;
  currentY: number;
  correctX: number;
  correctY: number;
  imageData: string;
  isPlaced: boolean;
}

interface User {
  id: string;
  username: string;
}

export default function GameScreen() {
  const { category, categoryName, difficulty, difficultyName } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [puzzleImage, setPuzzleImage] = useState<string>('');
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [completedPieces, setCompletedPieces] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const puzzleSize = Math.sqrt(Number(difficulty));
  const pieceSize = (width - 40) / puzzleSize;
  const boardHeight = pieceSize * puzzleSize;

  useEffect(() => {
    initializeGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Start timer when puzzle is loaded
    if (!loading && !generating && pieces.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, generating, pieces.length]);

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
        generatePieces(puzzleData.image_base64);
      } else {
        Alert.alert('Error', puzzleData.detail || 'Failed to generate puzzle');
      }
    } catch (error) {
      console.error('Error generating puzzle:', error);
      Alert.alert('Error', 'Failed to generate puzzle');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const generatePieces = (imageBase64: string) => {
    const newPieces: PuzzlePiece[] = [];
    const totalPieces = Number(difficulty);
    
    // Create puzzle pieces
    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / puzzleSize);
      const col = i % puzzleSize;
      
      const piece: PuzzlePiece = {
        id: `piece_${i}`,
        x: col * pieceSize,
        y: row * pieceSize,
        currentX: Math.random() * (width - pieceSize - 40) + 20,
        currentY: boardHeight + 50 + Math.random() * 200,
        correctX: col * pieceSize + 20,
        correctY: row * pieceSize + 100,
        imageData: imageBase64,
        isPlaced: false
      };
      
      newPieces.push(piece);
    }
    
    // Shuffle pieces
    for (let i = newPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tempX = newPieces[i].currentX;
      const tempY = newPieces[i].currentY;
      newPieces[i].currentX = newPieces[j].currentX;
      newPieces[i].currentY = newPieces[j].currentY;
      newPieces[j].currentX = tempX;
      newPieces[j].currentY = tempY;
    }
    
    setPieces(newPieces);
  };

  const createPanResponder = (piece: PuzzlePiece) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDragging(piece.id);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newX = piece.currentX + gestureState.dx;
        const newY = piece.currentY + gestureState.dy;
        
        setPieces(prevPieces => 
          prevPieces.map(p => 
            p.id === piece.id 
              ? { ...p, currentX: newX, currentY: newY }
              : p
          )
        );
      },
      onPanResponderRelease: () => {
        setDragging(null);
        checkPiecePlacement(piece);
      },
    });
  };

  const checkPiecePlacement = (piece: PuzzlePiece) => {
    const tolerance = 30;
    const isCorrectPosition = 
      Math.abs(piece.currentX - piece.correctX) < tolerance &&
      Math.abs(piece.currentY - piece.correctY) < tolerance;

    if (isCorrectPosition && !piece.isPlaced) {
      // Snap to correct position
      setPieces(prevPieces => 
        prevPieces.map(p => 
          p.id === piece.id 
            ? { ...p, currentX: piece.correctX, currentY: piece.correctY, isPlaced: true }
            : p
        )
      );
      
      setCompletedPieces(prev => {
        const newCount = prev + 1;
        if (newCount === Number(difficulty)) {
          completePuzzle();
        }
        return newCount;
      });
    }
  };

  const completePuzzle = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsComplete(true);
    
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
            `Puzzle completed!\nTime: ${formatTime(timeElapsed)}\nScore: ${result.score}`,
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
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>
          {generating ? 'Generating puzzle...' : 'Loading...'}
        </Text>
        <Text style={styles.loadingSubtext}>
          {generating ? 'This may take a moment' : 'Please wait'}
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
          <Text style={styles.difficultyText}>{difficultyName}</Text>
        </View>
        
        <View style={styles.stats}>
          <Text style={styles.timeText}>{formatTime(timeElapsed)}</Text>
          <Text style={styles.progressText}>{completedPieces}/{difficulty}</Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Puzzle Board - Background grid */}
        <View style={[styles.puzzleBoard, { height: boardHeight }]}>
          {Array.from({ length: Number(difficulty) }).map((_, index) => {
            const row = Math.floor(index / puzzleSize);
            const col = index % puzzleSize;
            return (
              <View
                key={`slot_${index}`}
                style={[
                  styles.pieceSlot,
                  {
                    left: col * pieceSize,
                    top: row * pieceSize,
                    width: pieceSize,
                    height: pieceSize,
                  }
                ]}
              />
            );
          })}
        </View>

        {/* Puzzle Pieces */}
        <View style={styles.piecesContainer}>
          {pieces.map((piece) => {
            const panResponder = createPanResponder(piece);
            return (
              <Animated.View
                key={piece.id}
                style={[
                  styles.puzzlePiece,
                  {
                    left: piece.currentX,
                    top: piece.currentY,
                    width: pieceSize,
                    height: pieceSize,
                    zIndex: dragging === piece.id ? 1000 : piece.isPlaced ? 100 : 1,
                    opacity: piece.isPlaced ? 1 : 0.9,
                  }
                ]}
                {...panResponder.panHandlers}
              >
                <Image
                  source={{ uri: `data:image/png;base64,${piece.imageData}` }}
                  style={[
                    styles.pieceImage,
                    {
                      transform: [
                        { translateX: -piece.x },
                        { translateY: -piece.y }
                      ]
                    }
                  ]}
                  resizeMode="cover"
                />
                {piece.isPlaced && (
                  <View style={styles.placedIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(completedPieces / Number(difficulty)) * 100}%` }
          ]} 
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
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
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
  progressText: {
    color: '#4A90E2',
    fontSize: 12,
  },
  gameArea: {
    flex: 1,
    padding: 20,
    position: 'relative',
  },
  puzzleBoard: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    position: 'relative',
  },
  pieceSlot: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  piecesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  puzzlePiece: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A90E2',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pieceImage: {
    width: width - 40,
    height: width - 40,
  },
  placedIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 10,
    padding: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
});
