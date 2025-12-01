// Виджет ежедневной сводки в стиле Goal: Habits & Tasks
// Показывает краткую сводку дня: выполненные задачи, прогресс, мотивацию

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Target,
  Flame,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { spiritualPathAPI } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { analyzeGoals } from "@/lib/goal-analyzer";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const DailySummaryWidget = () => {
  const { data: goalsData } = useQuery({
    queryKey: ["goals", "all"],
    queryFn: () => spiritualPathAPI.getGoals("all"),
    staleTime: 60000,
  });

  const { data: streaksData } = useQuery({
    queryKey: ["streaks"],
    queryFn: () => spiritualPathAPI.getStreaks(),
    staleTime: 60000,
  });

  const summary = useMemo(() => {
    if (!goalsData || !streaksData) return null;

    const stats = analyzeGoals(goalsData, streaksData);
    const today = new Date();
    const todayGoals = goalsData.filter((g) => {
      if (g.status !== "completed") return false;
      const updated = new Date(g.updated_at || g.created_at);
      return updated.toDateString() === today.toDateString();
    });

    return {
      completedToday: stats.completedToday,
      activeGoals: stats.activeGoals,
      streakDays: stats.streakDays,
      todayGoals,
      averageProgress: Math.round(stats.averageProgress),
    };
  }, [goalsData, streaksData]);

  if (!summary) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const motivationalMessage = summary.completedToday > 0
    ? "Отличный день! Продолжайте в том же духе!"
    : summary.activeGoals > 0
    ? "Время действовать! Выполните хотя бы одну цель сегодня."
    : "Создайте первую цель, чтобы начать свой духовный путь!";

  return (
    <Card className="bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 border-emerald-200 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Ежедневная сводка</h3>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(), "d MMMM yyyy", { locale: ru })}
            </p>
          </div>
          <Sparkles className="w-6 h-6 text-purple-500" />
        </div>

        {/* Основные метрики */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-white/80 border border-emerald-100">
            <div className="text-2xl font-bold text-emerald-700 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-5 h-5" />
              {summary.completedToday}
            </div>
            <div className="text-xs text-emerald-600 mt-1">Выполнено</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/80 border border-blue-100">
            <div className="text-2xl font-bold text-blue-700 flex items-center justify-center gap-1">
              <Target className="w-5 h-5" />
              {summary.activeGoals}
            </div>
            <div className="text-xs text-blue-600 mt-1">Активных</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/80 border border-orange-100">
            <div className="text-2xl font-bold text-orange-700 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />
              {summary.streakDays}
            </div>
            <div className="text-xs text-orange-600 mt-1">Серия</div>
          </div>
        </div>

        {/* Прогресс */}
        <div className="mb-4 p-3 rounded-xl bg-white/80 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Средний прогресс</span>
            <span className="text-sm font-bold text-gray-900">{summary.averageProgress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                summary.averageProgress >= 70
                  ? "bg-gradient-to-r from-emerald-500 to-green-500"
                  : summary.averageProgress >= 50
                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                  : "bg-gradient-to-r from-orange-500 to-orange-600"
              )}
              style={{ width: `${summary.averageProgress}%` }}
            />
          </div>
        </div>

        {/* Мотивационное сообщение */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 flex-1">{motivationalMessage}</p>
          </div>
        </div>

        {/* Выполненные сегодня цели */}
        {summary.todayGoals.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-gray-600 mb-2">Выполнено сегодня:</p>
            {summary.todayGoals.slice(0, 3).map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/80 border border-emerald-100"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-gray-700 flex-1 truncate">{goal.title}</span>
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                  Выполнено
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

