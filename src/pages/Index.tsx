// Страница Каза - Пропущенные намазы (дизайн Goal app)

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
  { id: "calculator", label: "Расчёт", icon: <Calculator className="w-4 h-4" /> },
  { id: "plan", label: "План", icon: <Calendar className="w-4 h-4" /> },
  { id: "progress", label: "Прогресс", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "reports", label: "Отчёты", icon: <BarChart3 className="w-4 h-4" /> },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleNavigateToCalculator = () => {
    setActiveTab("calculator");
  };

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
    <div className="min-h-screen bg-gray-50 pb-24">
      <MainHeader />
      <WelcomeDialog onNavigateToCalculator={handleNavigateToCalculator} />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Tabs Navigation */}
        <div
          ref={tabsRef}
          className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all flex-shrink-0 text-sm font-medium",
                activeTab === tab.id
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[60vh]">
          {activeTab === "overview" && <OverviewDashboard onNavigateToCalculator={handleNavigateToCalculator} />}
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
