// Компактная интерактивная панель прогресса в стиле Goal: Habits & Tasks
// Современный дизайн с плавными анимациями

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Calendar,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { calculateProgressStats, formatNumber } from "@/lib/prayer-utils";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
// Используем CSS анимации вместо framer-motion для лучшей производительности

export const CompactProgressPanel = () => {
  const navigate = useNavigate();
  const { userData, loading } = useUserData();
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    if (!userData) return null;
    return calculateProgressStats(userData);
  }, [userData]);

  if (loading || !stats) {
    return (
      <div className="animate-pulse">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="h-20 bg-gray-200 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressColor = stats.overallProgress >= 75 
    ? "from-emerald-500 to-green-600"
    : stats.overallProgress >= 50
    ? "from-blue-500 to-blue-600"
    : "from-orange-500 to-orange-600";

  return (
    <div className="animate-in fade-in-50 duration-300">
      <Card className="bg-white border-0 shadow-lg overflow-hidden">
        {/* Компактный вид */}
        <CardContent className="p-0">
          <div
            className={cn(
              "relative bg-gradient-to-br",
              progressColor,
              "text-white p-5 cursor-pointer transition-all duration-300 hover:shadow-xl"
            )}
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5" />
                  <span className="text-sm font-medium opacity-90">Прогресс каза</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="text-4xl font-bold">{stats.overallProgress}%</div>
                  <div className="text-sm opacity-80">
                    {formatNumber(stats.totalCompleted)} / {formatNumber(stats.totalMissed)}
                  </div>
                </div>
                <div className="mt-3">
                  <Progress 
                    value={stats.overallProgress} 
                    className="h-2 bg-white/20"
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4">
                {expanded ? (
                  <ChevronUp className="w-5 h-5 opacity-80" />
                ) : (
                  <ChevronDown className="w-5 h-5 opacity-80" />
                )}
                {stats.overallProgress >= 75 && (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* Расширенный вид */}
          {expanded && (
            <div
              className="overflow-hidden animate-in slide-in-from-top-2 duration-300"
            >
                <div className="p-5 bg-gray-50 space-y-4">
                  {/* Статистика */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="text-2xl font-bold text-emerald-700">
                        {formatNumber(stats.totalCompleted)}
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">Восполнено</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-gray-100 border border-gray-200">
                      <div className="text-2xl font-bold text-gray-700">
                        {formatNumber(stats.remaining)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Осталось</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-2xl font-bold text-blue-700">
                        {stats.dailyPace}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">В день</div>
                    </div>
                  </div>

                  {/* Прогноз */}
                  {stats.daysToComplete > 0 && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          При текущем темпе
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Завершите через {stats.monthsToComplete > 0 
                          ? `${stats.monthsToComplete} мес. ${stats.daysRemaining} дн.`
                          : `${stats.daysToComplete} дн.`
                        }
                      </div>
                    </div>
                  )}

                  {/* Быстрые действия */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto p-3 flex flex-col items-center gap-1 border-2 hover:border-emerald-300 hover:bg-emerald-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/?tab=plan");
                      }}
                    >
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-medium">План</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto p-3 flex flex-col items-center gap-1 border-2 hover:border-blue-300 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/?tab=reports");
                      }}
                    >
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-medium">Отчёты</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

