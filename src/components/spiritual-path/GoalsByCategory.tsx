// Компонент для отображения целей по категориям (компактный список)

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  Plus, 
  Target,
  BookOpen,
  Prayer,
  Sparkles,
  Heart,
  GraduationCap,
  Star,
  ArrowUp,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal, GoalCategory } from "@/types/spiritual-path";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { GoalCard } from "./GoalCard";
import { CreateGoalDialog } from "./CreateGoalDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { hasFeature } from "@/types/subscription";
import { SubscriptionGate } from "./SubscriptionGate";
import { Link } from "react-router-dom";

interface GoalsByCategoryProps {
  goals: Goal[];
  onRefresh: () => void;
}

type ViewMode = "categories" | "category-goals" | "goal-detail";

const CATEGORY_INFO: Record<GoalCategory, { label: string; icon: React.ReactNode; color: string }> = {
  prayer: { 
    label: "Намазы", 
    icon: <Prayer className="w-5 h-5" />,
    color: "text-emerald-600 bg-emerald-50"
  },
  quran: { 
    label: "Коран", 
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-blue-600 bg-blue-50"
  },
  zikr: { 
    label: "Зикры", 
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-purple-600 bg-purple-50"
  },
  sadaqa: { 
    label: "Садака", 
    icon: <Heart className="w-5 h-5" />,
    color: "text-pink-600 bg-pink-50"
  },
  knowledge: { 
    label: "Знания", 
    icon: <GraduationCap className="w-5 h-5" />,
    color: "text-orange-600 bg-orange-50"
  },
  names_of_allah: { 
    label: "99 имен Аллаха", 
    icon: <Star className="w-5 h-5" />,
    color: "text-amber-600 bg-amber-50"
  },
};

export const GoalsByCategory = ({ goals, onRefresh }: GoalsByCategoryProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("categories");
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { tier } = useSubscription();

  // Группируем цели по категориям
  const goalsByCategory = useMemo(() => {
    const grouped: Record<GoalCategory, Goal[]> = {
      prayer: [],
      quran: [],
      zikr: [],
      sadaqa: [],
      knowledge: [],
      names_of_allah: [],
    };

    goals.forEach(goal => {
      if (goal.category in grouped) {
        grouped[goal.category as GoalCategory].push(goal);
      }
    });

    return grouped;
  }, [goals]);

  // Подсчитываем количество целей по категориям
  const categoryCounts = useMemo(() => {
    const counts: Record<GoalCategory, number> = {
      prayer: 0,
      quran: 0,
      zikr: 0,
      sadaqa: 0,
      knowledge: 0,
      names_of_allah: 0,
    };

    Object.keys(goalsByCategory).forEach(cat => {
      counts[cat as GoalCategory] = goalsByCategory[cat as GoalCategory].length;
    });

    return counts;
  }, [goalsByCategory]);

  // Проверяем ограничение на количество целей
  const maxGoals = hasFeature(tier, "unlimited_goals") ? Infinity : 7;
  const canAddGoal = goals.length < maxGoals;

  const handleCategoryClick = (category: GoalCategory) => {
    setSelectedCategory(category);
    setViewMode("category-goals");
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setViewMode("goal-detail");
  };

  const handleBack = () => {
    if (viewMode === "goal-detail") {
      setViewMode("category-goals");
      setSelectedGoal(null);
    } else {
      setViewMode("categories");
      setSelectedCategory(null);
    }
  };

  // Экран категорий
  if (viewMode === "categories") {
    return (
      <div className="space-y-4">
        {/* Заголовок с кнопкой добавления */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Цели
          </h2>
          {canAddGoal ? (
            <CreateGoalDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              onGoalCreated={onRefresh}
            >
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Добавить цель
              </Button>
            </CreateGoalDialog>
          ) : (
            <SubscriptionGate
              feature="unlimited_goals"
              requiredTier="mutahsin"
              featureName="Неограниченное количество целей"
              description={`У вас ${goals.length} целей. Для добавления большего количества перейдите на PRO версию.`}
            >
              <Button size="sm" variant="outline" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Лимит достигнут
              </Button>
            </SubscriptionGate>
          )}
        </div>

        {/* Блок пропущенных намазов */}
        <Card className="border-2 border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Prayer className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Пропущенные намазы</h3>
                  <p className="text-sm text-gray-600">Рассчитайте и восполните пропущенные намазы</p>
                </div>
              </div>
              <Link to="/">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Посчитать намазы
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Список категорий */}
        <div className="space-y-2">
          {(Object.keys(CATEGORY_INFO) as GoalCategory[]).map((category) => {
            const count = categoryCounts[category];
            const info = CATEGORY_INFO[category];
            
            if (count === 0) return null;

            return (
              <Card
                key={category}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleCategoryClick(category)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", info.color)}>
                        {info.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{info.label}</h3>
                        <p className="text-sm text-gray-500">
                          {count} {count === 1 ? "цель" : count < 5 ? "цели" : "целей"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Кнопка быстрого возврата наверх */}
        <div className="fixed bottom-20 right-4 z-10">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full shadow-lg"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Экран списка целей в категории
  if (viewMode === "category-goals" && selectedCategory) {
    const categoryGoals = goalsByCategory[selectedCategory];
    const info = CATEGORY_INFO[selectedCategory];

    return (
      <div className="space-y-4">
        {/* Заголовок с кнопкой назад */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", info.color)}>
            {info.icon}
          </div>
          <h2 className="text-2xl font-bold flex-1">{info.label}</h2>
          {canAddGoal && (
            <CreateGoalDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              onGoalCreated={onRefresh}
            >
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </CreateGoalDialog>
          )}
        </div>

        {/* Список целей */}
        <div className="space-y-2">
          {categoryGoals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Нет целей в этой категории</p>
              </CardContent>
            </Card>
          ) : (
            categoryGoals.map((goal, index) => {
              const progressPercent = goal.target_value > 0 
                ? Math.min(100, (goal.current_value / goal.target_value) * 100) 
                : 0;
              
              const daysRemaining = goal.end_date 
                ? Math.max(0, Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                : null;
              
              const isOverdue = goal.end_date && new Date(goal.end_date) < new Date() && goal.status === "active";
              const isUrgent = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;

              return (
                <Card
                  key={goal.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all",
                    isOverdue && "border-red-300 bg-red-50",
                    isUrgent && !isOverdue && "border-yellow-300 bg-yellow-50"
                  )}
                  onClick={() => handleGoalClick(goal)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{goal.title}</h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Просрочено
                              </Badge>
                            )}
                            {isUrgent && !isOverdue && (
                              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                                <Clock className="w-3 h-3 mr-1" />
                                Срочно
                              </Badge>
                            )}
                            {goal.status === "completed" && (
                              <Badge variant="default" className="text-xs bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Выполнено
                              </Badge>
                            )}
                          </div>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {goal.current_value} / {goal.target_value}
                          </span>
                          {daysRemaining !== null && (
                            <span>
                              {daysRemaining === 0 ? "Сегодня" : `Осталось ${daysRemaining} ${daysRemaining === 1 ? "день" : daysRemaining < 5 ? "дня" : "дней"}`}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                progressPercent >= 100 ? "bg-green-500" : "bg-primary"
                              )}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Экран детальной карточки цели
  if (viewMode === "goal-detail" && selectedGoal) {
    return (
      <GoalCard
        goal={selectedGoal}
        onBack={handleBack}
        onUpdate={onRefresh}
      />
    );
  }

  return null;
};
