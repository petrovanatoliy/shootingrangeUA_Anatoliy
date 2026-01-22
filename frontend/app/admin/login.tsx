import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  warm: '#5A3E40',
  white: '#FFFFFF',
  error: '#FF6B6B',
};

// Simple admin credentials (in production, use proper auth)
const ADMIN_CODE = '1234';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (code.length < 4) {
      Alert.alert('Помилка', 'Введіть код доступу');
      return;
    }

    setLoading(true);
    try {
      // Simple validation
      if (code === ADMIN_CODE) {
        await AsyncStorage.setItem('admin_mode', 'true');
        router.replace('/admin/dashboard');
      } else {
        Alert.alert('Помилка', 'Невірний код доступу');
      }
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося увійти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={60} color={COLORS.accent} />
          </View>

          <Text style={styles.title}>Вхід для адміністратора</Text>
          <Text style={styles.subtitle}>Введіть код доступу</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Код доступу"
              placeholderTextColor={COLORS.accent}
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="log-in" size={24} color={COLORS.white} />
                <Text style={styles.loginButtonText}>Увійти</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>Код за замовчуванням: 1234</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    padding: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginTop: -60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.light,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 8,
  },
  loginButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    color: COLORS.accent,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
