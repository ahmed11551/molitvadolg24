import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Импортируем утилиты для тестирования API (только в dev режиме)
if (import.meta.env.DEV) {
  import("./lib/api-test");
}

createRoot(document.getElementById("root")!).render(<App />);
