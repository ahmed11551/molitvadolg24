// Компактный календарь событий с активными целями

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight,
  Target
} from "lucide-react";
import { format, isToday, isTomorrow, isAfter, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types/spiritual-path";
import { useNavigate } from "react-router-dom";

interface GoalsCalendarProps {
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
}

export const GoalsCalendar = ({ goals, onGoalClick }: GoalsCalendarProps) => {
  const navigate = useNavigate();

  // Фильтруем активные цели с датами окончания
  const activeGoals = useMemo(() => {
    return goals
      .filter(goal => goal.status === "active" && goal.end_date)
      .sort((a, b) => {
        const dateA = new Date(a.end_date!).getTime();
        const dateB = new Date(b.end_date!).getTime();
        return dateA - dateB;
      })
      .slice(0, 5); // Показываем только ближайшие 5 целей
  }, [goals]);

  const getGoalStatus = (goal: Goal) => {
    if (!goal.end_date) return null;
    
    const endDate = new Date(goal.end_date);
    const today = new Date();
    const daysRemaining = differenceInDays(endDate, today);

    if (daysRemaining < 0) {
      return { type: "overdue", label: "Просрочено", color: "destructive" };
    } else if (daysRemaining === 0) {
      return { type: "urgent", label: "Сегодня", color: "default" };
    } else if (daysRemaining <= 3) {
      return { type: "urgent", label: "Срочно", color: "default" };
    }
    
    return null;
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return "Сегодня";
    if (isTomorrow(date)) return "Завтра";
    return format(date, "d MMMM", { locale: ru });
  };

  const handleGoalClick = (goal: Goal) => {
    if (onGoalClick) {
      onGoalClick(goal);
    } else {
      navigate(`/spiritual-path?goal=${goal.id}`);
    }
  };

  if (activeGoals.length === 0) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Ближайшие цели</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/spiritual-path")}
          >
            Все цели
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeGoals.map((goal) => {
          const status = getGoalStatus(goal);
          const progressPercent = goal.target_value > 0 
            ? Math.min(100, (goal.current_value / goal.target_value) * 100) 
            : 0;
          
          return (
            <Card
              key={goal.id}
              className={cn(
                "cursor-pointer hover:shadow-md transition-all",
                status?.type === "overdue" && "border-red-300 bg-red-50",
                status?.type === "urgent" && !status?.type.includes("overdue") && "border-yellow-300 bg-yellow-50"
              )}
              onClick={() => handleGoalClick(goal)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm line-clamp-1">{goal.title}</h4>
                      {status && (
                        <Badge 
                          variant={status.color as any}
                          className="text-xs flex-shrink-0"
                        >
                          {status.type === "overdue" && <AlertCircle className="w-3 h-3 mr-1" />}
                          {status.type === "urgent" && <Clock className="w-3 h-3 mr-1" />}
                          {status.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {goal.end_date && formatDate(new Date(goal.end_date))}
                      </span>
                      <span>
                        {goal.current_value} / {goal.target_value}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          progressPercent >= 100 ? "bg-green-500" : 
                          status?.type === "overdue" ? "bg-red-500" :
                          status?.type === "urgent" ? "bg-yellow-500" : "bg-primary"
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoalClick(goal);
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

