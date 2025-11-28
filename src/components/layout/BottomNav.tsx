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

  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-inset-bottom shadow-lg">
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
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  isActive && "bg-emerald-50"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-[11px] font-medium leading-none",
                  isActive && "text-emerald-600"
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
