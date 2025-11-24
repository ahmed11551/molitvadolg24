import { useState, useEffect } from "react";
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

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      <MainHeader />

      <main className="container mx-auto px-3 sm:px-4 py-6 max-w-5xl w-full overflow-x-hidden">
        <Tabs defaultValue={goalId ? "goals" : "dua"} className="w-full">
          {/* Enhanced Tabs Container */}
          <div className="relative mb-6 overflow-visible">
            {/* Background with gradient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-xl opacity-50 -z-10" />
            
            <TabsList className={cn(
              "relative flex w-full h-auto items-center",
              "px-1 sm:px-3 py-2 gap-0.5 sm:gap-2",
              "overflow-x-auto overflow-y-visible",
              "bg-white/95 backdrop-blur-md",
              "rounded-2xl border border-border/60",
              "shadow-lg shadow-primary/5",
              "scroll-smooth snap-x snap-mandatory",
              "min-h-[44px] sm:min-h-[52px]",
              "no-scrollbar",
              "sm:justify-start"
            )}>
              <TabsTrigger 
                value="dua"
                className={cn(
                  "flex items-center justify-center",
                  "flex-1 sm:flex-none sm:min-w-[80px]",
                  "px-1.5 sm:px-5 py-1.5 sm:py-2.5",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10">Дуа</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="adhkar"
                className={cn(
                  "flex items-center justify-center",
                  "flex-1 sm:flex-none sm:min-w-[90px]",
                  "px-1.5 sm:px-5 py-1.5 sm:py-2.5",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10">Азкары</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="salawat"
                className={cn(
                  "flex items-center justify-center",
                  "flex-1 sm:flex-none sm:min-w-[100px]",
                  "px-1.5 sm:px-5 py-1.5 sm:py-2.5",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10">Салаваты</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="kalima"
                className={cn(
                  "flex items-center justify-center",
                  "flex-1 sm:flex-none sm:min-w-[90px]",
                  "px-1.5 sm:px-5 py-1.5 sm:py-2.5",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10">Калимы</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="goals"
                className={cn(
                  "flex items-center justify-center",
                  "flex-1 sm:flex-none sm:min-w-[110px]",
                  "px-1.5 sm:px-5 py-1.5 sm:py-2.5",
                  "text-center rounded-xl",
                  "transition-all duration-300 ease-out",
                  "whitespace-nowrap",
                  "text-[10px] sm:text-sm font-semibold",
                  "snap-start",
                  "overflow-visible",
                  // Inactive state
                  "text-foreground/90 bg-transparent",
                  "hover:text-foreground hover:bg-primary/8",
                  "active:scale-[0.98]",
                  // Active state
                  "data-[state=active]:bg-gradient-to-r",
                  "data-[state=active]:from-primary",
                  "data-[state=active]:to-primary/90",
                  "data-[state=active]:text-white",
                  "data-[state=active]:shadow-lg",
                  "data-[state=active]:shadow-primary/30",
                  "data-[state=active]:scale-[1.01]",
                  "data-[state=active]:font-bold",
                  "data-[state=active]:z-10"
                )}
              >
                <span className="relative z-10">Из целей</span>
              </TabsTrigger>
            </TabsList>
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
