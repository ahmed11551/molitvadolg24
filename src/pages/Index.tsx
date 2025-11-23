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
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState("plan");
  const tabsListRef = useRef<HTMLDivElement>(null);

  const handleNavigateToCalculator = () => {
    setActiveTab("calculator");
  };

  // Auto-scroll to active tab
  useEffect(() => {
    // Small delay to ensure DOM is updated
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
          const scrollWidth = container.scrollWidth;
          
          // Calculate if tab is fully visible
          const tabRight = tabLeft + tabWidth;
          const visibleLeft = scrollLeft;
          const visibleRight = scrollLeft + containerWidth;
          
          // Padding for better visibility
          const padding = 16;
          
          let scrollTo = scrollLeft;
          
          // Check if tab is fully visible (with padding)
          const isFullyVisible = tabLeft >= visibleLeft + padding && tabRight <= visibleRight - padding;
          
          if (!isFullyVisible) {
            // If tab is cut off on the left, scroll to show it fully with padding
            if (tabLeft < visibleLeft + padding) {
              scrollTo = Math.max(0, tabLeft - padding);
            }
            // If tab is cut off on the right, scroll to show it fully with padding
            else if (tabRight > visibleRight - padding) {
              scrollTo = Math.min(
                scrollWidth - containerWidth,
                tabRight - containerWidth + padding
              );
            }
            
            // Only scroll if needed and if it makes sense
            if (Math.abs(scrollTo - scrollLeft) > 1) {
              container.scrollTo({
                left: scrollTo,
                behavior: "smooth",
              });
            }
          }
          // If tab is already fully visible, don't scroll (preserve current position)
        }
      }
    }, 150); // Delay for better reliability

    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  // Ensure scroll starts at 0 on mount and after render
  useEffect(() => {
    const resetScroll = () => {
      if (tabsListRef.current) {
        // Reset scroll to start
        tabsListRef.current.scrollLeft = 0;
      }
    };
    
    // Reset immediately
    resetScroll();
    
    // Also reset after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(resetScroll, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Also reset scroll when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (tabsListRef.current) {
        // Only reset if we're at the start or if content fits
        const container = tabsListRef.current;
        if (container.scrollWidth <= container.offsetWidth) {
          container.scrollLeft = 0;
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero pb-20 sm:pb-0">
      <MainHeader />
      <WelcomeDialog onNavigateToCalculator={handleNavigateToCalculator} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-6 max-w-5xl pb-24 sm:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Enhanced Tabs Container */}
          <div className="relative mb-6 overflow-visible">
            {/* Background with gradient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-xl opacity-50 -z-10" />
            
            <TabsList 
              ref={tabsListRef}
              className={cn(
                "relative flex w-full h-auto items-center",
                "px-3 sm:px-4 py-2.5 gap-2 sm:gap-2.5",
                "overflow-x-auto overflow-y-visible",
                "bg-white/95 backdrop-blur-md",
                "rounded-2xl border border-border/60",
                "shadow-lg shadow-primary/5",
                "scroll-smooth snap-x snap-proximity",
                "min-h-[48px] sm:min-h-[52px]",
                "tabs-scroll-container"
              )}
              style={{ 
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'auto'
              }}
            >
              <TabsTrigger 
                value="plan"
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "w-auto min-w-fit px-5 sm:px-6 py-2.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-xs sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10 whitespace-nowrap">План</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="progress"
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "w-auto min-w-fit px-5 sm:px-6 py-2.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-xs sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10 whitespace-nowrap">Прогресс</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="travel"
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "w-auto min-w-fit px-5 sm:px-6 py-2.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-xs sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10 whitespace-nowrap">Сафар</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="reports"
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "w-auto min-w-fit px-5 sm:px-6 py-2.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-xs sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10 whitespace-nowrap">Отчёты</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="calculator"
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "w-auto min-w-fit px-5 sm:px-6 py-2.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-xs sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10 whitespace-nowrap">Калькулятор</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="goals"
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "w-auto min-w-fit px-5 sm:px-6 py-2.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-xs sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10 whitespace-nowrap">Цели</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="calendar"
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "w-auto min-w-fit px-5 sm:px-6 py-2.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-xs sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10 whitespace-nowrap">Календарь</span>
              </TabsTrigger>
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
