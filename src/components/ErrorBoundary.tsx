import React, { Component, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ [ErrorBoundary] Erro React capturado:', {
      error,
      errorInfo,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen quiz-gradient-bg p-6 flex items-center justify-center">
          <Card className="quiz-card-gradient border-white/10 p-8 w-full max-w-md text-center">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-quiz-warning mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Oops! Algo deu errado</h2>
              <p className="text-white/80 mb-6">
                O aplicativo encontrou um erro, mas você pode tentar novamente.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={this.handleReset}
                className="w-full quiz-gradient-bg hover:opacity-90"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Recarregar Página
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-white/60 cursor-pointer mb-2">
                  Detalhes técnicos
                </summary>
                <pre className="text-xs text-white/40 bg-black/20 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}