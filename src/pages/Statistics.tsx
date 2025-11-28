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

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Текущая серия</p>
              <p className="text-5xl font-bold">{currentStreak}</p>
              <p className="text-orange-100 text-sm mt-1">дней подряд</p>
            </div>
            <div className="text-right">
              <Flame className="w-16 h-16 text-orange-200" />
              <p className="text-orange-100 text-xs mt-2">Рекорд: {longestStreak} дн.</p>
            </div>
          </div>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">Целей</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeGoals + completedGoals}</p>
            <p className="text-xs text-emerald-600">{completedGoals} выполнено</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-gray-500">Прогресс</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalProgress}</p>
            <p className="text-xs text-blue-600">всего действий</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-gray-500">Каза</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{qazaPercent}%</p>
            <p className="text-xs text-purple-600">{qazaCompleted} из {qazaTotal}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-sm text-gray-500">Бейджей</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{badges.length}</p>
            <p className="text-xs text-yellow-600">получено</p>
          </div>
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

