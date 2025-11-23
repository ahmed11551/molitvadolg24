import { Home, BookOpen, Target } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/useMobile";

export const BottomNav = () => {
  const location = useLocation();
  const { isMobile } = useMobile();

  const navItems = [
    { path: "/", icon: Home, label: "Каза" },
    { path: "/dhikr", icon: BookOpen, label: "Зикры" },
    { path: "/spiritual-path", icon: Target, label: "Путь" },
  ];

  // Скрываем навигацию на десктопе, если не в Telegram Mini App
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 backdrop-blur-xl z-50 safe-area-inset-bottom shadow-lg">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex justify-around items-center h-14 sm:h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center gap-0.5 sm:gap-1 px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl transition-all duration-300 group relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-xl shadow-inner" />
                )}
                <Icon className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 relative z-10",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )} />
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium relative z-10 leading-tight",
                  isActive && "gradient-text"
                )}>
                  {label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full shadow-glow" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
