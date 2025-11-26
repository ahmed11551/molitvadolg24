import { useState, useEffect } from "react";
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
import { DiscoverSection } from "@/components/discover/DiscoverSection";
import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";
import { FastingTracker } from "@/components/qaza/FastingTracker";
import { useSearchParams } from "react-router-dom";

const tabsConfig = [
  { value: "overview", label: "Обзор" },
  { value: "plan", label: "План" },
  { value: "progress", label: "Прогресс" },
  { value: "fasting", label: "Посты" },
  { value: "travel", label: "Сафар" },
  { value: "reports", label: "Отчёты" },
  { value: "calculator", label: "Калькулятор" },
  { value: "goals", label: "Цели" },
  { value: "calendar", label: "Календарь" },
] as const;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleNavigateToCalculator = () => {
    handleTabChange("calculator");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      if (tabParam !== activeTab) {
        setActiveTab(tabParam);
      }
      const params = new URLSearchParams(searchParams);
      params.delete("tab");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, activeTab, setSearchParams]);

  return (
    <div className="min-h-screen bg-gradient-hero pb-20 sm:pb-0">
      <MainHeader />
      <WelcomeDialog onNavigateToCalculator={handleNavigateToCalculator} />

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-5xl pb-24 sm:pb-6 w-full overflow-x-hidden">
        <DiscoverSection onNavigate={handleTabChange} />
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList
            className={cn(
              "grid gap-2 mb-6 w-full",
              "bg-muted/50 rounded-2xl p-2",
              "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            )}
          >
            {tabsConfig.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "w-full px-3 py-2 text-sm font-medium rounded-xl",
                  "transition-all shadow-none border border-transparent",
                  "data-[state=active]:bg-background",
                  "data-[state=active]:text-foreground",
                  "data-[state=active]:shadow-sm",
                  "data-[state=active]:border-primary/20",
                  "text-center"
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewDashboard />
          </TabsContent>

          <TabsContent value="plan">
            <RepaymentPlanSection />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressSection />
          </TabsContent>

          <TabsContent value="fasting">
            <FastingTracker />
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
