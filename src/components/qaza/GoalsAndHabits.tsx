// Компонент для целей и привычек

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, TrendingUp, Calendar, Sparkles, ShieldCheck, Handshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { localStorageAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { loadPendingTasbih, PendingTasbihEntry, removePendingTasbih } from "@/lib/tasbih-storage";

interface Goal {
  id: string;
  type: "monthly" | "weekly" | "daily";
  target: number;
  current: number;
  startDate: Date;
  endDate: Date;
  completed: boolean;
}

const GOALS_STORAGE_KEY = "prayer_debt_goals";

type HabitStatus = "pending" | "done" | "skip";

interface HabitCommitment {
  buddy: string;
  note?: string;
  since: string;
}

interface Habit {
  id: string;
  title: string;
  description?: string;
  skipAllowance: number;
  metricLabel: string;
  streak: number;
  longestStreak: number;
  history: Record<string, HabitStatus>;
  commitment?: HabitCommitment;
  createdAt: string;
}

const HABITS_STORAGE_KEY = "prayer_habit_tracker_v2";
const DAY_MS = 1000 * 60 * 60 * 24;

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
const todayKey = () => formatDateKey(new Date());

const getDateKeyNDaysAgo = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateKey(date);
};

const getLastNDays = (days: number) => {
  return Array.from({ length: days }).map((_, index) => {
    const offset = days - index - 1;
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return {
      key: formatDateKey(date),
      label: date.toLocaleDateString("ru-RU", { weekday: "short" }),
    };
  });
};

const getWeekBounds = (reference = new Date()) => {
  const start = new Date(reference);
  const day = start.getDay() === 0 ? 7 : start.getDay(); // make Sunday = 7
  start.setDate(start.getDate() - (day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const computeCurrentStreak = (history: Record<string, HabitStatus>): number => {
  let streak = 0;
  for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
    const key = getDateKeyNDaysAgo(dayOffset);
    const status = history[key];
    if (status === "done") {
      streak += 1;
    } else if (status === "skip") {
      continue;
    } else {
      break;
    }
  }
  return streak;
};

const computeLongestStreak = (history: Record<string, HabitStatus>): number => {
  const dates = Object.keys(history).sort();
  let current = 0;
  let best = 0;
  dates.forEach((key) => {
    const status = history[key];
    if (status === "done") {
      current += 1;
      best = Math.max(best, current);
    } else if (status === "skip") {
      // skip does not increase but also does not reset
    } else {
      current = 0;
    }
  });
  return best;
};

const recalcHabitStats = (habit: Habit): Habit => {
  return {
    ...habit,
    streak: computeCurrentStreak(habit.history),
    longestStreak: Math.max(habit.longestStreak, computeLongestStreak(habit.history)),
  };
};

const countSkipsThisWeek = (habit: Habit): number => {
  const { start, end } = getWeekBounds();
  return Object.entries(habit.history).filter(([date, status]) => {
    if (status !== "skip") return false;
    const current = new Date(date);
    return current >= start && current <= end;
  }).length;
};

export const GoalsAndHabits = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTarget, setNewGoalTarget] = useState(30);
  const [newGoalType, setNewGoalType] = useState<"monthly" | "weekly" | "daily">("monthly");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitTitle, setNewHabitTitle] = useState("Утренний тасбих");
  const [newHabitMetric, setNewHabitMetric] = useState("33 повторения");
  const [newHabitSkipAllowance, setNewHabitSkipAllowance] = useState(2);
  const [commitmentDrafts, setCommitmentDrafts] = useState<Record<string, { buddy: string; note: string }>>({});
  const [pendingTasbih, setPendingTasbih] = useState<PendingTasbihEntry[]>([]);

  useEffect(() => {
    loadGoals();
    // Автоматическое создание цели при первом запуске
    if (goals.length === 0) {
      createDefaultGoal();
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    const loadPending = () => setPendingTasbih(loadPendingTasbih());
    loadPending();
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<PendingTasbihEntry[]>).detail;
      if (detail) {
        setPendingTasbih(detail);
      } else {
        loadPending();
      }
    };
    window.addEventListener("pendingTasbihUpdated", handler);
    return () => window.removeEventListener("pendingTasbihUpdated", handler);
  }, []);

  const loadGoals = () => {
    const saved = localStorage.getItem(GOALS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved, (key, value) => {
          if (key === "startDate" || key === "endDate") {
            return new Date(value);
          }
          return value;
        });
        if (Array.isArray(parsed)) {
          setGoals(parsed);
        } else {
          console.warn("Goals data is not an array, resetting to empty");
          setGoals([]);
        }
      } catch (error) {
        console.error("Failed to parse goals from localStorage:", error);
        setGoals([]);
      }
    }
  };

  const saveGoals = (updatedGoals: Goal[]) => {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const loadHabits = () => {
    const saved = localStorage.getItem(HABITS_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setHabits(
          parsed.map((habit: Habit) => recalcHabitStats({ ...habit, history: habit.history || {} }))
        );
      }
    } catch (error) {
      console.error("Failed to parse habits:", error);
    }
  };

  const saveHabits = (updatedHabits: Habit[]) => {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedHabits));
    setHabits(updatedHabits);
  };

  const updateHabit = (habitId: string, updater: (habit: Habit) => Habit) => {
    saveHabits(
      habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        return recalcHabitStats(updater(habit));
      })
    );
  };

  const handleCreateHabit = () => {
    if (!newHabitTitle.trim()) {
      toast({
        title: "Добавьте название",
        description: "Например: «Вечерний wird»",
        variant: "destructive",
      });
      return;
    }

    const habit: Habit = {
      id: `habit_${Date.now()}`,
      title: newHabitTitle.trim(),
      description: newHabitMetric.trim(),
      skipAllowance: Math.max(0, newHabitSkipAllowance),
      metricLabel: newHabitMetric.trim(),
      streak: 0,
      longestStreak: 0,
      history: {},
      createdAt: new Date().toISOString(),
    };

    saveHabits([...habits, habit]);
    setNewHabitTitle("");
    setNewHabitMetric("33 повторения");
    toast({
      title: "Привычка создана",
      description: `Стартуем с лимитом ${habit.skipAllowance} skip-дней`,
    });
  };

  const handleHabitDone = (habitId: string) => {
    updateHabit(habitId, (habit) => ({
      ...habit,
      history: {
        ...habit.history,
        [todayKey()]: "done",
      },
    }));
    toast({
      title: "Засчитано",
      description: "Серия продолжена",
    });
  };

  const handleHabitSkip = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const used = countSkipsThisWeek(habit);
    if (used >= habit.skipAllowance) {
      toast({
        title: "Лимит исчерпан",
        description: "Вы использовали все skip-дни на этой неделе",
        variant: "destructive",
      });
      return;
    }

    updateHabit(habitId, (current) => ({
      ...current,
      history: {
        ...current.history,
        [todayKey()]: "skip",
      },
    }));

    toast({
      title: "Пропуск без штрафа",
      description: `Осталось ${Math.max(0, habit.skipAllowance - used - 1)} skip-дн. на этой неделе`,
    });
  };

  const handleCommitmentSave = (habitId: string) => {
    const draft = commitmentDrafts[habitId];
    if (!draft?.buddy?.trim()) {
      toast({
        title: "Укажите напарника",
        description: "Введите имя друга или наставника",
        variant: "destructive",
      });
      return;
    }
    updateHabit(habitId, (habit) => ({
      ...habit,
      commitment: {
        buddy: draft.buddy.trim(),
        note: draft.note?.trim(),
        since: new Date().toISOString(),
      },
    }));
    setCommitmentDrafts((prev) => ({
      ...prev,
      [habitId]: { buddy: "", note: "" },
    }));
    toast({
      title: "Обещание отправлено",
      description: "Теперь streak видит ещё один человек",
    });
  };

  const handleCommitmentRemove = (habitId: string) => {
    updateHabit(habitId, (habit) => ({
      ...habit,
      commitment: undefined,
    }));
    toast({
      title: "Обещание снято",
      description: "Можно создать новое позже",
    });
  };

  const createDefaultGoal = () => {
    const userData = localStorageAPI.getUserData();
    if (!userData) return;

    const totalRemaining =
      Object.values(userData.debt_calculation?.missed_prayers || {}).reduce((sum, val) => sum + val, 0) +
      Object.values(userData.debt_calculation?.travel_prayers || {}).reduce((sum, val) => sum + val, 0);

    // Автоматическая цель: восполнить 10% от оставшегося за месяц
    const monthlyTarget = Math.max(30, Math.ceil(totalRemaining * 0.1));

    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const defaultGoal: Goal = {
      id: `goal_${Date.now()}`,
      type: "monthly",
      target: monthlyTarget,
      current: 0,
      startDate: today,
      endDate: endOfMonth,
      completed: false,
    };

    saveGoals([defaultGoal]);
  };

  const updateGoalProgress = () => {
    const userData = localStorageAPI.getUserData();
    if (!userData) return;

    const totalCompleted = Object.values(userData.repayment_progress.completed_prayers).reduce(
      (sum, val) => sum + val,
      0
    );

    const updatedGoals = goals.map((goal) => {
      // Расчет текущего прогресса на основе даты начала цели
      const goalStartDate = new Date(goal.startDate);
      const daysSinceStart = Math.max(
        1,
        Math.floor((new Date().getTime() - goalStartDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Упрощенный расчет (в реальном приложении нужна история)
      const estimatedCurrent = Math.min(goal.target, Math.floor((totalCompleted / 30) * daysSinceStart));

      return {
        ...goal,
        current: estimatedCurrent,
        completed: estimatedCurrent >= goal.target,
      };
    });

    saveGoals(updatedGoals);
  };

  useEffect(() => {
    if (goals.length > 0) {
      updateGoalProgress();
    }
  }, [goals.length]);

  const handleCreateGoal = () => {
    const today = new Date();
    let endDate: Date;

    switch (newGoalType) {
      case "daily":
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case "weekly":
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case "monthly":
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
    }

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      type: newGoalType,
      target: newGoalTarget,
      current: 0,
      startDate: today,
      endDate,
      completed: false,
    };

    saveGoals([...goals, newGoal]);
    toast({
      title: "Цель создана",
      description: `Цель: ${newGoalTarget} намазов за ${newGoalType === "daily" ? "день" : newGoalType === "weekly" ? "неделю" : "месяц"}`,
    });
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case "daily":
        return "День";
      case "weekly":
        return "Неделя";
      case "monthly":
        return "Месяц";
      default:
        return type;
    }
  };

  const activeGoals = goals.filter((g) => !g.completed && new Date(g.endDate) >= new Date());
  const completedGoals = goals.filter((g) => g.completed);
  const habitSummary = {
    total: habits.length,
    avgStreak: habits.length
      ? Math.round(habits.reduce((acc, habit) => acc + habit.streak, 0) / habits.length)
      : 0,
    commitments: habits.filter((habit) => habit.commitment).length,
  };
  const recentDays = getLastNDays(7);

  const handleRemovePendingTasbih = (id: string) => {
    removePendingTasbih(id);
    setPendingTasbih(loadPendingTasbih());
    toast({
      title: "Удалено",
      description: "Сессия тасбиха скрыта",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {pendingTasbih.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle>Незавершённые тасбихи</CardTitle>
            </div>
            <CardDescription>Быстрый доступ к тому, что вы не завершили</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasbih.map((entry) => {
              const percent = entry.target
                ? Math.min(100, Math.round((entry.current / entry.target) * 100))
                : 0;
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-primary/20 bg-background/80 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{entry.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.current}/{entry.target} • обновлено{" "}
                        {new Date(entry.updatedAt).toLocaleTimeString("ru-RU")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/dhikr?goal=${entry.id}`)}
                      >
                        Продолжить
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePendingTasbih(entry.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                  <Progress value={percent} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-card shadow-medium border-primary/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Привычки и streak'и</CardTitle>
          </div>
          <CardDescription>
            Уникальная система: skip-дни без отката серии и обещание другу
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-background/80 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Активные привычки</p>
              <p className="text-2xl font-semibold">{habitSummary.total}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/80 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Средний streak</p>
              <p className="text-2xl font-semibold">{habitSummary.avgStreak} дн.</p>
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Commitment</p>
              <p className="text-2xl font-semibold">{habitSummary.commitments}</p>
              <p className="text-xs text-muted-foreground mt-1">Напарников подключено</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Название привычки</Label>
              <Input
                placeholder="Например: «Салаваты после фаджра»"
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                className="bg-background"
              />
              <Label className="mt-2">Что считается выполнением?</Label>
              <Input
                placeholder="33 повторения / 1 страница"
                value={newHabitMetric}
                onChange={(e) => setNewHabitMetric(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Skip-дней в неделю</Label>
              <Input
                type="number"
                min={0}
                max={7}
                value={newHabitSkipAllowance}
                onChange={(e) => setNewHabitSkipAllowance(parseInt(e.target.value) || 0)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Skip сохраняет streak, но лимитируется. По умолчанию 2.
              </p>
            </div>
          </div>
          <Button onClick={handleCreateHabit} className="w-full bg-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Добавить привычку
          </Button>
        </CardContent>
      </Card>

      {habits.length > 0 && (
        <div className="grid gap-4">
          {habits.map((habit) => {
            const skipUsed = countSkipsThisWeek(habit);
            const skipLeft = Math.max(0, habit.skipAllowance - skipUsed);
            return (
              <Card key={habit.id} className="bg-background/90 border border-primary/20 shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">{habit.title}</CardTitle>
                      <CardDescription>{habit.metricLabel}</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">Стрик: {habit.streak} дн.</Badge>
                      <Badge variant="outline">Рекорд: {habit.longestStreak} дн.</Badge>
                      <Badge variant={skipLeft > 0 ? "default" : "outline"}>
                        Skip осталось: {skipLeft}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1"
                      variant="default"
                      onClick={() => handleHabitDone(habit.id)}
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Выполнено сегодня
                    </Button>
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={() => handleHabitSkip(habit.id)}
                    >
                      Пропуск (не роняет серию)
                    </Button>
                  </div>

                  <div className="rounded-lg border border-dashed border-border/70 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Последние 7 дней
                    </p>
                    <div className="flex items-end gap-2">
                      {recentDays.map((day) => {
                        const status = habit.history[day.key] || "pending";
                        return (
                          <div key={`${habit.id}-${day.key}`} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] uppercase text-muted-foreground">
                              {day.label}
                            </span>
                            <div
                              className={cn(
                                "h-8 w-6 rounded-md text-[10px] font-semibold flex items-center justify-center",
                                status === "done" && "bg-emerald-500 text-white",
                                status === "skip" && "bg-amber-500/80 text-white",
                                status === "pending" && "bg-muted text-muted-foreground"
                              )}
                              title={
                                status === "done"
                                  ? "Выполнено"
                                  : status === "skip"
                                  ? "Skip-день"
                                  : "Не отмечено"
                              }
                            >
                              {status === "done" ? "✓" : status === "skip" ? "S" : "–"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-primary" />
                      <p className="font-semibold text-sm">Commitment</p>
                    </div>
                    {habit.commitment ? (
                      <div className="space-y-1 text-sm">
                        <p>
                          Обещание: <span className="font-semibold">{habit.commitment.buddy}</span>
                        </p>
                        {habit.commitment.note && (
                          <p className="text-muted-foreground">{habit.commitment.note}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          С {new Date(habit.commitment.since).toLocaleDateString("ru-RU")}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() => handleCommitmentRemove(habit.id)}
                        >
                          Снять обещание
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          placeholder="Имя напарника"
                          value={commitmentDrafts[habit.id]?.buddy ?? ""}
                          onChange={(e) =>
                            setCommitmentDrafts((prev) => ({
                              ...prev,
                              [habit.id]: { ...prev[habit.id], buddy: e.target.value },
                            }))
                          }
                          className="bg-background"
                        />
                        <Textarea
                          placeholder="Сообщение или мотивация"
                          value={commitmentDrafts[habit.id]?.note ?? ""}
                          onChange={(e) =>
                            setCommitmentDrafts((prev) => ({
                              ...prev,
                              [habit.id]: { ...prev[habit.id], note: e.target.value },
                            }))
                          }
                          rows={2}
                          className="resize-none bg-background"
                        />
                        <Button size="sm" onClick={() => handleCommitmentSave(habit.id)}>
                          Отправить обещание
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Card */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle>Создать цель</CardTitle>
          </div>
          <CardDescription>
            Установите цель по восполнению намазов для мотивации
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Тип цели</Label>
              <div className="flex gap-2">
                <Button
                  variant={newGoalType === "daily" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewGoalType("daily")}
                >
                  День
                </Button>
                <Button
                  variant={newGoalType === "weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewGoalType("weekly")}
                >
                  Неделя
                </Button>
                <Button
                  variant={newGoalType === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewGoalType("monthly")}
                >
                  Месяц
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalTarget">Цель (намазов)</Label>
              <Input
                id="goalTarget"
                type="number"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 0)}
                min={1}
                className="bg-background"
              />
            </div>
          </div>
          <Button onClick={handleCreateGoal} className="w-full bg-primary">
            <Target className="w-4 h-4 mr-2" />
            Создать цель
          </Button>
        </CardContent>
      </Card>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Активные цели</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGoals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
              const daysRemaining = Math.max(
                0,
                Math.ceil((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              );

              return (
                <div key={goal.id} className="p-4 rounded-lg border border-border bg-secondary/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getGoalTypeLabel(goal.type)}</Badge>
                      <span className="font-semibold">
                        {goal.current} / {goal.target} намазов
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Осталось: {daysRemaining} дн.
                    </div>
                  </div>
                  <Progress value={progress} className="h-3 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      До {new Date(goal.endDate).toLocaleDateString("ru-RU")}
                    </span>
                    <span>{progress}% выполнено</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <CardTitle>Выполненные цели</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 rounded-lg border border-primary/20 bg-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/10">
                        {getGoalTypeLabel(goal.type)}
                      </Badge>
                      <span className="font-semibold">
                        {goal.target} намазов выполнено!
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Завершено {new Date(goal.endDate).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {goals.length === 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              Нет активных целей. Создайте первую цель для отслеживания прогресса!
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

