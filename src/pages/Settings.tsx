import { ArrowLeft, Bell, Palette, Shield, HelpCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function Settings() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const menuItems = [
    {
      id: "theme",
      icon: Palette,
      title: "Оформление",
      subtitle: "Цвета и тема",
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Уведомления",
      subtitle: "Напоминания о намазах",
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      id: "privacy",
      icon: Shield,
      title: "Конфиденциальность",
      subtitle: "Данные и безопасность",
      color: "text-emerald-500",
      bgColor: "bg-emerald-100",
    },
    {
      id: "help",
      icon: HelpCircle,
      title: "Помощь",
      subtitle: "FAQ и поддержка",
      color: "text-amber-500",
      bgColor: "bg-amber-100",
    },
    {
      id: "about",
      icon: Info,
      title: "О приложении",
      subtitle: "Версия 1.0.0",
      color: "text-gray-500",
      bgColor: "bg-gray-100",
    },
  ];

  return (
    <div className={cn(
      "min-h-screen pb-24",
      isDark ? "bg-gray-900" : "bg-gray-50"
    )}>
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-10 px-4 py-4 flex items-center gap-4",
        isDark ? "bg-gray-900" : "bg-gray-50"
      )}>
        <button 
          onClick={() => navigate(-1)}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isDark ? "bg-gray-800 text-white" : "bg-white text-gray-700 shadow-sm"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={cn(
          "text-xl font-bold",
          isDark ? "text-white" : "text-gray-900"
        )}>
          Настройки
        </h1>
      </div>

      {/* Menu */}
      <div className="px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSheet(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 active:scale-[0.98]" 
                  : "bg-white hover:bg-gray-50 shadow-sm active:scale-[0.98]"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isDark ? "bg-gray-700" : item.bgColor
              )}>
                <Icon className={cn("w-6 h-6", item.color)} />
              </div>
              <div className="flex-1 text-left">
                <h3 className={cn(
                  "font-semibold",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {item.title}
                </h3>
                <p className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  {item.subtitle}
                </p>
              </div>
              <ArrowLeft className={cn(
                "w-5 h-5 rotate-180",
                isDark ? "text-gray-500" : "text-gray-400"
              )} />
            </button>
          );
        })}
      </div>

      {/* Theme Sheet */}
      <Sheet open={activeSheet === "theme"} onOpenChange={() => setActiveSheet(null)}>
        <SheetContent side="bottom" className={cn(
          "rounded-t-3xl max-h-[85vh] overflow-auto",
          isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50"
        )}>
          <SheetHeader className="pb-4">
            <SheetTitle className={isDark ? "text-white" : ""}>
              Оформление
            </SheetTitle>
          </SheetHeader>
          <ThemeSettings />
        </SheetContent>
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet open={activeSheet === "notifications"} onOpenChange={() => setActiveSheet(null)}>
        <SheetContent side="bottom" className={cn(
          "rounded-t-3xl",
          isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50"
        )}>
          <SheetHeader className="pb-4">
            <SheetTitle className={isDark ? "text-white" : ""}>
              Уведомления
            </SheetTitle>
          </SheetHeader>
          <div className={cn(
            "p-4 rounded-2xl text-center",
            isDark ? "bg-gray-800" : "bg-white"
          )}>
            <Bell className={cn(
              "w-12 h-12 mx-auto mb-4",
              isDark ? "text-gray-500" : "text-gray-400"
            )} />
            <p className={isDark ? "text-gray-300" : "text-gray-600"}>
              Настройки уведомлений будут доступны в следующем обновлении
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* About Sheet */}
      <Sheet open={activeSheet === "about"} onOpenChange={() => setActiveSheet(null)}>
        <SheetContent side="bottom" className={cn(
          "rounded-t-3xl",
          isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50"
        )}>
          <SheetHeader className="pb-4">
            <SheetTitle className={isDark ? "text-white" : ""}>
              О приложении
            </SheetTitle>
          </SheetHeader>
          <div className={cn(
            "p-6 rounded-2xl text-center",
            isDark ? "bg-gray-800" : "bg-white"
          )}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🕌</span>
            </div>
            <h3 className={cn(
              "text-xl font-bold mb-1",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Трекер намазов
            </h3>
            <p className={cn(
              "text-sm mb-4",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              Версия 1.0.0
            </p>
            <p className={cn(
              "text-sm",
              isDark ? "text-gray-300" : "text-gray-600"
            )}>
              Помогаем восполнять пропущенные намазы и укреплять духовную практику
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

