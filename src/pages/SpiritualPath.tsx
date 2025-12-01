// Страница "Мой Духовный Путь"

import { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalsWithCalendar } from "@/components/spiritual-path/GoalsWithCalendar";
import { CreateGoalDialog } from "@/components/spiritual-path/CreateGoalDialog";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal } from "@/types/spiritual-path";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Target, Trophy, TrendingUp, BarChart3, Users, Calculator, Bell, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy loading для тяжелых компонентов
const HabitRemindersWithCatalog = lazy(() => 
  import("@/components/spiritual-path/HabitRemindersWithCatalog").then(m => ({
    default: m.HabitRemindersWithCatalog
  }))
);
const StreaksDisplay = lazy(() => 
  import("@/components/spiritual-path/StreaksDisplay").then(m => ({
    default: m.StreaksDisplay
  }))
);
const BadgesDisplay = lazy(() => 
  import("@/components/spiritual-path/BadgesDisplay").then(m => ({
    default: m.BadgesDisplay
  }))
);
const AIReports = lazy(() => 
  import("@/components/spiritual-path/AIReports").then(m => ({
    default: m.AIReports
  }))
);
const GroupGoals = lazy(() => 
  import("@/components/spiritual-path/GroupGoals").then(m => ({
    default: m.GroupGoals
  }))
);
const QazaCalculator = lazy(() => 
  import("@/components/spiritual-path/QazaCalculator").then(m => ({
    default: m.QazaCalculator
  }))
);
const SmartNotifications = lazy(() => 
  import("@/components/spiritual-path/SmartNotifications").then(m => ({
    default: m.SmartNotifications
  }))
);

// Компонент загрузки
const TabSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export default function SpiritualPath() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const tabFromUrl = searchParams.get("tab") || "goals";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  // Обновляем активную вкладку при изменении URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Мемоизируем обработчик смены таба
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  }, [setSearchParams]);

  // Проверка возможности прокрутки при загрузке
  useEffect(() => {
    const checkScroll = () => {
      if (tabsListRef.current) {
        const container = tabsListRef.current;
        const { scrollWidth, clientWidth } = container;
        const canScroll = scrollWidth > clientWidth;
        setShowRightGradient(canScroll);
      }
    };
    
    // Проверяем сразу и после небольшой задержки
    checkScroll();
    const timeout = setTimeout(checkScroll, 200);
    
    return () => clearTimeout(timeout);
  }, []);

  // Мемоизируем функцию загрузки целей
  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      // Загружаем все цели, не только активные, чтобы видеть все
      const data = await spiritualPathAPI.getGoals();
      // Фильтруем активные для отображения
      const activeGoals = data.filter(g => g.status === "active");
      setGoals(activeGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Мемоизируем функцию обновления градиентов с throttle
  const updateGradients = useCallback(() => {
    if (tabsListRef.current) {
      const container = tabsListRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  // Throttle для updateGradients
  const throttledUpdateGradients = useRef<NodeJS.Timeout | null>(null);
  const updateGradientsThrottled = useCallback(() => {
    if (throttledUpdateGradients.current) return;
    throttledUpdateGradients.current = setTimeout(() => {
      updateGradients();
      throttledUpdateGradients.current = null;
    }, 16); // ~60fps
  }, [updateGradients]);

  // Автоматическая прокрутка к активной вкладке
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tabsListRef.current) {
        const activeTabElement = tabsListRef.current.querySelector(
          `[data-state="active"]`
        ) as HTMLElement;
        if (activeTabElement) {
          const container = tabsListRef.current;
          const tabLeft = activeTabElement.offsetLeft - container.offsetLeft;
          const tabWidth = activeTabElement.offsetWidth;
          const containerWidth = container.clientWidth;
          const scrollLeft = container.scrollLeft;
          
          const padding = 16;
          const tabRight = tabLeft + tabWidth;
          const visibleLeft = scrollLeft;
          const visibleRight = scrollLeft + containerWidth;
          
          const isFullyVisible = tabLeft >= visibleLeft + padding && tabRight <= visibleRight - padding;
          
          if (!isFullyVisible) {
            let scrollTo = scrollLeft;
            if (tabLeft < visibleLeft + padding) {
              scrollTo = Math.max(0, tabLeft - padding);
            } else if (tabRight > visibleRight - padding) {
              scrollTo = tabRight - containerWidth + padding;
            }
            
            if (Math.abs(scrollTo - scrollLeft) > 1) {
              container.scrollTo({
                left: scrollTo,
                behavior: "smooth",
              });
            }
          }
        }
        updateGradients();
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  // Обновление градиентов при прокрутке и изменении размера
  useEffect(() => {
    const container = tabsListRef.current;
    if (!container) return;

    // Инициализация градиентов с небольшой задержкой для корректного расчета размеров
    const initTimeout = setTimeout(() => {
      updateGradients();
    }, 100);
    
    container.addEventListener('scroll', updateGradientsThrottled, { passive: true });
    window.addEventListener('resize', updateGradientsThrottled, { passive: true });

    return () => {
      clearTimeout(initTimeout);
      if (throttledUpdateGradients.current) {
        clearTimeout(throttledUpdateGradients.current);
      }
      container.removeEventListener('scroll', updateGradientsThrottled);
      window.removeEventListener('resize', updateGradientsThrottled);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero pb-20 sm:pb-0">
      <MainHeader />
      
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-5xl pb-24 sm:pb-6 w-full overflow-x-hidden">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Target className="w-8 h-8 text-primary" />
            Мой Духовный Путь
          </h1>
          <p className="text-muted-foreground">
            Отслеживайте цели, анализируйте прогресс и развивайтесь духовно
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Навигация с правильной горизонтальной прокруткой */}
          <div className="relative mb-6 w-full overflow-hidden">
            {/* Градиентные индикаторы прокрутки */}
            {showLeftGradient && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
            )}
            {showRightGradient && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
            )}
            
            <div 
              ref={tabsListRef}
              className={cn(
                "flex items-center",
                "overflow-x-auto overflow-y-hidden",
                "scroll-smooth",
                "no-scrollbar",
                "w-full",
                "-mx-2 px-2"
              )}
              style={{ 
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <TabsList 
                className={cn(
                  "inline-flex items-center",
                  "h-10 px-1 gap-1",
                  "bg-muted/50",
                  "rounded-lg",
                  "p-1",
                  "min-w-max"
                )}
              >
                {[
                  { value: "goals", label: "Цели", icon: Target },
                  { value: "habits", label: "Привычки", icon: BookOpen },
                  { value: "streaks", label: "Серии", icon: TrendingUp },
                  { value: "badges", label: "Бейджи", icon: Trophy },
                  { value: "analytics", label: "Аналитика", icon: BarChart3 },
                  { value: "groups", label: "Группы", icon: Users },
                  { value: "qaza", label: "Каза", icon: Calculator },
                  { value: "notifications", label: "Уведомления", icon: Bell },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5",
                      "px-3 py-1.5",
                      "text-sm font-medium",
                      "rounded-md",
                      "transition-all",
                      "whitespace-nowrap",
                      "data-[state=active]:bg-background",
                      "data-[state=active]:text-foreground",
                      "data-[state=active]:shadow-sm"
                    )}
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <TabsContent value="goals">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Загрузка целей...</div>
              </div>
            ) : (
              <GoalsWithCalendar goals={goals} onRefresh={loadGoals} />
            )}
          </TabsContent>

          <TabsContent value="habits">
            <Suspense fallback={<TabSkeleton />}>
              <HabitRemindersWithCatalog />
            </Suspense>
          </TabsContent>
          <TabsContent value="streaks">
            <Suspense fallback={<TabSkeleton />}>
              <StreaksDisplay />
            </Suspense>
          </TabsContent>

          <TabsContent value="badges">
            <Suspense fallback={<TabSkeleton />}>
              <BadgesDisplay />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics">
            <Suspense fallback={<TabSkeleton />}>
              <AIReports />
            </Suspense>
          </TabsContent>

          <TabsContent value="challenges">
            <Suspense fallback={<TabSkeleton />}>
              <ChallengesSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="groups">
            <Suspense fallback={<TabSkeleton />}>
              <GroupGoals goals={goals} onRefresh={loadGoals} />
            </Suspense>
          </TabsContent>

          <TabsContent value="qaza">
            <Suspense fallback={<TabSkeleton />}>
              <QazaCalculator />
            </Suspense>
          </TabsContent>

          <TabsContent value="notifications">
            <Suspense fallback={<TabSkeleton />}>
              <SmartNotifications />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}


