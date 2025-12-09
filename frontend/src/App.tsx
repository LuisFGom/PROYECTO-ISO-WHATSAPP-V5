// frontend/src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './presentation/router/AppRouter';
import { SocketProvider } from './presentation/providers/SocketProvider';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      {/* 🔥 Provider global de Socket - Envuelve toda la app */}
      <SocketProvider>
        <AppRouter />
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;