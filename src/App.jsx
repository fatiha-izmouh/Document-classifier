import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import { HistoryProvider } from "./contexts/HistoryContext"; // ✅ import your provider

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <BrowserRouter>
      <HistoryProvider> 
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route
            path="/"
            element={isAuthenticated ? <Index /> : <Navigate to="/login" />}
          />
          <Route
            path="/history"
            element={isAuthenticated ? <History /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HistoryProvider>
    </BrowserRouter>
  );
};

export default App;
