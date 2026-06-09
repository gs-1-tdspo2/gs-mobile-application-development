# Amanajé — Monitoramento Ambiental e IoT

Frontend web/mobile-responsivo desenvolvido com **Expo**, **React Native Web**, **Expo Router** e **TypeScript**.

A aplicação consome a API Java do Amanajé hospedada no Render:

```text
https://gs-java-advanced.onrender.com
```

Frontend publicado na Vercel:

```text
https://amanaje.vercel.app
```

---

## Descrição do Projeto

O **Amanajé** é uma solução de monitoramento climático e ambiental voltada para regiões vulneráveis.

A plataforma combina:

* telemetria IoT enviada por estações simuladas no Wokwi;
* observações climáticas persistidas no backend;
* avaliação automática de risco ambiental;
* alertas operacionais;
* indicadores regionais;
* dashboards com atualização periódica.

O objetivo é apoiar **governos, Defesa Civil, ONGs e instituições** no acompanhamento preventivo de riscos como enchentes, deslizamentos, tempestades e baixa qualidade do ar.

---

## Integrantes

| RM       | Nome                             |
| -------- | -------------------------------- |
| RM561408 | Gustavo Crevelari Monteiro Porto |
| RM561996 | Lucca de Araujo Gomes            |
| RM561671 | Rafaela Ferreira Santos          |
| RM566224 | Victor Sabelli Rocha Batista     |

---

## Público-alvo

A aplicação possui dois perfis de demonstração:

| Perfil                 | Objetivo                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Governo / Defesa Civil | Monitoramento operacional, gestão de regiões, estações, alertas e análise de risco   |
| ONG                    | Acompanhamento ambiental, visualização de regiões monitoradas, alertas e indicadores |

---

## Funcionalidades Principais

* Dashboard operacional com KPIs, gráficos e atalhos;
* Listagem e CRUD de regiões monitoradas;
* Cadastro e listagem de estações IoT;
* Página dedicada para detalhe da estação;
* Telemetria IoT em tempo quase real;
* Histórico dos sensores por estação;
* Observação climática atual por região;
* Console de alertas com filtros e resolução;
* Indicadores regionais com filtros e gráficos;
* Filtros híbridos com digitação e seleção;
* Atualização automática via polling silencioso;
* Layout responsivo para desktop e mobile.

---

## Fluxo IoT da Solução

O fluxo de dados da aplicação é:

```text
Wokwi / ESP32
        ↓ MQTT
Broker MQTT
        ↓
API Java Spring Boot
        ↓
Oracle Database
        ↓
Endpoints REST
        ↓
Frontend Expo / React Native Web
```

A estação IoT envia telemetria para o tópico MQTT:

```text
app/estacoes/{codigoEstacao}/telemetria
```

Exemplo usado na demonstração:

```text
app/estacoes/AMANAJE-SP-RP-001/telemetria
```

Payload esperado:

```json
{
  "stationCode": "AMANAJE-SP-RP-001",
  "timestamp": "2026-06-07T19:20:00",
  "waterDistanceCm": 80,
  "waterLevelPercent": 73,
  "tiltAngle": 18.5,
  "vibration": 0.72,
  "pressureHpa": 998.4,
  "pm25": 118,
  "pm10": 180
}
```

Esses dados são persistidos pela API Java e utilizados no cálculo de risco ambiental.

---

## Sensores Simulados

| Sensor           | Simulação / Componente        | Dados enviados                     |
| ---------------- | ----------------------------- | ---------------------------------- |
| HC-SR04          | Sensor ultrassônico           | Distância da água e nível do canal |
| BMP180           | Sensor barométrico            | Pressão atmosférica                |
| MPU6050          | Acelerômetro / giroscópio     | Inclinação e vibração              |
| PMS5003 simulado | Potenciômetro Slider no Wokwi | PM2.5 e PM10                       |

---

## Cálculo de Risco

O backend calcula riscos combinando:

```text
Última leitura IoT válida
+
Última observação climática recente
```

As categorias avaliadas são:

* Enchente;
* Deslizamento;
* Tempestade;
* Qualidade do ar.

As observações climáticas incluem dados como:

* temperatura;
* umidade;
* precipitação;
* vento;
* pressão atmosférica;
* índice UV;
* radiação solar.

Quando um risco atinge nível **ALTO** ou **CRÍTICO**, o backend pode gerar alertas automaticamente.

---

## Como Executar Localmente

Instalar dependências:

```bash
npm install
```

Executar o projeto em modo web:

```bash
npx expo start --web --port 8082
```

Acessar no navegador:

```text
http://localhost:8082
```

> **Importante:** usar a porta `8082`, pois a API Java está configurada para aceitar CORS a partir de `http://localhost:8082`.

---

## Scripts Disponíveis

```bash
npm run typecheck
```

Executa a verificação TypeScript.

```bash
npm run build:web
```

Gera o build web estático em `dist/`.

```bash
npm run preview:web
```

Pré-visualiza o build gerado localmente.

---

## Build Web

Gerar build de produção:

```bash
npm run build:web
```

O build será gerado na pasta:

```text
dist/
```

Pré-visualizar:

```bash
npm run preview:web
```

Ou diretamente:

```bash
npx serve dist
```

---

## Deploy na Vercel

### Configurações do Projeto

| Parâmetro        | Valor                    |
| ---------------- | ------------------------ |
| Framework Preset | Other                    |
| Build Command    | `npx expo export -p web` |
| Output Directory | `dist`                   |
| Install Command  | `npm install`            |

### Variáveis de Ambiente

Nenhuma variável de ambiente é obrigatória no frontend.

A URL da API está definida em:

```text
src/constants/api.ts
```

Base URL:

```text
https://gs-java-advanced.onrender.com
```

### vercel.json

O projeto possui um arquivo `vercel.json` configurado para funcionar com Expo Router.

As rotas aninhadas são redirecionadas para o `index.html`, evitando erro 404 ao atualizar diretamente páginas como:

```text
/regioes/8
/estacoes/9?idRegiao=8
/alertas
/indicadores
```

---

## Backend no Render — Cold Start

A API Java está hospedada no Render.

Em planos gratuitos, o serviço pode entrar em modo de inatividade após um período sem acessos.

Por isso:

* o primeiro acesso pode demorar alguns segundos;
* a tela inicial do frontend executa um warm-up chamando `GET /api/health`;
* durante o carregamento, o usuário vê a mensagem `"Aguardando servidor..."`;
* após a API responder, o app redireciona para a seleção de contexto.

Endpoint de health:

```text
https://gs-java-advanced.onrender.com/api/health
```

---

## Estrutura de Rotas

> Observação: `(app)` é apenas um grupo interno do Expo Router e não aparece na URL pública.

| Rota pública                         | Tela                            |
| ------------------------------------ | ------------------------------- |
| `/`                                  | Warm-up da API                  |
| `/context-selector`                  | Seleção de perfil               |
| `/dashboard`                         | Dashboard                       |
| `/regioes`                           | Regiões monitoradas             |
| `/regioes/nova`                      | Cadastro de região              |
| `/regioes/[id]`                      | Detalhe da região               |
| `/regioes/[id]/editar`               | Edição da região                |
| `/alertas`                           | Console de alertas              |
| `/estacoes`                          | Estações IoT                    |
| `/estacoes/[id]?idRegiao={idRegiao}` | Detalhe da estação e telemetria |
| `/indicadores`                       | Indicadores regionais           |

---

## Principais Endpoints Consumidos

| Método | Endpoint                                          | Uso no frontend               |
| ------ | ------------------------------------------------- | ----------------------------- |
| GET    | `/api/health`                                     | Warm-up da API                |
| GET    | `/api/dashboard/summary`                          | KPIs do dashboard             |
| GET    | `/api/regioes`                                    | Listagem e filtros de regiões |
| GET    | `/api/regioes/{id}`                               | Detalhe da região             |
| POST   | `/api/regioes`                                    | Cadastro de região            |
| PUT    | `/api/regioes/{id}`                               | Edição de região              |
| DELETE | `/api/regioes/{id}`                               | Inativação de região          |
| GET    | `/api/estacoes/regiao/{idRegiao}`                 | Estações de uma região        |
| POST   | `/api/estacoes`                                   | Cadastro de estação           |
| GET    | `/api/regioes/{id}/leituras`                      | Leituras IoT da região        |
| GET    | `/api/regioes/{id}/risco-atual`                   | Risco atual da região         |
| GET    | `/api/regioes/{id}/observacoes-climaticas/ultima` | Observação climática atual    |
| GET    | `/api/alertas`                                    | Console de alertas            |
| PUT    | `/api/alertas/{id}/resolver`                      | Marcar alerta como resolvido  |
| GET    | `/api/indicadores-regionais`                      | Indicadores regionais         |

---

## Atualização em Tempo Quase Real

O frontend utiliza polling silencioso a cada 10 segundos em telas críticas.

Exemplos:

* Dashboard;
* Alertas;
* Detalhe da região;
* Detalhe da estação;
* Indicadores;
* Observação climática atual.

Durante o polling:

* os dados são atualizados em segundo plano;
* a interface não fica piscando;
* os cards e gráficos continuam visíveis;
* novos dados aparecem automaticamente quando a API retorna.

---

## Destaques da Interface

### Dashboard

* KPIs operacionais;
* distribuição de risco;
* status dos alertas;
* cobertura por estado;
* atalhos para páginas filtradas.

### Regiões Monitoradas

* busca e filtros;
* cadastro, edição e inativação;
* detalhe da região;
* leitura IoT recente;
* risco atual;
* observação climática atual;
* estações vinculadas.

### Estações IoT

* seleção de região;
* cadastro de estação;
* detalhe da estação;
* telemetria atual;
* histórico dos sensores;
* gráficos agregados por período.

### Alertas

* busca;
* filtros por status, nível, tipo, região e estado;
* link para detalhe da região;
* ação para marcar alerta como resolvido.

### Indicadores

* indicadores regionais;
* filtros por região, estado, cidade, tipo e nível de risco;
* gráficos de distribuição;
* análise por sensores.

---

## Tecnologias Utilizadas

* Expo SDK 56;
* React Native Web;
* Expo Router;
* TypeScript;
* Victory Native;
* React Native SVG;
* React Native Skia;
* React Native Reanimated;
* React Native Gesture Handler;
* Vercel;
* API Java Spring Boot no Render;
* Oracle Database no backend.

---

## Qualidade e Verificação

Comandos recomendados antes de entregar ou publicar:

```bash
npx tsc --noEmit
npx expo-doctor
npx expo install --check
npm run build:web
```

Resultado esperado:

```text
TypeScript sem erros
Expo Doctor sem problemas
Dependências compatíveis
Build web gerado com sucesso
```

---

## Repositório

```text
https://github.com/gs-1-tdspo2/gs-mobile-application-development
```

---
