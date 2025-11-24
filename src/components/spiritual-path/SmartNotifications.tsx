// Компонент для управления умными уведомлениями
// Интеграция с Telegram Bot API

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellOff,
  Clock,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { NotificationSettings, SmartNotification } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";

// TODO: Получить настройки из API
const getDefaultSettings = (): NotificationSettings => ({
  user_id: "",
  enabled: false,
  telegram_enabled: false,
  notification_period_start: "08:00",
  notification_period_end: "22:00",
  daily_reminder_enabled: true,
  motivation_enabled: true,
  badge_notifications_enabled: true,
});

export const SmartNotifications = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(getDefaultSettings());
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadNotifications();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await spiritualPathAPI.getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
      // Используем настройки по умолчанию
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await spiritualPathAPI.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    setLoading(true);
    try {
      await spiritualPathAPI.updateNotificationSettings(newSettings);
      setSettings(newSettings);
      toast({
        title: "Настройки сохранены",
        description: "Уведомления обновлены",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleTimeChange = (key: "notification_period_start" | "notification_period_end", value: string) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const sendTestNotification = async () => {
    try {
      await spiritualPathAPI.sendTestNotification();
      toast({
        title: "Тестовое уведомление отправлено",
        description: "Проверьте Telegram",
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомление. Убедитесь, что уведомления включены.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Умные уведомления
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Персонализированные напоминания и мотивация в Telegram
        </p>
      </div>

      {/* Основные настройки */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Настройки уведомлений
          </CardTitle>
          <CardDescription>
            Управляйте уведомлениями о ваших целях
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Включить/выключить уведомления */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled" className="text-base">
                Включить уведомления
              </Label>
              <p className="text-sm text-muted-foreground">
                Получать уведомления о прогрессе целей
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => handleToggle("enabled", checked)}
            />
          </div>

          {/* Telegram уведомления */}
          {settings.enabled && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="telegram-enabled" className="text-base">
                  Telegram уведомления
                </Label>
                <p className="text-sm text-muted-foreground">
                  Отправлять уведомления в Telegram
                </p>
              </div>
              <Switch
                id="telegram-enabled"
                checked={settings.telegram_enabled}
                onCheckedChange={(checked) => handleToggle("telegram_enabled", checked)}
                disabled={!settings.enabled}
              />
            </div>
          )}

          {/* Период уведомлений */}
          {settings.enabled && settings.telegram_enabled && (
            <div className="space-y-4 p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base">Период уведомлений</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period-start" className="text-sm">
                    С
                  </Label>
                  <Input
                    id="period-start"
                    type="time"
                    value={settings.notification_period_start}
                    onChange={(e) => handleTimeChange("notification_period_start", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="period-end" className="text-sm">
                    До
                  </Label>
                  <Input
                    id="period-end"
                    type="time"
                    value={settings.notification_period_end}
                    onChange={(e) => handleTimeChange("notification_period_end", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Типы уведомлений */}
          {settings.enabled && (
            <div className="space-y-4 p-4 rounded-lg bg-secondary/50">
              <Label className="text-base">Типы уведомлений</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="daily-reminder" className="text-sm">
                      Напоминания о дневном плане
                    </Label>
                  </div>
                  <Switch
                    id="daily-reminder"
                    checked={settings.daily_reminder_enabled}
                    onCheckedChange={(checked) => handleToggle("daily_reminder_enabled", checked)}
                    disabled={!settings.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="motivation" className="text-sm">
                      Мотивация при отставании
                    </Label>
                  </div>
                  <Switch
                    id="motivation"
                    checked={settings.motivation_enabled}
                    onCheckedChange={(checked) => handleToggle("motivation_enabled", checked)}
                    disabled={!settings.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="badge-notifications" className="text-sm">
                      Поздравления с бейджами
                    </Label>
                  </div>
                  <Switch
                    id="badge-notifications"
                    checked={settings.badge_notifications_enabled}
                    onCheckedChange={(checked) => handleToggle("badge_notifications_enabled", checked)}
                    disabled={!settings.enabled}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Тестовое уведомление */}
          {settings.enabled && settings.telegram_enabled && (
            <Button onClick={sendTestNotification} variant="outline" className="w-full">
              <Bell className="w-4 h-4 mr-2" />
              Отправить тестовое уведомление
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Примеры уведомлений */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Примеры уведомлений</CardTitle>
          <CardDescription>
            Как будут выглядеть ваши уведомления
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Напоминание о дневном плане */}
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Напоминание о дневном плане</p>
                <p className="text-sm text-muted-foreground">
                  Ахмад – у тебя цель "5000 салаватов", осталось 3 намаза для выполнения дневного плана
                </p>
              </div>
            </div>
          </div>

          {/* Мотивация при отставании */}
          <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Мотивация при отставании</p>
                <p className="text-sm text-muted-foreground">
                  Ахмад – вы отстаете от графика. Чтобы достичь цель "5000 салаватов", осталось 15 дней. Нужно делать 50 салаватов в день
                </p>
              </div>
            </div>
          </div>

          {/* Поздравление с бейджем */}
          <div className="p-4 rounded-lg border bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Поздравление с бейджем</p>
                <p className="text-sm text-muted-foreground">
                  Ахмад – поздравляем! Вы получили бейдж "Неуклонный в намазе" (30 дней без пропусков) 🎉
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* История уведомлений */}
      {notifications.length > 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>История уведомлений</CardTitle>
            <CardDescription>
              Последние отправленные уведомления
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 rounded-lg border bg-background"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.personalized_message}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {notification.type}
                    </Badge>
                  </div>
                  {notification.sent_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.sent_at).toLocaleString("ru-RU")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

