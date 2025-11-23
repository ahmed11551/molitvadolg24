# Интеграция модулей

## Связи между модулями

### 1. Qaza ↔ Goals (Восполнение намазов ↔ Цели)

**Как работает:**
- При расчете каза автоматически создается цель категории `prayer`
- При добавлении намазов прогресс синхронизируется с целями
- Цель обновляется в реальном времени

**Файлы:**
- `src/lib/qaza-goals-sync.ts` - утилита синхронизации
- `src/components/spiritual-path/QazaCalculator.tsx` - создание цели
- `src/components/qaza/AddPrayerDialog.tsx` - синхронизация при добавлении
- `src/components/qaza/PrayerCalendar.tsx` - синхронизация из календаря

**Пример использования:**
```typescript
// Автоматическая синхронизация
await syncQazaProgressWithGoals(userData, userId);

// Создание цели при расчете
await createQazaGoalIfNeeded(totalDebt, userId);
```

### 2. Tasbih ↔ Goals (Тасбих ↔ Цели)

**Как работает:**
- Тасбих показывает активные цели для отслеживания
- При использовании тасбиха прогресс цели обновляется автоматически
- Цели с флагом "Выучить" показывают кнопку "Выучил"

**Файлы:**
- `src/components/dhikr/EnhancedTasbih.tsx` - основной компонент
- `src/lib/dhikr-data.ts` - получение данных элементов

**Пример использования:**
```typescript
// Синхронизация прогресса
await spiritualPathAPI.addProgress(goalId, 1);

// Завершение цели "Выучить"
await spiritualPathAPI.updateGoal(goalId, { status: "completed" });
```

### 3. Tasbih ↔ Dhikr (Тасбих ↔ Зикры)

**Как работает:**
- Тасбих использует данные из модуля зикров
- Можно выбрать дуа, азкары, салаваты, калимы
- Данные загружаются из API Bot.e-replika.ru/docs
- Можно создать цель на основе выбранного элемента

**Файлы:**
- `src/components/dhikr/EnhancedTasbih.tsx` - выбор из зикров
- `src/components/dhikr/DuaSection.tsx` - дуа
- `src/components/dhikr/AdhkarSection.tsx` - азкары
- `src/components/dhikr/SalawatSection.tsx` - салаваты
- `src/components/dhikr/KalimaSection.tsx` - калимы

**Категории в тасбихе:**
- Цели (из ваших активных целей)
- Дуа (9 категорий)
- Зикры (5 категорий)
- Коран (суры → аяты)
- 99 имен Аллаха

### 4. Tasbih ↔ Quran (Тасбих ↔ Коран)

**Как работает:**
- Выбор суры → список аятов
- Можно повторять конкретный аят
- Данные из API Bot.e-replika.ru/docs
- Можно создать цель на основе аята

**Файлы:**
- `src/components/dhikr/EnhancedTasbih.tsx` - компонент QuranSelector
- `src/lib/dhikr-data.ts` - функции getSurahs(), getAyahs()

**Пример:**
```typescript
// Выбор суры
const surahs = await getSurahs();

// Выбор аятов суры
const ayahs = await getAyahs(surahNumber);
```

### 5. Goals ↔ Dhikr (Цели ↔ Зикры)

**Как работает:**
- При создании цели можно выбрать конкретный элемент (дуа, зикр, аят)
- Данные элемента сохраняются в `item_data` цели
- При открытии цели данные автоматически отображаются

**Файлы:**
- `src/components/spiritual-path/CreateGoalDialog.tsx` - создание цели
- `src/components/spiritual-path/ItemSelector.tsx` - выбор элемента
- `src/components/spiritual-path/GoalCard.tsx` - отображение цели

## Потоки данных

### Создание цели из каза:
```
QazaCalculator → createQazaGoalIfNeeded() → spiritualPathAPI.createGoal()
```

### Синхронизация прогресса каза:
```
AddPrayerDialog → syncQazaProgressWithGoals() → spiritualPathAPI.addProgress()
PrayerCalendar → syncQazaProgressWithGoals() → spiritualPathAPI.addProgress()
```

### Использование тасбиха:
```
EnhancedTasbih → выбор цели/элемента → getDhikrItemById() → отображение
→ счет → spiritualPathAPI.addProgress() → обновление цели
```

### Создание цели из зикра:
```
CreateGoalDialog → ItemSelector → выбор элемента → сохранение в item_data
→ spiritualPathAPI.createGoal() → цель создана
```

## API интеграция

### e-Replika API (Bot.e-replika.ru/docs)
- `/duas` - дуа
- `/adhkar` - азкары
- `/salawat` - салаваты
- `/kalimas` - калимы
- `/quran/ayahs` - аяты
- `/quran/surahs` - суры
- `/names-of-allah` - 99 имен Аллаха

### Supabase API
- `spiritualPathAPI` - цели, прогресс, бейджи, streaks
- `prayerDebtAPI` - каза намазы, прогресс

## Масштабируемость

Каждый модуль:
- ✅ Имеет свою папку компонентов
- ✅ Использует общие типы
- ✅ Использует общий API клиент
- ✅ Может работать независимо
- ✅ Легко добавлять новые функции

## Добавление новой связи

1. Создать утилиту синхронизации в `src/lib/`
2. Импортировать в нужные компоненты
3. Вызывать при изменении данных
4. Обновить документацию

