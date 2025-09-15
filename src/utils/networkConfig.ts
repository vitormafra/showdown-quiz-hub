// Utilitários para configuração automática de rede
export const getNetworkConfig = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const currentPort = window.location.port;
  
  // Sempre usar porta 8080 para o WebSocket
  const wsPort = '8080';
  
  const wsUrl = `${protocol}//${hostname}:${wsPort}`;
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  
  return {
    websocketUrl: wsUrl,
    baseUrl,
    hostname,
    port: currentPort || (window.location.protocol === 'https:' ? '443' : '80'),
    wsPort,
    isSecure: window.location.protocol === 'https:'
  };
};

export const logNetworkInfo = () => {
  const config = getNetworkConfig();
  console.log('🌐 [NetworkConfig] Configuração detectada:', config);
  return config;
};