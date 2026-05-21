import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatCurrencyFull } from '@/utils/format';
import { CATEGORY_INFO } from '@/utils/categories';
import { Category, Expense } from '@/types';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'custom';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfQuarter(d: Date) {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1);
}

function filterByPeriod(expenses: Expense[], period: Period, customDate?: Date): Expense[] {
  const now = new Date();
  const ref = customDate ?? now;
  let from: Date;
  let to: Date;

  if (period === 'day') {
    from = startOfDay(ref);
    to = new Date(from.getTime() + 86400000);
  } else if (period === 'week') {
    from = startOfWeek(ref);
    to = new Date(from.getTime() + 7 * 86400000);
  } else if (period === 'month') {
    from = startOfMonth(ref);
    to = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  } else if (period === 'quarter') {
    from = startOfQuarter(ref);
    to = new Date(from.getFullYear(), from.getMonth() + 3, 1);
  } else {
    from = startOfDay(ref);
    to = new Date(from.getTime() + 86400000);
  }

  return expenses.filter(e => {
    const d = new Date(e.createdAt);
    return d >= from && d < to;
  });
}

function periodLabel(period: Period, customDate?: Date): string {
  const ref = customDate ?? new Date();
  if (period === 'day') return ref.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  if (period === 'week') {
    const s = startOfWeek(ref);
    const e = new Date(s.getTime() + 6 * 86400000);
    return `${s.getDate()} ${s.toLocaleString('en-IN', { month: 'short' })} – ${e.getDate()} ${e.toLocaleString('en-IN', { month: 'short' })}`;
  }
  if (period === 'month') return ref.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  if (period === 'quarter') {
    const q = Math.floor(ref.getMonth() / 3) + 1;
    return `Q${q} ${ref.getFullYear()}`;
  }
  return ref.toLocaleDateString('en-IN');
}

function navigatePeriod(period: Period, date: Date, dir: -1 | 1): Date {
  const d = new Date(date);
  if (period === 'day') d.setDate(d.getDate() + dir);
  else if (period === 'week') d.setDate(d.getDate() + dir * 7);
  else if (period === 'month') d.setMonth(d.getMonth() + dir);
  else if (period === 'quarter') d.setMonth(d.getMonth() + dir * 3);
  return d;
}

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
];

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses } = useExpenses();
  const { user } = useAuth();

  const [period, setPeriod] = useState<Period>('month');
  const [refDate, setRefDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 80;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const periodExpenses = useMemo(
    () => filterByPeriod(expenses, period, refDate),
    [expenses, period, refDate]
  );

  const expenseItems = periodExpenses.filter(e => e.type === 'expense');
  const incomeItems = periodExpenses.filter(e => e.type === 'income');
  const totalSpent = expenseItems.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomeItems.reduce((s, e) => s + e.amount, 0);
  const displayIncome = totalIncome || (user?.monthlyIncome ?? 0);
  const netBalance = totalIncome - totalSpent;
  const savingsRate = displayIncome > 0 ? Math.max(0, (netBalance / displayIncome) * 100) : 0;

  const categoryTotals: Record<string, number> = {};
  expenseItems.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount; });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const maxCat = sortedCategories[0]?.[1] ?? 1;

  const txnCount = periodExpenses.length;
  const avgTx = txnCount > 0 ? totalSpent / expenseItems.length || 0 : 0;

  const isToday = period === 'day' &&
    startOfDay(refDate).getTime() === startOfDay(new Date()).getTime();
  const isCurrentPeriod = () => {
    const now = new Date();
    if (period === 'month') return refDate.getMonth() === now.getMonth() && refDate.getFullYear() === now.getFullYear();
    if (period === 'quarter') return Math.floor(refDate.getMonth() / 3) === Math.floor(now.getMonth() / 3) && refDate.getFullYear() === now.getFullYear();
    if (period === 'week') return startOfWeek(refDate).getTime() === startOfWeek(now).getTime();
    return isToday;
  };

  const goNext = () => { if (!isCurrentPeriod()) setRefDate(navigatePeriod(period, refDate, 1)); };
  const goPrev = () => setRefDate(navigatePeriod(period, refDate, -1));

  // Generate calendar dates for date picker
  const calYear = refDate.getFullYear();
  const calMonth = refDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const calDays = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDayOfMonth + 1;
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null;
  });

  const hasDataForDay = (d: number) => {
    const start = new Date(calYear, calMonth, d);
    const end = new Date(calYear, calMonth, d + 1);
    return expenses.some(e => { const dt = new Date(e.createdAt); return dt >= start && dt < end; });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Insights</Text>
        <TouchableOpacity
          style={[styles.calBtn, { backgroundColor: colors.secondary, borderRadius: 10 }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Feather name="calendar" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Period Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.secondary, borderRadius: 14, marginHorizontal: 16 }]}>
        {PERIOD_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, period === t.key && { backgroundColor: colors.primary, borderRadius: 11 }]}
            onPress={() => { setPeriod(t.key); setRefDate(new Date()); }}
          >
            <Text style={[styles.tabText, { color: period === t.key ? '#fff' : colors.mutedForeground }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period Navigator */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={goPrev}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navLabel, { color: colors.foreground }]}>{periodLabel(period, refDate)}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={goNext} disabled={isCurrentPeriod()}>
          <Feather name="chevron-right" size={20} color={isCurrentPeriod() ? colors.border : colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Grid */}
        <View style={styles.grid}>
          <View style={[styles.gridCard, { backgroundColor: colors.primary, borderRadius: colors.radius, flex: 1.3 }]}>
            <Text style={styles.gridLabel}>Total Spent</Text>
            <Text style={styles.gridValue}>{formatCurrency(totalSpent)}</Text>
            <Feather name="trending-down" size={14} color="rgba(255,255,255,0.6)" />
          </View>
          <View style={styles.gridCol}>
            <View style={[styles.gridSmall, { backgroundColor: totalIncome > 0 ? colors.success : colors.card, borderRadius: 12 }]}>
              <Text style={[styles.gridSmallLabel, { color: totalIncome > 0 ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>Income</Text>
              <Text style={[styles.gridSmallValue, { color: totalIncome > 0 ? '#fff' : colors.foreground }]}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={[styles.gridSmall, { backgroundColor: netBalance >= 0 ? colors.card : colors.destructive + '20', borderRadius: 12 }]}>
              <Text style={[styles.gridSmallLabel, { color: colors.mutedForeground }]}>Net</Text>
              <Text style={[styles.gridSmallValue, { color: netBalance >= 0 ? colors.success : colors.destructive }]}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <View style={styles.statItem}>
            <Feather name="hash" size={14} color={colors.mutedForeground} />
            <Text style={[styles.statVal, { color: colors.foreground }]}>{txnCount}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Transactions</Text>
          </View>
          <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Feather name="bar-chart" size={14} color={colors.mutedForeground} />
            <Text style={[styles.statVal, { color: colors.foreground }]}>{formatCurrency(avgTx)}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Avg per txn</Text>
          </View>
          <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Feather name="percent" size={14} color={colors.mutedForeground} />
            <Text style={[styles.statVal, { color: savingsRate > 20 ? colors.success : colors.foreground }]}>
              {Math.round(savingsRate)}%
            </Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Saved</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Category Breakdown</Text>

        {sortedCategories.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Feather name="bar-chart-2" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No expenses for this period.
            </Text>
          </View>
        ) : (
          <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            {sortedCategories.map(([cat, amount], idx) => {
              const info = CATEGORY_INFO[cat as Category];
              const barWidth = maxCat > 0 ? (amount / maxCat) * 100 : 0;
              const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
              return (
                <View key={cat} style={[styles.catRow, idx < sortedCategories.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <Text style={{ fontSize: 20, width: 28 }}>{info?.emoji ?? '💸'}</Text>
                  <View style={{ flex: 1, gap: 5 }}>
                    <View style={styles.catTopRow}>
                      <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                      <Text style={[styles.catAmount, { color: colors.foreground }]}>{formatCurrencyFull(amount)}</Text>
                    </View>
                    <View style={[styles.catTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.catFill, { backgroundColor: info?.color ?? colors.primary, width: `${barWidth}%` }]} />
                    </View>
                  </View>
                  <Text style={[styles.catPct, { color: info?.color ?? colors.primary }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Transactions for this period */}
        {periodExpenses.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transactions ({txnCount})</Text>
            <View style={[styles.txnCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              {periodExpenses.slice(0, 20).map((e, idx) => {
                const info = CATEGORY_INFO[e.category];
                const isIncome = e.type === 'income';
                return (
                  <View key={e.id} style={[styles.txnRow, idx < Math.min(periodExpenses.length, 20) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <View style={[styles.txnDot, { backgroundColor: info?.color ?? colors.primary }]}>
                      <Text style={{ fontSize: 12 }}>{info?.emoji ?? '💸'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txnMerchant, { color: colors.foreground }]}>{e.merchant}</Text>
                      <Text style={[styles.txnCat, { color: colors.mutedForeground }]}>
                        {e.category} · {new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <Text style={[styles.txnAmount, { color: isIncome ? colors.success : colors.foreground }]}>
                      {isIncome ? '+' : '-'}{formatCurrencyFull(e.amount)}
                    </Text>
                  </View>
                );
              })}
              {periodExpenses.length > 20 && (
                <View style={styles.moreRow}>
                  <Text style={[styles.moreText, { color: colors.mutedForeground }]}>+ {periodExpenses.length - 20} more transactions</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Smart Analysis */}
        {expenseItems.length > 0 && (
          <View style={[styles.analysisCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <View style={styles.analysisHeader}>
              <View style={[styles.zapIcon, { backgroundColor: colors.primary }]}>
                <Feather name="zap" size={12} color="#fff" />
              </View>
              <Text style={[styles.analysisTitle, { color: colors.foreground }]}>Smart Analysis</Text>
            </View>
            {displayIncome > 0 && totalSpent > displayIncome * 0.8 && period === 'month' && (
              <View style={[styles.badge, { backgroundColor: colors.destructive + '15', borderRadius: 10 }]}>
                <Text style={[styles.badgeText, { color: colors.destructive }]}>
                  ⚠️ You've spent {Math.round((totalSpent / displayIncome) * 100)}% of your income this period.
                </Text>
              </View>
            )}
            {sortedCategories[0] && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '12', borderRadius: 10 }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  📊 {sortedCategories[0][0]} is your top category at {Math.round((sortedCategories[0][1] / totalSpent) * 100)}%.
                </Text>
              </View>
            )}
            {savingsRate > 20 && displayIncome > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.success + '15', borderRadius: 10 }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>
                  🎉 You're saving {Math.round(savingsRate)}% — great discipline!
                </Text>
              </View>
            )}
            {txnCount > 10 && (
              <View style={[styles.badge, { backgroundColor: colors.warning + '15', borderRadius: 10 }]}>
                <Text style={[styles.badgeText, { color: colors.warning }]}>
                  {`📝 Avg transaction is ${formatCurrency(avgTx)}. ${avgTx > 500 ? 'Consider smaller purchases.' : "You're tracking small expenses well!"}`}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Calendar Date Picker Modal */}
      <Modal visible={showDatePicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.calModal, { backgroundColor: colors.background }]}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={() => {
              const d = new Date(calYear, calMonth - 1, 1);
              setRefDate(d);
            }}>
              <Feather name="chevron-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.calTitle, { color: colors.foreground }]}>
              {new Date(calYear, calMonth).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => {
              const d = new Date(calYear, calMonth + 1, 1);
              if (d <= new Date()) setRefDate(d);
            }}>
              <Feather name="chevron-right" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={styles.calWeekRow}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <Text key={d} style={[styles.calWeekDay, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {calDays.map((day, i) => {
              if (!day) return <View key={i} style={styles.calCell} />;
              const isSelected = day === refDate.getDate() && calMonth === refDate.getMonth() && calYear === refDate.getFullYear();
              const hasData = hasDataForDay(day);
              const isFuture = new Date(calYear, calMonth, day) > new Date();
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.calCell, isSelected && { backgroundColor: colors.primary, borderRadius: 20 }]}
                  onPress={() => {
                    if (!isFuture) {
                      setRefDate(new Date(calYear, calMonth, day));
                      setPeriod('day');
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={isFuture}
                >
                  <Text style={[styles.calDay, { color: isFuture ? colors.border : isSelected ? '#fff' : colors.foreground }]}>
                    {day}
                  </Text>
                  {hasData && !isSelected && (
                    <View style={[styles.calDot, { backgroundColor: colors.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.calFooter}>
            <TouchableOpacity
              style={[styles.calCloseBtn, { backgroundColor: colors.card, borderRadius: 12 }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={[styles.calCloseTxt, { color: colors.foreground }]}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.calCloseBtn, { backgroundColor: colors.primary, borderRadius: 12 }]}
              onPress={() => { setRefDate(new Date()); setShowDatePicker(false); }}
            >
              <Text style={[styles.calCloseTxt, { color: '#fff' }]}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  calBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', padding: 4, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '700' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 15, fontWeight: '700' },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gridCard: { padding: 16, gap: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  gridLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  gridValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  gridCol: { flex: 1, gap: 10 },
  gridSmall: { flex: 1, padding: 12, gap: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  gridSmallLabel: { fontSize: 11, fontWeight: '600' },
  gridSmallValue: { fontSize: 16, fontWeight: '800' },
  statsCard: { flexDirection: 'row', padding: 14, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDiv: { width: 1, height: 36 },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLbl: { fontSize: 10, fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  emptyCard: { padding: 28, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  breakdownCard: { overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  catRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontSize: 14, fontWeight: '600' },
  catAmount: { fontSize: 14, fontWeight: '700' },
  catTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  txnCard: { overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  txnRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  txnDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  txnMerchant: { fontSize: 14, fontWeight: '600' },
  txnCat: { fontSize: 12, marginTop: 1 },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  moreRow: { padding: 12, alignItems: 'center' },
  moreText: { fontSize: 13 },
  analysisCard: { padding: 16, gap: 10, marginTop: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  zapIcon: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  analysisTitle: { fontSize: 15, fontWeight: '700' },
  badge: { padding: 12 },
  badgeText: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  calModal: { flex: 1, padding: 20 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingTop: 20 },
  calTitle: { fontSize: 18, fontWeight: '700' },
  calWeekRow: { flexDirection: 'row', marginBottom: 8 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDay: { fontSize: 15, fontWeight: '500' },
  calDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  calFooter: { flexDirection: 'row', gap: 12, marginTop: 24 },
  calCloseBtn: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  calCloseTxt: { fontSize: 15, fontWeight: '700' },
});
