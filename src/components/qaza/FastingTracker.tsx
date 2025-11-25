import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useFastingTracker } from "@/hooks/useFastingTracker";
import { cn } from "@/lib/utils";
import { CalendarDays, Flame, Plus, Sparkles } from "lucide-react";

const formatDate = (date?: string) => {
  if (!date) return "не запланировано";
  const parsed = new Date(date);
  return parsed.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

const formatPercent = (value: number) => Math.round(value);

const getPlanAccent = (type: string) => {
  switch (type) {
    case "ramadan":
      return "border-primary/40 shadow-primary/10";
    case "qaza":
      return "border-amber-500/40 shadow-amber-500/10";
    case "nafl":
      return "border-emerald-500/40 shadow-emerald-500/10";
    default:
      return "border-muted/60";
  }
};

export const FastingTracker = () => {
  const { plans, summary, logFast, scheduleFast, cancelScheduledDate, changeTarget } =
    useFastingTracker();
  const [pendingDate, setPendingDate] = useState<Record<string, string>>({});
  const [pendingTarget, setPendingTarget] = useState<Record<string, string>>({});

  const nextFocus = useMemo(() => {
    const withUpcoming = plans
      .filter((plan) => plan.upcomingDates.length > 0)
      .sort((a, b) => a.upcomingDates[0].localeCompare(b.upcomingDates[0]));
    return withUpcoming[0];
  }, [plans]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-primary/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Посты и намерения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-3xl font-semibold">
                {summary.totalCompleted}/{summary.totalTarget} дней
              </p>
              <p className="text-muted-foreground text-sm">
                {summary.overallPercent > 0
                  ? `Достигнуто ${formatPercent(summary.overallPercent)}% плана`
                  : "Начни с первого поста сегодня"}
              </p>
            </div>
            {summary.nextFastDate && (
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm">
                <CalendarDays className="w-4 h-4 text-primary" />
                Следующий пост: {formatDate(summary.nextFastDate)}
              </div>
            )}
          </div>
          <Progress value={summary.overallPercent} />
          {nextFocus && (
            <div className="rounded-lg border border-dashed border-primary/30 p-3 text-sm">
              <p className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Фокус недели
              </p>
              <p className="mt-1 text-muted-foreground">
                {nextFocus.focusText || nextFocus.title}: запланировано{" "}
                {formatDate(nextFocus.upcomingDates[0])}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const completionPercent =
            plan.targetDays > 0
              ? Math.min(100, (plan.completedDays / plan.targetDays) * 100)
              : 0;
          const nextDate = plan.upcomingDates[0];

          return (
            <Card
              key={plan.id}
              className={cn(
                "bg-background/90 backdrop-blur-sm border",
                getPlanAccent(plan.type)
              )}
            >
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <Badge variant="outline">Серия {plan.streak}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Лучший рекорд: {plan.streakBest} • Цель: {plan.targetDays} дней
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Выполнено {plan.completedDays}/{plan.targetDays}
                    </span>
                    <span>{formatPercent(completionPercent)}%</span>
                  </div>
                  <Progress value={completionPercent} className="mt-2" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1 rounded-md border border-dashed p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Следующий пост
                    </p>
                    <p className="text-lg font-semibold">{formatDate(nextDate)}</p>
                    {nextDate && (
                      <Button
                        variant="link"
                        className="h-auto px-0 text-xs text-muted-foreground"
                        onClick={() => cancelScheduledDate(plan.id, nextDate)}
                      >
                        Отменить
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Настроить цель
                    </label>
                    <Input
                      type="number"
                      min={plan.completedDays}
                      value={
                        pendingTarget[plan.id] ?? plan.targetDays.toString()
                      }
                      onChange={(event) =>
                        setPendingTarget((prev) => ({
                          ...prev,
                          [plan.id]: event.target.value,
                        }))
                      }
                      onBlur={() => {
                        const raw = pendingTarget[plan.id];
                        if (!raw) return;
                        const parsed = parseInt(raw, 10);
                        if (Number.isFinite(parsed)) {
                          changeTarget(plan.id, parsed);
                        }
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Запланировать дни</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="date"
                      value={pendingDate[plan.id] ?? ""}
                      onChange={(event) =>
                        setPendingDate((prev) => ({
                          ...prev,
                          [plan.id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const date = pendingDate[plan.id];
                        if (!date) return;
                        scheduleFast(plan.id, date);
                        setPendingDate((prev) => ({ ...prev, [plan.id]: "" }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Добавить
                    </Button>
                  </div>
                  {plan.upcomingDates.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {plan.upcomingDates.slice(0, 5).map((date) => (
                        <span
                          key={`${plan.id}-${date}`}
                          className="rounded-full border px-2 py-1"
                        >
                          {formatDate(date)}
                        </span>
                      ))}
                      {plan.upcomingDates.length > 5 && (
                        <span>+ ещё {plan.upcomingDates.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => logFast(plan.id)}
                  variant="default"
                >
                  Отметить пост сегодня
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

