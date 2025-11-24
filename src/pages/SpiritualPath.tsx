// Страница "Мой Духовный Путь"

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalFeed } from "@/components/spiritual-path/GoalFeed";
import { CreateGoalDialog } from "@/components/spiritual-path/CreateGoalDialog";
import { SmartGoalTemplates } from "@/components/spiritual-path/SmartGoalTemplates";
import { StreaksDisplay } from "@/components/spiritual-path/StreaksDisplay";
import { BadgesDisplay } from "@/components/spiritual-path/BadgesDisplay";
import { QazaCalculator } from "@/components/spiritual-path/QazaCalculator";
import { GroupGoals } from "@/components/spiritual-path/GroupGoals";
import { AIReports } from "@/components/spiritual-path/AIReports";
import { SmartNotifications } from "@/components/spiritual-path/SmartNotifications";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal } from "@/types/spiritual-path";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Target, Trophy, TrendingUp, BarChart3, Users, Calculator, Bell, ChevronLeft, ChevronRight } from "lucide-react";

export default function SpiritualPath() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("goals");
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

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

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await spiritualPathAPI.getGoals("active");
      setGoals(data);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
    }
  };

  // Проверка возможности прокрутки и обновление градиентов
  const updateGradients = () => {
    if (tabsListRef.current) {
      const container = tabsListRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Автоматическая прокрутка к активной вкладке
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tabsListRef.current) {
        const activeTabElement = tabsListRef.current.querySelector(
          `[data-state="active"]`
        ) as HTMLElement;
        if (activeTabElement) {
          const container = tabsListRef.current;
          const tabLeft = activeTabElement.offsetLeft;
          const tabWidth = activeTabElement.offsetWidth;
          const containerWidth = container.offsetWidth;
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
    
    container.addEventListener('scroll', updateGradients, { passive: true });
    window.addEventListener('resize', updateGradients);

    return () => {
      clearTimeout(initTimeout);
      container.removeEventListener('scroll', updateGradients);
      window.removeEventListener('resize', updateGradients);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero pb-20 sm:pb-0">
      <MainHeader />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl pb-24 sm:pb-6 w-full overflow-x-hidden">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
              <Target className="w-8 h-8 text-primary" />
              Мой Духовный Путь
            </h1>
            <p className="text-muted-foreground">
              Отслеживайте цели, анализируйте прогресс и развивайтесь духовно
            </p>
          </div>
          <CreateGoalDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onGoalCreated={loadGoals}
          >
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Добавить цель
            </Button>
          </CreateGoalDialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Профессиональная навигация с улучшенным дизайном */}
          <div className="relative mb-6">
            {/* Фоновое свечение для глубины */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl blur-2xl opacity-60 -z-10" />
            
            {/* Кнопка прокрутки влево */}
            {showLeftGradient && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 z-30",
                  "h-9 w-9 rounded-full",
                  "bg-white/95 backdrop-blur-md shadow-lg",
                  "border border-primary/20",
                  "hover:bg-white hover:shadow-xl hover:scale-110",
                  "active:scale-95",
                  "transition-all duration-300",
                  "group"
                )}
                onClick={() => {
                  if (tabsListRef.current) {
                    const scrollAmount = tabsListRef.current.clientWidth * 0.7;
                    tabsListRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors" />
              </Button>
            )}

            {/* Кнопка прокрутки вправо */}
            {showRightGradient && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 z-30",
                  "h-9 w-9 rounded-full",
                  "bg-white/95 backdrop-blur-md shadow-lg",
                  "border border-primary/20",
                  "hover:bg-white hover:shadow-xl hover:scale-110",
                  "active:scale-95",
                  "transition-all duration-300",
                  "group"
                )}
                onClick={() => {
                  if (tabsListRef.current) {
                    const scrollAmount = tabsListRef.current.clientWidth * 0.7;
                    tabsListRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                  }
                }}
              >
                <ChevronRight className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors" />
              </Button>
            )}

            {/* Улучшенные градиентные индикаторы прокрутки */}
            {showLeftGradient && (
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background via-background/95 to-transparent z-20 pointer-events-none transition-opacity duration-300" />
            )}
            {showRightGradient && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background via-background/95 to-transparent z-20 pointer-events-none transition-opacity duration-300" />
            )}
            
            <TabsList 
              ref={tabsListRef}
              className={cn(
                "relative flex items-center",
                "px-3 sm:px-5 py-2.5 gap-2 sm:gap-3",
                "overflow-x-auto overflow-y-hidden",
                "bg-white/95 backdrop-blur-xl",
                "rounded-3xl",
                "shadow-xl shadow-primary/10",
                "border border-primary/15",
                "scroll-smooth snap-x snap-mandatory",
                "min-h-[52px] sm:min-h-[56px]",
                "no-scrollbar",
                "w-full",
                "max-w-full"
              )}
              style={{ 
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                display: 'flex',
                flexWrap: 'nowrap',
                paddingLeft: showLeftGradient ? '3rem' : undefined,
                paddingRight: showRightGradient ? '3rem' : undefined
              }}
            >
              {[
                { value: "goals", label: "Цели", icon: Target },
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
                    "flex-shrink-0 flex items-center gap-2 sm:gap-2.5",
                    "px-4 sm:px-5 py-2.5",
                    "text-sm sm:text-base font-medium",
                    "rounded-2xl",
                    "transition-all duration-300 ease-out",
                    "whitespace-nowrap",
                    "snap-start",
                    "relative",
                    "text-foreground/70 bg-transparent",
                    "hover:text-foreground hover:bg-primary/10",
                    "active:scale-[0.97]",
                    "data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:via-primary data-[state=active]:to-primary/90",
                    "data-[state=active]:text-white",
                    "data-[state=active]:shadow-lg data-[state=active]:shadow-primary/40",
                    "data-[state=active]:scale-[1.02]",
                    "data-[state=active]:font-semibold",
                    "data-[state=active]:before:absolute data-[state=active]:before:inset-0 data-[state=active]:before:rounded-2xl data-[state=active]:before:bg-gradient-to-br data-[state=active]:before:from-white/20 data-[state=active]:before:to-transparent data-[state=active]:before:pointer-events-none"
                  )}
                >
                  <tab.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="goals">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Загрузка целей...</div>
              </div>
            ) : (
              <Tabs defaultValue="feed" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="feed">Мои цели</TabsTrigger>
                  <TabsTrigger value="templates">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Умные предложения
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="feed">
                  <GoalFeed goals={goals} onRefresh={loadGoals} />
                </TabsContent>
                <TabsContent value="templates">
                  <SmartGoalTemplates onTemplateSelected={loadGoals} />
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>

          <TabsContent value="streaks">
            <StreaksDisplay />
          </TabsContent>

          <TabsContent value="badges">
            <BadgesDisplay />
          </TabsContent>

          <TabsContent value="analytics">
            <AIReports />
          </TabsContent>

          <TabsContent value="groups">
            <GroupGoals goals={goals} onRefresh={loadGoals} />
          </TabsContent>

          <TabsContent value="qaza">
            <QazaCalculator />
          </TabsContent>

          <TabsContent value="notifications">
            <SmartNotifications />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}


