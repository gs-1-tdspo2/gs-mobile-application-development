# Amanajé — Monitoramento Ambiental e IoT

Frontend web construído com **Expo / React Native Web / Expo Router**.  
Consome a API Java hospedada no Render: `https://gs-java-advanced.onrender.com`

---

## Como executar localmente

```bash
npm install
npx expo start --web --port 8082
```

Acesse `http://localhost:8082` no navegador.

> **CORS:** a API permite requisições da origem `http://localhost:8082`. Sempre use esta porta no desenvolvimento local.

---

## Build web

```bash
npm run build:web
```

Gera o build estático em `dist/`. Para pré-visualizar localmente:

```bash
npm run preview:web
# ou diretamente:
npx serve dist
```

---

## Deploy na Vercel

### Configurações no dashboard da Vercel

| Parâmetro | Valor |
|-----------|-------|
| Framework Preset | **Other** |
| Build Command | `npx expo export -p web` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Variáveis de ambiente

Nenhuma variável de ambiente é obrigatória para o deploy. A URL da API está definida diretamente em `src/constants/api.ts`:

```
https://gs-java-advanced.onrender.com
```

### vercel.json

O arquivo `vercel.json` já está configurado na raiz do projeto. As `rewrites` garantem que o refresh direto em rotas aninhadas (ex.: `/regioes/1`, `/alertas`) não resulte em 404 no Vercel, redirecionando tudo para `index.html` conforme o Expo Router necessita.

---

## Backend — cold start

A API roda no plano gratuito do **Render** e é desligada após ~15 minutos de inatividade.

- O primeiro acesso após inatividade pode levar **30–60 segundos**.
- A tela inicial do app (`/`) faz uma requisição de warm-up em `GET /api/health` com timeout de 65 segundos e exibe `"Aguardando servidor…"` ao usuário durante esse período.
- Após a conexão ser estabelecida, o usuário é redirecionado para a tela de seleção de contexto.

---

## Estrutura de rotas

| Rota | Tela |
|------|------|
| `/` | Warm-up + redirect |
| `/context-selector` | Seleção de perfil de acesso |
| `/(app)/dashboard` | Painel principal |
| `/(app)/regioes` | Lista de regiões |
| `/(app)/regioes/nova` | Cadastrar região |
| `/(app)/regioes/[id]` | Detalhe da região |
| `/(app)/regioes/[id]/editar` | Editar região |
| `/(app)/alertas` | Triagem de alertas |
| `/(app)/indicadores` | Indicadores regionais |
| `/(app)/estacoes` | Estações IoT |

---

## Tecnologias

- Expo SDK 56 / React Native 0.85.3
- Expo Router (file-based routing)
- TypeScript strict
- `@shopify/react-native-skia` (gráficos)
- `victory-native` (charts)
- `react-native-svg`
