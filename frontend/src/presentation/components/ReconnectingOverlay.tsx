// frontend/src/presentation/components/ReconnectingOverlay.tsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface ReconnectingOverlayProps {
  isVisible: boolean;
  attempt?: number;
}

export const ReconnectingOverlay = ({ isVisible, attempt = 0 }: ReconnectingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        {/* 🔥 ANIMACIÓN DEL CAVERNÍCOLA - MÁS GRANDE */}
        <div className="flex justify-center mb-6">
          <DotLottieReact
            src="https://lottie.host/1137e6d2-98c2-41b1-a52e-adbca95a8a8c/7UVoRUoH34.lottie"
            loop
            autoplay
            style={{ width: 400, height: 400 }}
          />
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Reconectando...
        </h2>

        {/* Descripción */}
        <p className="text-gray-600 mb-4">
          Estamos intentando restablecer la conexión con el servidor
        </p>

        {/* Contador de intentos */}
        {attempt > 0 && (
          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">
              Intento #{attempt}
            </p>
          </div>
        )}

        {/* Barra de progreso animada */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-whatsapp-green h-full rounded-full animate-pulse-slow"></div>
        </div>

        {/* Mensaje adicional */}
        <p className="text-xs text-gray-500 mt-4">
          Por favor, verifica tu conexión a internet
        </p>
      </div>
    </div>
  );
};