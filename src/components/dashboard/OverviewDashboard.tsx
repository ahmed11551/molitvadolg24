// Обзор в стиле Goal app - чистый минималистичный дизайн

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useUserData } from "@/hooks/useUserData";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, Streak } from "@/types/spiritual-path";
import {
  ArrowRight,
  Flame,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const computePrayerProgress = (userData: ReturnType<typeof useUserData>["userData"]) => {
  if (!userData) {
    return { percent: 0, completed: 0, total: 0, remaining: 0 };
  }

  const { debt_calculation, repayment_progress } = userData;
  const total =
    Object.values(debt_calculation?.missed_prayers || {}).reduce(
      (acc, value) => acc + (value || 0),
      0
    ) || 0;
  const completed =
    Object.values(repayment_progress?.completed_prayers || {}).reduce(
      (acc, value) => acc + (value || 0),
      0
    ) || 0;

  const percent = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  return { percent, completed, total, remaining: Math.max(total - completed, 0) };
};

export const OverviewDashboard = () => {
  const navigate = useNavigate();
  const { userData, loading } = useUserData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [activeGoals, streakData] = await Promise.all([
          spiritualPathAPI.getGoals("active"),
          spiritualPathAPI.getStreaks(),
        ]);
        if (!mounted) return;
        setGoals(activeGoals);
        setStreaks(streakData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        if (mounted) setGoalsLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const prayerProgress = useMemo(() => computePrayerProgress(userData), [userData]);
  const currentStreak = streaks.find(s => s.current_streak > 0)?.current_streak || 0;
  const activeGoalsCount = goals.length;
  
  // Цели на сегодня
  const todayGoals = goals.filter(g => {
    if (!g.daily_plan || g.daily_plan === 0) return false;
    return g.current_value < g.daily_plan;
  }).slice(0, 3);

  // Срочные цели (осталось меньше 3 дней)
  const urgentGoals = goals
    .filter(g => g.end_date)
    .filter(g => {
      const daysLeft = Math.ceil(
        (new Date(g.end_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 3 && daysLeft >= 0;
    })
    .slice(0, 2);

  if (loading || goalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Каза-намазы</h2>
              <p className="text-sm text-muted-foreground">
                {prayerProgress.remaining > 0 
                  ? `Осталось ${prayerProgress.remaining} намазов`
                  : "Все намазы восполнены!"
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => navigate("/?tab=calculator")}
            >
              Подробнее
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center justify-center py-4">
            <CircularProgress
              value={prayerProgress.completed}
              max={prayerProgress.total || 1}
              size={180}
              strokeWidth={14}
              color={prayerProgress.percent >= 100 ? "hsl(var(--chart-2))" : "hsl(var(--primary))"}
            >
              <div className="text-center">
                <span className="text-4xl font-bold">{Math.round(prayerProgress.percent)}%</span>
                <p className="text-xs text-muted-foreground mt-1">выполнено</p>
              </div>
            </CircularProgress>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 rounded-2xl bg-muted/50">
              <p className="text-2xl font-bold text-primary">{prayerProgress.completed}</p>
              <p className="text-xs text-muted-foreground">Восполнено</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-muted/50">
              <p className="text-2xl font-bold">{prayerProgress.total}</p>
              <p className="text-xs text-muted-foreground">Всего долгов</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate("/goals")}
          className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center hover:bg-blue-500/15 transition-colors"
        >
          <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{activeGoalsCount}</p>
          <p className="text-xs text-muted-foreground">Целей</p>
        </button>

        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Дней подряд</p>
        </div>

        <button
          onClick={() => navigate("/tasbih")}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center hover:bg-emerald-500/15 transition-colors"
        >
          <Sparkles className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">∞</p>
          <p className="text-xs text-muted-foreground">Тасбих</p>
        </button>
      </div>

      {/* Today's Tasks */}
      {todayGoals.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                На сегодня
              </h3>
              <Badge variant="secondary">{todayGoals.length}</Badge>
            </div>
            <div className="space-y-3">
              {todayGoals.map((goal) => {
                const progress = goal.daily_plan 
                  ? (goal.current_value / goal.daily_plan) * 100 
                  : 0;
                return (
                  <button
                    key={goal.id}
                    onClick={() => navigate(`/tasbih?goal=${goal.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  >
                    <CircularProgress
                      value={goal.current_value}
                      max={goal.daily_plan || 1}
                      size={44}
                      strokeWidth={4}
                      showValue={false}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.current_value} / {goal.daily_plan}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Urgent Goals */}
      {urgentGoals.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-4 text-amber-600">
              <TrendingUp className="w-4 h-4" />
              Срочные цели
            </h3>
            <div className="space-y-3">
              {urgentGoals.map((goal) => {
                const daysLeft = Math.ceil(
                  (new Date(goal.end_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const progress = (goal.current_value / goal.target_value) * 100;
                
                return (
                  <button
                    key={goal.id}
                    onClick={() => navigate(`/tasbih?goal=${goal.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-background/80 hover:bg-background transition-colors text-left"
                  >
                    <CircularProgress
                      value={goal.current_value}
                      max={goal.target_value}
                      size={44}
                      strokeWidth={4}
                      showValue={false}
                      color="hsl(var(--chart-4))"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.current_value} / {goal.target_value}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 text-amber-600 border-amber-500/30">
                      {daysLeft}д
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 rounded-2xl flex flex-col items-center gap-2"
          onClick={() => navigate("/goals")}
        >
          <Target className="w-5 h-5 text-primary" />
          <span className="text-sm">Новая цель</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 rounded-2xl flex flex-col items-center gap-2"
          onClick={() => navigate("/tasbih")}
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm">Тасбих</span>
        </Button>
      </div>

      {/* Empty State */}
      {activeGoalsCount === 0 && prayerProgress.total === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Начните свой путь</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Рассчитайте долги или создайте первую цель
            </p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" className="rounded-full">
                Калькулятор
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/goals")}>
                Цели
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
