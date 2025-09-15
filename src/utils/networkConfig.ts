// Utilitários para configuração automática de rede
export const getNetworkConfig = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const currentPort = window.location.port;
  
  // Calcular porta do WebSocket baseada na porta web atual
  let wsPort = '8081'; // Porta padrão
  
  if (currentPort) {
    // Se tem porta específica, usar porta+1 para WebSocket
    wsPort = (parseInt(currentPort) + 1).toString();
  } else {
    // Se não tem porta (porta 80/443), usar 8081
    wsPort = '8081';
  }
  
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