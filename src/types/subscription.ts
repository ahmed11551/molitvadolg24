// Типы для системы тарифов и монетизации

export type SubscriptionTier = 
  | "muslim"      // Муслим (Бесплатно)
  | "mutahsin"    // Мутахсин (PRO)
  | "sahib_al_waqf"; // Сахиб аль-Вакф (Premium)

export interface UserSubscription {
  user_id: string;
  tier: SubscriptionTier;
  expires_at?: Date; // Для платных тарифов
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionFeatures {
  unlimited_goals: boolean;
  basic_goal_templates: boolean;
  advanced_goal_templates: boolean;
  manual_qaza_calculator: boolean;
  intelligent_qaza_calculator: boolean;
  weekly_digest: boolean;
  ai_reports_basic: boolean;
  ai_reports_advanced: boolean;
  ai_reports_premium: boolean;
  group_goals: boolean;
  basic_streaks: boolean;
  advanced_gamification: boolean;
  exclusive_badges: boolean;
  priority_notifications: boolean;
}

// Функции для проверки доступности функций по тарифу
export const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  muslim: {
    unlimited_goals: true,
    basic_goal_templates: true,
    advanced_goal_templates: false,
    manual_qaza_calculator: true,
    intelligent_qaza_calculator: false,
    weekly_digest: true,
    ai_reports_basic: true,
    ai_reports_advanced: false,
    ai_reports_premium: false,
    group_goals: false,
    basic_streaks: true,
    advanced_gamification: false,
    exclusive_badges: false,
    priority_notifications: false,
  },
  mutahsin: {
    unlimited_goals: true,
    basic_goal_templates: true,
    advanced_goal_templates: true,
    manual_qaza_calculator: true,
    intelligent_qaza_calculator: true,
    weekly_digest: true,
    ai_reports_basic: true,
    ai_reports_advanced: true,
    ai_reports_premium: false,
    group_goals: false,
    basic_streaks: true,
    advanced_gamification: true,
    exclusive_badges: false,
    priority_notifications: false,
  },
  sahib_al_waqf: {
    unlimited_goals: true,
    basic_goal_templates: true,
    advanced_goal_templates: true,
    manual_qaza_calculator: true,
    intelligent_qaza_calculator: true,
    weekly_digest: true,
    ai_reports_basic: true,
    ai_reports_advanced: true,
    ai_reports_premium: true,
    group_goals: true,
    basic_streaks: true,
    advanced_gamification: true,
    exclusive_badges: true,
    priority_notifications: true,
  },
};

/**
 * Проверяет, доступна ли функция для тарифа
 */
export function hasFeature(tier: SubscriptionTier, feature: keyof SubscriptionFeatures): boolean {
  return TIER_FEATURES[tier][feature];
}

/**
 * Получает название тарифа на русском
 */
export function getTierName(tier: SubscriptionTier): string {
  switch (tier) {
    case "muslim":
      return "Муслим";
    case "mutahsin":
      return "Мутахсин";
    case "sahib_al_waqf":
      return "Сахиб аль-Вакф";
    default:
      return "Муслим";
  }
}

/**
 * Получает описание тарифа
 */
export function getTierDescription(tier: SubscriptionTier): string {
  switch (tier) {
    case "muslim":
      return "Бесплатный тариф с базовыми возможностями";
    case "mutahsin":
      return "PRO тариф с расширенными функциями";
    case "sahib_al_waqf":
      return "Premium тариф со всеми возможностями";
    default:
      return "Бесплатный тариф";
  }
}

