import { WebSocketServer } from 'ws';

// Detectar automaticamente a porta baseada nos argumentos ou usar 8081 como padrão
const port = process.argv[2] || 8081;

// Criar servidor WebSocket no IP específico com configurações mais estáveis
const wss = new WebSocketServer({ 
  port: parseInt(port),
  host: '0.0.0.0', // Aceitar conexões de qualquer IP
  // Configurações para heartbeat mais tranquilo
  perMessageDeflate: false,
  clientTracking: true,
  maxPayload: 16 * 1024 * 1024 // 16MB
});

let deviceIdMap = new Map(); // Mapear conexões para deviceIds
let connectedClients = new Set();
let clientHeartbeats = new Map(); // Controlar heartbeats mais tranquilos

// Configurações de heartbeat mais estáveis
const HEARTBEAT_INTERVAL = 20000; // 20 segundos entre pings
const HEARTBEAT_TIMEOUT = 60000;  // 60 segundos antes de considerar desconexão

console.log(`🚀 Quiz WebSocket Server rodando na porta ${port}`);
console.log('📡 Aguardando conexões de dispositivos...');

wss.on('connection', function connection(ws, req) {
  const clientIP = req.socket.remoteAddress;
  console.log(`📱 Novo cliente conectado: ${clientIP}`);
  
  connectedClients.add(ws);
  
  // Configurar heartbeat tranquilo para este cliente
  ws.isAlive = true;
  ws.on('pong', () => { 
    ws.isAlive = true; 
  });
  
  // Iniciar heartbeat personalizado
  const heartbeatInterval = setInterval(() => {
    if (ws.isAlive === false) {
      clearInterval(heartbeatInterval);
      clientHeartbeats.delete(ws);
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  }, HEARTBEAT_INTERVAL);
  
  clientHeartbeats.set(ws, heartbeatInterval);

  // Quando receber mensagem, retransmitir para todos os outros clientes
  ws.on('message', function incoming(data) {
    try {
      const message = JSON.parse(data);
      console.log(`📨 [Server] Mensagem recebida:`, message);
      
      // Associar deviceId à conexão
      if (message.deviceId) {
        deviceIdMap.set(ws, message.deviceId);
        console.log(`🔗 [Server] Associando deviceId: ${message.deviceId}`);
      }
      
      // Retransmitir para todos os outros clientes conectados
      connectedClients.forEach(client => {
        if (client !== ws && client.readyState === 1) { // WebSocket.OPEN = 1
          client.send(data);
          console.log(`📤 [Server] Retransmitindo para outro dispositivo:`, message.type);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  });

  // Quando cliente desconectar
  ws.on('close', function close() {
    console.log(`📱 Cliente desconectado: ${clientIP}`);
    
    // Limpar heartbeat
    if (clientHeartbeats.has(ws)) {
      clearInterval(clientHeartbeats.get(ws));
      clientHeartbeats.delete(ws);
    }
    
    // Remover deviceId associado
    if (deviceIdMap.has(ws)) {
      const deviceId = deviceIdMap.get(ws);
      console.log(`🗑️ [Server] Removendo deviceId: ${deviceId}`);
      deviceIdMap.delete(ws);
    }
    
    connectedClients.delete(ws);
    
    // Mostrar clientes conectados
    console.log(`👥 Clientes conectados (${connectedClients.size}):`, 
      Array.from(deviceIdMap.values()));
  });

  // Tratar erros
  ws.on('error', function error(err) {
    console.error('❌ [Server] Erro WebSocket:', err);
    
    // Limpar heartbeat
    if (clientHeartbeats.has(ws)) {
      clearInterval(clientHeartbeats.get(ws));
      clientHeartbeats.delete(ws);
    }
    
    connectedClients.delete(ws);
    
    // Remover deviceId associado
    if (deviceIdMap.has(ws)) {
      deviceIdMap.delete(ws);
    }
  });

  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'SERVER_READY',
    data: { message: 'Conectado ao servidor do quiz!' },
    timestamp: Date.now(),
    deviceId: 'server'
  }));
});

console.log(`🌐 Para acessar de outros dispositivos: ws://SEU_IP:${port}`);
console.log('💡 Use "node src/server/websocket-server.js [porta]" para iniciar');
console.log('💡 Exemplo: node src/server/websocket-server.js 8081');