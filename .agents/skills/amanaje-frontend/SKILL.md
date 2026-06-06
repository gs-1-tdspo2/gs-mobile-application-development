# Skill: amanaje-frontend

## Trigger

Use this skill for any task in the `mobile-application-development-2` workspace that involves the Amanajé React Native / Expo application.

## First instruction

**Always read `docs/AMANAJE_FRONTEND_CONTEXT.md` before planning or writing any code.**

## Quick reference

- **API base:** `https://gs-java-advanced.onrender.com`
- **Stack:** Expo SDK 56 · React Native 0.85 · TypeScript strict · Expo Router
- **Language:** Portuguese-BR for all UI text
- **Constants:** `src/constants/` — colors, api, enums, routes
- **Types:** `src/types/index.ts`
- **API service:** `src/services/api.ts` — use `api.get/post/put/delete` helpers
- **Charts:** use Victory Native XL / `victory-native` as the primary charting solution with `react-native-reanimated`, `react-native-gesture-handler`, and `@shopify/react-native-skia`
- **No fake data:** all data from live API only
- **Cold-start:** first request uses `API_TIMEOUT_COLD_START` (65 s); show visible "aguarde" spinner
- **Context behavior:** if real auth is not verified in the live API, use the Demo Context Selector for Governo/Defesa Civil and ONG. Do not invent JWT/auth flows.

## Constraints

- Never use English text in the UI layer.
- Never mock or fabricate API responses.
- Never skip loading, error, or empty states.
- Always use `StyleSheet.create` — no inline style objects.
- Always use path aliases (`@constants/`, `@services/`, etc.).
- Confirm the exact endpoint path against `docs/AMANAJE_FRONTEND_CONTEXT.md` before coding a screen.
- Never implement Login/Register, Abrigos, Usuários, Relatórios, or manual Alert CRUD unless those endpoints are verified in `docs/AMANAJE_FRONTEND_CONTEXT.md`.
- Never use `react-native-gifted-charts` or `react-native-chart-kit` for Amanajé charts unless explicitly approved later.
- Do not create unsupported workflows. If an endpoint is unavailable, show an "Em breve" or unavailable-state screen instead of fabricating behavior.