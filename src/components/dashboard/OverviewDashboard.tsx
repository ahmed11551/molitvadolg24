import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUserData } from "@/hooks/useUserData";
import { useFastingTracker } from "@/hooks/useFastingTracker";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, Streak } from "@/types/spiritual-path";
import {
  Activity,
  ArrowUpRight,
  CalendarCheck,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";

const formatPercent = (value: number) => `${Math.min(100, Math.round(value))}%`;

const formatDate = (date?: string | Date) => {
  if (!date) return "не назначено";
  const parsed = typeof date === "string" ? new Date(date) : date;
  return parsed.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

const computePrayerProgress = (userData: ReturnType<typeof useUserData>["userData"]) => {
  if (!userData) {
    return {
      percent: 0,
      completed: 0,
      total: 0,
      remaining: 0,
    };
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
  return {
    percent,
    completed,
    total,
    remaining: Math.max(total - completed, 0),
  };
};

const getUrgentGoals = (goals: Goal[]) => {
  const now = new Date();
  return goals
    .filter((goal) => goal.end_date)
    .map((goal) => ({
      goal,
      daysLeft: goal.end_date
        ? Math.ceil(
            (new Date(goal.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,
    }))
    .filter((item) => item.daysLeft !== null && item.daysLeft <= 3 && item.daysLeft >= 0)
    .sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0))
    .slice(0, 3);
};

export const OverviewDashboard = () => {
  const { userData, loading } = useUserData();
  const { plans, summary } = useFastingTracker();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadGoals = async () => {
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
        if (mounted) {
          setGoalsLoading(false);
        }
      }
    };

    loadGoals();
    return () => {
      mounted = false;
    };
  }, []);

  const prayerProgress = useMemo(() => computePrayerProgress(userData), [userData]);

  const habitStats = useMemo(() => {
    if (!goals || goals.length === 0) {
      return {
        active: 0,
        zikrGoals: 0,
        habits: 0,
        dueToday: 0,
      };
    }

    const today = new Date().getDay();
    const dueToday = goals.filter((goal) => {
      if (!goal.daily_plan || goal.daily_plan === 0) return false;
      return goal.current_value < goal.daily_plan;
    }).length;

    return {
      active: goals.length,
      zikrGoals: goals.filter((goal) => goal.category === "zikr").length,
      habits: goals.filter((goal) => goal.type === "habit").length,
      dueToday,
      weekFocus: today,
    };
  }, [goals]);

  const urgentGoals = useMemo(() => getUrgentGoals(goals), [goals]);

  const streakHighlight = streaks.sort(
    (a, b) => (b.current_streak || 0) - (a.current_streak || 0)
  )[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gradient-card border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Каза-намазы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold">
                {prayerProgress.completed}/{prayerProgress.total}
              </p>
              <Badge variant="outline">{formatPercent(prayerProgress.percent)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Осталось {prayerProgress.remaining} обязательных намазов
            </p>
            <Progress value={prayerProgress.percent} />
            <div className="text-xs text-muted-foreground">
              {loading ? "Загрузка…" : "Данные обновлены автоматически"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-amber-500/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Посты и намерения
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold">
                {summary.totalCompleted}/{summary.totalTarget}
              </p>
              <Badge variant="outline">
                {summary.totalTarget > 0
                  ? formatPercent(summary.overallPercent)
                  : "ещё не задано"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Следующий пост: {formatDate(summary.nextFastDate)}
            </p>
            <Progress value={summary.overallPercent} />
            <div className="text-xs text-muted-foreground">
              {summary.overduePlans > 0
                ? `Внимание: ${summary.overduePlans} план(ов) просрочено`
                : "Все планы в графике"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Привычки и цели
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalsLoading ? (
              <div className="text-sm text-muted-foreground">Загружаем цели…</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-semibold">{habitStats.active}</p>
                    <p className="text-xs text-muted-foreground">Активные цели</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{habitStats.habits}</p>
                    <p className="text-xs text-muted-foreground">Привычки</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{habitStats.zikrGoals}</p>
                    <p className="text-xs text-muted-foreground">Цели по зикру</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{habitStats.dueToday}</p>
                    <p className="text-xs text-muted-foreground">Нуждаются сегодня</p>
                  </div>
                </div>
                {streakHighlight && (
                  <div className="rounded-lg border border-dashed border-primary/30 p-3 text-sm">
                    <p className="font-medium flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-primary" /> Серия
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Текущая серия: {streakHighlight.current_streak} дней, рекорд{" "}
                      {streakHighlight.longest_streak}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Фокусы дня
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {urgentGoals.length === 0 && !summary.nextFastDate ? (
              <p className="text-muted-foreground">
                Нет срочных задач. Спланируй новый вызов или добавь пост.
              </p>
            ) : (
              <>
                {summary.nextFastDate && (
                  <div className="rounded-md border p-3">
                    <p className="font-medium flex items-center gap-2">
                      Пост <ArrowUpRight className="w-4 h-4 text-primary" />
                    </p>
                    <p className="text-muted-foreground">
                      {formatDate(summary.nextFastDate)} • открой вкладку “Посты”, чтобы
                      скорректировать план
                    </p>
                  </div>
                )}
                {urgentGoals.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Срочные цели
                    </p>
                    {urgentGoals.map(({ goal, daysLeft }) => (
                      <div
                        key={goal.id}
                        className="rounded-md border border-amber-500/30 p-3"
                      >
                        <p className="font-medium">{goal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Осталось {daysLeft} дн. • {goal.current_value}/{goal.target_value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <Separator />
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {plans.slice(0, 3).map((plan) => (
                <Badge key={plan.id} variant="secondary">
                  {plan.title}: {plan.completedDays}/{plan.targetDays}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-primary" />
            Рекомендации
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            1. Заверши один план казы сегодня и закрепи успех в тасбихе с помощью
            цели по зикру.
          </p>
          <p>2. Добавь новый план постов на ближайшие белые дни месяца.</p>
          <p>3. Проверь привычки: streak держится, пока выполняешь хотя бы одну цель.</p>
        </CardContent>
      </Card>
    </div>
  );
};

