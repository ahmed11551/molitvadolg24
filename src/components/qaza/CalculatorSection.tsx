// Калькулятор каза - дизайн Goal app

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Calendar, User, Plane, AlertCircle, BookOpen, CheckSquare, HelpCircle, ChevronRight, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateBulughDate, calculatePrayerDebt, validateCalculationData } from "@/lib/prayer-calculator";
import { prayerDebtAPI, localStorageAPI } from "@/lib/api";
import { getTelegramUserId } from "@/lib/telegram";
import { logCalculation } from "@/lib/audit-log";
import type { Gender, Madhab, TravelPeriod } from "@/types/prayer-debt";
import { TravelPeriodsDialog } from "./TravelPeriodsDialog";
import { ManualInputSection } from "./ManualInputSection";
import { TermsDictionary } from "./TermsDictionary";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { hasFeature } from "@/types/subscription";
import { SubscriptionUpgradeDialog } from "@/components/spiritual-path/SubscriptionGate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalculatorMode = "choice" | "manual" | "calculator";

export const CalculatorSection = () => {
  const { toast } = useToast();
  const { tier } = useSubscription();
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
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  const handleCalculate = async () => {
    setErrors([]);
    setLoading(true);

    try {
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

      const womenData = gender === "female" ? {
        haid_days_per_month: haidDays,
        childbirth_count: childbirthCount,
        nifas_days_per_childbirth: nifasDays,
      } : undefined;

      const calculatedTravelDays = travelPeriods.length > 0
        ? travelPeriods.reduce((sum, p) => sum + p.days_count, 0)
        : travelDays;

      const travelData = {
        total_travel_days: calculatedTravelDays,
        travel_periods: travelPeriods,
      };

      const validation = validateCalculationData(personalData, womenData, travelData);
      if (!validation.valid) {
        setErrors(validation.errors);
        setLoading(false);
        return;
      }

      const debtCalculation = calculatePrayerDebt(personalData, womenData, travelData, madhab);

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
          completed_prayers: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 },
          last_updated: new Date(),
        },
      };

      try {
        const response = await prayerDebtAPI.calculateDebt({
          calculation_method: "calculator",
          personal_data: { ...personalData, bulugh_date: bulughDate },
          women_data: womenData,
          travel_data: travelData,
        });
        localStorageAPI.saveUserData(response || userData);
      } catch {
        localStorageAPI.saveUserData(userData);
      }

      logCalculation(telegramUserId || userData.user_id, null, debtCalculation);

      const totalMissed = Object.values(debtCalculation.missed_prayers).reduce((sum, val) => sum + val, 0);

      toast({
        title: "✅ Расчёт выполнен",
        description: `Найдено ${totalMissed.toLocaleString()} пропущенных намазов`,
      });

      window.dispatchEvent(new CustomEvent('userDataUpdated'));
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Экран выбора режима
  if (mode === "choice") {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Выберите способ расчёта</h2>
        
        <button
          onClick={() => setMode("manual")}
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4 text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Я знаю количество</h3>
            <p className="text-sm text-gray-500 mt-1">Введите пропущенные намазы вручную</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <div className="relative">
          <button
            onClick={() => {
              if (hasFeature(tier, "intelligent_qaza_calculator")) {
                setMode("calculator");
              } else {
                toast({
                  title: "Премиум функция",
                  description: "Интеллектуальный калькулятор доступен в тарифе Мутахсин",
                  variant: "default",
                });
              }
            }}
            className={cn(
              "w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4 text-left",
              !hasFeature(tier, "intelligent_qaza_calculator") && "opacity-75"
            )}
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Calculator className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Помощь посчитать</h3>
                {!hasFeature(tier, "intelligent_qaza_calculator") && (
                  <Lock className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Автоматический расчёт по дате рождения</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          {!hasFeature(tier, "intelligent_qaza_calculator") && (
            <div className="absolute -top-2 -right-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                    PRO
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Интеллектуальный калькулятор</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground mb-4">
                    Эта функция доступна в тарифе Мутахсин (PRO). Автоматический расчет на основе даты рождения, пола и других параметров.
                  </p>
                  <SubscriptionUpgradeDialog requiredTier="mutahsin" />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Режим ручного ввода
  if (mode === "manual") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMode("choice")}
          className="flex items-center gap-2 text-emerald-600 font-medium mb-4"
        >
          ← Назад
        </button>
        <ManualInputSection />
      </div>
    );
  }

  // Режим калькулятора
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMode("choice")}
          className="flex items-center gap-2 text-emerald-600 font-medium"
        >
          ← Назад
        </button>
        <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Словарик</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Словарик терминов</DialogTitle>
            </DialogHeader>
            <TermsDictionary />
          </DialogContent>
        </Dialog>
      </div>

      {/* Ошибки */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Личные данные */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-700" />
          </div>
          <h3 className="font-semibold text-gray-900">Личные данные</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600">Дата рождения</Label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 h-12 rounded-xl border-gray-200"
            />
          </div>

          <div>
            <Label className="text-sm text-gray-600">Пол</Label>
            <div className="flex gap-3 mt-2">
              {[
                { value: "male", label: "Мужской" },
                { value: "female", label: "Женский" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGender(option.value as Gender)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-medium transition-colors",
                    gender === option.value
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-gray-600">Мазхаб</Label>
            <Select value={madhab} onValueChange={(v) => setMadhab(v as Madhab)}>
              <SelectTrigger className="mt-1 h-12 rounded-xl border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hanafi">Ханафитский</SelectItem>
                <SelectItem value="shafii">Шафиитский</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-gray-600">Возраст булюга</Label>
            <Input
              type="number"
              value={bulughAge}
              onChange={(e) => setBulughAge(parseInt(e.target.value) || 15)}
              min={12}
              max={18}
              className="mt-1 h-12 rounded-xl border-gray-200"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-sm text-gray-600">Молюсь с сегодняшнего дня</Label>
            <Switch checked={useTodayAsStart} onCheckedChange={setUseTodayAsStart} />
          </div>

          {!useTodayAsStart && (
            <div>
              <Label className="text-sm text-gray-600">Дата начала молитв</Label>
              <Input
                type="date"
                value={prayerStartDate}
                onChange={(e) => setPrayerStartDate(e.target.value)}
                className="mt-1 h-12 rounded-xl border-gray-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* Данные для женщин */}
      {gender === "female" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Дополнительно</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Дней хайда в месяц</Label>
              <Input
                type="number"
                value={haidDays}
                onChange={(e) => setHaidDays(parseInt(e.target.value) || 7)}
                min={3}
                max={10}
                className="mt-1 h-12 rounded-xl border-gray-200"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Количество родов</Label>
              <Input
                type="number"
                value={childbirthCount}
                onChange={(e) => setChildbirthCount(parseInt(e.target.value) || 0)}
                min={0}
                className="mt-1 h-12 rounded-xl border-gray-200"
              />
            </div>
            {childbirthCount > 0 && (
              <div>
                <Label className="text-sm text-gray-600">Дней нифаса на каждые роды</Label>
                <Input
                  type="number"
                  value={nifasDays}
                  onChange={(e) => setNifasDays(parseInt(e.target.value) || 40)}
                  min={1}
                  max={60}
                  className="mt-1 h-12 rounded-xl border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Путешествия */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Plane className="w-5 h-5 text-emerald-700" />
          </div>
          <h3 className="font-semibold text-gray-900">Путешествия (сафар)</h3>
        </div>

        {/* Официальная позиция ДУМ */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">Официальная позиция ДУМ РФ</h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Согласно позиции Духовного управления мусульман Российской Федерации, 
                путешествием (сафар) считается поездка на расстояние не менее 88 км от места постоянного проживания. 
                В дни путешествия четырёхракаатные намазы (Зухр, Аср, Иша) сокращаются до двух ракаатов. 
                Фаджр, Магриб и Витр не сокращаются.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600">Общее количество дней в пути</Label>
            <Input
              type="number"
              value={travelDays}
              onChange={(e) => setTravelDays(parseInt(e.target.value) || 0)}
              min={0}
              className="mt-1 h-12 rounded-xl border-gray-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Если не помните точное количество, можете указать приблизительно
            </p>
          </div>

          <TravelPeriodsDialog
            periods={travelPeriods}
            onPeriodsChange={setTravelPeriods}
            open={travelPeriodsDialogOpen}
            onOpenChange={setTravelPeriodsDialogOpen}
          />

          <Button
            variant="outline"
            onClick={() => setTravelPeriodsDialogOpen(true)}
            className="w-full h-12 rounded-xl border-gray-200"
          >
            Указать периоды путешествий ({travelPeriods.length})
          </Button>
        </div>
      </div>

      {/* Кнопка расчёта */}
      <Button
        onClick={handleCalculate}
        disabled={loading || !birthDate}
        className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg"
      >
        {loading ? "Расчёт..." : "Рассчитать долги"}
      </Button>
    </div>
  );
};
