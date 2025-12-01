-- Функция для ежедневного сброса азкаров
-- Можно использовать с pg_cron для автоматического запуска

-- Создаем функцию для сброса азкаров
CREATE OR REPLACE FUNCTION reset_daily_azkar()
RETURNS TABLE(reset_count INTEGER, errors TEXT[])
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
  today_date TEXT;
  reset_count INTEGER := 0;
  error_list TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Получаем текущую дату в UTC
  today_date := CURRENT_DATE::TEXT;

  -- Проходим по всем пользователям
  FOR user_record IN 
    SELECT id, tz FROM users
  LOOP
    BEGIN
      -- Проверяем, есть ли запись на сегодня
      IF NOT EXISTS (
        SELECT 1 FROM daily_azkar 
        WHERE user_id = user_record.id 
        AND date_local = today_date
      ) THEN
        -- Создаем новую запись на сегодня
        INSERT INTO daily_azkar (
          user_id,
          date_local,
          fajr,
          dhuhr,
          asr,
          maghrib,
          isha,
          total,
          is_complete
        ) VALUES (
          user_record.id,
          today_date,
          0,
          0,
          0,
          0,
          0,
          0,
          false
        );

        -- Логируем событие сброса
        INSERT INTO dhikr_log (
          user_id,
          event_type,
          delta,
          value_after,
          prayer_segment,
          category,
          at_ts,
          tz,
          suspected
        ) VALUES (
          user_record.id,
          'auto_reset',
          0,
          0,
          'none',
          'azkar',
          NOW(),
          COALESCE(user_record.tz, 'UTC'),
          false
        );

        reset_count := reset_count + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      error_list := array_append(error_list, 
        format('User %s: %s', user_record.id, SQLERRM));
    END;
  END LOOP;

  RETURN QUERY SELECT reset_count, error_list;
END;
$$;

-- Комментарий: для автоматического запуска через pg_cron используйте:
-- SELECT cron.schedule(
--   'reset-daily-azkar',
--   '0 0 * * *', -- каждый день в полночь UTC
--   $$SELECT reset_daily_azkar()$$
-- );

