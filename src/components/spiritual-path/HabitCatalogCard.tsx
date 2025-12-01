// Карточка привычки в каталоге

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HabitTemplate, HabitDifficulty } from "@/data/habit-catalog";

interface HabitCatalogCardProps {
  habit: HabitTemplate;
  onClick: () => void;
}

const DIFFICULTY_LABELS: Record<HabitDifficulty, { label: string; color: string }> = {
  easy: { label: "Лёгкая", color: "bg-green-500" },
  medium: { label: "Средняя", color: "bg-yellow-500" },
  advanced: { label: "Продвинутая", color: "bg-blue-500" },
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
  green: "border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
  blue: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
  purple: "border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20",
  orange: "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20",
  indigo: "border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20",
  yellow: "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
};

export const HabitCatalogCard = memo(({ habit, onClick }: HabitCatalogCardProps) => {
  const difficulty = DIFFICULTY_LABELS[habit.difficulty];
  const colorClass = COLOR_CLASSES[habit.color] || COLOR_CLASSES.green;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
        "border-l-4",
        colorClass
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Иконка */}
          <div className="text-3xl shrink-0">{habit.icon}</div>

          {/* Контент */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-base leading-tight">{habit.title}</h3>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 text-xs",
                  difficulty.color,
                  "text-white border-0"
                )}
              >
                {difficulty.label}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {habit.description}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[habit.category] || habit.category}
              </Badge>
              {habit.benefit && (
                <Badge variant="outline" className="text-xs">
                  💡 Польза
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

HabitCatalogCard.displayName = "HabitCatalogCard";

