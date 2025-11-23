// Утилита для получения данных зикров, дуа, аятов по ID
// Использует e-Replika API (Bot.e-replika.ru/docs) как основной источник данных

import { eReplikaAPI } from "./api";

export interface DhikrItem {
  id: string;
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation: string;
  reference?: string;
  audioUrl?: string | null;
  count?: number; // Для зикров
  title?: string; // Для зикров
  surahNumber?: number; // Для аятов
  ayahNumber?: number; // Для аятов
  number?: number; // Для имен Аллаха, сур
}

// Данные дуа (из DuaSection)
const duasData: Record<string, DhikrItem> = {
  "sleep-1": {
    id: "sleep-1",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transcription: "Bismika Allahumma amutu wa ahya",
    russianTranscription: "Бисмика Аллахумма амуту ва ахья",
    translation: "С именем Твоим, О Аллах, я умираю и оживаю",
    reference: "Сахих аль-Бухари 6314",
    audioUrl: null,
  },
  "general-1": {
    id: "general-1",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transcription: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    russianTranscription: "Раббана атина фид-дунья хасанатан ва филь-ахирати хасанатан ва кина 'азабан-нар",
    translation: "Господь наш, даруй нам в этом мире благо и в Последней жизни благо, и защити нас от наказания Огня",
    reference: "Коран 2:201",
    audioUrl: null,
  },
  // TODO: Добавить все остальные дуа
};

// Данные салаватов (из SalawatSection)
const salawatData: Record<string, DhikrItem> = {
  "salawat-1": {
    id: "salawat-1",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transcription: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammadin kama sallayta 'ala Ibrahima wa 'ala ali Ibrahima innaka hamidun majid",
    russianTranscription: "Аллахумма салли 'аля Мухаммадин ва 'аля али Мухаммадин кама салляйта 'аля Ибрахима ва 'аля али Ибрахима иннака хамидун маджид",
    translation: "О Аллах, благослови Мухаммада и семейство Мухаммада, как Ты благословил Ибрахима и семейство Ибрахима. Поистине, Ты — Достойный хвалы, Славный",
    reference: "Сахих аль-Бухари 3370",
    audioUrl: null,
  },
  // TODO: Добавить остальные салаваты
};

// Данные калим (из KalimaSection)
const kalimasData: Record<string, DhikrItem> = {
  "kalima-1": {
    id: "kalima-1",
    arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ مُحَمَّدٌ رَسُولُ ٱللَّٰهِ",
    transcription: "La ilaha illallah, Muhammadur rasulullah",
    russianTranscription: "Ля иляха илляллах, Мухаммадур расулюллах",
    translation: "Нет божества, кроме Аллаха, Мухаммад — Посланник Аллаха",
    reference: "Калима Шахада (Свидетельство веры)",
    audioUrl: null,
  },
  // TODO: Добавить остальные калимы
};

// Данные азкаров (из AdhkarSection)
const adhkarData: Record<string, DhikrItem> = {
  "tasbih": {
    id: "tasbih",
    title: "Тасбих",
    arabic: "سُبْحَانَ اللَّهِ",
    transcription: "Subhanallah",
    russianTranscription: "Субханаллах",
    translation: "Свят Аллах",
    count: 33,
    audioUrl: null,
  },
  "tahmid": {
    id: "tahmid",
    title: "Тахмид",
    arabic: "الْحَمْدُ لِلَّهِ",
    transcription: "Alhamdulillah",
    russianTranscription: "Альхамдулиллах",
    translation: "Хвала Аллаху",
    count: 33,
    audioUrl: null,
  },
  "takbir": {
    id: "takbir",
    title: "Такбир",
    arabic: "اللَّهُ أَكْبَرُ",
    transcription: "Allahu Akbar",
    russianTranscription: "Аллаху Акбар",
    translation: "Аллах Велик",
    count: 34,
    audioUrl: null,
  },
  // TODO: Добавить остальные азкары
};

// Функция для получения данных по ID и типу (асинхронная, использует e-Replika API)
export async function getDhikrItemById(
  itemId: string,
  itemType: "dua" | "ayah" | "surah" | "adhkar" | "salawat" | "kalima" | "name_of_allah"
): Promise<DhikrItem | null> {
  try {
    switch (itemType) {
      case "dua": {
        // Получаем из e-Replika API
        const dua = await eReplikaAPI.getDuaById(itemId);
        if (dua) {
          return {
            id: dua.id,
            arabic: dua.arabic,
            transcription: dua.transcription,
            russianTranscription: dua.russianTranscription,
            translation: dua.translation,
            reference: dua.reference,
            audioUrl: dua.audioUrl,
          };
        }
        // Fallback на локальные данные
        return duasData[itemId] || null;
      }
      case "salawat": {
        // Получаем из e-Replika API
        const salawat = await eReplikaAPI.getSalawat();
        const item = salawat.find(s => s.id === itemId);
        if (item) {
          return {
            id: item.id,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            reference: item.reference,
            audioUrl: item.audioUrl,
          };
        }
        return salawatData[itemId] || null;
      }
      case "kalima": {
        // Получаем из e-Replika API
        const kalimas = await eReplikaAPI.getKalimas();
        const item = kalimas.find(k => k.id === itemId);
        if (item) {
          return {
            id: item.id,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            reference: item.reference,
            audioUrl: item.audioUrl,
          };
        }
        return kalimasData[itemId] || null;
      }
      case "adhkar": {
        // Получаем из e-Replika API
        const adhkar = await eReplikaAPI.getAdhkar();
        const item = adhkar.find(a => a.id === itemId);
        if (item) {
          return {
            id: item.id,
            title: item.title,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            count: item.count,
            audioUrl: item.audioUrl,
          };
        }
        return adhkarData[itemId] || null;
      }
      case "ayah": {
        // Получаем из e-Replika API
        const ayahs = await eReplikaAPI.getAyahs();
        const item = ayahs.find(a => a.id === itemId);
        if (item) {
          return {
            id: item.id,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            surahNumber: item.surahNumber,
            ayahNumber: item.ayahNumber,
            audioUrl: item.audioUrl,
          };
        }
        return null;
      }
      case "name_of_allah": {
        // Получаем из e-Replika API
        const names = await eReplikaAPI.getNamesOfAllah();
        const item = names.find(n => n.id === itemId);
        if (item) {
          return {
            id: item.id,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            number: item.number,
            audioUrl: item.audioUrl,
          };
        }
        return null;
      }
      case "surah": {
        // Получаем из e-Replika API
        const surahs = await eReplikaAPI.getSurahs();
        const surah = surahs.find(s => s.id === itemId);
        if (surah) {
          return {
            id: surah.id,
            arabic: surah.nameArabic,
            transcription: surah.nameTransliteration,
            translation: surah.name,
            number: surah.number,
          };
        }
        return null;
      }
      default:
        return null;
    }
  } catch (error) {
    console.error("Error fetching dhikr item:", error);
    // Fallback на локальные данные
    switch (itemType) {
      case "dua":
        return duasData[itemId] || null;
      case "salawat":
        return salawatData[itemId] || null;
      case "kalima":
        return kalimasData[itemId] || null;
      case "adhkar":
        return adhkarData[itemId] || null;
      default:
        return null;
    }
  }
}

// Функция для получения всех доступных элементов по категории (асинхронная, использует e-Replika API)
export async function getAvailableItemsByCategory(
  category: "dua" | "adhkar" | "salawat" | "kalima"
): Promise<DhikrItem[]> {
  try {
    switch (category) {
      case "dua": {
        // Получаем из e-Replika API
        const duas = await eReplikaAPI.getDuas();
        return duas.map(dua => ({
          id: dua.id,
          arabic: dua.arabic,
          transcription: dua.transcription,
          russianTranscription: dua.russianTranscription,
          translation: dua.translation,
          reference: dua.reference,
          audioUrl: dua.audioUrl,
        }));
      }
      case "salawat": {
        // Получаем из e-Replika API
        const salawat = await eReplikaAPI.getSalawat();
        return salawat.map(item => ({
          id: item.id,
          arabic: item.arabic,
          transcription: item.transcription,
          russianTranscription: item.russianTranscription,
          translation: item.translation,
          reference: item.reference,
          audioUrl: item.audioUrl,
        }));
      }
      case "kalima": {
        // Получаем из e-Replika API
        const kalimas = await eReplikaAPI.getKalimas();
        return kalimas.map(item => ({
          id: item.id,
          arabic: item.arabic,
          transcription: item.transcription,
          russianTranscription: item.russianTranscription,
          translation: item.translation,
          reference: item.reference,
          audioUrl: item.audioUrl,
        }));
      }
      case "adhkar": {
        // Получаем из e-Replika API
        const adhkar = await eReplikaAPI.getAdhkar();
        return adhkar.map(item => ({
          id: item.id,
          title: item.title,
          arabic: item.arabic,
          transcription: item.transcription,
          russianTranscription: item.russianTranscription,
          translation: item.translation,
          count: item.count,
          audioUrl: item.audioUrl,
        }));
      }
      default:
        return [];
    }
  } catch (error) {
    console.error("Error fetching items by category from e-Replika API:", error);
    // Fallback на локальные данные
    switch (category) {
      case "dua":
        return Object.values(duasData);
      case "salawat":
        return Object.values(salawatData);
      case "kalima":
        return Object.values(kalimasData);
      case "adhkar":
        return Object.values(adhkarData);
      default:
        return [];
    }
  }
}

// Функция для получения аятов (из e-Replika API)
export async function getAyahs(surahNumber?: number): Promise<DhikrItem[]> {
  try {
    const ayahs = await eReplikaAPI.getAyahs(surahNumber);
    return ayahs.map(item => ({
      id: item.id,
      arabic: item.arabic,
      transcription: item.transcription,
      russianTranscription: item.russianTranscription,
      translation: item.translation,
      surahNumber: item.surahNumber,
      ayahNumber: item.ayahNumber,
      audioUrl: item.audioUrl,
    }));
  } catch (error) {
    console.error("Error fetching ayahs from e-Replika API:", error);
    return [];
  }
}

// Функция для получения сур (из e-Replika API)
export async function getSurahs(): Promise<DhikrItem[]> {
  try {
    const surahs = await eReplikaAPI.getSurahs();
    return surahs.map(item => ({
      id: item.id,
      arabic: item.nameArabic,
      transcription: item.nameTransliteration,
      translation: item.name,
      number: item.number,
    }));
  } catch (error) {
    console.error("Error fetching surahs from e-Replika API:", error);
    return [];
  }
}

// Функция для получения 99 имен Аллаха (из e-Replika API)
export async function getNamesOfAllah(): Promise<DhikrItem[]> {
  try {
    const names = await eReplikaAPI.getNamesOfAllah();
    return names.map(item => ({
      id: item.id,
      arabic: item.arabic,
      transcription: item.transcription,
      russianTranscription: item.russianTranscription,
      translation: item.translation,
      number: item.number,
      audioUrl: item.audioUrl,
    }));
  } catch (error) {
    console.error("Error fetching names of Allah from e-Replika API:", error);
    return [];
  }
}

