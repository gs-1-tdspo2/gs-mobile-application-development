# Amanajé Mobile Design Reference

## 1. Design Source

| Item | Value |
| --- | --- |
| Stitch project name | Amanajé Monitoring Dashboard |
| Stitch project id | `projects/9759235869657275679` |
| Ownership | Owned project |
| Device type | Mobile |
| Date extracted | 2026-06-03 |
| Source screens read | Home / Dashboard, Regiões, Região Detalhe, Gerenciar Regiões, Alertas, Indicadores Regionais |

This document translates the completed Stitch mobile design into an implementation reference for the Amanajé React Native app. It is the source of truth for future mobile UI implementation branches. Coding agents should implement from this file without reopening Stitch unless the design is intentionally revised.

## 2. Product Context

Amanajé is a climate and environmental monitoring service for vulnerable areas. The school MVP focuses on institutional clients that need simple, actionable visibility into monitored regions, current risks, alerts, IoT stations, and regional indicators.

MVP client types:

- Governo / Defesa Civil
- ONG

Future vision only:

- Fazenda / cliente privado
- Cooperativa
- Pesquisa / universidade

The mobile app must remain simple and focused on the school MVP. Do not expand the product into complex role management, private-client workflows, advanced GIS, or heavy analytics unless those features are explicitly requested later.

## 3. Visual Direction

The final design uses a ThingsBoard/KVM-inspired enterprise monitoring dashboard style adapted for mobile. It should feel like an institutional SaaS/admin interface for environmental intelligence rather than a playful sustainability app.

Core visual traits:

- Blue/indigo top app bar and action color.
- Light gray app background.
- White rounded cards with subtle borders and low elevation.
- Compact dashboard metrics for fast scanning.
- Dense but legible card/list layouts.
- Calm urgency: risk and alert states are highly visible, but the base UI stays restrained.
- Environmental/climate monitoring theme without childish illustrations, mascot-like visuals, decorative nature graphics, or heavy green-only palettes.
- Mobile-first layout derived from enterprise monitoring dashboards: stacked cards, compact labels, badges, progress bars, lists, and simple status summaries.

## 4. Color Palette

Use the Stitch design palette as the preferred source. The generated theme contains Material-like tokens and design notes that explicitly anchor the UI in indigo/deep navy, neutral surfaces, white cards, and semantic alert colors.

| Token name | Hex value | Usage |
| --- | --- | --- |
| `primary` | `#3F51B5` | Main app identity, top app bar, primary buttons, active navigation, important links. |
| `primaryBase` | `#24389C` | Stronger primary for pressed states, selected accents, metric emphasis. |
| `primaryDark` | `#3347A8` | Deep navigation structures, dark app bar variants, active section grounding. |
| `primaryLight` | `#EEF2FF` | Secondary button fill, selected filter chip background, subtle primary-tinted panels. |
| `primaryAccent` | `#5A6FD6` | Active navigation accent, small highlighted indicator, focused state accent. |
| `background` | `#F4F5F7` | Global app canvas. Stitch notes call this the base layer for dashboards. |
| `backgroundAlt` | `#F8F9FB` | Theme background/surface token; acceptable for very light page areas. |
| `surface/card` | `#FFFFFF` | Cards, list rows, form containers, alert panels. |
| `surfaceContainer` | `#F3F4F6` | Nested card regions, subtle grouped content backgrounds. |
| `border` | `#E5E7EB` | Card borders, list dividers, input borders. |
| `borderStrong` | `#C5C5D4` | Outline variant, focused card borders, disabled outlines. |
| `textPrimary` | `#191C1E` | Primary text, metric values, screen titles. |
| `textSecondary` | `#454652` | Supporting copy, section descriptions, metadata. |
| `textMuted` | `#757684` | Muted labels, timestamps, helper text. |
| `onPrimary` | `#FFFFFF` | Text/icons on primary and dark app bars. |
| `success/lowRisk` | `#16A34A` | BAIXO risk text/accent, positive status indicators. |
| `lowRiskBackground` | `#DCFCE7` | BAIXO risk badge background. |
| `warning/moderateRisk` | `#F59E0B` | MODERADO risk text/accent, warning counters. |
| `moderateRiskBackground` | `#FEF3C7` | MODERADO risk badge background. |
| `highRisk` | `#F97316` | ALTO risk text/accent, high-priority alerts. |
| `highRiskBackground` | `#FFEDD5` | ALTO risk badge/card tint. |
| `criticalRisk` | `#BA1A1A` | CRITICO risk text/accent, destructive/danger action. |
| `criticalBackground` | `#FFDAD6` | CRITICO badge background and critical alert tint. |
| `criticalSoftBackground` | `#FFF5F5` | Large-area critical alert panel tint referenced by Stitch notes. |

Risk colors beyond the red/error token are semantic implementation tokens derived from the Stitch direction. Keep them saturated enough for immediate recognition, but use tinted backgrounds for large surfaces.

## 5. Typography

Stitch specifies a technical dashboard stack:

- Headline font: Hanken Grotesk
- Body font: Inter
- Technical/data font: JetBrains Mono

React Native implementation can use system fonts initially if custom font loading is out of scope, but text sizes and weights should follow this hierarchy.

| Style | Font | Approx size | Weight | Line height | Usage |
| --- | --- | --- | --- | --- | --- |
| Screen title | Hanken Grotesk | 22-24 | 600 | 28-32 | Top screen heading below app bar or header title. |
| Section title | Hanken Grotesk | 20 | 600 | 28 | Card group titles and major sections. |
| Card title | Inter or Hanken Grotesk | 14-16 | 600-700 | 20-24 | Card headings, list row titles. |
| Metric number | Hanken Grotesk | 32-36 | 700 | 40-44 | Dashboard summary values and key sensor readings. |
| Body text | Inter | 14-16 | 400 | 20-24 | Descriptions, empty states, normal content. |
| Metadata/data | JetBrains Mono | 13 | 500 | 18 | IDs, timestamps, coordinates, sensor values. |
| Badge text | Inter | 11-12 | 700 | 16 | Risk/status badges in uppercase where appropriate. |
| Button text | Inter | 14-15 | 600-700 | 20 | Primary/secondary action labels. |

Avoid negative letter spacing in React Native implementation except where the metric style needs a small optical correction. Prefer clear, compact text over decorative display typography.

## 6. Spacing and Layout

The mobile design uses a 4px base unit with an 8px practical rhythm for most UI decisions.

| Layout token | Value | Rule |
| --- | --- | --- |
| Screen width target | 390 logical px in Stitch previews | Implement fluidly for all mobile widths. |
| Screen padding | 16px | Mandatory horizontal padding for primary content. |
| Section margin | 24px | Space between major screen groups. |
| Card gap | 12px | Gap between stacked cards or metric widgets. |
| Element stack | 8px | Gap inside cards between labels, values, and supporting text. |
| Card padding | 16px | Default internal padding for cards and form panels. |
| Compact row height | 48px minimum | Data/list rows should be dense but touch-safe. |
| Button height | 44-48px minimum | Touch-safe primary actions. |
| Button padding | 16px horizontal, 10-12px vertical | Keep labels centered and compact. |
| Badge padding | 8-10px horizontal, 4-6px vertical | Pill badges with short labels. |
| Card radius | 16px | Stitch rounded-lg for major cards. |
| Button/input radius | 8px | Crisp enterprise controls. |
| Badge radius | 999px | Pill-shaped status/risk badges. |
| Progress bar height | 8px | Rounded 4px caps. |
| Card shadow | `0px 2px 4px rgba(31, 41, 55, 0.06)` | Very subtle, never dramatic. |
| Card border | 1px `#E5E7EB` | Primary boundary method with light shadow. |

General mobile layout rules:

- Use a vertical `ScrollView` for screens that exceed the viewport.
- Stack dashboard widgets vertically or in a two-column grid only when width allows without cramped text.
- Do not nest cards inside cards. Use plain grouped sections or surface containers inside a card.
- Keep top actions visible and predictable.
- Prefer compact cards, lists, badges, and progress bars over charts.
- Use horizontal scroll only for optional quick-glance chips or secondary metric cards.

## 7. Navigation Model

Implementation uses Expo Router with file-based routes.

Expected routes:

| Route | Screen |
| --- | --- |
| `/` | Home / Dashboard |
| `/regioes` | Regiões |
| `/regioes/[id]` | Região Detalhe |
| `/gerenciar-regioes` | Gerenciar Regiões |
| `/alertas` | Alertas |
| `/indicadores` | Indicadores Regionais |

Top app bar behavior:

- Use a solid indigo background (`#3F51B5`) with white title/icons.
- Height should be approximately 56-64px plus safe-area top inset.
- Home shows app name and optional small status/notification icons.
- Secondary screens show a back affordance and the screen title.
- Avoid complex drawer navigation for MVP mobile. If a menu icon appears in design, implement it as a future placeholder or simple route action only.

Home navigation:

- Home exposes quick action cards/buttons to Regiões, Gerenciar Regiões, Alertas, and Indicadores.
- Cards should be tappable with clear titles, concise supporting text, and optional small status badges/counters.

## 8. Reusable Components

### AppTopBar

- Solid `primary` background (`#3F51B5`).
- White title/icon color (`#FFFFFF`).
- Height: 56-64px plus safe-area top inset.
- Title: Hanken Grotesk or system equivalent, 20px, weight 600.
- Home title: `Amanajé`.
- Secondary titles: route-specific.
- Optional right-side elements: notification icon, status dot, or small environment label. Keep touch targets 44px.
- Back button appears on nested screens.

### AppCard

- Background: `#FFFFFF`.
- Radius: 16px for primary cards.
- Border: 1px `#E5E7EB`.
- Shadow/elevation: low-diffusion shadow equivalent to `0px 2px 4px rgba(31, 41, 55, 0.06)`.
- Padding: 16px.
- Internal gap: 8-12px.
- Titles should be compact and scannable.

### AppButton

Primary variant:

- Background `#3F51B5`.
- Text `#FFFFFF`.
- Radius 8px.
- Height 44-48px.
- Pressed state: use `#24389C` or opacity 0.9.

Secondary variant:

- Background `#EEF2FF`.
- Text `#24389C` or `#3F51B5`.
- Border 1px `#C5C5D4` when needed.

Danger variant:

- Background `#BA1A1A`.
- Text `#FFFFFF`.
- Use only for destructive actions such as delete confirmation.

Disabled state:

- Background `#E1E2E4` or opacity 0.5.
- Text `#757684`.
- No shadow and no navigation/action trigger.

### MetricCard

- Use `AppCard` styling, often compact.
- Label: uppercase or muted label, Inter 12px, weight 600, `textMuted`.
- Value: Hanken Grotesk 32-36px, weight 700, `textPrimary`.
- Supporting text: Inter 13-14px, `textSecondary`.
- Optional warning indicator: small colored dot or left accent using risk token.
- Avoid large icons; if used, keep them line-style and secondary to the number.

### RiskBadge

Must support these exact levels:

| Level | Background | Text | Border/accent |
| --- | --- | --- | --- |
| BAIXO | `#DCFCE7` | `#166534` | `#16A34A` |
| MODERADO | `#FEF3C7` | `#92400E` | `#F59E0B` |
| ALTO | `#FFEDD5` | `#9A3412` | `#F97316` |
| CRITICO | `#FFDAD6` | `#93000A` | `#BA1A1A` |

Badge rules:

- Pill radius 999px.
- Padding 8-10px horizontal and 4-6px vertical.
- Text 11-12px, weight 700, uppercase.
- Use no emoji.
- `CRITICO` may appear with a stronger left border/accent in alert cards.

### StatusBadge

Must support:

| Status | Background | Text | Usage |
| --- | --- | --- | --- |
| Ativo | `#DCFCE7` | `#166534` | Active region/station. |
| Inativo | `#E5E7EB` | `#454652` | Disabled or inactive entity. |
| Resolvido | `#DEE1FF` | `#283D9E` | Resolved alert. |
| Em desenvolvimento | `#FEF3C7` | `#92400E` | Placeholder/future feature. |

Use the same pill sizing rules as `RiskBadge`.

### LoadingState

- Centered within the available content area or inside the relevant card.
- Use small `ActivityIndicator` in primary color.
- Supporting text: Inter 14px, `textSecondary`.
- Do not show skeleton loaders unless added later; simple spinner plus message is sufficient.

### EmptyState

- White card or dashed-outline panel.
- Optional simple line icon in primaryLight/primary color.
- Title: 16-18px, weight 600.
- Description: 14px, `textSecondary`, max 2-3 lines.
- Optional call-to-action button when the user can fix the empty state.

### ErrorState

- White card with critical accent border or left bar.
- Title in `criticalRisk`.
- Description in `textSecondary`.
- Optional retry button using secondary or primary variant.
- Avoid blocking the entire app if only one section failed.

### SuccessFeedback

- Temporary inline message, toast-like panel, or success-tinted card.
- Background `#DCFCE7`, text `#166534`.
- Include a concise message such as `Região salva com sucesso`.
- Keep visible long enough for feedback, then dismiss or allow manual close.

## 9. Screen Specifications

The Stitch project exposes six mobile screens with 780px exported preview width and mobile layout intent. Implement in React Native as fluid 390px-first mobile screens.

### 9.1 Home / Dashboard

Purpose:

- Provide the main monitoring overview and route users to the MVP areas.

Main UI sections:

- `AppTopBar` with `Amanajé`.
- Intro header with Amanajé title/subtitle and institutional monitoring context.
- Summary metric cards:
  - Regiões monitoradas
  - Alertas ativos
  - Alertas críticos
  - Maior risco atual
- Quick action cards:
  - Regiões
  - Gerenciar Regiões
  - Alertas
  - Indicadores
- Activity/recent updates card if data exists, using compact rows with timestamp in mono style.

Components used:

- `AppTopBar`
- `MetricCard`
- `AppCard`
- `AppButton`
- `RiskBadge`
- `StatusBadge`
- `LoadingState`
- `ErrorState`
- `EmptyState`

Data needed from API:

- `DashboardSummary`
- Total monitored regions
- Active alerts count
- Critical alerts count
- Current highest risk
- Optional recent activity/update rows

API mapping:

- `GET /api/dashboard/summary`

Loading state:

- Show top app bar immediately.
- Show loading state in the dashboard content area or individual skeleton-like metric placeholders if implemented later.

Error state:

- Show `ErrorState` below the header with retry action.
- Keep navigation quick actions visible if possible.

Empty state:

- If summary has no data, show a neutral `EmptyState` explaining that dashboard data will appear after regions/alerts are registered.

User actions:

- Tap quick action cards/buttons.
- Retry dashboard fetch on error.

Navigation actions:

- `Regiões` -> `/regioes`
- `Gerenciar Regiões` -> `/gerenciar-regioes`
- `Alertas` -> `/alertas`
- `Indicadores` -> `/indicadores`

### 9.2 Regiões

Purpose:

- List monitored regions and expose their current operational status/risk.

Main UI sections:

- `AppTopBar` with title `Regiões`.
- Optional summary/filter row.
- Filter chips if implemented from design intent:
  - Todas
  - Baixo
  - Moderado
  - Alto
  - Crítico
- Region list as stacked cards.

Region cards must show:

- Region name
- City/state
- Client type
- Current risk badge
- Active alerts count
- Active/inactive status when available

Components used:

- `AppTopBar`
- `AppCard`
- `RiskBadge`
- `StatusBadge`
- `AppButton` or tappable card row
- `LoadingState`
- `ErrorState`
- `EmptyState`

Data needed from API:

- Region id
- Name
- City
- State
- Client type
- Current risk level
- Active alerts count
- Status

API mapping:

- `GET /api/regioes`
- Future/detail support: `GET /api/regioes/{id}`

Loading state:

- Show list-level loading below title.

Error state:

- Show list-level `ErrorState` with retry.

Empty state:

- Show `EmptyState` with message that no monitored regions were found.

User actions:

- Filter by risk/status when chips exist.
- Tap a region card.

Navigation actions:

- Region card -> `/regioes/[id]`
- Optional manage action -> `/gerenciar-regioes`

### 9.3 Região Detalhe

Purpose:

- Show detailed monitoring context for one region.

Main UI sections:

- `AppTopBar` with back action and region title.
- Region identity card:
  - Region name/location
  - Client type badge
  - Status badge
- Current risk section:
  - Risk badge
  - Score or severity summary when available
  - Updated timestamp
- IoT station cards:
  - Station name/id
  - Status
  - Last communication timestamp
- Latest readings section:
  - Compact metric cards or rows
  - Sensor values using mono/data style
- Recent alerts section if data exists.

Components used:

- `AppTopBar`
- `AppCard`
- `MetricCard`
- `RiskBadge`
- `StatusBadge`
- `LoadingState`
- `ErrorState`
- `EmptyState`

Data needed from API:

- Region detail
- Current risk
- Station list
- Latest readings
- Recent alerts

API mapping:

- `GET /api/regioes/{id}`
- `GET /api/regioes/{id}/risco-atual`
- `GET /api/estacoes/regiao/{idRegiao}`
- `GET /api/regioes/{id}/leituras`

Loading state:

- Show route header/back affordance and content loading.

Error state:

- If region detail fails, show full content `ErrorState`.
- If stations/readings fail independently, show section-level `ErrorState`.

Empty state:

- No stations: show compact empty card in station section.
- No readings: show compact empty card in latest readings section.
- No alerts: show calm empty state, not an error.

User actions:

- Refresh/retry.
- Open alert detail only if such route is added later.

Navigation actions:

- Back to `/regioes`.

### 9.4 Gerenciar Regiões

Purpose:

- Provide the school MVP CRUD workflow for monitored regions.

Main UI sections:

- `AppTopBar` with title `Gerenciar Regiões`.
- Summary/list of existing regions.
- New region button.
- Create/edit form.
- Delete action with confirmation.
- Confirmation/error/success feedback.

Components used:

- `AppTopBar`
- `AppCard`
- `AppButton`
- `StatusBadge`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `SuccessFeedback`
- Form inputs styled as white fields with gray border and primary focus color.

API mapping:

- `GET /api/regioes`
- `POST /api/regioes`
- `PUT /api/regioes/{id}`
- `DELETE /api/regioes/{id}`

Form fields:

- Nome da região
- Cidade
- Estado
- Tipo de cliente
- Descrição da área vulnerável
- Status, if present/needed

Loading state:

- Initial list loading.
- Button-level loading for create/update/delete.

Error state:

- Form validation errors near fields.
- API error panel above form or list.

Empty state:

- If no regions exist, show empty state plus primary `Nova região` action.

User actions:

- Create region.
- Edit region.
- Delete region.
- Cancel editing.
- Retry failed API operations.

Navigation actions:

- Back/home through top navigation.
- Optional open region detail after save if desired later.

### 9.5 Alertas

Purpose:

- List alerts, communicate severity, and allow resolving alerts.

Main UI sections:

- `AppTopBar` with title `Alertas`.
- Summary row/cards:
  - Total/ativos
  - Críticos
  - Resolvidos
- Filter chips if shown:
  - Todos
  - Ativos
  - Críticos
  - Resolvidos
- Alert list as stacked cards.

Alert cards must show:

- Title
- Region
- Severity/risk badge
- Date/time
- Status
- Resolve action for unresolved alerts

Components used:

- `AppTopBar`
- `MetricCard`
- `AppCard`
- `RiskBadge`
- `StatusBadge`
- `AppButton`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `SuccessFeedback`

API mapping:

- `GET /api/alertas`
- `PUT /api/alertas/{id}/resolver`

Loading state:

- Show list-level loading.
- Resolve button can show a disabled/loading state while request is pending.

Error state:

- Show list-level retry for fetch failure.
- Show inline error or toast for resolve failure.

Empty state:

- If no alerts, show a positive empty state: no active alerts.

User actions:

- Filter alerts.
- Resolve alert.
- Retry fetch.

Navigation actions:

- Optional tap region name/card -> `/regioes/[id]` if alert includes region id.

### 9.6 Indicadores Regionais

Purpose:

- Show regional environmental indicators and simple comparative risk signals.

Main UI sections:

- `AppTopBar` with title `Indicadores`.
- Indicator cards:
  - Key value
  - Region label
  - Supporting trend/status text
- Ranking/list of regional risk.
- Simple progress bars or compact visuals.

Components used:

- `AppTopBar`
- `MetricCard`
- `AppCard`
- `RiskBadge`
- `StatusBadge`
- `LoadingState`
- `ErrorState`
- `EmptyState`

API mapping:

- `GET /api/indicadores-regionais`

Loading state:

- Show content loading below title.

Error state:

- Show `ErrorState` with retry.

Empty state:

- Show neutral empty state if no regional indicators are available.

User actions:

- Refresh/retry.
- Optional filter/ranking sort only if data shape supports it.

Navigation actions:

- Optional tap regional ranking row -> `/regioes/[id]` when id is available.

Implementation rule:

- Avoid complex chart dependency requirements. Use cards, compact bars, and lists before adding chart libraries.

## 10. API Integration Notes

Base URL strategy:

| Environment | URL |
| --- | --- |
| Android Emulator | `http://10.0.2.2:8080` |
| iOS Simulator / Web | `http://localhost:8080` |
| Physical Expo Go device | `http://YOUR_COMPUTER_LAN_IP:8080` |

Environment variable:

- `EXPO_PUBLIC_API_BASE_URL`

Centralized Axios client:

- `src/services/api.ts`

Rules:

- All services should import the centralized Axios client.
- Do not hardcode backend URLs in screens.
- Keep screen components focused on state/rendering and place API calls in service modules or thin screen-level effects.
- The Java API is expected to run on port `8080`.

## 11. Implementation Rules

- Use Expo + TypeScript.
- Use Expo Router.
- Use Axios.
- Keep dependencies minimal.
- No real authentication/JWT in the MVP mobile branches.
- No offline sync.
- No push notifications.
- No maps unless explicitly added later.
- No complex role permissions.
- No heavy chart library unless strictly necessary.
- Prefer cards, lists, badges, buttons, and simple progress bars.
- Use Portuguese labels for user-facing domain concepts.
- Keep visual style institutional, compact, and dashboard-first.
- Avoid decorative nature graphics, playful illustrations, and single-hue green-only styling.
- Add loading, error, and empty states for each API-backed screen.
- Do not introduce secrets, API keys, or private Stitch tokens.

## 12. Future Implementation Branch Plan

1. `feat/dashboard-regioes-read`
   - Integrate dashboard summary.
   - Integrate region list read flow.

2. `feat/regioes-crud`
   - Implement full Regiões CRUD through Java API.

3. `feat/region-detail-alerts`
   - Implement region detail.
   - Implement risk/stations/readings sections.
   - Implement alerts listing and resolve action.

4. `feat/readme-demo-polish`
   - Improve README.
   - Polish styling.
   - Add demo instructions.
   - Prepare video script/checklist.

## 13. Open Questions

- The Stitch MCP returned the project design system, screen titles, dimensions, screenshot/file handles, and screen records, but did not expose an inline component tree or readable HTML content through the available tool response. Screen-level behavior above is therefore specified from the named Stitch screens, product requirements, and the extracted design system.
- The global background appears as both `#F8F9FB` in the generated theme token and `#F4F5F7` in the Stitch design notes. Use `#F4F5F7` for the dashboard canvas and `#F8F9FB` for very light surface/background variants.
- Exact non-critical risk colors were described semantically in Stitch rather than as named tokens. This file defines implementation tokens for BAIXO, MODERADO, ALTO, and CRITICO to keep behavior deterministic.
- The Stitch design references drawer navigation for enterprise dashboards, but the mobile MVP should use simple Expo Router stack navigation unless a drawer is explicitly requested later.
- `GET /api/regioes/{id}/leituras` is listed for detail implementation, but it must be verified against the Java API before coding because it was not part of the initial foundation endpoint list.
- Custom fonts Hanken Grotesk and JetBrains Mono may require extra Expo font setup. If keeping dependencies minimal takes priority, approximate with system font weights until a polish branch.
