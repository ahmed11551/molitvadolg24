// Менеджер азан-уведомлений
// Полноценные уведомления для каждого намаза с настройками

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  BellOff,
  Settings,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PrayerTime {
  name: string;
  arabic: string;
  emoji: string;
  time: Date;
}

export interface AzanNotificationSettings {
  enabled: boolean;
  permissionGranted: boolean;
  // Настройки для каждого намаза
  prayers: {
    fajr: PrayerNotificationSettings;
    dhuhr: PrayerNotificationSettings;
    asr: PrayerNotificationSettings;
    maghrib: PrayerNotificationSettings;
    isha: PrayerNotificationSettings;
  };
  // Общие настройки
  reminderMinutes: number[]; // [5, 10, 15] - за сколько минут напоминать
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "06:00"
  };
}

export interface PrayerNotificationSettings {
  enabled: boolean;
  azanEnabled: boolean; // Уведомление в точное время
  reminderEnabled: boolean; // Уведомление за N минут
  sound: string; // "default" | "azan1" | "azan2" | "silent"
  volume: number; // 0-100
}

const DEFAULT_SETTINGS: AzanNotificationSettings = {
  enabled: false,
  permissionGranted: false,
  prayers: {
    fajr: {
      enabled: true,
      azanEnabled: true,
      reminderEnabled: true,
      sound: "default",
      volume: 80,
    },
    dhuhr: {
      enabled: true,
      azanEnabled: true,
      reminderEnabled: true,
      sound: "default",
      volume: 80,
    },
    asr: {
      enabled: true,
      azanEnabled: true,
      reminderEnabled: true,
      sound: "default",
      volume: 80,
    },
    maghrib: {
      enabled: true,
      azanEnabled: true,
      reminderEnabled: true,
      sound: "default",
      volume: 80,
    },
    isha: {
      enabled: true,
      azanEnabled: true,
      reminderEnabled: true,
      sound: "default",
      volume: 80,
    },
  },
  reminderMinutes: [5, 15], // За 5 и 15 минут
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "06:00",
  },
};

const STORAGE_KEY = "azan_notification_settings";
const PRAYER_NAMES = {
  fajr: { name: "Фаджр", arabic: "الفجر", emoji: "🌅" },
  dhuhr: { name: "Зухр", arabic: "الظهر", emoji: "☀️" },
  asr: { name: "Аср", arabic: "العصر", emoji: "🌤️" },
  maghrib: { name: "Магриб", arabic: "المغرب", emoji: "🌇" },
  isha: { name: "Иша", arabic: "العشاء", emoji: "🌙" },
};

const SOUND_OPTIONS = [
  { value: "default", label: "По умолчанию" },
  { value: "azan1", label: "Азан 1" },
  { value: "azan2", label: "Азан 2" },
  { value: "azan3", label: "Азан 3" },
  { value: "silent", label: "Без звука" },
];

export const AzanNotificationsManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AzanNotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [nextNotification, setNextNotification] = useState<{
    prayer: string;
    time: Date;
    type: "reminder" | "azan";
  } | null>(null);

  // Загрузка настроек
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error("Failed to parse azan settings:", error);
      }
    }

    // Проверка разрешения на уведомления
    if ("Notification" in window) {
      const permission = Notification.permission;
      setSettings((prev) => ({
        ...prev,
        permissionGranted: permission === "granted",
      }));
    }
  }, []);

  // Сохранение настроек
  const saveSettings = useCallback((newSettings: AzanNotificationSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
    scheduleNotifications(newSettings);
  }, []);

  // Запрос разрешения на уведомления
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Не поддерживается",
        description: "Ваш браузер не поддерживает уведомления",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === "granted") {
      setSettings((prev) => ({ ...prev, permissionGranted: true }));
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setSettings((prev) => ({ ...prev, permissionGranted: true, enabled: true }));
        toast({
          title: "Разрешение получено",
          description: "Уведомления о намазах включены",
        });
      } else {
        toast({
          title: "Разрешение отклонено",
          description: "Включите уведомления в настройках браузера",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось запросить разрешение",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Планирование уведомлений
  const scheduleNotifications = useCallback((currentSettings: AzanNotificationSettings) => {
    if (!currentSettings.enabled || !currentSettings.permissionGranted) {
      return;
    }

    // Очистка старых уведомлений
    if ("serviceWorker" in navigator && "Notification" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.getNotifications().then((notifications) => {
          notifications.forEach((notification) => {
            if (notification.tag?.startsWith("azan-")) {
              notification.close();
            }
          });
        });
      });
    }

    // Получаем времена намазов из localStorage или используем заглушку
    const prayerTimesData = localStorage.getItem("prayer_times");
    let prayerTimes: Record<string, Date> = {};

    if (prayerTimesData) {
      try {
        const parsed = JSON.parse(prayerTimesData);
        Object.entries(parsed).forEach(([key, time]) => {
          prayerTimes[key] = new Date(time as string);
        });
      } catch (error) {
        console.error("Failed to parse prayer times:", error);
      }
    }

    // Если нет сохраненных времен, используем заглушку
    if (Object.keys(prayerTimes).length === 0) {
      const now = new Date();
      prayerTimes = {
        fajr: new Date(now.setHours(5, 30, 0, 0)),
        dhuhr: new Date(now.setHours(13, 0, 0, 0)),
        asr: new Date(now.setHours(16, 30, 0, 0)),
        maghrib: new Date(now.setHours(19, 0, 0, 0)),
        isha: new Date(now.setHours(21, 0, 0, 0)),
      };
    }

    const now = new Date();

    // Планируем уведомления для каждого намаза
    Object.entries(prayerTimes).forEach(([prayerKey, prayerTime]) => {
      const prayerSettings = currentSettings.prayers[prayerKey as keyof typeof currentSettings.prayers];
      if (!prayerSettings || !prayerSettings.enabled) return;

      // Уведомления-напоминания
      if (prayerSettings.reminderEnabled) {
        currentSettings.reminderMinutes.forEach((minutes) => {
          const reminderTime = new Date(prayerTime.getTime() - minutes * 60 * 1000);
          if (reminderTime > now) {
            scheduleNotification(
              reminderTime,
              `${PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES]?.name || prayerKey} через ${minutes} минут`,
              `Время намаза ${PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES]?.name || prayerKey} приближается`,
              `azan-reminder-${prayerKey}-${minutes}`,
              false
            );
          }
        });
      }

      // Уведомление в точное время (азан)
      if (prayerSettings.azanEnabled && prayerTime > now) {
        scheduleNotification(
          prayerTime,
          `Время намаза ${PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES]?.name || prayerKey}`,
          `${PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES]?.arabic || ""} - ${PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES]?.name || prayerKey}`,
          `azan-${prayerKey}`,
          true
        );
      }
    });
  }, []);

  // Планирование одного уведомления
  const scheduleNotification = (
    time: Date,
    title: string,
    body: string,
    tag: string,
    isAzan: boolean
  ) => {
    const now = new Date();
    const delay = time.getTime() - now.getTime();

    if (delay <= 0) return;

    setTimeout(() => {
      if (Notification.permission === "granted") {
        const notification = new Notification(title, {
          body,
          icon: "/logo.svg",
          badge: "/logo.svg",
          tag,
          requireInteraction: isAzan, // Азан требует взаимодействия
          vibrate: settings.vibrationEnabled ? [200, 100, 200] : undefined,
          sound: settings.soundEnabled ? undefined : undefined, // Звук через service worker
        });

        // Автоматическое закрытие через 10 секунд (кроме азана)
        if (!isAzan) {
          setTimeout(() => notification.close(), 10000);
        }

        // Обработка клика
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }, delay);
  };

  // Обновление следующего уведомления
  useEffect(() => {
    if (!settings.enabled || !settings.permissionGranted) {
      setNextNotification(null);
      return;
    }

    // TODO: Получить актуальные времена намазов
    const now = new Date();
    const prayerTimes: Array<{ key: string; time: Date; type: "reminder" | "azan" }> = [];

    // Здесь нужно получить реальные времена намазов из PrayerTimes компонента
    // Пока используем заглушку
    Object.entries({
      fajr: new Date(now.setHours(5, 30, 0, 0)),
      dhuhr: new Date(now.setHours(13, 0, 0, 0)),
      asr: new Date(now.setHours(16, 30, 0, 0)),
      maghrib: new Date(now.setHours(19, 0, 0, 0)),
      isha: new Date(now.setHours(21, 0, 0, 0)),
    }).forEach(([key, time]) => {
      const prayerSettings = settings.prayers[key as keyof typeof settings.prayers];
      if (!prayerSettings.enabled) return;

      // Добавляем напоминания
      if (prayerSettings.reminderEnabled) {
        settings.reminderMinutes.forEach((minutes) => {
          const reminderTime = new Date(time.getTime() - minutes * 60 * 1000);
          if (reminderTime > now) {
            prayerTimes.push({ key, time: reminderTime, type: "reminder" });
          }
        });
      }

      // Добавляем азан
      if (prayerSettings.azanEnabled && time > now) {
        prayerTimes.push({ key, time, type: "azan" });
      }
    });

    // Находим ближайшее уведомление
    const next = prayerTimes
      .filter((p) => p.time > now)
      .sort((a, b) => a.time.getTime() - b.time.getTime())[0];

    if (next) {
      setNextNotification({
        prayer: PRAYER_NAMES[next.key as keyof typeof PRAYER_NAMES].name,
        time: next.time,
        type: next.type,
      });
    }
  }, [settings]);

  // Тестовое уведомление
  const testNotification = useCallback(() => {
    if (Notification.permission !== "granted") {
      requestPermission();
      return;
    }

    new Notification("Тест уведомления", {
      body: "Это тестовое уведомление о намазе",
      icon: "/logo.svg",
      badge: "/logo.svg",
      tag: "test",
    });

    toast({
      title: "Тестовое уведомление отправлено",
      description: "Проверьте, пришло ли уведомление",
    });
  }, [toast, requestPermission]);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Азан-уведомления
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Уведомления о времени намазов и напоминания
          </p>
        </div>
      </div>

      {/* Статус разрешения */}
      {!settings.permissionGranted && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Для работы уведомлений необходимо разрешение. Нажмите кнопку ниже, чтобы включить.
          </AlertDescription>
        </Alert>
      )}

      {/* Основные настройки */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Основные настройки</span>
            <Switch
              checked={settings.enabled && settings.permissionGranted}
              onCheckedChange={(checked) => {
                if (checked && !settings.permissionGranted) {
                  requestPermission();
                } else {
                  saveSettings({ ...settings, enabled: checked });
                }
              }}
            />
          </CardTitle>
          <CardDescription>
            Включите уведомления для получения напоминаний о намазах
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!settings.permissionGranted && (
            <Button onClick={requestPermission} className="w-full">
              <Bell className="w-4 h-4 mr-2" />
              Запросить разрешение на уведомления
            </Button>
          )}

          {settings.permissionGranted && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled">Звук</Label>
                <Switch
                  id="sound-enabled"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) =>
                    saveSettings({ ...settings, soundEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="vibration-enabled">Вибрация</Label>
                <Switch
                  id="vibration-enabled"
                  checked={settings.vibrationEnabled}
                  onCheckedChange={(checked) =>
                    saveSettings({ ...settings, vibrationEnabled: checked })
                  }
                />
              </div>

              <Button onClick={testNotification} variant="outline" className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                Отправить тестовое уведомление
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Следующее уведомление */}
      {nextNotification && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Следующее уведомление</p>
                <p className="text-lg font-semibold">
                  {nextNotification.prayer} - {nextNotification.time.toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <Badge variant="outline" className="mt-1">
                  {nextNotification.type === "azan" ? "Азан" : "Напоминание"}
                </Badge>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Настройки напоминаний */}
      <Card>
        <CardHeader>
          <CardTitle>Напоминания</CardTitle>
          <CardDescription>
            За сколько минут до намаза отправлять напоминание
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 30].map((minutes) => (
              <Button
                key={minutes}
                variant={settings.reminderMinutes.includes(minutes) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newMinutes = settings.reminderMinutes.includes(minutes)
                    ? settings.reminderMinutes.filter((m) => m !== minutes)
                    : [...settings.reminderMinutes, minutes].sort((a, b) => a - b);
                  saveSettings({ ...settings, reminderMinutes: newMinutes });
                }}
              >
                {settings.reminderMinutes.includes(minutes) && (
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                )}
                {minutes} мин
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Настройки для каждого намаза */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки по намазам</CardTitle>
          <CardDescription>
            Настройте уведомления для каждого намаза отдельно
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(PRAYER_NAMES).map(([key, prayer]) => {
            const prayerSettings = settings.prayers[key as keyof typeof settings.prayers];
            return (
              <div key={key} className="space-y-3 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{prayer.emoji}</span>
                    <div>
                      <p className="font-semibold">{prayer.name}</p>
                      <p className="text-sm text-muted-foreground">{prayer.arabic}</p>
                    </div>
                  </div>
                  <Switch
                    checked={prayerSettings.enabled}
                    onCheckedChange={(checked) => {
                      saveSettings({
                        ...settings,
                        prayers: {
                          ...settings.prayers,
                          [key]: { ...prayerSettings, enabled: checked },
                        },
                      });
                    }}
                  />
                </div>

                {prayerSettings.enabled && (
                  <div className="space-y-3 pl-11">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${key}-azan`}>Азан в точное время</Label>
                      <Switch
                        id={`${key}-azan`}
                        checked={prayerSettings.azanEnabled}
                        onCheckedChange={(checked) => {
                          saveSettings({
                            ...settings,
                            prayers: {
                              ...settings.prayers,
                              [key]: { ...prayerSettings, azanEnabled: checked },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${key}-reminder`}>Напоминание</Label>
                      <Switch
                        id={`${key}-reminder`}
                        checked={prayerSettings.reminderEnabled}
                        onCheckedChange={(checked) => {
                          saveSettings({
                            ...settings,
                            prayers: {
                              ...settings.prayers,
                              [key]: { ...prayerSettings, reminderEnabled: checked },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${key}-sound`}>Звук</Label>
                      <Select
                        value={prayerSettings.sound}
                        onValueChange={(value) => {
                          saveSettings({
                            ...settings,
                            prayers: {
                              ...settings.prayers,
                              [key]: { ...prayerSettings, sound: value },
                            },
                          });
                        }}
                      >
                        <SelectTrigger id={`${key}-sound`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOUND_OPTIONS.map((sound) => (
                            <SelectItem key={sound.value} value={sound.value}>
                              {sound.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Тихие часы */}
      <Card>
        <CardHeader>
          <CardTitle>Тихие часы</CardTitle>
          <CardDescription>
            Отключить уведомления в определенное время
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours">Включить тихие часы</Label>
            <Switch
              id="quiet-hours"
              checked={settings.quietHours.enabled}
              onCheckedChange={(checked) =>
                saveSettings({
                  ...settings,
                  quietHours: { ...settings.quietHours, enabled: checked },
                })
              }
            />
          </div>

          {settings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Начало</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quietHours.start}
                  onChange={(e) =>
                    saveSettings({
                      ...settings,
                      quietHours: { ...settings.quietHours, start: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Конец</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quietHours.end}
                  onChange={(e) =>
                    saveSettings({
                      ...settings,
                      quietHours: { ...settings.quietHours, end: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

