# Quiz Game Multi-Dispositivo 🎮

Sistema de quiz interativo que permite jogadores se conectarem via WiFi usando seus celulares.

## 🚀 Como Usar

### Início Rápido
```bash
# Instalar dependências
npm install

# Iniciar o sistema completo (WebSocket + React)
node start-quiz.js
```

### Manual
```bash
# 1. Iniciar servidor WebSocket para comunicação entre dispositivos
node src/server/websocket-server.js

# 2. Em outro terminal, iniciar a aplicação React
npm run dev
```

## 📱 Acesso Multi-Dispositivo

1. **TV/Apresentação**: Acesse `/tv` no navegador principal
2. **Jogadores**: Cada jogador acessa `/player` no seu celular

### Para acessar de outros dispositivos:
1. Descobrir o IP local da máquina host
2. Acessar `http://[SEU_IP]:8080/player` nos celulares
3. Exemplo: `http://192.168.1.100:8080/player`

## 🔧 Tecnologia

- **WebSocket**: Comunicação em tempo real entre dispositivos na mesma rede WiFi
- **BroadcastChannel**: Fallback para comunicação local (mesma aba/navegador)
- **React + TypeScript**: Interface do usuário
- **Tailwind CSS**: Estilização responsiva

## 🎯 Funcionalidades

- ✅ Reconhecimento automático de jogadores na rede
- ✅ Buzzer system - primeiro a apertar responde
- ✅ Detecção de conexão/desconexão em tempo real
- ✅ Pontuação automática
- ✅ Reset completo do jogo
- ✅ Interface responsiva para celulares e TV

## 📋 Desenvolvimento Original

Este projeto foi criado com Lovable. Para mais informações sobre desenvolvimento e deploy:

**URL**: https://lovable.dev/projects/5fcab197-9212-499f-9563-6d854188bce4
