// Страница Зикры - дизайн Goal app

import { useState, useRef, useEffect, Suspense, lazy } from "react";
import { useSearchParams } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Heart, Star, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy loading для разделов зикров для улучшения производительности
const DuaSectionV2 = lazy(() => 
  import("@/components/dhikr/DuaSectionV2").then(m => ({ default: m.DuaSectionV2 }))
);
const AdhkarSectionV2 = lazy(() => 
  import("@/components/dhikr/AdhkarSectionV2").then(m => ({ default: m.AdhkarSectionV2 }))
);
const SalawatSection = lazy(() => 
  import("@/components/dhikr/SalawatSection").then(m => ({ default: m.SalawatSection }))
);
const KalimaSection = lazy(() => 
  import("@/components/dhikr/KalimaSection").then(m => ({ default: m.KalimaSection }))
);

// Компонент загрузки для разделов
const SectionSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

type TabType = "dua" | "adhkar" | "salawat" | "kalima";

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "dua", label: "Дуа", icon: <Heart className="w-4 h-4" /> },
  { id: "adhkar", label: "Азкары", icon: <Star className="w-4 h-4" /> },
  { id: "salawat", label: "Салаваты", icon: <Sparkles className="w-4 h-4" /> },
  { id: "kalima", label: "Калимы", icon: <BookOpen className="w-4 h-4" /> },
];

const Dhikr = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && TABS.some(t => t.id === tabParam) ? tabParam : "dua");
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <MainHeader />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Category Tabs */}
        <div
          ref={tabsRef}
          className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap transition-all flex-shrink-0 font-medium",
                activeTab === tab.id
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[60vh]">
          <Suspense fallback={<SectionSkeleton />}>
            {activeTab === "dua" && <DuaSectionV2 />}
            {activeTab === "adhkar" && <AdhkarSectionV2 />}
            {activeTab === "salawat" && <SalawatSection />}
            {activeTab === "kalima" && <KalimaSection />}
          </Suspense>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dhikr;
