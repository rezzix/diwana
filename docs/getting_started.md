# Getting Started — Diwana

Diwana is a full-stack customs declaration platform with a **Spring Boot** (Java) backend and a **React + Vite + TypeScript** frontend.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Java JDK | 21+ | `java -version` |
| Node.js | 22.x | `node -v` |
| npm | 10.x+ | `npm -v` |
| Gradle Wrapper | (included) | `./gradlew --version` |

---

## Quick Start

### 1. Clone & install dependencies

```bash
git clone <repo-url> diwana
cd diwana

# Frontend dependencies
cd frontend && npm install && cd ..

# Backend gradle wrapper (if missing)
# ./gradlew (auto-downloaded on first run)
```

### 2. Set up API keys

The application uses an AI Vision Model (VLM) to extract structured data from invoice documents. API keys are stored in a CSV file — **not** environment variables.

```bash
# Copy the sample and fill in real keys
cp backend/ai-keys.csv.sample backend/ai-keys.csv
```

Edit `backend/ai-keys.csv` with your real API keys:

```csv
provider;model;apiKey
Together AI;google/gemma-4-31B-it;tgp_v1_your-key-here
Together AI;moonshotai/Kimi-K2.6;tgp_v1_your-key-here
Fireworks AI;accounts/fireworks/models/kimi-k2p6;fw_your-key-here
Fireworks AI;accounts/fireworks/models/qwen3p6-plus;fw_your-key-here
HuggingFace;unsloth/Qwen3.6-27B-MTP-GGUF;hf_your-key-here
HuggingFace;ggml-org/gemma-4-26B-A4B-it-GGUF;hf_your-key-here
```

> **Important:** `backend/ai-keys.csv` is gitignored. It will **not** be committed.
> On a **deployed server**, place this file at `backend/ai-keys.csv` relative to the working directory,
> or set the `AI_KEYS_PATH` environment variable to its absolute path:
> ```bash
> export AI_KEYS_PATH=/opt/diwana/config/ai-keys.csv
> ```

### 3. Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *(empty)* | **No longer needed** — keys are loaded from `backend/ai-keys.csv` |
| `AI_KEYS_PATH` | *(empty)* | Optional absolute path to `ai-keys.csv` (for server deployments) |
| `SPRING_PROFILES_ACTIVE` | *(empty)* | Spring profile (not currently used) |

### 4. Start the backend

```bash
./gradlew :backend:bootRun
```

The backend starts on **`http://localhost:8080`**.

- H2 database file is stored at `backend/data/diwana-db`.
- **Dev mode** (`diwana.mode=dev`): data seeder automatically populates the database with demo data (users, companies, customs offices, HS codes, tariff rates, AI models, document types).
- To reset the database, stop the app and delete the database files:
  ```bash
  rm -f backend/data/diwana-db.*
  ```

### 5. Start the frontend (separate terminal)

```bash
cd frontend && npm run dev
```

The frontend starts on **`http://localhost:5173`** and proxies API requests to the backend.

---

## Modes

| Mode | Config | Login behavior |
|------|--------|---------------|
| **dev** | `diwana.mode=dev` (default) | Quick login bypasses password — click any user to auto-login |
| **demo** | `diwana.mode=demo` | Quick login fills only the username — you must type the password |
| **prod** | `diwana.mode=prod` | No quick login, standard username/password form |

Set the mode by editing `application.yml` or via environment variable:
```bash
diwana.mode=demo ./gradlew :backend:bootRun
```

## Quick login (dev / demo mode)

The data seeder creates the following demo accounts (password: `ADII4321` for all):

| Username | Role | Company / Office |
|----------|------|-----------------|
| `admin` | ADMIN | — |
| `ahmed` | DECLARANT | SMIE — Casablanca |
| `fatima` | DECLARANT | SMIE — Casablanca |
| `youssef` | DECLARANT | AFL — Agadir |
| `nadia` | DECLARANT | AFL — Agadir |
| `karim` | DECLARANT | CLG — Casablanca |
| `samira` | DECLARANT | CLG — Casablanca |
| `hicham` | CONTROLLER | Port de Casablanca |
| `latifa` | CONTROLLER | Aéroport de Casablanca |

In **dev mode**, use the **Quick Login** dropdown on the login page to bypass manual login.
In **demo mode**, quick login fills the username — you still need to type `ADII4321` as the password.

---

## Project structure

```
diwana/
├── backend/                          # Spring Boot application
│   ├── src/main/java/com/diwana/
│   │   ├── aimodel/                  # AI model management (CRUD, VLM fallback)
│   │   ├── common/                   # Shared DTOs, exceptions, error handling
│   │   ├── company/                  # Company profiles
│   │   ├── config/                   # DataSeeder, AiKeyLoader, OpenAiProperties
│   │   ├── customsoffice/            # Customs offices
│   │   ├── dashboard/                # Dashboard stats
│   │   ├── declaration/              # Core: declarations, line items, attachments, VLM
│   │   ├── documenttype/             # Document types
│   │   ├── hscode/                   # HS code reference data
│   │   ├── job/                      # Scheduled jobs (Job base class, VlmRetryJob)
│   │   ├── origin/                   # Countries of origin
│   │   ├── security/                 # Authentication, authorization
│   │   ├── storage/                  # File storage abstraction
│   │   ├── tariff/                   # Tariff rates
│   │   └── user/                     # User management
│   ├── ai-keys.csv.sample            # Sample API key file (copy and fill)
│   ├── ai-keys.csv                   # Real API keys (gitignored)
│   └── data/                         # H2 database + uploaded documents (gitignored)
├── frontend/                         # React + Vite + TypeScript
│   ├── src/
│   │   ├── api/                      # API client functions
│   │   ├── components/               # React components
│   │   ├── pages/                    # Page-level components
│   │   └── utils/                    # Shared utilities
│   └── package.json
├── docs/                             # Documentation
└── .gitignore
```

---

## Common workflows

### Upload an invoice and run Smart Import

1. Log in as a **declarant** (e.g., `ahmed`)
2. Create a declaration → upload a **Commercial Invoice** (PDF or image)
3. VLM import auto-starts — the button shows **"Importing..."**
4. After ~20–30s, the button changes to **"View Data"**
5. Click **"View Data"** to see extracted invoice fields and line items
6. Select valid line items and click **"Add lines to declaration"**

### View imported line items

1. Go to the declaration → **Edit Declaration**
2. The goods lines table shows all items added from the invoice
3. Edit or remove lines as needed
4. Click **"Save Changes"**

### Submit a declaration

1. Ensure all mandatory documents are uploaded and imported
2. Ensure all line items have required fields (HS code, description, quantity, unit price, total value)
3. Click **"Submit for Review"**

### Manage AI models (Admin)

1. Log in as `admin`
2. Go to **Admin Panel → AI Models**
3. Add, edit, or deactivate models
4. Set **Call Order** for auto-fallback priority (lower = tried first, empty = not auto-used)

### Manage jobs (Admin)

1. Log in as `admin`
2. Go to **Admin Panel → Jobs**
3. Enable/disable the **VLM Retry** job (disabled by default)
4. When enabled, it retries failed VLM imports every 60s (with a 10-minute cooldown since last attempt)

---

## Configuration reference

### Running on a different port

```bash
./gradlew :backend:bootRun --args='--server.port=9090'
```

### Production build

```bash
./gradlew :backend:build            # creates backend/build/libs/diwana.jar
cd frontend && npm run build        # creates frontend/dist/
```

Run the production JAR:
```bash
java -jar backend/build/libs/diwana.jar
```

### Resetting the database

```bash
rm -f backend/data/diwana-db.*
./gradlew :backend:bootRun
# The seeder re-creates all demo data on next startup
```
