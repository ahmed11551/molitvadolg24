// AI Помощник в стиле Goal: Habits & Tasks
// Персональный AI-коуч, который анализирует прогресс и дает рекомендации

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  ChevronRight,
  Flame,
  Trophy,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Goal, Streak } from "@/types/spiritual-path";
import {
  analyzeGoals,
  generateInsights,
  generateRecommendations,
  generatePredictions,
} from "@/lib/goal-analyzer";

interface AIRecommendation {
  id: string;
  type: "motivation" | "warning" | "achievement" | "tip";
  title: string;
  message: string;
  action?: string;
  priority: "high" | "medium" | "low";
  icon: React.ReactNode;
}

interface DailySummary {
  completedToday: number;
  activeGoals: number;
  streakDays: number;
  achievements: string[];
  recommendations: AIRecommendation[];
}

export const AIAssistant = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [activeChat, setActiveChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "ai" | "user"; message: string }>>([]);
  const [userInput, setUserInput] = useState("");

  const loadData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const [goalsData, streaksData] = await Promise.allSettled([
        spiritualPathAPI.getGoals("all"),
        spiritualPathAPI.getStreaks(),
      ]);

      const validGoals = goalsData.status === "fulfilled" && Array.isArray(goalsData.value) 
        ? goalsData.value 
        : [];
      const validStreaks = streaksData.status === "fulfilled" && Array.isArray(streaksData.value)
        ? streaksData.value
        : [];

      setGoals(validGoals);
      setStreaks(validStreaks);

      // Анализируем данные
      const stats = analyzeGoals(validGoals, validStreaks);
      const insights = generateInsights(stats);
      const aiRecommendations = generateRecommendations(stats);

      // Формируем ежедневную сводку
      const summary: DailySummary = {
        completedToday: stats.completedToday,
        activeGoals: stats.activeGoals,
        streakDays: stats.streakDays,
        achievements: insights
          .filter(i => i.type === "achievement")
          .map(i => i.title),
        recommendations: generateAIRecommendations(stats, validGoals, validStreaks),
      };

      setDailySummary(summary);
      setRecommendations(summary.recommendations);
    } catch (error) {
      console.error("Error loading AI assistant data:", error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    loadData();

    // Автоматическое обновление
    let timeoutId: NodeJS.Timeout;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!loading) loadData();
      }, 2000);
    };

    window.addEventListener('goalUpdated', handleUpdate, { passive: true });
    window.addEventListener('prayerAdded', handleUpdate, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('goalUpdated', handleUpdate);
      window.removeEventListener('prayerAdded', handleUpdate);
    };
  }, [loadData, loading]);

  const handleSendMessage = useCallback(() => {
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setUserInput("");
    setChatMessages(prev => [...prev, { role: "user", message: userMessage }]);

    // Генерируем ответ AI
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage, goals, streaks);
      setChatMessages(prev => [...prev, { role: "ai", message: aiResponse }]);
    }, 500);
  }, [userInput, goals, streaks]);

  if (loading && !dailySummary) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Анализирую ваш прогресс...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Главная карточка AI помощника */}
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-purple-200 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  <Brain className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Ваш AI-помощник</CardTitle>
              <CardDescription>
                Анализирует ваш прогресс и дает персональные советы
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveChat(!activeChat)}
              className="rounded-full"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ежедневная сводка */}
          {dailySummary && (
            <div className="bg-white/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Сегодня</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                  {dailySummary.completedToday} выполнено
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{dailySummary.activeGoals}</div>
                  <div className="text-xs text-gray-500">Активных целей</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600 flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4" />
                    {dailySummary.streakDays}
                  </div>
                  <div className="text-xs text-gray-500">Дней подряд</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">{dailySummary.achievements.length}</div>
                  <div className="text-xs text-gray-500">Достижений</div>
                </div>
              </div>
            </div>
          )}

          {/* Топ рекомендация */}
          {recommendations.length > 0 && (
            <div className="bg-white/80 rounded-xl p-4 border-l-4 border-purple-500">
              <div className="flex items-start gap-3">
                {recommendations[0].icon}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1 break-words">{recommendations[0].title}</h4>
                  <p className="text-sm text-gray-600 break-words">{recommendations[0].message}</p>
                  {recommendations[0].action && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 p-0 h-auto text-purple-600"
                    >
                      {recommendations[0].action} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Чат с AI */}
      {activeChat && (
        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Чат с AI-помощником
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-lg">
              {chatMessages.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">
                  <Brain className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Начните диалог с AI-помощником</p>
                  <p className="text-xs mt-1">Спросите о прогрессе, получите советы</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "ai" && (
                      <Avatar className="w-6 h-6 bg-purple-500">
                        <AvatarFallback className="text-white text-xs">
                          <Brain className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[80%] text-sm break-words overflow-wrap-anywhere",
                        msg.role === "user"
                          ? "bg-purple-500 text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      )}
                    >
                      {msg.message}
                    </div>
                    {msg.role === "user" && (
                      <Avatar className="w-6 h-6 bg-gray-400">
                        <AvatarFallback className="text-white text-xs">Вы</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Спросите AI о вашем прогрессе..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button onClick={handleSendMessage} size="sm" className="bg-purple-500 hover:bg-purple-600">
                Отправить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Все рекомендации */}
      {recommendations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Персональные рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.slice(1).map((rec) => (
              <div
                key={rec.id}
                className={cn(
                  "p-3 rounded-lg border-l-4",
                  rec.type === "motivation" && "bg-blue-50 border-blue-500",
                  rec.type === "warning" && "bg-yellow-50 border-yellow-500",
                  rec.type === "achievement" && "bg-green-50 border-green-500",
                  rec.type === "tip" && "bg-purple-50 border-purple-500"
                )}
              >
                <div className="flex items-start gap-2">
                  {rec.icon}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 break-words">{rec.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 break-words">{rec.message}</p>
                </div>
                  {rec.priority === "high" && (
                    <Badge variant="destructive" className="text-xs">Важно</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Быстрые вопросы */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Быстрые вопросы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Как улучшить прогресс?",
              "Что делать дальше?",
              "Покажи статистику",
              "Дай мотивацию",
            ].map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onClick={() => {
                  setUserInput(question);
                  setActiveChat(true);
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Генерация AI рекомендаций
function generateAIRecommendations(
  stats: ReturnType<typeof analyzeGoals>,
  goals: Goal[],
  streaks: Streak[]
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // Рекомендация на основе прогресса
  if (stats.averageProgress < 30 && stats.activeGoals > 0) {
    recommendations.push({
      id: "focus-goals",
      type: "warning",
      title: "Сфокусируйтесь на главном",
      message: `У вас ${stats.activeGoals} активных целей, но средний прогресс только ${Math.round(stats.averageProgress)}%. Попробуйте сосредоточиться на 2-3 самых важных целях.`,
      action: "Показать цели",
      priority: "high",
      icon: <Target className="w-5 h-5 text-yellow-600" />,
    });
  }

  // Рекомендация на основе серии
  if (stats.streakDays === 0 && stats.activeGoals > 0) {
    recommendations.push({
      id: "start-streak",
      type: "motivation",
      title: "Начните серию сегодня!",
      message: "Выполните хотя бы одну цель сегодня, чтобы начать серию. Каждый день имеет значение!",
      action: "Показать цели",
      priority: "high",
      icon: <Flame className="w-5 h-5 text-orange-600" />,
    });
  } else if (stats.streakDays >= 7) {
    recommendations.push({
      id: "maintain-streak",
      type: "achievement",
      title: `Отличная серия! ${stats.streakDays} дней`,
      message: "Вы сохраняете постоянство! Продолжайте в том же духе. Пророк ﷺ сказал: «Самые любимые дела для Аллаха — постоянные, даже если они малы».",
      priority: "medium",
      icon: <Trophy className="w-5 h-5 text-green-600" />,
    });
  }

  // Рекомендация на основе близких к завершению целей
  if (stats.goalsNearCompletion.length > 0) {
    const goal = stats.goalsNearCompletion[0];
    recommendations.push({
      id: "complete-goal",
      type: "tip",
      title: "Почти у цели!",
      message: `"${goal.title}" — осталось всего ${Math.ceil(goal.target_value - goal.current_value)}. Завершите сегодня!`,
      action: "Показать цель",
      priority: "high",
      icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
    });
  }

  // Рекомендация на основе застопорившихся целей
  if (stats.stalledGoals.length > 0) {
    recommendations.push({
      id: "review-goals",
      type: "warning",
      title: "Требуют внимания",
      message: `${stats.stalledGoals.length} ${stats.stalledGoals.length === 1 ? "цель" : "цели"} без прогресса. Возможно, стоит пересмотреть или упростить?`,
      action: "Показать цели",
      priority: "medium",
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    });
  }

  // Мотивационная рекомендация
  if (stats.completedToday > 0) {
    recommendations.push({
      id: "great-day",
      type: "achievement",
      title: "Отличный день!",
      message: `Вы завершили ${stats.completedToday} ${stats.completedToday === 1 ? "цель" : "целей"} сегодня. Ма ша Аллах! Продолжайте в том же духе!`,
      priority: "low",
      icon: <Sparkles className="w-5 h-5 text-green-600" />,
    });
  }

  // Общая рекомендация
  if (recommendations.length === 0) {
    recommendations.push({
      id: "general-tip",
      type: "tip",
      title: "Совет от AI",
      message: "Начните с малого. Даже один аят Корана или одна молитва — это начало большого пути. Пророк ﷺ сказал: «Самые любимые дела для Аллаха — постоянные, даже если они малы».",
      priority: "low",
      icon: <Lightbulb className="w-5 h-5 text-purple-600" />,
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Генерация ответа AI на вопрос пользователя
function generateAIResponse(
  question: string,
  goals: Goal[],
  streaks: Streak[]
): string {
  const lowerQuestion = question.toLowerCase();

  // Анализ вопроса и генерация ответа
  if (lowerQuestion.includes("прогресс") || lowerQuestion.includes("статистик")) {
    const stats = analyzeGoals(goals, streaks);
    return `Ваш текущий прогресс:\n\n✅ Выполнено целей: ${stats.completedGoals}\n🔥 Серия: ${stats.streakDays} дней\n📊 Средний прогресс: ${Math.round(stats.averageProgress)}%\n\n${stats.averageProgress >= 70 ? "Отличная работа! Продолжайте в том же духе!" : "Есть куда расти! Сфокусируйтесь на активных целях."}`;
  }

  if (lowerQuestion.includes("улучшить") || lowerQuestion.includes("совет")) {
    const stats = analyzeGoals(goals, streaks);
    if (stats.stalledGoals.length > 0) {
      return `Рекомендую пересмотреть ${stats.stalledGoals.length} застопорившихся целей. Упростите их или удалите, чтобы сосредоточиться на важном. Также попробуйте выполнить хотя бы одну цель каждый день для поддержания серии.`;
    }
    return "Совет: сфокусируйтесь на 2-3 главных целях. Лучше выполнить несколько, чем распыляться на много. Также установите напоминания и отслеживайте прогресс ежедневно.";
  }

  if (lowerQuestion.includes("дальше") || lowerQuestion.includes("следующ")) {
    const stats = analyzeGoals(goals, streaks);
    if (stats.goalsNearCompletion.length > 0) {
      return `Рекомендую завершить "${stats.goalsNearCompletion[0].title}" — вы почти у цели! После этого создайте новую цель для дальнейшего развития.`;
    }
    return "Создайте новую цель или улучшите существующие. Помните: каждый маленький шаг приближает вас к успеху!";
  }

  if (lowerQuestion.includes("мотивац") || lowerQuestion.includes("вдохнов")) {
    const motivations = [
      "Пророк ﷺ сказал: «Самые любимые дела для Аллаха — постоянные, даже если они малы». Ваши усилия не напрасны!",
      "Аллах видит каждое ваше стремление к добру. Продолжайте идти вперёд!",
      "Каждый шаг имеет значение. Даже один аят Корана или одна молитва — это начало большого пути.",
      "Ваши усилия сегодня — это инвестиция в ваше будущее. Продолжайте!",
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  // Общий ответ
  return "Я ваш AI-помощник! Я могу помочь вам с анализом прогресса, дать советы по улучшению результатов и мотивировать вас. Спросите меня о вашем прогрессе, целях или попросите совета!";
}

