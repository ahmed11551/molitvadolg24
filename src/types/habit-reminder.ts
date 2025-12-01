// Типы для напоминаний о привычках (как в iPhone Reminders)

export type ReminderRepeat = 
  | "never" // Никогда
  | "daily" // Ежедневно
  | "weekly" // Еженедельно
  | "monthly" // Ежемесячно
  | "custom"; // Произвольное

export type ReminderDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = воскресенье, 6 = суббота

export interface HabitReminder {
  id: string;
  user_id: string;
  habit_id: string; // ID из каталога привычек
  title: string;
  description?: string;
  icon: string;
  color: string;
  
  // Настройки времени
  time: string; // "HH:mm" формат
  enabled: boolean;
  
  // Повторение
  repeat: ReminderRepeat;
  repeat_days?: ReminderDayOfWeek[]; // Для еженедельного повторения
  repeat_interval?: number; // Для произвольного (каждые N дней)
  
  // Дополнительные настройки
  sound?: string; // Звук уведомления
  vibration?: boolean; // Вибрация
  badge?: boolean; // Показывать бейдж
  
  // Даты
  start_date?: Date; // Дата начала (для одноразовых)
  end_date?: Date; // Дата окончания (опционально)
  
  // Метаданные
  created_at: Date;
  updated_at: Date;
  last_triggered?: Date; // Когда последний раз сработало
  next_trigger?: Date; // Когда сработает в следующий раз
}

export interface ReminderNotification {
  id: string;
  reminder_id: string;
  title: string;
  body: string;
  scheduled_for: Date;
  sent_at?: Date;
  status: "pending" | "sent" | "cancelled";
}

