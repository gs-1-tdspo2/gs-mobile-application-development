# Amanajé — GS Mobile Application

Monitoramento ambiental e IoT para regiões de risco no Brasil.
Expo SDK 56 · React Native 0.85.3 · TypeScript · Expo Router

---

## Desenvolvimento local

```bash
npm install
npm start           # Metro dev server (Expo Go)
npm run web         # Expo web dev server (browser)
```

## Verificação e build

```bash
npx tsc --noEmit              # TypeScript type-check
npx expo export --platform web  # Build estático para web (→ dist/)
npx serve dist                  # Preview local do build
```

## Deploy — Vercel

O projeto usa `vercel.json` para configurar o Expo Router como SPA:

```json
{
  "buildCommand": "npx expo export -p web",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [{ "source": "/:path*", "destination": "/" }]
}
```

### Tornar o deploy público (Deployment Protection)

Por padrão a Vercel protege deploys com autenticação. Para projetos de demonstração abertos:

1. Abra o projeto em vercel.com
2. Vá em **Settings → Deployment Protection**
3. Desabilite "Vercel Authentication" (ou selecione "Only Preview Deployments")
4. Salve e redeploye

Sem essa configuração, visitantes externos verão uma tela de login da Vercel.

---

## Arquitetura

| Camada | Tecnologia |
|--------|-----------|
| Roteamento | Expo Router (file-based) |
| Charts | Victory Native XL + Skia |
| SVG web-compatible | `SvgDonut` (react-native-svg) |
| API | fetch nativo + AbortController timeout |
| Estado | hooks locais (sem Redux/Zustand) |

## Backend

API REST: `https://gs-java-advanced.onrender.com`

- Cold start: até 60 s após ociosidade (Render free tier).
- O app mostra uma tela de "Aguardando servidor…" durante o aquecimento.
- Endpoints relevantes: `/api/regioes`, `/api/estacoes/regiao/:id`, `/api/regioes/:id/leituras`, `/api/alertas`, `/api/dashboard/summary`, `/api/indicadores-regionais`.

## Variáveis de ambiente

Nenhuma variável de ambiente é necessária. A URL da API está em `src/constants/api.ts`.

---

GS · FIAP 2025
