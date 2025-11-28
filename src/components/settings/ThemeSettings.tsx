import { useTheme, ThemeColor, ThemeMode } from "@/contexts/ThemeContext";
import { Check, Moon, Sun, Monitor, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS: { id: ThemeColor; name: string; class: string }[] = [
  { id: "emerald", name: "Изумруд", class: "bg-emerald-500" },
  { id: "blue", name: "Синий", class: "bg-blue-500" },
  { id: "purple", name: "Фиолетовый", class: "bg-purple-500" },
  { id: "rose", name: "Розовый", class: "bg-rose-500" },
  { id: "amber", name: "Янтарь", class: "bg-amber-500" },
  { id: "teal", name: "Бирюза", class: "bg-teal-500" },
  { id: "indigo", name: "Индиго", class: "bg-indigo-500" },
];

const MODES: { id: ThemeMode; name: string; icon: typeof Sun }[] = [
  { id: "light", name: "Светлая", icon: Sun },
  { id: "dark", name: "Тёмная", icon: Moon },
  { id: "system", name: "Системная", icon: Monitor },
];

export function ThemeSettings() {
  const { color, mode, setColor, setMode, isDark } = useTheme();

  return (
    <div className={cn(
      "space-y-6 p-4 rounded-2xl",
      isDark ? "bg-gray-800" : "bg-white"
    )}>
      {/* Выбор цвета */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className={cn("w-5 h-5", isDark ? "text-gray-300" : "text-gray-700")} />
          <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
            Основной цвет
          </h3>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setColor(c.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-50",
                color === c.id && (isDark ? "bg-gray-700 ring-2 ring-white/30" : "bg-gray-100 ring-2 ring-gray-300")
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full shadow-lg flex items-center justify-center",
                c.class
              )}>
                {color === c.id && (
                  <Check className="w-5 h-5 text-white" />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isDark ? "text-gray-300" : "text-gray-600"
              )}>
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Выбор темы */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          {isDark ? (
            <Moon className="w-5 h-5 text-gray-300" />
          ) : (
            <Sun className="w-5 h-5 text-gray-700" />
          )}
          <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
            Тема оформления
          </h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-50",
                  mode === m.id && (isDark ? "bg-gray-700 ring-2 ring-white/30" : "bg-gray-100 ring-2 ring-gray-300")
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  mode === m.id 
                    ? (isDark ? "bg-white/20" : "bg-gray-200")
                    : (isDark ? "bg-gray-600" : "bg-gray-100")
                )}>
                  <Icon className={cn(
                    "w-6 h-6",
                    isDark ? "text-gray-200" : "text-gray-600"
                  )} />
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}>
                  {m.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Превью */}
      <div className={cn(
        "p-4 rounded-xl border",
        isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
      )}>
        <p className={cn(
          "text-sm mb-3",
          isDark ? "text-gray-400" : "text-gray-500"
        )}>
          Предпросмотр
        </p>
        <div className="flex gap-3">
          <button className={cn(
            "px-4 py-2 rounded-lg text-white font-medium",
            `bg-${color}-500`
          )} style={{ 
            backgroundColor: `rgb(var(--color-primary))` 
          }}>
            Основная
          </button>
          <button className={cn(
            "px-4 py-2 rounded-lg font-medium border",
            isDark 
              ? "bg-gray-600 text-white border-gray-500" 
              : "bg-white text-gray-700 border-gray-300"
          )}>
            Вторичная
          </button>
        </div>
      </div>
    </div>
  );
}

