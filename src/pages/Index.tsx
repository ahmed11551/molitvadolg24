// Страница Каза - Пропущенные намазы

import { useState, useRef, useEffect } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { CalculatorSection } from "@/components/qaza/CalculatorSection";
import { ProgressSection } from "@/components/qaza/ProgressSection";
import { ReportsSection } from "@/components/qaza/ReportsSection";
import { RepaymentPlanSection } from "@/components/qaza/RepaymentPlanSection";
import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";
import { WelcomeDialog } from "@/components/qaza/WelcomeDialog";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calculator,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";

type TabType = "overview" | "calculator" | "plan" | "progress" | "reports";

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Обзор", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "calculator", label: "Калькулятор", icon: <Calculator className="w-4 h-4" /> },
  { id: "plan", label: "План", icon: <Calendar className="w-4 h-4" /> },
  { id: "progress", label: "Прогресс", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "reports", label: "Отчёты", icon: <BarChart3 className="w-4 h-4" /> },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  const handleNavigateToCalculator = () => {
    setActiveTab("calculator");
  };

  // Обновление градиентов прокрутки
  const updateGradients = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const container = tabsRef.current;
    if (!container) return;

    // Инициализация
    const checkScroll = () => {
      const { scrollWidth, clientWidth } = container;
      setShowRightGradient(scrollWidth > clientWidth + 1);
    };
    checkScroll();
    setTimeout(checkScroll, 150);

    container.addEventListener("scroll", updateGradients, { passive: true });
    window.addEventListener("resize", updateGradients);

    return () => {
      container.removeEventListener("scroll", updateGradients);
      window.removeEventListener("resize", updateGradients);
    };
  }, []);

  // Автоскролл к активной вкладке
  useEffect(() => {
    if (tabsRef.current) {
      const activeButton = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeButton) {
        (activeButton as HTMLElement).scrollIntoView({ 
          behavior: "smooth", 
          block: "nearest", 
          inline: "center" 
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <MainHeader />
      <WelcomeDialog onNavigateToCalculator={handleNavigateToCalculator} />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Пропущенные намазы</h1>
          <p className="text-sm text-muted-foreground">
            Рассчитайте и отслеживайте долги
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="relative mb-6">
          {showLeftGradient && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          )}
          {showRightGradient && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          )}

          <div
            ref={tabsRef}
            className="flex gap-1 overflow-x-auto no-scrollbar p-1 bg-muted/50 rounded-full"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 text-sm font-medium",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[60vh]">
          {activeTab === "overview" && <OverviewDashboard />}
          {activeTab === "calculator" && <CalculatorSection />}
          {activeTab === "plan" && <RepaymentPlanSection />}
          {activeTab === "progress" && <ProgressSection />}
          {activeTab === "reports" && <ReportsSection />}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
