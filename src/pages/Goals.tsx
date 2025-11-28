// Страница Цели и Привычки в стиле Goal app

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  Search,
  Target,
  TrendingUp,
  Trophy,
  BarChart3,
  ChevronRight,
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, Streak, Badge as BadgeType } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { CreateGoalDialog } from "@/components/spiritual-path/CreateGoalDialog";
import { SmartGoalTemplates } from "@/components/spiritual-path/SmartGoalTemplates";
import { useNavigate } from "react-router-dom";

type FilterType = "all" | "active" | "completed";

const Goals = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("active");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsData, streaksData, badgesData] = await Promise.all([
        spiritualPathAPI.getGoals("all"),
        spiritualPathAPI.getStreaks(),
        spiritualPathAPI.getBadges(),
      ]);
      setGoals(goalsData);
      setStreaks(streaksData);
      setBadges(badgesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch = 
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "active" && goal.status === "active") ||
      (filter === "completed" && goal.status === "completed");
    
    return matchesSearch && matchesFilter;
  });

  const activeGoalsCount = goals.filter(g => g.status === "active").length;
  const completedGoalsCount = goals.filter(g => g.status === "completed").length;
  const totalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.current_value / g.target_value) * 100, 0) / goals.length)
    : 0;
  const currentStreak = streaks.find(s => s.current_streak > 0)?.current_streak || 0;

  const handleGoalClick = (goal: Goal) => {
    // Если цель связана с тасбихом, переходим на страницу тасбиха
    if (goal.category === "zikr" || goal.category === "quran" || goal.linked_counter_type) {
      navigate(`/tasbih?goal=${goal.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MainHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Загрузка...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <MainHeader />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Цели</h1>
            <p className="text-sm text-muted-foreground">
              {activeGoalsCount} активных · {completedGoalsCount} завершено
            </p>
          </div>
          <CreateGoalDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onGoalCreated={loadData}
          >
            <Button size="icon" className="rounded-full w-12 h-12 shadow-lg">
              <Plus className="w-5 h-5" />
            </Button>
          </CreateGoalDialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{activeGoalsCount}</p>
              <p className="text-xs text-muted-foreground">Активных</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Дней подряд</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold">{badges.filter(b => b.earned_at).length}</p>
              <p className="text-xs text-muted-foreground">Бейджей</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск целей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Фильтр</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-2">
                {[
                  { id: "all", label: "Все цели" },
                  { id: "active", label: "Активные" },
                  { id: "completed", label: "Завершённые" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id as FilterType)}
                    className={cn(
                      "w-full p-4 rounded-2xl text-left transition-all",
                      filter === f.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Smart Templates Button */}
        <button
          onClick={() => setTemplatesOpen(true)}
          className="w-full p-4 mb-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-between hover:from-primary/15 hover:to-primary/10 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">Умные предложения</p>
              <p className="text-xs text-muted-foreground">Готовые шаблоны целей</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Goals List */}
        <div className="space-y-3">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => {
              const progress = (goal.current_value / goal.target_value) * 100;
              const isComplete = goal.status === "completed";
              
              return (
                <button
                  key={goal.id}
                  onClick={() => handleGoalClick(goal)}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left transition-all",
                    "bg-card hover:bg-accent/50 border border-border/50",
                    isComplete && "opacity-70"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <CircularProgress
                      value={goal.current_value}
                      max={goal.target_value}
                      size={56}
                      strokeWidth={5}
                      showValue={false}
                      color={isComplete ? "hsl(var(--chart-2))" : "hsl(var(--primary))"}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <span className="text-xs font-bold">{Math.round(progress)}%</span>
                      )}
                    </CircularProgress>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium truncate",
                        isComplete && "line-through"
                      )}>
                        {goal.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {goal.current_value} / {goal.target_value}
                        </span>
                        {goal.end_date && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(goal.end_date).toLocaleDateString("ru")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Ничего не найдено" : "Нет целей"}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Создать цель
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Smart Templates Sheet */}
      <Sheet open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Умные предложения</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-60px)] mt-4">
            <SmartGoalTemplates onTemplateSelected={() => {
              setTemplatesOpen(false);
              loadData();
            }} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Goals;

