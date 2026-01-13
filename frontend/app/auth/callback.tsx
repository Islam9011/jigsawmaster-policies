import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const { session_id } = useLocalSearchParams();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processOAuthSession = async () => {
      if (!session_id) {
        console.error('No session_id found');
        router.replace('/auth/login');
        return;
      }

      try {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/session`, {
          method: 'POST',
          headers: {
            'X-Session-ID': session_id as string,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
          console.log('OAuth authentication successful:', data);
          // Redirect to main app with user data
          router.replace('/');
        } else {
          console.error('OAuth authentication failed:', data);
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('OAuth processing error:', error);
        router.replace('/auth/login');
      }
    };

    processOAuthSession();
  }, [session_id]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.text}>Processing authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
});