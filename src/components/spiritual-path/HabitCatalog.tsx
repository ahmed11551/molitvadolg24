// Каталог привычек с фильтрацией и поиском

import { useState, useMemo, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HabitCatalogCard } from "./HabitCatalogCard";
import { HabitDetailsDialog } from "./HabitDetailsDialog";
import {
  HABIT_CATALOG,
  HABIT_FILTERS,
  getHabitsByFilter,
  type HabitTemplate,
  type HabitFilter,
} from "@/data/habit-catalog";
import { cn } from "@/lib/utils";
import { Search, Plus, Sparkles } from "lucide-react";
import type { HabitReminder } from "@/types/habit-reminder";
import { useDebounce } from "@/hooks/useDebounce";

export const HabitCatalog = memo(({ onReminderCreated }: { onReminderCreated?: (reminder: HabitReminder) => void }) => {
  const [selectedFilter, setSelectedFilter] = useState<HabitFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedHabit, setSelectedHabit] = useState<HabitTemplate | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Фильтрация привычек с debounce для поиска
  const filteredHabits = useMemo(() => {
    let habits = selectedFilter === "all" 
      ? HABIT_CATALOG 
      : getHabitsByFilter(selectedFilter);

    // Поиск по названию и описанию (используем debounced значение)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      habits = habits.filter(
        (habit) =>
          habit.title.toLowerCase().includes(query) ||
          habit.description.toLowerCase().includes(query)
      );
    }

    return habits;
  }, [selectedFilter, debouncedSearchQuery]);

  // Группировка по категориям
  const habitsByCategory = useMemo(() => {
    const grouped: Record<string, HabitTemplate[]> = {};
    filteredHabits.forEach((habit) => {
      if (!grouped[habit.category]) {
        grouped[habit.category] = [];
      }
      grouped[habit.category].push(habit);
    });
    return grouped;
  }, [filteredHabits]);

  const handleHabitClick = (habit: HabitTemplate) => {
    setSelectedHabit(habit);
    setDetailsDialogOpen(true);
  };

  const handleReminderCreated = useCallback((reminder: HabitReminder) => {
    setDetailsDialogOpen(false);
    setSelectedHabit(null);
    // Отправляем событие для обновления списка напоминаний
    window.dispatchEvent(new Event("reminderAdded"));
    onReminderCreated?.(reminder);
  }, [onReminderCreated]);

  const handleHabitClick = useCallback((habit: HabitTemplate) => {
    setSelectedHabit(habit);
    setDetailsDialogOpen(true);
  }, []);

  const handleFilterChange = useCallback((filter: HabitFilter) => {
    setSelectedFilter(filter);
  }, []);

  const CATEGORY_LABELS: Record<string, string> = {
    prayer: "🕌 Намазы и духовные действия",
    quran: "📖 Коран и чтение",
    zikr: "📿 Зикр и духовная практика",
    sadaqa: "💰 Садака и добрые дела",
    knowledge: "📚 Знания и саморазвитие",
    names_of_allah: "✨ 99 имен Аллаха",
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Каталог привычек</h2>
        <p className="text-sm text-muted-foreground">
          Выберите вдохновляющую привычку и создайте напоминание
        </p>
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Найти вдохновение: поиск по каталогу привычек..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Фильтры */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {HABIT_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange(filter.value)}
              className={cn(
                "shrink-0 whitespace-nowrap",
                selectedFilter === filter.value && "shadow-sm"
              )}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Список привычек */}
      {filteredHabits.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-2">
            {searchQuery
              ? "Не найдено привычек по вашему запросу"
              : "Нет привычек в этой категории"}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              Очистить поиск
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(habitsByCategory).map(([category, habits]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {CATEGORY_LABELS[category] || category}
                <Badge variant="secondary" className="text-xs">
                  {habits.length}
                </Badge>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {habits.map((habit) => (
                  <HabitCatalogCard
                    key={habit.id}
                    habit={habit}
                    onClick={() => handleHabitClick(habit)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Мотивационное сообщение */}
      {filteredHabits.length > 0 && (
        <div className="text-center py-6 border-t">
          <p className="text-sm text-muted-foreground italic">
            Каждое доброе действие — привычка сердца. Начни сегодня.
          </p>
        </div>
      )}

      {/* Диалог деталей привычки */}
      <HabitDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        habit={selectedHabit}
        onReminderCreated={handleReminderCreated}
      />
    </div>
  );
});

HabitCatalog.displayName = "HabitCatalog";

