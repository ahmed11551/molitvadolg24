// Компонент для создания цели

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { IPhoneCalendar } from "@/components/ui/iphone-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Target, Sparkles, Check } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import { ItemSelector } from "./ItemSelector";
import { Checkbox } from "@/components/ui/checkbox";
import type { Goal, GoalCategory, GoalType, GoalPeriod, GoalMetric, KnowledgeSubcategory, PrayerSubcategory, LinkedCounterType } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";

interface CreateGoalDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onGoalCreated?: () => void;
  children?: ReactNode;
}

const CATEGORIES: Array<{ value: GoalCategory; label: string; icon: string }> = [
  { value: "prayer", label: "Намаз", icon: "🕌" },
  { value: "quran", label: "Коран", icon: "📖" },
  { value: "zikr", label: "Зикр/Дуа", icon: "📿" },
  { value: "sadaqa", label: "Садака", icon: "💝" },
  { value: "knowledge", label: "Знания", icon: "📚" },
  { value: "names_of_allah", label: "99 имен Аллаха", icon: "✨" },
];

const KNOWLEDGE_SUBCATEGORIES: Array<{ value: KnowledgeSubcategory; label: string }> = [
  { value: "book", label: "Книга" },
  { value: "alifba", label: "Уроки алифба" },
  { value: "tajwid", label: "Таджвид" },
];

const PRAYER_SUBCATEGORIES: Array<{ value: PrayerSubcategory; label: string; description?: string }> = [
  { value: "regular", label: "Обычные намазы", description: "Ежедневные обязательные намазы" },
  { value: "qaza", label: "Восполнение (Каза)", description: "Восполнение пропущенных намазов" },
];

const GOAL_TYPES: Array<{ value: GoalType; label: string; description?: string }> = [
  { value: "one_time", label: "Одноразовая", description: "Цель выполняется один раз" },
  { value: "recurring", label: "Повторяющаяся", description: "Автоматически возобновляется после завершения" },
  { value: "fixed_term", label: "С фиксированным сроком", description: "Цель с конкретной датой окончания" },
  { value: "habit", label: "Бессрочная привычка", description: "Ежедневная практика без срока" },
];

const PERIODS: Array<{ value: GoalPeriod; label: string }> = [
  { value: "infinite", label: "Бессрочная" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "forty_days", label: "40 дней" },
  { value: "year", label: "Год" },
  { value: "custom", label: "Произвольная дата" },
];

const METRICS: Array<{ value: GoalMetric; label: string }> = [
  { value: "count", label: "Количество (раз, страниц, сур)" },
  { value: "regularity", label: "Регулярность (дни подряд)" },
];

const LINKED_COUNTER_TYPES: Array<{ value: LinkedCounterType; label: string }> = [
  { value: "salawat", label: "Салаваты" },
  { value: "tasbih", label: "Тасбих (Субханаллах)" },
  { value: "tahmid", label: "Тахмид (Альхамдулиллах)" },
  { value: "takbir", label: "Такбир (Аллаху Акбар)" },
  { value: "names_of_allah", label: "99 имен Аллаха" },
];

export const CreateGoalDialog = ({ open, onOpenChange, onGoalCreated, children }: CreateGoalDialogProps) => {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory | "">("");
  const [knowledgeSubcategory, setKnowledgeSubcategory] = useState<KnowledgeSubcategory | "">("");
  const [prayerSubcategory, setPrayerSubcategory] = useState<PrayerSubcategory | "">("");
  const [type, setType] = useState<GoalType>("fixed_term");
  const [period, setPeriod] = useState<GoalPeriod>("month");
  const [metric, setMetric] = useState<GoalMetric>("count");
  const [targetValue, setTargetValue] = useState<number>(30);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [linkedCounterType, setLinkedCounterType] = useState<LinkedCounterType | "">("");
  const [isLearning, setIsLearning] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedItemType, setSelectedItemType] = useState<Goal["item_type"]>(undefined);
  const [selectedItemData, setSelectedItemData] = useState<Goal["item_data"]>(null);
  const [recurringDays, setRecurringDays] = useState<number[]>([]); // Дни недели для повторяющихся целей (0-6, где 0 = воскресенье)

  // Автоматический расчет end_date на основе period
  const calculateEndDate = (period: GoalPeriod, start: Date): Date | null => {
    // Для бессрочных и повторяющихся целей дата окончания не устанавливается
    if (period === "infinite" || period === "recurring_weekly" || period === "recurring_monthly") {
      return null;
    }

    const end = new Date(start);
    switch (period) {
      case "week":
        end.setDate(end.getDate() + 7);
        break;
      case "month":
        end.setMonth(end.getMonth() + 1);
        break;
      case "forty_days":
        end.setDate(end.getDate() + 40);
        break;
      case "year":
        end.setFullYear(end.getFullYear() + 1);
        break;
      case "custom":
        return endDate || null;
    }
    return end;
  };

  // Расчет рекомендуемого ежедневного плана
  const calculateDailyPlan = (): number | null => {
    // Для бессрочных привычек план не рассчитывается
    if (type === "habit" || period === "infinite") return null;
    
    if (!startDate || !endDate || !targetValue) return null;
    const daysRemaining = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 0) return null;
    return Math.ceil(targetValue / daysRemaining);
  };

  const handlePeriodChange = (newPeriod: GoalPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === "infinite" || newPeriod === "recurring_weekly" || newPeriod === "recurring_monthly") {
      setEndDate(undefined);
    } else if (newPeriod !== "custom") {
      const calculatedEnd = calculateEndDate(newPeriod, startDate);
      setEndDate(calculatedEnd || undefined);
    }
  };

  const handleTypeChange = (newType: GoalType) => {
    setType(newType);
    // Автоматически устанавливаем период для бессрочных привычек
    if (newType === "habit") {
      setPeriod("infinite");
      setEndDate(undefined);
      setRecurringDays([]);
    } else if (newType === "recurring") {
      // Для повторяющихся целей предлагаем повторяющиеся периоды
      if (period !== "recurring_weekly" && period !== "recurring_monthly") {
        setPeriod("recurring_weekly");
        setEndDate(undefined);
      }
      // По умолчанию выбираем все дни недели
      if (recurringDays.length === 0) {
        setRecurringDays([0, 1, 2, 3, 4, 5, 6]);
      }
    } else if (newType === "fixed_term" || newType === "one_time") {
      // Для фиксированного срока и одноразовых целей нужна дата окончания
      if (!endDate && period !== "custom") {
        const calculatedEnd = calculateEndDate(period, startDate);
        setEndDate(calculatedEnd || undefined);
      }
      setRecurringDays([]);
    }
  };
  
  const toggleRecurringDay = (day: number) => {
    setRecurringDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };
  
  const DAYS_OF_WEEK = [
    { value: 0, label: "Вс", fullLabel: "Воскресенье" },
    { value: 1, label: "Пн", fullLabel: "Понедельник" },
    { value: 2, label: "Вт", fullLabel: "Вторник" },
    { value: 3, label: "Ср", fullLabel: "Среда" },
    { value: 4, label: "Чт", fullLabel: "Четверг" },
    { value: 5, label: "Пт", fullLabel: "Пятница" },
    { value: 6, label: "Сб", fullLabel: "Суббота" },
  ];

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      if (period !== "custom") {
        setEndDate(calculateEndDate(period, date));
      }
    }
  };

  const handleSubmit = async () => {
    setShowErrors(true);
    
    // Детальная валидация с указанием конкретного поля
    const missingFields: string[] = [];
    
    if (!title.trim()) {
      missingFields.push("Название цели");
    }
    if (!category) {
      missingFields.push("Категория");
    }
    if (!targetValue || targetValue <= 0) {
      missingFields.push("Целевое значение");
    }
    
    if (missingFields.length > 0) {
      toast({
        title: "Заполните обязательные поля",
        description: missingFields.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (category === "knowledge" && !knowledgeSubcategory) {
      toast({
        title: "Ошибка",
        description: "Выберите подкатегорию для категории 'Знания'",
        variant: "destructive",
      });
      return;
    }

    if (category === "prayer" && !prayerSubcategory) {
      toast({
        title: "Ошибка",
        description: "Выберите тип намазов",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Для бессрочных привычек и повторяющихся целей endDate может быть undefined
      let finalEndDate: Date | undefined = undefined;
      if (type === "habit") {
        finalEndDate = undefined; // Бессрочная привычка
      } else if (type === "recurring") {
        finalEndDate = undefined; // Повторяющаяся цель
        if (recurringDays.length === 0) {
          toast({
            title: "Ошибка",
            description: "Выберите хотя бы один день недели для повторяющейся цели",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } else {
        // Для фиксированного срока и одноразовых целей нужна дата окончания
        finalEndDate = period === "custom" ? endDate : calculateEndDate(period, startDate);
        if (!finalEndDate) {
          toast({
            title: "Ошибка",
            description: "Необходимо указать дату окончания",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const dailyPlan = calculateDailyPlan();

      // Формируем название цели на основе выбранного элемента
      let finalTitle = title;
      if (selectedItemData && selectedItemData.title) {
        finalTitle = isLearning ? `Выучить ${selectedItemData.title}` : selectedItemData.title;
      } else if (isLearning && title) {
        finalTitle = `Выучить ${title}`;
      }

      await spiritualPathAPI.createGoal({
        title: finalTitle,
        description: description || selectedItemData?.translation || undefined,
        category: category as GoalCategory,
        knowledge_subcategory: category === "knowledge" ? (knowledgeSubcategory as KnowledgeSubcategory) : undefined,
        prayer_subcategory: category === "prayer" ? (prayerSubcategory as PrayerSubcategory) : undefined,
        type,
        period: type === "recurring" ? (period === "recurring_weekly" ? "recurring_weekly" : "recurring_monthly") : period,
        metric,
        target_value: targetValue,
        current_value: 0,
        start_date: type === "habit" ? undefined : startDate,
        end_date: finalEndDate,
        linked_counter_type: linkedCounterType || undefined,
        status: "active",
        daily_plan: dailyPlan || undefined,
        // Сохраняем данные элемента
        item_id: selectedItemId || undefined,
        item_type: selectedItemType,
        item_data: selectedItemData ? {
          ...selectedItemData,
          recurring_days: type === "recurring" ? recurringDays : undefined,
        } : undefined,
        is_learning: isLearning,
      });

      toast({
        title: "Цель создана!",
        description: dailyPlan ? `Рекомендуемый ежедневный план: ${Math.ceil(dailyPlan)}` : "Цель успешно добавлена",
      });

      // Сброс формы
      setTitle("");
      setDescription("");
      setCategory("");
      setKnowledgeSubcategory("");
      setPrayerSubcategory("");
      setTargetValue(30);
      setStartDate(new Date());
      setEndDate(undefined);
      setLinkedCounterType("");
      setShowErrors(false);
      setIsLearning(false);
      setSelectedItemId("");
      setSelectedItemType(undefined);
      setSelectedItemData(null);
      setRecurringDays([]);
      setType("fixed_term");
      setPeriod("month");

      setDialogOpen(false);
      
      // Вызываем callback для обновления списка целей
      if (onGoalCreated) {
        // Небольшая задержка для гарантии сохранения
        setTimeout(() => {
          onGoalCreated();
        }, 100);
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать цель. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dailyPlan = calculateDailyPlan();

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Создать цель
          </DialogTitle>
          <DialogDescription>
            Установите цель для отслеживания вашего духовного роста
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Название цели */}
          <div className="space-y-2">
            <Label htmlFor="title" className={cn(showErrors && !title.trim() && "text-red-500")}>
              Название цели *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Прочитать весь Коран"
              className={cn(showErrors && !title.trim() && "border-red-300 bg-red-50")}
            />
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавьте описание цели..."
              rows={3}
            />
          </div>

          {/* Категория */}
          <div className="space-y-2">
            <Label className={cn(showErrors && !category && "text-red-500")}>
              Категория * {showErrors && !category && <span className="text-red-500 text-xs ml-1">(выберите)</span>}
            </Label>
            <div className={cn(
              "grid grid-cols-3 gap-2 p-2 rounded-lg transition-colors",
              showErrors && !category && "bg-red-50 border-2 border-red-300"
            )}>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  type="button"
                  variant={category === cat.value ? "default" : "outline"}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "h-auto py-3 flex flex-col gap-1",
                    category === cat.value && "ring-2 ring-emerald-500"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Подкатегория для знаний */}
          {category === "knowledge" && (
            <div className="space-y-2">
              <Label>Подкатегория *</Label>
              <Select value={knowledgeSubcategory} onValueChange={(v) => setKnowledgeSubcategory(v as KnowledgeSubcategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите подкатегорию" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_SUBCATEGORIES.map((sub) => (
                    <SelectItem key={sub.value} value={sub.value}>
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Подкатегория для намазов */}
          {category === "prayer" && (
            <div className="space-y-2">
              <Label>Тип намазов</Label>
              <Select value={prayerSubcategory} onValueChange={(v) => setPrayerSubcategory(v as PrayerSubcategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип намазов" />
                </SelectTrigger>
                <SelectContent>
                  {PRAYER_SUBCATEGORIES.map((sub) => (
                    <SelectItem key={sub.value} value={sub.value}>
                      <div>
                        <div className="font-medium">{sub.label}</div>
                        {sub.description && (
                          <div className="text-xs text-muted-foreground">{sub.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Выбор конкретного элемента для зикров, корана, намазов */}
          {(category === "zikr" || category === "quran" || category === "prayer" || category === "names_of_allah") && (
            <div className="space-y-2">
              <Label>Выберите конкретный элемент</Label>
              <ItemSelector
                category={category as GoalCategory}
                selectedItemId={selectedItemId}
                selectedItemType={selectedItemType}
                onItemSelect={(itemId, itemType, itemData) => {
                  setSelectedItemId(itemId);
                  setSelectedItemType(itemType as Goal["item_type"]);
                  setSelectedItemData(itemData as Goal["item_data"]);
                  // Автоматически заполняем название и описание
                  if (itemData.title) {
                    setTitle(itemData.title);
                  }
                  if (itemData.translation) {
                    setDescription(itemData.translation);
                  }
                }}
              />
            </div>
          )}

          {/* Флаг "Выучить" */}
          {(category === "zikr" || category === "quran" || category === "names_of_allah") && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-learning"
                checked={isLearning}
                onCheckedChange={(checked) => setIsLearning(checked as boolean)}
              />
              <Label
                htmlFor="is-learning"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Выучить
              </Label>
              <p className="text-xs text-muted-foreground">
                Если отмечено, в тасбихе появится кнопка "Выучил"
              </p>
            </div>
          )}

          {/* Тип цели */}
          <div className="space-y-2">
            <Label>Тип цели</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as GoalType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <div className="font-medium">{t.label}</div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Динамические параметры в зависимости от типа цели - красивая карточка */}
          <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-background border-2 border-primary/20 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <Label className="text-base font-semibold text-foreground">
                {type === "fixed_term" && "📅 Период и дата"}
                {type === "recurring" && "🔄 Повторение"}
                {type === "habit" && "♾️ Бессрочная привычка"}
                {type === "one_time" && "✅ Одноразовая цель"}
              </Label>
            </div>
            {type === "fixed_term" && (
              <>
                {/* Период для фиксированного срока */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Период</Label>
                  <Select value={period} onValueChange={handlePeriodChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.filter(p => p.value !== "infinite" && p.value !== "recurring_weekly" && p.value !== "recurring_monthly").map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Календарь для выбора даты окончания - показывается всегда для фиксированного срока */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Дата окончания *
                  </Label>
                  {period === "custom" ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12",
                            "overflow-hidden text-ellipsis whitespace-nowrap",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-5 w-5 shrink-0" />
                          <span className="truncate">
                            {endDate ? format(endDate, "dd.MM.yyyy") : "Выберите дату окончания"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <IPhoneCalendar
                          mode="single"
                          selected={endDate || undefined}
                          onSelect={(date) => {
                            if (date) {
                              setEndDate(date);
                            }
                          }}
                          initialFocus
                          disabled={(date) => date < startDate}
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <span className="font-medium">
                          {endDate ? format(endDate, "dd.MM.yyyy") : "Автоматически рассчитано"}
                        </span>
                      </div>
                      {endDate && (
                        <p className="text-sm text-muted-foreground">
                          {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} дней до завершения
                        </p>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full"
                          >
                            Изменить дату
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <IPhoneCalendar
                            mode="single"
                            selected={endDate || undefined}
                            onSelect={(date) => {
                              if (date) {
                                setEndDate(date);
                              }
                            }}
                            initialFocus
                            disabled={(date) => date < startDate}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </>
            )}

            {type === "recurring" && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Дни недели *</Label>
                <div className="flex gap-2 flex-wrap justify-center">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={recurringDays.includes(day.value) ? "default" : "outline"}
                      size="lg"
                      onClick={() => toggleRecurringDay(day.value)}
                      className={cn(
                        "w-14 h-14 rounded-full text-base font-semibold transition-all",
                        recurringDays.includes(day.value) 
                          ? "bg-primary text-primary-foreground shadow-md scale-105" 
                          : "hover:bg-muted"
                      )}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {recurringDays.length === 0 
                      ? "Выберите дни недели, когда будет выполняться цель"
                      : `Выбрано: ${recurringDays.length} ${recurringDays.length === 1 ? "день" : recurringDays.length < 5 ? "дня" : "дней"}`
                    }
                  </p>
                  {recurringDays.length === 0 && showErrors && (
                    <p className="text-xs text-red-500 mt-1">Выберите хотя бы один день</p>
                  )}
                </div>
              </div>
            )}

          {type === "habit" && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Бессрочная привычка не имеет даты окончания. Цель будет активна до тех пор, пока вы её не завершите вручную.
              </p>
            </div>
          )}

          {type === "one_time" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Дата выполнения *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      "overflow-hidden text-ellipsis whitespace-nowrap",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5 shrink-0" />
                    <span className="truncate">
                      {endDate ? format(endDate, "dd.MM.yyyy") : "Выберите дату выполнения"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <IPhoneCalendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
              {endDate && (
                <p className="text-xs text-muted-foreground">
                  Цель будет выполнена {format(endDate, "d MMMM yyyy", { locale: ru })}
                </p>
              )}
            </div>
          )}


          {/* Метрика */}
          <div className="space-y-2">
            <Label>Метрика</Label>
            <Select value={metric} onValueChange={(v) => setMetric(v as GoalMetric)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Целевое значение */}
          <div className="space-y-2">
            <Label htmlFor="targetValue">Целевое значение *</Label>
            <Input
              id="targetValue"
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
              placeholder="30"
            />
            <p className="text-xs text-muted-foreground">
              {metric === "count" ? "Количество (раз, страниц, сур и т.д.)" : "Количество дней подряд"}
            </p>
          </div>

          {/* Дата начала (показывается для всех типов, кроме бессрочных привычек) */}
          {type !== "habit" && (
            <div className="space-y-2">
              <Label className="text-sm leading-tight break-words">Дата начала</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "overflow-hidden text-ellipsis whitespace-nowrap",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {startDate ? format(startDate, "dd.MM.yyyy") : "Выберите дату"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <IPhoneCalendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Интеграция с тасбихом */}
          {(category === "zikr" || category === "names_of_allah") && (
            <div className="space-y-2">
              <Label>Интеграция с тасбихом (необязательно)</Label>
              <Select
                value={linkedCounterType || ""}
                onValueChange={(v) => setLinkedCounterType(v as LinkedCounterType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип счетчика" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не использовать</SelectItem>
                  {LINKED_COUNTER_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value || ""}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Если выбран, прогресс будет автоматически синхронизироваться с тасбихом
              </p>
            </div>
          )}

          {/* Рекомендуемый ежедневный план */}
          {dailyPlan && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Рекомендуемый ежедневный план</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Для достижения цели делайте <strong className="text-primary">{Math.ceil(dailyPlan)}</strong>{" "}
                {metric === "count" ? "в день" : "дней подряд"}
              </p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Создание..." : "Создать цель"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

