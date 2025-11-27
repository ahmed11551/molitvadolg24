// Раздел Дуа - новый дизайн с вкладками "Категории" и "Любимое"

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Share2, Heart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DuaCard } from "./DuaCard";
import { CategoryDuasView } from "./CategoryDuasView";
import { DuaSearch } from "./DuaSearch";
import { eReplikaAPI } from "@/lib/api";
import { getAvailableItemsByCategory, type DhikrItem } from "@/lib/dhikr-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const BOOKMARKS_KEY = "prayer_debt_bookmarks";

interface Dua {
  id: string;
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation: string;
  reference?: string;
  audioUrl?: string | null;
  category?: string;
}

interface Category {
  id: string;
  name: string;
  duas: Dua[];
}

type RemoteDuaRecord = Dua & {
  category_id?: string;
  category_name?: string;
  text_arabic?: string;
  text_transcription?: string;
  russian_transcription?: string;
  text_translation?: string;
  name_english?: string;
  hadith_reference?: string;
  audio_url?: string | null;
  audio?: string | null;
};

export const DuaSectionV2 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [duas, setDuas] = useState<Dua[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<Dua[]>([]);
  const [todayDua, setTodayDua] = useState<Dua | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "favorites" | "search">("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getCategoryName = useCallback((categoryId: string): string => {
    const categoryNames: Record<string, string> = {
      morning: "Утро & вечер",
      evening: "Утро & вечер",
      sleep: "Перед сном",
      home: "Дом & семья",
      family: "Дом & семья",
      food: "Еда & напиток",
      travel: "Путешествовать",
      joy: "Радость & печаль",
      sorrow: "Радость & печаль",
      general: "Общие",
    };
    return categoryNames[categoryId] || categoryId;
  }, []);

  const loadDuas = useCallback(async () => {
    setLoading(true);
    try {
      // Используем getAvailableItemsByCategory с fallback на локальные данные
      let data: Dua[] = [];
      let hasError = false;
      
      try {
        // Сначала пробуем получить из API
        const apiData = await eReplikaAPI.getDuas();
        if (apiData && apiData.length > 0) {
          data = apiData;
        } else {
          // Если API вернул пустой массив, используем fallback
          try {
            const fallbackData = await getAvailableItemsByCategory("dua");
            if (fallbackData && fallbackData.length > 0) {
              data = fallbackData.map((item: DhikrItem): Dua => ({
                id: item.id,
                arabic: item.arabic || "",
                transcription: item.transcription || "",
                russianTranscription: item.russianTranscription,
                translation: item.translation || "",
                reference: item.reference,
                audioUrl: item.audioUrl || null,
                category: "general",
              }));
            } else {
              hasError = true;
            }
          } catch (fallbackError) {
            console.warn("Fallback также не сработал:", fallbackError);
            hasError = true;
          }
        }
      } catch (apiError) {
        // Если API недоступен, используем fallback
        console.warn("API недоступен, используем локальные данные:", apiError);
        try {
          const fallbackData = await getAvailableItemsByCategory("dua");
          if (fallbackData && fallbackData.length > 0) {
            data = fallbackData.map((item: DhikrItem): Dua => ({
              id: item.id,
              arabic: item.arabic || "",
              transcription: item.transcription || "",
              russianTranscription: item.russianTranscription,
              translation: item.translation || "",
              reference: item.reference,
              audioUrl: item.audioUrl || null,
              category: "general",
            }));
          } else {
            hasError = true;
          }
        } catch (fallbackError) {
          console.error("Fallback также не сработал:", fallbackError);
          hasError = true;
        }
      }

      if (hasError || data.length === 0) {
        // Если все попытки не удались, показываем сообщение в интерфейсе
        setCategories([]);
        setDuas([]);
        return;
      }

      setDuas(data);

      // Группируем по категориям
      const categoriesMap = new Map<string, Dua[]>();
      (data as RemoteDuaRecord[]).forEach((dua) => {
        const categoryId = dua.category_id || dua.category || "general";
        
        if (!categoriesMap.has(categoryId)) {
          categoriesMap.set(categoryId, []);
        }
        categoriesMap.get(categoryId)!.push({
          id: dua.id,
          arabic: dua.arabic || dua.text_arabic || "",
          transcription: dua.transcription || dua.text_transcription || "",
          russianTranscription: dua.russian_transcription || dua.russianTranscription,
          translation: dua.translation || dua.text_translation || dua.name_english || "",
          reference: dua.reference || dua.hadith_reference,
          audioUrl: dua.audio_url ?? dua.audioUrl ?? dua.audio ?? null,
          category: categoryId,
        });
      });

      // Преобразуем в массив категорий
      const cats: Category[] = Array.from(categoriesMap.entries()).map(([id, duas]) => ({
        id,
        name: getCategoryName(id),
        duas,
      }));

      setCategories(cats);
    } catch (error) {
      console.error("Error loading duas:", error);
      // В случае ошибки показываем хотя бы пустые категории
      setCategories([]);
      setDuas([]);
    } finally {
      setLoading(false);
    }
  }, [getCategoryName]);

  const loadFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const bookmarksRaw: unknown = JSON.parse(stored);
        if (Array.isArray(bookmarksRaw)) {
          setFavorites(bookmarksRaw as Dua[]);
        }
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  }, []);

  const loadTodayDua = useCallback(() => {
    // Выбираем случайное дуа для "Сегодняшний Dua"
    if (duas.length > 0) {
      const randomIndex = Math.floor(Math.random() * duas.length);
      setTodayDua(duas[randomIndex]);
    }
  }, [duas]);

  useEffect(() => {
    loadDuas();
    loadFavorites();
    loadTodayDua();
  }, [loadDuas, loadFavorites, loadTodayDua]);

  useEffect(() => {
    if (duas.length > 0 && !todayDua) {
      loadTodayDua();
    }
  }, [duas, todayDua, loadTodayDua]);

  const toggleFavorite = (dua: Dua) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      let bookmarks: Dua[] = Array.isArray(parsed) ? (parsed as Dua[]) : [];
      
      const isFavorite = bookmarks.some((b) => b.id === dua.id);
      
      if (isFavorite) {
        bookmarks = bookmarks.filter((b: Dua) => b.id !== dua.id);
        toast({
          title: "Удалено из избранного",
        });
      } else {
        bookmarks.push(dua);
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

  const handleShare = async (dua: Dua) => {
    try {
      const text = `${dua.translation}\n\n${dua.arabic}\n\n${dua.transcription}`;
      if (navigator.share) {
        await navigator.share({
          title: "Дуа",
          text: text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Скопировано",
          description: "Дуа скопировано в буфер обмена",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const isFavorite = (dua: Dua): boolean => {
    return favorites.some((f) => f.id === dua.id);
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
        <h1 className="text-2xl font-bold">Дуа</h1>
      </div>

      {/* Быстрый поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Быстрый поиск дуа..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value) {
              setActiveTab("search");
            }
          }}
          className="pl-10"
        />
      </div>

      {/* Вкладки */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as "categories" | "favorites" | "search");
          if (v !== "search") {
            setSearchQuery("");
          }
        }}
      >
        <div className="flex justify-center mt-2 mb-2">
          <TabsList
            className={cn(
              "inline-flex items-center gap-1",
              "rounded-full border border-border/40 bg-white",
              "shadow-sm px-1 py-1 w-auto"
            )}
          >
            <TabsTrigger
              value="categories"
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full",
                "text-foreground/70 transition-all",
                "data-[state=active]:bg-primary data-[state=active]:text-white",
                "data-[state=active]:shadow-sm"
              )}
            >
              Категории
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full",
                "text-foreground/70 transition-all",
                "data-[state=active]:bg-primary data-[state=active]:text-white",
                "data-[state=active]:shadow-sm"
              )}
            >
              Любимое
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="categories" className="mt-6 space-y-6">
          {/* Сообщение если нет данных */}
          {categories.length === 0 && !loading && (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6 text-center space-y-4">
                <div>
                  <p className="text-muted-foreground mb-2 font-medium">Дуа временно недоступны</p>
                  <p className="text-sm text-muted-foreground">
                    Пожалуйста, проверьте подключение к интернету или попробуйте позже
                  </p>
                </div>
                <Button onClick={loadDuas} variant="outline" size="sm">
                  Попробовать снова
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Сегодняшний Dua */}
          {todayDua && (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Сегодняшний Dua</h3>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {todayDua.translation}
                  </p>
                  <p className="text-sm font-mono italic text-foreground">
                    {todayDua.transcription}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFavorite(todayDua)}
                    className="flex-1"
                  >
                    <Star className={cn(
                      "w-4 h-4 mr-2",
                      isFavorite(todayDua) && "fill-yellow-400 text-yellow-400"
                    )} />
                    Любимое
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(todayDua)}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Просмотр категории или список категорий */}
          {selectedCategory ? (
            <CategoryDuasView
              categoryId={selectedCategory}
              categoryName={categories.find(c => c.id === selectedCategory)?.name || ""}
              onBack={() => setSelectedCategory(null)}
            />
          ) : (
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
                        <span className="text-sm font-semibold">{category.duas.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <DuaSearch searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="favorites" className="mt-6 space-y-4">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Нет избранных дуа</p>
              <p className="text-sm text-muted-foreground mt-2">
                Добавьте дуа в избранное, чтобы они появились здесь
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((dua) => (
                <DuaCard
                  key={dua.id}
                  dua={dua}
                  categoryColor="category-general"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

