// Компонент для целей и привычек

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { localStorageAPI } from "@/lib/api";

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

export const GoalsAndHabits = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTarget, setNewGoalTarget] = useState(30);
  const [newGoalType, setNewGoalType] = useState<"monthly" | "weekly" | "daily">("monthly");

  useEffect(() => {
    loadGoals();
    // Автоматическое создание цели при первом запуске
    if (goals.length === 0) {
      createDefaultGoal();
    }
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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
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

