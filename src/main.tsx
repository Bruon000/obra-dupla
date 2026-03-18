import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Direcionamento visual: dashboard dark premium como padrão.
// Mantém responsividade e tipografia do tailwind shadcn via variáveis em `index.css`.
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
