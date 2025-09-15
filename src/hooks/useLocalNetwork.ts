import { useEffect, useRef } from 'react';
import { getNetworkConfig, logNetworkInfo } from '@/utils/networkConfig';

interface NetworkMessage {
  type: 'PLAYER_JOINED' | 'PLAYER_BUZZ' | 'PLAYER_ANSWER' | 'GAME_STATE_CHANGE' | 'SYNC_REQUEST' | 'HEARTBEAT' | 'PLAYER_DISCONNECT' | 'SERVER_READY';
  data: any;
  timestamp: number;
  deviceId: string;
}

export const useLocalNetwork = (onMessage: (message: NetworkMessage) => void, playerId?: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const deviceId = useRef(localStorage.getItem('deviceId') || Math.random().toString(36).substr(2, 9));
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  // Salvar deviceId no localStorage
  useEffect(() => {
    localStorage.setItem('deviceId', deviceId.current);
  }, []);

  useEffect(() => {
    // Configuração automática de rede
    const networkConfig = logNetworkInfo();

    // Tentar conectar via WebSocket primeiro (para comunicação entre dispositivos)
    const connectWebSocket = () => {
      try {
        const wsUrl = networkConfig.websocketUrl;
        
        console.log('🌐 [useLocalNetwork] Tentando conectar WebSocket:', wsUrl);
        console.log('🔧 [useLocalNetwork] Configuração de rede:', networkConfig);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('✅ [useLocalNetwork] WebSocket conectado com sucesso!');
          isConnectedRef.current = true;
          
          // Solicitar sincronização ao conectar após um pequeno delay
          setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              sendMessage('SYNC_REQUEST', {});
            }
          }, 1000);
        };

        wsRef.current.onmessage = (event) => {
          try {
            // Verificar se é um Blob e converter para texto
            if (event.data instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const message = JSON.parse(reader.result as string) as NetworkMessage;
                  
                  // Ignorar mensagens do próprio dispositivo
                  if (message.deviceId === deviceId.current) {
                    console.log('🚫 [useLocalNetwork] Ignorando mensagem própria via WS:', message.type);
                    return;
                  }
                  
                  console.log('📨 [useLocalNetwork] Mensagem WebSocket recebida:', message.type, message);
                  onMessage(message);
                } catch (error) {
                  console.error('❌ [useLocalNetwork] Erro ao processar mensagem WebSocket (Blob):', error);
                }
              };
              reader.readAsText(event.data);
            } else {
              // Processar como texto normal
              const message = JSON.parse(event.data) as NetworkMessage;
              
              // Ignorar mensagens do próprio dispositivo
              if (message.deviceId === deviceId.current) {
                console.log('🚫 [useLocalNetwork] Ignorando mensagem própria via WS:', message.type);
                return;
              }
              
              console.log('📨 [useLocalNetwork] Mensagem WebSocket recebida:', message.type, message);
              onMessage(message);
            }
          } catch (error) {
            console.error('❌ [useLocalNetwork] Erro ao processar mensagem WebSocket:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('🔌 [useLocalNetwork] WebSocket desconectado');
          isConnectedRef.current = false;
          
          // Tentar reconectar após 3 segundos
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 [useLocalNetwork] Tentando reconectar WebSocket...');
            connectWebSocket();
          }, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ [useLocalNetwork] Erro WebSocket:', error);
          isConnectedRef.current = false;
          
          // Tentar usar BroadcastChannel como fallback
          setupBroadcastChannel();
        };

      } catch (error) {
        console.error('❌ [useLocalNetwork] Erro ao criar WebSocket:', error);
        setupBroadcastChannel();
      }
    };

    // Fallback para BroadcastChannel (comunicação local no mesmo navegador)
    const setupBroadcastChannel = () => {
      try {
        console.log('📡 [useLocalNetwork] Usando BroadcastChannel como fallback');
        channelRef.current = new BroadcastChannel('quiz-game');
        
        const handleMessage = (event: MessageEvent<NetworkMessage>) => {
          // Ignorar mensagens do próprio dispositivo
          if (event.data.deviceId === deviceId.current) {
            console.log('🚫 [useLocalNetwork] Ignorando mensagem própria via BC:', event.data.type);
            return;
          }
          
          console.log('📨 [useLocalNetwork] Mensagem BroadcastChannel recebida:', event.data.type, event.data);
          onMessage(event.data);
        };

        channelRef.current.addEventListener('message', handleMessage);
        
        // Solicitar sincronização ao conectar
        setTimeout(() => {
          sendMessage('SYNC_REQUEST', {});
        }, 1000);
      } catch (error) {
        console.error('❌ [useLocalNetwork] Erro ao criar BroadcastChannel:', error);
      }
    };

    // Iniciar WebSocket
    connectWebSocket();

    // Configurar heartbeat se for um jogador
    if (playerId) {
      heartbeatIntervalRef.current = setInterval(() => {
        sendMessage('HEARTBEAT', { playerId, timestamp: Date.now() });
      }, 5000); // Heartbeat a cada 5 segundos
    }

    return () => {
      // Enviar sinal de desconexão
      if (playerId) {
        sendMessage('PLAYER_DISCONNECT', { playerId });
      }
      
      // Limpar timeouts e intervals
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Fechar conexões
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [onMessage, playerId]);

  const sendMessage = (type: NetworkMessage['type'], data: any) => {
    const message: NetworkMessage = {
      type,
      data,
      timestamp: Date.now(),
      deviceId: deviceId.current,
    };
    
    console.log('📤 [useLocalNetwork] Enviando:', message.type, message);
    
    // Tentar enviar via WebSocket primeiro
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('✅ [useLocalNetwork] Enviado via WebSocket');
      return true;
    } 
    // Fallback para BroadcastChannel
    else if (channelRef.current) {
      channelRef.current.postMessage(message);
      console.log('✅ [useLocalNetwork] Enviado via BroadcastChannel');
      return true;
    } 
    else {
      console.error('❌ [useLocalNetwork] Nenhum canal disponível para enviar:', type);
      return false;
    }
  };

  return { sendMessage, deviceId: deviceId.current };
};