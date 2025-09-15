import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useLocalNetwork } from '@/hooks/useLocalNetwork';
import { safeLocalStorage } from '@/utils/errorBoundary';

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
  timestamp?: number;
}

// Hook para gerenciar dados locais do jogador
export const usePlayerData = () => {
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(
    safeLocalStorage.getItem('playerId')
  );
  const [localPlayerName, setLocalPlayerName] = useState<string | null>(
    safeLocalStorage.getItem('playerName')
  );

  const updateLocalPlayer = (id: string, name: string) => {
    setLocalPlayerId(id);
    setLocalPlayerName(name);
    safeLocalStorage.setItem('playerId', id);
    safeLocalStorage.setItem('playerName', name);
  };

  const clearLocalPlayer = () => {
    setLocalPlayerId(null);
    setLocalPlayerName(null);
    safeLocalStorage.removeItem('playerId');
    safeLocalStorage.removeItem('playerName');
  };

  return {
    localPlayerId,
    localPlayerName,
    updateLocalPlayer,
    clearLocalPlayer
  };
};