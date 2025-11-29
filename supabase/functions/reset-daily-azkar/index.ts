// Edge function для ежедневного сброса азкаров
// Должна вызываться через cron job каждый день в 00:00 по UTC
// Или через pg_cron на уровне базы данных

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Создаем клиент Supabase с service role key для обхода RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Получаем текущую дату в UTC
    const today = new Date();
    const todayUTC = today.toISOString().split("T")[0];

    // Получаем всех пользователей с их часовыми поясами
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, tz");

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found", reset_count: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let resetCount = 0;
    const errors: string[] = [];

    // Для каждого пользователя проверяем, нужно ли сбросить азкары
    for (const user of users) {
      try {
        const userTz = user.tz || "UTC";
        
        // Получаем текущее время в часовом поясе пользователя
        // Используем простую логику: если сейчас 00:00-01:00 в UTC, 
        // проверяем для каждого пользователя его локальное время
        // В реальности лучше использовать библиотеку для работы с часовыми поясами
        
        // Для упрощения: сбрасываем для всех пользователей, у которых date_local < today
        // В production лучше использовать более точную логику с учетом часовых поясов
        
        // Получаем все записи daily_azkar для пользователя, которые не сегодняшние
        const { data: oldAzkar, error: oldError } = await supabase
          .from("daily_azkar")
          .select("date_local")
          .eq("user_id", user.id)
          .lt("date_local", todayUTC);

        if (oldError) {
          errors.push(`Error fetching old azkar for user ${user.id}: ${oldError.message}`);
          continue;
        }

        // Проверяем, есть ли запись на сегодня
        const { data: todayAzkar } = await supabase
          .from("daily_azkar")
          .select("id")
          .eq("user_id", user.id)
          .eq("date_local", todayUTC)
          .single();

        // Если записи на сегодня нет, создаем новую
        if (!todayAzkar) {
          const { error: insertError } = await supabase
            .from("daily_azkar")
            .insert({
              user_id: user.id,
              date_local: todayUTC,
              fajr: 0,
              dhuhr: 0,
              asr: 0,
              maghrib: 0,
              isha: 0,
              total: 0,
              is_complete: false,
            });

          if (insertError) {
            errors.push(`Error creating new azkar for user ${user.id}: ${insertError.message}`);
          } else {
            resetCount++;
          }
        }

        // Логируем событие сброса в dhikr_log
        if (!todayAzkar) {
          await supabase.from("dhikr_log").insert({
            user_id: user.id,
            event_type: "auto_reset",
            delta: 0,
            value_after: 0,
            prayer_segment: "none",
            category: "azkar",
            at_ts: new Date().toISOString(),
            tz: userTz,
            suspected: false,
          });
        }
      } catch (error) {
        errors.push(`Error processing user ${user.id}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Daily azkar reset completed",
        date: todayUTC,
        reset_count: resetCount,
        total_users: users.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in reset-daily-azkar:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

