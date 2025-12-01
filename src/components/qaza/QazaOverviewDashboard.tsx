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
import { CompactProgressPanel } from "./CompactProgressPanel";
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

      {/* Компактная интерактивная панель прогресса */}
      <CompactProgressPanel />

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

