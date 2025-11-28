// Обзор - дизайн как в Goal app с карточками целей

import { useEffect, useMemo, useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, Streak } from "@/types/spiritual-path";
import {
  ArrowRight,
  Flame,
  Target,
  Check,
  Sparkles,
  BookOpen,
  Star,
  Moon,
  Sun,
  Heart,
  ChevronRight,
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

// Иконки для разных категорий
const getCategoryIcon = (category: string, title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("утренн") || lowerTitle.includes("фаджр")) {
    return <Sun className="w-6 h-6" />;
  }
  if (lowerTitle.includes("вечерн") || lowerTitle.includes("магриб")) {
    return <Moon className="w-6 h-6" />;
  }
  if (lowerTitle.includes("коран") || lowerTitle.includes("чтени")) {
    return <BookOpen className="w-6 h-6" />;
  }
  if (lowerTitle.includes("зикр") || lowerTitle.includes("тасбих")) {
    return <Sparkles className="w-6 h-6" />;
  }
  if (lowerTitle.includes("благ") || lowerTitle.includes("садак")) {
    return <Heart className="w-6 h-6" />;
  }
  if (category === "zikr") {
    return <Star className="w-6 h-6" />;
  }
  return <Sparkles className="w-6 h-6" />;
};

// Компонент точек прогресса
const ProgressDots = ({ current, total }: { current: number; total: number }) => {
  const dots = Math.min(total, 5);
  const filledDots = Math.min(current, dots);
  
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: dots }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i < filledDots ? "bg-emerald-600" : "bg-emerald-200"
          )}
        />
      ))}
    </div>
  );
};

// Компонент карточки цели (как на скриншоте)
const GoalCard = ({ goal, onClick }: { goal: Goal; onClick: () => void }) => {
  const progress = goal.target_value > 0 
    ? (goal.current_value / goal.target_value) * 100 
    : 0;
  const isComplete = goal.current_value >= goal.target_value;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100",
        "hover:shadow-md transition-all duration-200",
        "flex items-center gap-4 text-left"
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
        {getCategoryIcon(goal.category, goal.title)}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 mb-1.5 truncate text-sm">
          {goal.title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {goal.current_value}/{goal.target_value}
          </span>
        </div>
      </div>

      {isComplete ? (
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-white" />
        </div>
      ) : (
        <ProgressDots current={goal.current_value} total={goal.target_value} />
      )}
    </button>
  );
};

interface OverviewDashboardProps {
  onNavigateToCalculator?: () => void;
}

export const OverviewDashboard = ({ onNavigateToCalculator }: OverviewDashboardProps) => {
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
  
  // Цели на сегодня (первые 4)
  const todayGoals = goals.slice(0, 4);

  if (loading || goalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Каза-намазы</h2>
          <button
            onClick={() => navigate("/")}
            className="text-emerald-600 text-sm font-medium flex items-center gap-1"
          >
            Подробнее
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Circular Progress */}
        <div className="flex items-center justify-center py-6">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#d1fae5"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#059669"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * prayerProgress.percent) / 100}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">
                {Math.round(prayerProgress.percent)}%
              </span>
              <span className="text-xs text-gray-500">выполнено</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-700">{prayerProgress.completed}</p>
            <p className="text-xs text-emerald-600">Восполнено</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-gray-700">{prayerProgress.remaining}</p>
            <p className="text-xs text-gray-500">Осталось</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate("/goals")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">{goals.length}</p>
          <p className="text-xs text-gray-500">Целей</p>
        </button>

        <button
          onClick={() => navigate("/goals")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all"
          title="Серия дней без пропусков"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">{currentStreak}</p>
          <p className="text-xs text-gray-500">Дней</p>
        </button>

        <button
          onClick={() => navigate("/tasbih")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">∞</p>
          <p className="text-xs text-gray-500">Тасбих</p>
        </button>
      </div>

      {/* Today's Goals */}
      {todayGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Цели на сегодня</h2>
            <button
              onClick={() => navigate("/goals")}
              className="text-emerald-600 text-sm font-medium"
            >
              Все
            </button>
          </div>
          <div className="space-y-3">
            {todayGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => navigate(`/tasbih?goal=${goal.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/goals")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Новая цель</span>
        </button>
        <button
          onClick={() => navigate("/tasbih")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Тасбих</span>
        </button>
      </div>

      {/* Empty State */}
      {goals.length === 0 && prayerProgress.total === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Начните свой путь</h3>
          <p className="text-sm text-gray-500 mb-4">
            Рассчитайте долги или создайте первую цель
          </p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={onNavigateToCalculator}
              className="px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              Калькулятор
            </button>
            <button 
              onClick={() => navigate("/goals")}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Цели
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
