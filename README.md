# AI Image Studio

A full-featured AI Image Generation & Editing Studio built with **FastAPI** and **Next.js 14**. Generate images from text prompts using DALL-E 3, edit with an inpainting canvas, remove backgrounds, manage a gallery, and organise everything into collections.

---

## ✦ Features

- **Text-to-Image Generation** — DALL-E 3 (primary) or Stability AI (fallback), 1–4 batch, 15+ style presets, all aspect ratios
- **Inpainting Canvas** — Fabric.js-powered brush mask tool, AI fills the selected region
- **Outpainting** — Extend image canvas in any direction with AI-generated content
- **Background Removal** — remove.bg API (online, production-ready), optional color or AI-generated replacement
- **Image-to-Image** — Upload a reference image and transform it with a prompt + strength slider
- **Style Transfer** — Apply artistic styles to any image
- **Prompt Engineering** — AI-powered prompt enhancer, Surprise Me generator, 10+ templates, modular Prompt Builder
- **Gallery** — Masonry grid, full-text search, filters, favorites, custom tags, lazy loading
- **Collections** — Create folders, add/remove images, batch ZIP download
- **Authentication** — JWT-based register/login with username, email, password
- **Cloudinary Storage** — All images stored on Cloudinary, only URLs in the database

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI · Python 3.11 · Uvicorn |
| Database | PostgreSQL · SQLAlchemy async · Alembic |
| AI | OpenAI DALL-E 3 · Stability AI |
| Background Removal | remove.bg API · Clipdrop API |
| Storage | Cloudinary |
| Auth | JWT (python-jose) · bcrypt (passlib) |
| Frontend | Next.js 14 App Router · TypeScript |
| Styling | Tailwind CSS · shadcn/ui · Radix UI |
| Canvas | Fabric.js |
| State | Zustand |
| HTTP | Axios |
| Forms | React Hook Form · Zod |

---

## 📁 Project Structure

```
ai-image-studio/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings from environment variables
│   │   ├── dependencies.py      # JWT auth dependency
│   │   ├── middleware/          # Rate limiting, request logging
│   │   ├── models/              # SQLAlchemy ORM models + Pydantic schemas
│   │   ├── routers/             # auth, generate, edit, upload, gallery, collections, prompt
│   │   └── services/            # image_generator, image_editor, storage, prompt_service
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # pytest test suite (60 tests)
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── Procfile                 # Render deployment
│   └── render.yaml              # Render service config
│
└── frontend/
    ├── src/
    │   ├── app/                 # Next.js App Router pages
    │   │   ├── page.tsx         # Landing page
    │   │   ├── (auth)/          # Login, Register
    │   │   ├── studio/          # Generation Studio
    │   │   ├── editor/          # Inpaint/Edit canvas
    │   │   ├── gallery/         # Gallery + Image detail
    │   │   └── collections/     # Collections list + detail
    │   ├── components/          # layout, studio, editor, gallery, shared
    │   ├── store/               # Zustand stores (auth, generation, gallery, editor)
    │   ├── lib/api/             # Axios API modules
    │   ├── hooks/               # useAuth, useGenerate, useGallery, useDebounce
    │   └── types/               # TypeScript interfaces
    ├── vercel.json              # Vercel deployment config
    └── package.json
```

---

## 🚀 Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ running locally
- A [Cloudinary](https://cloudinary.com) account (free tier works)
- An [OpenAI](https://platform.openai.com) API key
- A [remove.bg](https://www.remove.bg/api) API key

---

### 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-image-studio.git
cd ai-image-studio
```

---

### 2 — Backend setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your actual values (see Environment Variables section below)

# Create the database
createdb ai_studio              # or use your PostgreSQL client

# Run migrations
alembic upgrade head

# Start the dev server
uvicorn app.main:app --reload --port 8000
```

API will be available at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

---

### 3 — Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start the dev server
npm run dev
```

App will be available at `http://localhost:3000`

---

## 🔑 Environment Variables

### Backend — `backend/.env`

```env
# ── Application ────────────────────────────────────────────
APP_NAME=AI Image Studio
APP_ENV=development
DEBUG=True

# ── Security ───────────────────────────────────────────────
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-super-secret-key-minimum-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ── Database ───────────────────────────────────────────────
# Must use asyncpg driver — postgresql+asyncpg://
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/ai_studio

# ── Cloudinary (all images stored here) ───────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── AI Providers ───────────────────────────────────────────
# Primary: OpenAI DALL-E 3
OPENAI_API_KEY=sk-...

# Fallback: Stability AI (optional)
STABILITY_API_KEY=sk-...
STABILITY_API_HOST=https://api.stability.ai

# ── Background Removal ─────────────────────────────────────
# Option A: remove.bg (recommended) — https://www.remove.bg/api
REMOVE_BG_API_KEY=your_remove_bg_key

# Option B: Clipdrop by Stability AI (fallback)
# CLIPDROP_API_KEY=your_clipdrop_key

# ── CORS ───────────────────────────────────────────────────
# Comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend — `frontend/.env.local`

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Cloudinary (for direct URL display only — no uploads from frontend)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

---

## 📡 API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | — |
| `POST` | `/api/auth/login` | Login, returns JWT | — |
| `GET` | `/api/auth/me` | Current user profile | ✓ |
| `POST` | `/api/generate` | Text-to-image (1–4 batch) | ✓ |
| `POST` | `/api/generate/variations` | Generate variations of an image | ✓ |
| `GET` | `/api/styles` | List all style presets | ✓ |
| `POST` | `/api/upload` | Upload reference image | ✓ |
| `POST` | `/api/upload/mask` | Upload inpaint mask (base64) | ✓ |
| `POST` | `/api/edit/inpaint` | Inpaint masked region | ✓ |
| `POST` | `/api/edit/outpaint` | Extend image canvas | ✓ |
| `POST` | `/api/edit/remove-bg` | Remove background | ✓ |
| `POST` | `/api/edit/img2img` | Image-to-image transform | ✓ |
| `POST` | `/api/edit/style-transfer` | Apply artistic style | ✓ |
| `GET` | `/api/gallery` | List images (search, filter, paginate) | ✓ |
| `GET` | `/api/gallery/{id}` | Image details + metadata | ✓ |
| `DELETE` | `/api/gallery/{id}` | Delete image | ✓ |
| `POST` | `/api/gallery/{id}/favorite` | Toggle favorite | ✓ |
| `POST` | `/api/gallery/{id}/tags` | Set tags | ✓ |
| `GET` | `/api/gallery/{id}/download` | Download (format + resolution) | ✓ |
| `POST` | `/api/download/batch` | Batch download as ZIP | ✓ |
| `GET` | `/api/history` | Generation history | ✓ |
| `GET` | `/api/collections` | List collections | ✓ |
| `POST` | `/api/collections` | Create collection | ✓ |
| `GET` | `/api/collections/{id}` | Collection + images | ✓ |
| `PUT` | `/api/collections/{id}` | Update collection | ✓ |
| `DELETE` | `/api/collections/{id}` | Delete collection | ✓ |
| `POST` | `/api/collections/{id}/add` | Add images to collection | ✓ |
| `DELETE` | `/api/collections/{id}/remove` | Remove images from collection | ✓ |
| `GET` | `/api/collections/{id}/download` | Download collection as ZIP | ✓ |
| `POST` | `/api/prompt/enhance` | AI-enhance a prompt | ✓ |
| `GET` | `/api/prompt/random` | Random creative prompt | ✓ |
| `GET` | `/api/prompt/templates` | List prompt templates | ✓ |
| `GET` | `/health` | Health check | — |

All protected routes require `Authorization: Bearer <token>` header.

---

## 🗄️ Database Schema

```
users               → id, username, email, hashed_password, is_active, created_at
images              → id, user_id (FK), image_url, thumbnail_url, cloudinary_public_id,
                      prompt, negative_prompt, style, aspect_ratio, quality,
                      seed, provider, operation, width, height, file_size,
                      format, is_favorite, tags, created_at
collections         → id, user_id (FK), name, description, cover_image_url, created_at
image_collections   → id, image_id (FK), collection_id (FK), added_at  [many-to-many]
```

---

## 🧪 Running Tests

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest tests/ -v

# Run specific module
pytest tests/test_auth.py -v
pytest tests/test_services.py -v
pytest tests/test_gallery_collections.py -v

# With coverage
pip install pytest-cov
pytest tests/ --cov=app --cov-report=term-missing
```

60 tests across auth, gallery, collections, services, and mocked AI endpoints.

---

## ☁️ Deployment

### Backend → Render

1. Push `backend/` to a GitHub repo
2. Go to [render.com](https://render.com) → **New Web Service** → connect repo
3. Set root directory to `backend`
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables from the table above (production values)
7. Create a **PostgreSQL** database on Render, copy the Internal URL
8. Change its scheme to `postgresql+asyncpg://...` and set as `DATABASE_URL`
9. After first deploy, open the **Shell** tab and run: `alembic upgrade head`

> **Note:** The free Render tier spins down after 15 min of inactivity. Use the Starter plan ($7/mo) for always-on.

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import repo
3. Vercel auto-detects Next.js — no build settings needed
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-api.onrender.com`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = your cloud name
5. Click **Deploy**
6. Copy your Vercel URL and update `ALLOWED_ORIGINS` on Render to match

---

## 🔧 Useful Commands

```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Create a new database migration
alembic revision --autogenerate -m "describe your change"

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Frontend type check
cd frontend && npx tsc --noEmit

# Frontend production build (test before deploying)
cd frontend && npm run build
```

---

## 📦 Free Tier Limits to Know

| Service | Free Tier Limit |
|---|---|
| Render Web Service | Spins down after 15 min inactivity |
| Render PostgreSQL | 90-day expiry, 1GB storage |
| Cloudinary | 25 credits/month (~25,000 transformations) |
| OpenAI DALL-E 3 | ~$0.04–0.08 per image (pay-as-you-go) |
| remove.bg | 50 free API calls/month |
| Vercel | 100GB bandwidth/month, unlimited deploys |

---

## 📄 License

MIT — free to use, modify, and distribute.

---

## Built With

- [FastAPI](https://fastapi.tiangolo.com)
- [Next.js](https://nextjs.org)
- [OpenAI API](https://platform.openai.com)
- [Cloudinary](https://cloudinary.com)
- [remove.bg](https://www.remove.bg)
- [Fabric.js](http://fabricjs.com)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)