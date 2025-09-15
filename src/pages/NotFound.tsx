import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import QuizLogo from "@/components/QuizLogo";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen quiz-gradient-bg flex items-center justify-center p-6">
      <Card className="quiz-card-gradient border-white/10 p-12 text-center max-w-md">
        <QuizLogo className="justify-center mb-8" />
        
        <div className="text-8xl mb-6">🤔</div>
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-white/80 mb-8">Oops! Página não encontrada</p>
        
        <Link to="/">
          <Button size="lg" className="quiz-gradient-bg hover:opacity-90 text-lg px-8 py-4">
            <Home className="w-5 h-5 mr-2" />
            Voltar ao Início
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
