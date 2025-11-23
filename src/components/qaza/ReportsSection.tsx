import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, TrendingUp, Calendar, Target, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eReplikaAPI } from "@/lib/api";
import { useUserData } from "@/hooks/useUserData";
import { calculateProgressStats, formatNumber } from "@/lib/prayer-utils";

export const ReportsSection = () => {
  const { toast } = useToast();
  const { userData, loading: userDataLoading, refreshData } = useUserData();
  const [loading, setLoading] = useState(false);

  // Обновляем данные при монтировании и при событиях обновления
  useEffect(() => {
    const handleDataUpdate = () => {
      refreshData();
    };

    window.addEventListener('userDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleDataUpdate);
    };
  }, [refreshData]);

  // Валидация данных перед расчетом статистики
  const isValidUserData = useMemo(() => {
    if (!userData) return false;
    
    // Проверяем наличие обязательных полей
    const hasDebtCalculation = userData.debt_calculation && 
      typeof userData.debt_calculation === 'object' &&
      userData.debt_calculation.missed_prayers &&
      typeof userData.debt_calculation.missed_prayers === 'object';
    
    const hasRepaymentProgress = userData.repayment_progress &&
      typeof userData.repayment_progress === 'object' &&
      userData.repayment_progress.completed_prayers &&
      typeof userData.repayment_progress.completed_prayers === 'object';
    
    return hasDebtCalculation && hasRepaymentProgress;
  }, [userData]);

  // Мемоизация статистики с обработкой ошибок
  const stats = useMemo(() => {
    try {
      if (!isValidUserData) {
        return calculateProgressStats(null);
      }
      return calculateProgressStats(userData);
    } catch (error) {
      console.error("Error calculating stats:", error);
      return calculateProgressStats(null);
    }
  }, [userData, isValidUserData]);

  const handleDownloadPDF = async () => {
    if (!userData) {
      toast({
        title: "Ошибка",
        description: "Нет данных для формирования отчёта",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Генерация через e-Replika API
      const userId = userData.user_id || `user_${Date.now()}`;
      const blob = await eReplikaAPI.generatePDFReport(userId, userData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prayer-debt-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "PDF отчёт скачан",
        description: "Отчёт успешно сохранён",
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({
        title: "Ошибка генерации PDF",
        description: error instanceof Error ? error.message : "Не удалось сгенерировать PDF отчёт. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    toast({
      title: "Поделиться прогрессом",
      description: "Используйте функцию 'Поделиться' в разделе достижений",
    });
  };

  // Показываем загрузку
  if (userDataLoading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Загрузка данных...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Показываем сообщение, если нет данных или данные невалидны
  if (!userData || !isValidUserData) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                {!userData 
                  ? "Для отображения отчётов необходимо сначала рассчитать долг намазов"
                  : "Данные неполные. Пожалуйста, выполните расчет заново."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Мемоизация массива статистики с безопасной обработкой даты
  const statsArray = useMemo(() => {
    try {
      const startDate = stats.startDate instanceof Date && !isNaN(stats.startDate.getTime())
        ? stats.startDate
        : new Date();
      
      return [
        {
          icon: Calendar,
          label: "Дата начала",
          value: startDate.toLocaleDateString("ru-RU", { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          description: "Начало отслеживания",
        },
        {
          icon: Target,
          label: "Всего восполнено",
          value: formatNumber(stats.totalCompleted),
          description: "намазов выполнено",
        },
        {
          icon: TrendingUp,
          label: "Осталось",
          value: formatNumber(stats.remaining),
          description: "намазов до завершения",
        },
        {
          icon: Clock,
          label: "Средний темп",
          value: `${stats.dailyPace}/день`,
          description: "намазов в день",
        },
      ];
    } catch (error) {
      console.error("Error creating stats array:", error);
      return [
        {
          icon: Calendar,
          label: "Дата начала",
          value: new Date().toLocaleDateString("ru-RU"),
          description: "Начало отслеживания",
        },
        {
          icon: Target,
          label: "Всего восполнено",
          value: "0",
          description: "намазов выполнено",
        },
        {
          icon: TrendingUp,
          label: "Осталось",
          value: "0",
          description: "намазов до завершения",
        },
        {
          icon: Clock,
          label: "Средний темп",
          value: "0/день",
          description: "намазов в день",
        },
      ];
    }
  }, [stats]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header Card */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl">Ваш духовный путь</CardTitle>
          <CardDescription>
            Детальная статистика восполнения пропущенных намазов
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsArray.map((stat) => (
          <Card key={stat.label} className="bg-gradient-card border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <stat.icon className="w-4 h-4" />
                  <span className="text-sm">{stat.label}</span>
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Summary */}
      <Card className="bg-gradient-dusk text-white shadow-strong">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Прогноз завершения</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-3xl font-bold">{stats.monthsToComplete}</div>
                <div className="text-sm opacity-90">месяцев</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{stats.daysRemaining}</div>
                <div className="text-sm opacity-90">дней</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{stats.overallProgress}%</div>
                <div className="text-sm opacity-90">выполнено</div>
              </div>
            </div>
            <p className="text-sm opacity-90 text-center">
              При текущем темпе ({stats.dailyPace} намазов/день)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Chart Placeholder */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Прогресс за последние 7 дней</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-around gap-2">
            {[10, 12, 8, 15, 11, 13, 14].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{ height: `${(value / 15) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][index]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid gap-4 md:grid-cols-2">
        <Button
          onClick={handleDownloadPDF}
          disabled={loading}
          size="lg"
          className="bg-primary hover:opacity-90 transition-opacity shadow-glow"
        >
          <Download className="w-5 h-5 mr-2" />
          {loading ? "Формирование..." : "Скачать PDF отчёт"}
        </Button>
        <Button
          onClick={handleShare}
          size="lg"
          variant="outline"
          className="border-primary hover:bg-primary/10"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Поделиться прогрессом
        </Button>
      </div>

      {/* Achievements Card */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-accent">🏆 Достижения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-card">
              <div className="text-3xl mb-2">✨</div>
              <div className="text-sm font-semibold">Первые 100</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-sm font-semibold">7 дней подряд</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card opacity-50">
              <div className="text-3xl mb-2">🌟</div>
              <div className="text-sm font-semibold">1000 намазов</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card opacity-50">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-sm font-semibold">50% пути</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
