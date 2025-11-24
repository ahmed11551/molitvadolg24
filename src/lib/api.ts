// API сервис для интеграции с e-Replika API и внутренними эндпоинтами
// Документация: https://bot.e-replika.ru/docs#/

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://bot.e-replika.ru/api";
const INTERNAL_API_URL = import.meta.env.VITE_INTERNAL_API_URL || "/api";

// Supabase конфигурация
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fvxkywczuqincnjilgzd.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54";
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Получение токена авторизации из Telegram или env
function getAuthToken(): string | null {
  // В Telegram Mini App можно использовать initData для авторизации
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData;
  }
  // Используем test_token_123 по умолчанию для e-Replika API
  return import.meta.env.VITE_API_TOKEN || "test_token_123";
}

// Получение заголовков для запросов к e-Replika API
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // Добавляем API ключ, если он указан в env
  const apiKey = import.meta.env.VITE_E_REPLIKA_API_KEY;
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }
  
  return headers;
}

// Получение заголовков для Supabase
function getSupabaseHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "apikey": SUPABASE_ANON_KEY,
  };
}

// Получение user_id
function getUserId(): string | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    const initData = window.Telegram.WebApp.initData;
    if (initData) {
      // Парсим initData для получения user_id
      const params = new URLSearchParams(initData);
      const userStr = params.get("user");
      if (userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          return user.id?.toString() || null;
        } catch {
          // Если не удалось распарсить, используем initData как есть
          return initData;
        }
      }
    }
  }
  // Fallback на localStorage или env
  const stored = localStorage.getItem("telegram_user_id");
  return stored || null;
}

// Получение Telegram user_id
function getTelegramUserId(): string | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    const initData = window.Telegram.WebApp.initData;
    if (initData) {
      const params = new URLSearchParams(initData);
      const userStr = params.get("user");
      if (userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          return user.id?.toString() || null;
        } catch {
          return null;
        }
      }
    }
  }
  return localStorage.getItem("telegram_user_id");
}

import type {
  CalculationRequest,
  DebtSnapshot,
  ProgressUpdateRequest,
  RepaymentProgress,
  Term,
  UserPrayerDebt,
} from "@/types/prayer-debt";

// e-Replika API интеграция
export const eReplikaAPI = {
  // Получить термины из словарика
  // Эндпоинт согласно документации e-Replika API
  async getTerms(): Promise<Term[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/terms`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        // Если 404 или другой ошибка, возвращаем дефолтные термины
        if (response.status === 404) {
          console.warn("Terms endpoint not found, using default terms");
          return getDefaultTerms();
        }
        throw new Error(`Failed to fetch terms: ${response.statusText}`);
      }

      const data = await response.json();
      // Проверяем формат ответа
      if (Array.isArray(data)) {
        return data;
      }
      // Если ответ в другом формате, пытаемся извлечь массив
      if (data.terms && Array.isArray(data.terms)) {
        return data.terms;
      }
      // Если формат неизвестен, возвращаем дефолтные термины
      console.warn("Unexpected response format, using default terms");
      return getDefaultTerms();
    } catch (error) {
      console.error("Error fetching terms:", error);
      // Возвращаем базовый набор терминов, если API недоступен
      return getDefaultTerms();
    }
  },

  // Конвертация даты в хиджру через e-Replika API
  // Эндпоинт согласно документации e-Replika API
  async convertToHijri(gregorianDate: Date): Promise<{ year: number; month: number; day: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/calendar/convert-to-hijri`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          date: gregorianDate.toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        // Если API недоступен, пробрасываем ошибку для fallback
        throw new Error(`Failed to convert date: ${response.statusText}`);
      }

      const data = await response.json();
      // Поддерживаем разные форматы ответа
      if (data.year && data.month && data.day) {
        return { year: data.year, month: data.month, day: data.day };
      }
      if (data.hijri) {
        return { year: data.hijri.year, month: data.hijri.month, day: data.hijri.day };
      }
      throw new Error("Unexpected response format from convert-to-hijri");
    } catch (error) {
      console.error("Error converting to Hijri:", error);
      // Fallback на упрощенную конвертацию будет обработан в prayer-calculator
      throw error;
    }
  },

  // Конвертация даты из хиджры в григорианский календарь
  async convertFromHijri(hijriDate: { year: number; month: number; day: number }): Promise<Date> {
    try {
      const response = await fetch(`${API_BASE_URL}/calendar/convert-from-hijri`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(hijriDate),
      });

      if (!response.ok) {
        throw new Error(`Failed to convert date: ${response.statusText}`);
      }

      const data = await response.json();
      // Поддерживаем разные форматы ответа
      if (data.date) {
        return new Date(data.date);
      }
      if (data.gregorian) {
        return new Date(data.gregorian);
      }
      throw new Error("Unexpected response format from convert-from-hijri");
    } catch (error) {
      console.error("Error converting from Hijri:", error);
      throw error;
    }
  },

  // Получить аудио URL для дуа
  // Эндпоинт согласно документации e-Replika API
  async getDuaAudio(duaId: string): Promise<string | null> {
    try {
      // Локальные ID (например, "sleep-1", "kalima-1") могут не совпадать с ID в API
      // API может использовать числовые ID или другие форматы
      // Пробуем несколько вариантов ID
      const possibleIds = [
        duaId, // Оригинальный ID
        duaId.replace(/^[a-z]+-/, ""), // Убираем префикс (например, "sleep-1" -> "1")
        duaId.split("-").pop() || duaId, // Последняя часть после дефиса
      ].filter((id, index, arr) => arr.indexOf(id) === index); // Убираем дубликаты

      // Пробуем разные варианты эндпоинтов для каждого возможного ID
      const endpoints: string[] = [];
      for (const id of possibleIds) {
        endpoints.push(
          `${API_BASE_URL}/duas/${id}/audio`,
          `${API_BASE_URL}/audio/dua/${id}`,
          `${API_BASE_URL}/dua/${id}/audio`,
        );
      }

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "GET",
            headers: getAuthHeaders(),
          });

          if (response.ok) {
            const contentType = response.headers.get("content-type");
            
            // Если это прямой аудио файл
            if (contentType && (contentType.includes("audio/") || contentType.includes("application/octet-stream"))) {
              // Возвращаем URL эндпоинта как прямой URL к аудио
              console.log(`Audio found at: ${endpoint}`);
              return endpoint;
            }

            // Если это JSON ответ
            const data = await response.json();
            if (data.audio_url || data.url) {
              console.log(`Audio URL from API: ${data.audio_url || data.url}`);
              return data.audio_url || data.url;
            }
            if (typeof data === "string" && data.startsWith("http")) {
              console.log(`Audio URL (string): ${data}`);
              return data;
            }
          } else if (response.status === 404) {
            // Пробуем следующий эндпоинт
            continue;
          } else if (response.status === 401 || response.status === 403) {
            console.warn(`Authentication error for dua ${duaId}: ${response.status}`);
            // Пробуем следующий эндпоинт
            continue;
          }
        } catch (err) {
          // Пробуем следующий эндпоинт
          console.debug(`Endpoint ${endpoint} failed:`, err);
          continue;
        }
      }

      // Если все эндпоинты не сработали
      console.warn(`Audio not found for dua ${duaId} - trying all endpoints failed. This is normal if the dua is not in the e-Replika API database. TTS will be used as fallback.`);
      return null;
    } catch (error) {
      console.error(`Error fetching audio for dua ${duaId}:`, error);
      return null;
    }
  },

  // Получить список всех дуа с полными данными
  async getDuas(): Promise<Array<{
    id: string;
    arabic: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    reference?: string;
    audioUrl: string | null;
    category?: string;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/duas`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Duas endpoint not found");
          return [];
        }
        throw new Error(`Failed to fetch duas: ${response.statusText}`);
      }

      const data = await response.json();
      // Поддерживаем разные форматы ответа
      let duas: any[] = [];
      if (Array.isArray(data)) {
        duas = data;
      } else if (data.duas && Array.isArray(data.duas)) {
        duas = data.duas;
      } else if (data.data && Array.isArray(data.data)) {
        duas = data.data;
      }

      return duas.map((dua: any) => ({
        id: dua.id || dua.dua_id || dua._id,
        arabic: dua.arabic || dua.text_arabic || dua.arabic_text || "",
        transcription: dua.transcription || dua.translit || dua.latin_transcription || "",
        russianTranscription: dua.russian_transcription || dua.russianTranscription || dua.cyrillic_transcription || "",
        translation: dua.translation || dua.meaning || dua.text || "",
        reference: dua.reference || dua.source || "",
        audioUrl: dua.audio_url || dua.audioUrl || dua.audio || null,
        category: dua.category || dua.category_id || "",
      }));
    } catch (error) {
      console.error("Error fetching duas:", error);
      return [];
    }
  },

  // Получить перевод дуа на указанном языке
  async getDuaTranslation(duaId: string, language: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/duas/${duaId}/translation?lang=${language}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch translation: ${response.statusText}`);
      }

      const data = await response.json();
      return data.translation || data.text || data.meaning || null;
    } catch (error) {
      console.error("Error fetching dua translation:", error);
      return null;
    }
  },

  // Получить конкретное дуа по ID
  async getDuaById(duaId: string): Promise<{
    id: string;
    arabic: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    reference?: string;
    audioUrl: string | null;
  } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/duas/${duaId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const dua = await response.json();
      return {
        id: dua.id || dua.dua_id || duaId,
        arabic: dua.arabic || dua.text_arabic || dua.arabic_text || "",
        transcription: dua.transcription || dua.translit || dua.latin_transcription || "",
        russianTranscription: dua.russian_transcription || dua.russianTranscription || dua.cyrillic_transcription || "",
        translation: dua.translation || dua.meaning || dua.text || "",
        reference: dua.reference || dua.source || "",
        audioUrl: dua.audio_url || dua.audioUrl || dua.audio || null,
      };
    } catch (error) {
      console.error("Error fetching dua by id:", error);
      return null;
    }
  },

  // Получить список азкаров/зикров
  async getAdhkar(): Promise<Array<{
    id: string;
    title: string;
    arabic: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    count: number;
    category: string;
    audioUrl: string | null;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/adhkar`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Adhkar endpoint not found");
          return [];
        }
        throw new Error(`Failed to fetch adhkar: ${response.statusText}`);
      }

      const data = await response.json();
      let adhkar: any[] = [];
      if (Array.isArray(data)) {
        adhkar = data;
      } else if (data.adhkar && Array.isArray(data.adhkar)) {
        adhkar = data.adhkar;
      } else if (data.data && Array.isArray(data.data)) {
        adhkar = data.data;
      }

      return adhkar.map((item: any) => ({
        id: item.id || item.adhkar_id || item._id,
        title: item.title || item.name || "",
        arabic: item.arabic || item.text_arabic || item.arabic_text || "",
        transcription: item.transcription || item.translit || item.latin_transcription || "",
        russianTranscription: item.russian_transcription || item.russianTranscription || item.cyrillic_transcription || "",
        translation: item.translation || item.meaning || item.text || "",
        count: item.count || item.recommended_count || 33,
        category: item.category || item.category_id || "",
        audioUrl: item.audio_url || item.audioUrl || item.audio || null,
      }));
    } catch (error) {
      console.error("Error fetching adhkar:", error);
      return [];
    }
  },

  // Получить список салаватов
  async getSalawat(): Promise<Array<{
    id: string;
    arabic: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    reference?: string;
    audioUrl: string | null;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/salawat`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Salawat endpoint not found");
          return [];
        }
        throw new Error(`Failed to fetch salawat: ${response.statusText}`);
      }

      const data = await response.json();
      let salawat: any[] = [];
      if (Array.isArray(data)) {
        salawat = data;
      } else if (data.salawat && Array.isArray(data.salawat)) {
        salawat = data.salawat;
      } else if (data.data && Array.isArray(data.data)) {
        salawat = data.data;
      }

      return salawat.map((item: any) => ({
        id: item.id || item.salawat_id || item._id,
        arabic: item.arabic || item.text_arabic || item.arabic_text || "",
        transcription: item.transcription || item.translit || item.latin_transcription || "",
        russianTranscription: item.russian_transcription || item.russianTranscription || item.cyrillic_transcription || "",
        translation: item.translation || item.meaning || item.text || "",
        reference: item.reference || item.source || "",
        audioUrl: item.audio_url || item.audioUrl || item.audio || null,
      }));
    } catch (error) {
      console.error("Error fetching salawat:", error);
      return [];
    }
  },

  // Получить список калим
  async getKalimas(): Promise<Array<{
    id: string;
    arabic: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    reference?: string;
    audioUrl: string | null;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/kalimas`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Kalimas endpoint not found");
          return [];
        }
        throw new Error(`Failed to fetch kalimas: ${response.statusText}`);
      }

      const data = await response.json();
      let kalimas: any[] = [];
      if (Array.isArray(data)) {
        kalimas = data;
      } else if (data.kalimas && Array.isArray(data.kalimas)) {
        kalimas = data.kalimas;
      } else if (data.data && Array.isArray(data.data)) {
        kalimas = data.data;
      }

      return kalimas.map((item: any) => ({
        id: item.id || item.kalima_id || item._id,
        arabic: item.arabic || item.text_arabic || item.arabic_text || "",
        transcription: item.transcription || item.translit || item.latin_transcription || "",
        russianTranscription: item.russian_transcription || item.russianTranscription || item.cyrillic_transcription || "",
        translation: item.translation || item.meaning || item.text || "",
        reference: item.reference || item.source || "",
        audioUrl: item.audio_url || item.audioUrl || item.audio || null,
      }));
    } catch (error) {
      console.error("Error fetching kalimas:", error);
      return [];
    }
  },

  // Получить список аятов
  async getAyahs(surahNumber?: number, ayahNumber?: number): Promise<Array<{
    id: string;
    surahNumber: number;
    ayahNumber: number;
    arabic: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    audioUrl: string | null;
  }>> {
    try {
      let url = `${API_BASE_URL}/quran/ayahs`;
      if (surahNumber) {
        url += `?surah=${surahNumber}`;
        if (ayahNumber) {
          url += `&ayah=${ayahNumber}`;
        }
      }

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Ayahs endpoint not found");
          return [];
        }
        throw new Error(`Failed to fetch ayahs: ${response.statusText}`);
      }

      const data = await response.json();
      let ayahs: any[] = [];
      if (Array.isArray(data)) {
        ayahs = data;
      } else if (data.ayahs && Array.isArray(data.ayahs)) {
        ayahs = data.ayahs;
      } else if (data.data && Array.isArray(data.data)) {
        ayahs = data.data;
      }

      return ayahs.map((item: any) => ({
        id: item.id || `${item.surah_number || item.surah}_${item.ayah_number || item.ayah}`,
        surahNumber: item.surah_number || item.surah || 0,
        ayahNumber: item.ayah_number || item.ayah || 0,
        arabic: item.arabic || item.text_arabic || item.arabic_text || "",
        transcription: item.transcription || item.translit || item.latin_transcription || "",
        russianTranscription: item.russian_transcription || item.russianTranscription || item.cyrillic_transcription || "",
        translation: item.translation || item.meaning || item.text || "",
        audioUrl: item.audio_url || item.audioUrl || item.audio || null,
      }));
    } catch (error) {
      console.error("Error fetching ayahs:", error);
      return [];
    }
  },

  // Получить список сур
  async getSurahs(): Promise<Array<{
    id: string;
    number: number;
    name: string;
    nameArabic: string;
    nameTransliteration: string;
    ayahsCount: number;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/quran/surahs`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Surahs endpoint not found");
          return [];
        }
        throw new Error(`Failed to fetch surahs: ${response.statusText}`);
      }

      const data = await response.json();
      let surahs: any[] = [];
      if (Array.isArray(data)) {
        surahs = data;
      } else if (data.surahs && Array.isArray(data.surahs)) {
        surahs = data.surahs;
      } else if (data.data && Array.isArray(data.data)) {
        surahs = data.data;
      }

      return surahs.map((item: any) => ({
        id: item.id || `surah_${item.number || item.surah_number}`,
        number: item.number || item.surah_number || 0,
        name: item.name || item.name_english || "",
        nameArabic: item.name_arabic || item.nameArabic || "",
        nameTransliteration: item.name_transliteration || item.nameTransliteration || "",
        ayahsCount: item.ayahs_count || item.total_ayahs || 0,
      }));
    } catch (error) {
      console.error("Error fetching surahs:", error);
      return [];
    }
  },

  // Получить 99 имен Аллаха
  async getNamesOfAllah(): Promise<Array<{
    id: string;
    number: number;
    arabic: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    meaning: string;
    audioUrl: string | null;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/names-of-allah`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        // Пробуем альтернативные эндпоинты
        const altEndpoints = [
          `${API_BASE_URL}/asma-al-husna`,
          `${API_BASE_URL}/99-names`,
          `${API_BASE_URL}/names`,
        ];

        for (const endpoint of altEndpoints) {
          try {
            const altResponse = await fetch(endpoint, {
              method: "GET",
              headers: getAuthHeaders(),
            });
            if (altResponse.ok) {
              const data = await altResponse.json();
              let names: any[] = [];
              if (Array.isArray(data)) {
                names = data;
              } else if (data.names && Array.isArray(data.names)) {
                names = data.names;
              } else if (data.data && Array.isArray(data.data)) {
                names = data.data;
              }

              return names.map((item: any) => ({
                id: item.id || `name_${item.number || item.index}`,
                number: item.number || item.index || 0,
                arabic: item.arabic || item.text_arabic || item.arabic_text || "",
                transcription: item.transcription || item.translit || item.latin_transcription || "",
                russianTranscription: item.russian_transcription || item.russianTranscription || item.cyrillic_transcription || "",
                translation: item.translation || item.name_english || "",
                meaning: item.meaning || item.description || "",
                audioUrl: item.audio_url || item.audioUrl || item.audio || null,
              }));
            }
          } catch {
            continue;
          }
        }

        console.warn("Names of Allah endpoint not found");
        return [];
      }

      const data = await response.json();
      let names: any[] = [];
      if (Array.isArray(data)) {
        names = data;
      } else if (data.names && Array.isArray(data.names)) {
        names = data.names;
      } else if (data.data && Array.isArray(data.data)) {
        names = data.data;
      }

      return names.map((item: any) => ({
        id: item.id || `name_${item.number || item.index}`,
        number: item.number || item.index || 0,
        arabic: item.arabic || item.text_arabic || item.arabic_text || "",
        transcription: item.transcription || item.translit || item.latin_transcription || "",
        russianTranscription: item.russian_transcription || item.russianTranscription || item.cyrillic_transcription || "",
        translation: item.translation || item.name_english || "",
        meaning: item.meaning || item.description || "",
        audioUrl: item.audio_url || item.audioUrl || item.audio || null,
      }));
    } catch (error) {
      console.error("Error fetching names of Allah:", error);
      return [];
    }
  },

  // Генерация PDF отчета через e-Replika API
  // Эндпоинт согласно документации: /reports/pdf
  async generatePDFReport(userId: string, userData?: any): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/pdf`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          user_id: userId,
          ...(userData && { data: userData })
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate PDF: ${response.statusText} - ${errorText}`);
      }

      // Проверяем, что ответ действительно PDF
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/pdf")) {
        return await response.blob();
      }
      
      // Если не PDF, возможно это JSON с ошибкой или URL
      const blob = await response.blob();
      const text = await blob.text();
      try {
        const json = JSON.parse(text);
        if (json.url) {
          // Если API вернул URL, загружаем PDF по этому URL
          const pdfResponse = await fetch(json.url);
          return await pdfResponse.blob();
        }
        throw new Error(json.message || "Unexpected response format");
      } catch {
        throw new Error("Response is not a PDF file");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  },
};

// Внутренние API эндпоинты (через Supabase Edge Functions)
export const prayerDebtAPI = {
  // Рассчитать долг намазов
  async calculateDebt(request: CalculationRequest & { 
    debt_calculation?: any; 
    repayment_progress?: any;
    missed_prayers?: MissedPrayers;
    travel_prayers?: TravelPrayers;
  }): Promise<UserPrayerDebt> {
    const userId = getUserId();
    
    // Пробуем Supabase Edge Function
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
      },
        body: JSON.stringify({
          ...request,
          user_id: userId || request.user_id || `user_${Date.now()}`,
        }),
    });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен, используем localStorage:", error);
    }

    // Fallback на localStorage
    const userData = localStorageAPI.getUserData();
    if (userData) {
      localStorageAPI.saveUserData(userData);
      return userData;
    }

    throw new Error("Failed to calculate debt");
  },

  // Получить последний расчет и текущий прогресс
  async getSnapshot(): Promise<DebtSnapshot> {
    const userId = getUserId();
    
    if (!userId) {
      // Fallback на localStorage
      const userData = localStorageAPI.getUserData();
      if (userData) {
        return {
          user_id: userData.user_id,
          debt_calculation: userData.debt_calculation,
          repayment_progress: userData.repayment_progress,
          overall_progress_percent: 0,
          remaining_prayers: {} as any,
        };
      }
      throw new Error("user_id required");
    }

    // Пробуем Supabase Edge Function
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/snapshot?user_id=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
      },
    });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен, используем localStorage:", error);
    }

    // Fallback на localStorage
    const userData = localStorageAPI.getUserData();
    if (userData && userData.user_id === userId) {
      return {
        user_id: userData.user_id,
        debt_calculation: userData.debt_calculation,
        repayment_progress: userData.repayment_progress,
        overall_progress_percent: 0,
        remaining_prayers: {} as any,
      };
    }

    throw new Error("No data found");
  },

  // Обновить прогресс восполнения
  async updateProgress(request: ProgressUpdateRequest): Promise<RepaymentProgress> {
    const userId = getUserId();
    
    if (!userId) {
      throw new Error("user_id required");
    }

    // Пробуем Supabase Edge Function
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/progress`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
      },
        body: JSON.stringify({
          ...request,
          user_id: userId,
        }),
    });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен, используем localStorage:", error);
    }

    // Fallback на localStorage
    const userData = localStorageAPI.getUserData();
    if (userData && userData.user_id === userId) {
      // Обновляем прогресс локально
      if (request.entries && userData.repayment_progress?.completed_prayers) {
        request.entries.forEach((entry) => {
          const prayerKey = entry.type as keyof typeof userData.repayment_progress.completed_prayers;
          if (userData.repayment_progress.completed_prayers[prayerKey] !== undefined) {
            (userData.repayment_progress.completed_prayers[prayerKey] as number) = 
              (userData.repayment_progress.completed_prayers[prayerKey] as number || 0) + entry.amount;
          }
        });
      }
      userData.repayment_progress.last_updated = new Date();
      localStorageAPI.saveUserData(userData);
      return userData.repayment_progress;
    }

    throw new Error("Failed to update progress");
  },

  // Асинхронный расчет (через e-Replika)
  async calculateDebtAsync(request: CalculationRequest): Promise<{ job_id: string; status_url: string }> {
    const userId = getUserId();
    
    // Пробуем Supabase Edge Function
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/calculations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
      },
        body: JSON.stringify({
          ...request,
          user_id: userId || `user_${Date.now()}`,
        }),
    });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен:", error);
    }

    throw new Error("Failed to start calculation");
  },

  // Проверить статус асинхронного расчета
  async getCalculationStatus(jobId: string): Promise<{
    status: "pending" | "done" | "error";
    result?: DebtSnapshot;
    error?: string;
  }> {
    // Пробуем Supabase Edge Function
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/calculations/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
      },
    });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен:", error);
    }

    throw new Error("Failed to get calculation status");
  },

  // Скачать PDF отчет
  async downloadPDFReport(): Promise<Blob> {
    const userId = getUserId();
    
    if (!userId) {
      throw new Error("user_id required");
    }

    // Пробуем Supabase Edge Function
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/report.pdf?user_id=${userId}`, {
      method: "GET",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
    });

      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      console.warn("Supabase API недоступен, пробуем e-Replika:", error);
    }

    // Fallback на e-Replika API
    try {
      const userData = localStorageAPI.getUserData();
      if (userData) {
        return await eReplikaAPI.generatePDFReport(userId, userData);
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
    }

    throw new Error("Failed to download PDF");
  },
};

// API для умного тасбиха
export const smartTasbihAPI = {
  // Получить состояние для инициализации (bootstrap)
  async bootstrap(): Promise<{
    user: any;
    active_goal?: any;
    daily_azkar?: any;
    recent_items: any[];
  }> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/bootstrap`, {
        method: "GET",
        headers: getSupabaseHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to bootstrap: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error bootstrapping smart tasbih:", error);
      // Fallback на localStorage
      return {
        user: { id: getTelegramUserId() || "unknown", locale: "ru", madhab: "hanafi", tz: "Europe/Moscow" },
        active_goal: null,
        daily_azkar: null,
        recent_items: [],
      };
    }
  },

  // Создать/обновить цель
  async createOrUpdateGoal(data: {
    category: string;
    item_id?: string;
    goal_type: "recite" | "learn";
    target_count: number;
    prayer_segment?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/goals`, {
        method: "POST",
        headers: getSupabaseHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create goal: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
  },

  // Начать сессию
  async startSession(data: {
    goal_id?: string;
    category: string;
    item_id?: string;
    prayer_segment?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/sessions/start`, {
        method: "POST",
        headers: getSupabaseHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  },

  // Фиксация действия (tap)
  async counterTap(data: {
    session_id: string;
    delta: number;
    event_type: string;
    offline_id?: string;
    prayer_segment?: string;
  }): Promise<{
    value_after: number;
    goal_progress?: any;
    daily_azkar?: any;
  }> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/counter/tap`, {
        method: "POST",
        headers: getSupabaseHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to tap counter: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error tapping counter:", error);
      // Сохраняем в офлайн-очередь
      const { addOfflineEvent } = await import("./offline-queue");
      const offline_id = await addOfflineEvent("tap", data);
      throw { ...error, offline_id };
    }
  },

  // Отметка о заучивании
  async markLearned(goal_id: string): Promise<any> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/learn/mark`, {
        method: "POST",
        headers: getSupabaseHeaders(),
        body: JSON.stringify({ goal_id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark learned: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error marking learned:", error);
      // Сохраняем в офлайн-очередь
      const { addOfflineEvent } = await import("./offline-queue");
      await addOfflineEvent("learn_mark", { goal_id });
      throw error;
    }
  },

  // Получить ежедневный отчет
  async getDailyReport(date?: string): Promise<any> {
    try {
      const url = date
        ? `${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/reports/daily?date=${date}`
        : `${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/reports/daily`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: getSupabaseHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get daily report: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting daily report:", error);
      throw error;
    }
  },

  // Синхронизация офлайн-событий
  async syncOfflineEvents(events: any[]): Promise<void> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/sync/offline`, {
        method: "POST",
        headers: getSupabaseHeaders(),
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync offline events: ${response.statusText}`);
      }

      const { markEventAsSynced } = await import("./offline-queue");
      // Отмечаем события как синхронизированные
      for (const event of events) {
        if (event.offline_id) {
          await markEventAsSynced(event.offline_id);
        }
      }
    } catch (error) {
      console.error("Error syncing offline events:", error);
      throw error;
    }
  },
};

// Локальное хранилище для демо-режима (когда API недоступен)
export const localStorageAPI = {
  saveUserData(data: UserPrayerDebt): void {
    // Сериализация дат в строки для localStorage
    const serialized = JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
    localStorage.setItem("userPrayerDebt", serialized);
  },

  getUserData(): UserPrayerDebt | null {
    const data = localStorage.getItem("userPrayerDebt");
    if (!data) return null;

    try {
      // Десериализация дат из строк
      return JSON.parse(data, (key, value) => {
        // Проверяем, является ли значение строкой даты в формате ISO
        if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)
        ) {
          return new Date(value);
        }
        return value;
      });
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      // Очищаем поврежденные данные
      localStorage.removeItem("userPrayerDebt");
      return null;
    }
  },

  clearUserData(): void {
    localStorage.removeItem("userPrayerDebt");
  },
};

// API для модуля "Мой Духовный Путь"
import type {
  Goal,
  GoalProgress,
  Badge,
  Streak,
  GoalGroup,
  QazaCalculation,
  AIReport,
  NotificationSettings,
} from "@/types/spiritual-path";

export const spiritualPathAPI = {
  // Цели
  async getGoals(status?: string): Promise<Goal[]> {
    const userId = getUserId();
    if (!userId) {
      // Fallback на localStorage
      return this.getGoalsFromLocalStorage(status);
    }

    try {
      const response = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/goals${status ? `?status=${status}` : ""}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "apikey": SUPABASE_ANON_KEY,
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен, используем localStorage:", error);
    }

    return this.getGoalsFromLocalStorage(status);
  },

  async createGoal(goal: Omit<Goal, "id" | "user_id" | "created_at" | "updated_at">): Promise<Goal> {
    const userId = getUserId();
    if (!userId) {
      throw new Error("user_id required");
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          ...goal,
          user_id: userId,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен, используем localStorage:", error);
    }

    // Fallback на localStorage
    return this.createGoalInLocalStorage(goal);
  },

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const userId = getUserId();
    if (!userId) {
      throw new Error("user_id required");
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен, используем localStorage:", error);
    }

    // Fallback на localStorage
    return this.updateGoalInLocalStorage(goalId, updates);
  },

  async deleteGoal(goalId: string): Promise<void> {
    const userId = getUserId();
    if (!userId) {
      throw new Error("user_id required");
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/goals/${goalId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
      });

      if (response.ok) {
        return;
      }
    } catch (error) {
      console.warn("Supabase API недоступен, используем localStorage:", error);
    }

    // Fallback на localStorage
    this.deleteGoalFromLocalStorage(goalId);
  },

  // Синхронизация с тасбихом
  async syncCounter(counterType: string, value: number, date?: string): Promise<{ success: boolean; updated_goals: any[] }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error("user_id required");
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/counter/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          counter_type: counterType,
          value,
          date: date || new Date().toISOString().split("T")[0],
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен, используем localStorage:", error);
    }

    // Fallback на localStorage
    return this.syncCounterInLocalStorage(counterType, value, date);
  },

  // Добавить прогресс вручную
  async addProgress(goalId: string, value: number, date?: string, notes?: string): Promise<GoalProgress> {
    const userId = getUserId();
    if (!userId) {
      throw new Error("user_id required");
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/goals/${goalId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          value,
          date: date || new Date().toISOString().split("T")[0],
          notes,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен, используем localStorage:", error);
    }

    // Fallback на localStorage
    return this.addProgressInLocalStorage(goalId, value, date, notes);
  },

  // Бейджи
  async getBadges(): Promise<Badge[]> {
    const userId = getUserId();
    if (!userId) {
      return [];
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/badges`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен:", error);
    }

    return [];
  },

  // Streaks
  async getStreaks(): Promise<Streak[]> {
    const userId = getUserId();
    if (!userId) {
      return [];
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/streaks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен:", error);
    }

    return [];
  },

  // Группы
  async getGroups(): Promise<GoalGroup[]> {
    const userId = getUserId();
    if (!userId) {
      return [];
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/groups`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен:", error);
    }

    return [];
  },

  async createGroup(name: string, goalId: string): Promise<GoalGroup> {
    const userId = getUserId();
    if (!userId) {
      throw new Error("user_id required");
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ name, goal_id: goalId }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен:", error);
    }

    throw new Error("Failed to create group");
  },

  async joinGroup(groupIdOrCode: string): Promise<{ success: boolean; group: GoalGroup }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error("user_id required");
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/groups/${groupIdOrCode}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ invite_code: groupIdOrCode }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен:", error);
    }

    throw new Error("Failed to join group");
  },

  // AI-отчеты
  async getAIReport(type: "weekly" | "monthly" | "custom" = "weekly"): Promise<AIReport> {
    const userId = getUserId();
    if (!userId) {
      throw new Error("user_id required");
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/analytics/report?type=${type}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен:", error);
    }

    throw new Error("Failed to get AI report");
  },

  // Калькулятор каза
  async calculateQaza(calculation: QazaCalculation): Promise<QazaCalculation> {
    const userId = getUserId();
    if (!userId) {
      throw new Error("user_id required");
    }

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/qaza/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(calculation),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Supabase API недоступен:", error);
    }

    throw new Error("Failed to calculate qaza");
  },

  // LocalStorage fallback методы
  getGoalsFromLocalStorage(status?: string): Goal[] {
    const data = localStorage.getItem("spiritual_path_goals");
    if (!data) return [];
    try {
      const goals = JSON.parse(data, (key, value) => {
        if (key === "start_date" || key === "end_date" || key === "created_at" || key === "updated_at") {
          return new Date(value);
        }
        return value;
      });
      if (status) {
        return goals.filter((g: Goal) => g.status === status);
      }
      return goals;
    } catch {
      return [];
    }
  },

  createGoalInLocalStorage(goal: Omit<Goal, "id" | "user_id" | "created_at" | "updated_at">): Goal {
    const userId = getUserId() || `user_${Date.now()}`;
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}`,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const goals = this.getGoalsFromLocalStorage();
    goals.push(newGoal);
    localStorage.setItem("spiritual_path_goals", JSON.stringify(goals));
    return newGoal;
  },

  updateGoalInLocalStorage(goalId: string, updates: Partial<Goal>): Goal {
    const goals = this.getGoalsFromLocalStorage();
    const index = goals.findIndex((g: Goal) => g.id === goalId);
    if (index === -1) throw new Error("Goal not found");
    goals[index] = { ...goals[index], ...updates, updated_at: new Date() };
    localStorage.setItem("spiritual_path_goals", JSON.stringify(goals));
    return goals[index];
  },

  deleteGoalFromLocalStorage(goalId: string): void {
    const goals = this.getGoalsFromLocalStorage();
    const filtered = goals.filter((g: Goal) => g.id !== goalId);
    localStorage.setItem("spiritual_path_goals", JSON.stringify(filtered));
  },

  syncCounterInLocalStorage(counterType: string, value: number, date?: string): { success: boolean; updated_goals: any[] } {
    const goals = this.getGoalsFromLocalStorage("active");
    const updatedGoals: any[] = [];
    const today = date || new Date().toISOString().split("T")[0];

    goals.forEach((goal) => {
      if (goal.linked_counter_type === counterType) {
        goal.current_value = (goal.current_value || 0) + value;
        goal.updated_at = new Date();
        updatedGoals.push({ goal_id: goal.id, value: goal.current_value });
      }
    });

    if (updatedGoals.length > 0) {
      localStorage.setItem("spiritual_path_goals", JSON.stringify(goals));
    }

    return { success: true, updated_goals };
  },

  addProgressInLocalStorage(goalId: string, value: number, date?: string, notes?: string): GoalProgress {
    const progress: GoalProgress = {
      id: `progress_${Date.now()}`,
      goal_id: goalId,
      user_id: getUserId() || `user_${Date.now()}`,
      date: new Date(date || new Date().toISOString().split("T")[0]),
      value,
      notes,
      created_at: new Date(),
    };

    // Обновляем цель
    const goals = this.getGoalsFromLocalStorage();
    const goal = goals.find((g: Goal) => g.id === goalId);
    if (goal) {
      goal.current_value = (goal.current_value || 0) + value;
      goal.updated_at = new Date();
      localStorage.setItem("spiritual_path_goals", JSON.stringify(goals));
    }

    return progress;
  },
};

// Дефолтные термины (если API недоступен)
function getDefaultTerms(): Term[] {
  return [
    {
      term: "Каза",
      definition: "Восполнение пропущенного обязательного намаза",
      transliteration: "Qada",
    },
    {
      term: "Булюг",
      definition: "Совершеннолетие, возраст, с которого человек обязан совершать намаз",
      transliteration: "Bulugh",
    },
    {
      term: "Хайд",
      definition: "Менструация у женщин, период, когда намаз не обязателен",
      transliteration: "Haid",
    },
    {
      term: "Нифас",
      definition: "Послеродовое кровотечение, период после родов, когда намаз не обязателен",
      transliteration: "Nifas",
    },
    {
      term: "Сафар",
      definition: "Путешествие, при котором разрешено сокращать четырёхракаатные намазы",
      transliteration: "Safar",
    },
    {
      term: "Мазхаб",
      definition: "Школа исламского права, методологическая система вынесения правовых решений",
      transliteration: "Madhab",
    },
    {
      term: "Витр",
      definition: "Нечётный намаз, совершаемый после ночного намаза (Иша)",
      transliteration: "Witr",
    },
    {
      term: "Ракаат",
      definition: "Цикл молитвы, состоящий из определённых действий и чтений",
      transliteration: "Rak'ah",
    },
  ];
}

