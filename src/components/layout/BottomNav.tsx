import { Target, BookOpen, Calculator, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/useMobile";
import { useTheme } from "@/contexts/ThemeContext";

export const BottomNav = () => {
  const location = useLocation();
  const { isMobile } = useMobile();
  const { isDark } = useTheme();

  const navItems = [
    { path: "/goals", icon: Target, label: "Цели", color: "emerald" },
    { path: "/dhikr", icon: BookOpen, label: "Зикры", color: "blue" },
    { path: "/", icon: Calculator, label: "Каза", color: "purple" },
    { path: "/tasbih", icon: Sparkles, label: "Тасбих", color: "orange" },
  ];

  if (!isMobile) {
    return null;
  }

  const getActiveStyles = (color: string, isActive: boolean) => {
    if (!isActive) return { 
      bg: "", 
      text: isDark ? "text-gray-500" : "text-gray-400", 
      iconBg: "" 
    };
    
    switch (color) {
      case "emerald": return { 
        bg: "bg-emerald-500", 
        text: isDark ? "text-emerald-400" : "text-emerald-600", 
        iconBg: isDark ? "bg-emerald-500/20" : "bg-emerald-50" 
      };
      case "blue": return { 
        bg: "bg-blue-500", 
        text: isDark ? "text-blue-400" : "text-blue-600", 
        iconBg: isDark ? "bg-blue-500/20" : "bg-blue-50" 
      };
      case "purple": return { 
        bg: "bg-purple-500", 
        text: isDark ? "text-purple-400" : "text-purple-600", 
        iconBg: isDark ? "bg-purple-500/20" : "bg-purple-50" 
      };
      case "orange": return { 
        bg: "bg-orange-500", 
        text: isDark ? "text-orange-400" : "text-orange-600", 
        iconBg: isDark ? "bg-orange-500/20" : "bg-orange-50" 
      };
      default: return { 
        bg: "bg-emerald-500", 
        text: isDark ? "text-emerald-400" : "text-emerald-600", 
        iconBg: isDark ? "bg-emerald-500/20" : "bg-emerald-50" 
      };
    }
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t z-50 safe-area-inset-bottom shadow-2xl",
      isDark 
        ? "bg-gray-900/95 border-gray-700" 
        : "bg-white/95 border-gray-100"
    )}>
      <div className="container mx-auto px-2 max-w-lg">
        <div className="flex justify-around items-center h-18 py-1">
          {navItems.map(({ path, icon: Icon, label, color }) => {
            const isActive = location.pathname === path;
            const styles = getActiveStyles(color, isActive);
            
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 min-w-[60px]",
                  "active:scale-90",
                  isActive ? styles.text : (isDark ? "text-gray-500 hover:text-gray-400" : "text-gray-400 hover:text-gray-600")
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                  isActive ? styles.iconBg : "bg-transparent"
                )}>
                  {/* Индикатор активной вкладки */}
                  {isActive && (
                    <div className={cn(
                      "absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full",
                      styles.bg
                    )} />
                  )}
                  <Icon className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold leading-none transition-all duration-300",
                  isActive ? styles.text : (isDark ? "text-gray-500" : "text-gray-400")
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
