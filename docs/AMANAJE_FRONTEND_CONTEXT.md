# AMANAJÉ — Frontend Context

> **Rule for all future phases:** Read this file before planning or coding.

---

## 1. Product Purpose

Amanajé is a professional **IoT and environmental monitoring platform** for vulnerable regions in Brazil. It aggregates data from IoT stations (estações), telemetry readings (leituras), external climate observations, and Java-side risk calculations to produce generated alerts (alertas) and regional indicators (indicadores regionais).

The platform supports two operational contexts:
- **Governo / Defesa Civil** — full operational access: region setup, station management, risk triage, alert resolution.
- **ONG** — monitoring and visualization access: read dashboards, view indicators, consult region and alert data.

There is no confirmed authentication system in the current backend. Phase 1 uses a **Demo Context Selector** (Governo/Defesa Civil vs ONG) to simulate role context without a login flow.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo (SDK 56) + React Native 0.85 |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| Target | iOS + Android + Web (mobile-first, desktop-responsive) |
| UI Language | Portuguese-BR |
| Charts | Victory Native XL (`victory-native`) |
| Animation | `react-native-reanimated` |
| Gestures | `react-native-gesture-handler` |
| 2D Canvas | `@shopify/react-native-skia` (Victory Native XL peer dep) |

---

## 3. API

- **Base URL:** `https://gs-java-advanced.onrender.com`
- Do **not** use the Swagger URL as the API base URL.
- All Java endpoints use the **`/api` prefix**.
- No authentication header is required (no confirmed auth system).

### 3.1 Endpoint Inventory

> Do not add endpoints that are not listed here. Verify any new path against the live API before implementing.

#### Health
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check / warm-up probe |

#### Clientes
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/clientes` | List clients (organizations) |
| POST | `/api/clientes` | Register a client |

#### Regiões
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/regioes` | List all regions |
| POST | `/api/regioes` | Create a region |
| GET | `/api/regioes/{id}` | Get region detail |
| PUT | `/api/regioes/{id}` | Update region |
| DELETE | `/api/regioes/{id}` | Remove region |

#### Estações (IoT Stations)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/estacoes` | Register a new station |
| GET | `/api/estacoes/regiao/{idRegiao}` | List stations for a region |

#### Leituras (Telemetry Readings)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/leituras` | Submit a new reading |
| GET | `/api/regioes/{id}/leituras` | Get readings for a region |

#### Riscos (Risk Calculation)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/riscos/avaliar/{idRegiao}` | Trigger Java risk assessment for a region |
| GET | `/api/regioes/{id}/risco-atual` | Get current risk state for a region |

#### Alertas
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/alertas` | List all generated alerts |
| PUT | `/api/alertas/{id}/resolver` | Mark alert as resolved |

#### Dashboard & Indicators
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/dashboard/summary` | Aggregated summary for dashboard |
| GET | `/api/indicadores-regionais` | Regional indicators data |

---

### 3.2 Endpoints NOT in scope

Do not implement or reference these until confirmed in the live API:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `GET /usuarios`
- `GET /abrigos` / `POST /abrigos`
- `GET /relatorios`
- `GET /dashboard/stats`
- `POST /alertas`
- `PUT /alertas/{id}`
- `DELETE /alertas/{id}`

---

## 4. Screen List

| Route | Screen | Context |
|---|---|---|
| `/` | Demo Context Selector | None (entry) |
| `/(app)/dashboard` | Painel — summary + indicators | Both |
| `/(app)/regioes` | Lista de Regiões | Both |
| `/(app)/regioes/[id]` | Detalhe da Região | Both |
| `/(app)/alertas` | Console de Triagem de Alertas | Both (triage actions: Defesa Civil only) |
| `/(app)/indicadores` | Indicadores Regionais (analytics) | Both |
| `/(app)/gerenciar` | Gerenciar Regiões — setup wizard | Defesa Civil only |
| `/(app)/estacoes` | Cadastro / Visualização de Estações | Defesa Civil only |

---

## 5. Enum Label Mappings

All enums stored in `src/constants/enums.ts`. Use exactly these backend enum keys — do not use English variants.

### Nível de Risco
| Backend key | Label PT-BR |
|---|---|
| `BAIXO` | Baixo |
| `MODERADO` | Moderado |
| `ALTO` | Alto |
| `CRITICO` | Crítico |

### Categoria de Risco
Used in `AvaliacaoRisco.tipoRisco` and `IndicadorRegional.tipoRisco` (TB_AMANAJE_AVAL_RISCO, TB_AMANAJE_IND_REG). Does **not** include OPERACIONAL.

| Backend key | Label PT-BR |
|---|---|
| `ENCHENTE` | Enchente |
| `DESLIZAMENTO` | Deslizamento |
| `TEMPESTADE` | Tempestade |
| `QUALIDADE_AR` | Qualidade do ar |

### Tipo de Alerta
Used in `Alerta.tipoAlerta` (TB_AMANAJE_ALERTA). Superset of CategoriaRisco — adds `OPERACIONAL` for infrastructure/non-environmental alerts. Do **not** use for risk assessments.

| Backend key | Label PT-BR |
|---|---|
| `ENCHENTE` | Enchente |
| `DESLIZAMENTO` | Deslizamento |
| `TEMPESTADE` | Tempestade |
| `QUALIDADE_AR` | Qualidade do ar |
| `OPERACIONAL` | Operacional |

### Status do Alerta
| Backend key | Label PT-BR |
|---|---|
| `ABERTO` | Aberto |
| `EM_ANALISE` | Em análise |
| `RESOLVIDO` | Resolvido |
| `CANCELADO` | Cancelado |

### Tipo de Cliente
Used in `Cliente.tipo` (TB_AMANAJE_CLI). Also drives the Demo Context Selector (GOVERNO_DEFESA_CIVIL / ONG only at launch).

| Backend key | Label PT-BR |
|---|---|
| `GOVERNO_DEFESA_CIVIL` | Governo / Defesa Civil |
| `ONG` | ONG |
| `FAZENDA_PRIVADO` | Fazenda privada |
| `COOPERATIVA` | Cooperativa |
| `PESQUISA_UNIVERSIDADE` | Pesquisa / Universidade |

### Tipo de Área da Região
| Backend key | Label PT-BR |
|---|---|
| `PONTE` | Ponte |
| `ENCOSTA` | Encosta |
| `AREA_RURAL` | Área rural |
| `COMUNIDADE` | Comunidade |
| `PROPRIEDADE_PRIVADA` | Propriedade privada |
| `REGIAO_RIBEIRINHA` | Região ribeirinha |
| `AREA_URBANA` | Área urbana |
| `OUTRA` | Outra |

### Visibilidade da Região
| Backend key | Label PT-BR |
|---|---|
| `PRIVADA` | Privada |
| `INSTITUCIONAL` | Institucional |
| `AGREGADA_PUBLICA` | Agregada pública |

---

## 6. Color Palette

Defined in `src/constants/colors.ts`.

| Token | Hex | Use |
|---|---|---|
| `primary` | `#3F51B5` | Headers, buttons, active tabs |
| `primaryDark` | `#3347A8` | Pressed states |
| `primaryLight` | `#5A6FD6` | Highlights |
| `background` | `#F4F5F7` | Screen backgrounds |
| `card` | `#FFFFFF` | Card surfaces |
| `text` | `#1F2937` | Body text |
| `textMuted` | `#6B7280` | Labels, captions |
| `border` | `#DDE2EA` | Dividers, card borders |

### Risk Colors (mapped to corrected backend keys)

| Backend key | Foreground | Background |
|---|---|---|
| `CRITICO` | `#D32F2F` | `#FFEBEE` |
| `ALTO` | `#EF6C00` | `#FFF3E0` |
| `MODERADO` | `#F9A825` | `#FFFDE7` |
| `BAIXO` | `#2E7D32` | `#E8F5E9` |

---

## 7. UX Rules

1. **All UI text is Portuguese-BR.** No English labels in the UI layer.
2. **Loading states are mandatory.** Every data fetch must show an `ActivityIndicator` or skeleton.
3. **Error states are mandatory.** Every API call must handle and display errors — never fail silently.
4. **Empty states are mandatory.** Lists must show a friendly message when there is no data.
5. **Confirmation dialogs** before any destructive action (delete, resolve alert, remove region).
6. **Pull-to-refresh** on all list screens.
7. **Back navigation** is always available in detail screens.
8. **Accessibility:** minimum touch target 44×44 pt; readable contrast ratios.

---

## 8. Chart Rules

- **Primary charting library: `victory-native` (Victory Native XL).**
- Do **not** use `react-native-chart-kit`.
- Do **not** use `react-native-gifted-charts`.
- Victory Native XL requires: `react-native-reanimated`, `react-native-gesture-handler`, `@shopify/react-native-skia`.
- Charts are **read-only data visualisations** — no interactive editing.
- Always show a loading state while chart data is fetched.
- Never render a chart with an empty dataset — show an empty-state message instead.
- Planned chart types:
  - **Bar / Pie** — risk level distribution across regions (dashboard)
  - **Line** — telemetry readings over time per region
  - **Bar** — regional indicator comparisons

---

## 9. Mobile Rules

- Mobile-first: design for a 375 pt wide screen; adapt for tablets ≥ 768 pt via `useWindowDimensions`.
- No horizontal overflow. All lists use `FlatList` or `SectionList`, never `ScrollView` over large datasets.
- Keyboard avoidance: use `KeyboardAvoidingView` + `KeyboardDismissView` on forms.
- Safe area: always wrap root content in `SafeAreaView` or use `SafeAreaProvider`.
- `StyleSheet.create` for all styles — no inline style objects in JSX.

---

## 10. No Fake Data Rule

**Do not invent, hard-code, or mock API responses anywhere in the application.**

- All data must come from the live API at `https://gs-java-advanced.onrender.com`.
- If an endpoint is not yet implemented, show a "Em breve" placeholder screen — do not fabricate data.
- No `Math.random()` seeding, no static JSON arrays masquerading as real data.
- The Demo Context Selector (Phase 1) is a UI role selector — it is **not** mock data; it sets a context variable that adjusts visible features.

---

## 11. Render / Cold-Start Handling

The backend runs on Render's free tier. Instances spin down after ~15 minutes of inactivity.

**Behaviour:**
- First request after cold start may take **30–60 seconds** to respond.
- Subsequent requests are fast (< 1 s typical).

**Implementation rules:**
- Use `GET /api/health` as the warm-up probe on app launch.
- Use `API_TIMEOUT_COLD_START = 65_000` ms for the health probe.
- Use `API_TIMEOUT = 15_000` ms for all subsequent requests.
- If the health probe times out, surface the message: *"O servidor está inicializando. Tente novamente em instantes."*
- Show a spinner with the label "Aguardando servidor…" during cold-start wait.
- Do **not** silently retry in a loop — give the user a visible retry button after timeout.

---

## 12. Context-Based Feature Gating (Governo/Defesa Civil vs ONG)

Since there is no confirmed auth system, Phase 1 introduces a **Demo Context Selector** screen that stores the selected context in React Context (not persisted across restarts).

| Feature | Governo / Defesa Civil | ONG |
|---|---|---|
| View dashboard | ✅ | ✅ |
| View regional indicators | ✅ | ✅ |
| View alertas list | ✅ | ✅ |
| Resolve an alerta | ✅ | ❌ |
| View regiões list + detail | ✅ | ✅ |
| Trigger risk assessment | ✅ | ❌ |
| Create / edit / delete region | ✅ | ❌ |
| Register station | ✅ | ❌ |
| Register client | ✅ | ❌ |

- The context variable drives conditional rendering of action buttons and menu items.
- The backend is authoritative — frontend gating is UX convenience only.
- When a real auth system is confirmed, replace the Demo Context Selector with the actual login flow without changing any screen logic.

---

## 13. Path Aliases

Configured in `tsconfig.json`:

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@constants/*` | `src/constants/*` |
| `@components/*` | `src/components/*` |
| `@contexts/*` | `src/contexts/*` |
| `@hooks/*` | `src/hooks/*` |
| `@services/*` | `src/services/*` |
| `@utils/*` | `src/utils/*` |

> **Types:** Use `@/types` to import from `src/types/index.ts`. The `@types/*` alias was removed in Phase 3.3 — it conflicted with TypeScript's reserved `node_modules/@types/` namespace lookup. The `@/*` alias (`src/*`) covers types via `@/types`.

---

## 14. Phase Map

| Phase | Scope |
|---|---|
| **0** ✅ | Project setup: Expo scaffold, constants, types, API service, this context file |
| **1** ✅ | Design system, navigation shell, API client, health warm-up, Demo Context Selector |
| **2** ✅ | Dashboard foundations: summary cards from `/api/dashboard/summary` |
| **2.1** ✅ | Live endpoint validation; `src/utils/dashboardNormalizer.ts`; partial-data + empty states |
| **3** ✅ | Dashboard charts and filters with Victory Native XL + custom bars |
| **3.1** ✅ | Indicadores tab — sensor analytics, RegionSelector, station coverage, sensor reading sections |
| **3.2** ✅ | Visual quality pass: SVG donuts on web, desktop sidebar nav, 2-column chart grid |
| **3.3** ✅ | TypeScript baseline cleanup: zero `tsc --noEmit` errors; removed `@types/*` alias conflict |
| **4** ✅ | Regiões Monitoradas CRUD — list, detail, create, edit, inativar via live Java API |
| **5** | Alertas triage console (list + resolve action) |
| **6** | (Merged into 3.1) Regional indicators analytics |
| **7** | Gerenciar Regiões smart setup (create, edit, delete) |
| **8** | Cadastro / visualização de estações (register station, list per region) |
| **9** | Governo vs ONG context differentiation and feature gating polish |
| **10** | Polish: mobile QA, loading skeletons, error boundaries, empty states, offline banner |

---

## 15. DDL-Confirmed Validation Rules (sql/AMANAJE_boot-setup_DDL_v3.sql)

Use these for form validation in Phases 7–8. Do not add forms before those phases.

| Entity | Field | Rule |
|---|---|---|
| RegiaoMonitorada | `sgEstado` | CHAR(2), uppercase letters only (`^[A-Z]{2}$`) |
| RegiaoMonitorada | `nivelVulnerabilidade` | 0–100 integer |
| RegiaoMonitorada | `latitude` | -90 to 90 |
| RegiaoMonitorada | `longitude` | -180 to 180 |
| LeituraIot | `nivelAguaPct` | 0–100 |
| LeituraIot | `pressaoHpa` | 800–1200 |
| LeituraIot | `pm25` | >= 0 |
| LeituraIot | `pm10` | >= 0 |
| ObservacaoClimatica | `umidadePct` | 0–100 |
| ObservacaoClimatica | `precipitacaoMm` | >= 0 |
| ObservacaoClimatica | `ventoKmh` | >= 0 |
| ObservacaoClimatica | `pressaoHpa` | 800–1200 |
| ObservacaoClimatica | `indiceUv` | 0–20 |
| AvaliacaoRisco | `scoreRisco` | 0–100 |

**Key DDL distinctions:**
- `LeituraIot` = IoT sensor data (water level, inclination, vibration, pressure, air quality)
- `ObservacaoClimatica` = External climate observations (temperature, humidity, precipitation, wind)
- `TipoAlerta` ≠ `CategoriaRisco`: alerts can be OPERACIONAL; risk assessments cannot
- No Abrigo/shelter table confirmed anywhere in DDL
- `TipoCliente` has 5 values; Demo Context Selector exposes only 2 (GOVERNO_DEFESA_CIVIL, ONG)

---

## 16. Live API Field Names (confirmed 2026-06-06)

The Java backend serialises some fields differently from the DDL column names. The TypeScript types in `src/types/index.ts` match the **live API field names**, not the DDL names.

### `GET /api/alertas` — `Alerta`
| TypeScript field | Notes |
|---|---|
| `idAlerta` | primary key |
| `idRegiao` | FK to region |
| `idAvaliacao` | nullable |
| `tipoAlerta` | `TipoAlerta` enum |
| `nivelRisco` | `NivelRisco` enum |
| `statusAlerta` | was `status` in DDL-derived draft — now corrected |
| `stAtivo` | char `'S'` / `'N'` |
| `dtCriadoEm` / `dtAtualizadoEm` | timestamps (no timezone suffix) |

### `GET /api/indicadores-regionais` — `IndicadorRegional`
| TypeScript field | Notes |
|---|---|
| `idIndicador` | primary key |
| `idRegiao` | **nullable** — `null` for the national aggregate row (`estado='BR'`) |
| `estado` | 2-char state code |
| `cidade` | city name |
| `nomeRegiao` | nullable |
| `quantidadeEstacoes` | was `qtEstacoes` in DDL-derived draft |
| `quantidadeAlertasAtivos` | was `qtAlertasAtivos` in DDL-derived draft |

**Important:** Always filter `idRegiao !== null` before building per-region charts. The `estado='BR'` aggregate entry represents a national rollup.

### `GET /api/regioes` — `RegiaoMonitorada`
| TypeScript field | Notes |
|---|---|
| `idRegiao` | primary key |
| `idCliente` | FK to client |
| `cidade` | was `nmCidade` in DDL-derived draft |
| `estado` | was `sgEstado` in DDL-derived draft |
| `tipoVisibilidade` | was `visibilidade` in DDL-derived draft |
| `stAtivo` | char `'S'` / `'N'` (not a boolean) |

### Chart Architecture (Phase 3 / 3.2)
- **Donut / pie charts (web)**: `SvgDonut` component (`src/components/charts/SvgDonut.tsx`) — uses `react-native-svg` 15.15.4 with polar coordinate arc math. Works on all platforms including Expo Web.
- **Donut / pie charts (native)**: `PolarChart` + `Pie.Chart` from `victory-native`. Guard: `Platform.OS !== 'web'`.
- **Bar / distribution charts**: custom React Native horizontal bars (`src/components/charts/HorizontalBarChart.tsx`)
- **Regional ranking**: custom card-style rows with rank badges (`src/components/charts/RegionalRankingBar.tsx`)
- **Sensor sparklines**: custom React Native View bars (`SensorReadingSection.tsx` — no Skia, works on web)
- Reusable chart wrapper: `src/components/charts/ChartCard.tsx` — supports `metric`, `accentColor`, `filterSlot` props
- Filter chips: `src/components/charts/FilterBar.tsx` — horizontal scroll on mobile, wrapping chips on desktop ≥768pt
- Data transforms: `src/utils/chartTransforms.ts`; `PieSlice` has `[key: string]: unknown` index signature for Victory Native generic compatibility
- Sensor transforms: `src/utils/sensorTransforms.ts`

### Desktop Layout Architecture (Phase 3.2)
- `isDesktop = Platform.OS === 'web' && width >= 768` pattern throughout
- `DesktopSidebar` renders inside `app/(app)/_layout.tsx` alongside `<Tabs>` in a flex-row `View`; bottom tab bar gets `display: 'none'` on desktop
- Dashboard content uses `maxWidth: 1200, alignSelf: 'center'` centering; 2-column chart grid via `flexDirection: 'row'` when `isWide`
- `react-native-svg` 15.15.4 added as dependency for `SvgDonut`

---

## 17. Sensor Dimension Mapping (Phase 3.1)

Amanajé integrates four hardware sensor types, each mapped to a risk category and a set of telemetry fields stored in `TB_AMANAJE_LEIT_IOT`.

### HC-SR04 → Enchente / Nível de água
- **Type:** REAL (physical sensor)
- **Risk dimension:** `ENCHENTE`
- **Telemetry fields:** `distanciaAguaCm`, `nivelAguaPct`
- **Operational meaning:** Measures ultrasonic distance to water surface. Smaller distances = higher water level. Used in rivers, streams, canals, and urban drainage.

### Potenciômetro Slider → Qualidade do ar (simulação PMS5003)
- **Type:** SIMULADA (Wokwi simulation fallback)
- **Risk dimension:** `QUALIDADE_AR`
- **Telemetry fields:** `pm25`, `pm10`
- **Wokwi note:** Wokwi does not support the PMS5003 particulate matter sensor. A slider potentiometer is used to simulate PM2.5 / PM10 concentration values for prototyping purposes. In a production deployment, a real PMS5003 or equivalent sensor would replace this.
- **Operational meaning:** PM2.5 (fine particles) and PM10 (coarse particles) indicate smoke, pollution, or wildfire proximity.

### BMP180 → Tempestade / Pressão atmosférica
- **Type:** REAL (physical sensor)
- **Risk dimension:** `TEMPESTADE`
- **Telemetry fields:** `pressaoHpa`
- **Operational meaning:** Measures atmospheric pressure in hPa. Rapid drops below ~1005 hPa signal approaching low-pressure systems and storm risk. Normal range: 1010–1020 hPa.

### MPU6050 → Deslizamento / Inclinação e vibração
- **Type:** REAL (physical sensor)
- **Risk dimension:** `DESLIZAMENTO`
- **Telemetry fields:** `inclinacaoGraus`, `vibracao`
- **Operational meaning:** Accelerometer + gyroscope detects slope inclination and ground tremors. Abrupt inclination changes or vibration spikes indicate potential landslide initiation or structural instability.

### Live API field name normalisation (sensorTransforms.ts)
`src/utils/sensorTransforms.ts` tries multiple field-name candidates for each sensor dimension to handle potential Java serialisation variations:
- `distanciaAguaCm` | `nrDistanciaAguaCm` | `waterDistanceCm`
- `nivelAguaPct` | `nrNivelAguaPct` | `waterLevelPercent` | `nivelAguaPercentual`
- `pressaoHpa` | `nrPressaoHpa` | `pressureHpa`
- `inclinacaoGraus` | `nrInclGraus` | `tiltAngle`
- `vibracao` | `nrVibracao` | `vibration`
- `pm25` | `nrPm25` | `PM25`
- `pm10` | `nrPm10` | `PM10`

If a field is never present in any reading, `SensorSeries.available` is `false` and the UI shows "Dado não disponível pela API."

---

## 18. Phase Map Update

| Phase | Scope |
|---|---|
| **0** ✅ | Project setup: Expo scaffold, constants, types, API service, this context file |
| **1** ✅ | Design system, navigation shell, API client, health warm-up, Demo Context Selector |
| **2** ✅ | Dashboard foundations: summary cards from `/api/dashboard/summary` |
| **2.1** ✅ | Live endpoint validation; `src/utils/dashboardNormalizer.ts`; partial-data + empty states |
| **3** ✅ | Dashboard charts and filters with Victory Native XL + custom bars |
| **3.1** ✅ | Indicadores tab — sensor analytics, RegionSelector, station coverage, sensor reading sections |
| **3.2** ✅ | Visual quality pass: SVG donuts on web (`SvgDonut`), desktop sidebar nav, 2-column chart grid, improved ChartCard/FilterBar/RegionalRankingBar/SensorReadingSection |
| **3.3** ✅ | TypeScript baseline cleanup: zero `tsc --noEmit` errors; removed `@types/*` alias; 22 import sites migrated to `@/types` |
| **4** ✅ | Regiões Monitoradas CRUD: list (`FlatList` + pull-to-refresh), detail, create (`POST /api/regioes`), edit (`PUT /api/regioes/{id}`), inativar (`DELETE /api/regioes/{id}`) — Governo-only write actions; `RegiaoCard`, `RegiaoForm` components; `clientesService`, 5 new hooks |
| **5** | Alertas triage console (list + resolve action) |
| **6** | (Merged into 3.1) Regional indicators analytics |
| **7** | Gerenciar Regiões smart setup (create, edit, delete) |
| **8** | Cadastro / visualização de estações (register station, list per region) |
| **9** | Governo vs ONG context differentiation and feature gating polish |
| **10** | Polish: mobile QA, loading skeletons, error boundaries, empty states, offline banner |
