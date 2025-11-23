// Умный Тасбих и Трекер Зикров (Версия 2.0)
// Согласно ТЗ: модуль с глубокой аналитикой, офлайн-режимом, ежедневными азкарами

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Undo2,
  Plus,
  Target,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smartTasbihAPI, eReplikaAPI, spiritualPathAPI } from "@/lib/api";
import { initOfflineQueue, addOfflineEvent, getUnsyncedEvents, syncOfflineEvents } from "@/lib/offline-queue";
import { getAvailableItemsByCategory } from "@/lib/dhikr-data";
import type { Category, GoalType, PrayerSegment, TasbihGoal, TasbihSession, DailyAzkar } from "@/types/smart-tasbih";
import type { Goal } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { hapticFeedback, showTelegramNotification } from "@/lib/telegram";

interface SmartTasbihV2Props {
  goalId?: string;
}

const PRAYER_SEGMENTS: Array<{ value: PrayerSegment; label: string; icon: string }> = [
  { value: "fajr", label: "Фаджр", icon: "🌅" },
  { value: "dhuhr", label: "Зухр", icon: "☀️" },
  { value: "asr", label: "Аср", icon: "🌤️" },
  { value: "maghrib", label: "Магриб", icon: "🌆" },
  { value: "isha", label: "Иша", icon: "🌙" },
];

export const SmartTasbihV2 = ({ goalId }: SmartTasbihV2Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeGoal, setActiveGoal] = useState<TasbihGoal | null>(null);
  const [activeSession, setActiveSession] = useState<TasbihSession | null>(null);
  const [dailyAzkar, setDailyAzkar] = useState<DailyAzkar | null>(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category>("dua");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [loadingItems, setLoadingItems] = useState(false);
  const [spiritualPathGoals, setSpiritualPathGoals] = useState<Goal[]>([]);

  // Инициализация
  useEffect(() => {
    init();
  }, []);

  // Синхронизация офлайн-событий при восстановлении связи
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Загрузка элементов категории
  useEffect(() => {
    if (selectedCategory && selectedCategory !== "general") {
      loadCategoryItems();
    }
  }, [selectedCategory]);

  const init = async () => {
    setLoading(true);
    try {
      // Инициализация офлайн-очереди
      await initOfflineQueue();

      // Загрузка состояния
      const bootstrap = await smartTasbihAPI.bootstrap();
      setActiveGoal(bootstrap.active_goal || null);
      setDailyAzkar(bootstrap.daily_azkar || null);

      // Если есть активная цель, начинаем сессию
      if (bootstrap.active_goal) {
        await startSessionForGoal(bootstrap.active_goal);
      }

      // Загружаем цели из spiritual-path модуля
      await loadSpiritualPathGoals();

      // Синхронизация офлайн-событий
      await syncOfflineQueue();
    } catch (error) {
      console.error("Error initializing:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpiritualPathGoals = async () => {
    try {
      const goals = await spiritualPathAPI.getGoals("active");
      setSpiritualPathGoals(goals);
    } catch (error) {
      console.error("Error loading spiritual path goals:", error);
    }
  };

  // Определение типа счетчика на основе категории и элемента
  const getCounterType = (category: Category, item?: any): string | null => {
    if (category === "salawat") return "salawat";
    if (category === "azkar") {
      // Определяем по названию элемента
      const title = item?.title?.toLowerCase() || item?.translation?.toLowerCase() || "";
      if (title.includes("тасбих") || title.includes("субханаллах")) return "tasbih";
      if (title.includes("тахмид") || title.includes("альхамдулиллах")) return "tahmid";
      if (title.includes("такбир") || title.includes("аллаху акбар")) return "takbir";
      return "tasbih"; // По умолчанию
    }
    return null;
  };

  // Получение связанных целей для текущего типа счетчика
  const linkedGoals = useMemo(() => {
    if (!selectedCategory || !selectedItem) return [];
    const counterType = getCounterType(selectedCategory, selectedItem);
    if (!counterType) return [];
    return spiritualPathGoals.filter(g => g.linked_counter_type === counterType);
  }, [selectedCategory, selectedItem, spiritualPathGoals]);

  const loadCategoryItems = async () => {
    setLoadingItems(true);
    try {
      let items: any[] = [];
      switch (selectedCategory) {
        case "dua":
          items = await getAvailableItemsByCategory("dua");
          break;
        case "azkar":
          items = await getAvailableItemsByCategory("adhkar");
          break;
        case "salawat":
          items = await getAvailableItemsByCategory("salawat");
          break;
        case "kalimat":
          items = await getAvailableItemsByCategory("kalima");
          break;
      }
      setAvailableItems(items);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const syncOfflineQueue = async () => {
    try {
      const unsyncedEvents = await getUnsyncedEvents();
      if (unsyncedEvents.length > 0) {
        await smartTasbihAPI.syncOfflineEvents(unsyncedEvents);
      }
    } catch (error) {
      console.error("Error syncing offline queue:", error);
    }
  };

  const startSessionForGoal = async (goal: TasbihGoal) => {
    try {
      const session = await smartTasbihAPI.startSession({
        goal_id: goal.id,
        category: goal.category,
        item_id: goal.item_id,
        prayer_segment: goal.prayer_segment,
      });
      setActiveSession(session);
      setCurrentCount(goal.progress);

      // Загружаем данные элемента, если есть item_id
      if (goal.item_id) {
        try {
          const { getDhikrItemById } = await import("@/lib/dhikr-data");
          const itemData = await getDhikrItemById(goal.item_id, goal.category as any);
          if (itemData) {
            setSelectedItem(itemData);
          }
        } catch (error) {
          console.error("Error loading item data:", error);
        }
      }
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  const handleTap = useCallback(async (delta: number = 1) => {
    // Защита от спама (не чаще 2 раз в секунду)
    const now = Date.now();
    if (now - lastTapTime < 500) {
      return;
    }
    setLastTapTime(now);

    if (!activeSession) {
      toast({
        title: "Ошибка",
        description: "Сессия не начата",
        variant: "destructive",
      });
      return;
    }

    const newCount = currentCount + delta;
    setCurrentCount(newCount);

    // Тактильная обратная связь
    hapticFeedback("light");

    try {
      const offline_id = await addOfflineEvent("tap", {
        session_id: activeSession.id,
        delta,
        event_type: "tap",
        prayer_segment: activeSession.prayer_segment,
      });

      const response = await smartTasbihAPI.counterTap({
        session_id: activeSession.id,
        delta,
        event_type: "tap",
        offline_id,
        prayer_segment: activeSession.prayer_segment,
      });

      // Обновляем состояние
      if (response.goal_progress) {
        if (activeGoal) {
          setActiveGoal({
            ...activeGoal,
            progress: response.goal_progress.progress,
            status: response.goal_progress.is_completed ? "completed" : "active",
          });
        }

        if (response.goal_progress.is_completed) {
          showTelegramNotification("success");
          toast({
            title: "Цель достигнута!",
            description: "Ма ша Аллах!",
          });
        }
      }

      if (response.daily_azkar) {
        setDailyAzkar(response.daily_azkar);
      }

      // Синхронизация с целями из spiritual-path модуля
      const counterType = getCounterType(selectedCategory, selectedItem);
      if (counterType && delta > 0) {
        try {
          await spiritualPathAPI.syncCounter(counterType, delta);
          // Обновляем список целей
          await loadSpiritualPathGoals();
        } catch (error) {
          console.error("Error syncing with spiritual path goals:", error);
          // Не показываем ошибку пользователю
        }
      }

      // Сохраняем последнее событие для Undo
      setLastEvent({ delta, value_after: response.value_after });
      setCanUndo(true);

      // Таймер для Undo (5 секунд)
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }
      const timeout = setTimeout(() => {
        setCanUndo(false);
        setLastEvent(null);
      }, 5000);
      setUndoTimeout(timeout);
    } catch (error: any) {
      // Если ошибка, событие уже в офлайн-очереди
      console.error("Error tapping:", error);
    }
  }, [activeSession, currentCount, lastTapTime, activeGoal, undoTimeout]);

  const handleUndo = useCallback(async () => {
    if (!lastEvent || !activeSession) return;

    try {
      // Отменяем последнее действие
      const offline_id = await addOfflineEvent("tap", {
        session_id: activeSession.id,
        delta: -lastEvent.delta,
        event_type: "tap",
        prayer_segment: activeSession.prayer_segment,
      });

      await smartTasbihAPI.counterTap({
        session_id: activeSession.id,
        delta: -lastEvent.delta,
        event_type: "tap",
        offline_id,
        prayer_segment: activeSession.prayer_segment,
      });

      setCurrentCount(currentCount - lastEvent.delta);
      setCanUndo(false);
      setLastEvent(null);
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }

      hapticFeedback("medium");
      toast({
        title: "Отменено",
        description: "Последнее действие отменено",
      });
    } catch (error) {
      console.error("Error undoing:", error);
    }
  }, [lastEvent, activeSession, currentCount, undoTimeout]);

  const handleBulkTap = useCallback((delta: number) => {
    handleTap(delta);
  }, [handleTap]);

  const handleRepeat = useCallback(async () => {
    if (!activeGoal || activeGoal.goal_type !== "learn") return;

    try {
      const offline_id = await addOfflineEvent("tap", {
        session_id: activeSession?.id || "",
        delta: 0,
        event_type: "repeat",
        prayer_segment: activeSession?.prayer_segment || "none",
      });

      await smartTasbihAPI.counterTap({
        session_id: activeSession?.id || "",
        delta: 0,
        event_type: "repeat",
        offline_id,
        prayer_segment: activeSession?.prayer_segment || "none",
      });

      hapticFeedback("medium");
      toast({
        title: "Повтор зафиксирован",
        description: "Продолжайте практику",
      });
    } catch (error) {
      console.error("Error recording repeat:", error);
    }
  }, [activeGoal, activeSession]);

  const handleLearned = useCallback(async () => {
    if (!activeGoal || activeGoal.goal_type !== "learn") return;

    try {
      await smartTasbihAPI.markLearned(activeGoal.id);
      setActiveGoal({
        ...activeGoal,
        status: "completed",
      });

      hapticFeedback("heavy");
      showTelegramNotification("success");
      toast({
        title: "Выучено!",
        description: "Ма ша Аллах! Цель завершена",
      });
    } catch (error) {
      console.error("Error marking learned:", error);
    }
  }, [activeGoal]);

  const handleReset = useCallback(async () => {
    if (!activeSession) return;

    try {
      const offline_id = await addOfflineEvent("tap", {
        session_id: activeSession.id,
        delta: -currentCount,
        event_type: "auto_reset",
        prayer_segment: activeSession.prayer_segment,
      });

      await smartTasbihAPI.counterTap({
        session_id: activeSession.id,
        delta: -currentCount,
        event_type: "auto_reset",
        offline_id,
        prayer_segment: activeSession.prayer_segment,
      });

      setCurrentCount(0);
      hapticFeedback("medium");
      toast({
        title: "Сброшено",
        description: "Счетчик обнулен",
      });
    } catch (error) {
      console.error("Error resetting:", error);
    }
  }, [activeSession, currentCount]);

  const handlePrayerSegmentTap = async (segment: PrayerSegment) => {
    try {
      // Создаем цель для ежедневных азкаров
      const goal = await smartTasbihAPI.createOrUpdateGoal({
        category: "azkar",
        goal_type: "recite",
        target_count: 99,
        prayer_segment: segment,
      });

      setActiveGoal(goal);
      await startSessionForGoal(goal);
    } catch (error) {
      console.error("Error creating azkar goal:", error);
    }
  };

  const isCountdownMode = activeGoal?.prayer_segment !== "none" && activeGoal?.category === "azkar";
  const displayCount = isCountdownMode 
    ? Math.max(0, activeGoal.target_count - currentCount)
    : currentCount;

  const isComplete = activeGoal && (
    (isCountdownMode && displayCount === 0) ||
    (!isCountdownMode && currentCount >= activeGoal.target_count)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ежедневные азкары (5x99) */}
      {dailyAzkar && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Ежедневные азкары (5x99)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PRAYER_SEGMENTS.map((segment) => {
                const count = (dailyAzkar as any)[segment.value] || 0;
                const isComplete = count >= 99;
                return (
                  <div key={segment.value} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{segment.icon}</span>
                        <span className="font-semibold">{segment.label}</span>
                      </div>
                      <Badge variant={isComplete ? "default" : "outline"}>
                        {count}/99
                      </Badge>
                    </div>
                    <Progress 
                      value={(count / 99) * 100} 
                      className={cn("h-2", isComplete && "bg-primary")}
                    />
                    {!isComplete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrayerSegmentTap(segment.value)}
                        className="w-full"
                      >
                        Начать азкары {segment.label}
                      </Button>
                    )}
                  </div>
                );
              })}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Всего</span>
                  <Badge variant={dailyAzkar.is_complete ? "default" : "outline"}>
                    {dailyAzkar.total}/495
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Выбор категории и элемента */}
      {!activeGoal && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Выберите категорию</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={selectedCategory}
              onValueChange={(v) => setSelectedCategory(v as Category)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dua">Дуа</SelectItem>
                <SelectItem value="azkar">Азкары</SelectItem>
                <SelectItem value="salawat">Салаваты</SelectItem>
                <SelectItem value="kalimat">Калимы</SelectItem>
              </SelectContent>
            </Select>

            {loadingItems ? (
              <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableItems.map((item) => (
                  <Card
                    key={item.id}
                    className={cn(
                      "cursor-pointer hover:bg-secondary/50 transition-colors",
                      selectedItem?.id === item.id && "border-primary"
                    )}
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm">{item.translation || item.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedItem && (
              <div className="space-y-2">
                {/* Предложение связать с целями из spiritual-path */}
                {linkedGoals.length > 0 && (
                  <div className="bg-primary/5 rounded-lg p-3 mb-2">
                    <p className="text-xs font-semibold mb-1">
                      💡 У вас есть {linkedGoals.length} связан{linkedGoals.length === 1 ? "ая" : "ых"} цель{linkedGoals.length === 1 ? "" : "ей"}:
                    </p>
                    {linkedGoals.map((goal) => (
                      <p key={goal.id} className="text-xs text-muted-foreground">
                        • {goal.title}
                      </p>
                    ))}
                    <p className="text-xs text-muted-foreground mt-1">
                      Прогресс будет обновляться автоматически
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={async () => {
                    const goal = await smartTasbihAPI.createOrUpdateGoal({
                      category: selectedCategory,
                      item_id: selectedItem.id,
                      goal_type: "recite",
                      target_count: selectedItem.count || 33,
                    });
                    setActiveGoal(goal);
                    setSelectedItem(selectedItem); // Сохраняем выбранный элемент
                    await startSessionForGoal(goal);
                  }}
                >
                  Начать (Произнести)
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    const goal = await smartTasbihAPI.createOrUpdateGoal({
                      category: selectedCategory,
                      item_id: selectedItem.id,
                      goal_type: "learn",
                      target_count: 1,
                    });
                    setActiveGoal(goal);
                    setSelectedItem(selectedItem); // Сохраняем выбранный элемент
                    await startSessionForGoal(goal);
                  }}
                >
                  Начать (Выучить)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Главный экран (активная сессия) */}
      {activeGoal && activeSession && (
        <Card className="bg-gradient-card border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {activeGoal.category === "azkar" && activeGoal.prayer_segment !== "none"
                  ? `Азкары ${PRAYER_SEGMENTS.find(s => s.value === activeGoal.prayer_segment)?.label}`
                  : selectedItem?.translation || "Тасбих"}
              </CardTitle>
              {!isOnline && (
                <Badge variant="outline" className="text-xs">
                  Офлайн
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Контент */}
            {selectedItem && (
              <div className="space-y-4">
                {selectedItem.arabic && (
                  <div className="text-center py-4">
                    <p
                      className="text-4xl font-arabic text-foreground"
                      style={{ fontFamily: "'Amiri', serif" }}
                      dir="rtl"
                    >
                      {selectedItem.arabic}
                    </p>
                  </div>
                )}
                {selectedItem.transcription && (
                  <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-xl p-4">
                    <p className="text-center text-lg italic">{selectedItem.transcription}</p>
                  </div>
                )}
                {selectedItem.translation && (
                  <div className="bg-gradient-to-br from-primary/8 to-primary/3 rounded-xl p-4">
                    <p className="text-center text-base">{selectedItem.translation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Счетчик */}
            <div className="text-center">
              <div
                className={cn(
                  "inline-flex items-center justify-center w-32 h-32 rounded-full border-4 transition-all duration-300 cursor-pointer",
                  isComplete
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border/30 bg-secondary/30 hover:border-primary/50"
                )}
                onClick={() => handleTap()}
              >
                <div className="text-center">
                  <div className={cn(
                    "text-4xl font-bold transition-colors",
                    isComplete ? "gradient-text" : "text-foreground"
                  )}>
                    {displayCount}
                  </div>
                  {!isCountdownMode && (
                    <div className="text-sm text-muted-foreground">
                      / {activeGoal.target_count}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Прогресс */}
            <Progress
              value={
                isCountdownMode
                  ? ((activeGoal.target_count - displayCount) / activeGoal.target_count) * 100
                  : (currentCount / activeGoal.target_count) * 100
              }
              className="h-3"
            />

            {/* Кнопки действий */}
            <div className="space-y-2">
              {activeGoal.goal_type === "recite" ? (
                <>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => handleTap()}
                      disabled={isComplete}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Произнес
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkTap(10)}
                      disabled={isComplete}
                    >
                      +10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkTap(33)}
                      disabled={isComplete}
                    >
                      +33
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkTap(50)}
                      disabled={isComplete}
                    >
                      +50
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkTap(100)}
                      disabled={isComplete}
                    >
                      +100
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleRepeat}
                  >
                    Повторил
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleLearned}
                    disabled={activeGoal.status === "completed"}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Выучил
                  </Button>
                </div>
              )}
            </div>

            {/* Undo кнопка */}
            {canUndo && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleUndo}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Отменить (5 сек)
              </Button>
            )}

            {isComplete && (
              <div className="text-center">
                <p className="text-sm gradient-text-gold font-semibold animate-pulse">
                  ✨ Завершено! Ма ша Аллах
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

