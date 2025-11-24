import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorSection } from "@/components/qaza/CalculatorSection";
import { ProgressSection } from "@/components/qaza/ProgressSection";
import { TravelPrayersSection } from "@/components/qaza/TravelPrayersSection";
import { ReportsSection } from "@/components/qaza/ReportsSection";
import { RepaymentPlanSection } from "@/components/qaza/RepaymentPlanSection";
import { TermsDictionary } from "@/components/qaza/TermsDictionary";
import { ShareAndFriends } from "@/components/qaza/ShareAndFriends";
import { GoalsAndHabits } from "@/components/qaza/GoalsAndHabits";
import { PrayerCalendar } from "@/components/qaza/PrayerCalendar";
import { RemindersManager } from "@/components/qaza/RemindersManager";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { WelcomeDialog } from "@/components/qaza/WelcomeDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState("plan");
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

  const handleNavigateToCalculator = () => {
    setActiveTab("calculator");
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
      <WelcomeDialog onNavigateToCalculator={handleNavigateToCalculator} />

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-5xl pb-24 sm:pb-6 w-full overflow-x-hidden">
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
                { value: "plan", label: "План" },
                { value: "progress", label: "Прогресс" },
                { value: "travel", label: "Сафар" },
                { value: "reports", label: "Отчёты" },
                { value: "calculator", label: "Калькулятор" },
                { value: "goals", label: "Цели" },
                { value: "calendar", label: "Календарь" },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex-shrink-0",
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
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="plan">
            <RepaymentPlanSection />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressSection />
          </TabsContent>

          <TabsContent value="travel">
            <TravelPrayersSection />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsSection />
            <ShareAndFriends />
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <CalculatorSection />
            <TermsDictionary />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsAndHabits />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <PrayerCalendar />
            <RemindersManager />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
