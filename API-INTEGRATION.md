# Документация интеграции Frontend-Backend

## Обзор архитектуры

Frontend приложение взаимодействует с двумя типами backend:

1. **e-Replika API** (`https://bot.e-replika.ru/api`) — внешний API для исламского контента
2. **Supabase Edge Functions** — внутренний backend для хранения данных пользователя

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ eReplikaAPI │  │prayerDebtAPI│  │ spiritualPathAPI       │ │
│  │             │  │             │  │ smartTasbihAPI         │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────┐  ┌─────────────────────────────────────────┐
│  e-Replika API  │  │         Supabase Edge Functions         │
│                 │  │                                         │
│ /terms          │  │ prayer-debt-api    spiritual-path-api  │
│ /duas           │  │ smart-tasbih-api                       │
│ /adhkar         │  │                                         │
│ /calendar       │  └─────────────────────────────────────────┘
│ /reports/pdf    │                     │
└─────────────────┘                     ▼
                               ┌─────────────────┐
                               │   PostgreSQL    │
                               │   (Supabase)    │
                               └─────────────────┘
```

---

## 1. e-Replika API

### Базовый URL
```
https://bot.e-replika.ru/api
```

### Аутентификация
```http
Authorization: Bearer <token>
Content-Type: application/json
```

Токен получается из:
- Telegram Mini App: `window.Telegram.WebApp.initData`
- Fallback: переменная окружения `VITE_API_TOKEN`

### Эндпоинты

#### GET /terms
Получение терминов исламского словаря.

**Запрос:**
```http
GET /api/terms
Authorization: Bearer <token>
```

**Ответ:**
```json
[
  {
    "term": "Каза",
    "definition": "Восполнение пропущенного обязательного намаза",
    "transliteration": "Qada"
  }
]
```

---

#### POST /calendar/convert-to-hijri
Конвертация даты из григорианского в хиджри-календарь.

**Запрос:**
```json
{
  "date": "2024-01-15"
}
```

**Ответ:**
```json
{
  "year": 1445,
  "month": 7,
  "day": 3
}
```

---

#### POST /calendar/convert-from-hijri
Конвертация даты из хиджри в григорианский календарь.

**Запрос:**
```json
{
  "year": 1445,
  "month": 7,
  "day": 3
}
```

**Ответ:**
```json
{
  "date": "2024-01-15"
}
```

---

#### GET /duas
Получение списка дуа.

**Ответ:**
```json
[
  {
    "id": "dua_1",
    "arabic": "بِسْمِ اللَّهِ",
    "transcription": "Bismillah",
    "russian_transcription": "Бисмиллях",
    "translation": "Во имя Аллаха",
    "reference": "Коран",
    "audio_url": "https://..."
  }
]
```

---

#### GET /duas/{id}
Получение конкретного дуа.

---

#### GET /duas/{id}/audio
Получение аудио дуа.

**Ответ:** `audio/mpeg` или JSON с `audio_url`

---

#### GET /adhkar
Получение списка азкаров.

**Ответ:**
```json
[
  {
    "id": "adhkar_1",
    "title": "Утренние азкары",
    "arabic": "أَصْبَحْنَا...",
    "transcription": "Asbahna...",
    "translation": "Мы встретили утро...",
    "count": 3,
    "category": "morning"
  }
]
```

---

#### GET /salawat
Получение списка салаватов.

---

#### GET /kalimas
Получение списка калим.

---

#### GET /names-of-allah
Получение 99 имён Аллаха.

**Альтернативные эндпоинты:**
- `/asma-al-husna`
- `/99-names`
- `/names`

---

#### GET /quran/surahs
Получение списка сур Корана.

**Ответ:**
```json
[
  {
    "number": 1,
    "name": "Al-Fatiha",
    "name_arabic": "الفاتحة",
    "name_translation": "Открывающая",
    "ayahs_count": 7
  }
]
```

---

#### GET /quran/ayahs
Получение аятов.

**Query параметры:**
- `surah` — номер суры
- `ayah` — номер аята

---

#### POST /reports/pdf
Генерация PDF-отчёта.

**Запрос:**
```json
{
  "user_id": "123",
  "data": { /* UserPrayerDebt */ }
}
```

**Ответ:** `application/pdf` или JSON с `url`

---

## 2. Prayer Debt API (Supabase)

### Базовый URL
```
https://<supabase-project>.supabase.co/functions/v1/prayer-debt-api
```

### Аутентификация
```http
Authorization: Bearer <SUPABASE_ANON_KEY>
apikey: <SUPABASE_ANON_KEY>
Content-Type: application/json
```

### Эндпоинты

#### POST /calculate
Рассчитать долг намазов.

**Запрос:**
```json
{
  "user_id": "telegram_123",
  "madhab": "hanafi",
  "calculation_method": "calculator",
  "personal_data": {
    "birth_date": "1990-01-01",
    "gender": "male",
    "bulugh_age": 15,
    "bulugh_date": "2005-01-01",
    "prayer_start_date": "2020-01-01"
  },
  "women_data": null,
  "travel_data": {
    "total_travel_days": 30,
    "travel_periods": [
      {
        "start_date": "2023-06-01",
        "end_date": "2023-06-15"
      }
    ]
  }
}
```

**Ответ:**
```json
{
  "user_id": "telegram_123",
  "calc_version": "1.0.0",
  "madhab": "hanafi",
  "debt_calculation": {
    "period": {
      "start": "2005-01-01",
      "end": "2024-01-01"
    },
    "total_days": 6939,
    "excluded_days": 30,
    "effective_days": 6909,
    "missed_prayers": {
      "fajr": 6909,
      "dhuhr": 6909,
      "asr": 6909,
      "maghrib": 6909,
      "isha": 6909,
      "witr": 6909
    },
    "travel_prayers": {
      "dhuhr_safar": 30,
      "asr_safar": 30,
      "isha_safar": 30
    }
  },
  "repayment_progress": {
    "completed_prayers": {
      "fajr": 0,
      "dhuhr": 0,
      "asr": 0,
      "maghrib": 0,
      "isha": 0,
      "witr": 0
    },
    "last_updated": "2024-01-01T00:00:00Z"
  }
}
```

---

#### GET /snapshot
Получить последний расчёт и прогресс.

**Query параметры:**
- `user_id` — ID пользователя

**Ответ:**
```json
{
  "user_id": "telegram_123",
  "debt_calculation": { /* ... */ },
  "repayment_progress": { /* ... */ },
  "overall_progress_percent": 15.5,
  "remaining_prayers": {
    "fajr": 5000,
    "dhuhr": 5000,
    "asr": 5000,
    "maghrib": 5000,
    "isha": 5000,
    "witr": 5000
  }
}
```

---

#### PATCH /progress
Обновить прогресс восполнения.

**Запрос:**
```json
{
  "user_id": "telegram_123",
  "entries": [
    { "type": "fajr", "amount": 1 },
    { "type": "dhuhr", "amount": 2 }
  ]
}
```

**Ответ:**
```json
{
  "completed_prayers": {
    "fajr": 101,
    "dhuhr": 102,
    "asr": 100,
    "maghrib": 100,
    "isha": 100,
    "witr": 100
  },
  "last_updated": "2024-01-01T12:00:00Z"
}
```

---

#### GET /report.pdf
Скачать PDF-отчёт.

**Query параметры:**
- `user_id` — ID пользователя

---

#### POST /calculations
Асинхронный расчёт (для больших объёмов).

**Ответ:**
```json
{
  "job_id": "job_123456",
  "status_url": "/api/prayer-debt/calculations/job_123456"
}
```

---

#### GET /calculations/{job_id}
Статус асинхронного расчёта.

**Ответ:**
```json
{
  "status": "done",
  "result": { /* DebtSnapshot */ },
  "error": null
}
```

---

## 3. Spiritual Path API (Supabase)

### Базовый URL
```
https://<supabase-project>.supabase.co/functions/v1/spiritual-path-api
```

### Эндпоинты

#### GET /goals
Получить цели пользователя.

**Query параметры:**
- `status` — статус целей (`active`, `completed`, `paused`)

**Ответ:**
```json
[
  {
    "id": "goal_123",
    "user_id": "telegram_123",
    "title": "Читать Коран каждый день",
    "description": "Минимум 1 страница в день",
    "category": "quran",
    "type": "daily",
    "period": "daily",
    "metric": "pages",
    "target_value": 1,
    "current_value": 0,
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "linked_counter_type": "quran_pages",
    "status": "active",
    "daily_plan": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### POST /goals
Создать цель.

**Запрос:**
```json
{
  "title": "Читать Коран каждый день",
  "description": "Минимум 1 страница в день",
  "category": "quran",
  "type": "daily",
  "period": "daily",
  "metric": "pages",
  "target_value": 30,
  "current_value": 0,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "linked_counter_type": "quran_pages"
}
```

---

#### PUT /goals/{id}
Обновить цель.

---

#### DELETE /goals/{id}
Удалить цель.

---

#### POST /counter/sync
Синхронизация счётчика с целями.

**Запрос:**
```json
{
  "counter_type": "subhanallah",
  "value": 33,
  "date": "2024-01-01"
}
```

**Ответ:**
```json
{
  "success": true,
  "updated_goals": [
    { "goal_id": "goal_123", "value": 66 }
  ],
  "new_badges": []
}
```

---

#### POST /goals/{id}/progress
Добавить прогресс вручную.

**Запрос:**
```json
{
  "value": 5,
  "date": "2024-01-01",
  "notes": "Прочитал после фаджра"
}
```

---

#### GET /badges
Получить бейджи пользователя.

**Ответ:**
```json
[
  {
    "id": "badge_123",
    "user_id": "telegram_123",
    "badge_type": "prayer_consistency",
    "level": "gold",
    "goal_id": "goal_456",
    "achieved_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### GET /streaks
Получить серии пользователя.

**Ответ:**
```json
[
  {
    "id": "streak_123",
    "user_id": "telegram_123",
    "streak_type": "daily_all",
    "current_streak": 15,
    "longest_streak": 30,
    "last_activity": "2024-01-01T00:00:00Z"
  }
]
```

---

#### GET /groups
Получить группы пользователя.

---

#### POST /groups
Создать группу.

**Запрос:**
```json
{
  "name": "Коран за месяц",
  "goal_id": "goal_123"
}
```

---

#### POST /groups/{id}/join
Присоединиться к группе.

**Запрос:**
```json
{
  "invite_code": "GRP-ABC123"
}
```

---

#### GET /analytics/report
Получить AI-отчёт.

**Query параметры:**
- `type` — тип отчёта (`weekly`, `monthly`, `custom`)

---

#### POST /qaza/calculate
Рассчитать каза.

---

## 4. Smart Tasbih API (Supabase)

### Базовый URL
```
https://<supabase-project>.supabase.co/functions/v1/smart-tasbih-api
```

### Эндпоинты

#### GET /bootstrap
Инициализация состояния.

**Ответ:**
```json
{
  "user": {
    "id": "telegram_123",
    "locale": "ru",
    "madhab": "hanafi",
    "tz": "Europe/Moscow"
  },
  "active_goal": null,
  "daily_azkar": {
    "fajr": 0,
    "dhuhr": 0,
    "asr": 0,
    "maghrib": 0,
    "isha": 0,
    "total": 0,
    "is_complete": false
  },
  "recent_items": []
}
```

---

#### POST /goals
Создать/обновить цель тасбиха.

**Запрос:**
```json
{
  "category": "tasbih",
  "item_id": "subhanallah",
  "goal_type": "recite",
  "target_count": 33,
  "prayer_segment": "fajr"
}
```

---

#### POST /sessions/start
Начать сессию тасбиха.

**Запрос:**
```json
{
  "goal_id": "goal_123",
  "category": "tasbih",
  "item_id": "subhanallah",
  "prayer_segment": "fajr"
}
```

---

#### POST /counter/tap
Фиксация действия (нажатие).

**Запрос:**
```json
{
  "session_id": "session_123",
  "delta": 1,
  "event_type": "tap",
  "offline_id": "offline_456",
  "prayer_segment": "fajr"
}
```

**Ответ:**
```json
{
  "value_after": 15,
  "goal_progress": {
    "goal_id": "goal_123",
    "progress": 15,
    "is_completed": false
  },
  "daily_azkar": {
    "fajr": 15,
    "total": 15
  }
}
```

---

#### POST /learn/mark
Отметить как выученное.

**Запрос:**
```json
{
  "goal_id": "goal_123"
}
```

---

#### GET /reports/daily
Ежедневный отчёт.

**Query параметры:**
- `date` — дата в формате `YYYY-MM-DD`

---

#### POST /sync/offline
Синхронизация офлайн-событий.

**Запрос:**
```json
{
  "events": [
    {
      "id": "event_1",
      "type": "tap",
      "data": {
        "session_id": "session_123",
        "delta": 1
      },
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

## 5. Коды ошибок

### HTTP статусы

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс создан |
| 202 | Запрос принят (асинхронная обработка) |
| 400 | Неверный запрос (отсутствуют обязательные поля) |
| 401 | Не авторизован (отсутствует/неверный токен) |
| 403 | Доступ запрещён |
| 404 | Ресурс не найден |
| 500 | Внутренняя ошибка сервера |

### Формат ошибки

```json
{
  "error": "Описание ошибки",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 6. Переменные окружения

```env
# e-Replika API
VITE_API_BASE_URL=https://bot.e-replika.ru/api
VITE_API_TOKEN=your_token_here
VITE_E_REPLIKA_API_KEY=your_api_key_here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Опциональные
VITE_USE_SUPABASE_PROXY=false
VITE_INTERNAL_API_URL=/api
```

---

## 7. Таймауты и лимиты

- **Timeout запросов**: 30 секунд
- **Максимальный размер запроса**: 1 MB
- **Rate limit**: 100 запросов в минуту
- **Размер batch синхронизации**: до 100 событий

---

## 8. Telegram Mini App интеграция

```typescript
// Получение initData для авторизации
const initData = window.Telegram?.WebApp?.initData;

// Получение user_id
const user = JSON.parse(decodeURIComponent(
  new URLSearchParams(initData).get("user") || "{}"
));
const userId = user.id?.toString();
```

---

## 9. Offline поддержка

Frontend поддерживает офлайн-режим:

1. События сохраняются в IndexedDB
2. При восстановлении соединения вызывается `/sync/offline`
3. Дубликаты фильтруются по `offline_id`

```typescript
// Добавление офлайн-события
import { addOfflineEvent } from "@/lib/offline-queue";

const offlineId = await addOfflineEvent("tap", {
  session_id: "...",
  delta: 1
});
```

