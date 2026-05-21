import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatCurrencyFull } from '@/utils/format';
import { CATEGORY_INFO } from '@/utils/categories';
import { Category } from '@/types';

type Period = 'week' | 'month';

function getWeeklyExpenses(expenses: any[]) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  return expenses.filter(e => new Date(e.createdAt) >= weekAgo && e.type === 'expense');
}

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses, monthlyExpenses, monthlyTotal, monthlyIncome, categoryTotals } = useExpenses();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('month');

  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 80;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const weeklyExpenses = getWeeklyExpenses(expenses);
  const weeklyTotal = weeklyExpenses.reduce((s, e) => s + e.amount, 0);

  const activeExpenses = period === 'month' ? monthlyExpenses.filter(e => e.type === 'expense') : weeklyExpenses;
  const activeTotal = period === 'month' ? monthlyTotal : weeklyTotal;

  const activeCategoryTotals: Record<string, number> = {};
  activeExpenses.forEach(e => {
    activeCategoryTotals[e.category] = (activeCategoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(activeCategoryTotals).sort((a, b) => b[1] - a[1]);
  const maxCat = sortedCategories[0]?.[1] ?? 1;

  const displayIncome = monthlyIncome || (user?.monthlyIncome ?? 0);
  const savingsRate = displayIncome > 0 ? Math.max(0, ((displayIncome - monthlyTotal) / displayIncome) * 100) : 0;

  const avgPerDay = (() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    return dayOfMonth > 0 ? monthlyTotal / dayOfMonth : 0;
  })();

  const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
  const projectedTotal = monthlyTotal + avgPerDay * daysLeft;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Insights</Text>
        <View style={[styles.toggle, { backgroundColor: colors.secondary, borderRadius: 12 }]}>
          {(['week', 'month'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.toggleBtn,
                period === p && { backgroundColor: colors.primary, borderRadius: 10 },
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: period === p ? '#fff' : colors.mutedForeground },
                ]}
              >
                {p === 'week' ? 'Week' : 'Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
            <Text style={styles.summaryCardLabel}>Total Spent</Text>
            <Text style={styles.summaryCardValue}>{formatCurrency(activeTotal)}</Text>
            <Feather name="trending-down" size={16} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.success, borderRadius: colors.radius }]}>
            <Text style={styles.summaryCardLabel}>Savings Rate</Text>
            <Text style={styles.summaryCardValue}>{Math.round(savingsRate)}%</Text>
            <Feather name="trending-up" size={16} color="rgba(255,255,255,0.7)" />
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Text style={[styles.summaryCardLabel, { color: colors.mutedForeground }]}>Daily Avg</Text>
            <Text style={[styles.summaryCardValue, { color: colors.foreground }]}>{formatCurrency(avgPerDay)}</Text>
            <Feather name="calendar" size={16} color={colors.mutedForeground} />
          </View>
          {period === 'month' && (
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <Text style={[styles.summaryCardLabel, { color: colors.mutedForeground }]}>Projected</Text>
              <Text style={[styles.summaryCardValue, { color: projectedTotal > displayIncome ? colors.destructive : colors.foreground }]}>
                {formatCurrency(projectedTotal)}
              </Text>
              <Feather name="activity" size={16} color={colors.mutedForeground} />
            </View>
          )}
        </View>

        {/* Category Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {period === 'month' ? 'Monthly' : 'Weekly'} Breakdown
        </Text>

        {sortedCategories.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Feather name="bar-chart-2" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No expenses tracked {period === 'week' ? 'this week' : 'this month'} yet.
            </Text>
          </View>
        ) : (
          <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            {sortedCategories.map(([cat, amount], idx) => {
              const info = CATEGORY_INFO[cat as Category];
              const barWidth = maxCat > 0 ? (amount / maxCat) * 100 : 0;
              const pct = activeTotal > 0 ? Math.round((amount / activeTotal) * 100) : 0;
              return (
                <View key={cat} style={[styles.catRow, idx < sortedCategories.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <View style={styles.catLeft}>
                    <Text style={{ fontSize: 20 }}>{info?.emoji ?? '💸'}</Text>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={styles.catTopRow}>
                        <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                        <Text style={[styles.catAmount, { color: colors.foreground }]}>
                          {formatCurrencyFull(amount)}
                        </Text>
                      </View>
                      <View style={[styles.catTrack, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.catFill,
                            { backgroundColor: info?.color ?? colors.primary, width: `${barWidth}%` },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={[styles.catPct, { color: info?.color ?? colors.primary }]}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Spending Analysis */}
        {sortedCategories.length > 0 && (
          <View style={[styles.analysisCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <View style={styles.analysisHeader}>
              <View style={[styles.zapIcon, { backgroundColor: colors.primary }]}>
                <Feather name="zap" size={12} color="#fff" />
              </View>
              <Text style={[styles.analysisTitle, { color: colors.foreground }]}>Smart Analysis</Text>
            </View>
            {displayIncome > 0 && monthlyTotal > displayIncome * 0.8 && (
              <View style={[styles.analysisBadge, { backgroundColor: colors.destructive + '15', borderRadius: 10 }]}>
                <Text style={[styles.analysisBadgeText, { color: colors.destructive }]}>
                  You've spent {Math.round((monthlyTotal / displayIncome) * 100)}% of your income this month. Consider reducing expenses.
                </Text>
              </View>
            )}
            {sortedCategories[0] && (
              <View style={[styles.analysisBadge, { backgroundColor: colors.primary + '12', borderRadius: 10 }]}>
                <Text style={[styles.analysisBadgeText, { color: colors.primary }]}>
                  {sortedCategories[0][0]} is your biggest expense category at {Math.round((sortedCategories[0][1] / activeTotal) * 100)}% of spending.
                </Text>
              </View>
            )}
            {savingsRate > 20 && (
              <View style={[styles.analysisBadge, { backgroundColor: colors.success + '15', borderRadius: 10 }]}>
                <Text style={[styles.analysisBadgeText, { color: colors.success }]}>
                  Great work! You're saving {Math.round(savingsRate)}% of your income this month.
                </Text>
              </View>
            )}
            {activeExpenses.length < 3 && (
              <View style={[styles.analysisBadge, { backgroundColor: colors.warning + '15', borderRadius: 10 }]}>
                <Text style={[styles.analysisBadgeText, { color: colors.warning }]}>
                  Log more expenses for accurate insights. Go to Chat and try "Tea 30".
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '800' },
  toggle: { flexDirection: 'row', padding: 3 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  toggleText: { fontSize: 13, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: {
    flex: 1, padding: 16, gap: 6,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  summaryCardLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  summaryCardValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 14, marginBottom: 12 },
  emptyCard: { padding: 28, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  breakdownCard: {
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  catRow: { padding: 14 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 14, fontWeight: '600' },
  catAmount: { fontSize: 14, fontWeight: '700' },
  catTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  analysisCard: {
    marginTop: 16, padding: 16, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  zapIcon: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  analysisTitle: { fontSize: 15, fontWeight: '700' },
  analysisBadge: { padding: 12 },
  analysisBadgeText: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
});
