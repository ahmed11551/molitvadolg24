// Индикатор последнего восполненного каза намаза

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PRAYER_NAMES: Record<string, { label: string; emoji: string; color: string }> = {
  fajr: { label: "Фаджр", emoji: "🌅", color: "text-orange-500" },
  dhuhr: { label: "Зухр", emoji: "☀️", color: "text-yellow-500" },
  asr: { label: "Аср", emoji: "🌤️", color: "text-blue-500" },
  maghrib: { label: "Магриб", emoji: "🌇", color: "text-red-500" },
  isha: { label: "Иша", emoji: "🌙", color: "text-indigo-500" },
  witr: { label: "Витр", emoji: "✨", color: "text-purple-500" },
};

export const LastPrayerIndicator = () => {
  const { userData } = useUserData();

  // Получаем последний восполненный намаз из истории
  const lastPrayer = useMemo(() => {
    if (!userData?.repayment_progress?.completed_prayers) return null;

    // Получаем историю из localStorage
    const historyKey = "qaza_prayer_history";
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");

    if (history.length === 0) {
      // Если истории нет, используем last_updated и проверяем, какие намазы были добавлены
      const lastUpdated = userData.repayment_progress.last_updated;
      if (!lastUpdated) return null;

      const completed = userData.repayment_progress.completed_prayers;
      const prayerTypes = Object.keys(completed) as Array<keyof typeof completed>;
      
      // Находим последний ненулевой намаз
      for (const prayer of prayerTypes.reverse()) {
        if (completed[prayer] > 0) {
          return {
            type: prayer,
            count: completed[prayer],
            date: new Date(lastUpdated),
          };
        }
      }
      return null;
    }

    // Сортируем по дате и берем последний
    const sorted = history
      .map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
      }))
      .sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

    if (sorted.length === 0) return null;

    const last = sorted[0];
    return {
      type: last.prayer_type,
      count: last.count || 1,
      date: last.date,
    };
  }, [userData]);

  if (!lastPrayer) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Начните восполнять каза</p>
              <p className="text-xs text-gray-500">Отметьте первый восполненный намаз</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const prayerInfo = PRAYER_NAMES[lastPrayer.type] || {
    label: lastPrayer.type,
    emoji: "🕌",
    color: "text-gray-500",
  };

  const timeAgo = formatDistanceToNow(lastPrayer.date, {
    addSuffix: true,
    locale: ru,
  });

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-2xl">{prayerInfo.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-900 truncate">
                Последний восполненный намаз
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-white">
                {prayerInfo.label}
              </Badge>
              {lastPrayer.count > 1 && (
                <span className="text-xs text-gray-600">×{lastPrayer.count}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

