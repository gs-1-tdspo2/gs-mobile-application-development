# Amanajé Mobile

Aplicativo mobile do MVP Amanajé para monitoramento climático e ambiental de regiões vulneráveis. Esta primeira entrega prepara a base em Expo, TypeScript, Expo Router, Axios e uma arquitetura inicial limpa para as próximas funcionalidades.

## Stack

- Expo
- React Native
- TypeScript
- Expo Router
- Axios
- ESLint com configuracao Expo

## Requisitos

- Node.js LTS
- npm
- Expo Go, Android Emulator, iOS Simulator ou navegador web
- API Java Amanaje rodando na porta `8080`

## Instalar dependencias

```bash
npm install
```

## Configurar ambiente

Crie um arquivo `.env` na raiz usando `.env.example` como referencia:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080
```

Notas de URL da API:

- Android Emulator: `http://10.0.2.2:8080`
- iOS Simulator / Web: `http://localhost:8080`
- Celular fisico com Expo Go: `http://YOUR_COMPUTER_LAN_IP:8080`

O app usa `EXPO_PUBLIC_API_BASE_URL` e, se a variavel nao estiver definida, cai para `http://10.0.2.2:8080`.

## Rodar o app

```bash
npm run start
```

Atalhos comuns no terminal do Expo:

- `a`: abrir Android
- `i`: abrir iOS, quando disponivel em macOS
- `w`: abrir Web

Tambem existem scripts diretos:

```bash
npm run android
npm run ios
npm run web
```

## Verificacoes

```bash
npm run lint
npx tsc --noEmit
```

## Funcionalidades iniciais

- Tela Home/Dashboard placeholder com identidade Amanaje
- Navegacao por Expo Router em `src/app`
- Tela de regioes com layout de lista placeholder
- Rota dinamica `/regioes/[id]`
- Telas placeholder para Gerenciar Regioes, Alertas e Indicadores
- Componentes reutilizaveis: `AppButton`, `AppCard`, `EmptyState`, `ErrorState`, `LoadingState`, `RiskBadge`
- Constantes visuais para cores e espacamento
- Cliente Axios configurado em `src/services/api.ts`
- Services tipados preparados para endpoints da API Java

## Estrutura principal

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

## Endpoints de referencia

- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/regioes`
- `GET /api/regioes/{id}`
- `POST /api/regioes`
- `PUT /api/regioes/{id}`
- `DELETE /api/regioes/{id}`
- `GET /api/regioes/{id}/risco-atual`
- `GET /api/estacoes/regiao/{idRegiao}`
- `GET /api/alertas`
- `PUT /api/alertas/{id}/resolver`
- `GET /api/indicadores-regionais`

## Equipe

- Integrante 1: nome / RM
- Integrante 2: nome / RM
- Integrante 3: nome / RM

## Links da entrega

- GitHub Classroom: adicionar link
- Video no YouTube: adicionar link

## Fluxo de branches planejado

Esta branch inicial:

1. `feat/mobile-foundation`

Proximas branches recomendadas apos merge em `main`:

1. `feat/dashboard-regioes-read`
2. `feat/regioes-crud`
3. `feat/region-detail-alerts`
4. `feat/readme-demo-polish`

Apos merge da foundation:

```bash
git checkout main
git pull
git branch -d feat/mobile-foundation
```
