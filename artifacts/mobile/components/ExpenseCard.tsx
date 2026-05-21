import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Expense } from '@/types';
import { useColors } from '@/hooks/useColors';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrencyFull, formatDate } from '@/utils/format';

interface Props {
  expense: Expense;
  onDelete?: (id: string) => void;
}

export function ExpenseCard({ expense, onDelete }: Props) {
  const colors = useColors();
  const isIncome = expense.type === 'income';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderRadius: colors.radius },
      ]}
    >
      <CategoryIcon category={expense.category} />
      <View style={styles.info}>
        <Text style={[styles.merchant, { color: colors.foreground }]} numberOfLines={1}>
          {expense.merchant}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {expense.category} · {formatDate(expense.createdAt)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? colors.success : colors.foreground },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCurrencyFull(expense.amount)}
        </Text>
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(expense.id)} hitSlop={8}>
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  info: { flex: 1 },
  merchant: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  meta: { fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 15, fontWeight: '700' },
});
