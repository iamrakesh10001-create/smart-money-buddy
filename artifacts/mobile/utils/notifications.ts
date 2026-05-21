import { Platform } from 'react-native';

let Notifications: any = null;

async function getNotifications() {
  if (Notifications) return Notifications;
  if (Platform.OS === 'web') return null;
  try {
    Notifications = await import('expo-notifications');
    return Notifications;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const notifs = await getNotifications();
  if (!notifs) return false;
  try {
    const { status: existing } = await notifs.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await notifs.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleExpenseReminder(): Promise<void> {
  const notifs = await getNotifications();
  if (!notifs) return;
  try {
    await notifs.cancelAllScheduledNotificationsAsync();
    // Daily evening reminder at 9 PM
    await notifs.scheduleNotificationAsync({
      content: {
        title: '💸 Log today\'s expenses',
        body: 'Don\'t forget to track what you spent today. Tap to open.',
        sound: true,
      },
      trigger: {
        type: notifs.SchedulableTriggerInputTypes?.CALENDAR ?? 'calendar',
        hour: 21,
        minute: 0,
        repeats: true,
      },
    });
    // Morning motivation at 8 AM
    await notifs.scheduleNotificationAsync({
      content: {
        title: '☀️ Good morning, money master!',
        body: 'Start your day with financial awareness. Check your budget.',
        sound: false,
      },
      trigger: {
        type: notifs.SchedulableTriggerInputTypes?.CALENDAR ?? 'calendar',
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
  } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  const notifs = await getNotifications();
  if (!notifs) return;
  try {
    await notifs.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function sendImmediateNotification(title: string, body: string): Promise<void> {
  const notifs = await getNotifications();
  if (!notifs) return;
  try {
    await notifs.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {}
}

export async function setupNotificationHandler(): Promise<void> {
  const notifs = await getNotifications();
  if (!notifs) return;
  try {
    notifs.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {}
}

export async function scheduleGoalMilestoneNotif(goalName: string, percent: number): Promise<void> {
  const notifs = await getNotifications();
  if (!notifs) return;
  if (percent < 25) return;
  const milestones: Record<number, string> = {
    25: '25% of the way there',
    50: 'Halfway there',
    75: '75% complete',
    100: 'Goal achieved! 🎉',
  };
  const msg = milestones[Math.floor(percent / 25) * 25];
  if (!msg) return;
  try {
    await notifs.scheduleNotificationAsync({
      content: {
        title: `🎯 ${goalName}`,
        body: `${msg} — keep going!`,
        sound: true,
      },
      trigger: null,
    });
  } catch {}
}
