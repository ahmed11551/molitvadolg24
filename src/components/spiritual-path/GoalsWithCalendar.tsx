// Компонент целей с календарем и переключателем между целями и привычками

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgesDisplayCompact } from "./BadgesDisplayCompact";
import { cn } from "@/lib/utils";
import { Target, BookOpen, CheckCircle2, Circle, Plus } from "lucide-react";
import type { Goal } from "@/types/spiritual-path";
import type { HabitReminder } from "@/types/habit-reminder";
import { format, isSameDay, startOfWeek, addDays, getDay } from "date-fns";
import { ru } from "date-fns/locale";
import { CreateGoalDialog } from "./CreateGoalDialog";

interface GoalsWithCalendarProps {
  goals: Goal[];
  onRefresh: () => void;
}

const REMINDER_STORAGE_KEY = "habit_reminders";

export const GoalsWithCalendar = memo(({ goals, onRefresh }: GoalsWithCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"goals" | "habits">("goals");
  const [reminders, setReminders] = useState<HabitReminder[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Мемоизируем обработчик смены таба
  const handleTabChange = useCallback((v: string) => {
    setActiveTab(v as "goals" | "habits");
  }, []);

  // Мемоизируем функцию загрузки напоминаний
  const loadReminders = useCallback(() => {
    try {
      const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setReminders(
          parsed.map((r: any) => ({
            ...r,
            created_at: new Date(r.created_at),
            updated_at: new Date(r.updated_at),
          }))
        );
      }
    } catch (error) {
      console.error("Error loading reminders:", error);
    }
  }, []);

  // Загружаем напоминания
  useEffect(() => {
    loadReminders();
    const handleStorageChange = () => loadReminders();
    window.addEventListener("reminderAdded", handleStorageChange);
    return () => window.removeEventListener("reminderAdded", handleStorageChange);
  }, [loadReminders]);

  // Генерируем дни недели (7 дней: 3 назад, сегодня, 3 вперед)
  const weekDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date,
        dayName: format(date, "EEE", { locale: ru }).slice(0, 2).toUpperCase(),
        dayNum: date.getDate(),
        isToday: isSameDay(date, today),
        isSelected: isSameDay(date, selectedDate),
      });
    }
    return days;
  }, [selectedDate]);

  // Фильтруем цели на выбранную дату
  const goalsForDate = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    
    return goals.filter((goal) => {
      // Для бессрочных привычек показываем всегда
      if (goal.type === "habit" && !goal.end_date) {
        return true;
      }
      
      // Для целей с датами проверяем период
      if (goal.start_date) {
        const startDate = new Date(goal.start_date);
        const endDate = goal.end_date ? new Date(goal.end_date) : null;
        
        // Проверяем, попадает ли выбранная дата в период цели
        if (isSameDay(startDate, selectedDate)) return true;
        if (endDate && isSameDay(endDate, selectedDate)) return true;
        if (startDate <= selectedDate && (!endDate || selectedDate <= endDate)) {
          return true;
        }
      }
      
      return false;
    });
  }, [goals, selectedDate]);

  // Фильтруем привычки на выбранную дату
  const habitsForDate = useMemo(() => {
    return reminders.filter((reminder) => {
      if (!reminder.enabled) return false;
      
      // Проверяем даты начала и окончания
      if (reminder.start_date && selectedDate < new Date(reminder.start_date)) return false;
      if (reminder.end_date && selectedDate > new Date(reminder.end_date)) return false;
      
      // Проверяем повторение
      const selectedDayOfWeek = getDay(selectedDate); // 0 = воскресенье
      
      switch (reminder.repeat) {
        case "never":
          // Одноразовое - проверяем точную дату
          return reminder.start_date && isSameDay(new Date(reminder.start_date), selectedDate);
        case "daily":
          return true;
        case "weekly":
          return reminder.repeat_days?.includes(selectedDayOfWeek as any) ?? false;
        case "monthly":
          // Ежемесячно - проверяем день месяца
          return reminder.start_date 
            ? new Date(reminder.start_date).getDate() === selectedDate.getDate()
            : false;
        case "custom":
          if (!reminder.start_date || !reminder.repeat_interval) return false;
          const start = new Date(reminder.start_date);
          const diffDays = Math.floor((selectedDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays % (reminder.repeat_interval || 1) === 0;
        default:
          return false;
      }
    });
  }, [reminders, selectedDate]);

  // Получаем прогресс привычки по дням недели
  const getHabitWeekProgress = (reminder: HabitReminder) => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Понедельник
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    // Загружаем историю выполнения из localStorage
    const historyKey = `habit_completion_${reminder.id}`;
    const completionHistory = JSON.parse(localStorage.getItem(historyKey) || "{}");
    
    return weekDays.map((day) => {
      const dayOfWeek = getDay(day);
      const dayKey = format(day, "yyyy-MM-dd");
      let isActive = false;
      
      if (!reminder.enabled) return { day, isActive: false, isCompleted: false, isToday: isSameDay(day, new Date()) };
      
      switch (reminder.repeat) {
        case "daily":
          isActive = true;
          break;
        case "weekly":
          isActive = reminder.repeat_days?.includes(dayOfWeek as any) ?? false;
          break;
        case "monthly":
          if (reminder.start_date) {
            isActive = new Date(reminder.start_date).getDate() === day.getDate();
          }
          break;
        case "custom":
          if (reminder.start_date && reminder.repeat_interval) {
            const start = new Date(reminder.start_date);
            const diffDays = Math.floor((day.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            isActive = diffDays >= 0 && diffDays % reminder.repeat_interval === 0;
          }
          break;
      }
      
      // Проверяем фактическое выполнение из истории
      const isCompleted = completionHistory[dayKey] === true;
      
      return {
        day,
        isActive,
        isCompleted,
        isToday: isSameDay(day, new Date()),
      };
    });
  };

  // Мемоизируем функцию отметки выполнения
  const toggleHabitCompletion = useCallback((reminder: HabitReminder, date: Date) => {
    const historyKey = `habit_completion_${reminder.id}`;
    const completionHistory = JSON.parse(localStorage.getItem(historyKey) || "{}");
    const dayKey = format(date, "yyyy-MM-dd");
    
    completionHistory[dayKey] = !completionHistory[dayKey];
    localStorage.setItem(historyKey, JSON.stringify(completionHistory));
    
    // Обновляем список для перерисовки
    loadReminders();
  }, [loadReminders]);

  return (
    <div className="space-y-4">
      {/* Бейджи */}
      <div className="mb-4">
        <BadgesDisplayCompact />
      </div>

      {/* Переключатель и календарь */}
      <div className="space-y-4">
        {/* Переключатель Привычки/Цели */}
        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="goals" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Цели
              </TabsTrigger>
              <TabsTrigger value="habits" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Привычки
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === "goals" ? (
            <CreateGoalDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              onGoalCreated={() => {
                // Обновляем список целей
                onRefresh();
                // Закрываем диалог
                setCreateDialogOpen(false);
              }}
            >
              <Button size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </CreateGoalDialog>
          ) : (
            <Button 
              size="icon" 
              variant="outline"
              onClick={() => {
                // Переключаемся на каталог привычек
                window.location.href = "/spiritual-path?tab=habits";
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Календарь с днями недели */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDays.map((day, index) => (
            <Button
              key={index}
              variant={day.isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px] h-auto py-2",
                day.isToday && !day.isSelected && "border-primary",
                day.isSelected && "bg-primary text-primary-foreground"
              )}
              onClick={() => setSelectedDate(day.date)}
            >
              <span className="text-xs font-medium">{day.dayName}</span>
              <span className={cn(
                "text-lg font-semibold",
                day.isToday && !day.isSelected && "text-primary"
              )}>
                {day.dayNum}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Список целей или привычек на выбранную дату */}
      <div className="space-y-3">
        {activeTab === "goals" ? (
          goalsForDate.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  Нет целей на {format(selectedDate, "d MMMM", { locale: ru })}
                </p>
              </CardContent>
            </Card>
          ) : (
            goalsForDate.map((goal) => {
              const progressPercent = goal.target_value > 0
                ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                : 0;

              return (
                <Card key={goal.id} className="cursor-pointer hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🎯</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {goal.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {goal.current_value} / {goal.target_value}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )
        ) : (
          habitsForDate.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  Нет привычек на {format(selectedDate, "d MMMM", { locale: ru })}
                </p>
              </CardContent>
            </Card>
          ) : (
            habitsForDate.map((reminder) => {
              const weekProgress = getHabitWeekProgress(reminder);
              const completedCount = weekProgress.filter((p) => p.isCompleted).length;
              const activeCount = weekProgress.filter((p) => p.isActive).length;

              return (
                <Card key={reminder.id} className="cursor-pointer hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{reminder.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1">{reminder.title}</h3>
                            <Badge variant="outline" className="text-xs mb-2">
                              {completedCount}/{activeCount} дней
                            </Badge>
                          </div>
                        </div>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {reminder.description}
                          </p>
                        )}
                        {/* Прогресс по дням недели */}
                        <div className="flex gap-1">
                          {weekProgress.map((progress, idx) => {
                            const dayName = format(progress.day, "EEE", { locale: ru }).slice(0, 2);
                            return (
                              <button
                                key={idx}
                                onClick={() => progress.isActive && toggleHabitCompletion(reminder, progress.day)}
                                disabled={!progress.isActive}
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all",
                                  progress.isCompleted
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : progress.isActive
                                    ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 cursor-pointer"
                                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed",
                                  progress.isToday && "ring-2 ring-primary"
                                )}
                                title={format(progress.day, "d MMMM", { locale: ru })}
                              >
                                {progress.isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : progress.isActive ? (
                                  <span className="text-[10px] font-medium">{dayName}</span>
                                ) : (
                                  <Circle className="w-3 h-3" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )
        )}
      </div>
    </div>
  );
};

