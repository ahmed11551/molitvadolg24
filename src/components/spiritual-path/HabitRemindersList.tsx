// Список напоминаний о привычках

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  BellOff, 
  Clock, 
  Repeat, 
  Trash2, 
  Edit,
  Plus,
  Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitReminder } from "@/types/habit-reminder";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";

interface HabitRemindersListProps {
  onAddReminder?: () => void;
  onEditReminder?: (reminder: HabitReminder) => void;
}

const REMINDER_STORAGE_KEY = "habit_reminders";

export const HabitRemindersList = ({ onAddReminder, onEditReminder }: HabitRemindersListProps) => {
  const [reminders, setReminders] = useState<HabitReminder[]>([]);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = () => {
    try {
      const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setReminders(
          parsed.map((r: any) => ({
            ...r,
            created_at: new Date(r.created_at),
            updated_at: new Date(r.updated_at),
            start_date: r.start_date ? new Date(r.start_date) : undefined,
            end_date: r.end_date ? new Date(r.end_date) : undefined,
            last_triggered: r.last_triggered ? new Date(r.last_triggered) : undefined,
            next_trigger: r.next_trigger ? new Date(r.next_trigger) : undefined,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading reminders:", error);
    }
  };

  const saveReminders = (updatedReminders: HabitReminder[]) => {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(updatedReminders));
    setReminders(updatedReminders);
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled, updated_at: new Date() } : r
    );
    saveReminders(updated);
  };

  const deleteReminder = (id: string) => {
    if (confirm("Удалить это напоминание?")) {
      const updated = reminders.filter((r) => r.id !== id);
      saveReminders(updated);
    }
  };

  const getRepeatLabel = (reminder: HabitReminder): string => {
    switch (reminder.repeat) {
      case "never":
        return "Один раз";
      case "daily":
        return "Ежедневно";
      case "weekly":
        if (reminder.repeat_days && reminder.repeat_days.length > 0) {
          const days = reminder.repeat_days
            .map((d) => {
              const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
              return dayNames[d];
            })
            .join(", ");
          return `По ${days}`;
        }
        return "Еженедельно";
      case "monthly":
        return "Ежемесячно";
      case "custom":
        return `Каждые ${reminder.repeat_interval || 1} дней`;
      default:
        return "Не повторяется";
    }
  };

  const getNextTriggerTime = (reminder: HabitReminder): string => {
    if (!reminder.enabled) return "Отключено";
    if (reminder.next_trigger) {
      return format(reminder.next_trigger, "dd.MM.yyyy в HH:mm", { locale: ru });
    }
    return "Скоро";
  };

  useEffect(() => {
    // Обновляем список при добавлении нового напоминания
    const handleStorageChange = () => {
      loadReminders();
    };
    window.addEventListener("reminderAdded", handleStorageChange);
    return () => window.removeEventListener("reminderAdded", handleStorageChange);
  }, []);

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Напоминания
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Управляйте напоминаниями о ваших привычках
          </p>
        </div>
        {onAddReminder && (
          <Button onClick={onAddReminder}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        )}
      </div>

      {/* Список напоминаний */}
      {reminders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BellOff className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">У вас пока нет напоминаний</p>
            <p className="text-sm text-muted-foreground mb-4">
              Добавьте напоминания из каталога привычек
            </p>
            {onAddReminder && (
              <Button onClick={onAddReminder} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Добавить напоминание
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <Card
              key={reminder.id}
              className={cn(
                "transition-all",
                !reminder.enabled && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Иконка */}
                  <div className="text-3xl shrink-0">{reminder.icon}</div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{reminder.title}</h3>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {reminder.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={reminder.enabled}
                        onCheckedChange={() => toggleReminder(reminder.id)}
                      />
                    </div>

                    {/* Информация о времени */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{reminder.time}</span>
                        <Badge variant="outline" className="text-xs">
                          {getRepeatLabel(reminder)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Следующее: {getNextTriggerTime(reminder)}</span>
                      </div>
                    </div>

                    {/* Действия */}
                    <div className="flex items-center gap-2 mt-3">
                      {onEditReminder && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditReminder(reminder)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Изменить
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

