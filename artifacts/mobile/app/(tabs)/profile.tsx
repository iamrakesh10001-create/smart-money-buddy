import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useGoals } from '@/contexts/GoalContext';
import { formatCurrency } from '@/utils/format';

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}

function SettingRow({ icon, label, value, onPress, danger, rightElement }: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? colors.destructive + '15' : colors.secondary }]}>
        <Feather name={icon as any} size={16} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: danger ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value && <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && (
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { expenses, monthlyTotal, monthlyIncome } = useExpenses();
  const { goals } = useGoals();

  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 80;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const displayIncome = monthlyIncome || (user?.monthlyIncome ?? 0);
  const savedThisMonth = Math.max(0, displayIncome - monthlyTotal);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout().then(() => router.replace('/(auth)/login'));
      return;
    }
    Alert.alert('Log Out', 'Are you sure you want to log out? Your data will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout().then(() => router.replace('/(auth)/login')),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      logout().then(() => router.replace('/(auth)/login'));
      return;
    }
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => logout().then(() => router.replace('/(auth)/login')),
        },
      ]
    );
  };

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 20, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      {/* Avatar + Name */}
      <View style={[styles.avatarCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name ?? 'User'}</Text>
        {user?.primaryGoal ? (
          <Text style={[styles.userGoal, { color: colors.mutedForeground }]}>
            Goal: {user.primaryGoal}
          </Text>
        ) : null}

        {/* Stats row */}
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

      {/* Financial Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FINANCIAL INFO</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow
            icon="dollar-sign"
            label="Monthly Income"
            value={user?.monthlyIncome ? formatCurrency(user.monthlyIncome) : 'Not set'}
          />
          <SettingRow
            icon="calendar"
            label="Salary Date"
            value={user?.salaryDate ? `${user.salaryDate}th of month` : 'Not set'}
          />
          <SettingRow
            icon="target"
            label="Monthly Target"
            value={user?.monthlyTarget ? formatCurrency(user.monthlyTarget) : 'Not set'}
          />
          <SettingRow
            icon="award"
            label="Primary Category"
            value={user?.primaryCategory ?? 'Not set'}
          />
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SETTINGS</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow
            icon="bell"
            label="Notifications"
            value="Coming soon"
          />
          <SettingRow
            icon="download"
            label="Export Data"
            value="CSV / JSON"
            onPress={() => {
              if (Platform.OS !== 'web') {
                Alert.alert('Export', 'Export feature coming in the next update!');
              }
            }}
          />
          <SettingRow
            icon="shield"
            label="Privacy & Security"
            onPress={() => {}}
          />
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
          <SettingRow icon="trash-2" label="Delete Account" onPress={handleDeleteAccount} danger />
        </View>
      </View>

      {/* Version */}
      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        Smart Money Buddy · v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  avatarCard: {
    margin: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
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
  settingsCard: {
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13 },
  version: { textAlign: 'center', fontSize: 12, paddingVertical: 8 },
});
