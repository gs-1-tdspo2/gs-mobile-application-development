# Amanaje Web Responsive Design Reference

## 1. Design Source

| Item | Detail |
| --- | --- |
| Stitch project | Amanaje Monitoring Dashboard |
| Stitch project ID | `projects/9759235869657275679` |
| Date extracted | 2026-06-03 |
| Purpose | Document the desktop/web responsive direction for the Expo React Native app. |

This file is the source of truth for web layout decisions. It complements `DESIGN.md`, which remains the mobile UI reference.

## 2. Desktop Stitch Screens Reviewed

| Screen | Device | Size |
| --- | --- | --- |
| Dashboard Operacional (Desktop) | Desktop | 2560 x 2338 |
| Monitoramento de Regioes (Desktop) | Desktop | 2560 x 2048 |
| Painel de Detalhe da Regiao (Desktop) | Desktop | 2560 x 2776 |
| Console de Alertas (Desktop) | Desktop | 2560 x 2048 |
| Indicadores Regionais (Desktop) | Desktop | 2560 x 2818 |
| Analytics de Indicadores (Desktop) | Desktop | 2560 x 2748 |

Only the Amanaje Stitch project above was used for this web reference.

## 3. Responsive Strategy

The app remains mobile-first. On phones and narrow tablets, screens keep the existing stacked card layout. On web widths from `1024px`, the app changes into an enterprise dashboard layout:

| Area | Mobile | Desktop/Web |
| --- | --- | --- |
| Navigation | Screen-level links and buttons | Persistent left sidebar |
| Content width | Full width with small padding | Centered max-width content around `1280px` |
| Metrics | Single column | Multi-column compact grid |
| Lists | Stacked cards | Two-column card grid or compact row-like cards |
| CRUD form | Stacked full-width form | Constrained form width, never stretched across the viewport |
| Analytics panels | Optional stacked panels | Indigo/navy dashboard panels for emphasis |

Use React Native primitives, `useWindowDimensions`, and Expo Router. Do not introduce a separate web-only UI framework.

## 4. Desktop Navigation

Desktop web uses a persistent Material-style sidebar/drawer:

| Item | Route |
| --- | --- |
| Dashboard | `/` |
| Regioes | `/regioes` |
| Gerenciar | `/gerenciar-regioes` |
| Alertas | `/alertas` |
| Indicadores | `/indicadores` |

Sidebar styling:
- Width: about `260px`.
- Background: `#303F9F`.
- Active item: `rgba(255,255,255,0.14)` with a left accent strip.
- Hover item: `rgba(255,255,255,0.08)`.
- Border/accent: `#7986CB` and orange active strip accents.
- Text: off-white and pale indigo.
- Rows are compact, around `42px` high, with `16px`-style horizontal density.
- Active routes include a compact marker, label, and supporting subtitle.

Mobile must not show the sidebar.

## 4.1 Interaction Polish

Desktop web controls should feel like real admin controls:

- Buttons use hover, pressed, disabled, and danger hover states.
- Filter chips brighten on hover and use a solid primary active state.
- Clickable dashboard/region cards lift subtly on hover.
- Sidebar items show hover and pressed feedback.
- Error panels stay compact, with a red accent instead of a dominant full-page warning block.

## 4.2 Material Dashboard Visual Pass

The web interface translates the extracted ThingsBoard/Material CSS references into React Native Web style objects. Do not paste Angular Material or ThingsBoard CSS into this project.

Applied visual rules:

- App workspace background: `#EEEEEE`.
- Primary indigo scale follows Material indigo anchors:
  - `#E8EAF6`, `#C5CAE9`, `#9FA8DA`, `#7986CB`, `#5C6BC0`, `#3F51B5`, `#3949AB`, `#303F9F`, `#2D3C78`, `#1A237E`.
- Cards use white surfaces, `4px`-`6px` radius, subtle borders, and Material-like elevation shadows.
- Buttons use Material-like heights around `40px`, `4px` radius, variant-aware hover and pressed states.
- Filter chips use `32px` height, `16px` radius, light indigo selected state, and hover feedback.
- Error cards are compact white panels with a red left accent.

## 5. Palette Harmonization

Dark dashboard panels must stay in the indigo/navy family. Avoid charcoal, black, or gray-black analytics panels.

| Token | Hex | Usage |
| --- | --- | --- |
| `navDark` | `#303F9F` | Sidebar and darkest dashboard panels |
| `navPanel` | `#3949AB` | Secondary dark panels |
| `navActive` | `#5C6BC0` | Active navigation markers and selected dark surfaces |
| `primary` | `#3F51B5` | Primary actions and metric accents |
| `primaryLight` | `#E8EAF6` | Light selected backgrounds |
| `analyticsSurface` | `#E8EAF6` | Text on dark indigo panels |
| `analyticsBorder` | `#7986CB` | Dark panel borders |
| `background` | `#EEEEEE` | App background |
| `surface` | `#FFFFFF` | Cards and forms |
| `border` | `#E5E7EB` | Card borders and separators |

Risk colors remain semantic:
- Moderate: `#F9A825`
- High: `#EF6C00`
- Critical: `#D32F2F`

## 6. Layout Rules By Screen

### Dashboard

Desktop should show:
- Sidebar navigation.
- Large indigo operational header.
- Compact API Render status chip inside the header, with no environment variable text.
- Six summary metrics in responsive rows when space allows.
- Dashboard panels for regional risk, alert/status overview, quick actions, and recent activity.
- No debug-looking "connected operation" blocks.

### Regioes

Desktop should show:
- Filter chips near the top.
- Region cards in a two-column responsive grid.
- Each card remains readable with location, client type, status, risk, and active alerts.

### Regiao Detalhe

Desktop should show:
- Identity card first.
- Risk and IoT stations side by side when possible.
- Readings as compact metric cards in a grid.
- Alert navigation in a smaller side card.
- Preserve the existing fallback when `GET /api/regioes/{id}` fails and identity data can be recovered from `GET /api/regioes`.

### Gerenciar Regioes

Desktop should show:
- Action card at the top.
- Create/edit form constrained to a comfortable width.
- Region management cards in a two-column grid.
- Buttons remain compact and readable.

### Alertas

Desktop should show:
- Summary metrics in a row.
- Filter chips below summary.
- Alert cards in a two-column grid.
- Critical active alerts receive a red accent/background, not a full dark treatment.

### Indicadores

Desktop should show:
- Lightweight metrics in a row.
- Ranking/progress section next to a dark indigo analytics/status panel.
- No chart dependency is required for this delivery.

## 7. Expo React Native Web Constraints

- Use Expo Router routes already present in `src/app`.
- Use React Native `View`, `Text`, `ScrollView`, `Pressable`, and shared components.
- Use `useWindowDimensions` for responsive behavior.
- Keep screen code shared between native and web.
- Avoid DOM-only APIs in app screens.
- Avoid CSS files unless Expo web configuration explicitly needs them later.
- Keep `EXPO_PUBLIC_API_BASE_URL` as the single API configuration path.

## 8. Vercel Export Notes

For static web export:

```bash
npx expo export -p web
```

The generated output directory is `dist`.

Vercel should use:
- Build command: `npx expo export -p web`
- Output directory: `dist`
- Environment variable: `EXPO_PUBLIC_API_BASE_URL=https://gs-java-advanced.onrender.com`
