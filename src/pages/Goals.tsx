// Страница Цели и Привычки - дизайн как в Goal app

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal } from "@/types/spiritual-path";
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

// Компонент точек прогресса (как на скриншоте)
const ProgressDots = ({ current, total }: { current: number; total: number }) => {
  const dots = Math.min(total, 5); // Максимум 5 точек
  const filledDots = Math.min(current, dots);
  
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: dots }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i < filledDots 
              ? "bg-emerald-600" 
              : "bg-emerald-200"
          )}
        />
      ))}
    </div>
  );
};

// Компонент карточки цели (как на скриншоте)
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
  
  // Определяем отображение прогресса
  const isTimeBasedGoal = goal.title.toLowerCase().includes("мин") || 
                          goal.title.toLowerCase().includes("час");
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100",
        "hover:shadow-md transition-all duration-200",
        "flex items-center gap-4 text-left"
      )}
    >
      {/* Иконка */}
      <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
        {getCategoryIcon(goal.category, goal.title)}
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 mb-2 truncate">
          {goal.title}
        </h3>
        
        {/* Прогресс бар */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
            {isTimeBasedGoal 
              ? `${goal.current_value} мин`
              : `${goal.current_value}/${goal.target_value}`
            }
          </span>
        </div>
      </div>

      {/* Точки прогресса или галочка */}
      <div className="flex-shrink-0">
        {isComplete ? (
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
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
      const goalsData = await spiritualPathAPI.getGoals("all");
      setGoals(goalsData);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MainHeader />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Цели и привычки</h1>
          <button
            onClick={() => setFilter(filter === "all" ? "active" : "all")}
            className="text-emerald-600 font-medium text-sm"
          >
            {filter === "all" ? "Активные" : "Все"}
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

      {/* FAB - Floating Action Button */}
      <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGoalCreated={loadData}
      >
        <button className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-colors flex items-center justify-center z-40">
          <Plus className="w-6 h-6" />
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
