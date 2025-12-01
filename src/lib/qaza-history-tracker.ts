// Трекер истории прогресса каза для интерактивной статистики

export interface QazaHistoryEntry {
  date: string; // YYYY-MM-DD
  completed: number;
  total: number;
  prayers: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
    witr: number;
  };
}

const HISTORY_KEY = "qaza_progress_history";
const MAX_HISTORY_DAYS = 365; // Храним историю за год

/**
 * Добавляет запись в историю прогресса
 */
export function addHistoryEntry(
  date: Date,
  completed: number,
  total: number,
  prayers: QazaHistoryEntry["prayers"]
): void {
  try {
    const history = getHistory();
    const dateKey = formatDate(date);
    
    // Обновляем или добавляем запись
    const existingIndex = history.findIndex((e) => e.date === dateKey);
    const entry: QazaHistoryEntry = {
      date: dateKey,
      completed,
      total,
      prayers,
    };

    if (existingIndex >= 0) {
      history[existingIndex] = entry;
    } else {
      history.push(entry);
    }

    // Сортируем по дате
    history.sort((a, b) => a.date.localeCompare(b.date));

    // Удаляем старые записи (старше MAX_HISTORY_DAYS)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
    const cutoffKey = formatDate(cutoffDate);
    const filtered = history.filter((e) => e.date >= cutoffKey);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error adding history entry:", error);
  }
}

/**
 * Получает всю историю
 */
export function getHistory(): QazaHistoryEntry[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading history:", error);
    return [];
  }
}

/**
 * Получает историю за период
 */
export function getHistoryForPeriod(startDate: Date, endDate: Date): QazaHistoryEntry[] {
  const history = getHistory();
  const startKey = formatDate(startDate);
  const endKey = formatDate(endDate);
  
  return history.filter((e) => e.date >= startKey && e.date <= endKey);
}

/**
 * Обновляет историю на основе текущего прогресса пользователя
 */
export function updateHistoryFromProgress(
  completedPrayers: Record<string, number>,
  totalMissed: Record<string, number>
): void {
  const today = new Date();
  const dateKey = formatDate(today);

  const totalCompleted = Object.values(completedPrayers).reduce((sum, val) => sum + (val || 0), 0);
  const total = Object.values(totalMissed).reduce((sum, val) => sum + (val || 0), 0);

  addHistoryEntry(
    today,
    totalCompleted,
    total,
    {
      fajr: completedPrayers.fajr || 0,
      dhuhr: completedPrayers.dhuhr || 0,
      asr: completedPrayers.asr || 0,
      maghrib: completedPrayers.maghrib || 0,
      isha: completedPrayers.isha || 0,
      witr: completedPrayers.witr || 0,
    }
  );
}

/**
 * Форматирует дату в YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Очищает историю
 */
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

