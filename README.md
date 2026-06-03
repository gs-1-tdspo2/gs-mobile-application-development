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
EXPO_PUBLIC_API_BASE_URL=https://gs-java-advanced.onrender.com
```

Notas de URL da API:

- Demo Render: `https://gs-java-advanced.onrender.com`
- Swagger UI: `https://gs-java-advanced.onrender.com/swagger-ui/index.html`
- Android Emulator com API local: `http://10.0.2.2:8080`
- iOS Simulator / Web com API local: `http://localhost:8080`
- Celular fisico com Expo Go e API local: `http://YOUR_COMPUTER_LAN_IP:8080`

Use a URL raiz da API como base URL. Nao use a URL do Swagger UI como `EXPO_PUBLIC_API_BASE_URL`.
O app usa `EXPO_PUBLIC_API_BASE_URL` e, se a variavel nao estiver definida, cai para `http://10.0.2.2:8080`.
Reinicie o Expo apos alterar o `.env`.

## Rodar o app

Antes de abrir o app, suba a API Java/Spring Boot localmente na porta `8080`. Esta branch integra as leituras reais de:

- `GET /api/dashboard/summary`
- `GET /api/regioes`
- `GET /api/regioes/{id}`

```bash
npm run start
```

Para a demo mais simples, use a API no Render. O Render pode fazer cold start apos inatividade; se a primeira requisicao demorar ou falhar, aguarde alguns segundos e tente novamente.

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

## Rodar API + mobile juntos

1. Inicie a API Java na porta `8080`.
2. Configure `EXPO_PUBLIC_API_BASE_URL` no `.env` conforme o ambiente.
3. Inicie o app Expo com `npm run start`.

URLs comuns:

- Android Emulator: `http://10.0.2.2:8080`
- iOS Simulator / Web: `http://localhost:8080`
- Celular físico com Expo Go: `http://YOUR_COMPUTER_LAN_IP:8080`

Se a API estiver offline, as telas de Dashboard e Regiões exibem uma mensagem de erro com ação de tentar novamente.

## Demo de Regiões CRUD

A tela `Gerenciar Regiões` manipula dados pela API Java usando:

- `GET /api/regioes`
- `POST /api/regioes`
- `PUT /api/regioes/{id}`
- `DELETE /api/regioes/{id}`

Checklist rápido para demonstração:

1. Inicie a API Java na porta `8080`.
2. Abra `Gerenciar Regiões` no app mobile.
3. Crie uma região.
4. Edite os dados da região criada.
5. Exclua a região e confirme o comportamento retornado pela API.

Se o backend usar exclusão lógica, a região pode continuar na lista como inativa. Nesse caso, valide o badge de status em vez de esperar que ela desapareça.

## Demo de Detalhe e Alertas

A tela `Regiões > Detalhe` consulta:

- `GET /api/regioes/{id}`
- `GET /api/regioes/{id}/risco-atual`
- `GET /api/estacoes/regiao/{idRegiao}`
- `GET /api/regioes/{id}/leituras`

A tela `Alertas` consulta e manipula:

- `GET /api/alertas`
- `PUT /api/alertas/{id}/resolver`

Checklist rápido:

1. Abra `Regiões`.
2. Toque em uma região.
3. Verifique risco atual, estações e últimas leituras.
4. Abra `Alertas`.
5. Use filtros e resolva um alerta ativo, se houver dado de demo disponível.

## Funcionalidades iniciais

- Tela Home/Dashboard integrada ao resumo da API
- Navegacao por Expo Router em `src/app`
- Tela de regioes integrada ao fluxo de leitura da API
- Rota dinamica `/regioes/[id]` com prévia de detalhe
- CRUD de Regiões pela API Java em `Gerenciar Regiões`
- Região Detalhe com risco atual, estações e leituras
- Alertas com listagem, filtros e ação de resolver
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
