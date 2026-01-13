import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MonetizationManager from '../utils/MonetizationManager';

export default function PremiumScreen() {
  const [remainingPuzzles, setRemainingPuzzles] = useState<number>(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const monetization = MonetizationManager.getInstance();

  useEffect(() => {
    loadUserStatus();
  }, []);

  const loadUserStatus = async () => {
    try {
      const remaining = await monetization.getRemainingPuzzles();
      const limits = await monetization.getUserLimits();
      setRemainingPuzzles(remaining);
      setIsPremium(limits.isPremium);
    } catch (error) {
      console.error('Error loading user status:', error);
    }
  };

  const handleUpgradeToPremium = async () => {
    setLoading(true);
    
    try {
      // In a real app, you would integrate with RevenueCat/App Store
      // For demo purposes, we'll simulate the purchase
      await monetization.simulatePremiumPurchase();
      
      Alert.alert(
        'Premium Activated! 🎉',
        'Welcome to Jigsaw Master Premium!\n\n✅ Unlimited daily puzzles\n✅ All premium categories\n✅ No advertisements\n✅ Custom puzzle creation\n✅ Offline mode',
        [
          { 
            text: 'Start Playing!', 
            onPress: () => {
              loadUserStatus();
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    
    setLoading(false);
  };

  const handleRestorePurchases = () => {
    Alert.alert('Restore Purchases', 'This feature connects to App Store/Google Play to restore your previous purchases.');
  };

  const goBack = () => {
    router.back();
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <Text style={styles.title}>Premium Status</Text>
          <View style={styles.headerSpace} />
        </View>

        <View style={styles.premiumContainer}>
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={60} color="#FFD700" />
            <Text style={styles.premiumTitle}>Premium Active!</Text>
            <Text style={styles.premiumSubtitle}>You have access to all premium features</Text>
          </View>

          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Ionicons name="infinite" size={24} color="#4CAF50" />
              <Text style={styles.featureText}>Unlimited Puzzles</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="apps" size={24} color="#4CAF50" />
              <Text style={styles.featureText}>All Categories</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="remove-circle" size={24} color="#4CAF50" />
              <Text style={styles.featureText}>No Ads</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="create" size={24} color="#4CAF50" />
              <Text style={styles.featureText}>Custom Puzzles</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={() => router.push('/categories')}>
            <Text style={styles.playButtonText}>Continue Playing</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Your Current Status</Text>
          <View style={styles.statusRow}>
            <Ionicons name="extension-puzzle" size={20} color="#4A90E2" />
            <Text style={styles.statusText}>
              Daily Puzzles: {remainingPuzzles === -1 ? 'Unlimited' : `${remainingPuzzles} remaining`}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons name="apps" size={20} color="#666" />
            <Text style={styles.statusText}>Categories: Basic (3 of 6)</Text>
          </View>
        </View>

        {/* Premium Features */}
        <View style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Ionicons name="star" size={32} color="#FFD700" />
            <Text style={styles.premiumCardTitle}>Jigsaw Master Premium</Text>
            <Text style={styles.premiumCardSubtitle}>Unlock the full experience</Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureDescription}>Unlimited daily puzzles</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureDescription}>All 6 premium categories</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureDescription}>No advertisements</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureDescription}>Create custom puzzles from your photos</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureDescription}>Offline puzzle mode</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureDescription}>Priority customer support</Text>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingOption}>
            <View style={styles.pricingHeader}>
              <Text style={styles.pricingTitle}>Monthly Premium</Text>
              <Text style={styles.pricingPrice}>$4.99/month</Text>
            </View>
            <Text style={styles.pricingDescription}>Cancel anytime. Full access to all features.</Text>
          </View>
        </View>

        {/* Call to Action */}
        <TouchableOpacity 
          style={[styles.upgradeButton, loading && styles.disabledButton]} 
          onPress={handleUpgradeToPremium}
          disabled={loading}
        >
          <Ionicons name="star" size={24} color="white" />
          <Text style={styles.upgradeButtonText}>
            {loading ? 'Activating Premium...' : 'Upgrade Now - $4.99/month'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Benefits Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Why Upgrade?</Text>
          <Text style={styles.summaryText}>
            Join thousands of premium users who enjoy unlimited puzzle-solving with our AI-generated content. 
            Create personalized puzzles, access exclusive categories, and enjoy an ad-free experience.
          </Text>
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
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
  },
  premiumCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 8,
  },
  premiumCardSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  featuresList: {
    marginTop: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDescription: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  pricingCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  pricingOption: {
    alignItems: 'center',
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 4,
  },
  pricingDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButtonText: {
    color: '#4A90E2',
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 12,
  },
  summaryText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  // Premium Active Styles
  premiumContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    alignItems: 'center',
    marginBottom: 40,
  },
  premiumTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 16,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  featureItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  featureText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});