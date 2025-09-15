import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface ConnectionStatusProps {
  status: {
    isConnected: boolean;
    quality: 'good' | 'unstable' | 'poor';
    reconnectAttempts: number;
    bufferedMessages: number;
    isReconnecting: boolean;
  };
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  compact = false 
}) => {
  const getStatusColor = () => {
    if (!status.isConnected && status.isReconnecting) return 'orange';
    if (!status.isConnected) return 'red';
    
    switch (status.quality) {
      case 'good': return 'green';
      case 'unstable': return 'yellow';
      case 'poor': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = () => {
    if (!status.isConnected) return <WifiOff className="w-4 h-4" />;
    if (status.quality === 'poor' || status.quality === 'unstable') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (status.isReconnecting) return 'Sincronizando...';
    if (!status.isConnected) return 'Offline';
    
    switch (status.quality) {
      case 'good': return 'Sincronizado';
      case 'unstable': return 'Sincronizando';
      case 'poor': return 'Dessincronizado';
      default: return 'Conectado';
    }
  };

  const getVariant = () => {
    const color = getStatusColor();
    switch (color) {
      case 'green': return 'default';
      case 'yellow': return 'secondary';
      case 'orange': return 'outline';
      case 'red': return 'destructive';
      default: return 'outline';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm text-muted-foreground">
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant={getVariant()}>
          {getStatusText()}
        </Badge>
      </div>
      
      {(status.reconnectAttempts > 0 || status.bufferedMessages > 0) && (
        <div className="text-xs text-muted-foreground space-y-1">
          {status.reconnectAttempts > 0 && (
            <div>Tentativas: {status.reconnectAttempts}</div>
          )}
          {status.bufferedMessages > 0 && (
            <div>Buffer: {status.bufferedMessages} msgs</div>
          )}
        </div>
      )}
    </div>
  );
};