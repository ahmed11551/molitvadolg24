// Раздел Азкары - новый дизайн с вкладками "Категории" и "Любимое"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Share2, Heart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdhkarCard } from "./AdhkarCard";
import { eReplikaAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BOOKMARKS_KEY = "prayer_debt_bookmarks_adhkar";

interface Adhkar {
  id: string;
  title: string;
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation: string;
  count: number;
  category?: string;
  audioUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
  adhkar: Adhkar[];
}

export const AdhkarSectionV2 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adhkar, setAdhkar] = useState<Adhkar[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<Adhkar[]>([]);
  const [todayAdhkar, setTodayAdhkar] = useState<Adhkar | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "favorites">("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadAdhkar();
    loadFavorites();
    loadTodayAdhkar();
  }, []);

  const loadAdhkar = async () => {
    setLoading(true);
    try {
      const data = await eReplikaAPI.getAdhkar();
      setAdhkar(data);

      // Группируем по категориям
      const categoriesMap = new Map<string, Adhkar[]>();
      data.forEach((item: any) => {
        const categoryId = item.category_id || item.category || "general";
        const categoryName = item.category_name || item.category || "Общие";
        
        if (!categoriesMap.has(categoryId)) {
          categoriesMap.set(categoryId, []);
        }
        categoriesMap.get(categoryId)!.push({
          id: item.id,
          title: item.title || item.name || "",
          arabic: item.arabic || item.text_arabic || "",
          transcription: item.transcription || item.text_transcription || "",
          russianTranscription: item.russian_transcription || item.russianTranscription,
          translation: item.translation || item.text_translation || item.name_english || "",
          count: item.count || 33,
          category: categoryId,
          audioUrl: item.audio_url || item.audioUrl || null,
        });
      });

      // Преобразуем в массив категорий
      const cats: Category[] = Array.from(categoriesMap.entries()).map(([id, adhkar]) => ({
        id,
        name: getCategoryName(id),
        adhkar,
      }));

      setCategories(cats);
    } catch (error) {
      console.error("Error loading adhkar:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const categoryNames: Record<string, string> = {
      morning: "Утренние",
      evening: "Вечерние",
      after_prayer: "После намаза",
      general: "Общие",
      protection: "Защита",
    };
    return categoryNames[categoryId] || categoryId;
  };

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const bookmarks = JSON.parse(stored);
        if (Array.isArray(bookmarks)) {
          setFavorites(bookmarks);
        }
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadTodayAdhkar = () => {
    // Выбираем случайный азкар для "Сегодняшний Азкар"
    if (adhkar.length > 0) {
      const randomIndex = Math.floor(Math.random() * adhkar.length);
      setTodayAdhkar(adhkar[randomIndex]);
    }
  };

  useEffect(() => {
    if (adhkar.length > 0 && !todayAdhkar) {
      loadTodayAdhkar();
    }
  }, [adhkar]);

  const toggleFavorite = (adhkar: Adhkar) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: Adhkar[] = stored ? JSON.parse(stored) : [];
      
      const isFavorite = bookmarks.some((b: Adhkar) => b.id === adhkar.id);
      
      if (isFavorite) {
        bookmarks = bookmarks.filter((b: Adhkar) => b.id !== adhkar.id);
        toast({
          title: "Удалено из избранного",
        });
      } else {
        bookmarks.push(adhkar);
        toast({
          title: "Добавлено в избранное",
        });
      }
      
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      loadFavorites();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleShare = async (adhkar: Adhkar) => {
    try {
      const text = `${adhkar.title}\n\n${adhkar.translation}\n\n${adhkar.arabic}\n\n${adhkar.transcription}`;
      if (navigator.share) {
        await navigator.share({
          title: adhkar.title,
          text: text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Скопировано",
          description: "Азкар скопирован в буфер обмена",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const isFavorite = (adhkar: Adhkar): boolean => {
    return favorites.some((f) => f.id === adhkar.id);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой назад */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Азкары</h1>
      </div>

      {/* Вкладки */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "categories" | "favorites")}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="categories" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Категории
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Любимое
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6 space-y-6">
          {/* Сегодняшний Азкар */}
          {todayAdhkar && (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Сегодняшний Азкар</h3>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold">{todayAdhkar.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {todayAdhkar.translation}
                  </p>
                  <p className="text-sm font-mono italic text-foreground">
                    {todayAdhkar.transcription}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFavorite(todayAdhkar)}
                    className="flex-1"
                  >
                    <Star className={cn(
                      "w-4 h-4 mr-2",
                      isFavorite(todayAdhkar) && "fill-yellow-400 text-yellow-400"
                    )} />
                    Любимое
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(todayAdhkar)}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Категории */}
          <div className="space-y-4">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="bg-gradient-card border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedCategory(category.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-semibold">{category.adhkar.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Список азкаров выбранной категории */}
          {selectedCategory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Закрыть
                </Button>
              </div>
              {categories
                .find(c => c.id === selectedCategory)
                ?.adhkar.map((adhkar) => (
                  <AdhkarCard
                    key={adhkar.id}
                    dhikr={{
                      id: adhkar.id,
                      title: adhkar.title,
                      arabic: adhkar.arabic,
                      transcription: adhkar.transcription,
                      russianTranscription: adhkar.russianTranscription,
                      translation: adhkar.translation,
                      count: adhkar.count,
                      category: adhkar.category || "general",
                    }}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6 space-y-4">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Нет избранных азкаров</p>
              <p className="text-sm text-muted-foreground mt-2">
                Добавьте азкары в избранное, чтобы они появились здесь
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((adhkar) => (
                <AdhkarCard
                  key={adhkar.id}
                  dhikr={{
                    id: adhkar.id,
                    title: adhkar.title,
                    arabic: adhkar.arabic,
                    transcription: adhkar.transcription,
                    russianTranscription: adhkar.russianTranscription,
                    translation: adhkar.translation,
                    count: adhkar.count,
                    category: adhkar.category || "general",
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

