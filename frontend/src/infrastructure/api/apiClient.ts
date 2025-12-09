// frontend/src/infrastructure/api/apiClient.ts
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { useAuthStore } from '../../presentation/store/authStore';

// URL pública de ngrok para acceso remoto con HTTPS
// Esta URL es necesaria para que WebRTC funcione desde IPs remotas
const NGROK_BACKEND_URL = 'https://specifically-semihumanistic-maria.ngrok-free.dev/api';

// Detectar si está en localhost o en IP remota
const getApiUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Detectar si es dispositivo móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Si está en localhost, usar localhost:3001 (HTTP) - a menos que sea móvil
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && !isMobile) {
    const url = 'http://localhost:3001/api';
    console.log('✅ API URL detectada (LOCAL):', url);
    return url;
  }
  
  // Si está accediendo desde una IP local en la MISMA RED (10.x.x.x, 192.x.x.x),
  // usar HTTP directo a la IP porque funciona mejor que ngrok para WebRTC local
  if (hostname.match(/^(10\.|192\.|172\.)/)) {
    const url = `http://${hostname}:3001/api`;
    console.log('✅ API URL detectada (RED LOCAL):', url);
    return url;
  }
  
  // Para dispositivos móviles, SIEMPRE usar ngrok HTTPS
  // porque los navegadores móviles son muy restrictivos con WebRTC en HTTP
  if (isMobile) {
    console.log('📱 Dispositivo móvil detectado, usando ngrok HTTPS para WebRTC');
    return NGROK_BACKEND_URL;
  }
  
  // Si está en una IP remota (no en red local), usar ngrok HTTPS para que WebRTC funcione
  console.log('✅ API URL detectada (REMOTO via ngrok):', NGROK_BACKEND_URL);
  return NGROK_BACKEND_URL;
};

class ApiClient {
  private static instance: ApiClient;
  public axios: AxiosInstance;
  private lastBaseURL: string = '';

  private constructor() {
    const API_URL = getApiUrl();
    this.lastBaseURL = API_URL;
    
    this.axios = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        // 👇 Agrega esto para saltar el aviso de ngrok
        'ngrok-skip-browser-warning': 'true',
      },
    });

    // Interceptor de request que actualiza el baseURL si cambió
    this.axios.interceptors.request.use(
      (config) => {
        const currentApiUrl = getApiUrl();
        
        // Si la URL cambió (por ejemplo, se refresca desde otra IP), actualizar baseURL
        if (currentApiUrl !== this.lastBaseURL) {
          console.log('🔄 Actualizando baseURL:', this.lastBaseURL, '→', currentApiUrl);
          this.lastBaseURL = currentApiUrl;
          this.axios.defaults.baseURL = currentApiUrl;
        }
        
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor de respuesta
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const token = localStorage.getItem('token');

        if (status === 401 && token) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }
}

export const apiClient = ApiClient.getInstance().axios;
