import { Target, BookOpen, Calculator, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/useMobile";

export const BottomNav = () => {
  const location = useLocation();
  const { isMobile } = useMobile();

  const navItems = [
    { path: "/goals", icon: Target, label: "Цели" },
    { path: "/dhikr", icon: BookOpen, label: "Зикры" },
    { path: "/", icon: Calculator, label: "Каза" },
    { path: "/tasbih", icon: Sparkles, label: "Тасбих" },
  ];

  // Скрываем навигацию на десктопе, если не в Telegram Mini App
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50 safe-area-inset-bottom">
      <div className="container mx-auto px-2 max-w-lg">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-[11px] font-medium leading-none",
                  isActive && "text-primary"
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
