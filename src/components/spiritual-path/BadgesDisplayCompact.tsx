// Компактное отображение бейджей для размещения над календарем

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { spiritualPathAPI } from "@/lib/api";
import type { Badge as BadgeType } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";

const LEVEL_COLORS = {
  copper: {
    bg: "from-amber-600/20 to-amber-800/20",
    border: "border-amber-500/30",
    text: "text-amber-600",
    icon: "🥉",
  },
  silver: {
    bg: "from-gray-300/20 to-gray-500/20",
    border: "border-gray-400/30",
    text: "text-gray-600",
    icon: "🥈",
  },
  gold: {
    bg: "from-yellow-400/20 to-yellow-600/20",
    border: "border-yellow-500/30",
    text: "text-yellow-600",
    icon: "🥇",
  },
};

export const BadgesDisplayCompact = () => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const data = await spiritualPathAPI.getBadges();
      setBadges(data);
    } catch (error) {
      console.error("Error loading badges:", error);
    } finally {
      setLoading(false);
    }
  };

  // Группируем бейджи по типу и берем только высший уровень каждого типа
  const topBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.badge_type]) {
      acc[badge.badge_type] = badge;
    } else {
      const order = { copper: 1, silver: 2, gold: 3 };
      if (order[badge.level] > order[acc[badge.badge_type].level]) {
        acc[badge.badge_type] = badge;
      }
    }
    return acc;
  }, {} as Record<string, BadgeType>);

  const badgeList = Object.values(topBadges);

  if (loading) {
    return null;
  }

  if (badgeList.length === 0) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="w-4 h-4" />
            <span>Пока нет бейджей</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-base">Достижения</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {badgeList.map((badge) => {
          const levelInfo = LEVEL_COLORS[badge.level];
          return (
            <Card
              key={badge.id}
              className={cn(
                "min-w-[100px] flex-shrink-0 bg-gradient-to-br border-2",
                levelInfo.bg,
                levelInfo.border
              )}
            >
              <CardContent className="p-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-2xl">{levelInfo.icon}</div>
                  <div className={cn("font-semibold text-xs text-center", levelInfo.text)}>
                    {badge.level === "copper" ? "Медь" :
                     badge.level === "silver" ? "Серебро" : "Золото"}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

