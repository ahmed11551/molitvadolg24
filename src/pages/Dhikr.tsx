import { useState, useEffect, useRef } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DuaSection } from "@/components/dhikr/DuaSection";
import { DuaSectionV2 } from "@/components/dhikr/DuaSectionV2";
import { AdhkarSection } from "@/components/dhikr/AdhkarSection";
import { AdhkarSectionV2 } from "@/components/dhikr/AdhkarSectionV2";
import { SalawatSection } from "@/components/dhikr/SalawatSection";
import { KalimaSection } from "@/components/dhikr/KalimaSection";
import { SmartTasbih } from "@/components/dhikr/SmartTasbih";
import { EnhancedTasbih } from "@/components/dhikr/EnhancedTasbih";
import { SmartTasbihV2 } from "@/components/dhikr/SmartTasbihV2";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const Dhikr = () => {
  const [searchParams] = useSearchParams();
  const goalId = searchParams.get("goal");
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  useEffect(() => {
    const container = tabsListRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollWidth, clientWidth } = container;
      setShowRightGradient(scrollWidth > clientWidth + 1);
    };

    checkScroll();
    const timeout = setTimeout(checkScroll, 150);

    return () => clearTimeout(timeout);
  }, []);

  const updateGradients = () => {
    const container = tabsListRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftGradient(scrollLeft > 0);
    setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const container = tabsListRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateGradients, { passive: true });
    window.addEventListener("resize", updateGradients);
    const timeout = setTimeout(updateGradients, 200);

    return () => {
      clearTimeout(timeout);
      container.removeEventListener("scroll", updateGradients);
      window.removeEventListener("resize", updateGradients);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      <MainHeader />

      <main className="container mx-auto px-3 sm:px-4 py-6 max-w-5xl w-full overflow-x-hidden">
        <Tabs defaultValue={goalId ? "goals" : "dua"} className="w-full">
          <div className="relative mb-6 w-full overflow-hidden">
            {showLeftGradient && (
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
            )}
            {showRightGradient && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />
            )}

            <div
              ref={tabsListRef}
              className="flex items-center overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar w-full -mx-2 px-2"
              style={{
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-x",
                overscrollBehaviorX: "contain",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <TabsList
                className={cn(
                  "inline-flex items-center gap-1",
                  "bg-white rounded-full border border-border/40 shadow-sm",
                  "px-1 py-1 min-w-max h-12"
                )}
              >
                {[
                  { value: "dua", label: "Дуа" },
                  { value: "adhkar", label: "Азкары" },
                  { value: "salawat", label: "Салаваты" },
                  { value: "kalima", label: "Калимы" },
                  { value: "goals", label: "Из целей" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium rounded-full",
                      "text-foreground/70 transition-all whitespace-nowrap",
                      "data-[state=active]:bg-primary data-[state=active]:text-white",
                      "data-[state=active]:shadow-sm"
                    )}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <TabsContent value="goals" className="mt-0">
            <SmartTasbihV2 goalId={goalId || undefined} />
          </TabsContent>

          <TabsContent value="dua" className="mt-0">
            <DuaSectionV2 />
          </TabsContent>

          <TabsContent value="adhkar" className="mt-0">
            <AdhkarSectionV2 />
          </TabsContent>

          <TabsContent value="salawat" className="mt-0">
            <SalawatSection />
          </TabsContent>

          <TabsContent value="kalima" className="mt-0">
            <KalimaSection />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dhikr;
