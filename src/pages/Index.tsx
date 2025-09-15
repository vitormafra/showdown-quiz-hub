import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import QuizLogo from '@/components/QuizLogo';
import { Monitor, Smartphone, Users, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen quiz-gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <QuizLogo className="justify-center mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Jogo de Quiz Interativo
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Sistema completo para eventos e apresentações com interação em tempo real
          </p>
        </div>

        {/* Mode Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* TV/Host View */}
          <Card className="quiz-card-gradient border-white/10 p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="mb-6">
              <div className="w-20 h-20 bg-quiz-primary rounded-2xl flex items-center justify-center mx-auto mb-4 quiz-glow">
                <Monitor className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Tela Principal</h3>
              <p className="text-white/80 mb-6">
                Para TV, projetor ou tela principal. Exibe perguntas, respostas e placar.
              </p>
            </div>
            
            <Link to="/tv">
              <Button size="lg" className="w-full quiz-gradient-bg hover:opacity-90 text-lg py-4">
                <Monitor className="w-5 h-5 mr-2" />
                Abrir Tela Principal
              </Button>
            </Link>
          </Card>

          {/* Player View */}
          <Card className="quiz-card-gradient border-white/10 p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="mb-6">
              <div className="w-20 h-20 bg-quiz-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 quiz-glow">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Tela do Jogador</h3>
              <p className="text-white/80 mb-6">
                Para celulares e tablets. Os jogadores acessam para participar do quiz.
              </p>
            </div>
            
            <Link to="/player">
              <Button size="lg" className="w-full bg-quiz-secondary hover:opacity-90 text-lg py-4">
                <Smartphone className="w-5 h-5 mr-2" />
                Entrar como Jogador
              </Button>
            </Link>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-quiz-success rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2">Multiplayer</h4>
            <p className="text-white/70 text-sm">Vários jogadores simultâneos</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-quiz-warning rounded-xl flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2">Interativo</h4>
            <p className="text-white/70 text-sm">Sistema de "buzz" para responder</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-quiz-danger rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <h4 className="text-white font-semibold mb-2">Tempo Real</h4>
            <p className="text-white/70 text-sm">Placar atualizado instantaneamente</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 text-center">
          <Card className="quiz-card-gradient border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Como usar em rede WiFi local (sem internet):</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm text-white/80">
              <div>
                <span className="text-quiz-primary font-bold">1.</span> Conecte TV e celulares na mesma rede WiFi
              </div>
              <div>
                <span className="text-quiz-secondary font-bold">2.</span> Abra o jogo na TV: /tv
              </div>
              <div>
                <span className="text-quiz-success font-bold">3.</span> Celulares acessam: /player
              </div>
              <div>
                <span className="text-quiz-warning font-bold">4.</span> Os jogadores aparecerão automaticamente na TV!
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white/10 rounded-lg">
              <p className="text-white font-semibold mb-2">🌐 Funcionamento offline:</p>
              <p className="text-white/70 text-sm">
                Usa BroadcastChannel API para comunicação local entre dispositivos na mesma rede WiFi.
                Não precisa de internet - apenas WiFi local!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
