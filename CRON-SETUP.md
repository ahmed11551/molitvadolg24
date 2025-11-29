# Инструкция по настройке ежедневного сброса азкаров

## Вариант 1: Использование pg_cron (рекомендуется)

Если у вас есть доступ к pg_cron в Supabase:

```sql
-- Установите расширение pg_cron (если еще не установлено)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Настройте задачу для ежедневного сброса в полночь UTC
SELECT cron.schedule(
  'reset-daily-azkar',
  '0 0 * * *', -- каждый день в полночь UTC
  $$SELECT reset_daily_azkar()$$
);
```

## Вариант 2: Использование Edge Function через внешний cron сервис

### Настройка через GitHub Actions (бесплатно)

Создайте файл `.github/workflows/reset-azkar.yml`:

```yaml
name: Reset Daily Azkar

on:
  schedule:
    - cron: '0 0 * * *' # Каждый день в полночь UTC
  workflow_dispatch: # Позволяет запускать вручную

jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reset Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            https://YOUR_PROJECT.supabase.co/functions/v1/reset-daily-azkar
```

### Настройка через Vercel Cron (если используете Vercel)

Создайте файл `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reset-azkar",
      "schedule": "0 0 * * *"
    }
  ]
}
```

И создайте API route `api/cron/reset-azkar.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const response = await fetch(
    `${process.env.SUPABASE_FUNCTIONS_URL}/reset-daily-azkar`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'apikey': process.env.SUPABASE_ANON_KEY || '',
      },
    }
  );

  const data = await response.json();
  return res.status(response.status).json(data);
}
```

### Настройка через другие сервисы

Можно использовать любой cron сервис:
- **Cron-job.org** (бесплатно)
- **EasyCron** (бесплатно до 100 запросов/месяц)
- **AWS EventBridge** (если используете AWS)
- **Google Cloud Scheduler** (если используете GCP)

Просто настройте POST запрос на:
```
https://YOUR_PROJECT.supabase.co/functions/v1/reset-daily-azkar
```

С заголовками:
```
Authorization: Bearer YOUR_ANON_KEY
apikey: YOUR_ANON_KEY
```

## Проверка работы

После настройки можно проверить работу функции вручную:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  https://YOUR_PROJECT.supabase.co/functions/v1/reset-daily-azkar
```

Или через SQL:

```sql
SELECT reset_daily_azkar();
```

## Примечания

- Функция создает записи `daily_azkar` для всех пользователей, у которых еще нет записи на сегодня
- События сброса логируются в `dhikr_log` с типом `auto_reset`
- Функция учитывает часовые пояса пользователей (хотя сброс происходит в полночь UTC, для каждого пользователя создается запись на текущую дату)

