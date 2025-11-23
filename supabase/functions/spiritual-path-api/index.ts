// Edge Function для API эндпоинтов модуля "Мой Духовный Путь"
// Обрабатывает: CRUD для целей, бейджей, streaks, групп, AI-отчетов

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/spiritual-path-api", "");
    const method = req.method;

    // Получаем переменные окружения
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Создаем клиент Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Получаем user_id из заголовков или тела запроса
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // Для Telegram Mini App можно использовать initData
      // Пока используем токен напрямую как user_id (для демо)
      userId = token;
    }

    // Если нет токена, пытаемся получить из тела запроса
    if (!userId) {
      try {
        const body = await req.json();
        userId = body.user_id || null;
      } catch {
        // Если не JSON, продолжаем
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Роутинг для целей
    if (path === "/goals" && method === "GET") {
      return await handleGetGoals(req, supabase, userId);
    } else if (path === "/goals" && method === "POST") {
      return await handleCreateGoal(req, supabase, userId);
    } else if (path.startsWith("/goals/") && method === "PUT") {
      const goalId = path.replace("/goals/", "");
      return await handleUpdateGoal(req, supabase, userId, goalId);
    } else if (path.startsWith("/goals/") && method === "DELETE") {
      const goalId = path.replace("/goals/", "");
      return await handleDeleteGoal(req, supabase, userId, goalId);
    }
    // Роутинг для прогресса
    else if (path === "/counter/sync" && method === "POST") {
      return await handleCounterSync(req, supabase, userId);
    } else if (path.startsWith("/goals/") && path.endsWith("/progress") && method === "POST") {
      const goalId = path.replace("/goals/", "").replace("/progress", "");
      return await handleAddProgress(req, supabase, userId, goalId);
    }
    // Роутинг для бейджей
    else if (path === "/badges" && method === "GET") {
      return await handleGetBadges(req, supabase, userId);
    }
    // Роутинг для streaks
    else if (path === "/streaks" && method === "GET") {
      return await handleGetStreaks(req, supabase, userId);
    }
    // Роутинг для групп
    else if (path === "/groups" && method === "GET") {
      return await handleGetGroups(req, supabase, userId);
    } else if (path === "/groups" && method === "POST") {
      return await handleCreateGroup(req, supabase, userId);
    } else if (path.startsWith("/groups/") && path.endsWith("/join") && method === "POST") {
      const groupId = path.replace("/groups/", "").replace("/join", "");
      return await handleJoinGroup(req, supabase, userId, groupId);
    }
    // Роутинг для AI-отчетов
    else if (path === "/analytics/report" && method === "GET") {
      return await handleGetAIReport(req, supabase, userId);
    }
    // Роутинг для калькулятора каза
    else if (path === "/qaza/calculate" && method === "POST") {
      return await handleCalculateQaza(req, supabase, userId);
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// GET /goals - Получить список целей
async function handleGetGoals(
  req: Request,
  supabase: any,
  userId: string
) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "active";

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /goals - Создать цель
async function handleCreateGoal(
  req: Request,
  supabase: any,
  userId: string
) {
  const body = await req.json();
  
  // Расчет рекомендуемого ежедневного плана
  let dailyPlan: number | null = null;
  if (body.start_date && body.end_date && body.target_value) {
    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    const daysRemaining = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining > 0) {
      dailyPlan = (body.target_value - (body.current_value || 0)) / daysRemaining;
    }
  }

  const goalData = {
    user_id: userId,
    title: body.title,
    description: body.description,
    category: body.category,
    knowledge_subcategory: body.knowledge_subcategory,
    type: body.type,
    period: body.period,
    metric: body.metric,
    target_value: body.target_value,
    current_value: body.current_value || 0,
    start_date: body.start_date,
    end_date: body.end_date,
    linked_counter_type: body.linked_counter_type,
    status: body.status || "active",
    daily_plan: dailyPlan,
    group_id: body.group_id,
    is_group_goal: body.is_group_goal || false,
  };

  const { data, error } = await supabase
    .from("goals")
    .insert(goalData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// PUT /goals/{id} - Обновить цель
async function handleUpdateGoal(
  req: Request,
  supabase: any,
  userId: string,
  goalId: string
) {
  const body = await req.json();

  // Проверяем, что цель принадлежит пользователю
  const { data: existingGoal, error: checkError } = await supabase
    .from("goals")
    .select("user_id")
    .eq("id", goalId)
    .single();

  if (checkError || !existingGoal || existingGoal.user_id !== userId) {
    return new Response(
      JSON.stringify({ error: "Goal not found or access denied" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Пересчитываем daily_plan при изменении дат или целевого значения
  let dailyPlan = body.daily_plan;
  if ((body.start_date || body.end_date || body.target_value) && !dailyPlan) {
    const start = new Date(body.start_date || existingGoal.start_date);
    const end = new Date(body.end_date || existingGoal.end_date);
    const daysRemaining = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining > 0) {
      dailyPlan = (body.target_value || existingGoal.target_value - existingGoal.current_value) / daysRemaining;
    }
  }

  const updateData: any = { ...body };
  if (dailyPlan !== undefined) {
    updateData.daily_plan = dailyPlan;
  }

  const { data, error } = await supabase
    .from("goals")
    .update(updateData)
    .eq("id", goalId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// DELETE /goals/{id} - Удалить цель
async function handleDeleteGoal(
  req: Request,
  supabase: any,
  userId: string,
  goalId: string
) {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /counter/sync - Синхронизация данных тасбиха с целями
async function handleCounterSync(
  req: Request,
  supabase: any,
  userId: string
) {
  const body = await req.json();
  const { counter_type, value, date } = body;

  // Находим все активные цели, связанные с этим типом счетчика
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("linked_counter_type", counter_type);

  if (goalsError) {
    throw goalsError;
  }

  const progressUpdates = [];
  const today = date || new Date().toISOString().split("T")[0];

  for (const goal of goals || []) {
    // Добавляем прогресс для цели
    const { data: existingProgress, error: progressCheckError } = await supabase
      .from("goal_progress")
      .select("*")
      .eq("goal_id", goal.id)
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (progressCheckError && progressCheckError.code !== "PGRST116") {
      // PGRST116 = not found, это нормально
      console.error("Error checking progress:", progressCheckError);
      continue;
    }

    const newValue = (existingProgress?.value || 0) + value;

    if (existingProgress) {
      // Обновляем существующий прогресс
      const { error: updateError } = await supabase
        .from("goal_progress")
        .update({ value: newValue })
        .eq("id", existingProgress.id);

      if (updateError) {
        console.error("Error updating progress:", updateError);
      } else {
        progressUpdates.push({ goal_id: goal.id, value: newValue });
      }
    } else {
      // Создаем новый прогресс
      const { error: insertError } = await supabase
        .from("goal_progress")
        .insert({
          goal_id: goal.id,
          user_id: userId,
          date: today,
          value: value,
        });

      if (insertError) {
        console.error("Error inserting progress:", insertError);
      } else {
        progressUpdates.push({ goal_id: goal.id, value: value });
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, updated_goals: progressUpdates }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// POST /goals/{id}/progress - Добавить прогресс вручную
async function handleAddProgress(
  req: Request,
  supabase: any,
  userId: string,
  goalId: string
) {
  const body = await req.json();
  const { value, date, notes } = body;

  const progressDate = date || new Date().toISOString().split("T")[0];

  // Проверяем, что цель принадлежит пользователю
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("user_id")
    .eq("id", goalId)
    .single();

  if (goalError || !goal || goal.user_id !== userId) {
    return new Response(
      JSON.stringify({ error: "Goal not found or access denied" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Проверяем существующий прогресс
  const { data: existingProgress, error: checkError } = await supabase
    .from("goal_progress")
    .select("*")
    .eq("goal_id", goalId)
    .eq("user_id", userId)
    .eq("date", progressDate)
    .single();

  let result;
  if (existingProgress) {
    // Обновляем
    const { data, error } = await supabase
      .from("goal_progress")
      .update({
        value: (existingProgress.value || 0) + value,
        notes: notes || existingProgress.notes,
      })
      .eq("id", existingProgress.id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    // Создаем новый
    const { data, error } = await supabase
      .from("goal_progress")
      .insert({
        goal_id: goalId,
        user_id: userId,
        date: progressDate,
        value: value,
        notes: notes,
      })
      .select()
      .single();

    if (error) throw error;
    result = data;
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// GET /badges - Получить бейджи пользователя
async function handleGetBadges(
  req: Request,
  supabase: any,
  userId: string
) {
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false });

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// GET /streaks - Получить streaks пользователя
async function handleGetStreaks(
  req: Request,
  supabase: any,
  userId: string
) {
  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .order("current_streak", { ascending: false });

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// GET /groups - Получить группы пользователя
async function handleGetGroups(
  req: Request,
  supabase: any,
  userId: string
) {
  const { data, error } = await supabase
    .from("goal_group_members")
    .select(`
      *,
      goal_groups (
        *,
        goals (*)
      )
    `)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /groups - Создать группу
async function handleCreateGroup(
  req: Request,
  supabase: any,
  userId: string
) {
  const body = await req.json();
  const { name, goal_id } = body;

  // Генерируем уникальный код приглашения
  const inviteCode = `GRP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const { data, error } = await supabase
    .from("goal_groups")
    .insert({
      name,
      goal_id,
      created_by: userId,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Добавляем создателя в участники
  await supabase.from("goal_group_members").insert({
    group_id: data.id,
    user_id: userId,
    progress_contribution: 0,
  });

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /groups/{id}/join - Присоединиться к группе
async function handleJoinGroup(
  req: Request,
  supabase: any,
  userId: string,
  groupId: string
) {
  const body = await req.json();
  const inviteCode = body.invite_code || groupId;

  // Находим группу по invite_code или id
  const { data: group, error: groupError } = await supabase
    .from("goal_groups")
    .select("*")
    .or(`id.eq.${groupId},invite_code.eq.${inviteCode}`)
    .single();

  if (groupError || !group) {
    return new Response(
      JSON.stringify({ error: "Group not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Проверяем, не является ли пользователь уже участником
  const { data: existingMember } = await supabase
    .from("goal_group_members")
    .select("*")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .single();

  if (existingMember) {
    return new Response(
      JSON.stringify({ error: "Already a member" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Добавляем пользователя в группу
  const { data, error } = await supabase
    .from("goal_group_members")
    .insert({
      group_id: group.id,
      user_id: userId,
      progress_contribution: 0,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify({ success: true, group, member: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// GET /analytics/report - Получить AI-отчет
async function handleGetAIReport(
  req: Request,
  supabase: any,
  userId: string
) {
  const url = new URL(req.url);
  const reportType = url.searchParams.get("type") || "weekly";

  // Здесь должна быть логика генерации AI-отчета
  // Пока возвращаем базовый отчет
  const insights = [
    {
      type: "achievement",
      title: "Отличный прогресс!",
      description: "Вы выполнили 80% ваших целей на этой неделе",
    },
  ];

  const report = {
    id: `report_${Date.now()}`,
    user_id: userId,
    report_type: reportType,
    period_start: new Date(),
    period_end: new Date(),
    insights,
    generated_at: new Date(),
  };

  return new Response(JSON.stringify(report), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /qaza/calculate - Рассчитать каза
async function handleCalculateQaza(
  req: Request,
  supabase: any,
  userId: string
) {
  const body = await req.json();
  const { mode, manual_count, gender, birth_date, prayer_start_date, travel_periods } = body;

  // Здесь должна быть логика расчета каза
  // Пока возвращаем базовую структуру
  const result = {
    mode,
    total_debt: manual_count || 0,
    debt_map: {},
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}


