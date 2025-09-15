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
  addPlayer: (name: string) => void;
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
    question: 'Qual é a capital do Brasil?',
    options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
    correctAnswer: 2,
  },
  {
    id: '2',
    question: 'Quantos planetas existem no sistema solar?',
    options: ['7', '8', '9', '10'],
    correctAnswer: 1,
  },
  {
    id: '3',
    question: 'Quem pintou a Mona Lisa?',
    options: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Monet'],
    correctAnswer: 2,
  },
  {
    id: '4',
    question: 'Qual é o maior oceano do mundo?',
    options: ['Atlântico', 'Índico', 'Ártico', 'Pacífico'],
    correctAnswer: 3,
  },
  {
    id: '5',
    question: 'Em que ano o homem pisou na Lua pela primeira vez?',
    options: ['1967', '1969', '1971', '1973'],
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