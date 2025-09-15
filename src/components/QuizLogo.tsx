import React from 'react';

const QuizLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 quiz-gradient-bg rounded-xl flex items-center justify-center quiz-glow">
          <span className="text-2xl font-bold text-white">Q</span>
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-quiz-warning rounded-full animate-pulse-slow"></div>
      </div>
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-quiz-primary to-quiz-secondary bg-clip-text text-transparent">
          QuizMaster
        </h1>
        <p className="text-sm text-muted-foreground">Jogo Interativo</p>
      </div>
    </div>
  );
};

export default QuizLogo;