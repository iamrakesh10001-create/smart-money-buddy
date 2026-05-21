import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useGoals } from '@/contexts/GoalContext';
import { GoalProgressCard } from '@/components/GoalProgressCard';
import { Goal } from '@/types';
import { generateId } from '@/utils/format';
import { GOAL_ICONS, GOAL_COLORS } from '@/utils/categories';

interface NewGoalForm {
  name: string; targetAmount: string; deadline: string; icon: string; color: string;
}
const DEFAULT_FORM: NewGoalForm = { name: '', targetAmount: '', deadline: '', icon: '🎯', color: '#6C47FF' };

type ModalMode = 'add' | 'contribute' | 'deduct';

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, addGoal, deleteGoal, addContribution, deductContribution, isLoading } = useGoals();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<NewGoalForm>(DEFAULT_FORM);
  const [modalMode, setModalMode] = useState<ModalMode>('contribute');
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');

  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 80;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const haptic = () => { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };

  const handleAddGoal = async () => {
    if (!form.name.trim() || !form.targetAmount) return;
    const goal: Goal = {
      id: generateId(), name: form.name.trim(),
      targetAmount: parseFloat(form.targetAmount.replace(/,/g, '')) || 0,
      currentAmount: 0, deadline: form.deadline || undefined,
      icon: form.icon, color: form.color, createdAt: new Date().toISOString(),
    };
    await addGoal(goal);
    haptic();
    setForm(DEFAULT_FORM);
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') { deleteGoal(id); return; }
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  const openContribute = (id: string) => { setActiveGoalId(id); setModalMode('contribute'); setAmountInput(''); };
  const openDeduct = (id: string) => { setActiveGoalId(id); setModalMode('deduct'); setAmountInput(''); };

  const submitAmount = async () => {
    if (!activeGoalId) return;
    const amount = parseFloat(amountInput.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) return;
    if (modalMode === 'contribute') await addContribution(activeGoalId, amount);
    else await deductContribution(activeGoalId, amount);
    haptic();
    setActiveGoalId(null);
    setAmountInput('');
  };

  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);
  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Savings Goals</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {activeGoals.length} active · {completedGoals.length} completed
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: 20 }]}
          onPress={() => setShowAdd(true)}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>New Goal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {goals.length === 0 && !isLoading ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 40 }}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No goals yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Create your first savings goal and watch your progress grow
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              onPress={() => setShowAdd(true)}
            >
              <Text style={styles.emptyBtnText}>Create a Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeGoals.length > 0 && (
              <>
                <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>ACTIVE</Text>
                {activeGoals.map(goal => (
                  <GoalProgressCard
                    key={goal.id} goal={goal}
                    onContribute={openContribute}
                    onDeduct={openDeduct}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}
            {completedGoals.length > 0 && (
              <>
                <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>COMPLETED</Text>
                {completedGoals.map(goal => (
                  <GoalProgressCard key={goal.id} goal={goal} onDelete={handleDelete} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Goal</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} hitSlop={10}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>GOAL NAME</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius }]}
                placeholder="e.g. MacBook, Emergency Fund..." placeholderTextColor={colors.mutedForeground}
                value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))}
              />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TARGET AMOUNT</Text>
              <View style={[styles.amountInput, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <Text style={[styles.rupee, { color: colors.primary }]}>₹</Text>
                <TextInput
                  style={[styles.amountText, { color: colors.foreground }]}
                  placeholder="80,000" placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric" value={form.targetAmount}
                  onChangeText={v => setForm(f => ({ ...f, targetAmount: v }))}
                />
              </View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DEADLINE (optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius }]}
                placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground}
                value={form.deadline} onChangeText={v => setForm(f => ({ ...f, deadline: v }))}
              />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ICON</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={styles.iconRow}>
                  {GOAL_ICONS.map(ic => (
                    <TouchableOpacity key={ic}
                      style={[styles.iconChip, { backgroundColor: form.icon === ic ? colors.primary + '20' : colors.card, borderColor: form.icon === ic ? colors.primary : colors.border, borderRadius: 12 }]}
                      onPress={() => setForm(f => ({ ...f, icon: ic }))}>
                      <Text style={{ fontSize: 22 }}>{ic}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>COLOR</Text>
              <View style={styles.colorRow}>
                {GOAL_COLORS.map(c => (
                  <TouchableOpacity key={c}
                    style={[styles.colorDot, { backgroundColor: c }, form.color === c && styles.colorSelected]}
                    onPress={() => setForm(f => ({ ...f, color: c }))}>
                    {form.color === c && <Feather name="check" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: form.name.trim() && form.targetAmount ? colors.primary : colors.muted, borderRadius: colors.radius }]}
              onPress={handleAddGoal} disabled={!form.name.trim() || !form.targetAmount}>
              <Text style={[styles.createBtnText, { color: form.name.trim() && form.targetAmount ? '#fff' : colors.mutedForeground }]}>
                Create Goal
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add / Deduct Amount Modal */}
      <Modal visible={!!activeGoalId} animationType="fade" transparent>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.contribCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <Text style={[styles.contribTitle, { color: colors.foreground }]}>
                {modalMode === 'contribute' ? '➕ Add Money' : '➖ Withdraw Money'}
              </Text>
              <Text style={[styles.contribSub, { color: colors.mutedForeground }]}>
                {modalMode === 'contribute' ? 'How much are you adding to this goal?' : 'How much do you want to withdraw?'}
              </Text>
              <View style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12 }]}>
                <Text style={[styles.rupee, { color: colors.primary }]}>₹</Text>
                <TextInput
                  style={[styles.amountText, { color: colors.foreground }]}
                  placeholder="1,000" placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric" value={amountInput}
                  onChangeText={setAmountInput} autoFocus
                />
              </View>
              <View style={styles.contribBtns}>
                <TouchableOpacity
                  style={[styles.contribCancel, { borderColor: colors.border, borderRadius: 12 }]}
                  onPress={() => setActiveGoalId(null)}>
                  <Text style={[styles.contribCancelText, { color: colors.foreground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contribAdd, { backgroundColor: modalMode === 'contribute' ? colors.primary : colors.destructive, borderRadius: 12 }]}
                  onPress={submitAmount}>
                  <Text style={styles.contribAddText}>
                    {modalMode === 'contribute' ? 'Add' : 'Withdraw'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyCard: { padding: 32, alignItems: 'center', gap: 12, marginTop: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  modal: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1.5, padding: 14, fontSize: 15, fontWeight: '500' },
  amountInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12 },
  rupee: { fontSize: 18, fontWeight: '700', marginRight: 6 },
  amountText: { flex: 1, fontSize: 18, fontWeight: '600' },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconChip: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 24 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#fff' },
  createBtn: { height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  createBtnText: { fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  contribCard: { padding: 20, gap: 14 },
  contribTitle: { fontSize: 18, fontWeight: '700' },
  contribSub: { fontSize: 13, marginTop: -6 },
  contribBtns: { flexDirection: 'row', gap: 10 },
  contribCancel: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  contribCancelText: { fontSize: 15, fontWeight: '600' },
  contribAdd: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  contribAddText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
