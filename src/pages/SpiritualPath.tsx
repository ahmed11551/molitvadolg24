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
      
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-5xl pb-24 sm:pb-6 w-full overflow-x-hidden">
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
          {/* Простая и удобная навигация */}
          <div className="relative mb-6">
            {/* Градиентные индикаторы прокрутки */}
            {showLeftGradient && (
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            )}
            {showRightGradient && (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            )}
            
            <TabsList 
              ref={tabsListRef}
              className={cn(
                "relative flex items-center",
                "px-1 py-1.5 gap-1",
                "overflow-x-auto overflow-y-hidden",
                "bg-white/80 backdrop-blur-sm",
                "rounded-xl",
                "shadow-sm",
                "border border-border/50",
                "scroll-smooth",
                "min-h-[44px]",
                "no-scrollbar",
                "w-full"
              )}
              style={{ 
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                display: 'flex',
                flexWrap: 'nowrap'
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
                    "flex-shrink-0 flex items-center gap-1.5",
                    "px-3 py-1.5",
                    "text-sm font-medium",
                    "rounded-lg",
                    "transition-all duration-200",
                    "whitespace-nowrap",
                    "text-foreground/70",
                    "hover:text-foreground hover:bg-muted/50",
                    "data-[state=active]:bg-primary",
                    "data-[state=active]:text-white",
                    "data-[state=active]:shadow-sm"
                  )}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
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


