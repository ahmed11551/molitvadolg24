// Компонент для AI-отчетов
// Анализирует реальные данные пользователя

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Sparkles,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { AIInsight, Goal, Streak, Badge as BadgeType } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { hasFeature } from "@/types/subscription";
import { SubscriptionGate } from "./SubscriptionGate";
import { 
  analyzeGoals, 
  generateInsights, 
  generateRecommendations, 
  generatePredictions 
} from "@/lib/goal-analyzer";

export const AIReports = () => {
  const { toast } = useToast();
  const { tier } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<ReturnType<typeof generatePredictions>>([]);
  const [stats, setStats] = useState<ReturnType<typeof analyzeGoals> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsData, streaksData] = await Promise.all([
        spiritualPathAPI.getGoals("all"),
        spiritualPathAPI.getStreaks(),
      ]);
      
      setGoals(goalsData);
      setStreaks(streaksData);
      
      // Анализируем данные
      const analyzedStats = analyzeGoals(goalsData, streaksData);
      setStats(analyzedStats);
      
      // Генерируем инсайты
      const generatedInsights = generateInsights(analyzedStats);
      setInsights(generatedInsights);
      
      // Генерируем рекомендации
      const generatedRecommendations = generateRecommendations(analyzedStats);
      setRecommendations(generatedRecommendations);
      
      // Генерируем прогнозы
      const generatedPredictions = generatePredictions(analyzedStats);
      setPredictions(generatedPredictions);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "achievement":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "trend":
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "motivation":
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      default:
        return <Brain className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getInsightColor = (type: AIInsight["type"]) => {
    switch (type) {
      case "achievement":
        return "bg-green-50 border-green-200";
      case "trend":
        return "bg-blue-50 border-blue-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "motivation":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-gray-500">Анализируем данные...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Brain className="w-6 h-6 text-emerald-500" />
            AI-анализ
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Персональные инсайты на основе ваших данных
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Обновить
        </Button>
      </div>

      {/* Основные метрики */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-700">{stats.completedGoals}</div>
              <div className="text-xs text-emerald-600">Выполнено</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.activeGoals}</div>
              <div className="text-xs text-blue-600">Активных</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-700 flex items-center justify-center gap-1">
                {stats.streakDays} <Flame className="w-5 h-5" />
              </div>
              <div className="text-xs text-orange-600">Дней подряд</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.totalActions}</div>
              <div className="text-xs text-purple-600">Действий</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Инсайты */}
      {insights.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Инсайты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-xl border flex items-start gap-3",
                  getInsightColor(insight.type)
                )}
              >
                <div className="mt-0.5 flex-shrink-0">{getInsightIcon(insight.type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                  {insight.metric && insight.value !== undefined && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {insight.metric}: {insight.value}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Рекомендации - только для PRO и Premium */}
      <SubscriptionGate
        feature="ai_reports_advanced"
        requiredTier="mutahsin"
        featureName="Персонализированные рекомендации"
        description="Расширенные AI-рекомендации доступны в тарифе Мутахсин"
      >
        {recommendations.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                Рекомендации
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Прогнозы - только для Premium */}
      <SubscriptionGate
        feature="ai_reports_premium"
        requiredTier="sahib_al_waqf"
        featureName="Прогнозная аналитика"
        description="Глубинные прогнозы и инсайты доступны в тарифе Сахиб аль-Вакф"
      >
        {predictions.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Прогнозы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {predictions.map((prediction, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{prediction.metric}</h4>
                    <Badge variant="outline" className="text-xs">
                      {prediction.confidence}% уверенность
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-blue-700 mb-1">{prediction.predicted_value}</p>
                  <p className="text-xs text-gray-500">{prediction.timeframe}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </SubscriptionGate>

      {/* Если нет данных */}
      {goals.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="py-12 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-900 mb-2">Нет данных для анализа</h3>
            <p className="text-sm text-gray-500 mb-4">
              Создайте первую цель, чтобы AI начал анализировать ваш прогресс
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

