import { useEffect, useRef } from 'react';
import { getNetworkConfig, logNetworkInfo } from '@/utils/networkConfig';

interface NetworkMessage {
  type: 'PLAYER_JOINED' | 'PLAYER_BUZZ' | 'PLAYER_ANSWER' | 'GAME_STATE_CHANGE' | 'SYNC_REQUEST' | 'HEARTBEAT' | 'PLAYER_DISCONNECT' | 'SERVER_READY' | 'STATE_SYNC';
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
  
  // Configurações adaptáveis de reconexão
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 5000; // 5s inicial
  const maxReconnectDelay = 30000; // 30s máximo
  
  // Estado de qualidade da conexão
  const connectionQualityRef = useRef<'good' | 'unstable' | 'poor'>('good');
  const lastMessageTimestamp = useRef(Date.now());
  const messageBuffer = useRef<NetworkMessage[]>([]);
  const isReconnectingRef = useRef(false);

  // Salvar deviceId no localStorage
  useEffect(() => {
    localStorage.setItem('deviceId', deviceId.current);
  }, []);

  // Função para calcular delay de reconexão com backoff exponencial
  const getReconnectDelay = () => {
    const delay = Math.min(
      baseReconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current),
      maxReconnectDelay
    );
    return delay + Math.random() * 1000; // Jitter para evitar reconexões simultâneas
  };

  // Função para verificar qualidade da conexão
  const updateConnectionQuality = () => {
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTimestamp.current;
    
    if (timeSinceLastMessage < 10000) {
      connectionQualityRef.current = 'good';
    } else if (timeSinceLastMessage < 30000) {
      connectionQualityRef.current = 'unstable';
    } else {
      connectionQualityRef.current = 'poor';
    }
  };

  // Função para verificar se servidor está disponível
  const checkServerAvailability = async (url: string): Promise<boolean> => {
    try {
      // Tentar uma conexão rápida para verificar disponibilidade
      const testWs = new WebSocket(url);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          testWs.close();
          resolve(false);
        }, 3000);
        
        testWs.onopen = () => {
          clearTimeout(timeout);
          testWs.close();
          resolve(true);
        };
        
        testWs.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Configuração automática de rede
    const networkConfig = logNetworkInfo();

    // Função de reconexão inteligente
    const attemptReconnect = async () => {
      if (isReconnectingRef.current || reconnectAttemptsRef.current >= maxReconnectAttempts) {
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('🚫 [useLocalNetwork] Máximo de tentativas de reconexão atingido, usando fallback');
          setupBroadcastChannel();
        }
        return;
      }

      isReconnectingRef.current = true;
      reconnectAttemptsRef.current++;
      
      const delay = getReconnectDelay();
      console.log(`🔄 [useLocalNetwork] Tentativa ${reconnectAttemptsRef.current}/${maxReconnectAttempts} em ${Math.round(delay/1000)}s`);
      
      // Verificar se servidor está disponível antes de tentar reconectar
      const isAvailable = await checkServerAvailability(networkConfig.websocketUrl);
      if (!isAvailable) {
        console.log('🚫 [useLocalNetwork] Servidor não disponível, usando fallback');
        setupBroadcastChannel();
        isReconnectingRef.current = false;
        return;
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        isReconnectingRef.current = false;
        connectWebSocket();
      }, delay);
    };

    // Tentar conectar via WebSocket primeiro (para comunicação entre dispositivos)
    const connectWebSocket = () => {
      if (isReconnectingRef.current) return;
      
      try {
        const wsUrl = networkConfig.websocketUrl;
        
        console.log('🌐 [useLocalNetwork] Tentando conectar WebSocket:', wsUrl);
        console.log('🔧 [useLocalNetwork] Configuração de rede:', networkConfig);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('✅ [useLocalNetwork] WebSocket conectado com sucesso!');
          isConnectedRef.current = true;
          isReconnectingRef.current = false;
          reconnectAttemptsRef.current = 0; // Reset contador de tentativas
          connectionQualityRef.current = 'good';
          lastMessageTimestamp.current = Date.now();
          
          // Processar mensagens em buffer (se houver)
          if (messageBuffer.current.length > 0) {
            console.log(`📤 [useLocalNetwork] Enviando ${messageBuffer.current.length} mensagens em buffer`);
            messageBuffer.current.forEach(msg => {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify(msg));
              }
            });
            messageBuffer.current = [];
          }
          
          // Solicitar sincronização ao conectar após um pequeno delay
          setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              sendMessage('SYNC_REQUEST', {});
            }
          }, 1000);
        };

        wsRef.current.onmessage = (event) => {
          lastMessageTimestamp.current = Date.now();
          updateConnectionQuality();
          
          try {
            // Verificar se é um Blob e converter para texto
            if (event.data instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const result = reader.result as string;
                  if (!result || result.trim() === '') {
                    console.warn('⚠️ [useLocalNetwork] Mensagem Blob vazia ignorada');
                    return;
                  }
                  
                  const message = JSON.parse(result) as NetworkMessage;
                  
                  // Verificação de segurança da mensagem
                  if (!message || !message.type || !message.deviceId) {
                    console.warn('⚠️ [useLocalNetwork] Mensagem Blob inválida ignorada:', message);
                    return;
                  }
                  
                  // Ignorar mensagens do próprio dispositivo
                  if (message.deviceId === deviceId.current) {
                    return;
                  }
                  
                  console.log('📨 [useLocalNetwork] Mensagem WebSocket recebida (Blob):', message.type);
                  onMessage(message);
                } catch (error) {
                  console.error('❌ [useLocalNetwork] Erro ao processar mensagem WebSocket (Blob):', error);
                }
              };
              reader.onerror = () => {
                console.error('❌ [useLocalNetwork] Erro ao ler Blob');
              };
              reader.readAsText(event.data);
            } else {
              // Processar como texto normal
              if (!event.data || event.data.trim() === '') {
                console.warn('⚠️ [useLocalNetwork] Mensagem vazia ignorada');
                return;
              }
              
              const message = JSON.parse(event.data) as NetworkMessage;
              
              // Verificação de segurança da mensagem
              if (!message || !message.type || !message.deviceId) {
                console.warn('⚠️ [useLocalNetwork] Mensagem inválida ignorada:', message);
                return;
              }
              
              // Ignorar mensagens do próprio dispositivo
              if (message.deviceId === deviceId.current) {
                return;
              }
              
              console.log('📨 [useLocalNetwork] Mensagem WebSocket recebida:', message.type);
              onMessage(message);
            }
          } catch (error) {
            console.error('❌ [useLocalNetwork] Erro ao processar mensagem WebSocket:', error);
            // Não quebrar a aplicação por erro de mensagem
          }
        };

        wsRef.current.onclose = () => {
          console.log('🔌 [useLocalNetwork] WebSocket desconectado');
          isConnectedRef.current = false;
          
          // Tentar reconexão inteligente apenas se não for fechamento manual
          if (!isReconnectingRef.current) {
            console.log('🔄 [useLocalNetwork] Iniciando reconexão inteligente...');
            attemptReconnect();
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ [useLocalNetwork] Erro WebSocket:', error);
          isConnectedRef.current = false;
          
          // Usar BroadcastChannel como fallback para erros críticos
          if (reconnectAttemptsRef.current >= 3) {
            console.log('📡 [useLocalNetwork] Muitas falhas, usando BroadcastChannel como fallback');
            setupBroadcastChannel();
          }
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
          lastMessageTimestamp.current = Date.now();
          
          // Ignorar mensagens do próprio dispositivo
          if (event.data.deviceId === deviceId.current) {
            return;
          }
          
          console.log('📨 [useLocalNetwork] Mensagem BroadcastChannel recebida:', event.data.type);
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

  // Heartbeat simplificado apenas para manter conexão viva
    if (playerId) {
      const heartbeatInterval = setInterval(() => {
        sendMessage('HEARTBEAT', { playerId, timestamp: Date.now() });
      }, 30000); // A cada 30 segundos apenas
      
      // Cleanup
      return () => {
        clearInterval(heartbeatInterval);
      };
    }

    return () => {
      // Enviar sinal de desconexão
      if (playerId) {
        sendMessage('PLAYER_DISCONNECT', { playerId });
      }
      
      // Parar reconexões
      isReconnectingRef.current = false;
      
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

  // Função de envio de mensagem com buffer e retry
  const sendMessage = (type: NetworkMessage['type'], data: any) => {
    const message: NetworkMessage = {
      type,
      data,
      timestamp: Date.now(),
      deviceId: deviceId.current,
    };
    
    // Mensagens críticas que devem ser priorizadas
    const criticalMessages = ['PLAYER_BUZZ', 'PLAYER_ANSWER', 'STATE_SYNC'];
    const isCritical = criticalMessages.includes(type);
    
    console.log(`📤 [useLocalNetwork] Enviando${isCritical ? ' (CRÍTICA)' : ''}:`, message.type);
    
    // Tentar enviar via WebSocket primeiro
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('✅ [useLocalNetwork] Enviado via WebSocket');
        return true;
      } catch (error) {
        console.error('❌ [useLocalNetwork] Erro ao enviar via WebSocket:', error);
      }
    }
    
    // Fallback para BroadcastChannel
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(message);
        console.log('✅ [useLocalNetwork] Enviado via BroadcastChannel');
        return true;
      } catch (error) {
        console.error('❌ [useLocalNetwork] Erro ao enviar via BroadcastChannel:', error);
      }
    }
    
    // Buffer para mensagens críticas se nenhum canal estiver disponível
    if (isCritical && messageBuffer.current.length < 10) {
      messageBuffer.current.push(message);
      console.log('📦 [useLocalNetwork] Mensagem crítica adicionada ao buffer');
      return true;
    }
    
    console.error('❌ [useLocalNetwork] Nenhum canal disponível para enviar:', type);
    return false;
  };

  // Status da conexão para debugging
  const getConnectionStatus = () => ({
    isConnected: isConnectedRef.current,
    quality: connectionQualityRef.current,
    reconnectAttempts: reconnectAttemptsRef.current,
    bufferedMessages: messageBuffer.current.length,
    isReconnecting: isReconnectingRef.current,
  });

  return { 
    sendMessage, 
    deviceId: deviceId.current,
    connectionStatus: getConnectionStatus()
  };
};