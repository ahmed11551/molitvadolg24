// Страница Цели и Привычки - дизайн как в Goal app

import { useState, useEffect, useMemo } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Search,
  Sparkles,
  BookOpen,
  Star,
  Moon,
  Sun,
  Heart,
  Check,
  ChevronRight,
  Minus,
  Trash2,
  Flame,
  Trophy,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, Streak, Badge } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { CreateGoalDialog } from "@/components/spiritual-path/CreateGoalDialog";
import { SmartGoalTemplates } from "@/components/spiritual-path/SmartGoalTemplates";
import { useNavigate } from "react-router-dom";

// Иконки для разных категорий целей
const getCategoryIcon = (category: string, title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("утренн") || lowerTitle.includes("фаджр")) {
    return <Sun className="w-6 h-6" />;
  }
  if (lowerTitle.includes("вечерн") || lowerTitle.includes("магриб")) {
    return <Moon className="w-6 h-6" />;
  }
  if (lowerTitle.includes("коран") || lowerTitle.includes("чтени")) {
    return <BookOpen className="w-6 h-6" />;
  }
  if (lowerTitle.includes("зикр") || lowerTitle.includes("тасбих")) {
    return <Sparkles className="w-6 h-6" />;
  }
  if (lowerTitle.includes("благ") || lowerTitle.includes("садак")) {
    return <Heart className="w-6 h-6" />;
  }
  if (category === "zikr") {
    return <Star className="w-6 h-6" />;
  }
  return <Sparkles className="w-6 h-6" />;
};

// Компонент точек прогресса (стиль Goal app)
const ProgressDots = ({ current, total }: { current: number; total: number }) => {
  const dots = Math.min(total, 5); // Максимум 5 точек
  const filledDots = Math.min(Math.ceil((current / total) * dots), dots);
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1">
        {Array.from({ length: dots }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              i < filledDots 
                ? "bg-emerald-500 scale-110" 
                : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <span className="text-[10px] text-gray-400">{Math.round((current / total) * 100)}%</span>
    </div>
  );
};

// Цвета для категорий (как в Goal app)
const getCategoryColors = (category: string) => {
  switch (category) {
    case "prayer": return { bg: "from-blue-400 to-blue-600", light: "bg-blue-50", text: "text-blue-600" };
    case "quran": return { bg: "from-emerald-400 to-emerald-600", light: "bg-emerald-50", text: "text-emerald-600" };
    case "zikr": return { bg: "from-purple-400 to-purple-600", light: "bg-purple-50", text: "text-purple-600" };
    case "sadaqa": return { bg: "from-pink-400 to-pink-600", light: "bg-pink-50", text: "text-pink-600" };
    case "knowledge": return { bg: "from-amber-400 to-amber-600", light: "bg-amber-50", text: "text-amber-600" };
    default: return { bg: "from-emerald-400 to-emerald-600", light: "bg-emerald-50", text: "text-emerald-600" };
  }
};

// Компонент карточки цели (стиль Goal app)
const GoalCard = ({ 
  goal, 
  onClick 
}: { 
  goal: Goal; 
  onClick: () => void;
}) => {
  const progress = goal.target_value > 0 
    ? (goal.current_value / goal.target_value) * 100 
    : 0;
  const isComplete = goal.current_value >= goal.target_value;
  const colors = getCategoryColors(goal.category);
  
  // Определяем отображение прогресса
  const isTimeBasedGoal = goal.title.toLowerCase().includes("мин") || 
                          goal.title.toLowerCase().includes("час");
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100",
        "hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
        "transition-all duration-200",
        "flex items-center gap-4 text-left",
        isComplete && "ring-2 ring-emerald-200 bg-emerald-50/30"
      )}
    >
      {/* Иконка с градиентом */}
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md",
        `bg-gradient-to-br ${colors.bg}`
      )}>
        <div className="text-white">
          {getCategoryIcon(goal.category, goal.title)}
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate">
            {goal.title}
          </h3>
          {isComplete && <span className="text-emerald-500">✓</span>}
        </div>
        
        {/* Прогресс бар с анимацией */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                `bg-gradient-to-r ${colors.bg}`
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className={cn("text-sm font-semibold whitespace-nowrap", colors.text)}>
            {isTimeBasedGoal 
              ? `${goal.current_value} мин`
              : `${goal.current_value}/${goal.target_value}`
            }
          </span>
        </div>
      </div>

      {/* Процент или галочка */}
      <div className="flex-shrink-0">
        {isComplete ? (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Check className="w-5 h-5 text-white" />
          </div>
        ) : (
          <ProgressDots 
            current={goal.current_value} 
            total={goal.target_value} 
          />
        )}
      </div>
    </button>
  );
};

const Goals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalDetailOpen, setGoalDetailOpen] = useState(false);

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

  // Вычисляем статистику
  const currentStreak = streaks.find(s => s.streak_type === "daily_all")?.current_streak || 0;
  const longestStreak = streaks.find(s => s.streak_type === "daily_all")?.longest_streak || currentStreak;
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const activeGoals = goals.filter(g => g.status === "active").length;
  const totalBadges = badges.length;

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

  const handleGoalClick = (goal: Goal) => {
    if (goal.category === "zikr" || goal.category === "quran" || goal.linked_counter_type) {
      navigate(`/tasbih?goal=${goal.id}`);
    } else {
      // Открываем детали для всех остальных целей
      setSelectedGoal(goal);
      setGoalDetailOpen(true);
    }
  };

  const handleAddProgress = async (amount: number) => {
    if (!selectedGoal) return;
    
    try {
      await spiritualPathAPI.addProgress(selectedGoal.id, amount);
      
      // Обновляем локальное состояние
      const newValue = Math.max(0, selectedGoal.current_value + amount);
      setSelectedGoal({ ...selectedGoal, current_value: newValue });
      
      // Обновляем список целей
      setGoals(goals.map(g => 
        g.id === selectedGoal.id 
          ? { ...g, current_value: newValue }
          : g
      ));

      if (newValue >= selectedGoal.target_value && amount > 0) {
        toast({
          title: "🎉 Цель достигнута!",
          description: "Ма ша Аллах! Поздравляем!",
        });
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить прогресс",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;
    
    try {
      await spiritualPathAPI.deleteGoal(selectedGoal.id);
      setGoals(goals.filter(g => g.id !== selectedGoal.id));
      setGoalDetailOpen(false);
      setSelectedGoal(null);
      toast({
        title: "Цель удалена",
        description: "Цель успешно удалена",
      });
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить цель",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <MainHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-gray-400">Загрузка...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Генерация дней недели
  const weekDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date,
        dayName: date.toLocaleDateString("ru", { weekday: "short" }),
        dayNum: date.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MainHeader />

      <main className="container mx-auto px-4 py-4 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Сегодня</h1>
          <button
            onClick={() => navigate("/statistics")}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Горизонтальный календарь - как на скриншоте */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {weekDays.map((day) => {
            const isSelected = day.date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={day.dayNum}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "flex flex-col items-center min-w-[52px] py-2 px-3 rounded-2xl transition-all",
                  isSelected
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : "bg-white text-gray-600 border border-gray-100 hover:border-emerald-200"
                )}
              >
                <span className={cn(
                  "text-xs font-medium mb-1",
                  isSelected ? "text-emerald-100" : "text-gray-400"
                )}>
                  {day.dayName}
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  isSelected ? "text-white" : "text-gray-900"
                )}>
                  {day.dayNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* Виджет статистики - как Analytics на скриншоте */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            {/* Круговые виджеты прогресса */}
            <div className="flex gap-4">
              {/* Недельный прогресс */}
              <div className="text-center">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#374151" strokeWidth="4" />
                    <circle 
                      cx="32" cy="32" r="28" fill="none" 
                      stroke="#10b981" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={176} 
                      strokeDashoffset={176 - (176 * Math.min(activeGoals * 15, 100)) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white text-sm font-bold">{Math.min(activeGoals * 15, 100)}%</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-1">Неделя</p>
              </div>
              
              {/* Месячный прогресс */}
              <div className="text-center">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#374151" strokeWidth="4" />
                    <circle 
                      cx="32" cy="32" r="28" fill="none" 
                      stroke="#22c55e" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={176} 
                      strokeDashoffset={176 - (176 * Math.min(completedGoals * 10 + 30, 100)) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white text-sm font-bold">{Math.min(completedGoals * 10 + 30, 100)}%</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-1">Месяц</p>
              </div>
            </div>

            {/* Streak виджет */}
            <div className="bg-slate-700/50 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{currentStreak}</p>
                  <p className="text-xs text-gray-400">Текущий</p>
                </div>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-emerald-400 font-bold">{longestStreak}</p>
                  <p className="text-[10px] text-gray-500">Рекорд</p>
                </div>
                <div>
                  <p className="text-emerald-400 font-bold">{completedGoals}</p>
                  <p className="text-[10px] text-gray-500">Всего</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Мини-статистика */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button 
            onClick={() => navigate("/statistics")}
            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-1.5 shadow-md">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-900">{currentStreak}</p>
            <p className="text-[9px] text-gray-400 font-medium">ДНЕЙ</p>
          </button>
          
          <button className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all active:scale-95">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-1.5 shadow-md">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-900">{activeGoals}</p>
            <p className="text-[9px] text-gray-400 font-medium">АКТИВНЫХ</p>
          </button>
          
          <button className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all active:scale-95">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-1.5 shadow-md">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-900">{completedGoals}</p>
            <p className="text-[9px] text-gray-400 font-medium">ГОТОВО</p>
          </button>
          
          <button 
            onClick={() => navigate("/statistics")}
            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto mb-1.5 shadow-md">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-900">{totalBadges}</p>
            <p className="text-[9px] text-gray-400 font-medium">БЕЙДЖЕЙ</p>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Поиск целей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-white border-gray-200 text-base"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "active", label: "Активные" },
            { id: "completed", label: "Выполненные" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                filter === tab.id
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => handleGoalClick(goal)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-emerald-300" />
              </div>
              <p className="text-gray-500 mb-4">
                {searchQuery ? "Ничего не найдено" : "Нет целей"}
              </p>
              <Button 
                onClick={() => setCreateDialogOpen(true)} 
                className="rounded-full bg-emerald-500 hover:bg-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать цель
              </Button>
            </div>
          )}
        </div>

        {/* Add Button */}
        {filteredGoals.length > 0 && (
          <div className="mt-6 space-y-3">
            {/* Умные предложения */}
            <button
              onClick={() => setTemplatesOpen(true)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Умные предложения</h3>
                <p className="text-sm text-gray-500">Готовые шаблоны целей</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}
      </main>

      {/* FAB - Floating Action Button (как на скриншоте) */}
      <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGoalCreated={loadData}
      >
        <button className="fixed bottom-24 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-xl shadow-emerald-300/50 hover:shadow-2xl hover:shadow-emerald-400/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-40">
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </CreateGoalDialog>

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

      {/* Goal Detail Sheet */}
      <Sheet open={goalDetailOpen} onOpenChange={setGoalDetailOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{selectedGoal?.title}</SheetTitle>
          </SheetHeader>
          
          {selectedGoal && (
            <div className="mt-6 space-y-6">
              {/* Прогресс */}
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 relative">
                  <svg className="w-32 h-32 -rotate-90 absolute">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#d1fae5"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#059669"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${Math.min((selectedGoal.current_value / selectedGoal.target_value) * 351.86, 351.86)} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{selectedGoal.current_value}</p>
                    <p className="text-sm text-gray-500">из {selectedGoal.target_value}</p>
                  </div>
                </div>

                {selectedGoal.description && (
                  <p className="text-sm text-gray-600 mb-4">{selectedGoal.description}</p>
                )}
              </div>

              {/* Кнопки управления прогрессом */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-14 h-14"
                  onClick={() => handleAddProgress(-1)}
                  disabled={selectedGoal.current_value <= 0}
                >
                  <Minus className="w-6 h-6" />
                </Button>

                <Button
                  size="lg"
                  className="rounded-full w-20 h-20 bg-emerald-500 hover:bg-emerald-600 text-white text-2xl font-bold"
                  onClick={() => handleAddProgress(1)}
                >
                  +1
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-14 h-14"
                  onClick={() => handleAddProgress(5)}
                >
                  +5
                </Button>
              </div>

              {/* Действия */}
              <div className="flex gap-3 pt-4">
                {(selectedGoal.category === "zikr" || selectedGoal.category === "quran") && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setGoalDetailOpen(false);
                      navigate(`/tasbih?goal=${selectedGoal.id}`);
                    }}
                  >
                    Открыть в Тасбих
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDeleteGoal}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Goals;
