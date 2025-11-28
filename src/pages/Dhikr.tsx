// Страница Зикры - Дуа, Азкары, Салаваты, Калимы

import { useState, useRef, useEffect } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { DuaSectionV2 } from "@/components/dhikr/DuaSectionV2";
import { AdhkarSectionV2 } from "@/components/dhikr/AdhkarSectionV2";
import { SalawatSection } from "@/components/dhikr/SalawatSection";
import { KalimaSection } from "@/components/dhikr/KalimaSection";
import { cn } from "@/lib/utils";
import { Heart, Star, Sparkles, BookOpen } from "lucide-react";

type TabType = "dua" | "adhkar" | "salawat" | "kalima";

const TABS: { id: TabType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "dua", label: "Дуа", icon: <Heart className="w-5 h-5" />, color: "bg-rose-500" },
  { id: "adhkar", label: "Азкары", icon: <Star className="w-5 h-5" />, color: "bg-amber-500" },
  { id: "salawat", label: "Салаваты", icon: <Sparkles className="w-5 h-5" />, color: "bg-emerald-500" },
  { id: "kalima", label: "Калимы", icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-500" },
];

const Dhikr = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dua");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Автоскролл к активной вкладке
  useEffect(() => {
    if (tabsRef.current) {
      const activeButton = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <MainHeader />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Зикры</h1>
          <p className="text-sm text-muted-foreground">
            Дуа, азкары и поминания
          </p>
        </div>

        {/* Category Tabs */}
        <div
          ref={tabsRef}
          className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap transition-all flex-shrink-0",
                activeTab === tab.id
                  ? `${tab.color} text-white shadow-lg`
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[60vh]">
          {activeTab === "dua" && <DuaSectionV2 />}
          {activeTab === "adhkar" && <AdhkarSectionV2 />}
          {activeTab === "salawat" && <SalawatSection />}
          {activeTab === "kalima" && <KalimaSection />}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dhikr;
