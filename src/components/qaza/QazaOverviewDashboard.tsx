// Упрощенный главный экран каза в стиле Qaza Tracker

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Calendar, 
  BarChart3,
  CheckCircle2,
  Clock,
  Target
} from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { getPrayersArray, calculateProgressStats, formatNumber } from "@/lib/prayer-utils";
import { PrayerProgressCard } from "./PrayerProgressCard";
import { LastPrayerIndicator } from "./LastPrayerIndicator";
import { QuickAddPrayerButton } from "./QuickAddPrayerButton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface QazaOverviewDashboardProps {
  onNavigateToCalculator?: () => void;
}

export const QazaOverviewDashboard = ({ onNavigateToCalculator }: QazaOverviewDashboardProps) => {
  const navigate = useNavigate();
  const { userData, loading } = useUserData();

  // Мемоизация данных
  const prayers = useMemo(() => getPrayersArray(userData), [userData]);
  const stats = useMemo(() => calculateProgressStats(userData), [userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-400">Загрузка...</div>
      </div>
    );
  }

  // Если нет данных, показываем приглашение к расчету
  if (!userData || !userData.debt_calculation) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Начните отслеживать каза</h3>
            <p className="text-sm text-gray-600 mb-6">
              Рассчитайте количество пропущенных намазов, чтобы начать восполнять их
            </p>
            <Button
              onClick={onNavigateToCalculator}
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Рассчитать долг
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Индикатор последнего восполненного намаза */}
      <LastPrayerIndicator />

      {/* Главная карточка прогресса */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">Общий прогресс</CardTitle>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {stats.overallProgress}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Круговой прогресс */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5f7ed"
                  strokeWidth="10"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={352}
                  strokeDashoffset={352 - (352 * stats.overallProgress) / 100}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {stats.overallProgress}%
                </span>
                <span className="text-xs text-gray-500">выполнено</span>
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-700">
                {formatNumber(stats.totalCompleted)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Восполнено</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-gray-700">
                {formatNumber(stats.remaining)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Осталось</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <p className="text-2xl font-bold text-blue-700">
                {stats.dailyPace}
              </p>
              <p className="text-xs text-blue-600 mt-1">В день</p>
            </div>
          </div>

          {/* Прогресс бар */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Прогресс</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(stats.totalCompleted)} / {formatNumber(stats.totalMissed)}
              </span>
            </div>
            <Progress 
              value={stats.overallProgress} 
              className="h-3 bg-gray-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Быстрая кнопка добавления */}
      <QuickAddPrayerButton />

      {/* Прогресс по типам намазов */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">По типам намазов</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/?tab=progress")}
            className="text-emerald-600"
          >
            Подробнее
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {prayers.map((prayer) => (
            <PrayerProgressCard key={prayer.name} {...prayer} />
          ))}
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center gap-2 border-2 hover:border-emerald-300 hover:bg-emerald-50"
          onClick={() => navigate("/?tab=plan")}
        >
          <Calendar className="w-6 h-6 text-emerald-600" />
          <span className="text-sm font-medium">План</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center gap-2 border-2 hover:border-emerald-300 hover:bg-emerald-50"
          onClick={() => navigate("/?tab=reports")}
        >
          <BarChart3 className="w-6 h-6 text-emerald-600" />
          <span className="text-sm font-medium">Отчёты</span>
        </Button>
      </div>

      {/* Информация о темпах */}
      {stats.daysToComplete > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  При текущем темпе
                </p>
                <p className="text-xs text-gray-600">
                  Завершите через {stats.monthsToComplete > 0 
                    ? `${stats.monthsToComplete} мес. ${stats.daysRemaining} дн.`
                    : `${stats.daysToComplete} дн.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

