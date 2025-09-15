import React, { useState } from 'react';
import { useQuiz } from '@/contexts/QuizContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import QuizLogo from '@/components/QuizLogo';
import { Smartphone, Zap, CheckCircle, XCircle } from 'lucide-react';

const PlayerView: React.FC = () => {
  const { state, addPlayer, buzzIn, submitAnswer } = useQuiz();
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);

  const currentPlayer = playerId ? state.players.find(p => p.id === playerId) : null;
  const isActivePlayer = state.activePlayer === playerId;

  const handleJoinGame = () => {
    if (playerName.trim()) {
      const newPlayerId = addPlayer(playerName.trim());
      setPlayerId(newPlayerId);
    }
  };

  const handleBuzzIn = () => {
    if (playerId && state.gameState === 'playing') {
      buzzIn(playerId);
    }
  };

  const handleAnswerSubmit = (answerIndex: number) => {
    if (playerId && isActivePlayer) {
      submitAnswer(playerId, answerIndex);
    }
  };

  // Not joined yet
  if (!currentPlayer) {
    return (
      <div className="min-h-screen quiz-gradient-bg p-6 flex items-center justify-center">
        <Card className="quiz-card-gradient border-white/10 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <QuizLogo className="justify-center mb-4" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <Smartphone className="w-6 h-6 text-quiz-primary" />
              <span className="text-white text-lg">Tela do Jogador</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">Seu Nome:</label>
              <Input
                type="text"
                placeholder="Digite seu nome"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                maxLength={20}
              />
            </div>

            <Button
              onClick={handleJoinGame}
              disabled={!playerName.trim()}
              className="w-full quiz-gradient-bg hover:opacity-90 text-lg py-6 quiz-glow"
            >
              Entrar no Jogo
            </Button>

            <div className="text-center">
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                Sala: {state.roomCode} | Rede WiFi Local
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen quiz-gradient-bg p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <QuizLogo className="justify-center mb-4" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-quiz-success rounded-full animate-pulse-slow"></div>
            <span className="text-white font-semibold">Conectado como {currentPlayer.name}</span>
          </div>
          <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
            {currentPlayer.score} pontos
          </Badge>
        </div>

        {/* Waiting State */}
        {state.gameState === 'waiting' && (
          <Card className="quiz-card-gradient border-white/10 p-8 text-center">
            <div className="animate-bounce-subtle mb-4">
              <div className="w-16 h-16 bg-quiz-warning rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aguarde...</h3>
            <p className="text-white/80">O quiz começará em breve!</p>
          </Card>
        )}

        {/* Playing - Buzz In */}
        {state.gameState === 'playing' && !isActivePlayer && (
          <Card className="quiz-card-gradient border-white/10 p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-6">Pergunta na tela!</h3>
            <Button
              onClick={handleBuzzIn}
              size="lg"
              className="w-full py-8 text-2xl font-bold quiz-success-gradient hover:opacity-90 quiz-success-glow animate-pulse-slow"
            >
              <Zap className="w-8 h-8 mr-3" />
              RESPONDER!
            </Button>
            <p className="text-white/80 mt-4">Aperte o botão para responder primeiro!</p>
          </Card>
        )}

        {/* Buzzing - Waiting */}
        {state.gameState === 'buzzing' && !isActivePlayer && (
          <Card className="quiz-card-gradient border-white/10 p-8 text-center">
            <div className="animate-pulse-slow mb-4">
              <div className="w-16 h-16 bg-quiz-danger rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tarde demais!</h3>
            <p className="text-white/80">
              {state.players.find(p => p.id === state.activePlayer)?.name} está respondendo...
            </p>
          </Card>
        )}

        {/* Active Player - Answer Options */}
        {(state.gameState === 'buzzing' || state.gameState === 'answering') && isActivePlayer && state.currentQuestion && (
          <Card className="quiz-card-gradient border-white/10 p-6">
            <div className="text-center mb-6">
              <Badge className="quiz-success-gradient text-lg px-4 py-2 mb-4">
                🎯 Sua vez de responder!
              </Badge>
              <h3 className="text-lg font-bold text-white">Escolha sua resposta:</h3>
            </div>

            <div className="space-y-4">
              {state.currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSubmit(index)}
                  variant="outline"
                  className="w-full p-4 h-auto text-left bg-white/10 border-white/20 hover:bg-white/20 text-white justify-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-quiz-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    <span className="text-white font-semibold">{option}</span>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Results State */}
        {state.gameState === 'results' && (
          <Card className="quiz-card-gradient border-white/10 p-8 text-center">
            {isActivePlayer ? (
              <>
                <div className="mb-4">
                  {/* We'll show if they got it right - simplified for now */}
                  <CheckCircle className="w-16 h-16 text-quiz-success mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Resposta enviada!</h3>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-quiz-warning rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aguarde o resultado...</h3>
              </>
            )}
            <p className="text-white/80">Próxima pergunta chegando!</p>
          </Card>
        )}

        {/* Game Finished */}
        {state.gameState === 'finished' && (
          <Card className="quiz-card-gradient border-white/10 p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Quiz Finalizado!</h3>
              <p className="text-white/80 mb-4">Você marcou:</p>
              <div className="text-4xl font-bold text-quiz-warning mb-4">
                {currentPlayer.score} pontos
              </div>
              
              {/* Position */}
              {(() => {
                const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
                const position = sortedPlayers.findIndex(p => p.id === playerId) + 1;
                return (
                  <Badge className={`text-lg px-4 py-2 mb-4 ${
                    position === 1 ? 'quiz-success-gradient' :
                    position === 2 ? 'bg-quiz-secondary' :
                    position === 3 ? 'bg-quiz-warning' : 'bg-muted'
                  }`}>
                    {position === 1 ? '🥇 1º Lugar!' :
                     position === 2 ? '🥈 2º Lugar!' :
                     position === 3 ? '🥉 3º Lugar!' :
                     `${position}º Lugar`}
                  </Badge>
                );
              })()}
            </div>
            
            <div className="border-t border-white/20 pt-4">
              <p className="text-white/80 mb-2">Parabéns por participar!</p>
              <p className="text-white/60 text-sm">
                ⏳ Aguardando próximo jogo...
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlayerView;