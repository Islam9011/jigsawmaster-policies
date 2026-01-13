import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLimits {
  dailyPuzzlesUsed: number;
  lastResetDate: string;
  isPremium: boolean;
  premiumExpiry?: string;
}

export interface PremiumFeatures {
  unlimitedPuzzles: boolean;
  allCategories: boolean;
  noAds: boolean;
  customPuzzles: boolean;
  offlineMode: boolean;
}

class MonetizationManager {
  private static instance: MonetizationManager;
  
  // Free tier limits
  private readonly FREE_DAILY_PUZZLES = 5;
  private readonly FREE_CATEGORIES = ['animals', 'nature', 'food'];
  
  static getInstance(): MonetizationManager {
    if (!MonetizationManager.instance) {
      MonetizationManager.instance = new MonetizationManager();
    }
    return MonetizationManager.instance;
  }

  async getUserLimits(): Promise<UserLimits> {
    try {
      const stored = await AsyncStorage.getItem('user_limits');
      if (stored) {
        const limits = JSON.parse(stored);
        
        // Reset daily limits if it's a new day
        const today = new Date().toDateString();
        if (limits.lastResetDate !== today) {
          limits.dailyPuzzlesUsed = 0;
          limits.lastResetDate = today;
          await this.saveUserLimits(limits);
        }
        
        return limits;
      }
    } catch (error) {
      console.error('Error getting user limits:', error);
    }
    
    // Return default limits
    const defaultLimits: UserLimits = {
      dailyPuzzlesUsed: 0,
      lastResetDate: new Date().toDateString(),
      isPremium: false
    };
    
    await this.saveUserLimits(defaultLimits);
    return defaultLimits;
  }

  async saveUserLimits(limits: UserLimits): Promise<void> {
    try {
      await AsyncStorage.setItem('user_limits', JSON.stringify(limits));
    } catch (error) {
      console.error('Error saving user limits:', error);
    }
  }

  async canPlayPuzzle(): Promise<{ canPlay: boolean; reason?: string }> {
    const limits = await this.getUserLimits();
    
    if (limits.isPremium && this.isPremiumActive(limits)) {
      return { canPlay: true };
    }
    
    if (limits.dailyPuzzlesUsed >= this.FREE_DAILY_PUZZLES) {
      return { 
        canPlay: false, 
        reason: `Daily limit reached! You've played ${this.FREE_DAILY_PUZZLES} puzzles today. Upgrade to Premium for unlimited puzzles.`
      };
    }
    
    return { canPlay: true };
  }

  async recordPuzzlePlayed(): Promise<void> {
    const limits = await this.getUserLimits();
    
    // Only increment if user is not premium
    if (!limits.isPremium || !this.isPremiumActive(limits)) {
      limits.dailyPuzzlesUsed += 1;
      await this.saveUserLimits(limits);
    }
  }

  async isCategoryUnlocked(categoryId: string): Promise<boolean> {
    const limits = await this.getUserLimits();
    
    // Premium users get all categories
    if (limits.isPremium && this.isPremiumActive(limits)) {
      return true;
    }
    
    // Free users get basic categories
    return this.FREE_CATEGORIES.includes(categoryId);
  }

  async getPremiumFeatures(): Promise<PremiumFeatures> {
    const limits = await this.getUserLimits();
    const isActive = limits.isPremium && this.isPremiumActive(limits);
    
    return {
      unlimitedPuzzles: isActive,
      allCategories: isActive,
      noAds: isActive,
      customPuzzles: isActive,
      offlineMode: isActive
    };
  }

  private isPremiumActive(limits: UserLimits): boolean {
    if (!limits.isPremium || !limits.premiumExpiry) {
      return false;
    }
    
    const expiryDate = new Date(limits.premiumExpiry);
    return expiryDate > new Date();
  }

  async activatePremium(duration: 'month' | 'year' = 'month'): Promise<void> {
    const limits = await this.getUserLimits();
    
    const now = new Date();
    const expiry = new Date(now);
    
    if (duration === 'month') {
      expiry.setMonth(expiry.getMonth() + 1);
    } else {
      expiry.setFullYear(expiry.getFullYear() + 1);
    }
    
    limits.isPremium = true;
    limits.premiumExpiry = expiry.toISOString();
    
    await this.saveUserLimits(limits);
  }

  async getRemainingPuzzles(): Promise<number> {
    const limits = await this.getUserLimits();
    
    if (limits.isPremium && this.isPremiumActive(limits)) {
      return -1; // Unlimited
    }
    
    return Math.max(0, this.FREE_DAILY_PUZZLES - limits.dailyPuzzlesUsed);
  }

  // Demo function to simulate premium purchase
  async simulatePremiumPurchase(): Promise<void> {
    await this.activatePremium('month');
  }

  // Demo function to reset daily limits (for testing)
  async resetDailyLimits(): Promise<void> {
    const limits = await this.getUserLimits();
    limits.dailyPuzzlesUsed = 0;
    limits.lastResetDate = new Date().toDateString();
    await this.saveUserLimits(limits);
  }
}

export default MonetizationManager;