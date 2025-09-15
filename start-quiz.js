#!/usr/bin/env node

const { spawn } = require('child_process');
const { networkInterfaces } = require('os');
const path = require('path');

// Função para detectar IP local da rede WiFi
function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Pular endereços internos e não IPv4
      if (net.family === 'IPv4' && !net.internal) {
        // Priorizar IPs da rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (net.address.startsWith('192.168.') || 
            net.address.startsWith('10.') || 
            (net.address.startsWith('172.') && 
             parseInt(net.address.split('.')[1]) >= 16 && 
             parseInt(net.address.split('.')[1]) <= 31)) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
}

// Detectar porta do argumento ou usar padrão
const webPort = process.argv[2] || '8080';
const wsPort = process.argv[3] || (parseInt(webPort) + 1).toString();

const localIP = getLocalIP();

console.log('🚀 Iniciando Quiz Game...');
console.log(`📱 Acesso local: http://localhost:${webPort}`);
console.log(`🌐 Acesso na rede: http://${localIP}:${webPort}`);
console.log('📺 Para TV: acesse /tv');
console.log('📱 Para Jogadores: acessem /player');
console.log(`🔗 WebSocket: ws://${localIP}:${wsPort}`);
console.log('');

// Iniciar WebSocket Server na porta correta
console.log(`🔗 Iniciando WebSocket Server na porta ${wsPort}...`);
const wsServer = spawn('node', ['src/server/websocket-server.js', wsPort], {
  stdio: 'pipe'
});

wsServer.stdout.on('data', (data) => {
  console.log(`📡 [WebSocket] ${data.toString().trim()}`);
});

wsServer.stderr.on('data', (data) => {
  console.error(`❌ [WebSocket] ${data.toString().trim()}`);
});

// Aguardar 2 segundos e iniciar Vite Dev Server na porta especificada
setTimeout(() => {
  console.log(`⚡ Iniciando Vite Dev Server na porta ${webPort}...`);
  const viteServer = spawn('npm', ['run', 'dev', '--', '--port', webPort, '--host', '0.0.0.0'], {
    stdio: 'inherit'
  });
  
  viteServer.on('close', (code) => {
    console.log(`\n🔄 Vite Server encerrado (código ${code})`);
    wsServer.kill();
    process.exit(code);
  });
  
}, 2000);

// Tratar encerramento
function handleExit() {
  console.log('\n🛑 Encerrando servidores...');
  wsServer.kill();
  process.exit(0);
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);