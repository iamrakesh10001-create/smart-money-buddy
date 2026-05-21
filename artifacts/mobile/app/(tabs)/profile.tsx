import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Platform, Modal, TextInput, KeyboardAvoidingView, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useGoals } from '@/contexts/GoalContext';
import { formatCurrency } from '@/utils/format';
import { Storage } from '@/utils/storage';
import { ThemePreference } from '@/types';
import { requestNotificationPermission, scheduleExpenseReminder, cancelAllNotifications } from '@/utils/notifications';

interface SettingRowProps {
  icon: string; label: string; value?: string;
  onPress?: () => void; danger?: boolean; rightElement?: React.ReactNode;
}

function SettingRow({ icon, label, value, onPress, danger, rightElement }: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? colors.destructive + '18' : colors.secondary }]}>
        <Feather name={icon as any} size={16} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
      </View>
    </TouchableOpacity>
  );
}

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: string }[] = [
  { key: 'light', label: 'Light', icon: 'sun' },
  { key: 'dark', label: 'Dark', icon: 'moon' },
  { key: 'system', label: 'System', icon: 'smartphone' },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const { expenses, monthlyTotal, monthlyIncome } = useExpenses();
  const { goals } = useGoals();

  const [showEditFinancial, setShowEditFinancial] = useState(false);
  const [editIncome, setEditIncome] = useState(String(user?.monthlyIncome ?? ''));
  const [editTarget, setEditTarget] = useState(String(user?.monthlyTarget ?? ''));
  const [editSalaryDate, setEditSalaryDate] = useState(String(user?.salaryDate ?? ''));
  const [notifsEnabled, setNotifsEnabled] = useState(false);

  React.useEffect(() => {
    Storage.getNotificationsEnabled().then(setNotifsEnabled);
  }, []);

  const handleToggleNotifications = async () => {
    if (!notifsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleExpenseReminder();
        await Storage.setNotificationsEnabled(true);
        setNotifsEnabled(true);
        haptic();
      } else if (Platform.OS !== 'web') {
        Alert.alert('Permission needed', 'Please enable notifications in your device settings.');
      }
    } else {
      await cancelAllNotifications();
      await Storage.setNotificationsEnabled(false);
      setNotifsEnabled(false);
    }
  };

  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 80;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const displayIncome = monthlyIncome || (user?.monthlyIncome ?? 0);
  const savedThisMonth = Math.max(0, displayIncome - monthlyTotal);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const initials = (user?.name ?? 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };

  const handleSaveFinancial = async () => {
    const income = parseFloat(editIncome.replace(/,/g, '')) || 0;
    const target = parseFloat(editTarget.replace(/,/g, '')) || 0;
    const salaryDate = parseInt(editSalaryDate) || 1;
    await updateProfile({ monthlyIncome: income, monthlyTarget: target, salaryDate: Math.min(28, Math.max(1, salaryDate)) });
    haptic();
    setShowEditFinancial(false);
  };

  const handleExport = async () => {
    try {
      const data = await Storage.exportAll();
      const json = JSON.stringify(data, null, 2);

      // Build a human-readable CSV summary too
      const csvRows = ['Date,Merchant,Category,Type,Amount'];
      data.expenses.forEach(e => {
        csvRows.push(`${e.createdAt.slice(0, 10)},${e.merchant},${e.category},${e.type},${e.amount}`);
      });
      const csv = csvRows.join('\n');

      const message = `Smart Money Buddy Export\n\nSummary:\n• ${data.expenses.length} transactions\n• ${data.goals.length} goals\n• Exported: ${new Date().toLocaleDateString('en-IN')}\n\n--- CSV ---\n${csv}\n\n--- JSON ---\n${json}`;

      await Share.share({ message, title: 'Smart Money Buddy Export' });
    } catch {
      if (Platform.OS !== 'web') Alert.alert('Export failed', 'Could not export data.');
    }
  };

  const handleEraseData = () => {
    const confirm = () => {
      Storage.clearAll().then(() => {
        logout().then(() => router.replace('/(auth)/login'));
      });
    };
    if (Platform.OS === 'web') { confirm(); return; }
    Alert.alert(
      '⚠️ Erase All Data',
      'This will permanently delete ALL your expenses, goals, and profile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase Everything', style: 'destructive', onPress: confirm },
      ]
    );
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') { logout().then(() => router.replace('/(auth)/login')); return; }
    Alert.alert('Log Out', 'Your data will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout().then(() => router.replace('/(auth)/login')) },
    ]);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      {/* Avatar + Name */}
      <View style={[styles.avatarCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name ?? 'User'}</Text>
        {user?.primaryGoal ? (
          <Text style={[styles.userGoal, { color: colors.mutedForeground }]}>Goal: {user.primaryGoal}</Text>
        ) : null}
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{expenses.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Logged</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{formatCurrency(savedThisMonth)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Saved</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{goals.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Goals</Text>
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>APPEARANCE</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="eye" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Theme</Text>
            <View style={styles.themeToggle}>
              {THEME_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themeBtn,
                    theme === opt.key && { backgroundColor: colors.primary, borderRadius: 8 },
                  ]}
                  onPress={() => { setTheme(opt.key); haptic(); }}
                >
                  <Feather name={opt.icon as any} size={14} color={theme === opt.key ? '#fff' : colors.mutedForeground} />
                  <Text style={[styles.themeBtnText, { color: theme === opt.key ? '#fff' : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Financial Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FINANCIAL INFO</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow icon="dollar-sign" label="Monthly Income" value={user?.monthlyIncome ? formatCurrency(user.monthlyIncome) : 'Not set'} />
          <SettingRow icon="calendar" label="Salary Date" value={user?.salaryDate ? `${user.salaryDate}th of month` : 'Not set'} />
          <SettingRow icon="target" label="Monthly Budget" value={user?.monthlyTarget ? formatCurrency(user.monthlyTarget) : 'Not set'} />
          <SettingRow
            icon="edit-2"
            label="Edit Financial Info"
            onPress={() => {
              setEditIncome(String(user?.monthlyIncome ?? ''));
              setEditTarget(String(user?.monthlyTarget ?? ''));
              setEditSalaryDate(String(user?.salaryDate ?? ''));
              setShowEditFinancial(true);
            }}
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>NOTIFICATIONS</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow
            icon="bell"
            label="Daily Reminders"
            value={notifsEnabled ? 'On' : 'Off'}
            onPress={handleToggleNotifications}
            rightElement={
              <View style={[styles.pill, { backgroundColor: notifsEnabled ? colors.success : colors.border }]}>
                <Text style={[styles.pillText, { color: notifsEnabled ? '#fff' : colors.mutedForeground }]}>
                  {notifsEnabled ? 'ON' : 'OFF'}
                </Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DATA</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow icon="download" label="Export Data" value="Share as CSV / JSON" onPress={handleExport} />
        </View>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>LEGAL</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow icon="file-text" label="Privacy Policy" onPress={() => {}} />
          <SettingRow icon="file-text" label="Terms of Service" onPress={() => {}} />
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow icon="log-out" label="Log Out" onPress={handleLogout} danger />
          <SettingRow icon="trash-2" label="Erase All Data" onPress={handleEraseData} danger />
        </View>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>Smart Money Buddy · v1.0.0</Text>

      {/* Edit Financial Info Modal */}
      <Modal visible={showEditFinancial} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.editModal, { backgroundColor: colors.background }]}>
            <View style={styles.editHeader}>
              <Text style={[styles.editTitle, { color: colors.foreground }]}>Edit Financial Info</Text>
              <TouchableOpacity onPress={() => setShowEditFinancial(false)} hitSlop={10}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>MONTHLY INCOME (₹)</Text>
            <View style={[styles.editInputWrap, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 12 }]}>
              <Text style={[styles.rupee, { color: colors.primary }]}>₹</Text>
              <TextInput
                style={[styles.editInput, { color: colors.foreground }]}
                placeholder="45,000" placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric" value={editIncome}
                onChangeText={setEditIncome}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>MONTHLY BUDGET / SPENDING TARGET (₹)</Text>
            <View style={[styles.editInputWrap, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 12 }]}>
              <Text style={[styles.rupee, { color: colors.primary }]}>₹</Text>
              <TextInput
                style={[styles.editInput, { color: colors.foreground }]}
                placeholder="30,000" placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric" value={editTarget}
                onChangeText={setEditTarget}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>SALARY DATE (day of month 1–28)</Text>
            <View style={[styles.editInputWrap, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 12 }]}>
              <Feather name="calendar" size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.editInput, { color: colors.foreground }]}
                placeholder="1" placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric" value={editSalaryDate}
                onChangeText={setEditSalaryDate}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              onPress={handleSaveFinancial}
            >
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  avatarCard: { margin: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  userGoal: { fontSize: 13 },
  statsRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 20, paddingTop: 16, width: '100%', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, height: '100%' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  settingsCard: { overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  settingIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13 },
  themeToggle: { flexDirection: 'row', gap: 4 },
  themeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  themeBtnText: { fontSize: 12, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, paddingVertical: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: '700' },
  editModal: { flex: 1, padding: 20 },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingTop: 20 },
  editTitle: { fontSize: 22, fontWeight: '800' },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 20 },
  editInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 14 },
  rupee: { fontSize: 18, fontWeight: '700', marginRight: 6 },
  editInput: { flex: 1, fontSize: 16, fontWeight: '600' },
  saveBtn: { height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
