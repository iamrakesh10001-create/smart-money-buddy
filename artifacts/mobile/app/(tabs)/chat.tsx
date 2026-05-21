import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useExpenses } from '@/contexts/ExpenseContext';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatMessage } from '@/types';
import { parseExpenseMessage, QUICK_SUGGESTIONS } from '@/utils/expenseParser';
import { generateId } from '@/utils/format';
import { Storage } from '@/utils/storage';

const WELCOME: ChatMessage = {
  id: 'welcome',
  text: 'Hey! Just type what you spent and I\'ll track it instantly.\n\nTry: "Coffee 60" or "Uber 150" or "Salary 45000"',
  isUser: false,
  createdAt: new Date().toISOString(),
};

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addExpense } = useExpenses();

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Storage.getChatHistory().then(saved => {
      if (saved.length > 0) {
        setMessages([...saved, WELCOME].slice(0, 100));
      }
    });
  }, []);

  const saveHistory = useCallback((msgs: ChatMessage[]) => {
    const toSave = msgs.filter(m => m.id !== 'welcome').slice(0, 80);
    Storage.setChatHistory(toSave);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: generateId(),
      text: trimmed,
      isUser: true,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [userMsg, ...prev]);
    setIsProcessing(true);

    await new Promise(r => setTimeout(r, 400));

    const result = parseExpenseMessage(trimmed);

    if (result.success && result.expense) {
      await addExpense(result.expense);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    const botMsg: ChatMessage = {
      id: generateId(),
      text: result.message,
      isUser: false,
      expense: result.expense,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => {
      const updated = [botMsg, ...prev];
      saveHistory(updated);
      return updated;
    });

    setIsProcessing(false);
  }, [isProcessing, addExpense, saveHistory]);

  const handleSend = () => sendMessage(input);
  const handleSuggestion = (s: string) => sendMessage(s);

  const clearHistory = () => {
    setMessages([WELCOME]);
    Storage.setChatHistory([]);
  };

  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 80;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Money Chat</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Type to log expenses instantly
          </Text>
        </View>
        <TouchableOpacity onPress={clearHistory} hitSlop={10}>
          <Feather name="trash-2" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Quick suggestions */}
        <FlatList
          data={QUICK_SUGGESTIONS}
          horizontal
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestions}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, { backgroundColor: colors.secondary, borderRadius: 20 }]}
              onPress={() => handleSuggestion(item)}
            >
              <Text style={[styles.chipText, { color: colors.primary }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          inverted
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: 8,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListHeaderComponent={
            isProcessing ? (
              <View style={styles.typingRow}>
                <View style={[styles.typingBubble, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.typingText, { color: colors.mutedForeground }]}>Logging...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: TAB_BAR_HEIGHT + insets.bottom,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: 26,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: colors.foreground }]}
              placeholder='e.g. "Swiggy 280"'
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline={false}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: input.trim() ? colors.primary : colors.muted,
                },
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isProcessing}
            >
              <Feather name="send" size={16} color={input.trim() ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 1 },
  suggestions: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 13, fontWeight: '600' },
  typingRow: { alignItems: 'flex-start', paddingHorizontal: 16, marginBottom: 6 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: { fontSize: 13 },
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  textInput: { flex: 1, fontSize: 15, maxHeight: 80 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
