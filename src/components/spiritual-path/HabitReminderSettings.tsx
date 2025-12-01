// Компонент настройки напоминаний для привычек (как в iPhone Reminders)

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, Repeat, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitReminder, ReminderRepeat, ReminderDayOfWeek } from "@/types/habit-reminder";

interface HabitReminderSettingsProps {
  habitTitle: string;
  habitIcon: string;
  defaultTime?: string;
  onSave: (settings: Omit<HabitReminder, "id" | "user_id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK: Array<{ value: ReminderDayOfWeek; label: string; short: string }> = [
  { value: 0, label: "Воскресенье", short: "Вс" },
  { value: 1, label: "Понедельник", short: "Пн" },
  { value: 2, label: "Вторник", short: "Вт" },
  { value: 3, label: "Среда", short: "Ср" },
  { value: 4, label: "Четверг", short: "Чт" },
  { value: 5, label: "Пятница", short: "Пт" },
  { value: 6, label: "Суббота", short: "Сб" },
];

export const HabitReminderSettings = ({
  habitTitle,
  habitIcon,
  defaultTime = "09:00",
  onSave,
  onCancel,
}: HabitReminderSettingsProps) => {
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState(defaultTime);
  const [repeat, setRepeat] = useState<ReminderRepeat>("daily");
  const [selectedDays, setSelectedDays] = useState<ReminderDayOfWeek[]>([1, 2, 3, 4, 5, 6, 0]); // Все дни по умолчанию
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [sound, setSound] = useState<string>("default");
  const [vibration, setVibration] = useState(true);
  const [badge, setBadge] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const toggleDay = (day: ReminderDayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = () => {
    const settings: Omit<HabitReminder, "id" | "user_id" | "created_at" | "updated_at" | "habit_id"> = {
      title: habitTitle,
      icon: habitIcon,
      color: "green",
      time,
      enabled,
      repeat,
      sound,
      vibration,
      badge,
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
      ...(repeat === "weekly" && { repeat_days: selectedDays }),
      ...(repeat === "custom" && { repeat_interval: repeatInterval }),
    };

    onSave(settings);
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="text-3xl">{habitIcon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{habitTitle}</h3>
          <p className="text-sm text-muted-foreground">Настройте напоминание</p>
        </div>
      </div>

      {/* Включить/выключить */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <Label className="text-base font-medium">Включить напоминание</Label>
            <p className="text-xs text-muted-foreground">Получать уведомления о привычке</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <>
          {/* Время */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <Label className="text-base font-medium">Время</Label>
            </div>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Повторение */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <Repeat className="w-5 h-5 text-muted-foreground" />
              <Label className="text-base font-medium">Повторять</Label>
            </div>
            <Select value={repeat} onValueChange={(v) => setRepeat(v as ReminderRepeat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Никогда</SelectItem>
                <SelectItem value="daily">Ежедневно</SelectItem>
                <SelectItem value="weekly">Еженедельно</SelectItem>
                <SelectItem value="monthly">Ежемесячно</SelectItem>
                <SelectItem value="custom">Произвольное</SelectItem>
              </SelectContent>
            </Select>

            {/* Дни недели для еженедельного повторения */}
            {repeat === "weekly" && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm">Дни недели</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={selectedDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "h-10 w-10 rounded-full p-0",
                        selectedDays.includes(day.value) && "bg-primary text-primary-foreground"
                      )}
                    >
                      {day.short}
                    </Button>
                  ))}
                </div>
                {selectedDays.length === 0 && (
                  <p className="text-xs text-red-500">Выберите хотя бы один день</p>
                )}
              </div>
            )}

            {/* Интервал для произвольного повторения */}
            {repeat === "custom" && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm">Повторять каждые</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">дней</span>
                </div>
              </div>
            )}
          </div>

          {/* Даты начала и окончания */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Label className="text-base font-medium">Период действия</Label>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Начать с (необязательно)</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Завершить (необязательно)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                  min={startDate || undefined}
                />
              </div>
            </div>
          </div>

          {/* Дополнительные настройки */}
          <div className="p-4 rounded-lg border bg-card">
            <Label className="text-base font-medium mb-3 block">Дополнительно</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Вибрация</Label>
                <Switch checked={vibration} onCheckedChange={setVibration} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Показывать бейдж</Label>
                <Switch checked={badge} onCheckedChange={setBadge} />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Звук</Label>
                <Select value={sound} onValueChange={setSound}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">По умолчанию</SelectItem>
                    <SelectItem value="gentle">Мягкий</SelectItem>
                    <SelectItem value="alert">Предупреждение</SelectItem>
                    <SelectItem value="none">Без звука</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Кнопки */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Отмена
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={!enabled || (repeat === "weekly" && selectedDays.length === 0)}>
          Сохранить
        </Button>
      </div>
    </div>
  );
};

