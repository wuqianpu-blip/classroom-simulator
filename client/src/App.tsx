import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AuthPage } from './components/Auth/AuthPage';
import { LobbyPage } from './components/Lobby/LobbyPage';
import { GamePage } from './components/Game/GamePage';
import { ResultPage } from './components/Game/ResultPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { nickname } = useAuthStore();
  if (!nickname) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/lobby" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
        <Route path="/game/:roomCode" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
