import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PrayerProgressCardProps {
  name: string;
  completed: number;
  total: number;
  color: string;
  emoji: string;
}

export const PrayerProgressCard = memo(({
  name,
  completed,
  total,
  color,
  emoji,
}: PrayerProgressCardProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="bg-white hover:shadow-md transition-all duration-300 border-gray-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{emoji}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm break-words flex-1 min-w-0">{name}</h3>
            </div>
            <div className="text-lg font-bold text-emerald-600">
              {percentage}%
            </div>
          </div>
          
          <Progress 
            value={percentage} 
            className="h-2.5 bg-gray-100"
          />
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">
              {completed.toLocaleString()} из {total.toLocaleString()}
            </span>
            <span className="text-emerald-600 font-semibold">
              Осталось: {Math.max(0, total - completed).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PrayerProgressCard.displayName = "PrayerProgressCard";
