// Быстрая кнопка добавления каза намазов

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddPrayerDialog } from "./AddPrayerDialog";
import { useUserData } from "@/hooks/useUserData";
import { cn } from "@/lib/utils";

interface QuickAddPrayerButtonProps {
  variant?: "default" | "floating" | "compact";
  className?: string;
}

export const QuickAddPrayerButton = ({ 
  variant = "default",
  className 
}: QuickAddPrayerButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { userData, refreshData } = useUserData();

  const handleUpdate = () => {
    refreshData();
    setDialogOpen(false);
  };

  if (variant === "floating") {
    return (
      <>
        <Button
          onClick={() => setDialogOpen(true)}
          size="lg"
          className={cn(
            "fixed bottom-24 right-4 z-50 rounded-full shadow-lg h-14 w-14",
            "bg-emerald-500 hover:bg-emerald-600 text-white",
            "animate-bounce hover:animate-none",
            className
          )}
        >
          <Plus className="w-6 h-6" />
        </Button>
        <AddPrayerDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onUpdate={handleUpdate} 
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          className={cn(
            "bg-emerald-500 hover:bg-emerald-600 text-white",
            className
          )}
        >
          <Plus className="w-4 h-4 mr-1" />
          Добавить
        </Button>
        <AddPrayerDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onUpdate={handleUpdate} 
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        size="lg"
        className={cn(
          "w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md",
          "h-14 text-base font-semibold",
          className
        )}
      >
        <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
        <span className="break-words">Отметить восполненные намазы</span>
      </Button>
      <AddPrayerDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onUpdate={handleUpdate} 
      />
    </>
  );
};

