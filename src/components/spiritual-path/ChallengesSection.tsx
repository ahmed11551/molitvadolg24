// Раздел челленджей для духовного пути
// Вдохновлено Habit Tracker: Daily Routine

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Trophy,
  Flame,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { ru } from "date-fns/locale";
import type { Goal } from "@/types/spiritual-path";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "prayer" | "quran" | "zikr" | "fasting" | "charity" | "general";
  duration: number; // дней
  target: number;
  current: number;
  startDate: Date;
  endDate: Date;
  participants?: number;
  difficulty: "easy" | "medium" | "hard";
  rewards: {
    badge?: string;
    points?: number;
    title?: string;
  };
  status: "not_started" | "active" | "completed" | "failed";
  progress: number; // 0-100
}

const PREDEFINED_CHALLENGES: Omit<Challenge, "id" | "current" | "progress" | "status" | "startDate" | "endDate">[] = [
  {
    title: "30 дней с Кораном",
    description: "Читайте хотя бы 1 страницу Корана каждый день в течение месяца",
    icon: "📖",
    category: "quran",
    duration: 30,
    target: 30,
    difficulty: "medium",
    rewards: {
      badge: "quran_reader_30",
      points: 100,
      title: "Читатель Корана",
    },
  },
  {
    title: "1000 дуа за долги",
    description: "Прочитайте 1000 дуа для прощения долгов",
    icon: "🤲",
    category: "zikr",
    duration: 40,
    target: 1000,
    difficulty: "hard",
    rewards: {
      badge: "dua_master",
      points: 200,
      title: "Мастер дуа",
    },
  },
  {
    title: "7 дней подряд",
    description: "Выполняйте все цели 7 дней подряд без пропусков",
    icon: "🔥",
    category: "general",
    duration: 7,
    target: 7,
    difficulty: "easy",
    rewards: {
      badge: "week_warrior",
      points: 50,
      title: "Воин недели",
    },
  },
  {
    title: "5000 салават",
    description: "Прочитайте 5000 салават на Пророка ﷺ",
    icon: "✨",
    category: "zikr",
    duration: 60,
    target: 5000,
    difficulty: "hard",
    rewards: {
      badge: "salawat_master",
      points: 300,
      title: "Мастер салават",
    },
  },
  {
    title: "Месяц восполнения",
    description: "Восполните 100 каза-намазов за месяц",
    icon: "🕌",
    category: "prayer",
    duration: 30,
    target: 100,
    difficulty: "medium",
    rewards: {
      badge: "qaza_warrior",
      points: 150,
      title: "Воин каза",
    },
  },
];

export const ChallengesSection = () => {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "available" | "completed">("active");

  useEffect(() => {
    loadChallenges();
    loadGoals();
  }, []);

  // Автоматическое обновление при изменении целей
  useEffect(() => {
    const handleGoalUpdate = () => {
      loadGoals();
      updateChallengesProgress();
    };

    window.addEventListener('goalUpdated', handleGoalUpdate);
    window.addEventListener('prayerAdded', handleGoalUpdate);

    return () => {
      window.removeEventListener('goalUpdated', handleGoalUpdate);
      window.removeEventListener('prayerAdded', handleGoalUpdate);
    };
  }, []);

  const loadChallenges = async () => {
    try {
      const saved = localStorage.getItem("spiritual_challenges");
      if (saved) {
        const parsed = JSON.parse(saved);
        setChallenges(parsed.map((c: any) => ({
          ...c,
          startDate: new Date(c.startDate),
          endDate: new Date(c.endDate),
        })));
      }
    } catch (error) {
      console.error("Error loading challenges:", error);
    }
  };

  const loadGoals = async () => {
    try {
      const goalsData = await spiritualPathAPI.getGoals("all");
      setGoals(goalsData);
    } catch (error) {
      console.error("Error loading goals:", error);
    }
  };

  const updateChallengesProgress = () => {
    setChallenges((prev) => {
      const updated = prev.map((challenge) => {
        if (challenge.status !== "active") return challenge;

        // Рассчитываем прогресс на основе целей
        let current = 0;
        const now = new Date();

        switch (challenge.category) {
          case "quran":
            current = goals
              .filter((g) => g.category === "quran" && g.status === "active")
              .reduce((sum, g) => sum + g.current_value, 0);
            break;
          case "zikr":
            if (challenge.title.includes("дуа")) {
              current = goals
                .filter((g) => g.category === "zikr" && g.title?.toLowerCase().includes("дуа"))
                .reduce((sum, g) => sum + g.current_value, 0);
            } else if (challenge.title.includes("салават")) {
              current = goals
                .filter((g) => g.category === "zikr" && g.title?.toLowerCase().includes("салават"))
                .reduce((sum, g) => sum + g.current_value, 0);
            }
            break;
          case "prayer":
            // Для каза используем данные из userData
            const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
            const completed = userData?.repayment_progress?.completed_prayers || {};
            current = Object.values(completed).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
            break;
          case "general":
            // Для общих челленджей считаем дни активности
            const activeDays = goals.filter((g) => {
              const updated = new Date(g.updated_at || g.created_at);
              return isAfter(updated, challenge.startDate);
            }).length;
            current = activeDays;
            break;
        }

        const progress = Math.min(100, (current / challenge.target) * 100);
        const isCompleted = current >= challenge.target;
        const isFailed = isAfter(now, challenge.endDate) && !isCompleted;

        return {
          ...challenge,
          current,
          progress,
          status: isCompleted ? "completed" : isFailed ? "failed" : "active",
        };
      });

      // Сохраняем обновленные челленджи
      localStorage.setItem("spiritual_challenges", JSON.stringify(updated));
      return updated;
    });
  };

  const startChallenge = (challengeTemplate: typeof PREDEFINED_CHALLENGES[0]) => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + challengeTemplate.duration);

    const newChallenge: Challenge = {
      id: `challenge_${Date.now()}`,
      ...challengeTemplate,
      current: 0,
      progress: 0,
      status: "active",
      startDate: now,
      endDate,
    };

    const updated = [...challenges, newChallenge];
    setChallenges(updated);
    localStorage.setItem("spiritual_challenges", JSON.stringify(updated));

    toast({
      title: "Челлендж начат!",
      description: challengeTemplate.title,
    });

    updateChallengesProgress();
  };

  const activeChallenges = useMemo(
    () => challenges.filter((c) => c.status === "active"),
    [challenges]
  );

  const availableChallenges = useMemo(() => {
    const activeIds = new Set(activeChallenges.map((c) => c.title));
    return PREDEFINED_CHALLENGES.filter((c) => !activeIds.has(c.title));
  }, [activeChallenges]);

  const completedChallenges = useMemo(
    () => challenges.filter((c) => c.status === "completed"),
    [challenges]
  );

  const getDifficultyColor = (difficulty: Challenge["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

  const getDaysRemaining = (challenge: Challenge) => {
    const now = new Date();
    if (isAfter(now, challenge.endDate)) return 0;
    return differenceInDays(challenge.endDate, now);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Челленджи
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Примите участие в челленджах и получите награды
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Активные ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Доступные ({availableChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Завершённые ({completedChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-muted-foreground">Нет активных челленджей</p>
                <Button
                  onClick={() => setActiveTab("available")}
                  className="mt-4"
                  variant="outline"
                >
                  Выбрать челлендж
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeChallenges.map((challenge) => {
              const daysRemaining = getDaysRemaining(challenge);
              return (
                <Card key={challenge.id} className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{challenge.icon}</div>
                        <div>
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <CardDescription>{challenge.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty === "easy" ? "Легко" : challenge.difficulty === "medium" ? "Средне" : "Сложно"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Прогресс</span>
                        <span className="font-semibold">
                          {challenge.current} / {challenge.target}
                        </span>
                      </div>
                      <Progress value={challenge.progress} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {daysRemaining > 0 ? `Осталось ${daysRemaining} дн.` : "Время вышло"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-muted-foreground">
                          {challenge.rewards.points || 0} очков
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {availableChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-muted-foreground">Все челленджи начаты!</p>
              </CardContent>
            </Card>
          ) : (
            availableChallenges.map((challenge) => (
              <Card key={challenge.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{challenge.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        <CardDescription>{challenge.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty === "easy" ? "Легко" : challenge.difficulty === "medium" ? "Средне" : "Сложно"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Длительность:</span>
                      <p className="font-semibold">{challenge.duration} дней</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Цель:</span>
                      <p className="font-semibold">{challenge.target}</p>
                    </div>
                  </div>

                  {challenge.rewards && (
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-900">Награды:</span>
                      </div>
                      <div className="space-y-1 text-sm text-yellow-800">
                        {challenge.rewards.badge && (
                          <p>🏅 Бейдж: {challenge.rewards.title}</p>
                        )}
                        {challenge.rewards.points && (
                          <p>⭐ {challenge.rewards.points} очков</p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => startChallenge(challenge)}
                    className="w-full"
                    size="lg"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Начать челлендж
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-muted-foreground">Пока нет завершённых челленджей</p>
              </CardContent>
            </Card>
          ) : (
            completedChallenges.map((challenge) => (
              <Card key={challenge.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{challenge.icon}</div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {challenge.title}
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </CardTitle>
                        <CardDescription>{challenge.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      Завершён
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Завершён</p>
                      <p className="font-semibold">
                        {format(challenge.endDate, "d MMMM yyyy", { locale: ru })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold">{challenge.rewards.points || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">очков получено</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

