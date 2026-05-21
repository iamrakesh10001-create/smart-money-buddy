import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useGoals } from '@/contexts/GoalContext';
import { MoneyScoreRing } from '@/components/MoneyScoreRing';
import { ExpenseCard } from '@/components/ExpenseCard';
import { formatCurrency, formatCurrencyFull, getGreeting, formatMonth } from '@/utils/format';
import { getAIInsight } from '@/utils/expenseParser';
import { CATEGORY_INFO } from '@/utils/categories';

function calcMoneyScore(
  totalExpenses: number,
  income: number,
  allExpenseCount: number,
  goals: any[],
): number {
  let score = 0;

  // Spending discipline — 40 pts
  if (income > 0) {
    const r = totalExpenses / income;
    if (r <= 0) score += 35;         // spent nothing — max discipline
    else if (r < 0.4) score += 40;
    else if (r < 0.6) score += 32;
    else if (r < 0.75) score += 22;
    else if (r < 0.9) score += 12;
    else if (r < 1) score += 5;
    else score += 0;                  // overspent
  } else {
    score += 20;                      // no income recorded — neutral
  }

  // Tracking habit — 30 pts
  if (allExpenseCount >= 30) score += 30;
  else if (allExpenseCount >= 20) score += 24;
  else if (allExpenseCount >= 10) score += 18;
  else if (allExpenseCount >= 5) score += 12;
  else if (allExpenseCount >= 1) score += 6;
  // 0 expenses → 0 pts

  // Goal progress — 30 pts
  if (goals.length > 0) {
    const avgProgress =
      goals.reduce(
        (s, g) =>
          s + (g.targetAmount > 0 ? Math.min(g.currentAmount / g.targetAmount, 1) : 0),
        0,
      ) / goals.length;
    score += Math.round(avgProgress * 30);
  }

  return Math.min(100, Math.max(0, score));
}

const SCORE_TIPS: Record<string, string> = {
  Excellent: 'Outstanding financial health! Keep it up.',
  Good: 'Solid habits. Push savings a little more.',
  Fair: 'Good start — log more & set a goal.',
  Building: 'Start tracking daily to grow your score.',
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { expenses, monthlyTotal, monthlyIncome, monthlyExpenses, deleteExpense, categoryTotals, topCategory } = useExpenses();
  const { goals } = useGoals();

  const displayIncome = monthlyIncome || (user?.monthlyIncome ?? 0);

  const score = useMemo(
    () => calcMoneyScore(
      monthlyTotal,
      displayIncome,
      expenses.filter(e => e.type === 'expense').length,
      goals,
    ),
    [monthlyTotal, displayIncome, expenses, goals],
  );

  const scoreLabel =
    score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Fair' : 'Building';

  const saved = Math.max(0, displayIncome - monthlyTotal);
  const insight = getAIInsight(monthlyTotal, displayIncome, topCategory);
  const recentExpenses = expenses.slice(0, 5);

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 80;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 20, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user?.name?.split(' ')[0] ?? 'Friend'} 👋
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.avatarBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.avatarText}>{(user?.name ?? 'U').charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.monthLabel, { color: colors.mutedForeground }]}>
        {formatMonth()} · {monthlyExpenses.length} transactions
      </Text>

      {/* Score Card */}
      <View style={[styles.scoreCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        <View style={styles.scoreRow}>
          <MoneyScoreRing score={score} size={130} />
          <View style={styles.statsCol}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Spent</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{formatCurrency(monthlyTotal)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Income</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{formatCurrency(displayIncome)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Saved</Text>
              <Text style={[styles.statValue, { color: saved > 0 ? colors.success : colors.accent }]}>
                {formatCurrency(saved)}
              </Text>
            </View>
          </View>
        </View>

        {/* Score footer with tip */}
        <View style={[styles.scoreFooter, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
          <Text style={[styles.scoreFooterLabel, { color: colors.primary }]}>Money Score · {scoreLabel}</Text>
          <Text style={[styles.scoreFooterTip, { color: colors.mutedForeground }]}>
            {SCORE_TIPS[scoreLabel]}
          </Text>
        </View>
      </View>

      {/* AI Insight */}
      <TouchableOpacity
        style={[styles.insightCard, { backgroundColor: colors.primary + '15', borderRadius: colors.radius, borderColor: colors.primary + '30' }]}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/chat')}
      >
        <View style={[styles.insightIcon, { backgroundColor: colors.primary }]}>
          <Feather name="zap" size={14} color="#fff" />
        </View>
        <Text style={[styles.insightText, { color: colors.foreground }]} numberOfLines={2}>{insight}</Text>
        <Feather name="chevron-right" size={16} color={colors.primary} />
      </TouchableOpacity>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Spending</Text>
          <View style={styles.catRow}>
            {topCategories.map(([cat, amount]) => {
              const info = CATEGORY_INFO[cat as keyof typeof CATEGORY_INFO];
              const pct = displayIncome > 0 ? Math.round((amount / displayIncome) * 100) : 0;
              return (
                <View key={cat} style={[styles.catCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
                  <Text style={styles.catEmoji}>{info?.emoji ?? '💸'}</Text>
                  <Text style={[styles.catName, { color: colors.mutedForeground }]}>{cat}</Text>
                  <Text style={[styles.catAmount, { color: colors.foreground }]}>{formatCurrency(amount)}</Text>
                  <Text style={[styles.catPct, { color: info?.color ?? colors.primary }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Goals quick view */}
      {goals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Goals</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {goals.slice(0, 1).map(goal => {
            const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            return (
              <View key={goal.id} style={[styles.goalRow, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.goalTitleRow}>
                    <Text style={[styles.goalName, { color: colors.foreground }]}>{goal.name}</Text>
                    <Text style={[styles.goalPct, { color: goal.color }]}>{Math.round(pct)}%</Text>
                  </View>
                  <View style={[styles.goalTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.goalFill, { backgroundColor: goal.color, width: `${pct}%` }]} />
                  </View>
                  <Text style={[styles.goalSub, { color: colors.mutedForeground }]}>
                    {formatCurrencyFull(goal.currentAmount)} / {formatCurrencyFull(goal.targetAmount)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Recent Expenses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/chat')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {recentExpenses.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Feather name="message-circle" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No expenses yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap Chat and type "Coffee 60" to log your first expense
            </Text>
          </View>
        ) : (
          recentExpenses.map(e => <ExpenseCard key={e.id} expense={e} onDelete={deleteExpense} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 4 },
  greeting: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '800' },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  monthLabel: { fontSize: 13, fontWeight: '500', paddingHorizontal: 20, marginTop: 4, marginBottom: 14 },
  scoreCard: { marginHorizontal: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3, gap: 14 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  statsCol: { flex: 1, gap: 0 },
  statItem: { paddingVertical: 8 },
  statLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '800' },
  divider: { height: 1 },
  scoreFooter: { padding: 12, gap: 3 },
  scoreFooterLabel: { fontSize: 13, fontWeight: '700' },
  scoreFooterTip: { fontSize: 12, lineHeight: 17 },
  insightCard: { marginHorizontal: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24, borderWidth: 1 },
  insightIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  insightText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 19 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  catRow: { flexDirection: 'row', gap: 10 },
  catCard: { flex: 1, padding: 12, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  catEmoji: { fontSize: 22 },
  catName: { fontSize: 11, fontWeight: '500' },
  catAmount: { fontSize: 14, fontWeight: '700' },
  catPct: { fontSize: 11, fontWeight: '700' },
  goalRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  goalIcon: { fontSize: 26 },
  goalTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalName: { fontSize: 15, fontWeight: '700' },
  goalPct: { fontSize: 14, fontWeight: '700' },
  goalTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 3 },
  goalSub: { fontSize: 12 },
  emptyCard: { padding: 28, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
