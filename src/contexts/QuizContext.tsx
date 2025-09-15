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
  
  // Comunicação via rede local
  const handleNetworkMessage = React.useCallback((message: any) => {
    console.log('📡 [QuizContext] Processando mensagem:', message.type, message);
    console.log('🌍 [QuizContext] Rota atual:', window.location.pathname);
    
    switch (message.type) {
      case 'PLAYER_JOINED':
        console.log('👤 [QuizContext] Jogador tentando entrar:', message.data);
        setState(prev => {
          console.log('📊 [QuizContext] Estado antes de processar PLAYER_JOINED:');
          console.log('  - playersCount:', prev.players.length);
          console.log('  - gameState:', prev.gameState);
          
          const existingPlayer = prev.players.find(p => p.id === message.data.id);
          if (existingPlayer) {
            console.log('🔄 [QuizContext] Jogador reconectou:', existingPlayer.name);
            // Jogador reconectou - marcar como conectado
            const newState = {
              ...prev,
              players: prev.players.map(p => 
                p.id === message.data.id ? { ...p, isConnected: true } : p
              ),
            };
            console.log('✅ [QuizContext] Estado após reconexão:', newState);
            return newState;
          }
          
          console.log('✅ [QuizContext] Novo jogador sendo adicionado:', message.data.name);
          const newState = {
            ...prev,
            players: [...prev.players, { ...message.data, isConnected: true }],
          };
          console.log('📊 [QuizContext] Novo estado com jogador:');
          console.log('  - playersCount:', newState.players.length);
          console.log('  - gameState:', newState.gameState);
          
          // Auto-start removido - jogo só inicia manualmente
          console.log('⏸️ [QuizContext] Auto-start desabilitado - aguardando início manual');
          
          console.log('⏸️ [QuizContext] Auto-start NÃO executado - condições não atendidas');
          return newState;
        });
        break;
        
      case 'HEARTBEAT':
        const { playerId: heartbeatPlayerId } = message.data;
        lastHeartbeatRef.current[heartbeatPlayerId] = Date.now();
        
        // Debounce para evitar mudanças rápidas de estado de conexão
        if (connectionTimeoutRef.current[heartbeatPlayerId]) {
          clearTimeout(connectionTimeoutRef.current[heartbeatPlayerId]);
        }
        
        // Marcar jogador como conectado com debounce
        connectionTimeoutRef.current[heartbeatPlayerId] = setTimeout(() => {
          setState(prev => {
            const player = prev.players.find(p => p.id === heartbeatPlayerId);
            if (player && !player.isConnected) {
              console.log('💚 [QuizContext] Jogador', player.name, 'conectado via heartbeat');
              return {
                ...prev,
                players: prev.players.map(p => 
                  p.id === heartbeatPlayerId ? { ...p, isConnected: true } : p
                ),
              };
            }
            return prev;
          });
          delete connectionTimeoutRef.current[heartbeatPlayerId];
        }, 1000); // Aguardar 1 segundo antes de marcar como conectado
        break;
        
      case 'PLAYER_DISCONNECT':
        setState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === message.data.playerId ? { ...p, isConnected: false } : p
          ),
        }));
        break;
        
      case 'PLAYER_BUZZ':
        setState(prev => ({
          ...prev,
          gameState: 'buzzing',
          activePlayer: message.data.playerId,
        }));
        break;
        
      case 'PLAYER_ANSWER':
        setState(prev => {
          const { playerId, answerIndex } = message.data;
          const player = prev.players.find(p => p.id === playerId);
          const isCorrect = answerIndex === prev.currentQuestion?.correctAnswer;

          if (player && isCorrect) {
            return {
              ...prev,
              players: prev.players.map(p =>
                p.id === playerId ? { ...p, score: p.score + 10 } : p
              ),
              gameState: 'results',
            };
          } else {
            return {
              ...prev,
              gameState: 'results',
            };
          }
        });
        break;
        
      case 'GAME_STATE_CHANGE':
        setState(prev => ({
          ...prev,
          ...message.data,
        }));
        break;
        
      case 'SYNC_REQUEST':
        console.log('🔄 [QuizContext] SYNC_REQUEST recebido. Rota atual:', window.location.pathname);
        // Responder com o estado atual (apenas a TV)
        if (window.location.pathname === '/tv' && sendNetworkMessage) {
          // Usar setTimeout para garantir que temos o estado mais atual
          setTimeout(() => {
            setState(currentState => {
              console.log('📺 [QuizContext] Enviando estado atual para sincronização:', currentState);
              sendNetworkMessage('GAME_STATE_CHANGE', currentState);
              return currentState;
            });
          }, 100);
        } else {
          console.log('🚫 [QuizContext] Não é TV, ignorando SYNC_REQUEST');
        }
        break;
        
      case 'SERVER_READY':
        console.log('✅ [QuizContext] Servidor WebSocket pronto!');
        console.log('🌐 [QuizContext] Rota atual:', window.location.pathname);
        // Solicitar sincronização quando servidor estiver pronto
        if (window.location.pathname !== '/tv' && sendNetworkMessage) {
          console.log('📱 [QuizContext] Solicitando sincronização como jogador...');
          setTimeout(() => {
            sendNetworkMessage('SYNC_REQUEST', {});
          }, 500);
        } else {
          console.log('📺 [QuizContext] TV não precisa solicitar sincronização');
        }
        break;
    }
  }, []);  // Remover dependências para evitar problemas de closure

  // Inicializar network
  const { sendMessage: sendNetworkMessage } = useLocalNetwork(handleNetworkMessage);

  // Monitor heartbeats para detectar jogadores desconectados (com debounce)
  useEffect(() => {
    const checkHeartbeats = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 segundos sem heartbeat = desconectado (mais tolerante)
      
      setState(prev => {
        let hasChanges = false;
        const updatedPlayers = prev.players.map(p => {
          const lastHeartbeat = lastHeartbeatRef.current[p.id];
          const shouldBeConnected = lastHeartbeat && (now - lastHeartbeat) < timeout;
          
          if (p.isConnected !== shouldBeConnected) {
            hasChanges = true;
            if (!shouldBeConnected) {
              console.log('⚠️ [QuizContext] Jogador', p.name, 'marcado como desconectado (timeout 30s)');
            } else {
              console.log('✅ [QuizContext] Jogador', p.name, 'reconectado');
            }
          }
          
          return { ...p, isConnected: shouldBeConnected || false };
        });
        
        // Só atualizar estado se houve mudanças para reduzir re-renders
        return hasChanges ? { ...prev, players: updatedPlayers } : prev;
      });
    }, 10000); // Verificar a cada 10 segundos (menos frequente)

    return () => {
      clearInterval(checkHeartbeats);
      // Limpar timeouts pendentes
      Object.values(connectionTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

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
    console.log('Iniciando jogo...');
    const newState = {
      gameState: 'playing' as const,
      currentQuestion: mockQuestions[0],
      currentQuestionIndex: 0,
    };
    
    setState(prev => ({
      ...prev,
      ...newState,
    }));
    
    // Sincronizar com rede
    if (sendNetworkMessage) {
      sendNetworkMessage('GAME_STATE_CHANGE', newState);
    }
  };

  const buzzIn = (playerId: string) => {
    console.log('Jogador tentando responder:', playerId);
    if (state.gameState === 'playing') {
      // Enviar via rede
      if (sendNetworkMessage) {
        sendNetworkMessage('PLAYER_BUZZ', { playerId });
      }
      
      setState(prev => ({
        ...prev,
        gameState: 'buzzing',
        activePlayer: playerId,
      }));
    }
  };

  const submitAnswer = (playerId: string, answerIndex: number) => {
    // Enviar via rede
    if (sendNetworkMessage) {
      sendNetworkMessage('PLAYER_ANSWER', { playerId, answerIndex });
    }
    
    const player = state.players.find(p => p.id === playerId);
    const isCorrect = answerIndex === state.currentQuestion?.correctAnswer;

    if (player && isCorrect) {
      setState(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, score: p.score + 10 } : p
        ),
        gameState: 'results',
      }));
    } else {
      setState(prev => ({
        ...prev,
        gameState: 'results',
      }));
    }

    // Auto advance after 3 seconds
    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  const nextQuestion = () => {
    const nextIndex = state.currentQuestionIndex + 1;
    
    if (nextIndex >= mockQuestions.length) {
      const newState = {
        gameState: 'finished' as const,
        currentQuestion: null,
        activePlayer: null,
      };
      
      setState(prev => ({
        ...prev,
        ...newState,
      }));
      
      if (sendNetworkMessage) {
        sendNetworkMessage('GAME_STATE_CHANGE', newState);
      }
    } else {
      const newState = {
        currentQuestionIndex: nextIndex,
        currentQuestion: mockQuestions[nextIndex],
        gameState: 'playing' as const,
        activePlayer: null,
      };
      
      setState(prev => ({
        ...prev,
        ...newState,
      }));
      
      if (sendNetworkMessage) {
        sendNetworkMessage('GAME_STATE_CHANGE', newState);
      }
    }
  };

  const resetGame = () => {
    // Limpar cache localStorage
    localStorage.removeItem('quizState');
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    
    // Limpar heartbeats
    lastHeartbeatRef.current = {};
    
    const resetState = {
      gameState: 'waiting' as const,
      currentQuestion: null,
      currentQuestionIndex: 0,
      activePlayer: null,
      players: [], // Limpar todos os jogadores para forçar reconexão
    };
    
    setState(prev => ({
      ...prev,
      ...resetState,
    }));
    
    // Sincronizar reset com todos os dispositivos
    if (sendNetworkMessage) {
      sendNetworkMessage('GAME_STATE_CHANGE', resetState);
    }
    
    console.log('Jogo resetado - cache limpo, jogadores devem se reconectar');
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