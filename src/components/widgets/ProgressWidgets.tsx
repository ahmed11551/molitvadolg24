// Улучшенные виджеты прогресса как в Goal app
// Используются на разных страницах приложения

import { useState, useEffect, useMemo } from "react";
import { 
  Flame, Target, Trophy, TrendingUp, Calendar, Star, 
  Zap, BookOpen, Heart, Sparkles, ChevronRight, 
  Moon, Sun, Award, Brain, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { Goal, Streak, Badge } from "@/types/spiritual-path";

// ============================================
// 1. КРУГОВОЙ ПРОГРЕСС С АНИМАЦИЕЙ
// ============================================
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
  sublabel?: string;
  animated?: boolean;
}

export const CircularProgressWidget = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = "#10b981",
  bgColor = "#e5e7eb",
  showLabel = true,
  label,
  sublabel,
  animated = true,
}: CircularProgressProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayValue / 100) * circumference;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">
            {label || `${Math.round(displayValue)}%`}
          </span>
          {sublabel && (
            <span className="text-xs text-gray-500">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// 2. ВИДЖЕТ СЕРИИ (STREAK) С ОГНЁМ
// ============================================
interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  onClick?: () => void;
  compact?: boolean;
}

export const StreakWidget = ({ 
  currentStreak, 
  longestStreak, 
  onClick,
  compact = false 
}: StreakWidgetProps) => {
  const isActive = currentStreak > 0;
  
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
          isActive 
            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200" 
            : "bg-gray-100 text-gray-600"
        )}
      >
        <Flame className={cn("w-5 h-5", isActive && "animate-pulse")} />
        <span className="font-bold">{currentStreak}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98]",
        isActive 
          ? "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white shadow-xl shadow-orange-200" 
          : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
      )}
    >
      {/* Декоративные элементы */}
      {isActive && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </>
      )}
      
      <div className="relative z-10 flex items-center gap-4">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center",
          isActive ? "bg-white/20" : "bg-gray-300/50"
        )}>
          <Flame className={cn(
            "w-7 h-7",
            isActive && "animate-bounce"
          )} />
        </div>
        
        <div className="flex-1 text-left">
          <div className="text-3xl font-black">{currentStreak}</div>
          <div className={cn(
            "text-sm font-medium",
            isActive ? "text-white/80" : "text-gray-500"
          )}>
            {currentStreak === 1 ? "день подряд" : currentStreak < 5 ? "дня подряд" : "дней подряд"}
          </div>
        </div>
        
        <div className={cn(
          "text-right",
          isActive ? "text-white/70" : "text-gray-400"
        )}>
          <div className="text-xs">Рекорд</div>
          <div className="text-lg font-bold">{longestStreak}</div>
        </div>
      </div>
    </button>
  );
};

// ============================================
// 3. ВИДЖЕТ ПРОГРЕССА ПО КАТЕГОРИЯМ
// ============================================
interface CategoryProgressProps {
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    current: number;
    total: number;
  }>;
  onClick?: (categoryId: string) => void;
}

export const CategoryProgressWidget = ({ categories, onClick }: CategoryProgressProps) => {
  const icons: Record<string, React.ReactNode> = {
    prayer: <Moon className="w-4 h-4" />,
    quran: <BookOpen className="w-4 h-4" />,
    zikr: <Sparkles className="w-4 h-4" />,
    charity: <Heart className="w-4 h-4" />,
    knowledge: <Brain className="w-4 h-4" />,
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-emerald-500" />
        Прогресс по категориям
      </h3>
      
      <div className="space-y-4">
        {categories.map((cat) => {
          const percent = cat.total > 0 ? (cat.current / cat.total) * 100 : 0;
          
          return (
            <button
              key={cat.id}
              onClick={() => onClick?.(cat.id)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-white",
                    cat.color
                  )}>
                    {icons[cat.id] || <Star className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {cat.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {cat.current}/{cat.total}
                </span>
              </div>
              
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    cat.color
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// 4. ВИДЖЕТ БЫСТРЫХ ДЕЙСТВИЙ
// ============================================
interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

interface QuickActionsWidgetProps {
  actions: QuickAction[];
}

export const QuickActionsWidget = ({ actions }: QuickActionsWidgetProps) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white",
              action.color
            )}>
              {action.icon}
            </div>
            <span className="text-xs font-medium text-gray-600 text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// 5. ВИДЖЕТ НЕДАВНИХ ДОСТИЖЕНИЙ
// ============================================
interface AchievementWidgetProps {
  badges: Badge[];
  onViewAll?: () => void;
}

export const AchievementWidget = ({ badges, onViewAll }: AchievementWidgetProps) => {
  const recentBadges = badges.slice(0, 3);
  
  if (recentBadges.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Достижения</h3>
            <p className="text-xs text-gray-500">Выполняйте цели для наград</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["🏅", "⭐", "🎯"].map((emoji, i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center text-xl opacity-30">
              {emoji}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onViewAll}
      className="w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100 text-left hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Достижения</h3>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
      
      <div className="flex gap-2">
        {recentBadges.map((badge) => (
          <div
            key={badge.id}
            className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl"
          >
            {badge.badge_data?.icon || "🏅"}
          </div>
        ))}
        {badges.length > 3 && (
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
            +{badges.length - 3}
          </div>
        )}
      </div>
    </button>
  );
};

// ============================================
// 6. ВИДЖЕТ AI ИНСАЙТА
// ============================================
interface AIInsightWidgetProps {
  insight: {
    title: string;
    description: string;
    type: "tip" | "motivation" | "warning" | "achievement";
  };
  onClick?: () => void;
}

export const AIInsightWidget = ({ insight, onClick }: AIInsightWidgetProps) => {
  const colors = {
    tip: "from-blue-500 to-cyan-500",
    motivation: "from-purple-500 to-pink-500",
    warning: "from-amber-500 to-orange-500",
    achievement: "from-emerald-500 to-teal-500",
  };

  const icons = {
    tip: <Zap className="w-5 h-5" />,
    motivation: <Sparkles className="w-5 h-5" />,
    warning: <Sun className="w-5 h-5" />,
    achievement: <Award className="w-5 h-5" />,
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full relative overflow-hidden rounded-2xl p-5 text-white text-left",
        "bg-gradient-to-br shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]",
        colors[insight.type]
      )}
    >
      {/* Декоративный фон */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            {icons[insight.type]}
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-white/80">
            AI-совет
          </span>
        </div>
        
        <h4 className="font-bold mb-1">{insight.title}</h4>
        <p className="text-sm text-white/90 leading-relaxed line-clamp-2">
          {insight.description}
        </p>
      </div>
    </button>
  );
};

// ============================================
// 7. ТЕПЛОВАЯ КАРТА АКТИВНОСТИ
// ============================================
interface ActivityHeatmapProps {
  data: Array<{ date: string; value: number }>;
  weeks?: number;
}

export const ActivityHeatmapWidget = ({ data, weeks = 12 }: ActivityHeatmapProps) => {
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  
  // Генерируем сетку для последних N недель
  const grid = useMemo(() => {
    const today = new Date();
    const result: Array<Array<{ date: string; value: number }>> = [];
    
    for (let w = weeks - 1; w >= 0; w--) {
      const week: Array<{ date: string; value: number }> = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + (6 - d)));
        const dateStr = date.toISOString().split("T")[0];
        const activity = data.find(a => a.date === dateStr);
        week.push({
          date: dateStr,
          value: activity?.value || 0,
        });
      }
      result.push(week);
    }
    
    return result;
  }, [data, weeks]);

  const getColor = (value: number) => {
    if (value === 0) return "bg-gray-100";
    if (value < 25) return "bg-emerald-200";
    if (value < 50) return "bg-emerald-300";
    if (value < 75) return "bg-emerald-400";
    return "bg-emerald-500";
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-emerald-500" />
        Активность
      </h3>
      
      <div className="flex gap-1">
        {/* Дни недели */}
        <div className="flex flex-col gap-1 pr-2">
          {days.map((day, i) => (
            <div key={i} className="h-3 text-[10px] text-gray-400 flex items-center">
              {i % 2 === 0 ? day : ""}
            </div>
          ))}
        </div>
        
        {/* Сетка */}
        <div className="flex gap-1 overflow-x-auto">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={cn(
                    "w-3 h-3 rounded-sm transition-colors",
                    getColor(day.value)
                  )}
                  title={`${day.date}: ${day.value}%`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Легенда */}
      <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-gray-400">
        <span>Меньше</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100" />
        <div className="w-3 h-3 rounded-sm bg-emerald-200" />
        <div className="w-3 h-3 rounded-sm bg-emerald-300" />
        <div className="w-3 h-3 rounded-sm bg-emerald-400" />
        <div className="w-3 h-3 rounded-sm bg-emerald-500" />
        <span>Больше</span>
      </div>
    </div>
  );
};

// ============================================
// 8. МИНИ-КАРТОЧКА ЦЕЛИ
// ============================================
interface MiniGoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

export const MiniGoalCard = ({ goal, onClick }: MiniGoalCardProps) => {
  const progress = goal.target_value > 0 
    ? Math.min((goal.current_value / goal.target_value) * 100, 100) 
    : 0;
  const isComplete = progress >= 100;

  const categoryColors: Record<string, string> = {
    prayer: "bg-purple-500",
    quran: "bg-blue-500",
    zikr: "bg-emerald-500",
    charity: "bg-pink-500",
    knowledge: "bg-amber-500",
    custom: "bg-gray-500",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-white border transition-all",
        "hover:shadow-md hover:border-gray-200 active:scale-[0.98]",
        isComplete ? "border-emerald-200 bg-emerald-50/30" : "border-gray-100"
      )}
    >
      {/* Круговой прогресс */}
      <div className="relative w-11 h-11 flex-shrink-0">
        <svg className="w-11 h-11 transform -rotate-90">
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={isComplete ? "#10b981" : "#6366f1"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={113}
            strokeDashoffset={113 - (progress / 100) * 113}
            className="transition-all duration-500"
          />
        </svg>
        {isComplete ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">
            {Math.round(progress)}%
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="flex-1 min-w-0 text-left">
        <div className="font-medium text-gray-900 truncate">{goal.title}</div>
        <div className="text-xs text-gray-500">
          {goal.current_value} / {goal.target_value}
        </div>
      </div>

      {/* Категория */}
      <div className={cn(
        "w-2 h-8 rounded-full",
        categoryColors[goal.category] || "bg-gray-400"
      )} />
    </button>
  );
};

// ============================================
// 9. ВИДЖЕТ СТАТИСТИКИ В ЧИСЛАХ
// ============================================
interface StatsNumbersWidgetProps {
  stats: Array<{
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    change?: number;
  }>;
}

export const StatsNumbersWidget = ({ stats }: StatsNumbersWidgetProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl p-4 text-white",
            stat.color
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              {stat.icon}
            </div>
            {stat.change !== undefined && (
              <div className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                stat.change >= 0 ? "bg-white/20" : "bg-red-500/20"
              )}>
                {stat.change >= 0 ? "+" : ""}{stat.change}%
              </div>
            )}
          </div>
          <div className="text-2xl font-bold">{stat.value}</div>
          <div className="text-xs text-white/80">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

