import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Goal } from '@/types';
import { useColors } from '@/hooks/useColors';
import { formatCurrencyFull } from '@/utils/format';

interface Props {
  goal: Goal;
  onContribute?: (id: string) => void;
  onDeduct?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function GoalProgressCard({ goal, onContribute, onDeduct, onDelete }: Props) {
  const colors = useColors();
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = goal.targetAmount - goal.currentAmount;
  const isComplete = progress >= 100;

  let daysLeft: number | null = null;
  if (goal.deadline) {
    const diff = new Date(goal.deadline).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diff / 86400000));
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{goal.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {goal.name}
            </Text>
            {daysLeft !== null && (
              <Text style={[styles.deadline, { color: colors.mutedForeground }]}>
                {isComplete ? 'Goal reached! 🎉' : `${daysLeft}d remaining`}
              </Text>
            )}
          </View>
          {isComplete && <Feather name="check-circle" size={20} color={colors.success} />}
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(goal.id)} hitSlop={8}>
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.amounts}>
          <Text style={[styles.current, { color: goal.color }]}>
            {formatCurrencyFull(goal.currentAmount)}
          </Text>
          <Text style={[styles.target, { color: colors.mutedForeground }]}>
            {' '}/ {formatCurrencyFull(goal.targetAmount)}
          </Text>
        </View>
      </View>

      <View style={[styles.trackBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fillBar,
            {
              backgroundColor: isComplete ? colors.success : goal.color,
              width: `${Math.min(100, progress)}%`,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.percent, { color: isComplete ? colors.success : goal.color }]}>
          {Math.round(progress)}% saved
        </Text>
        {!isComplete && (
          <Text style={[styles.remaining, { color: colors.mutedForeground }]} numberOfLines={1}>
            {formatCurrencyFull(remaining)} to go
          </Text>
        )}
        {!isComplete && onDeduct && goal.currentAmount > 0 && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.border }]}
            onPress={() => onDeduct(goal.id)}
          >
            <Feather name="minus" size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        {!isComplete && onContribute && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: goal.color }]}
            onPress={() => onContribute(goal.id)}
          >
            <Feather name="plus" size={13} color="#fff" />
            <Text style={styles.actionBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  header: { marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  icon: { fontSize: 26 },
  name: { fontSize: 16, fontWeight: '700' },
  deadline: { fontSize: 12, marginTop: 1 },
  amounts: { flexDirection: 'row', alignItems: 'baseline' },
  current: { fontSize: 22, fontWeight: '800' },
  target: { fontSize: 14 },
  trackBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  fillBar: { height: '100%', borderRadius: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  percent: { fontSize: 13, fontWeight: '700' },
  remaining: { flex: 1, fontSize: 12, textAlign: 'right' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
