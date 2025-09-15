import { useEffect, useRef } from 'react';

interface NetworkMessage {
  type: 'PLAYER_JOINED' | 'PLAYER_BUZZ' | 'PLAYER_ANSWER' | 'GAME_STATE_CHANGE' | 'SYNC_REQUEST' | 'HEARTBEAT' | 'PLAYER_DISCONNECT' | 'SERVER_READY';
  data: any;
  timestamp: number;
  deviceId: string;
}

export const useLocalNetwork = (onMessage: (message: NetworkMessage) => void, playerId?: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const deviceId = useRef(Math.random().toString(36).substr(2, 9));
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Tentar conectar via WebSocket primeiro (para comunicação entre dispositivos)
    const connectWebSocket = () => {
      try {
        // Usar IP específico
        const wsUrl = `ws://192.168.0.14:8081`;
        
        console.log('🌐 [useLocalNetwork] Tentando conectar WebSocket:', wsUrl);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('✅ [useLocalNetwork] WebSocket conectado com sucesso!');
          isConnectedRef.current = true;
          
          // Solicitar sincronização ao conectar
          sendMessage('SYNC_REQUEST', {});
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as NetworkMessage;
            
            // Ignorar mensagens do próprio dispositivo
            if (message.deviceId === deviceId.current) {
              console.log('🚫 [useLocalNetwork] Ignorando mensagem própria via WS:', message.type);
              return;
            }
            
            console.log('📨 [useLocalNetwork] Mensagem WebSocket recebida:', message.type, message);
            onMessage(message);
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
        };

      } catch (error) {
        console.error('❌ [useLocalNetwork] Erro ao criar WebSocket:', error);
        setupBroadcastChannel();
      }
    };

    // Fallback para BroadcastChannel (comunicação local no mesmo navegador)
    const setupBroadcastChannel = () => {
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
      sendMessage('SYNC_REQUEST', {});
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
    } 
    // Fallback para BroadcastChannel
    else if (channelRef.current) {
      channelRef.current.postMessage(message);
      console.log('✅ [useLocalNetwork] Enviado via BroadcastChannel');
    } 
    else {
      console.error('❌ [useLocalNetwork] Nenhum canal disponível para enviar:', type);
    }
  };

  return { sendMessage, deviceId: deviceId.current };
};