// Компонент-обертка для напоминаний и каталога

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HabitRemindersList } from "./HabitRemindersList";
import { HabitCatalog } from "./HabitCatalog";
import type { HabitReminder } from "@/types/habit-reminder";

export const HabitRemindersWithCatalog = () => {
  const [activeTab, setActiveTab] = useState<"reminders" | "catalog">("reminders");

  const handleAddReminder = () => {
    setActiveTab("catalog");
  };

  const handleReminderCreated = () => {
    // Переключаемся обратно на напоминания после создания
    setTimeout(() => {
      setActiveTab("reminders");
    }, 500);
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "reminders" | "catalog")} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="reminders">Напоминания</TabsTrigger>
        <TabsTrigger value="catalog">Каталог</TabsTrigger>
      </TabsList>
      <TabsContent value="reminders">
        <HabitRemindersList onAddReminder={handleAddReminder} />
      </TabsContent>
      <TabsContent value="catalog">
        <HabitCatalog onReminderCreated={handleReminderCreated} />
      </TabsContent>
    </Tabs>
  );
};

