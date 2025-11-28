// Страница Статистики - дизайн как в Goal app

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Star,
  Award,
  Medal,
  Zap,
  BookOpen,
  Heart,
} from "lucide-react";
import { spiritualPathAPI } from "@/lib/api";
import { useUserData } from "@/hooks/useUserData";
import type { Goal, Streak, Badge } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { ru } from "date-fns/locale";
import {
  StreakWidget,
  ActivityHeatmapWidget,
  CircularProgressWidget,
  StatsNumbersWidget,
} from "@/components/widgets/ProgressWidgets";
import { getAchievementProgress } from "@/lib/achievements";

// Информация о бейджах
const BADGE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  prayer_consistency: { label: "Неуклонный в намазе", icon: "🕌", color: "bg-emerald-500" },
  quran_completion: { label: "Сердце Корана", icon: "📖", color: "bg-blue-500" },
  sadaqa_regularity: { label: "Рука щедрости", icon: "💝", color: "bg-pink-500" },
  zikr_consistency: { label: "Поминающий", icon: "📿", color: "bg-purple-500" },
  streak_master: { label: "Мастер серий", icon: "🔥", color: "bg-orange-500" },
  goal_achiever: { label: "Достигатель", icon: "🎯", color: "bg-yellow-500" },
};

const LEVEL_COLORS = {
  copper: "bg-amber-600",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-cyan-400",
};

const Statistics = () => {
  const navigate = useNavigate();
  const { userData } = useUserData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsData, streaksData, badgesData] = await Promise.all([
        spiritualPathAPI.getGoals("all"),
        spiritualPathAPI.getStreaks(),
        spiritualPathAPI.getBadges(),
      ]);
      setGoals(goalsData);
      setStreaks(streaksData);
      setBadges(badgesData);

      // Вычисляем активность по дням недели
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start: weekStart, end: new Date() });
      const activity = [0, 0, 0, 0, 0, 0, 0];
      
      // Простой расчёт на основе streaks
      const dailyStreak = streaksData.find(s => s.streak_type === "daily_all");
      if (dailyStreak && dailyStreak.current_streak > 0) {
        for (let i = 0; i < Math.min(dailyStreak.current_streak, 7); i++) {
          activity[6 - i] = 100; // Заполняем с конца
        }
      }
      setWeeklyActivity(activity);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Статистика
  const currentStreak = streaks.find(s => s.streak_type === "daily_all")?.current_streak || 0;
  const longestStreak = streaks.find(s => s.streak_type === "daily_all")?.longest_streak || 0;
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const activeGoals = goals.filter(g => g.status === "active").length;
  const totalProgress = goals.reduce((sum, g) => sum + g.current_value, 0);

  // Каза статистика
  const qazaTotal = userData?.debt_calculation?.missed_prayers
    ? Object.values(userData.debt_calculation.missed_prayers).reduce((a, b) => a + (b || 0), 0)
    : 0;
  const qazaCompleted = userData?.repayment_progress?.completed_prayers
    ? Object.values(userData.repayment_progress.completed_prayers).reduce((a, b) => a + (b || 0), 0)
    : 0;
  const qazaPercent = qazaTotal > 0 ? Math.round((qazaCompleted / qazaTotal) * 100) : 0;

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <MainHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-gray-400">Загрузка...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MainHeader />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Статистика</h1>
        </div>

        {/* Streak Card - улучшенный виджет */}
        <div className="mb-6">
          <StreakWidget
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            onClick={() => navigate("/goals")}
          />
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Активность за неделю</h2>
          <div className="flex items-end justify-between gap-2 h-24">
            {weekDays.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-full rounded-lg transition-all",
                    weeklyActivity[i] > 0 ? "bg-emerald-500" : "bg-gray-100"
                  )}
                  style={{ height: `${Math.max(weeklyActivity[i], 20)}%` }}
                />
                <span className="text-xs text-gray-500">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Calendar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              {format(new Date(), "LLLL yyyy", { locale: ru })}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Активный день</span>
            </div>
          </div>
          
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
                {d}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              const startPadding = (firstDay.getDay() + 6) % 7; // Monday = 0
              const days = [];
              
              // Пустые ячейки до начала месяца
              for (let i = 0; i < startPadding; i++) {
                days.push(<div key={`empty-${i}`} className="aspect-square" />);
              }
              
              // Дни месяца
              for (let d = 1; d <= lastDay.getDate(); d++) {
                const isToday = d === today.getDate();
                // Простая логика: активные дни на основе streak
                const isActive = d <= today.getDate() && (today.getDate() - d) < currentStreak;
                
                days.push(
                  <div
                    key={d}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                      isToday && "ring-2 ring-emerald-500",
                      isActive && "bg-emerald-500 text-white",
                      !isActive && d <= today.getDate() && "bg-gray-100 text-gray-400",
                      d > today.getDate() && "text-gray-300"
                    )}
                  >
                    {d}
                  </div>
                );
              }
              
              return days;
            })()}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{currentStreak}</p>
              <p className="text-xs text-gray-500">дней подряд</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">{longestStreak}</p>
              <p className="text-xs text-gray-500">рекорд</p>
            </div>
          </div>
        </div>

        {/* Stats Grid - улучшенные виджеты */}
        <div className="mb-6">
          <StatsNumbersWidget
            stats={[
              {
                label: "Всего целей",
                value: activeGoals + completedGoals,
                icon: <Target className="w-4 h-4" />,
                color: "bg-gradient-to-br from-emerald-500 to-green-600",
                change: completedGoals > 0 ? Math.round((completedGoals / (activeGoals + completedGoals)) * 100) : 0,
              },
              {
                label: "Действий",
                value: totalProgress,
                icon: <TrendingUp className="w-4 h-4" />,
                color: "bg-gradient-to-br from-blue-500 to-indigo-600",
              },
              {
                label: "Каза",
                value: `${qazaPercent}%`,
                icon: <BookOpen className="w-4 h-4" />,
                color: "bg-gradient-to-br from-purple-500 to-violet-600",
              },
              {
                label: "Бейджей",
                value: badges.length,
                icon: <Trophy className="w-4 h-4" />,
                color: "bg-gradient-to-br from-amber-500 to-orange-600",
              },
            ]}
          />
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Достижения</h2>
            <span className="text-sm text-gray-500">{badges.length} / 6</span>
          </div>
          
          {badges.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge) => {
                const info = BADGE_INFO[badge.badge_type] || {
                  label: badge.badge_type,
                  icon: "🏆",
                  color: "bg-gray-500",
                };
                const levelColor = LEVEL_COLORS[badge.level as keyof typeof LEVEL_COLORS] || "bg-gray-400";
                
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-3 bg-gray-50 rounded-xl"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2",
                      levelColor + "/20"
                    )}>
                      {info.icon}
                    </div>
                    <p className="text-xs text-center text-gray-700 font-medium line-clamp-2">
                      {info.label}
                    </p>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full text-white mt-1",
                      levelColor
                    )}>
                      {badge.level}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">
                Выполняйте цели, чтобы получить достижения
              </p>
            </div>
          )}
        </div>

        {/* Streaks by Category */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Серии по категориям</h2>
          
          {streaks.filter(s => s.streak_type === "category").length > 0 ? (
            <div className="space-y-3">
              {streaks
                .filter(s => s.streak_type === "category")
                .map((streak) => (
                  <div
                    key={streak.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {streak.category || "Общая"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Рекорд: {streak.longest_streak} дн.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-500">
                        {streak.current_streak}
                      </p>
                      <p className="text-xs text-gray-500">дней</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">
                Начните выполнять цели, чтобы видеть серии
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Statistics;

