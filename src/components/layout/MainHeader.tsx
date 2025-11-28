import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const MainHeader = () => {
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  
  const getPageInfo = () => {
    switch (location.pathname) {
      case "/goals":
        return { title: "Цели", subtitle: "Привычки и достижения" };
      case "/dhikr":
        return { title: "Зикры", subtitle: "Дуа и поминания" };
      case "/tasbih":
        return { title: "Тасбих", subtitle: "Счётчик зикров" };
      default:
        return { title: "Каза", subtitle: "Пропущенные намазы" };
    }
  };

  const { title, subtitle } = getPageInfo();
  const logoUrl = "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/cc/e2/51/cce2511d-7436-95af-c944-7dda394c0c3b/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png/1200x630wa.png";

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/30">
      <div className="container mx-auto px-4 py-3 max-w-lg">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md bg-primary flex items-center justify-center">
              {!logoError ? (
                <img 
                  src={logoUrl}
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">{title}</h1>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
