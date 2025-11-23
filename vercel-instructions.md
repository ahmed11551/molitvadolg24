# Инструкция по подключению проекта к Vercel

## Проблема
Проект на Vercel выдает 404, потому что он не подключен к репозиторию GitHub.

## Решение

### Вариант 1: Через веб-интерфейс Vercel

1. Перейдите на https://vercel.com/dashboard
2. Откройте проект `molitvadolg24`
3. Перейдите в **Settings** → **Git**
4. Нажмите **Connect Git Repository**
5. Выберите репозиторий: `ahmed11551/molitvadolg24`
6. Настройте:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (или оставьте пустым)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
7. Нажмите **Deploy**

### Вариант 2: Через Vercel CLI

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# Войдите в аккаунт
vercel login

# Подключите проект к репозиторию
vercel link

# Выберите:
# - Project: molitvadolg24
# - Link to existing project: Yes
# - Repository: ahmed11551/molitvadolg24

# Деплой
vercel --prod
```

### Вариант 3: Создать новый проект

Если проект не существует или нужно пересоздать:

1. Перейдите на https://vercel.com/new
2. Импортируйте репозиторий `ahmed11551/molitvadolg24`
3. Настройте:
   - **Project Name**: `molitvadolg24`
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Добавьте переменные окружения (если нужны):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_TOKEN`
5. Нажмите **Deploy**

## Проверка конфигурации

Убедитесь, что в репозитории есть:
- ✅ `vercel.json` - конфигурация Vercel
- ✅ `package.json` - зависимости и скрипты
- ✅ `.vercelrc` - ID проекта (опционально)

## После подключения

После успешного подключения:
1. Vercel автоматически будет деплоить при каждом push в `main`
2. Проверьте URL проекта в настройках Vercel
3. Убедитесь, что домен правильно настроен

