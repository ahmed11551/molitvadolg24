// Виджет полезных советов (Life Hacks) в стиле Goal: Habits & Tasks
// Показывает полезные советы для духовного развития

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  RefreshCw,
  BookOpen,
  Heart,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LifeHack {
  id: string;
  title: string;
  description: string;
  category: "prayer" | "quran" | "zikr" | "habits" | "motivation" | "general";
  icon: React.ReactNode;
  source?: string;
}

const LIFE_HACKS: LifeHack[] = [
  {
    id: "hack-1",
    title: "Начните с малого",
    description: "Пророк ﷺ сказал: «Самые любимые дела для Аллаха — постоянные, даже если они малы». Лучше читать 1 страницу Корана каждый день, чем 30 страниц раз в месяц.",
    category: "habits",
    icon: <Target className="w-5 h-5" />,
    source: "Сахих аль-Бухари",
  },
  {
    id: "hack-2",
    title: "Утренние азкары",
    description: "Чтение утренних азкаров после Фаджра защищает вас весь день. Установите напоминание сразу после намаза.",
    category: "zikr",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "hack-3",
    title: "Связь с Кораном",
    description: "Читайте хотя бы 1 аят Корана каждый день с пониманием. Это лучше, чем читать много без понимания.",
    category: "quran",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: "hack-4",
    title: "Дуа после намаза",
    description: "Время после намаза — лучшее время для дуа. Аллах ближе всего к своему рабу в это время.",
    category: "prayer",
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: "hack-5",
    title: "Восполняйте каза постепенно",
    description: "Вместо того чтобы восполнять много намазов за раз, лучше делать по 1-2 дополнительных намаза каждый день. Это более устойчивый подход.",
    category: "prayer",
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: "hack-6",
    title: "Салават каждый день",
    description: "Произносите салават на Пророка ﷺ хотя бы 10 раз в день. Это приносит благословение и увеличивает ваши награды.",
    category: "zikr",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "hack-7",
    title: "Ведите дневник прогресса",
    description: "Записывайте свои достижения каждый день. Это мотивирует и помогает видеть прогресс.",
    category: "habits",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: "hack-8",
    title: "Групповые цели",
    description: "Присоединяйтесь к групповым целям или создайте свою. Поддержка других помогает сохранять мотивацию.",
    category: "motivation",
    icon: <Heart className="w-5 h-5" />,
  },
];

const CATEGORY_COLORS: Record<LifeHack["category"], string> = {
  prayer: "from-blue-500 to-blue-600",
  quran: "from-emerald-500 to-green-600",
  zikr: "from-purple-500 to-purple-600",
  habits: "from-orange-500 to-orange-600",
  motivation: "from-pink-500 to-pink-600",
  general: "from-gray-500 to-gray-600",
};

export const LifeHacksWidget = () => {
  const [currentHack, setCurrentHack] = useState<LifeHack>(LIFE_HACKS[0]);
  const [viewedHacks, setViewedHacks] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Загружаем просмотренные советы
    const saved = localStorage.getItem("viewed_life_hacks");
    if (saved) {
      setViewedHacks(new Set(JSON.parse(saved)));
    }

    // Показываем новый совет каждые 30 секунд
    const interval = setInterval(() => {
      showNextHack();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const showNextHack = () => {
    // Выбираем случайный непросмотренный совет
    const unviewed = LIFE_HACKS.filter((h) => !viewedHacks.has(h.id));
    const available = unviewed.length > 0 ? unviewed : LIFE_HACKS;
    const randomHack = available[Math.floor(Math.random() * available.length)];

    setCurrentHack(randomHack);
    setViewedHacks((prev) => {
      const updated = new Set(prev);
      updated.add(randomHack.id);
      localStorage.setItem("viewed_life_hacks", JSON.stringify(Array.from(updated)));
      return updated;
    });
  };

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Полезный совет</CardTitle>
              <CardDescription className="text-xs">Для вашего духовного развития</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={showNextHack}
            className="rounded-full"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "p-4 rounded-xl bg-white/80 border-l-4 mb-3",
          `border-${currentHack.category === "prayer" ? "blue" : currentHack.category === "quran" ? "emerald" : currentHack.category === "zikr" ? "purple" : currentHack.category === "habits" ? "orange" : currentHack.category === "motivation" ? "pink" : "gray"}-500`
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0",
              CATEGORY_COLORS[currentHack.category]
            )}>
              {currentHack.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1 break-words">{currentHack.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed break-words">{currentHack.description}</p>
              {currentHack.source && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {currentHack.source}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Совет {LIFE_HACKS.indexOf(currentHack) + 1} из {LIFE_HACKS.length}</span>
          <Button
            variant="link"
            size="sm"
            onClick={showNextHack}
            className="h-auto p-0 text-xs"
          >
            Следующий совет →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

