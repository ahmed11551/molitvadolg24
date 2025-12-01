// Хук для работы с подпиской пользователя

import { useState, useEffect } from "react";
import { getTelegramUserId } from "@/lib/telegram";
import type { SubscriptionTier, UserSubscription } from "@/types/subscription";

const DEFAULT_TIER: SubscriptionTier = "muslim";
const SUBSCRIPTION_STORAGE_KEY = "user_subscription";

/**
 * Получает тариф пользователя
 * В реальном приложении это должно приходить из API
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<SubscriptionTier>(DEFAULT_TIER);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const userId = getTelegramUserId();
      
      // Пробуем загрузить из localStorage (для демо)
      const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSubscription(parsed);
          setTier(parsed.tier || DEFAULT_TIER);
          setLoading(false);
          return;
        } catch {
          // Если не удалось распарсить, используем дефолт
        }
      }

      // TODO: В реальном приложении здесь должен быть запрос к API
      // const response = await fetch(`/api/v1/subscription?user_id=${userId}`);
      // const data = await response.json();
      
      // Пока используем дефолтный тариф
      const defaultSubscription: UserSubscription = {
        user_id: userId || "unknown",
        tier: DEFAULT_TIER,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      setSubscription(defaultSubscription);
      setTier(DEFAULT_TIER);
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(defaultSubscription));
    } catch (error) {
      console.error("Error loading subscription:", error);
      // Используем дефолтный тариф при ошибке
      setTier(DEFAULT_TIER);
    } finally {
      setLoading(false);
    }
  };

  const updateTier = async (newTier: SubscriptionTier) => {
    const userId = getTelegramUserId();
    const updated: UserSubscription = {
      user_id: userId || "unknown",
      tier: newTier,
      created_at: subscription?.created_at || new Date(),
      updated_at: new Date(),
    };
    
    setSubscription(updated);
    setTier(newTier);
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(updated));
    
    // TODO: В реальном приложении здесь должен быть запрос к API
    // await fetch(`/api/v1/subscription`, {
    //   method: "PUT",
    //   body: JSON.stringify(updated),
    // });
  };

  return {
    subscription,
    tier,
    loading,
    updateTier,
    refresh: loadSubscription,
  };
}

