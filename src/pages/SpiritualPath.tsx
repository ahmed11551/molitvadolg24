// Страница "Мой Духовный Путь"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalsByCategory } from "@/components/spiritual-path/GoalsByCategory";
import { GoalFeed } from "@/components/spiritual-path/GoalFeed";
import { CreateGoalDialog } from "@/components/spiritual-path/CreateGoalDialog";
import { SmartGoalTemplates } from "@/components/spiritual-path/SmartGoalTemplates";
import { useState, useEffect } from "react";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal } from "@/types/spiritual-path";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreaksDisplay } from "@/components/spiritual-path/StreaksDisplay";
import { BadgesDisplay } from "@/components/spiritual-path/BadgesDisplay";
import { QazaCalculator } from "@/components/spiritual-path/QazaCalculator";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Target, Trophy, TrendingUp, BarChart3, Users, Calculator } from "lucide-react";

export default function SpiritualPath() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

        <Tabs defaultValue="goals" className="w-full">
          <div className="relative mb-6 overflow-visible">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-xl opacity-50 -z-10" />
            
            <TabsList 
              className={cn(
                "relative flex w-full h-auto items-center",
                "px-1 sm:px-4 py-2 sm:py-2.5 gap-0.5 sm:gap-2.5",
                "overflow-x-auto overflow-y-visible",
                "bg-white/95 backdrop-blur-md",
                "rounded-2xl border border-border/60",
                "shadow-lg shadow-primary/5",
                "scroll-smooth snap-x snap-proximity",
                "min-h-[44px] sm:min-h-[52px]",
                "no-scrollbar",
                "sm:justify-start"
              )}
            >
              <TabsTrigger 
                value="goals"
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-2",
                  "flex-1 sm:flex-none sm:w-auto sm:min-w-fit",
                  "px-1 sm:px-6 py-1.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible"
                )}
              >
                <Target className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span>Цели</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="streaks"
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-2",
                  "flex-1 sm:flex-none sm:w-auto sm:min-w-fit",
                  "px-1 sm:px-6 py-1.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible"
                )}
              >
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span>Серии</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="badges"
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-2",
                  "flex-1 sm:flex-none sm:w-auto sm:min-w-fit",
                  "px-1 sm:px-6 py-1.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible"
                )}
              >
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span>Бейджи</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="analytics"
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-2",
                  "flex-1 sm:flex-none sm:w-auto sm:min-w-fit",
                  "px-1 sm:px-6 py-1.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible"
                )}
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span>Аналитика</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="groups"
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-2",
                  "flex-1 sm:flex-none sm:w-auto sm:min-w-fit",
                  "px-1 sm:px-6 py-1.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible"
                )}
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span>Группы</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="qaza"
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-2",
                  "flex-1 sm:flex-none sm:w-auto sm:min-w-fit",
                  "px-1 sm:px-6 py-1.5 sm:py-3",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible"
                )}
              >
                <Calculator className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span>Каза</span>
              </TabsTrigger>
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
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Раздел аналитики в разработке</p>
            </div>
          </TabsContent>

          <TabsContent value="groups">
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Раздел групповых целей в разработке</p>
            </div>
          </TabsContent>

          <TabsContent value="qaza">
            <QazaCalculator />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}


