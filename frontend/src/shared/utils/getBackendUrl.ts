// frontend/src/shared/utils/getBackendUrl.ts
/**
 * Detecta automáticamente la URL correcta del backend
 * - Si está en localhost: usa localhost:3001
 * - Si está en red remota: usa la misma IP pero con puerto 3001
 * - Si hay variable de entorno: usa esa
 */
export function getBackendUrl(): string {
  // Si hay variable de entorno, usarla primero
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  console.log(`🔍 Detectando backend URL...`);
  console.log(`   Hostname actual: ${hostname}`);
  console.log(`   Protocol: ${protocol}`);

  // Si está en localhost o 127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const backendUrl = 'http://localhost:3001';
    console.log(`   ✅ Modo LOCAL detectado`);
    console.log(`   📍 Backend URL: ${backendUrl}`);
    return backendUrl;
  }

  // Si está en una IP remota (como 10.79.11.219)
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    const backendUrl = `${protocol}//${hostname}:3001`;
    console.log(`   ✅ Modo REMOTO detectado`);
    console.log(`   📍 Backend URL: ${backendUrl}`);
    return backendUrl;
  }

  // Fallback: asumir localhost
  console.warn(`   ⚠️ No se pudo detectar modo, usando localhost como fallback`);
  return 'http://localhost:3001';
}

export function getApiUrl(): string {
  return `${getBackendUrl()}/api`;
}
