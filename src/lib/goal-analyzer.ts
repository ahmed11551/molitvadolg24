// Анализатор целей и генератор AI-инсайтов
// Работает полностью локально на основе данных пользователя

import type { Goal, Streak, Badge, AIInsight } from "@/types/spiritual-path";

interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  completedToday: number;
  averageProgress: number;
  streakDays: number;
  longestStreak: number;
  totalActions: number;
  goalsNearCompletion: Goal[];
  stalledGoals: Goal[];
  categoryCounts: Record<string, number>;
}

/**
 * Анализирует статистику целей
 */
export function analyzeGoals(goals: Goal[], streaks: Streak[]): GoalStats {
  // Валидация входных данных
  const validGoals = Array.isArray(goals) ? goals : [];
  const validStreaks = Array.isArray(streaks) ? streaks : [];
  
  const today = new Date().toDateString();
  
  const activeGoals = validGoals.filter(g => g && g.status === "active");
  const completedGoals = validGoals.filter(g => g && g.status === "completed");
  
  // Цели, завершённые сегодня (по updated_at)
  const completedToday = validGoals.filter(g => {
    if (!g || g.status !== "completed") return false;
    try {
      const updated = new Date(g.updated_at || g.created_at);
      return !isNaN(updated.getTime()) && updated.toDateString() === today;
    } catch {
      return false;
    }
  }).length;
  
  // Средний прогресс активных целей (с защитой от деления на ноль)
  const averageProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => {
        if (!g || !g.target_value || g.target_value === 0) return sum;
        return sum + Math.min(100, (g.current_value / g.target_value) * 100);
      }, 0) / activeGoals.length
    : 0;
  
  // Streak данные
  const dailyStreak = validStreaks.find(s => s && s.streak_type === "daily_all");
  const streakDays = dailyStreak?.current_streak || 0;
  const longestStreak = dailyStreak?.longest_streak || streakDays;
  
  // Общее количество действий (с защитой от NaN)
  const totalActions = validGoals.reduce((sum, g) => {
    if (!g || typeof g.current_value !== "number") return sum;
    return sum + (isNaN(g.current_value) ? 0 : g.current_value);
  }, 0);
  
  // Цели близкие к завершению (>80%)
  const goalsNearCompletion = activeGoals.filter(g => {
    if (!g || !g.target_value || g.target_value === 0) return false;
    return (g.current_value / g.target_value) >= 0.8;
  });
  
  // Застопорившиеся цели (прогресс < 20% и создана > 3 дней назад)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const stalledGoals = activeGoals.filter(g => {
    if (!g || !g.target_value || g.target_value === 0) return false;
    try {
      const created = new Date(g.created_at);
      if (isNaN(created.getTime())) return false;
      const progress = g.current_value / g.target_value;
      return progress < 0.2 && created < threeDaysAgo;
    } catch {
      return false;
    }
  });
  
  // Подсчёт по категориям
  const categoryCounts: Record<string, number> = {};
  validGoals.forEach(g => {
    if (g && g.category) {
      categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
    }
  });
  
  return {
    totalGoals: validGoals.length,
    activeGoals: activeGoals.length,
    completedGoals: completedGoals.length,
    completedToday,
    averageProgress: isNaN(averageProgress) ? 0 : averageProgress,
    streakDays,
    longestStreak,
    totalActions: isNaN(totalActions) ? 0 : totalActions,
    goalsNearCompletion,
    stalledGoals,
    categoryCounts,
  };
}

/**
 * Генерирует AI-инсайты на основе анализа
 */
export function generateInsights(stats: GoalStats): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // 1. Инсайт о прогрессе
  if (stats.completedToday > 0) {
    insights.push({
      type: "achievement",
      title: "Отличный день!",
      description: `Вы завершили ${stats.completedToday} ${getGoalWord(stats.completedToday)} сегодня. Ма ша Аллах!`,
      metric: "Выполнено сегодня",
      value: stats.completedToday,
    });
  } else if (stats.activeGoals > 0) {
    insights.push({
      type: "motivation",
      title: "Время действовать",
      description: "У вас есть активные цели. Каждое маленькое действие приближает вас к успеху!",
      metric: "Активных целей",
      value: stats.activeGoals,
    });
  }
  
  // 2. Инсайт о streak
  if (stats.streakDays >= 7) {
    insights.push({
      type: "achievement",
      title: `${stats.streakDays} дней подряд! 🔥`,
      description: "Вы сохраняете постоянство. Это ключ к успеху в любом деле.",
      metric: "Текущая серия",
      value: stats.streakDays,
    });
  } else if (stats.streakDays >= 3) {
    insights.push({
      type: "trend",
      title: "Хорошее начало",
      description: `${stats.streakDays} дня подряд. Продолжайте, чтобы выработать привычку!`,
      metric: "Дней подряд",
      value: stats.streakDays,
    });
  }
  
  // 3. Инсайт о близких к завершению целях
  if (stats.goalsNearCompletion.length > 0) {
    const goal = stats.goalsNearCompletion[0];
    const remaining = goal.target_value - goal.current_value;
    insights.push({
      type: "trend",
      title: "Почти у цели!",
      description: `"${goal.title}" — осталось всего ${remaining}. Завершите сегодня!`,
      metric: "До завершения",
      value: remaining,
    });
  }
  
  // 4. Предупреждение о застопорившихся целях
  if (stats.stalledGoals.length > 0) {
    insights.push({
      type: "warning",
      title: "Требуют внимания",
      description: `${stats.stalledGoals.length} ${getGoalWord(stats.stalledGoals.length)} без прогресса. Возможно, стоит пересмотреть или удалить?`,
      metric: "Без прогресса",
      value: stats.stalledGoals.length,
    });
  }
  
  // 5. Инсайт о достижениях
  if (stats.completedGoals >= 10) {
    insights.push({
      type: "achievement",
      title: "Мастер достижений",
      description: `Вы выполнили ${stats.completedGoals} целей! Каждая — шаг к лучшей версии себя.`,
      metric: "Всего выполнено",
      value: stats.completedGoals,
    });
  }
  
  // 6. Инсайт о категориях
  const topCategory = Object.entries(stats.categoryCounts)
    .sort(([, a], [, b]) => b - a)[0];
  
  if (topCategory && topCategory[1] >= 3) {
    const categoryNames: Record<string, string> = {
      prayer: "намазу",
      zikr: "зикру",
      quran: "Корану",
      fasting: "посту",
      charity: "милостыне",
      knowledge: "знаниям",
      health: "здоровью",
      custom: "личным целям",
    };
    insights.push({
      type: "trend",
      title: "Ваш фокус",
      description: `Больше всего целей связано с ${categoryNames[topCategory[0]] || topCategory[0]}. Отличное направление!`,
      metric: "Целей в категории",
      value: topCategory[1],
    });
  }
  
  // 7. Мотивационный инсайт (всегда добавляем)
  if (insights.length < 3) {
    const motivations = [
      {
        title: "Каждый шаг имеет значение",
        description: "Пророк ﷺ сказал: «Самые любимые дела для Аллаха — постоянные, даже если они малы».",
      },
      {
        title: "Ваши усилия не напрасны",
        description: "Аллах видит каждое ваше стремление к добру. Продолжайте идти вперёд!",
      },
      {
        title: "Начните с малого",
        description: "Даже один аят Корана или одна молитва — это начало большого пути.",
      },
    ];
    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
    insights.push({
      type: "motivation",
      title: randomMotivation.title,
      description: randomMotivation.description,
    });
  }
  
  return insights;
}

/**
 * Генерирует персональные рекомендации
 */
export function generateRecommendations(stats: GoalStats): string[] {
  const recommendations: string[] = [];
  
  if (stats.activeGoals === 0) {
    recommendations.push("Создайте первую цель! Начните с чего-то простого — например, читать 5 аятов Корана в день.");
  }
  
  if (stats.stalledGoals.length > 0) {
    recommendations.push(`Пересмотрите ${stats.stalledGoals.length} застопорившихся целей. Возможно, стоит сделать их проще или удалить.`);
  }
  
  if (stats.averageProgress < 30 && stats.activeGoals > 0) {
    recommendations.push("Сфокусируйтесь на 2-3 главных целях. Лучше выполнить несколько, чем распыляться на много.");
  }
  
  if (stats.streakDays === 0 && stats.activeGoals > 0) {
    recommendations.push("Выполните хотя бы одну цель сегодня, чтобы начать серию!");
  }
  
  if (stats.goalsNearCompletion.length > 0) {
    recommendations.push(`Завершите "${stats.goalsNearCompletion[0].title}" — вы почти у цели!`);
  }
  
  if (stats.streakDays >= 7) {
    recommendations.push("Поддерживайте темп! Добавьте новую цель для развития.");
  }
  
  // Добавляем духовную рекомендацию
  const spiritualTips = [
    "Добавьте цель на утренние азкары — это лучшее начало дня.",
    "Установите цель на чтение хотя бы 1 страницы Корана в день.",
    "Не забывайте о салавате пророку ﷺ — это приносит благословение.",
  ];
  recommendations.push(spiritualTips[Math.floor(Math.random() * spiritualTips.length)]);
  
  return recommendations.slice(0, 5);
}

/**
 * Генерирует прогнозы
 */
export function generatePredictions(stats: GoalStats): Array<{
  metric: string;
  predicted_value: string;
  confidence: number;
  timeframe: string;
}> {
  const predictions = [];
  
  // Прогноз завершения целей
  if (stats.activeGoals > 0) {
    const avgCompletionRate = stats.completedGoals / Math.max(stats.totalGoals, 1);
    const predictedCompletions = Math.ceil(stats.activeGoals * Math.max(avgCompletionRate, 0.3));
    predictions.push({
      metric: "Завершение целей",
      predicted_value: `${predictedCompletions} целей`,
      confidence: Math.min(85, 50 + stats.streakDays * 5),
      timeframe: "На этой неделе",
    });
  }
  
  // Прогноз streak
  if (stats.streakDays > 0) {
    const predictedStreak = stats.streakDays + Math.ceil(stats.streakDays * 0.5);
    predictions.push({
      metric: "Серия дней",
      predicted_value: `${predictedStreak} дней`,
      confidence: Math.min(80, 60 + stats.streakDays * 2),
      timeframe: "При текущем темпе",
    });
  }
  
  return predictions;
}

// Вспомогательная функция для склонения слова "цель"
function getGoalWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "целей";
  if (lastDigit === 1) return "цель";
  if (lastDigit >= 2 && lastDigit <= 4) return "цели";
  return "целей";
}

/**
 * Проверяет и сбрасывает ежедневные цели
 */
export function checkAndResetDailyGoals(goals: Goal[]): {
  needsReset: Goal[];
  lastResetDate: string | null;
} {
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem("last_daily_reset");
  
  if (lastReset === today) {
    return { needsReset: [], lastResetDate: lastReset };
  }
  
  // Находим ежедневные цели, которые нужно сбросить
  const dailyGoals = goals.filter(g => 
    g.frequency === "daily" && 
    g.status === "active"
  );
  
  return {
    needsReset: dailyGoals,
    lastResetDate: lastReset,
  };
}

/**
 * Отмечает сброс ежедневных целей как выполненный
 */
export function markDailyResetComplete(): void {
  localStorage.setItem("last_daily_reset", new Date().toDateString());
}

/**
 * Проверяет, нужно ли показать напоминание
 */
export function shouldShowReminder(goals: Goal[]): {
  show: boolean;
  message: string;
  goalCount: number;
} {
  const now = new Date();
  const hour = now.getHours();
  
  // Показываем напоминания в определённые часы
  const reminderHours = [9, 14, 19]; // Утро, день, вечер
  
  if (!reminderHours.includes(hour)) {
    return { show: false, message: "", goalCount: 0 };
  }
  
  // Проверяем, было ли напоминание уже показано сегодня в этот час
  const lastReminder = localStorage.getItem("last_reminder");
  const reminderKey = `${now.toDateString()}-${hour}`;
  
  if (lastReminder === reminderKey) {
    return { show: false, message: "", goalCount: 0 };
  }
  
  // Находим невыполненные цели
  const incompleteGoals = goals.filter(g => 
    g.status === "active" && 
    g.current_value < g.target_value
  );
  
  if (incompleteGoals.length === 0) {
    return { show: false, message: "", goalCount: 0 };
  }
  
  // Сохраняем, что напоминание показано
  localStorage.setItem("last_reminder", reminderKey);
  
  const messages = [
    `У вас ${incompleteGoals.length} ${getGoalWord(incompleteGoals.length)} ждут выполнения!`,
    "Время для духовного прогресса! Проверьте свои цели.",
    `Осталось выполнить ${incompleteGoals.length} ${getGoalWord(incompleteGoals.length)}. Вы справитесь!`,
  ];
  
  return {
    show: true,
    message: messages[Math.floor(Math.random() * messages.length)],
    goalCount: incompleteGoals.length,
  };
}

