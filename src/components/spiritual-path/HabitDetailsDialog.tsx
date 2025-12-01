// Диалог просмотра деталей привычки перед добавлением

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { HabitTemplate } from "@/data/habit-catalog";
import { cn } from "@/lib/utils";
import { Sparkles, BookOpen, Bell } from "lucide-react";
import { HabitReminderSettings } from "./HabitReminderSettings";
import type { HabitReminder } from "@/types/habit-reminder";

interface HabitDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: HabitTemplate | null;
  onReminderCreated?: (reminder: HabitReminder) => void;
}

const DIFFICULTY_LABELS: Record<string, { label: string; emoji: string }> = {
  easy: { label: "Лёгкая", emoji: "🟢" },
  medium: { label: "Средняя", emoji: "🟡" },
  advanced: { label: "Продвинутая", emoji: "🔵" },
};

const CATEGORY_LABELS: Record<string, string> = {
  prayer: "Намаз",
  quran: "Коран",
  zikr: "Зикр",
  sadaqa: "Садака",
  knowledge: "Знания",
  names_of_allah: "99 имен Аллаха",
};

const COLOR_CLASSES: Record<string, string> = {
  green: "border-l-green-500",
  blue: "border-l-blue-500",
  purple: "border-l-purple-500",
  orange: "border-l-orange-500",
  indigo: "border-l-indigo-500",
  yellow: "border-l-yellow-500",
};

export const HabitDetailsDialog = ({
  open,
  onOpenChange,
  habit,
  onReminderCreated,
}: HabitDetailsDialogProps) => {
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);

  if (!habit) return null;

  const difficulty = DIFFICULTY_LABELS[habit.difficulty];
  const colorClass = COLOR_CLASSES[habit.color] || COLOR_CLASSES.green;

  const handleCreateReminder = async (settings: Omit<HabitReminder, "id" | "user_id" | "created_at" | "updated_at" | "habit_id">) => {
    try {
      // TODO: Сохранить напоминание через API
      const reminder: HabitReminder = {
        id: `reminder_${Date.now()}`,
        user_id: "", // Будет заполнено в API
        habit_id: habit.id,
        ...settings,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Сохраняем в localStorage пока нет API
      const reminders = JSON.parse(localStorage.getItem("habit_reminders") || "[]");
      reminders.push(reminder);
      localStorage.setItem("habit_reminders", JSON.stringify(reminders));

      toast({
        title: "Напоминание создано!",
        description: `"${habit.title}" будет напоминать вам в ${settings.time}`,
      });

      onOpenChange(false);
      setShowSettings(false);
      onReminderCreated?.(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать напоминание. Попробуйте еще раз.",
        variant: "destructive",
      });
    }
  };

  if (showSettings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Настройка напоминания
            </DialogTitle>
          </DialogHeader>
          <HabitReminderSettings
            habitTitle={habit.title}
            habitIcon={habit.icon}
            defaultTime="09:00"
            onSave={handleCreateReminder}
            onCancel={() => setShowSettings(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{habit.icon}</div>
            <div className="flex-1">
              <DialogTitle className="text-xl mb-1">{habit.title}</DialogTitle>
              <DialogDescription className="text-base">
                {habit.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className={cn("space-y-4 border-l-4 pl-4", colorClass)}>
          {/* Категория и сложность */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {CATEGORY_LABELS[habit.category] || habit.category}
            </Badge>
            <Badge variant="outline">
              {difficulty.emoji} {difficulty.label}
            </Badge>
          </div>

          {/* Польза привычки */}
          {habit.benefit && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Польза</span>
              </div>
              <p className="text-sm text-muted-foreground">{habit.benefit}</p>
            </div>
          )}

          {/* Хадис */}
          {habit.hadith && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Хадис</span>
              </div>
              <p className="text-sm text-muted-foreground italic">{habit.hadith}</p>
            </div>
          )}

          <Separator />

          {/* Параметры цели */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Параметры цели:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Тип:</span>
                <span className="ml-2 font-medium">
                  {habit.type === "habit" ? "Бессрочная привычка" :
                   habit.type === "recurring" ? "Повторяющаяся" :
                   habit.type === "fixed_term" ? "С фиксированным сроком" :
                   "Одноразовая"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Период:</span>
                <span className="ml-2 font-medium">
                  {habit.period === "infinite" ? "Бессрочная" :
                   habit.period === "week" ? "Неделя" :
                   habit.period === "month" ? "Месяц" :
                   habit.period === "year" ? "Год" :
                   habit.period === "forty_days" ? "40 дней" :
                   habit.period === "recurring_weekly" ? "Еженедельно" :
                   habit.period === "recurring_monthly" ? "Ежемесячно" :
                   habit.period}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Цель:</span>
                <span className="ml-2 font-medium">
                  {habit.target_value} {habit.metric === "count" ? "раз" : "дней"}
                </span>
              </div>
              {habit.linked_counter_type && (
                <div>
                  <span className="text-muted-foreground">Интеграция:</span>
                  <span className="ml-2 font-medium">
                    {habit.linked_counter_type === "salawat" ? "Салаваты" :
                     habit.linked_counter_type === "tasbih" ? "Тасбих" :
                     habit.linked_counter_type === "tahmid" ? "Тахмид" :
                     habit.linked_counter_type === "takbir" ? "Такбир" :
                     "99 имен Аллаха"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Кнопка добавления */}
          <div className="pt-4">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowSettings(true)}
            >
              <Bell className="w-4 h-4 mr-2" />
              Создать напоминание
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

