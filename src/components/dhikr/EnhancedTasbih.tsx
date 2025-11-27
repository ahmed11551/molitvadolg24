// Улучшенный тасбих с AI-рекомендациями и удобным выбором категорий

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Play,
  Pause,
  RotateCcw,
  Settings,
  CheckCircle2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Sparkles,
  Search,
  BookOpen,
  Heart,
  Star,
  Zap,
  Clock,
  TrendingUp,
  Brain,
  Filter,
  X,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnhancedTasbihProps {
  goalId?: string;
}

interface DisplaySettings {
  showArabic: boolean;
  showTranscription: boolean;
  showTranslation: boolean;
  transcriptionType: "latin" | "cyrillic";
  showAudio: boolean;
}

type CategoryType = "goals" | "dua" | "adhkar" | "salawat" | "kalima" | "quran" | "names_of_allah";

interface AIRecommendation {
  type: "goal" | "item";
  id: string;
  title: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

interface TasbihContent {
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation?: string;
  audioUrl: string | null;
  reference?: string;
}

interface TasbihCardProps {
  content: TasbihContent;
  selectedGoal: Goal | null;
  currentCount: number;
  progress: number;
  isComplete: boolean;
  isLearningGoal: boolean;
  displaySettings: DisplaySettings;
  onDisplaySettingsChange: (settings: DisplaySettings) => void;
  onCount: () => void;
  onReset: () => void;
  onLearned: () => void;
  audioUrl: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
}

type DhikrItemTypeKey = Parameters<typeof getDhikrItemById>[1];

const CATEGORY_TO_ITEM_TYPE: Record<Exclude<CategoryType, "goals">, DhikrItemTypeKey | null> = {
  dua: "dua",
  adhkar: "adhkar",
  salawat: "salawat",
  kalima: "kalima",
  quran: "ayah",
  names_of_allah: "name_of_allah",
};

const getItemTypeForCategory = (category: CategoryType): DhikrItemTypeKey | null => {
  if (category === "goals") return null;
  return CATEGORY_TO_ITEM_TYPE[category];
};

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
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    showArabic: true,
    showTranscription: true,
    showTranslation: true,
    transcriptionType: "latin",
    showAudio: true,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  const [availableItems, setAvailableItems] = useState<DhikrItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    loadGoals();
    loadAIRecommendations();
  }, []);

  useEffect(() => {
    if (goalId) {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        setSelectedGoal(goal);
        setSelectedCategory("goals");
      }
    }
  }, [goalId, goals]);

  useEffect(() => {
    if (selectedCategory === "goals" || selectedCategory === "quran") {
      return;
    }
    loadCategoryItems(selectedCategory);
  }, [selectedCategory, loadCategoryItems]);

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

  const loadCategoryItems = useCallback(async (category: Exclude<CategoryType, "goals" | "quran">) => {
    setLoadingItems(true);
    try {
      let items: DhikrItem[] = [];
      switch (category) {
        case "dua":
          items = await getAvailableItemsByCategory("dua");
          break;
        case "adhkar":
          items = await getAvailableItemsByCategory("adhkar");
          break;
        case "salawat":
          items = await getAvailableItemsByCategory("salawat");
          break;
        case "kalima":
          items = await getAvailableItemsByCategory("kalima");
          break;
        case "names_of_allah":
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

  // AI-рекомендации на основе целей и времени
  const loadAIRecommendations = async () => {
    try {
      const allGoals = await spiritualPathAPI.getGoals("active");
      const now = new Date();
      const hour = now.getHours();

    // Умные рекомендации на основе времени и целей
      const recommendations: AIRecommendation[] = [];

      // Рекомендации по целям
      allGoals
        .filter(g => g.status === "active")
        .sort((a, b) => {
          // Приоритет: срочные цели, затем по прогрессу
          const aUrgent = a.end_date && new Date(a.end_date).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000;
          const bUrgent = b.end_date && new Date(b.end_date).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000;
          if (aUrgent && !bUrgent) return -1;
          if (!aUrgent && bUrgent) return 1;
          return (b.current_value / b.target_value) - (a.current_value / a.target_value);
        })
        .slice(0, 3)
        .forEach(goal => {
          const progress = (goal.current_value / goal.target_value) * 100;
          let reason = "";
          let priority: "high" | "medium" | "low" = "medium";

          if (goal.end_date) {
            const daysLeft = Math.ceil((new Date(goal.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 1) {
              reason = `Срочно! Осталось ${daysLeft} день`;
              priority = "high";
            } else if (daysLeft <= 3) {
              reason = `Осталось ${daysLeft} дня`;
              priority = "high";
            } else if (progress < 50) {
              reason = `Прогресс ${Math.round(progress)}% - нужно ускориться`;
              priority = "medium";
            } else {
              reason = `Прогресс ${Math.round(progress)}% - продолжайте!`;
              priority = "low";
            }
          } else {
            reason = `Прогресс ${Math.round(progress)}%`;
            priority = progress < 50 ? "medium" : "low";
          }

          recommendations.push({
            type: "goal",
            id: goal.id,
            title: goal.title,
            reason,
            priority,
          });
        });

      // Рекомендации по времени суток
      if (hour >= 5 && hour < 12) {
        recommendations.push({
          type: "item",
          id: "morning_adhkar",
          title: "Утренние зикры",
          reason: "Идеальное время для утренних поминаний",
          priority: "high",
        });
      } else if (hour >= 12 && hour < 18) {
        recommendations.push({
          type: "item",
          id: "afternoon_dua",
          title: "Дуа после полудня",
          reason: "Время для дуа и поминаний",
          priority: "medium",
        });
      } else if (hour >= 18 && hour < 22) {
        recommendations.push({
          type: "item",
          id: "evening_salawat",
          title: "Салаваты",
          reason: "Вечер - время благословений",
          priority: "medium",
        });
      } else {
        recommendations.push({
          type: "item",
          id: "night_quran",
          title: "Чтение Корана",
          reason: "Ночь - лучшее время для чтения",
          priority: "high",
        });
      }

      setAiRecommendations(recommendations.slice(0, 5));
    } catch (error) {
      console.error("Error loading AI recommendations:", error);
    }
  };

  const handleGoalSelect = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setSelectedCategory("goals");
      setSelectedItem(null);
      setCurrentCount(0);
    }
  };

  const handleItemSelect = async (item: DhikrItem) => {
    setSelectedItem(item);
    setSelectedGoal(null);
    setCurrentCount(0);
    setAudioUrl(item.audioUrl ?? null);
    
    // Загружаем полные данные элемента
    if (item.id) {
      try {
        const itemType = getItemTypeForCategory(selectedCategory);
        if (!itemType) return;
        const fullItem = await getDhikrItemById(item.id, itemType);
        if (fullItem) {
          setSelectedItem(fullItem);
          setAudioUrl(fullItem.audioUrl || null);
        }
      } catch (error) {
        console.error("Error loading item details:", error);
      }
    }
  };

  const handleCount = async () => {
    if (selectedGoal) {
      const newCount = currentCount + 1;
      setCurrentCount(newCount);

      try {
        await spiritualPathAPI.addProgress(selectedGoal.id, 1);
        
        if (newCount >= selectedGoal.target_value) {
          toast({
            title: "Цель достигнута!",
            description: "Поздравляем! Ма ша Аллах!",
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
        title: "Цель завершена!",
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

  const goalContent = useMemo<TasbihContent | null>(() => {
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

  const progress = selectedGoal && selectedGoal.target_value > 0
    ? (currentCount / selectedGoal.target_value) * 100
    : 0;

  const isComplete = selectedGoal && currentCount >= selectedGoal.target_value;
  const isLearningGoal = selectedGoal?.is_learning ||
    selectedGoal?.title.toLowerCase().includes("выучить");

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
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI-рекомендации */}
      {showAIRecommendations && aiRecommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI-рекомендации
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAIRecommendations(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiRecommendations.map((rec, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    "cursor-pointer hover:bg-secondary/50 transition-colors",
                    rec.priority === "high" && "border-primary/50 bg-primary/5"
                  )}
                  onClick={() => {
                    if (rec.type === "goal") {
                      handleGoalSelect(rec.id);
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{rec.title}</p>
                          {rec.priority === "high" && (
                            <Badge variant="destructive" className="text-xs">
                              Срочно
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                      </div>
                      {rec.priority === "high" && (
                        <Zap className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Быстрый выбор категорий */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Выберите категорию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(v) => {
            setSelectedCategory(v as CategoryType);
            setSelectedGoal(null);
            setSelectedItem(null);
            setSearchQuery("");
          }}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="goals" className="text-xs">
                <Target className="w-4 h-4 mr-1" />
                Цели
              </TabsTrigger>
              <TabsTrigger value="dua" className="text-xs">
                <Heart className="w-4 h-4 mr-1" />
                Дуа
              </TabsTrigger>
              <TabsTrigger value="adhkar" className="text-xs">
                <Star className="w-4 h-4 mr-1" />
                Зикры
              </TabsTrigger>
              <TabsTrigger value="quran" className="text-xs">
                <BookOpen className="w-4 h-4 mr-1" />
                Коран
              </TabsTrigger>
              <TabsTrigger value="names_of_allah" className="text-xs">
                <Sparkles className="w-4 h-4 mr-1" />
                99 Имен
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="mt-4">
              <div className="space-y-2">
                <Input
                  placeholder="Поиск по целям..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                {filteredGoals.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredGoals.map((goal) => (
                      <Card
                        key={goal.id}
                        className={cn(
                          "cursor-pointer hover:bg-secondary/50 transition-colors",
                          selectedGoal?.id === goal.id && "border-primary"
                        )}
                        onClick={() => handleGoalSelect(goal.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{goal.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress
                                  value={(goal.current_value / goal.target_value) * 100}
                                  className="h-2 flex-1"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {goal.current_value}/{goal.target_value}
                                </span>
                              </div>
                            </div>
                            {selectedGoal?.id === goal.id && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет активных целей для тасбиха
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="dua" className="mt-4">
              <div className="space-y-2">
                <Input
                  placeholder="Поиск дуа..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Загрузка...</div>
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredItems.map((item) => (
                      <Card
                        key={item.id}
                        className={cn(
                          "cursor-pointer hover:bg-secondary/50 transition-colors",
                          selectedItem?.id === item.id && "border-primary"
                        )}
                        onClick={() => handleItemSelect(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm line-clamp-1">
                                {item.translation || item.title}
                              </p>
                              {item.reference && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.reference}
                                </p>
                              )}
                            </div>
                            {selectedItem?.id === item.id && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет доступных дуа
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="adhkar" className="mt-4">
              <div className="space-y-2">
                <Input
                  placeholder="Поиск зикров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Загрузка...</div>
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredItems.map((item) => (
                      <Card
                        key={item.id}
                        className={cn(
                          "cursor-pointer hover:bg-secondary/50 transition-colors",
                          selectedItem?.id === item.id && "border-primary"
                        )}
                        onClick={() => handleItemSelect(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{item.title || item.transcription}</p>
                              {item.count && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Рекомендуется: {item.count} раз
                                </p>
                              )}
                            </div>
                            {selectedItem?.id === item.id && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет доступных зикров
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="quran" className="mt-4">
              <QuranSelector
                onSurahSelect={(_surahNumber, ayahs) => {
                  setAvailableItems(ayahs);
                  setSelectedCategory("quran");
                }}
                onAyahSelect={handleItemSelect}
              />
            </TabsContent>

            <TabsContent value="names_of_allah" className="mt-4">
              <div className="space-y-2">
                <Input
                  placeholder="Поиск имени Аллаха..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Загрузка...</div>
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredItems.map((name) => (
                      <Card
                        key={name.id}
                        className={cn(
                          "cursor-pointer hover:bg-secondary/50 transition-colors",
                          selectedItem?.id === name.id && "border-primary"
                        )}
                        onClick={() => handleItemSelect(name)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">
                                {name.number}. {name.translation}
                              </p>
                              <p className="text-xs text-muted-foreground">{name.arabic}</p>
                              {name.russianTranscription && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {name.russianTranscription}
                                </p>
                              )}
                            </div>
                            {selectedItem?.id === name.id && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет доступных имен
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Карточка тасбиха */}
      {goalContent && (
        <TasbihCard
          content={goalContent}
          selectedGoal={selectedGoal}
          currentCount={currentCount}
          progress={progress}
          isComplete={isComplete}
          isLearningGoal={isLearningGoal}
          displaySettings={displaySettings}
          onDisplaySettingsChange={setDisplaySettings}
          onCount={handleCount}
          onReset={handleReset}
          onLearned={() => setLearnedDialogOpen(true)}
          audioUrl={audioUrl}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
        />
      )}

      {/* Пустое состояние */}
      {!selectedGoal && !selectedItem && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">
                Выберите цель или элемент для тасбиха
              </p>
              <p className="text-sm text-muted-foreground">
                Используйте AI-рекомендации для быстрого выбора
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалог подтверждения "Выучил" */}
      <AlertDialog open={learnedDialogOpen} onOpenChange={setLearnedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отметить цель как выученную?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что выучили "{selectedGoal?.title}"? Цель будет отмечена как завершенная.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleLearned}>
              Да, выучил
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface QuranSelectorProps {
  onSurahSelect: (surahNumber: number, ayahs: DhikrItem[]) => void;
  onAyahSelect: (ayah: DhikrItem) => void;
}

// Компонент для выбора из Корана
const QuranSelector = ({ onSurahSelect, onAyahSelect }: QuranSelectorProps) => {
  const [surahs, setSurahs] = useState<DhikrItem[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [ayahs, setAyahs] = useState<DhikrItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSurahs();
  }, []);

  const loadSurahs = async () => {
    setLoading(true);
    try {
      const data = await getSurahs();
      setSurahs(data);
    } catch (error) {
      console.error("Error loading surahs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSurahSelect = async (surahNumber: number) => {
    setSelectedSurah(surahNumber);
    setLoading(true);
    try {
      const data = await getAyahs(surahNumber);
      setAyahs(data);
      onSurahSelect(surahNumber, data);
    } catch (error) {
      console.error("Error loading ayahs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedSurah) {
    return (
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedSurah(null);
            setAyahs([]);
          }}
        >
          ← Назад к сурам
        </Button>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Загрузка аятов...</div>
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {ayahs.map((ayah) => (
              <Card
                key={ayah.id}
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => onAyahSelect(ayah)}
              >
                <CardContent className="p-3">
                  <p className="font-semibold text-sm">Аят {ayah.ayahNumber}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {ayah.translation}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Загрузка сур...</div>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {surahs.map((surah) => (
            <Card
              key={surah.id}
              className="cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => surah.number && handleSurahSelect(surah.number)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {surah.number}. {surah.translation}
                    </p>
                    <p className="text-xs text-muted-foreground">{surah.arabic}</p>
                  </div>
                  {typeof surah.number === "number" && (
                    <Badge variant="outline">{surah.number} аятов</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент карточки тасбиха
const TasbihCard = ({
  content,
  selectedGoal,
  currentCount,
  progress,
  isComplete,
  isLearningGoal,
  displaySettings,
  onDisplaySettingsChange,
  onCount,
  onReset,
  onLearned,
  audioUrl,
  isPlaying,
  onPlayPause,
}: TasbihCardProps) => {
  const resolvedAudioUrl = audioUrl ?? content.audioUrl;
  return (
    <Card className="bg-gradient-card border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {selectedGoal?.title || "Тасбих"}
          </CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-semibold">Настройки отображения</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-arabic">Арабский текст</Label>
                    <Switch
                      id="show-arabic"
                      checked={displaySettings.showArabic}
                      onCheckedChange={(checked) =>
                        onDisplaySettingsChange({ ...displaySettings, showArabic: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-transcription">Транскрипция</Label>
                    <Switch
                      id="show-transcription"
                      checked={displaySettings.showTranscription}
                      onCheckedChange={(checked) =>
                        onDisplaySettingsChange({ ...displaySettings, showTranscription: checked })
                      }
                    />
                  </div>
                  {displaySettings.showTranscription && (
                    <div className="ml-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={displaySettings.transcriptionType === "latin" ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            onDisplaySettingsChange({ ...displaySettings, transcriptionType: "latin" })
                          }
                        >
                          Латиница
                        </Button>
                        <Button
                          variant={displaySettings.transcriptionType === "cyrillic" ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            onDisplaySettingsChange({ ...displaySettings, transcriptionType: "cyrillic" })
                          }
                        >
                          Кириллица
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-translation">Перевод</Label>
                    <Switch
                      id="show-translation"
                      checked={displaySettings.showTranslation}
                      onCheckedChange={(checked) =>
                        onDisplaySettingsChange({ ...displaySettings, showTranslation: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-audio">Аудио</Label>
                    <Switch
                      id="show-audio"
                      checked={displaySettings.showAudio}
                      onCheckedChange={(checked) =>
                        onDisplaySettingsChange({ ...displaySettings, showAudio: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Арабский текст */}
        {displaySettings.showArabic && (
          <div className="text-center py-4">
            <p
              className="text-4xl font-arabic text-foreground"
              style={{ fontFamily: "'Amiri', serif" }}
              dir="rtl"
            >
              {content.arabic}
            </p>
          </div>
        )}

        {/* Транскрипция */}
        {displaySettings.showTranscription && (
          <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-xl p-4 border border-border/40">
            <p className="text-center text-lg text-foreground/95 italic leading-relaxed">
              {displaySettings.transcriptionType === "latin"
                ? content.transcription
                : content.russianTranscription}
            </p>
          </div>
        )}

        {/* Перевод */}
        {displaySettings.showTranslation && content.translation && (
          <div className="bg-gradient-to-br from-primary/8 to-primary/3 rounded-xl p-4 border border-primary/25">
            <p className="text-center text-base text-foreground leading-relaxed">
              {content.translation}
            </p>
          </div>
        )}

        {/* Аудиоплеер */}
        {displaySettings.showAudio && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onPlayPause}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            {resolvedAudioUrl && <audio src={resolvedAudioUrl} />}
          </div>
        )}

        {/* Прогресс */}
        {selectedGoal && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {currentCount} / {selectedGoal.target_value}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={onCount}
            disabled={isComplete}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isComplete ? "Завершено" : "Считать"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onReset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Кнопка "Выучил" */}
        {isLearningGoal && isComplete && (
          <Button
            variant="default"
            className="w-full"
            onClick={onLearned}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Выучил
          </Button>
        )}

        {isComplete && (
          <div className="text-center">
            <p className="text-sm gradient-text-gold font-semibold animate-pulse">
              ✨ Завершено! Ма ша Аллах
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

