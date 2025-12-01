// Утилита для планирования азан-уведомлений
// Работает с реальными временами намазов

import type { AzanNotificationSettings, PrayerNotificationSettings } from "@/components/prayer-times/AzanNotificationsManager";

export interface PrayerTime {
  name: string;
  key: string;
  time: Date;
  arabic: string;
  emoji: string;
}

export interface ScheduledNotification {
  time: Date;
  title: string;
  body: string;
  tag: string;
  isAzan: boolean;
  sound?: string;
  volume?: number;
}

const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const PRAYER_NAMES: Record<string, { name: string; arabic: string; emoji: string }> = {
  fajr: { name: "Фаджр", arabic: "الفجر", emoji: "🌅" },
  dhuhr: { name: "Зухр", arabic: "الظهر", emoji: "☀️" },
  asr: { name: "Аср", arabic: "العصر", emoji: "🌤️" },
  maghrib: { name: "Магриб", arabic: "المغرب", emoji: "🌇" },
  isha: { name: "Иша", arabic: "العشاء", emoji: "🌙" },
};

/**
 * Планирует все уведомления на основе времен намазов и настроек
 */
export function scheduleAzanNotifications(
  prayerTimes: PrayerTime[],
  settings: AzanNotificationSettings
): ScheduledNotification[] {
  if (!settings.enabled || !settings.permissionGranted) {
    return [];
  }

  const now = new Date();
  const scheduled: ScheduledNotification[] = [];

  // Проверяем тихие часы
  const isQuietHours = (time: Date): boolean => {
    if (!settings.quietHours.enabled) return false;

    const [startHour, startMin] = settings.quietHours.start.split(":").map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(":").map(Number);

    const quietStart = new Date(time);
    quietStart.setHours(startHour, startMin, 0, 0);

    const quietEnd = new Date(time);
    quietEnd.setHours(endHour, endMin, 0, 0);

    // Если тихие часы переходят через полночь
    if (quietStart > quietEnd) {
      return time >= quietStart || time <= quietEnd;
    }

    return time >= quietStart && time <= quietEnd;
  };

  prayerTimes.forEach((prayer) => {
    const prayerKey = prayer.key.toLowerCase();
    const prayerSettings = settings.prayers[prayerKey as keyof typeof settings.prayers];

    if (!prayerSettings || !prayerSettings.enabled) return;

    const prayerInfo = PRAYER_NAMES[prayerKey] || {
      name: prayer.name,
      arabic: prayer.arabic,
      emoji: prayer.emoji,
    };

    // Планируем напоминания
    if (prayerSettings.reminderEnabled) {
      settings.reminderMinutes.forEach((minutes) => {
        const reminderTime = new Date(prayer.time.getTime() - minutes * 60 * 1000);

        // Пропускаем, если время уже прошло или в тихие часы
        if (reminderTime <= now || isQuietHours(reminderTime)) return;

        scheduled.push({
          time: reminderTime,
          title: `${prayerInfo.name} через ${minutes} минут`,
          body: `Время намаза ${prayerInfo.name} приближается`,
          tag: `azan-reminder-${prayerKey}-${minutes}`,
          isAzan: false,
          sound: prayerSettings.sound,
          volume: prayerSettings.volume,
        });
      });
    }

    // Планируем азан в точное время
    if (prayerSettings.azanEnabled && prayer.time > now && !isQuietHours(prayer.time)) {
      scheduled.push({
        time: prayer.time,
        title: `Время намаза ${prayerInfo.name}`,
        body: `${prayerInfo.arabic} - ${prayerInfo.name}`,
        tag: `azan-${prayerKey}`,
        isAzan: true,
        sound: prayerSettings.sound,
        volume: prayerSettings.volume,
      });
    }
  });

  // Сортируем по времени
  return scheduled.sort((a, b) => a.time.getTime() - b.time.getTime());
}

/**
 * Получает следующее запланированное уведомление
 */
export function getNextNotification(
  scheduled: ScheduledNotification[]
): ScheduledNotification | null {
  const now = new Date();
  const upcoming = scheduled.filter((n) => n.time > now);
  return upcoming.length > 0 ? upcoming[0] : null;
}

/**
 * Создает уведомление через браузерный API
 */
export function createBrowserNotification(
  notification: ScheduledNotification
): Notification | null {
  if (Notification.permission !== "granted") {
    return null;
  }

  const options: NotificationOptions = {
    body: notification.body,
    icon: "/logo.svg",
    badge: "/logo.svg",
    tag: notification.tag,
    requireInteraction: notification.isAzan, // Азан требует взаимодействия
    vibrate: [200, 100, 200],
    // Звук будет обрабатываться через service worker
    data: {
      sound: notification.sound,
      volume: notification.volume,
      isAzan: notification.isAzan,
    },
  };

  try {
    return new Notification(notification.title, options);
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Планирует уведомление через setTimeout
 * Внимание: работает только пока приложение открыто
 * Для фоновых уведомлений нужен service worker
 */
export function scheduleNotificationTimeout(
  notification: ScheduledNotification,
  onTrigger: (notification: ScheduledNotification) => void
): NodeJS.Timeout | null {
  const now = new Date();
  const delay = notification.time.getTime() - now.getTime();

  if (delay <= 0) return null;

  return setTimeout(() => {
    onTrigger(notification);
  }, delay);
}

/**
 * Планирует уведомление через service worker (для фоновых уведомлений)
 */
export async function scheduleNotificationInServiceWorker(
  notification: ScheduledNotification
): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Отправляем сообщение в service worker для планирования
    registration.active?.postMessage({
      type: "SCHEDULE_NOTIFICATION",
      notification: {
        ...notification,
        time: notification.time.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error scheduling notification in service worker:", error);
  }
}

/**
 * Очищает все запланированные уведомления
 */
export async function clearAllScheduledNotifications(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({
      tag: /^azan-/,
    });

    notifications.forEach((notification) => {
      notification.close();
    });

    // Отправляем сообщение в service worker для очистки
    registration.active?.postMessage({
      type: "CLEAR_SCHEDULED_NOTIFICATIONS",
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
}

