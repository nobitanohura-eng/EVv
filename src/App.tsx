/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Contacts from "./pages/Contacts";
import Persona from "./pages/Persona";
import MemoryPage from "./pages/MemoryPage";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import TelegramLogin from "./pages/TelegramLogin";
import { BootSequence } from "./components/BootSequence";
import { useState, useEffect } from "react";

export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('ev_booted') === 'true') {
      setBooted(true);
    }
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem('ev_booted', 'true');
    setBooted(true);
  };

  return (
    <>
      {!booted && <BootSequence onComplete={handleBootComplete} />}
      {booted && (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Home />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="persona" element={<Persona />} />
              <Route path="memory" element={<MemoryPage />} />
              <Route path="logs" element={<Logs />} />
              <Route path="settings" element={<Settings />} />
              <Route path="login" element={<TelegramLogin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}
