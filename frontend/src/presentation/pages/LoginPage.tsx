// frontend/src/presentation/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { loginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import loginBackground from '../../assets/images/login-background.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  // 🔥 LOG PARA DETECTAR RE-RENDERS
  console.log('🔵 LoginPage renderizado'); // Nota: Este log es normal en cada re-render.

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  // 🔥 FUNCIÓN DE SUBMIT - AHORA MANEJA EL EVENTO DEL FORMULARIO
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // <-- 🛑 ¡CLAVE! Previene la recarga por el envío del formulario.
    
    console.log('🟢 INICIO handleSubmit');
    setError('');

    // Validación de campos vacíos
    if (!formData.email || !formData.password) {
      console.log('⚠️ Campos vacíos');
      setError('Por favor completa todos los campos');
      return;
    }

    console.log('✅ Validación OK');
    setIsLoading(true);

    // 🔥 PROMISE SIN ASYNC/AWAIT
    loginUseCase
      .execute(formData)
      .then((response) => {
        console.log('✅ Respuesta recibida:', response);
        
        // Login exitoso
        if (response && response.data) {
          const { user, token } = response.data;
          
          if (user && token) {
            console.log('💾 Guardando auth...');
            setAuth(user, token);
            
            console.log('🏠 Auth guardado, esperando redirección automática...');
            // NO hacemos navigate() - PublicRoute se encargará
          } else {
            console.log('❌ Datos incompletos');
            setError('Error al procesar los datos de autenticación');
            setIsLoading(false);
          }
        } else {
          console.log('❌ Respuesta inválida');
          setError('Respuesta del servidor inválida');
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        console.log('❌ ERROR CAPTURADO:', err);
        
        // Construir mensaje de error amigable
        let errorMessage = 'Usuario o contraseña incorrectos';
        
        if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err?.message) {
          errorMessage = err.message;
        } else if (err?.type === 'LOGIN_ERROR') {
          errorMessage = err.message || 'Error al iniciar sesión';
        }

        console.log('📝 Mostrando error:', errorMessage);
        
        // No necesitamos setTimeout si usamos el estado normal
        console.log('📝 SetError ejecutado');
        setError(errorMessage);
        setIsLoading(false);
      });
    
    console.log('🔚 FIN handleSubmit (async continúa)');
  };

  return (
    <div className="flex h-screen">
      {/* Lado izquierdo - Imagen */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginBackground})` }}
      >
        <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-20">
          <h1 className="text-white text-5xl font-bold">WhatsApp Web</h1>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-whatsapp-green mb-2">
              LOGIN
            </h2>
            <h3 className="text-2xl font-semibold text-whatsapp-green">
              WHATSAPP WEB
            </h3>
          </div>

          {/* 🔥 CAMBIO: Usamos <form> con onSubmit */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Usuario
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Correo electrónico"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:border-transparent"
                disabled={isLoading}
                autoComplete="username"
                // 🔥 ELIMINAMOS el onKeyDown manual
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Contraseña"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:border-transparent"
                disabled={isLoading}
                autoComplete="current-password"
                // 🔥 ELIMINAMOS el onKeyDown manual
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-whatsapp-green border-gray-300 rounded focus:ring-whatsapp-green"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Recordar Contraseña
                </span>
              </label>

              <button
                type="button"
                className="text-sm text-gray-600 hover:text-whatsapp-green"
                disabled={isLoading}
              >
                Olvidé mi Contraseña
              </button>
            </div>

            {/* 🔥 MENSAJE DE ERROR */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <Link
                to="/register"
                className="flex-1 py-3 px-6 bg-whatsapp-green text-white rounded-full font-semibold hover:bg-whatsapp-green-dark transition duration-200 text-center"
              >
                Registrarse
              </Link>

              {/* 🔥 BOTÓN CON TYPE SUBMIT */}
              <button
                type="submit" // <--- CAMBIO IMPORTANTE
                // 🔥 YA NO NECESITA onClick={handleLogin}
                disabled={isLoading}
                className="flex-1 py-3 px-6 bg-whatsapp-green text-white rounded-full font-semibold hover:bg-whatsapp-green-dark transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};