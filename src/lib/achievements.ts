// Система достижений и бейджей
// Работает полностью локально на основе данных пользователя

import type { Goal, Badge, Streak } from "@/types/spiritual-path";

// Определения всех возможных достижений
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "goals" | "streaks" | "prayer" | "quran" | "dhikr" | "special";
  tier: "bronze" | "silver" | "gold" | "platinum";
  requirement: (stats: UserStats) => boolean;
  progress?: (stats: UserStats) => { current: number; target: number };
}

export interface UserStats {
  totalGoalsCompleted: number;
  activeGoals: number;
  currentStreak: number;
  longestStreak: number;
  totalDhikrCount: number;
  totalPrayersCompleted: number;
  quranPagesRead: number;
  namesOfAllahLearned: number;
  daysActive: number;
  categoryCounts: Record<string, number>;
}

// Все достижения
export const achievementDefinitions: AchievementDefinition[] = [
  // === ЦЕЛИ ===
  {
    id: "first_goal",
    name: "Первый шаг",
    description: "Выполните первую цель",
    icon: "🎯",
    category: "goals",
    tier: "bronze",
    requirement: (s) => s.totalGoalsCompleted >= 1,
    progress: (s) => ({ current: s.totalGoalsCompleted, target: 1 }),
  },
  {
    id: "goals_10",
    name: "Целеустремлённый",
    description: "Выполните 10 целей",
    icon: "🏅",
    category: "goals",
    tier: "silver",
    requirement: (s) => s.totalGoalsCompleted >= 10,
    progress: (s) => ({ current: s.totalGoalsCompleted, target: 10 }),
  },
  {
    id: "goals_50",
    name: "Мастер целей",
    description: "Выполните 50 целей",
    icon: "🏆",
    category: "goals",
    tier: "gold",
    requirement: (s) => s.totalGoalsCompleted >= 50,
    progress: (s) => ({ current: s.totalGoalsCompleted, target: 50 }),
  },
  {
    id: "goals_100",
    name: "Легенда достижений",
    description: "Выполните 100 целей",
    icon: "👑",
    category: "goals",
    tier: "platinum",
    requirement: (s) => s.totalGoalsCompleted >= 100,
    progress: (s) => ({ current: s.totalGoalsCompleted, target: 100 }),
  },

  // === СЕРИИ ===
  {
    id: "streak_3",
    name: "Начало пути",
    description: "3 дня подряд",
    icon: "🔥",
    category: "streaks",
    tier: "bronze",
    requirement: (s) => s.currentStreak >= 3,
    progress: (s) => ({ current: s.currentStreak, target: 3 }),
  },
  {
    id: "streak_7",
    name: "Неделя силы",
    description: "7 дней подряд",
    icon: "💪",
    category: "streaks",
    tier: "silver",
    requirement: (s) => s.currentStreak >= 7,
    progress: (s) => ({ current: s.currentStreak, target: 7 }),
  },
  {
    id: "streak_30",
    name: "Месяц постоянства",
    description: "30 дней подряд",
    icon: "⭐",
    category: "streaks",
    tier: "gold",
    requirement: (s) => s.currentStreak >= 30,
    progress: (s) => ({ current: s.currentStreak, target: 30 }),
  },
  {
    id: "streak_100",
    name: "100 дней дисциплины",
    description: "100 дней подряд",
    icon: "💎",
    category: "streaks",
    tier: "platinum",
    requirement: (s) => s.longestStreak >= 100,
    progress: (s) => ({ current: s.longestStreak, target: 100 }),
  },

  // === НАМАЗ ===
  {
    id: "prayer_first",
    name: "Начало молитвы",
    description: "Восполните первый намаз",
    icon: "🕌",
    category: "prayer",
    tier: "bronze",
    requirement: (s) => s.totalPrayersCompleted >= 1,
    progress: (s) => ({ current: s.totalPrayersCompleted, target: 1 }),
  },
  {
    id: "prayer_100",
    name: "100 намазов",
    description: "Восполните 100 намазов",
    icon: "🌙",
    category: "prayer",
    tier: "silver",
    requirement: (s) => s.totalPrayersCompleted >= 100,
    progress: (s) => ({ current: s.totalPrayersCompleted, target: 100 }),
  },
  {
    id: "prayer_500",
    name: "500 намазов",
    description: "Восполните 500 намазов",
    icon: "✨",
    category: "prayer",
    tier: "gold",
    requirement: (s) => s.totalPrayersCompleted >= 500,
    progress: (s) => ({ current: s.totalPrayersCompleted, target: 500 }),
  },
  {
    id: "prayer_1000",
    name: "1000 намазов",
    description: "Восполните 1000 намазов",
    icon: "🌟",
    category: "prayer",
    tier: "platinum",
    requirement: (s) => s.totalPrayersCompleted >= 1000,
    progress: (s) => ({ current: s.totalPrayersCompleted, target: 1000 }),
  },

  // === КОРАН ===
  {
    id: "quran_start",
    name: "Чтец Корана",
    description: "Прочитайте первую страницу",
    icon: "📖",
    category: "quran",
    tier: "bronze",
    requirement: (s) => s.quranPagesRead >= 1,
    progress: (s) => ({ current: s.quranPagesRead, target: 1 }),
  },
  {
    id: "quran_juz",
    name: "Один джуз",
    description: "Прочитайте 20 страниц",
    icon: "📚",
    category: "quran",
    tier: "silver",
    requirement: (s) => s.quranPagesRead >= 20,
    progress: (s) => ({ current: s.quranPagesRead, target: 20 }),
  },
  {
    id: "quran_quarter",
    name: "Четверть Корана",
    description: "Прочитайте 150 страниц",
    icon: "📕",
    category: "quran",
    tier: "gold",
    requirement: (s) => s.quranPagesRead >= 150,
    progress: (s) => ({ current: s.quranPagesRead, target: 150 }),
  },
  {
    id: "quran_complete",
    name: "Хатм Коран",
    description: "Прочитайте весь Коран (604 страницы)",
    icon: "🏆",
    category: "quran",
    tier: "platinum",
    requirement: (s) => s.quranPagesRead >= 604,
    progress: (s) => ({ current: s.quranPagesRead, target: 604 }),
  },

  // === ЗИКР ===
  {
    id: "dhikr_start",
    name: "Поминание",
    description: "Сделайте 100 зикров",
    icon: "📿",
    category: "dhikr",
    tier: "bronze",
    requirement: (s) => s.totalDhikrCount >= 100,
    progress: (s) => ({ current: s.totalDhikrCount, target: 100 }),
  },
  {
    id: "dhikr_1000",
    name: "1000 зикров",
    description: "Сделайте 1000 зикров",
    icon: "🌸",
    category: "dhikr",
    tier: "silver",
    requirement: (s) => s.totalDhikrCount >= 1000,
    progress: (s) => ({ current: s.totalDhikrCount, target: 1000 }),
  },
  {
    id: "dhikr_10000",
    name: "10000 зикров",
    description: "Сделайте 10000 зикров",
    icon: "🌺",
    category: "dhikr",
    tier: "gold",
    requirement: (s) => s.totalDhikrCount >= 10000,
    progress: (s) => ({ current: s.totalDhikrCount, target: 10000 }),
  },
  {
    id: "names_10",
    name: "Знаток имён",
    description: "Выучите 10 имён Аллаха",
    icon: "✨",
    category: "dhikr",
    tier: "silver",
    requirement: (s) => s.namesOfAllahLearned >= 10,
    progress: (s) => ({ current: s.namesOfAllahLearned, target: 10 }),
  },
  {
    id: "names_99",
    name: "99 имён",
    description: "Выучите все 99 имён Аллаха",
    icon: "💎",
    category: "dhikr",
    tier: "platinum",
    requirement: (s) => s.namesOfAllahLearned >= 99,
    progress: (s) => ({ current: s.namesOfAllahLearned, target: 99 }),
  },

  // === ОСОБЫЕ ===
  {
    id: "early_bird",
    name: "Ранняя пташка",
    description: "Выполните цель до 6 утра",
    icon: "🌅",
    category: "special",
    tier: "silver",
    requirement: (s) => s.categoryCounts["early_completion"] >= 1,
    progress: (s) => ({ current: s.categoryCounts["early_completion"] || 0, target: 1 }),
  },
  {
    id: "night_owl",
    name: "Ночной молящийся",
    description: "Тахаджуд 7 дней подряд",
    icon: "🌙",
    category: "special",
    tier: "gold",
    requirement: (s) => s.categoryCounts["tahajjud_streak"] >= 7,
    progress: (s) => ({ current: s.categoryCounts["tahajjud_streak"] || 0, target: 7 }),
  },
  {
    id: "consistent",
    name: "Последовательность",
    description: "Выполняйте цели 7 дней без пропусков",
    icon: "📈",
    category: "special",
    tier: "silver",
    requirement: (s) => s.daysActive >= 7,
    progress: (s) => ({ current: s.daysActive, target: 7 }),
  },
];

/**
 * Собирает статистику пользователя из локальных данных
 */
export function collectUserStats(): UserStats {
  const goals: Goal[] = JSON.parse(localStorage.getItem("goals") || "[]");
  const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
  const counters = JSON.parse(localStorage.getItem("tasbih_counters") || "{}");
  
  const completedGoals = goals.filter(g => g.status === "completed");
  const activeGoals = goals.filter(g => g.status === "active");
  
  // Подсчёт по категориям
  const categoryCounts: Record<string, number> = {};
  goals.forEach(g => {
    categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
  });
  
  // Streak данные
  const streaksData = JSON.parse(localStorage.getItem("streaks") || "[]");
  const dailyStreak = streaksData.find((s: Streak) => s.streak_type === "daily_all");
  
  // Прогресс намазов
  const qazaProgress = userData.repayment_progress?.completed_prayers || {};
  const totalPrayers = Object.values(qazaProgress).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
  
  // Подсчёт зикров
  let totalDhikr = 0;
  Object.values(counters).forEach((counter: unknown) => {
    const c = counter as { count?: number };
    if (c && typeof c.count === "number") {
      totalDhikr += c.count;
    }
  });
  
  // Подсчёт прочитанных страниц Корана
  const quranGoals = completedGoals.filter(g => g.category === "quran");
  const quranPages = quranGoals.reduce((sum, g) => sum + g.current_value, 0);
  
  // Подсчёт выученных имён Аллаха
  const namesLearned = parseInt(localStorage.getItem("names_of_allah_learned") || "0", 10);
  
  // Дни активности
  const activityDays = JSON.parse(localStorage.getItem("activity_days") || "[]");
  const daysActive = activityDays.length;
  
  return {
    totalGoalsCompleted: completedGoals.length,
    activeGoals: activeGoals.length,
    currentStreak: dailyStreak?.current_streak || 0,
    longestStreak: dailyStreak?.longest_streak || 0,
    totalDhikrCount: totalDhikr,
    totalPrayersCompleted: totalPrayers,
    quranPagesRead: quranPages,
    namesOfAllahLearned: namesLearned,
    daysActive,
    categoryCounts,
  };
}

/**
 * Проверяет и возвращает список заработанных достижений
 */
export function checkAchievements(): Badge[] {
  const stats = collectUserStats();
  const earnedBadges: Badge[] = [];
  const existingBadgeIds = JSON.parse(localStorage.getItem("earned_badges") || "[]");
  
  for (const achievement of achievementDefinitions) {
    if (achievement.requirement(stats)) {
      const badge: Badge = {
        id: achievement.id,
        user_id: "local",
        badge_type: achievement.id,
        earned_at: new Date().toISOString(),
        badge_data: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          tier: achievement.tier,
          category: achievement.category,
        },
      };
      
      earnedBadges.push(badge);
      
      // Если это новое достижение, добавляем в localStorage
      if (!existingBadgeIds.includes(achievement.id)) {
        existingBadgeIds.push(achievement.id);
        localStorage.setItem("earned_badges", JSON.stringify(existingBadgeIds));
        
        // Сохраняем полную информацию о бейдже
        const allBadges = JSON.parse(localStorage.getItem("badges") || "[]");
        allBadges.push(badge);
        localStorage.setItem("badges", JSON.stringify(allBadges));
      }
    }
  }
  
  return earnedBadges;
}

/**
 * Возвращает прогресс по всем достижениям
 */
export function getAchievementProgress(): Array<{
  achievement: AchievementDefinition;
  earned: boolean;
  progress: { current: number; target: number } | null;
}> {
  const stats = collectUserStats();
  const earnedBadgeIds = JSON.parse(localStorage.getItem("earned_badges") || "[]");
  
  return achievementDefinitions.map(achievement => ({
    achievement,
    earned: earnedBadgeIds.includes(achievement.id),
    progress: achievement.progress ? achievement.progress(stats) : null,
  }));
}

/**
 * Получает все заработанные бейджи
 */
export function getEarnedBadges(): Badge[] {
  return JSON.parse(localStorage.getItem("badges") || "[]");
}

/**
 * Обновляет серии по категориям
 */
export function updateCategoryStreaks(category: string): void {
  const streaksKey = `streak_${category}`;
  const lastDateKey = `streak_${category}_last_date`;
  
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem(lastDateKey);
  
  if (lastDate === today) {
    return; // Уже обновлено сегодня
  }
  
  const currentStreak = parseInt(localStorage.getItem(streaksKey) || "0", 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastDate === yesterday.toDateString()) {
    // Продолжаем серию
    localStorage.setItem(streaksKey, String(currentStreak + 1));
  } else if (!lastDate) {
    // Первый день
    localStorage.setItem(streaksKey, "1");
  } else {
    // Серия прервалась
    localStorage.setItem(streaksKey, "1");
  }
  
  localStorage.setItem(lastDateKey, today);
  
  // Обновляем общую серию
  updateDailyStreak();
}

/**
 * Обновляет ежедневную серию
 */
export function updateDailyStreak(): void {
  const today = new Date().toDateString();
  const activityDays: string[] = JSON.parse(localStorage.getItem("activity_days") || "[]");
  
  if (!activityDays.includes(today)) {
    activityDays.push(today);
    localStorage.setItem("activity_days", JSON.stringify(activityDays));
  }
  
  // Обновляем streak в localStorage
  const streaks: Streak[] = JSON.parse(localStorage.getItem("streaks") || "[]");
  let dailyStreak = streaks.find(s => s.streak_type === "daily_all");
  
  if (!dailyStreak) {
    dailyStreak = {
      id: "daily_all_streak",
      user_id: "local",
      streak_type: "daily_all",
      current_streak: 1,
      longest_streak: 1,
      last_activity: new Date().toISOString(),
      streak_data: {},
    };
    streaks.push(dailyStreak);
  } else {
    const lastActivity = new Date(dailyStreak.last_activity);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastActivity.toDateString() === yesterday.toDateString()) {
      dailyStreak.current_streak += 1;
      if (dailyStreak.current_streak > dailyStreak.longest_streak) {
        dailyStreak.longest_streak = dailyStreak.current_streak;
      }
    } else if (lastActivity.toDateString() !== today) {
      dailyStreak.current_streak = 1;
    }
    
    dailyStreak.last_activity = new Date().toISOString();
  }
  
  localStorage.setItem("streaks", JSON.stringify(streaks));
}

/**
 * Получает серии по категориям
 */
export function getCategoryStreaks(): Record<string, number> {
  const categories = ["prayer", "quran", "zikr", "fasting", "charity", "knowledge"];
  const streaks: Record<string, number> = {};
  
  for (const category of categories) {
    streaks[category] = parseInt(localStorage.getItem(`streak_${category}`) || "0", 10);
  }
  
  return streaks;
}

