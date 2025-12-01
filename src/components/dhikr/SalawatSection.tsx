import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { DuaCard } from "./DuaCard";
import { getAvailableItemsByCategory } from "@/lib/dhikr-data";
import { eReplikaAPI } from "@/lib/api";

export const SalawatSection = () => {
  const [salawat, setSalawat] = useState([
    {
      id: "salawat-1",
      arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
      transcription: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammadin kama sallayta 'ala Ibrahima wa 'ala ali Ibrahima innaka hamidun majid",
      russianTranscription: "Аллахумма салли 'аля Мухаммадин ва 'аля али Мухаммадин кама салляйта 'аля Ибрахима ва 'аля али Ибрахима иннака хамидун маджид",
      translation: "О Аллах, благослови Мухаммада и семейство Мухаммада, как Ты благословил Ибрахима и семейство Ибрахима. Поистине, Ты — Достойный хвалы, Славный",
      reference: "Сахих аль-Бухари 3370",
      audioUrl: null,
    },
    {
      id: "salawat-2",
      arabic: "اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
      transcription: "Allahumma barik 'ala Muhammadin wa 'ala ali Muhammadin kama barakta 'ala Ibrahima wa 'ala ali Ibrahima innaka hamidun majid",
      russianTranscription: "Аллахумма барик 'аля Мухаммадин ва 'аля али Мухаммадин кама баракта 'аля Ибрахима ва 'аля али Ибрахима иннака хамидун маджид",
      translation: "О Аллах, пошли благословение Мухаммаду и семейству Мухаммада, как Ты послал благословение Ибрахиму и семейству Ибрахима. Поистине, Ты — Достойный хвалы, Славный",
      reference: "Сахих аль-Бухари 6357",
      audioUrl: null,
    },
    {
      id: "salawat-3",
      arabic: "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
      transcription: "Sallallahu 'alayhi wa sallam",
      russianTranscription: "Салляллаху 'алейхи ва саллям",
      translation: "Да благословит его Аллах и приветствует",
      reference: "Традиционная формула",
      audioUrl: null,
    },
  ]);

  useEffect(() => {
    const loadSalawat = async () => {
      try {
        // Пробуем загрузить из API
        const apiSalawat = await eReplikaAPI.getSalawat();
        if (apiSalawat && apiSalawat.length > 0) {
          setSalawat(apiSalawat.map(item => ({
            id: item.id,
            arabic: item.arabic,
            transcription: item.transcription,
            russianTranscription: item.russianTranscription,
            translation: item.translation,
            reference: item.reference,
            audioUrl: item.audioUrl,
          })));
          return;
        }
      } catch (error) {
        console.log("API error, using local data:", error);
      }

      // Используем локальные данные (включая расширенные)
      const localSalawat = await getAvailableItemsByCategory("salawat");
      setSalawat(localSalawat.map(item => ({
        id: item.id,
        arabic: item.arabic,
        transcription: item.transcription,
        russianTranscription: item.russianTranscription,
        translation: item.translation,
        reference: item.reference,
        audioUrl: item.audioUrl,
      })));
    };

    loadSalawat();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <Card className="glass shadow-medium border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow-gold">
              <Heart className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl gradient-text">Салаваты</CardTitle>
              <CardDescription>
                Благословения на Пророка Мухаммада ﷺ
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {salawat.map((salawat) => (
          <DuaCard key={salawat.id} dua={salawat} categoryColor="accent" />
        ))}
      </div>

      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-accent">Хадис:</strong> "Кто произнесёт на меня салават один раз, 
            Аллах благословит его десять раз, снимет с него десять грехов и возвысит его на десять степеней"
            (Сахих Муслим 408)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
