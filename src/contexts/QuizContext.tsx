import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useLocalNetwork } from '@/hooks/useLocalNetwork';

export interface Player {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizState {
  players: Player[];
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  gameState: 'waiting' | 'playing' | 'buzzing' | 'answering' | 'results' | 'finished';
  activePlayer: string | null;
  totalQuestions: number;
  roomCode: string;
}

interface QuizContextType {
  state: QuizState;
  addPlayer: (name: string, customId?: string) => string;
  startGame: () => void;
  buzzIn: (playerId: string) => void;
  submitAnswer: (playerId: string, answerIndex: number) => void;
  nextQuestion: () => void;
  resetGame: () => void;
  connectionStatus: {
    isConnected: boolean;
    quality: 'good' | 'unstable' | 'poor';
    reconnectAttempts: number;
    bufferedMessages: number;
    isReconnecting: boolean;
  };
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const mockQuestions: Question[] = [
  {
    id: '1',
    question: 'O que é a FOTOPOP?',
    options: ['Uma rede social', 'Empresa de photo booths premium', 'App de edição', 'Loja de câmeras'],
    correctAnswer: 1,
  },
  {
    id: '2',
    question: 'Para que tipo de eventos a FOTOPOP oferece serviços?',
    options: ['Apenas casamentos', 'Eventos corporativos e luxo', 'Festa infantil', 'Apenas aniversários'],
    correctAnswer: 1,
  },
  {
    id: '3',
    question: 'Qual é o diferencial dos photo booths da FOTOPOP?',
    options: ['Mais barato', 'Tecnologia premium e experiências interativas', 'Apenas preto e branco', 'Sem impressão'],
    correctAnswer: 1,
  },
  {
    id: '4',
    question: 'Além de photo booths tradicionais, que outros serviços a FOTOPOP oferece?',
    options: ['Apenas fotos', 'Glambot e experiências customizadas', 'Só vídeos', 'Apenas selfies'],
    correctAnswer: 1,
  },
  {
    id: '5',
    question: 'Quantos clientes satisfeitos a FOTOPOP já atendeu?',
    options: ['Menos de 100', 'Mais de 970', 'Exatamente 500', 'Não divulga'],
    correctAnswer: 1,
  },
];

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<QuizState>({
    players: [],
    currentQuestion: null,
    currentQuestionIndex: 0,
    gameState: 'waiting',
    activePlayer: null,
    totalQuestions: mockQuestions.length,
    roomCode: 'QUIZ123',
  });

  // Controle de heartbeat e jogadores conectados
  const lastHeartbeatRef = useRef<{ [playerId: string]: number }>({});
  const connectionTimeoutRef = useRef<{ [playerId: string]: NodeJS.Timeout }>({});
  
  // Identificar se este dispositivo é a TV (host autoritativo)
  const isTV = window.location.pathname === '/tv';
  
  // Sistema de sincronização robusto
  const lastSyncRef = useRef(Date.now());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Comunicação via rede local
  const handleNetworkMessage = React.useCallback((message: any) => {
    console.log('📡 [QuizContext] Processando mensagem:', message.type, message);
    console.log('🌍 [QuizContext] Rota atual:', window.location.pathname, 'isTV:', isTV);
    
    switch (message.type) {
      case 'PLAYER_JOINED':
        // Apenas a TV processa entrada de jogadores
        if (isTV) {
          console.log('👤 [QuizContext] TV processando novo jogador:', message.data);
          setState(prev => {
            const existingPlayer = prev.players.find(p => p.id === message.data.id);
            if (existingPlayer) {
              console.log('🔄 [QuizContext] Jogador reconectou:', existingPlayer.name);
              const newState = {
                ...prev,
                players: prev.players.map(p => 
                  p.id === message.data.id ? { ...p, isConnected: true } : p
                ),
                timestamp: Date.now()
              };
              // TV sempre broadcast o estado completo para todos
              if (sendNetworkMessage) {
                setTimeout(() => {
                  sendNetworkMessage('STATE_SYNC', newState);
                }, 200);
              }
              return newState;
            }
            
            console.log('✅ [QuizContext] Novo jogador adicionado:', message.data.name);
            const newState = {
              ...prev,
              players: [...prev.players, { ...message.data, isConnected: true }],
              timestamp: Date.now()
            };
            
            // TV sempre broadcast o estado completo para todos
            if (sendNetworkMessage) {
              setTimeout(() => {
                sendNetworkMessage('STATE_SYNC', newState);
              }, 200);
            }
            
            return newState;
          });
        } else {
          console.log('📱 [QuizContext] Jogador ignora PLAYER_JOINED (não é TV)');
        }
        break;
        
      case 'HEARTBEAT':
        // Apenas a TV gerencia heartbeats
        if (isTV) {
          const { playerId: heartbeatPlayerId } = message.data;
          lastHeartbeatRef.current[heartbeatPlayerId] = Date.now();
          
          if (connectionTimeoutRef.current[heartbeatPlayerId]) {
            clearTimeout(connectionTimeoutRef.current[heartbeatPlayerId]);
          }
          
          connectionTimeoutRef.current[heartbeatPlayerId] = setTimeout(() => {
            setState(prev => {
              const player = prev.players.find(p => p.id === heartbeatPlayerId);
              if (player && !player.isConnected) {
                console.log('💚 [QuizContext] TV marcou jogador conectado:', player.name);
                const newState = {
                  ...prev,
                  players: prev.players.map(p => 
                    p.id === heartbeatPlayerId ? { ...p, isConnected: true } : p
                  ),
                  timestamp: Date.now()
                };
                // TV broadcast estado atualizado
                if (sendNetworkMessage) {
                  sendNetworkMessage('STATE_SYNC', newState);
                }
                return newState;
              }
              return prev;
            });
            delete connectionTimeoutRef.current[heartbeatPlayerId];
          }, 1000);
        }
        break;
        
      case 'PLAYER_BUZZ':
        // Apenas a TV processa buzzer
        if (isTV) {
          setState(prev => {
            const newState = {
              ...prev,
              gameState: 'buzzing' as const,
              activePlayer: message.data.playerId,
              timestamp: Date.now()
            };
            // TV broadcast estado atualizado imediatamente
            if (sendNetworkMessage) {
              sendNetworkMessage('STATE_SYNC', newState);
            }
            return newState;
          });
        }
        break;
        
      case 'PLAYER_ANSWER':
        // Apenas a TV processa respostas
        if (isTV) {
          setState(prev => {
            const { playerId, answerIndex } = message.data;
            const player = prev.players.find(p => p.id === playerId);
            const isCorrect = answerIndex === prev.currentQuestion?.correctAnswer;

            let newState;
            if (player && isCorrect) {
              newState = {
                ...prev,
                players: prev.players.map(p =>
                  p.id === playerId ? { ...p, score: p.score + 10 } : p
                ),
                gameState: 'results' as const,
                timestamp: Date.now()
              };
            } else {
              newState = {
                ...prev,
                gameState: 'results' as const,
                timestamp: Date.now()
              };
            }
            
            // TV broadcast estado atualizado
            if (sendNetworkMessage) {
              sendNetworkMessage('STATE_SYNC', newState);
            }
            
            return newState;
          });
        }
        break;
        
      case 'STATE_SYNC':
        // Jogadores recebem estado completo da TV (com verificação de timestamp)
        if (!isTV && message.data) {
          const messageTimestamp = message.data.timestamp || 0;
          
          // Aceitar apenas se for mais recente
          if (messageTimestamp > lastSyncRef.current) {
            console.log('🔄 [QuizContext] Jogador sincronizando com TV:', message.data);
            setState(message.data);
            lastSyncRef.current = messageTimestamp;
            
            // Limpar timeout de sincronização pendente
            if (syncTimeoutRef.current) {
              clearTimeout(syncTimeoutRef.current);
              syncTimeoutRef.current = null;
            }
          } else {
            console.log('⏭️ [QuizContext] Ignorando sincronização antiga');
          }
        }
        break;
        
      case 'SYNC_REQUEST':
        // Apenas a TV responde com estado completo
        if (isTV && sendNetworkMessage) {
          console.log('📺 [QuizContext] TV enviando estado para sincronização');
          setState(currentState => {
            const stateWithTimestamp = {
              ...currentState,
              timestamp: Date.now()
            };
            sendNetworkMessage('STATE_SYNC', stateWithTimestamp);
            return stateWithTimestamp;
          });
        }
        break;
        
      case 'SERVER_READY':
        console.log('✅ [QuizContext] Servidor WebSocket pronto!');
        // Jogadores solicitam sincronização quando servidor estiver pronto
        if (!isTV && sendNetworkMessage) {
          console.log('📱 [QuizContext] Solicitando sincronização da TV...');
          setTimeout(() => {
            sendNetworkMessage('SYNC_REQUEST', {});
          }, 1000);
        }
        break;
    }
  }, [isTV]);  // Não incluir sendNetworkMessage aqui para evitar dependência circular

  // Inicializar network
  const { sendMessage: sendNetworkMessage, connectionStatus } = useLocalNetwork(handleNetworkMessage);

  // Sincronização forçada periódica (apenas TV)
  useEffect(() => {
    if (!isTV || !sendNetworkMessage) return;
    
    const forcedSyncInterval = setInterval(() => {
      console.log('🔄 [QuizContext] TV fazendo sincronização forçada');
      setState(currentState => {
        sendNetworkMessage('STATE_SYNC', {
          ...currentState,
          timestamp: Date.now()
        });
        return currentState;
      });
    }, 8000); // A cada 8 segundos
    
    return () => clearInterval(forcedSyncInterval);
  }, [isTV, sendNetworkMessage]);

  // Monitor heartbeats - apenas a TV faz isso
  useEffect(() => {
    if (!isTV) return; // Apenas a TV monitora heartbeats
    
    const checkHeartbeats = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 segundos sem heartbeat = desconectado (mais tolerante)
      
      setState(prev => {
        let hasChanges = false;
        const updatedPlayers = prev.players.map(p => {
          const lastHeartbeat = lastHeartbeatRef.current[p.id];
          const shouldBeConnected = lastHeartbeat && (now - lastHeartbeat) < timeout;
          
          if (p.isConnected !== shouldBeConnected) {
            hasChanges = true;
            if (!shouldBeConnected) {
              console.log('⚠️ [QuizContext] TV marcou jogador desconectado:', p.name);
            }
          }
          
          return { ...p, isConnected: shouldBeConnected || false };
        });
        
        if (hasChanges) {
          const newState = { ...prev, players: updatedPlayers };
          // TV broadcast mudanças de conexão
          if (sendNetworkMessage) {
            sendNetworkMessage('STATE_SYNC', newState);
          }
          return newState;
        }
        
        return prev;
      });
    }, 20000); // Verificar a cada 20 segundos

    return () => {
      clearInterval(checkHeartbeats);
      Object.values(connectionTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, [isTV, sendNetworkMessage]);

  // Backup localStorage (para persistência local)
  useEffect(() => {
    const savedState = localStorage.getItem('quizState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          players: parsedState.players || [],
          gameState: parsedState.gameState || 'waiting',
        }));
      } catch (error) {
        console.error('Erro ao carregar estado:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('quizState', JSON.stringify(state));
  }, [state]);

  const addPlayer = (name: string, customId?: string) => {
    const newPlayer: Player = {
      id: customId || `player_${Date.now()}`,
      name,
      score: 0,
      isConnected: true,
    };

    console.log('➕ [QuizContext] addPlayer chamado localmente:', newPlayer);
    console.log('📊 [QuizContext] Estado atual antes de adicionar:');
    console.log('  - playersCount:', state.players.length);
    console.log('  - gameState:', state.gameState);
    console.log('  - currentPath:', window.location.pathname);

    // Enviar via rede PRIMEIRO
    console.log('📡 [QuizContext] Enviando PLAYER_JOINED via rede');
    if (sendNetworkMessage) {
      sendNetworkMessage('PLAYER_JOINED', newPlayer);
      console.log('✅ [QuizContext] Mensagem PLAYER_JOINED enviada com sucesso');
    } else {
      console.error('❌ [QuizContext] sendNetworkMessage não disponível!');
    }

    // NÃO atualizar estado local aqui - deixar o handleNetworkMessage cuidar disso
    // para evitar duplicação e garantir consistência
    console.log('⏳ [QuizContext] Aguardando processamento via handleNetworkMessage...');

    return newPlayer.id;
  };

  const startGame = () => {
    // Apenas a TV pode iniciar o jogo
    if (!isTV) return;
    
    console.log('📺 [QuizContext] TV iniciando jogo...');
    const newState = {
      gameState: 'playing' as const,
      currentQuestion: mockQuestions[0],
      currentQuestionIndex: 0,
    };
    
    setState(prev => {
      const completeState = { ...prev, ...newState };
      // TV broadcast estado completo para todos
      if (sendNetworkMessage) {
        sendNetworkMessage('STATE_SYNC', completeState);
      }
      return completeState;
    });
  };

  const buzzIn = (playerId: string) => {
    console.log('Jogador tentando responder:', playerId);
    if (state.gameState === 'playing') {
      // Enviar ação para a TV processar
      if (sendNetworkMessage) {
        sendNetworkMessage('PLAYER_BUZZ', { playerId });
      }
      
      // Jogadores não mudam estado local - apenas a TV
      if (isTV) {
        setState(prev => {
          const newState = {
            ...prev,
            gameState: 'buzzing' as const,
            activePlayer: playerId,
          };
          // TV broadcast estado atualizado
          if (sendNetworkMessage) {
            sendNetworkMessage('STATE_SYNC', newState);
          }
          return newState;
        });
      }
    }
  };

  const submitAnswer = (playerId: string, answerIndex: number) => {
    // Enviar resposta para a TV processar
    if (sendNetworkMessage) {
      sendNetworkMessage('PLAYER_ANSWER', { playerId, answerIndex });
    }
    
    // Apenas a TV processa a resposta e muda o estado
    if (isTV) {
      const player = state.players.find(p => p.id === playerId);
      const isCorrect = answerIndex === state.currentQuestion?.correctAnswer;

      let newState;
      if (player && isCorrect) {
        newState = {
          ...state,
          players: state.players.map(p =>
            p.id === playerId ? { ...p, score: p.score + 10 } : p
          ),
          gameState: 'results' as const,
        };
      } else {
        newState = {
          ...state,
          gameState: 'results' as const,
        };
      }
      
      setState(newState);
      
      // TV broadcast estado atualizado
      if (sendNetworkMessage) {
        sendNetworkMessage('STATE_SYNC', newState);
      }

      // Auto advance after 3 seconds (apenas na TV)
      setTimeout(() => {
        nextQuestion();
      }, 3000);
    }
  };

  const nextQuestion = () => {
    // Apenas a TV pode avançar questões
    if (!isTV) return;
    
    const nextIndex = state.currentQuestionIndex + 1;
    
    let newState;
    if (nextIndex >= mockQuestions.length) {
      newState = {
        ...state,
        gameState: 'finished' as const,
        currentQuestion: null,
        activePlayer: null,
      };
    } else {
      newState = {
        ...state,
        currentQuestionIndex: nextIndex,
        currentQuestion: mockQuestions[nextIndex],
        gameState: 'playing' as const,
        activePlayer: null,
      };
    }
    
    setState(newState);
    
    // TV broadcast estado completo atualizado
    if (sendNetworkMessage) {
      sendNetworkMessage('STATE_SYNC', newState);
    }
  };

  const resetGame = () => {
    // Apenas a TV pode resetar o jogo
    if (!isTV) return;
    
    // Limpar cache localStorage
    localStorage.removeItem('quizState');
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    
    // Limpar heartbeats
    lastHeartbeatRef.current = {};
    
    const resetState = {
      players: [], // Limpar todos os jogadores para forçar reconexão
      currentQuestion: null,
      currentQuestionIndex: 0,
      gameState: 'waiting' as const,
      activePlayer: null,
      totalQuestions: mockQuestions.length,
      roomCode: 'QUIZ123',
    };
    
    setState(resetState);
    
    // TV broadcast estado resetado para todos
    if (sendNetworkMessage) {
      sendNetworkMessage('STATE_SYNC', resetState);
    }
    
    console.log('📺 [QuizContext] TV resetou jogo - estado limpo');
  };

  return (
    <QuizContext.Provider
      value={{
        state,
        addPlayer,
        startGame,
        buzzIn,
        submitAnswer,
        nextQuestion,
        resetGame,
        connectionStatus,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};