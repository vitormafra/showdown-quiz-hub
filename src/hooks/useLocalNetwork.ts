import { useEffect, useRef } from 'react';

interface NetworkMessage {
  type: 'PLAYER_JOINED' | 'PLAYER_BUZZ' | 'PLAYER_ANSWER' | 'GAME_STATE_CHANGE' | 'SYNC_REQUEST';
  data: any;
  timestamp: number;
  deviceId: string;
}

export const useLocalNetwork = (onMessage: (message: NetworkMessage) => void) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const deviceId = useRef(Math.random().toString(36).substr(2, 9));

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

    return () => {
      if (channelRef.current) {
        channelRef.current.removeEventListener('message', handleMessage);
        channelRef.current.close();
      }
    };
  }, [onMessage]);

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