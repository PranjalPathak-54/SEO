import "./index.css";
import App from "./App.tsx";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AuthContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <ThemeProvider>
            <AppProvider>
                <App />
            </AppProvider>
        </ThemeProvider>
    </BrowserRouter>
);
