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
  addPlayer: (name: string) => string;
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
  
  // Comunicação via rede local
  const handleNetworkMessage = (message: any) => {
    console.log('📡 [QuizContext] Processando mensagem:', message.type, message);
    
    switch (message.type) {
      case 'PLAYER_JOINED':
        console.log('👤 [QuizContext] Jogador tentando entrar:', message.data);
        setState(prev => {
          const existingPlayer = prev.players.find(p => p.id === message.data.id);
          if (existingPlayer) {
            console.log('🔄 [QuizContext] Jogador reconectou:', existingPlayer.name);
            // Jogador reconectou - marcar como conectado
            return {
              ...prev,
              players: prev.players.map(p => 
                p.id === message.data.id ? { ...p, isConnected: true } : p
              ),
            };
          }
          
          console.log('✅ [QuizContext] Novo jogador adicionado:', message.data.name);
          const newState = {
            ...prev,
            players: [...prev.players, { ...message.data, isConnected: true }],
          };
          
          // Auto-start se tiver pelo menos 1 jogador e o jogo estiver esperando
          if (newState.players.length >= 1 && newState.gameState === 'waiting') {
            console.log('🚀 [QuizContext] Auto-iniciando jogo com', newState.players.length, 'jogador(es)');
            return {
              ...newState,
              gameState: 'playing',
              currentQuestion: mockQuestions[0],
              currentQuestionIndex: 0,
            };
          }
          
          return newState;
        });
        break;
        
      case 'HEARTBEAT':
        const { playerId: heartbeatPlayerId } = message.data;
        lastHeartbeatRef.current[heartbeatPlayerId] = Date.now();
        
        // Marcar jogador como conectado se não estiver
        setState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === heartbeatPlayerId ? { ...p, isConnected: true } : p
          ),
        }));
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
        const { playerId, answerIndex } = message.data;
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
        if (window.location.pathname === '/tv') {
          console.log('📺 [QuizContext] Enviando estado atual para sincronização:', state);
          sendNetworkMessage('GAME_STATE_CHANGE', state);
        }
        break;
    }
  };

  const { sendMessage: sendNetworkMessage } = useLocalNetwork(handleNetworkMessage);

  // Monitor heartbeats para detectar jogadores desconectados
  useEffect(() => {
    const checkHeartbeats = setInterval(() => {
      const now = Date.now();
      const timeout = 15000; // 15 segundos sem heartbeat = desconectado
      
      setState(prev => ({
        ...prev,
        players: prev.players.map(p => {
          const lastHeartbeat = lastHeartbeatRef.current[p.id];
          const isConnected = lastHeartbeat && (now - lastHeartbeat) < timeout;
          
          if (p.isConnected && !isConnected) {
            console.log('Jogador', p.name, 'desconectou (timeout)');
          }
          
          return { ...p, isConnected: isConnected || false };
        }),
      }));
    }, 5000);

    return () => clearInterval(checkHeartbeats);
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

  const addPlayer = (name: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      score: 0,
      isConnected: true,
    };

    console.log('➕ [QuizContext] Adicionando jogador:', newPlayer);

    // Enviar via rede PRIMEIRO
    console.log('📡 [QuizContext] Enviando PLAYER_JOINED via BroadcastChannel');
    sendNetworkMessage('PLAYER_JOINED', newPlayer);

    // Depois atualizar estado local
    setState(prev => {
      const newState = {
        ...prev,
        players: [...prev.players, newPlayer],
      };
      console.log('✅ [QuizContext] Estado local atualizado:', newState);
      return newState;
    });

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
    sendNetworkMessage('GAME_STATE_CHANGE', newState);
  };

  const buzzIn = (playerId: string) => {
    console.log('Jogador tentando responder:', playerId);
    if (state.gameState === 'playing') {
      // Enviar via rede
      sendNetworkMessage('PLAYER_BUZZ', { playerId });
      
      setState(prev => ({
        ...prev,
        gameState: 'buzzing',
        activePlayer: playerId,
      }));
    }
  };

  const submitAnswer = (playerId: string, answerIndex: number) => {
    // Enviar via rede
    sendNetworkMessage('PLAYER_ANSWER', { playerId, answerIndex });
    
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
      
      sendNetworkMessage('GAME_STATE_CHANGE', newState);
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
      
      sendNetworkMessage('GAME_STATE_CHANGE', newState);
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
    sendNetworkMessage('GAME_STATE_CHANGE', resetState);
    
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