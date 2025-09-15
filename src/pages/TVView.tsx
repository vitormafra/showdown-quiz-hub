import React from 'react';
import { useQuiz } from '@/contexts/QuizContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuizLogo from '@/components/QuizLogo';
import { QrCode, Trophy, Users, PlayCircle, SkipForward } from 'lucide-react';

const TVView: React.FC = () => {
  const { state, startGame, nextQuestion, resetGame, startDemo } = useQuiz();

  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const activePlayerName = state.activePlayer 
    ? state.players.find(p => p.id === state.activePlayer)?.name 
    : null;

  return (
    <div className="min-h-screen quiz-gradient-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <QuizLogo />
          <div className="flex gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-5 h-5 mr-2" />
              {state.players.length} Jogadores
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2 bg-white/10 border-white/20">
              Sala: {state.roomCode}
            </Badge>
          </div>
        </div>

        {/* Waiting State */}
        {state.gameState === 'waiting' && (
          <div className="text-center">
            <Card className="quiz-card-gradient border-white/10 p-12 mb-8">
              <div className="mb-8">
                <div className="w-48 h-48 mx-auto mb-6 bg-white/10 rounded-3xl flex flex-col items-center justify-center border-4 border-dashed border-white/30">
                  <QrCode className="w-20 h-20 mb-4 text-white" />
                  <p className="text-white/80 text-lg">Escaneie o QR Code</p>
                  <p className="text-white/60">para participar</p>
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Aguardando Jogadores...
                </h2>
                <p className="text-white/80 text-xl">
                  Acesse: quiz.game/{state.roomCode}
                </p>
              </div>
            </Card>

            {/* Connected Players */}
            {state.players.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Jogadores Conectados:</h3>
                <div className="grid grid-cols-4 gap-4">
                  {state.players.map((player) => (
                    <Card key={player.id} className="quiz-card-gradient border-white/10 p-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-quiz-primary rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-white font-semibold">{player.name}</p>
                        <div className="w-3 h-3 bg-quiz-success rounded-full mx-auto mt-2 animate-pulse-slow"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {state.players.length >= 2 && (
              <div className="flex gap-4 justify-center">
                <Button onClick={startGame} size="lg" className="quiz-gradient-bg hover:opacity-90 text-xl px-8 py-4 quiz-glow">
                  <PlayCircle className="w-6 h-6 mr-2" />
                  Iniciar Quiz Manual
                </Button>
                <Button onClick={startDemo} size="lg" className="bg-quiz-success hover:opacity-90 text-xl px-8 py-4 quiz-success-glow">
                  <PlayCircle className="w-6 h-6 mr-2" />
                  Demo Automático
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Playing State */}
        {(state.gameState === 'playing' || state.gameState === 'buzzing' || state.gameState === 'answering') && state.currentQuestion && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <Badge variant="outline" className="text-lg px-4 py-2 bg-white/10 border-white/20">
                Pergunta {state.currentQuestionIndex + 1} de {state.totalQuestions}
              </Badge>
              {state.gameState === 'buzzing' && activePlayerName && (
                <Badge className="text-lg px-4 py-2 quiz-success-gradient animate-bounce-subtle">
                  🎯 {activePlayerName} responde!
                </Badge>
              )}
            </div>

            <Card className="quiz-card-gradient border-white/10 p-8 mb-8">
              <h2 className="text-4xl font-bold text-white text-center mb-8">
                {state.currentQuestion.question}
              </h2>
              
              <div className="grid grid-cols-2 gap-6">
                {state.currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      state.gameState === 'buzzing' && state.activePlayer
                        ? 'bg-white/5 border-white/20'
                        : 'bg-white/10 border-white/30 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-quiz-primary rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      <p className="text-white text-xl font-semibold">{option}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Admin Controls */}
            <div className="flex justify-center gap-4">
              <Button onClick={nextQuestion} variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
                <SkipForward className="w-4 h-4 mr-2" />
                Próxima Pergunta
              </Button>
            </div>
          </div>
        )}

        {/* Results State */}
        {state.gameState === 'results' && state.currentQuestion && (
          <div>
            <Card className="quiz-card-gradient border-white/10 p-8 mb-8">
              <h2 className="text-3xl font-bold text-white text-center mb-6">
                {state.currentQuestion.question}
              </h2>
              
              <div className="grid grid-cols-2 gap-6">
                {state.currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      index === state.currentQuestion!.correctAnswer
                        ? 'quiz-success-gradient border-quiz-success quiz-success-glow'
                        : 'bg-white/5 border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        index === state.currentQuestion!.correctAnswer
                          ? 'bg-white/20'
                          : 'bg-quiz-primary'
                      }`}>
                        <span className="text-white font-bold text-xl">
                          {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      <p className="text-white text-xl font-semibold">{option}</p>
                      {index === state.currentQuestion!.correctAnswer && (
                        <span className="text-2xl">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Final Results */}
        {state.gameState === 'finished' && (
          <div className="text-center">
            <Card className="quiz-card-gradient border-white/10 p-12 mb-8">
              <Trophy className="w-20 h-20 text-quiz-warning mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-8">🎉 Quiz Finalizado! 🎉</h2>
              
              <div className="space-y-4">
                {sortedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-2xl ${
                      index === 0
                        ? 'quiz-success-gradient quiz-success-glow'
                        : index === 1
                        ? 'bg-quiz-secondary/20 border border-quiz-secondary'
                        : index === 2
                        ? 'bg-quiz-warning/20 border border-quiz-warning'
                        : 'bg-white/10 border border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                      </div>
                      <span className="text-white text-xl font-bold">{player.name}</span>
                    </div>
                    <span className="text-white text-2xl font-bold">{player.score} pts</span>
                  </div>
                ))}
              </div>
            </Card>

            <Button onClick={resetGame} size="lg" className="quiz-gradient-bg hover:opacity-90 text-xl px-8 py-4">
              Novo Quiz
            </Button>
          </div>
        )}

        {/* Scoreboard */}
        {state.players.length > 0 && state.gameState !== 'waiting' && state.gameState !== 'finished' && (
          <Card className="quiz-card-gradient border-white/10 p-6 mt-8">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Placar</h3>
            <div className="flex justify-center gap-8">
              {sortedPlayers.slice(0, 5).map((player, index) => (
                <div key={player.id} className="text-center">
                  <div className="text-2xl mb-1">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                  </div>
                  <p className="text-white font-semibold">{player.name}</p>
                  <p className="text-quiz-primary font-bold">{player.score}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TVView;