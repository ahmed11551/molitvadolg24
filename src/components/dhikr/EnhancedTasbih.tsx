// Тасбих в стиле Goal app - чистый минималистичный интерфейс

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Target,
  RotateCcw,
  Settings,
  CheckCircle2,
  Volume2,
  VolumeX,
  Search,
  BookOpen,
  Heart,
  Star,
  Sparkles,
  ChevronRight,
  Play,
  Pause,
  X,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import {
  getDhikrItemById,
  getAvailableItemsByCategory,
  getAyahs,
  getSurahs,
  getNamesOfAllah,
  type DhikrItem,
} from "@/lib/dhikr-data";
import type { Goal } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EnhancedTasbihProps {
  goalId?: string;
}

interface DisplaySettings {
  showArabic: boolean;
  showTranscription: boolean;
  showTranslation: boolean;
  transcriptionType: "latin" | "cyrillic";
  enableSound: boolean;
  enableVibration: boolean;
}

type CategoryType = "goals" | "dhikr" | "quran" | "names";

interface TasbihContent {
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation?: string;
  audioUrl: string | null;
  reference?: string;
}

type DhikrItemTypeKey = Parameters<typeof getDhikrItemById>[1];

const CATEGORIES: { id: CategoryType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "goals", label: "Цели", icon: <Target className="w-5 h-5" />, color: "bg-amber-500" },
  { id: "dhikr", label: "Зикры", icon: <Star className="w-5 h-5" />, color: "bg-amber-600" },
  { id: "quran", label: "Коран", icon: <BookOpen className="w-5 h-5" />, color: "bg-amber-700" },
  { id: "names", label: "99 Имён", icon: <Sparkles className="w-5 h-5" />, color: "bg-amber-800" },
];

export const EnhancedTasbih = ({ goalId }: EnhancedTasbihProps) => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("goals");
  const [selectedItem, setSelectedItem] = useState<DhikrItem | null>(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [learnedDialogOpen, setLearnedDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    showArabic: true,
    showTranscription: true,
    showTranslation: true,
    transcriptionType: "cyrillic",
    enableSound: true,
    enableVibration: true,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableItems, setAvailableItems] = useState<DhikrItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Quran specific state
  const [surahs, setSurahs] = useState<DhikrItem[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [ayahs, setAyahs] = useState<DhikrItem[]>([]);

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    if (goalId && goals.length > 0) {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        setSelectedGoal(goal);
        setSelectedCategory("goals");
      }
    }
  }, [goalId, goals]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const allGoals = await spiritualPathAPI.getGoals("active");
      const tasbihGoals = allGoals.filter(g => 
        g.category === "zikr" || 
        g.category === "quran" || 
        g.category === "names_of_allah" ||
        g.linked_counter_type !== null
      );
      setGoals(tasbihGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryItems = useCallback(async (category: CategoryType) => {
    if (category === "goals") return;
    
    setLoadingItems(true);
    try {
      let items: DhikrItem[] = [];
      switch (category) {
        case "dhikr":
          items = [
            ...(await getAvailableItemsByCategory("adhkar")),
            ...(await getAvailableItemsByCategory("dua")),
            ...(await getAvailableItemsByCategory("salawat")),
          ];
          break;
        case "quran":
          items = await getSurahs();
          setSurahs(items);
          break;
        case "names":
          items = await getNamesOfAllah();
          break;
      }
      setAvailableItems(items);
    } catch (error) {
      console.error("Error loading category items:", error);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (selectorOpen) {
      loadCategoryItems(selectedCategory);
    }
  }, [selectedCategory, selectorOpen, loadCategoryItems]);

  const handleGoalSelect = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setSelectedItem(null);
      setCurrentCount(0);
      setSelectorOpen(false);
    }
  };

  const handleItemSelect = async (item: DhikrItem) => {
    setSelectedItem(item);
    setSelectedGoal(null);
    setCurrentCount(0);
    setSelectorOpen(false);
  };

  const handleSurahSelect = async (surahNumber: number) => {
    setSelectedSurah(surahNumber);
    setLoadingItems(true);
    try {
      const data = await getAyahs(surahNumber);
      setAyahs(data);
      } catch (error) {
      console.error("Error loading ayahs:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleCount = async () => {
    // Trigger pulse animation
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 200);

    // Vibration feedback
    if (displaySettings.enableVibration && navigator.vibrate) {
      navigator.vibrate(10);
    }

    if (selectedGoal) {
      const newCount = currentCount + 1;
      setCurrentCount(newCount);

      try {
        await spiritualPathAPI.addProgress(selectedGoal.id, 1);
        
        if (newCount >= selectedGoal.target_value) {
          toast({
            title: "🎉 Цель достигнута!",
            description: "Ма ша Аллах! Поздравляем!",
          });
        }
      } catch (error) {
        console.error("Error syncing progress:", error);
      }
    } else if (selectedItem) {
      setCurrentCount(currentCount + 1);
    }
  };

  const handleLearned = async () => {
    if (!selectedGoal) return;

    try {
      await spiritualPathAPI.updateGoal(selectedGoal.id, { status: "completed" });
      toast({
        title: "✅ Цель завершена!",
        description: "Вы успешно выучили! Ма ша Аллах!",
      });
      setLearnedDialogOpen(false);
      loadGoals();
      setSelectedGoal(null);
    } catch (error) {
      console.error("Error completing goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить цель",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setCurrentCount(0);
  };

  const content = useMemo<TasbihContent | null>(() => {
    if (selectedGoal) {
      if (selectedGoal.item_data) {
        return {
          arabic: selectedGoal.item_data.arabic || selectedGoal.title,
          transcription: selectedGoal.item_data.transcription || selectedGoal.title,
          russianTranscription: selectedGoal.item_data.russianTranscription || selectedGoal.title,
          translation: selectedGoal.item_data.translation || selectedGoal.description || "",
          audioUrl: selectedGoal.item_data.audioUrl || null,
          reference: selectedGoal.item_data.reference,
        };
      }
      return {
        arabic: selectedGoal.description || selectedGoal.title,
        transcription: selectedGoal.title,
        russianTranscription: selectedGoal.title,
        translation: selectedGoal.description || "",
        audioUrl: null,
        reference: undefined,
      };
    }
    if (selectedItem) {
      return {
        arabic: selectedItem.arabic || "",
        transcription: selectedItem.transcription || "",
        russianTranscription: selectedItem.russianTranscription || "",
        translation: selectedItem.translation || "",
        audioUrl: selectedItem.audioUrl || null,
        reference: selectedItem.reference,
      };
    }
    return null;
  }, [selectedGoal, selectedItem]);

  const targetValue = selectedGoal?.target_value || selectedItem?.count || 33;
  const progress = (currentCount / targetValue) * 100;
  const isComplete = currentCount >= targetValue;
  const isLearningGoal = selectedGoal?.is_learning || selectedGoal?.title.toLowerCase().includes("выучить");

  const filteredItems = useMemo(() => {
    if (!searchQuery) return availableItems;
    const query = searchQuery.toLowerCase();
    return availableItems.filter(item =>
      item.arabic?.toLowerCase().includes(query) ||
      item.transcription?.toLowerCase().includes(query) ||
      item.translation?.toLowerCase().includes(query) ||
      item.title?.toLowerCase().includes(query)
    );
  }, [availableItems, searchQuery]);

  const filteredGoals = useMemo(() => {
    if (!searchQuery) return goals;
    const query = searchQuery.toLowerCase();
    return goals.filter(goal =>
      goal.title.toLowerCase().includes(query) ||
      goal.description?.toLowerCase().includes(query)
    );
  }, [goals, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[80vh] px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Тасбих</h1>
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Настройки</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
    <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Отображение</h3>
                <div className="space-y-3">
            <div className="flex items-center justify-between">
                    <Label>Арабский текст</Label>
                    <Switch
                      checked={displaySettings.showArabic}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({ ...displaySettings, showArabic: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Транскрипция</Label>
                    <Switch
                      checked={displaySettings.showTranscription}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({ ...displaySettings, showTranscription: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Перевод</Label>
                    <Switch
                      checked={displaySettings.showTranslation}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({ ...displaySettings, showTranslation: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {displaySettings.showTranscription && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Тип транскрипции</h3>
                  <div className="flex gap-2">
              <Button
                      variant={displaySettings.transcriptionType === "cyrillic" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setDisplaySettings({ ...displaySettings, transcriptionType: "cyrillic" })}
                    >
                      Кириллица
              </Button>
                    <Button
                      variant={displaySettings.transcriptionType === "latin" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setDisplaySettings({ ...displaySettings, transcriptionType: "latin" })}
                    >
                      Латиница
                    </Button>
                        </div>
                      </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Обратная связь</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Звук</Label>
                    <Switch
                      checked={displaySettings.enableSound}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({ ...displaySettings, enableSound: checked })
                      }
                    />
                  </div>
                          <div className="flex items-center justify-between">
                    <Label>Вибрация</Label>
                    <Switch
                      checked={displaySettings.enableVibration}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({ ...displaySettings, enableVibration: checked })
                      }
                    />
                              </div>
                            </div>
                          </div>
                  </div>
          </SheetContent>
        </Sheet>
              </div>

      {/* Selected item display */}
      {content ? (
        <div className="flex-1 flex flex-col">
          {/* Current selection header */}
          <button
            onClick={() => setSelectorOpen(true)}
            className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Текущий зикр</p>
              <p className="font-semibold line-clamp-1">
                {selectedGoal?.title || selectedItem?.title || selectedItem?.translation || "Выбрать"}
              </p>
                  </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Counter area */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Circular counter - main tap area */}
            <button
              onClick={handleCount}
              disabled={isComplete}
                        className={cn(
                "relative focus:outline-none transition-transform active:scale-95",
                isPulsing && "scale-105",
                isComplete && "opacity-80"
              )}
            >
              <CircularProgress
                value={currentCount}
                max={targetValue}
                size={280}
                strokeWidth={16}
                showValue={false}
                color={isComplete ? "#10b981" : "#f59e0b"}
                trackColor="#fef3c7"
                className="drop-shadow-2xl"
              >
                <div className="flex flex-col items-center">
                  <span className="text-6xl font-bold tabular-nums text-gray-900">
                    {currentCount}
                  </span>
                  <span className="text-lg text-gray-500 mt-1">
                    из {targetValue}
                  </span>
                  {isComplete && (
                    <Badge className="mt-3 bg-emerald-100 text-emerald-700 border-emerald-200">
                      <Check className="w-3 h-3 mr-1" />
                      Завершено
                    </Badge>
                              )}
                            </div>
              </CircularProgress>
            </button>

            {/* Text content */}
            <div className="mt-8 w-full max-w-md space-y-4">
              {displaySettings.showArabic && content.arabic && (
                <p
                  className="text-3xl text-center font-arabic leading-loose"
                  style={{ fontFamily: "'Amiri', serif" }}
                  dir="rtl"
                >
                  {content.arabic}
                </p>
              )}

              {displaySettings.showTranscription && (
                <p className="text-center text-lg text-muted-foreground italic">
                  {displaySettings.transcriptionType === "cyrillic"
                    ? content.russianTranscription || content.transcription
                    : content.transcription}
                  </p>
                )}

              {displaySettings.showTranslation && content.translation && (
                <p className="text-center text-base text-foreground/80">
                  {content.translation}
                </p>
              )}
                  </div>
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-center gap-4 mt-8 pb-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12"
              onClick={handleReset}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
            
            {content.audioUrl && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            )}

            {isLearningGoal && isComplete && (
              <Button
                className="rounded-full px-6"
                onClick={() => setLearnedDialogOpen(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Выучил
              </Button>
                              )}
                            </div>
                  </div>
                ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-amber-50 flex items-center justify-center mb-6">
            <Sparkles className="w-12 h-12 text-amber-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Начните тасбих</h2>
          <p className="text-gray-500 text-center mb-8 max-w-xs">
            Выберите зикр или цель для начала поминания
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 bg-amber-500 hover:bg-amber-600"
            onClick={() => setSelectorOpen(true)}
          >
            Выбрать зикр
          </Button>
              </div>
      )}

      {/* Item Selector Sheet */}
      <Sheet open={selectorOpen} onOpenChange={setSelectorOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Выберите зикр</SheetTitle>
          </SheetHeader>

          {/* Category tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchQuery("");
                  setSelectedSurah(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all",
                  selectedCategory === cat.id
                    ? `${cat.color} text-white shadow-lg`
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {cat.icon}
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
              placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
                />
          </div>

          {/* Content */}
          <ScrollArea className="h-[calc(100%-180px)]">
                {loadingItems ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Загрузка...</div>
                  </div>
            ) : selectedCategory === "goals" ? (
              <div className="space-y-2">
                {filteredGoals.length > 0 ? (
                  filteredGoals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalSelect(goal.id)}
                        className={cn(
                        "w-full p-4 rounded-2xl text-left transition-all",
                        "bg-card hover:bg-accent/50 border border-border/50",
                        selectedGoal?.id === goal.id && "border-amber-500 bg-amber-50"
                        )}
                      >
                          <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{goal.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {goal.current_value} / {goal.target_value}
                          </p>
                            </div>
                        <div className="ml-4">
                          <CircularProgress
                            value={goal.current_value}
                            max={goal.target_value}
                            size={44}
                            strokeWidth={4}
                            showValue={false}
                          />
                          </div>
                  </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Нет активных целей
              </div>
                )}
            </div>
            ) : selectedCategory === "quran" ? (
      <div className="space-y-2">
                {selectedSurah ? (
                  <>
                    <button
                      onClick={() => setSelectedSurah(null)}
                      className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                      Назад к сурам
                    </button>
            {ayahs.map((ayah) => (
                      <button
                key={ayah.id}
                        onClick={() => handleItemSelect(ayah)}
                        className="w-full p-4 rounded-2xl text-left bg-card hover:bg-accent/50 border border-border/50 transition-all"
              >
                        <p className="font-medium">Аят {ayah.ayahNumber}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {ayah.translation}
                  </p>
                      </button>
                    ))}
                  </>
                ) : (
                  surahs.map((surah) => (
                    <button
              key={surah.id}
              onClick={() => surah.number && handleSurahSelect(surah.number)}
                      className="w-full p-4 rounded-2xl text-left bg-card hover:bg-accent/50 border border-border/50 transition-all"
            >
                <div className="flex items-center justify-between">
                  <div>
                          <p className="font-medium">
                      {surah.number}. {surah.translation}
                    </p>
                          <p className="text-sm text-muted-foreground mt-1">{surah.arabic}</p>
                  </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                    </button>
                  ))
      )}
    </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className={cn(
                        "w-full p-4 rounded-2xl text-left transition-all",
                        "bg-card hover:bg-accent/50 border border-border/50",
                        selectedItem?.id === item.id && "border-amber-500 bg-amber-50"
                      )}
                    >
                      <p className="font-medium line-clamp-1">
                        {selectedCategory === "names" 
                          ? `${item.number}. ${item.translation}` 
                          : item.title || item.translation}
                      </p>
                      {item.arabic && (
                        <p className="text-sm text-muted-foreground mt-1" dir="rtl">
                          {item.arabic}
                        </p>
                      )}
                      {item.count && (
                        <Badge variant="outline" className="mt-2">
                          {item.count}×
                        </Badge>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Ничего не найдено
          </div>
        )}
          </div>
        )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Learned Dialog */}
      <AlertDialog open={learnedDialogOpen} onOpenChange={setLearnedDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Отметить как выученное?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что выучили "{selectedGoal?.title}"? Цель будет завершена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleLearned} className="rounded-full">
              Да, выучил
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
  );
};
