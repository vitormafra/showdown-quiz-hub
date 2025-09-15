import { useEffect, useRef } from 'react';

interface NetworkMessage {
  type: 'PLAYER_JOINED' | 'PLAYER_BUZZ' | 'PLAYER_ANSWER' | 'GAME_STATE_CHANGE' | 'SYNC_REQUEST' | 'HEARTBEAT' | 'PLAYER_DISCONNECT';
  data: any;
  timestamp: number;
  deviceId: string;
}

export const useLocalNetwork = (onMessage: (message: NetworkMessage) => void, playerId?: string) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const deviceId = useRef(Math.random().toString(36).substr(2, 9));
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Crear canal de comunicação
    channelRef.current = new BroadcastChannel('quiz-game');
    
    const handleMessage = (event: MessageEvent<NetworkMessage>) => {
      // Ignorar mensagens do próprio dispositivo
      if (event.data.deviceId === deviceId.current) return;
      
      console.log('Mensagem recebida via BroadcastChannel:', event.data);
      onMessage(event.data);
    };

    channelRef.current.addEventListener('message', handleMessage);

    // Solicitar sincronização ao conectar
    sendMessage('SYNC_REQUEST', {});

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
      
      // Limpar heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      if (channelRef.current) {
        channelRef.current.removeEventListener('message', handleMessage);
        channelRef.current.close();
      }
    };
  }, [onMessage, playerId]);

  const sendMessage = (type: NetworkMessage['type'], data: any) => {
    if (channelRef.current) {
      const message: NetworkMessage = {
        type,
        data,
        timestamp: Date.now(),
        deviceId: deviceId.current,
      };
      
      console.log('Enviando mensagem via BroadcastChannel:', message);
      channelRef.current.postMessage(message);
    }
  };

  return { sendMessage, deviceId: deviceId.current };
};