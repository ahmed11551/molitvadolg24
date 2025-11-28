import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Settings, Bell } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [logoError, setLogoError] = useState(false);
  
  const getPageInfo = () => {
    switch (location.pathname) {
      case "/goals":
        return { title: "Цели", subtitle: "Привычки и достижения" };
      case "/dhikr":
        return { title: "Зикры", subtitle: "Дуа и поминания" };
      case "/tasbih":
        return { title: "Тасбих", subtitle: "Счётчик зикров" };
      case "/statistics":
        return { title: "Статистика", subtitle: "Ваш прогресс" };
      case "/settings":
        return { title: "Настройки", subtitle: "Персонализация" };
      default:
        return { title: "Каза", subtitle: "Пропущенные намазы" };
    }
  };

  const { title, subtitle } = getPageInfo();
  const logoUrl = "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/cc/e2/51/cce2511d-7436-95af-c944-7dda394c0c3b/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png/1200x630wa.png";

  return (
    <header className={cn(
      "sticky top-0 z-50 backdrop-blur-sm border-b",
      isDark 
        ? "bg-gray-900/95 border-gray-700" 
        : "bg-white/95 border-gray-100"
    )}>
      <div className="container mx-auto px-4 py-3 max-w-lg">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm bg-emerald-500 flex items-center justify-center">
              {!logoError ? (
                <img 
                  src={logoUrl}
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={cn(
              "text-lg font-bold truncate",
              isDark ? "text-white" : "text-gray-900"
            )}>{title}</h1>
            <p className={cn(
              "text-xs truncate",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>{subtitle}</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Notifications button */}
            <button
              type="button"
              aria-label="Уведомления"
              onClick={() => {
                toast({
                  title: "Уведомления",
                  description: "Push-уведомления будут доступны в следующем обновлении",
                });
              }}
              className={cn(
                "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95",
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
            >
              <Bell className="w-5 h-5" />
              {/* Notification dot */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
            
            {/* Settings button */}
            <button
              type="button"
              aria-label="Настройки"
              onClick={() => navigate("/settings")}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95",
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
