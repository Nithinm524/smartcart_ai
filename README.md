# SmartCart AI — Intelligent Shopping Assistant & Cart Optimizer

SmartCart AI is a production-grade, full-stack shopping intelligence platform designed to eliminate buyer regret and optimize personal commerce. Powered by Google DeepMind's Gemini API, SmartCart AI provides intelligent product discovery, real-time spec comparisons, proactive budget auditing, and multi-store cart optimization.

---

## 🚀 Key Features

- **Gemini AI Shopping Co-Pilot**: Conversational product advisor (`/api/assistant`) that understands budget constraints, technical specifications, and lifestyle needs.
- **Deep Spec & Value Comparison**: Side-by-side spec evaluations with buyer sentiment analysis, pros/cons breakdown, and value scores (`/api/compare`).
- **Cart Optimization & Budget Guardian**: Automated basket analysis (`/api/optimize-cart`) that identifies cost-saving alternatives and warns of impending budget overruns.
- **Setup Synthesizer & Shopping Lists**: Multi-component setup generator (`/api/generate-list`) that curates complete setups within fixed target budgets.
- **Personalized Recommendations**: Dynamic catalog matching (`/api/recommendations`) tuned to your preferred shopping style (e.g., Best Value, Premium Quality, Budget Strict, Sustainable).
- **Alternative Product Finder**: Context-aware product replacement suggestions (`/api/find-alternatives`) for items that exceed budget or lack desired features.
- **Cloud Firestore Persistence**: Multi-tenant, encrypted cloud storage for shopping lists, saved items, activity history, and custom user preferences.
- **Responsive & Accessible UI**: Clean, accessible, high-contrast interface with keyboard navigation, zero layout shifts, and mobile-friendly touch targets.

---

## 🛡️ Security & Architecture

SmartCart AI enforces strict production security standards:

1. **Server-Side API Key Protection**: The `GEMINI_API_KEY` is strictly confined to the backend server (`server.ts` / `src/server/apiRouter.ts`). It is never bundled into or transmitted to the client application.
2. **Strict Firestore Security Rules**: All user-authored records (shopping lists, saved items, preferences, activity history) are isolated under `/users/{userId}/*` and enforce `request.auth.uid == userId`. Catalog collections are read-only for shoppers.
3. **Input Sanitization & Validation**: All 8 server endpoints validate and sanitize string and numeric inputs to prevent prompt injection and malformed requests.
4. **Rate Limiting & DoS Protection**: Sliding-window rate limiting restricts API clients to 60 requests per minute per IP address, with a maximum JSON payload ceiling of 512KB.
5. **Security Headers**: Standard defense-in-depth HTTP headers (`X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`) are applied to all responses, and `X-Powered-By` is removed.

---

## ⚙️ Environment Variables

Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key used for all AI inference endpoints. | *(None)* |
| `PORT` | No | Port on which the HTTP server listens (injected automatically in Cloud Run). | `3000` |
| `NODE_ENV` | No | Application environment (`development` or `production`). | `development` |

> **Note**: Never commit your `.env` file or actual secret keys to source control.

---

## 💻 Local Development Setup

### Prerequisites

- Node.js 18+ or 20+
- npm 9+ or Bun

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000` with hot module reloading and full API routing enabled.

---

## 🏗️ Production Build & Verification

To verify and produce production artifacts:

```bash
# Type check and lint validation
npm run lint

# Compile frontend and bundle backend server for production
npm run build

# Start the compiled production server
npm start
```

The production build:
- Compiles the React SPA into static assets in `dist/`.
- Bundles `server.ts` into a standalone CommonJS file at `dist/server.cjs` using `esbuild`.
- Serves static assets with fallback routing and live API endpoints.

---

## ☁️ Google Cloud Run Deployment

SmartCart AI is 100% compliant with Google Cloud Run containerization and auto-scaling.

### Cloud Run Port Binding

The backend dynamically detects and binds to the `PORT` environment variable required by Cloud Run:

```typescript
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
```

### Deploying via gcloud CLI

```bash
# 1. Build and submit container image using Google Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/smartcart-ai

# 2. Deploy to Cloud Run with Gemini API Secret
gcloud run deploy smartcart-ai \
  --image gcr.io/YOUR_PROJECT_ID/smartcart-ai \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port=3000
```

### Health Check Endpoint

Cloud Run health probes and monitoring services can query the built-in health route:

```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "app": "SmartCart AI",
  "version": "1.0.0"
}
```

---

## 📂 Project Structure

```
smartcart-ai/
├── metadata.json             # AI Studio app metadata & capabilities
├── package.json              # Project dependencies & build scripts
├── firestore.rules           # Secure multi-tenant Firestore security rules
├── server.ts                 # Hardened Express server entry point
├── src/
│   ├── components/           # UI components (Header, Sidebar, ProductCard, BudgetProgressBar, etc.)
│   ├── context/              # Global AppContext (Firestore sync, Cart, Compare, Preferences)
│   ├── data/                 # Curated catalog seed products
│   ├── firebase/             # Client Firebase SDK configuration
│   ├── server/
│   │   ├── apiRouter.ts      # Sanitized Gemini API proxy endpoints
│   │   └── gemini.ts         # Server-side Gemini client with rate limiting & error handling
│   ├── types.ts              # TypeScript interface & type declarations
│   └── views/                # Primary application screens:
│       ├── DashboardView.tsx # Overview, demo tour, and financial guard
│       ├── ProductsView.tsx  # Catalog browsing, filtering, and alternatives
│       ├── AssistantView.tsx # Gemini conversational shopping co-pilot
│       ├── CartView.tsx      # Shopping cart & basket optimizer
│       ├── CompareView.tsx   # Side-by-side product comparison & radar
│       ├── ListsView.tsx     # Shopping lists & AI setup compiler
│       ├── HistoryView.tsx   # Persistent activity and query logs
│       └── SettingsView.tsx  # User preferences, budget, and auth controls
└── README.md                 # Project documentation & deployment guide
```

---

## 📄 License

MIT © 2026 SmartCart AI. Built for Google AI Studio Hackathon.
