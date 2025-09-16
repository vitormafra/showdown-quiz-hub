import React from 'react';
import { useQuiz } from '@/contexts/QuizContext';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuizLogo from '@/components/QuizLogo';
import { QrCode, Trophy, Users, PlayCircle, SkipForward, UserCircle } from 'lucide-react';

const TVView: React.FC = () => {
  const { state, startGame, nextQuestion, resetGame, connectionStatus } = useQuiz();

  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const activePlayerName = state.activePlayer 
    ? state.players.find(p => p.id === state.activePlayer)?.name 
    : null;

  // Debug: Log do estado atual
  React.useEffect(() => {
    console.log('TV - Estado atual:', state);
    console.log('TV - Jogadores:', state.players);
  }, [state]);

  return (
    <div className="min-h-screen quiz-gradient-bg p-8">
      {/* Tela cheia "Fulano responde" */}
      {state.gameState === 'buzzing' && activePlayerName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center quiz-gradient-bg">
          <div className="text-center animate-pulse-slow">
            <div className="text-8xl mb-8">🎯</div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 quiz-glow">
              {activePlayerName}
            </h1>
            <h2 className="text-4xl md:text-6xl font-bold text-quiz-warning mb-8">
              RESPONDE!
            </h2>
            <div className="flex justify-center">
              <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="w-full h-full bg-quiz-success animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header Simplificado */}
        <div className="flex justify-between items-center mb-8">
          <QuizLogo />
          <div className="flex items-center gap-4">
            <ConnectionStatus status={connectionStatus} compact />
            {state.gameState !== 'waiting' && (
              <Button 
                onClick={resetGame} 
                variant="outline" 
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              >
                🔄 Reset Completo
              </Button>
            )}
          </div>
        </div>

        {/* Waiting State */}
        {state.gameState === 'waiting' && (
          <div className="text-center">
            <Card className="quiz-card-gradient border-white/10 p-12 mb-8">
              <div className="mb-8">
                <div className="w-64 h-64 mx-auto mb-6 bg-white/10 rounded-3xl flex flex-col items-center justify-center border-4 border-dashed border-white/30">
                  <QrCode className="w-20 h-20 mb-4 text-white" />
                  <p className="text-white/80 text-lg font-bold">Escaneie o QR Code</p>
                  <p className="text-white/60">para participar</p>
                  <p className="text-white/40 text-sm mt-2">Acesse: /player</p>
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Aguardando Jogadores...
                </h2>
                <p className="text-white/80 text-xl">
                  Escaneie o QR Code ou acesse: /player
                </p>
              </div>
            </Card>

            {/* Connected Players */}
            {state.players.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Jogadores Conectados ({state.players.length}):
                </h3>
                <div className="flex justify-center">
                  <div className="grid grid-cols-3 gap-6 max-w-2xl">
                    {state.players.map((player, index) => (
                      <Card key={player.id} className="quiz-card-gradient border-white/10 p-6 animate-bounce-subtle">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-quiz-primary to-quiz-secondary rounded-full flex items-center justify-center mx-auto mb-3 quiz-glow">
                            <UserCircle className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-white font-bold text-lg mb-2">{player.name}</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              player.isConnected 
                                ? 'bg-quiz-success animate-pulse-slow' 
                                : 'bg-quiz-danger'
                            }`}></div>
                            <span className={`text-sm font-semibold ${
                              player.isConnected 
                                ? 'text-quiz-success' 
                                : 'text-quiz-danger'
                            }`}>
                              {player.isConnected ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {state.players.length === 0 && (
              <div className="text-center mb-8">
                <p className="text-white/60 text-lg">Aguardando jogadores se conectarem...</p>
                <p className="text-white/40 text-sm mt-2">
                  📱 Escaneie o QR Code ou acesse /player para entrar
                </p>
              </div>
            )}

            {state.players.length === 1 && (
              <div className="text-center mb-8">
                <p className="text-white/70 text-lg">Aguardando mais jogadores...</p>
                <p className="text-white/50 text-sm mt-2">
                  É mais divertido com pelo menos 2 jogadores!
                </p>
              </div>
            )}

            {state.players.length >= 2 && (
              <Button onClick={startGame} size="lg" className="quiz-gradient-bg hover:opacity-90 text-xl px-8 py-4 quiz-glow">
                <PlayCircle className="w-6 h-6 mr-2" />
                Iniciar Quiz ({state.players.length} jogadores)
              </Button>
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
              
              {/* Botão manual para avançar */}
              <div className="text-center mt-6">
                <p className="text-white/60 mb-4">Próxima pergunta em instantes...</p>
                <Button 
                  onClick={nextQuestion} 
                  variant="outline" 
                  className="bg-quiz-success/20 border-quiz-success/50 hover:bg-quiz-success/30 text-white"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Avançar Agora
                </Button>
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
              
              <div className="space-y-4 mb-8">
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

              {/* Botão de Reset mais visível no centro do card */}
              <div className="bg-white/10 rounded-2xl p-6 border-2 border-dashed border-white/30">
                <h3 className="text-white text-xl font-bold mb-4">Jogar Novamente?</h3>
                <Button 
                  onClick={resetGame} 
                  size="lg" 
                  className="quiz-gradient-bg hover:opacity-90 text-2xl px-12 py-6 quiz-glow animate-pulse-slow"
                >
                  🔄 Resetar Jogo
                </Button>
                <p className="text-white/70 text-sm mt-3">
                  Limpa cache e força reconexão de todos os jogadores
                </p>
              </div>
            </Card>
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