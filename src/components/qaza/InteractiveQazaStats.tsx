// Интерактивная статистика для раздела каза
// Обновляется в реальном времени при добавлении намазов

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  Target,
  Flame,
  Trophy,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { calculateProgressStats, formatNumber, getPrayersArray } from "@/lib/prayer-utils";
import { cn } from "@/lib/utils";
import { format, subDays, subWeeks, subMonths, startOfWeek, startOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

type TimeRange = "week" | "month" | "3months" | "all";
type ViewMode = "overview" | "daily" | "weekly" | "prayers";

export const InteractiveQazaStats = () => {
  const { userData, loading, refreshData } = useUserData();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Автоматическое обновление при изменении данных (оптимизировано)
  useEffect(() => {
    if (!autoRefresh) return;

    let timeoutId: NodeJS.Timeout;
    const handleDataUpdate = () => {
      // Debounce обновлений - не чаще раза в секунду
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshData();
        setLastUpdate(new Date());
      }, 1000);
    };

    // Слушаем события обновления данных
    window.addEventListener('userDataUpdated', handleDataUpdate, { passive: true });
    window.addEventListener('prayerAdded', handleDataUpdate, { passive: true });
    window.addEventListener('goalUpdated', handleDataUpdate, { passive: true });

    // Периодическое обновление каждые 60 секунд (увеличено для производительности)
    const interval = setInterval(() => {
      refreshData();
      setLastUpdate(new Date());
    }, 60000);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('userDataUpdated', handleDataUpdate);
      window.removeEventListener('prayerAdded', handleDataUpdate);
      window.removeEventListener('goalUpdated', handleDataUpdate);
      clearInterval(interval);
    };
  }, [autoRefresh, refreshData]);

  // Расчет статистики
  const stats = useMemo(() => {
    if (!userData) return null;
    return calculateProgressStats(userData);
  }, [userData]);

  const prayers = useMemo(() => {
    if (!userData) return [];
    return getPrayersArray(userData);
  }, [userData]);

  // История прогресса (из localStorage)
  const progressHistory = useMemo(() => {
    try {
      const historyKey = "qaza_progress_history";
      const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
      return history as Array<{ date: string; completed: number; total: number }>;
    } catch {
      return [];
    }
  }, [lastUpdate]);

  // Фильтрация истории по выбранному периоду
  const filteredHistory = useMemo(() => {
    if (progressHistory.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "week":
        startDate = subWeeks(now, 1);
        break;
      case "month":
        startDate = subMonths(now, 1);
        break;
      case "3months":
        startDate = subMonths(now, 3);
        break;
      default:
        startDate = new Date(progressHistory[0]?.date || now);
    }

    return progressHistory.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate;
    });
  }, [progressHistory, timeRange]);

  // Ежедневная статистика
  const dailyStats = useMemo(() => {
    if (filteredHistory.length === 0) return [];

    const days = eachDayOfInterval({
      start: subDays(new Date(), timeRange === "week" ? 7 : timeRange === "month" ? 30 : 90),
      end: new Date(),
    });

    return days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const entry = filteredHistory.find((e) => e.date === dayKey);
      return {
        date: day,
        completed: entry?.completed || 0,
        total: entry?.total || 0,
      };
    });
  }, [filteredHistory, timeRange]);

  // Недельная статистика
  const weeklyStats = useMemo(() => {
    if (filteredHistory.length === 0) return [];

    const weeks: Array<{ week: string; completed: number; days: number }> = [];
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    for (let i = 0; i < (timeRange === "month" ? 4 : 12); i++) {
      const weekDate = subWeeks(weekStart, i);
      const weekKey = format(weekDate, "yyyy-MM-dd");
      const weekEntries = filteredHistory.filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate >= weekDate && entryDate < new Date(weekDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      });

      weeks.push({
        week: format(weekDate, "dd MMM", { locale: ru }),
        completed: weekEntries.reduce((sum, e) => sum + e.completed, 0),
        days: weekEntries.length,
      });
    }

    return weeks.reverse();
  }, [filteredHistory, timeRange]);

  // Изменение темпа
  const paceChange = useMemo(() => {
    if (dailyStats.length < 2) return null;

    const recent = dailyStats.slice(-7).reduce((sum, d) => sum + d.completed, 0) / 7;
    const previous = dailyStats.slice(-14, -7).reduce((sum, d) => sum + d.completed, 0) / 7;

    if (previous === 0) return null;

    const change = ((recent - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? "up" : change < 0 ? "down" : "same",
    };
  }, [dailyStats]);

  // Тренды по намазам
  const prayerTrends = useMemo(() => {
    return prayers.map((prayer) => {
      const progress = prayer.total > 0 ? (prayer.completed / prayer.total) * 100 : 0;
      return {
        ...prayer,
        progress,
        remaining: Math.max(0, prayer.total - prayer.completed),
      };
    });
  }, [prayers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-gray-500">Загрузка статистики...</span>
      </div>
    );
  }

  if (!userData || !stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Нет данных для отображения статистики</p>
        </CardContent>
      </Card>
    );
  }

  const maxDaily = Math.max(...dailyStats.map((d) => d.completed), 1);

  return (
    <div className="space-y-4">
      {/* Заголовок с автообновлением */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Интерактивная статистика
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Обновляется автоматически при добавлении намазов
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refreshData();
              setLastUpdate(new Date());
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
          <Badge variant="outline" className="text-xs">
            {format(lastUpdate, "HH:mm:ss")}
          </Badge>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-600">Прогресс</span>
              {paceChange && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  paceChange.direction === "up" ? "text-green-600" : "text-red-600"
                )}>
                  {paceChange.direction === "up" ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : paceChange.direction === "down" ? (
                    <ArrowDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  {paceChange.value.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-emerald-700">{stats.overallProgress}%</div>
            <Progress value={stats.overallProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-xs text-blue-600 mb-2">Темп</div>
            <div className="text-2xl font-bold text-blue-700">{stats.dailyPace}</div>
            <div className="text-xs text-blue-500 mt-1">намазов/день</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="text-xs text-orange-600 mb-2">Восполнено</div>
            <div className="text-2xl font-bold text-orange-700">{formatNumber(stats.totalCompleted)}</div>
            <div className="text-xs text-orange-500 mt-1">из {formatNumber(stats.totalMissed)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="text-xs text-purple-600 mb-2">Осталось</div>
            <div className="text-2xl font-bold text-purple-700">{formatNumber(stats.remaining)}</div>
            <div className="text-xs text-purple-500 mt-1">намазов</div>
          </CardContent>
        </Card>
      </div>

      {/* Вкладки */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="daily">По дням</TabsTrigger>
            <TabsTrigger value="weekly">По неделям</TabsTrigger>
            <TabsTrigger value="prayers">По намазам</TabsTrigger>
          </TabsList>

          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="3months">3 месяца</SelectItem>
              <SelectItem value="all">Всё время</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="overview" className="space-y-4">
          {/* График по дням */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Активность по дням</CardTitle>
              <CardDescription>
                Количество восполненных намазов за последние {timeRange === "week" ? "7" : timeRange === "month" ? "30" : "90"} дней
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-1">
                {dailyStats.slice(-(timeRange === "week" ? 7 : timeRange === "month" ? 30 : 90)).map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-300 cursor-pointer",
                        day.completed > 0
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-gray-100 hover:bg-gray-200"
                      )}
                      style={{
                        height: `${maxDaily > 0 ? (day.completed / maxDaily) * 100 : 0}%`,
                        minHeight: day.completed > 0 ? "4px" : "2px",
                      }}
                      title={`${format(day.date, "dd MMM", { locale: ru })}: ${day.completed} намазов`}
                    />
                    <span className="text-[10px] text-gray-500 hidden group-hover:block">
                      {day.completed}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {format(day.date, "dd", { locale: ru })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Прогресс по намазам */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Прогресс по типам намазов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prayerTrends.map((prayer) => (
                <div key={prayer.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{prayer.emoji}</span>
                      <span className="font-medium">{prayer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {prayer.completed} / {prayer.total}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {prayer.progress.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={prayer.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ежедневная статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dailyStats.slice().reverse().map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{format(day.date, "d MMMM yyyy", { locale: ru })}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(day.date, "EEEE", { locale: ru })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{day.completed}</p>
                      <p className="text-xs text-muted-foreground">намазов</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Недельная статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {weeklyStats.map((week, index) => {
                  const maxWeek = Math.max(...weeklyStats.map((w) => w.completed), 1);
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all duration-300 cursor-pointer",
                          week.completed > 0
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-gray-100"
                        )}
                        style={{
                          height: `${(week.completed / maxWeek) * 100}%`,
                          minHeight: week.completed > 0 ? "4px" : "2px",
                        }}
                        title={`${week.week}: ${week.completed} намазов за ${week.days} дней`}
                      />
                      <span className="text-[10px] text-gray-500 hidden group-hover:block">
                        {week.completed}
                      </span>
                      <span className="text-[10px] text-gray-400 text-center">
                        {week.week}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prayers" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {prayerTrends.map((prayer) => (
              <Card key={prayer.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-2xl">{prayer.emoji}</span>
                    {prayer.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Прогресс</span>
                    <span className="text-lg font-bold">{prayer.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={prayer.progress} className="h-3" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Восполнено</span>
                      <p className="font-semibold text-emerald-600">{prayer.completed}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Осталось</span>
                      <p className="font-semibold text-gray-600">{prayer.remaining}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

