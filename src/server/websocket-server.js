import { WebSocketServer } from 'ws';

// Criar servidor WebSocket no IP específico porta 8081
const wss = new WebSocketServer({ 
  port: 8081,
  host: '0.0.0.0' // Aceitar conexões de qualquer IP
});

let deviceIdMap = new Map(); // Mapear conexões para deviceIds

let connectedClients = new Set();

console.log('🚀 Quiz WebSocket Server rodando na porta 8081');
console.log('📡 Aguardando conexões de dispositivos...');

wss.on('connection', function connection(ws, req) {
  const clientIP = req.socket.remoteAddress;
  console.log(`📱 Novo cliente conectado: ${clientIP}`);
  
  connectedClients.add(ws);

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

console.log('🌐 Para acessar de outros dispositivos: ws://SEU_IP:8081');
console.log('💡 Use "node --experimental-modules src/server/websocket-server.js" para iniciar');