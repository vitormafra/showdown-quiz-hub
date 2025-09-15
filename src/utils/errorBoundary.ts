import { toast } from '@/hooks/use-toast';

export const withErrorBoundary = <T extends any[], R>(
  fn: (...args: T) => R,
  fallback?: (...args: T) => R
): ((...args: T) => R) => {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('❌ [ErrorBoundary] Erro capturado:', error);
      
      // Mostrar toast de erro apenas se não for um erro de rede
      if (!(error instanceof Error && error.message.includes('Network'))) {
        toast({
          title: "Erro interno",
          description: "Algo deu errado. Tente novamente.",
          variant: "destructive"
        });
      }
      
      if (fallback) {
        return fallback(...args);
      }
      
      throw error;
    }
  };
};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('❌ [safeLocalStorage] Erro ao ler:', key, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('❌ [safeLocalStorage] Erro ao salvar:', key, error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('❌ [safeLocalStorage] Erro ao remover:', key, error);
      return false;
    }
  }
};