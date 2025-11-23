import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Calendar, User, Plane, AlertCircle, BookOpen, Plus, HelpCircle, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateBulughDate, calculatePrayerDebt, validateCalculationData } from "@/lib/prayer-calculator";
import { prayerDebtAPI, localStorageAPI } from "@/lib/api";
import { getTelegramUserId } from "@/lib/telegram";
import { logCalculation } from "@/lib/audit-log";
import type { Gender, Madhab, TravelPeriod } from "@/types/prayer-debt";
import { TravelPeriodsDialog } from "./TravelPeriodsDialog";
import { ManualInputSection } from "./ManualInputSection";

type CalculatorMode = "choice" | "manual" | "calculator";

export const CalculatorSection = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<CalculatorMode>("choice");
  const [gender, setGender] = useState<Gender>("male");
  const [madhab, setMadhab] = useState<Madhab>("hanafi");
  const [useTodayAsStart, setUseTodayAsStart] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Form state
  const [birthDate, setBirthDate] = useState("");
  const [bulughAge, setBulughAge] = useState(15);
  const [prayerStartDate, setPrayerStartDate] = useState("");
  const [haidDays, setHaidDays] = useState(7);
  const [childbirthCount, setChildbirthCount] = useState(0);
  const [nifasDays, setNifasDays] = useState(40);
  const [travelDays, setTravelDays] = useState(0);
  const [travelPeriods, setTravelPeriods] = useState<TravelPeriod[]>([]);
  const [travelPeriodsDialogOpen, setTravelPeriodsDialogOpen] = useState(false);

  const handleCalculate = async () => {
    setErrors([]);
    setLoading(true);

    try {
      // Валидация базовых полей
      if (!birthDate) {
        setErrors(["Пожалуйста, укажите дату рождения"]);
        setLoading(false);
        return;
      }

      const birthDateObj = new Date(birthDate);
      const bulughDate = calculateBulughDate(birthDateObj, bulughAge);
      const prayerStartDateObj = useTodayAsStart ? new Date() : new Date(prayerStartDate);

      if (!useTodayAsStart && !prayerStartDate) {
        setErrors(["Пожалуйста, укажите дату начала молитв"]);
        setLoading(false);
        return;
      }

      const personalData = {
        birth_date: birthDateObj,
        gender,
        bulugh_age: bulughAge,
        bulugh_date: bulughDate,
        prayer_start_date: prayerStartDateObj,
        today_as_start: useTodayAsStart,
      };

      const womenData =
        gender === "female"
          ? {
              haid_days_per_month: haidDays,
              childbirth_count: childbirthCount,
              nifas_days_per_childbirth: nifasDays,
            }
          : undefined;

      // Расчет общего количества дней из периодов, если они указаны
      const calculatedTravelDays =
        travelPeriods.length > 0
          ? travelPeriods.reduce((sum, p) => sum + p.days_count, 0)
          : travelDays;

      const travelData = {
        total_travel_days: calculatedTravelDays,
        travel_periods: travelPeriods,
      };

      // Валидация
      const validation = validateCalculationData(personalData, womenData, travelData);
      if (!validation.valid) {
        setErrors(validation.errors);
        setLoading(false);
        return;
      }

      // Расчет
      const debtCalculation = calculatePrayerDebt(personalData, womenData, travelData, madhab);

      // Сохранение данных
      // Используем Telegram user_id, если доступен
      const telegramUserId = getTelegramUserId();
      const userData = {
        user_id: telegramUserId || `user_${Date.now()}`,
        calc_version: "1.0.0",
        madhab: madhab,
        calculation_method: "calculator" as const,
        personal_data: personalData,
        women_data: womenData,
        travel_data: travelData,
        debt_calculation: debtCalculation,
        repayment_progress: {
          completed_prayers: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          },
          last_updated: new Date(),
        },
      };

      // Попытка сохранить через API, если недоступно - в localStorage
      try {
        const response = await prayerDebtAPI.calculateDebt({
          calculation_method: "calculator",
          personal_data: {
            ...personalData,
            bulugh_date: bulughDate,
          },
          women_data: womenData,
          travel_data: travelData,
        });
        
        // Если API вернул данные, обновляем userData
        if (response) {
          localStorageAPI.saveUserData(response);
        } else {
          localStorageAPI.saveUserData(userData);
        }
      } catch (apiError) {
        console.warn("API недоступен, сохраняем локально:", apiError);
        localStorageAPI.saveUserData(userData);
      }

      // Логирование в AuditLog
      const userId = telegramUserId || userData.user_id;
      logCalculation(userId, null, debtCalculation);

      const totalMissed = Object.values(debtCalculation.missed_prayers).reduce((sum, val) => sum + val, 0);
      const totalTravel = Object.values(debtCalculation.travel_prayers).reduce((sum, val) => sum + val, 0);

      toast({
        title: "Расчёт выполнен",
        description: `Найдено ${totalMissed.toLocaleString()} пропущенных намазов и ${totalTravel.toLocaleString()} сафар-намазов.`,
      });

      // Обновляем данные через событие, чтобы все компоненты обновились
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
    } catch (error) {
      console.error("Calculation error:", error);
      toast({
        title: "Ошибка расчёта",
        description: error instanceof Error ? error.message : "Произошла ошибка при расчёте",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Экран выбора режима
  if (mode === "choice") {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <CardTitle>Калькулятор пропущенных намазов</CardTitle>
            </div>
            <CardDescription>
              Выберите способ расчета пропущенных намазов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setMode("manual")}
              size="lg"
              variant="outline"
              className="w-full h-auto p-4 sm:p-6 flex items-start gap-3 hover:bg-primary/5 transition-all border-2 hover:border-primary/30"
            >
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-base sm:text-lg leading-tight">Я знаю количество пропущенных</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed break-words">
                  Введите количество пропущенных намазов вручную по каждому виду
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setMode("calculator")}
              size="lg"
              variant="outline"
              className="w-full h-auto p-4 sm:p-6 flex items-start gap-3 hover:bg-primary/5 transition-all border-2 hover:border-primary/30"
            >
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-base sm:text-lg leading-tight">Помощь посчитать</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed break-words">
                  Автоматический расчет на основе даты рождения и других параметров
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Режим ручного ввода
  if (mode === "manual") {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <CardTitle>Ручной ввод</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("choice")}
              >
                ← Назад
              </Button>
            </div>
          </CardHeader>
        </Card>
        <ManualInputSection />
      </div>
    );
  }

  // Режим калькулятора (существующий функционал)
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Introduction Card */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <CardTitle>Помощь посчитать</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode("choice")}
            >
              ← Назад
            </Button>
          </div>
          <CardDescription>
            Рассчитайте количество пропущенных обязательных намазов с момента совершеннолетия (булюг)
            по ханафитскому мазхабу
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Personal Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <User className="w-4 h-4" />
              <span>Личные данные</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Дата рождения
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Пол</Label>
                <RadioGroup
                  value={gender}
                  onValueChange={(value) => setGender(value as Gender)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">Мужской</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">Женский</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="madhab" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Мазхаб
                </Label>
                <Select value={madhab} onValueChange={(value) => setMadhab(value as Madhab)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Выберите мазхаб" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hanafi">Ханафитский (по умолчанию)</SelectItem>
                    <SelectItem value="shafii">Шафиитский</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {madhab === "hanafi"
                    ? "Витр включён в обязательные намазы"
                    : "Витр не учитывается как обязательный намаз"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulughAge">Возраст булюга (лет)</Label>
                <Input
                  id="bulughAge"
                  type="number"
                  value={bulughAge}
                  onChange={(e) => setBulughAge(parseInt(e.target.value) || 15)}
                  min={12}
                  max={18}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prayerStartDate">Дата начала молитв</Label>
                <Input
                  id="prayerStartDate"
                  type="date"
                  value={prayerStartDate}
                  onChange={(e) => setPrayerStartDate(e.target.value)}
                  disabled={useTodayAsStart}
                  className="bg-background"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="useToday"
                    checked={useTodayAsStart}
                    onCheckedChange={setUseTodayAsStart}
                  />
                  <Label htmlFor="useToday" className="text-sm cursor-pointer">
                    С сегодняшнего дня
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Women's Data */}
          {gender === "female" && (
            <div className="space-y-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="text-sm font-medium text-primary">
                Данные для женщин
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="haidDays">Дней хайда в месяц</Label>
                  <Input
                    id="haidDays"
                    type="number"
                    value={haidDays}
                    onChange={(e) => setHaidDays(parseInt(e.target.value) || 7)}
                    min={1}
                    max={15}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childbirthCount">Количество родов</Label>
                  <Input
                    id="childbirthCount"
                    type="number"
                    value={childbirthCount}
                    onChange={(e) => setChildbirthCount(parseInt(e.target.value) || 0)}
                    min={0}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nifasDays">Дней нифаса за роды</Label>
                  <Input
                    id="nifasDays"
                    type="number"
                    value={nifasDays}
                    onChange={(e) => setNifasDays(parseInt(e.target.value) || 40)}
                    min={1}
                    max={40}
                    className="bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Travel Data */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Plane className="w-4 h-4" />
              <span>Дни в пути (сафар)</span>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Label htmlFor="travelDays" className="text-sm whitespace-normal break-words">
                  Общее количество дней в путешествиях
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTravelPeriodsDialogOpen(true)}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="whitespace-nowrap">Добавить периоды</span>
                </Button>
              </div>
              <Input
                id="travelDays"
                type="number"
                value={travelPeriods.length > 0 ? travelPeriods.reduce((sum, p) => sum + p.days_count, 0) : travelDays}
                onChange={(e) => setTravelDays(parseInt(e.target.value) || 0)}
                min={0}
                placeholder="Введите приблизительное количество дней"
                className="bg-background"
                disabled={travelPeriods.length > 0}
              />
              {travelPeriods.length > 0 && (
                <div className="text-xs text-primary">
                  Рассчитано из {travelPeriods.length} периодов
                </div>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed break-words">
                Укажите приблизительное количество дней, проведенных в путешествиях (сафар),
                где вы сокращали намазы. Согласно позиции ДУМ РФ, сафаром считается путешествие
                на расстояние не менее 90 км от места постоянного проживания.
              </p>
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-primary hover:opacity-90 transition-opacity shadow-glow"
            size="lg"
          >
            <Calculator className="w-5 h-5 mr-2" />
            {loading ? "Расчёт..." : "Рассчитать долг намазов"}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground leading-relaxed break-words">
            <strong className="text-accent">Примечание:</strong> Расчёт выполняется по методике
            ханафитского мазхаба. Витр включён в обязательные намазы. Для женщин учитываются
            периоды хайда и нифаса. В дни сафара учитывается сокращение четырёхракаатных намазов.
          </p>
        </CardContent>
      </Card>

      {/* DUM Position on Safar */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Позиция ДУМ РФ по сафару</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="leading-relaxed break-words">
              Согласно официальной позиции Духовного управления мусульман Российской Федерации (ДУМ РФ),
              сафаром (путешествием) считается перемещение на расстояние не менее <strong className="text-foreground">90 километров</strong> от
              места постоянного проживания.
            </p>
            <p className="leading-relaxed break-words">
              В дни сафара разрешается сокращать четырёхракаатные намазы (Зухр, Аср, Иша) до двух ракаатов.
              Фаджр (2 ракаата), Магриб (3 ракаата) и Витр не сокращаются.
            </p>
            <p className="leading-relaxed break-words">
              Если вы не помните точное количество дней в путешествиях, укажите приблизительное значение
              на основе ваших воспоминаний о поездках.
            </p>
          </div>
        </CardContent>
      </Card>

      <TravelPeriodsDialog
        open={travelPeriodsDialogOpen}
        onOpenChange={setTravelPeriodsDialogOpen}
        periods={travelPeriods}
        onSave={(periods) => {
          setTravelPeriods(periods);
          setTravelDays(periods.reduce((sum, p) => sum + p.days_count, 0));
        }}
      />
    </div>
  );
};
