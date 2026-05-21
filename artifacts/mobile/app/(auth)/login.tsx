import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!name.trim()) {
      setError('Please enter your name to get started');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await login({
        name: name.trim(),
        monthlyIncome: 0,
        salaryDate: 1,
        primaryCategory: 'Food',
        monthlyTarget: 0,
        primaryGoal: '',
        onboardingComplete: false,
      });
      router.replace('/(onboarding)/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
          <Feather name="zap" size={32} color="#fff" />
        </View>

        <Text style={[styles.appName, { color: colors.foreground }]}>Smart Money Buddy</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Track money like chatting.{'\n'}Save without budgeting stress.
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.foreground }]}>What should we call you?</Text>
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.card,
                borderColor: error ? colors.destructive : colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="user" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Your first name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={text => { setName(text); setError(''); }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleStart}
            />
          </View>
          {!!error && (
            <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.btn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
            isLoading && { opacity: 0.7 },
          ]}
          onPress={handleStart}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.btnText}>Get Started</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.features}>
          {[
            { icon: 'message-circle', label: 'Log expenses by chatting' },
            { icon: 'target', label: 'Set and crush savings goals' },
            { icon: 'bar-chart-2', label: 'AI-powered spending insights' },
          ].map(f => (
            <View key={f.label} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={f.icon as any} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.featureLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, alignItems: 'center' },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#6C47FF',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  appName: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  tagline: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 48 },
  form: { width: '100%', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  error: { fontSize: 13, marginTop: 6 },
  btn: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
    shadowColor: '#6C47FF',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  features: { width: '100%', gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 14, fontWeight: '500' },
});
