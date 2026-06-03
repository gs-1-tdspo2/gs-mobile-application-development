# Amanajé Mobile

Amanajé Mobile é o aplicativo React Native do MVP de monitoramento climático e ambiental para áreas vulneráveis. O app é focado em usuários institucionais, especialmente **Governo / Defesa Civil** e **ONGs**, consumindo uma API Java/Spring Boot para exibir regiões monitoradas, dados de risco, estações IoT, leituras, alertas, indicadores de dashboard e CRUD de regiões.

## Equipe

- Gustavo — RM: preencher
- Lucca — RM: preencher
- Rafaela — RM: preencher
- Sabelli — RM: preencher

## Links da Entrega

- GitHub Classroom: TODO
- YouTube: TODO

## Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Axios
- Java/Spring Boot API
- Oracle Database
- Render deployment

## Funcionalidades

- Dashboard com resumo de monitoramento.
- Listagem de regiões monitoradas.
- Detalhe da região com risco atual, estações IoT e últimas leituras.
- CRUD completo de Regiões pela API.
- Listagem de alertas ambientais.
- Ação para resolver alertas.
- Tela de indicadores regionais.
- Estados de loading, erro, vazio, sucesso, validação e confirmação.
- Layout responsivo para Web com sidebar desktop, grids e largura máxima de dashboard.

## API

A API de demonstração está publicada no Render:

```text
https://gs-java-advanced.onrender.com
```

Swagger UI:

```text
https://gs-java-advanced.onrender.com/swagger-ui/index.html
```

Use a URL raiz como base da API. Não use a URL do Swagger como `EXPO_PUBLIC_API_BASE_URL`.

O Render pode fazer cold start após inatividade. Se a primeira requisição demorar ou falhar, aguarde alguns segundos e tente novamente.

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Para a demo, use:

```bash
EXPO_PUBLIC_API_BASE_URL=https://gs-java-advanced.onrender.com
```

Reinicie o Expo após alterar o `.env`.

URLs alternativas para backend local:

- Android Emulator: `http://10.0.2.2:8080`
- iOS Simulator / Web: `http://localhost:8080`
- Expo Go em celular físico: `http://YOUR_COMPUTER_LAN_IP:8080`

## Como Rodar Após Clone

```bash
npm install
cp .env.example .env
npx expo start
```

No Windows PowerShell:

```powershell
npm install
Copy-Item .env.example .env
npx expo start
```

Atalhos do Expo:

- `a`: abrir Android
- `i`: abrir iOS, quando disponível em macOS
- `w`: abrir Web

## Preview Web

Para abrir diretamente no navegador:

```bash
npx expo start --web
```

Para gerar a versão estática usada em deploy:

```bash
npx expo export -p web
```

O export gera a pasta `dist`.

## Deploy Web na Vercel

O projeto inclui `vercel.json` com:

- Build command: `npx expo export -p web`
- Output directory: `dist`

Configure a variável de ambiente na Vercel:

```bash
EXPO_PUBLIC_API_BASE_URL=https://gs-java-advanced.onrender.com
```

A URL do Swagger é apenas documentação. A URL base do app web deve continuar sendo `https://gs-java-advanced.onrender.com`.

## Verificações

```bash
npm run lint
npx tsc --noEmit
```

## Rotas do App

- `/` — Home / Dashboard
- `/regioes` — Regiões
- `/regioes/[id]` — Região Detalhe
- `/gerenciar-regioes` — Gerenciar Regiões
- `/alertas` — Alertas
- `/indicadores` — Indicadores

## Endpoints Usados

- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/regioes`
- `GET /api/regioes/{id}`
- `POST /api/regioes`
- `PUT /api/regioes/{id}`
- `DELETE /api/regioes/{id}`
- `GET /api/regioes/{id}/risco-atual`
- `GET /api/estacoes/regiao/{idRegiao}`
- `GET /api/regioes/{id}/leituras`
- `GET /api/alertas`
- `PUT /api/alertas/{id}/resolver`
- `GET /api/indicadores-regionais`

## Checklist de Demo

1. Abrir Home/Dashboard.
2. Abrir Regiões.
3. Abrir uma Região Detalhe.
4. Abrir Gerenciar Regiões.
5. Criar uma região.
6. Editar a região.
7. Excluir a região.
8. Abrir Alertas.
9. Resolver um alerta somente se estiver usando dados seguros de demo.
10. Abrir Indicadores.

## Checklist do Vídeo

- Mostrar o app rodando no Expo/emulador.
- Mostrar rapidamente a configuração de `EXPO_PUBLIC_API_BASE_URL`, se útil.
- Navegar entre pelo menos 5 telas.
- Demonstrar criar, editar e excluir região.
- Mostrar a tela de Alertas.
- Mencionar que o app consome a API Java publicada no Render.

## Estrutura Principal

```text
src/
  app/
  components/
  constants/
  services/
  styles/
  types/
  utils/
```

## Referências de Design

- `DESIGN.md`: referência mobile criada a partir do Stitch.
- `WEB_DESIGN.md`: referência responsiva web/desktop com sidebar, grids e painéis indigo.

## Histórico de Branches

O app foi construído por branches sequenciais de entrega:

1. `feat/mobile-foundation`
2. `feat/stitch-design-reference`
3. `feat/dashboard-regioes-read`
4. `feat/regioes-crud`
5. `feat/region-detail-alerts`
6. `feat/readme-demo-polish`
7. `feat/web-responsive-layout`
