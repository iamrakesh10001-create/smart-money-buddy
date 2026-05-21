import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/types';
import { CATEGORY_INFO } from '@/utils/categories';

const CATEGORIES: Category[] = ['Food', 'Shopping', 'Travel', 'Entertainment', 'Bills', 'Healthcare'];
const GOALS = ['House', 'Travel', 'Emergency Fund', 'Investment', 'New Device', 'Wedding'];
const STEPS = 5;

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('');
  const [salaryDate, setSalaryDate] = useState(1);
  const [primaryCategory, setPrimaryCategory] = useState<Category>('Food');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('Emergency Fund');

  const progress = ((step + 1) / STEPS) * 100;

  const handleNext = () => {
    if (step < STEPS - 1) {
      setStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleFinish = async () => {
    await updateProfile({
      monthlyIncome: parseFloat(income.replace(/,/g, '')) || 0,
      salaryDate,
      primaryCategory,
      monthlyTarget: parseFloat(monthlyTarget.replace(/,/g, '')) || 0,
      primaryGoal,
      onboardingComplete: true,
    });
    router.replace('/(tabs)/');
  };

  const canProceed = () => {
    if (step === 0) return income.length > 0;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepEmoji]}>💰</Text>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              What's your monthly income?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              This helps us calculate your money score accurately
            </Text>
            <View style={[styles.amountRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.rupee, { color: colors.primary }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.foreground }]}
                placeholder="45,000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={income}
                onChangeText={setIncome}
                autoFocus
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>📅</Text>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              When do you get paid?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Select the day of the month your salary arrives
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dateGrid}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dateChip,
                      {
                        backgroundColor: salaryDate === d ? colors.primary : colors.card,
                        borderColor: salaryDate === d ? colors.primary : colors.border,
                        borderRadius: 12,
                      },
                    ]}
                    onPress={() => setSalaryDate(d)}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        { color: salaryDate === d ? '#fff' : colors.foreground },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Where do you spend most?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Your biggest spending category
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => {
                const info = CATEGORY_INFO[cat];
                const isSelected = primaryCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catCard,
                      {
                        backgroundColor: isSelected ? info.color + '20' : colors.card,
                        borderColor: isSelected ? info.color : colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                    onPress={() => setPrimaryCategory(cat)}
                  >
                    <Text style={styles.catEmoji}>{info.emoji}</Text>
                    <Text style={[styles.catLabel, { color: colors.foreground }]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🏦</Text>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Monthly savings target?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              How much do you want to save each month?
            </Text>
            <View style={[styles.amountRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.rupee, { color: colors.primary }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.foreground }]}
                placeholder="5,000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={monthlyTarget}
                onChangeText={setMonthlyTarget}
                autoFocus
              />
            </View>
            <TouchableOpacity onPress={handleNext} style={styles.skipLink}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>✨</Text>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              What's your primary goal?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              What are you saving up for?
            </Text>
            <View style={styles.goalGrid}>
              {GOALS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.goalChip,
                    {
                      backgroundColor: primaryGoal === g ? colors.primary : colors.card,
                      borderColor: primaryGoal === g ? colors.primary : colors.border,
                      borderRadius: 24,
                    },
                  ]}
                  onPress={() => setPrimaryGoal(g)}
                >
                  <Text
                    style={[
                      styles.goalChipText,
                      { color: primaryGoal === g ? '#fff' : colors.foreground },
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const isLastStep = step === STEPS - 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) },
        ]}
      >
        <TouchableOpacity onPress={handleBack} disabled={step === 0} hitSlop={12}>
          <Feather
            name="arrow-left"
            size={22}
            color={step === 0 ? 'transparent' : colors.foreground}
          />
        </TouchableOpacity>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progress}%` },
            ]}
          />
        </View>
        <Text style={[styles.stepCounter, { color: colors.mutedForeground }]}>
          {step + 1}/{STEPS}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: canProceed() ? colors.primary : colors.muted,
              borderRadius: colors.radius,
            },
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.nextBtnText,
              { color: canProceed() ? '#fff' : colors.mutedForeground },
            ]}
          >
            {isLastStep ? `Let's go, ${user?.name?.split(' ')[0] ?? 'friend'}!` : 'Continue'}
          </Text>
          <Feather
            name={isLastStep ? 'zap' : 'arrow-right'}
            size={18}
            color={canProceed() ? '#fff' : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepCounter: { fontSize: 13, fontWeight: '600', minWidth: 30, textAlign: 'right' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
  stepContent: { flex: 1, paddingTop: 12 },
  stepEmoji: { fontSize: 48, marginBottom: 16 },
  stepTitle: { fontSize: 26, fontWeight: '800', marginBottom: 8, lineHeight: 34 },
  stepSub: { fontSize: 15, lineHeight: 22, marginBottom: 28 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 58,
  },
  rupee: { fontSize: 22, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '600' },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateChip: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dateChipText: { fontSize: 15, fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '30%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: 6,
  },
  catEmoji: { fontSize: 26 },
  catLabel: { fontSize: 12, fontWeight: '600' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  goalChipText: { fontSize: 14, fontWeight: '600' },
  skipLink: { marginTop: 16, alignSelf: 'center' },
  skipText: { fontSize: 14 },
  footer: { paddingHorizontal: 24 },
  nextBtn: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700' },
});
