import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const addPlayer = (name: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      score: 0,
      isConnected: true,
    };

    setState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer],
    }));

    return newPlayer.id;
  };

  const startGame = () => {
    setState(prev => ({
      ...prev,
      gameState: 'playing',
      currentQuestion: mockQuestions[0],
      currentQuestionIndex: 0,
    }));
  };

  const buzzIn = (playerId: string) => {
    if (state.gameState === 'playing') {
      setState(prev => ({
        ...prev,
        gameState: 'buzzing',
        activePlayer: playerId,
      }));
    }
  };

  const submitAnswer = (playerId: string, answerIndex: number) => {
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
      setState(prev => ({
        ...prev,
        gameState: 'finished',
        currentQuestion: null,
        activePlayer: null,
      }));
    } else {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        currentQuestion: mockQuestions[nextIndex],
        gameState: 'playing',
        activePlayer: null,
      }));
    }
  };

  const resetGame = () => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => ({ ...p, score: 0 })),
      currentQuestion: null,
      currentQuestionIndex: 0,
      gameState: 'waiting',
      activePlayer: null,
    }));
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