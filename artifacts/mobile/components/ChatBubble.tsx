import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@/types';
import { useColors } from '@/hooks/useColors';
import { CATEGORY_INFO } from '@/utils/categories';

interface Props {
  message: ChatMessage;
}

export function ChatBubble({ message }: Props) {
  const colors = useColors();
  const isUser = message.isUser;

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderRadius: colors.radius,
            borderBottomRightRadius: isUser ? 4 : colors.radius,
            borderBottomLeftRadius: isUser ? colors.radius : 4,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.text}
        </Text>
        {message.expense && (
          <View style={[styles.chip, { backgroundColor: colors.success + '25' }]}>
            <Text style={[styles.chipText, { color: colors.success }]}>
              {CATEGORY_INFO[message.expense.category].emoji}{' '}
              {message.expense.category} · ₹{message.expense.amount.toLocaleString('en-IN')}
            </Text>
          </View>
        )}
        <Text
          style={[
            styles.time,
            {
              color: isUser
                ? colors.primaryForeground + '80'
                : colors.mutedForeground,
              textAlign: isUser ? 'right' : 'left',
            },
          ]}
        >
          {new Date(message.createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 3, paddingHorizontal: 16 },
  rowLeft: { alignItems: 'flex-start' },
  rowRight: { alignItems: 'flex-end' },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    maxWidth: '82%',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  text: { fontSize: 15, lineHeight: 22 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  time: { fontSize: 10 },
});
