# Plataforma Médica Integrada

Plataforma SaaS médica composta por um front-end React/Vite e quatro
microserviços (backend principal + IA generativa + transcrição + OCR).
Originada de um projeto de Iniciação Científica.

## Estrutura

```
.
├── frontend/        SPA React (Vite + Tailwind + shadcn)
│   ├── src/api/     Camada HTTP (axios + interceptors)
│   ├── src/auth/    AuthContext + ProtectedRoute (JWT)
│   ├── src/config/  env.ts (lê VITE_* do bundle)
│   └── src/components/
├── backend/         API REST (FastAPI + SQLAlchemy + Postgres)
│   └── app/         routers, models, schemas, security, deps
├── IA_IC/           Microserviço de IA (FastAPI + LangChain + Groq)
├── Transcricao/     Microserviço Whisper (FastAPI)
└── OCR/             Microserviço OCR (Node + Tesseract.js)
```

## 🧪 Modo de teste local (sem banco, sem Docker)

Você tem **duas opções** para testar a plataforma sem precisar de Postgres,
OCR, IA ou Whisper rodando.

### Opção A — só o front, com dados fake (mais rápido)

```bash
cp .env.example .env       # já vem com VITE_USE_MOCK=true
npm install
npm run dev                # http://localhost:3000
```

**Login de teste:**
- E-mail: `admin@local`
- Senha: `admin123`

(Aceita também qualquer e-mail com a senha `demo`.) Os dados ficam em
memória do navegador — recarregar a aba reseta tudo. O console mostra um
banner amarelo confirmando que o modo demo está ativo.

### Opção B — front + backend com SQLite (sem Postgres)

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env       # já vem com SQLite (sqlite:///./dev.db)
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100

# Terminal 2 — front
cd ..
cp .env.example .env
# Edite .env e troque VITE_USE_MOCK para false
npm install
npm run dev
```

**Login de teste** (mesmas credenciais — vêm de `ADMIN_BOOTSTRAP_*` no
`backend/.env`):
- E-mail: `admin@local`
- Senha: `admin123`

O backend cria o admin automaticamente no primeiro start e grava num
arquivo `backend/dev.db` (já no `.gitignore`).

> ⚠️ As credenciais `admin@local / admin123` são **só para teste local**.
> Em qualquer ambiente além da sua máquina, troque `JWT_SECRET` e
> `ADMIN_BOOTSTRAP_PASSWORD` antes de subir.

## Setup rápido (com Docker)

```bash
# 1. Copie todos os .env.example
cp .env.example .env
cp backend/.env.example backend/.env
cp IA_IC/.env.example IA_IC/.env
cp Transcricao/.env.example Transcricao/.env
cp OCR/.env.example OCR/.env

# 2. Edite os .env (especialmente GROQ_API_KEY e JWT_SECRET)

# 3. Suba tudo
docker compose up -d --build

# 4. Acesse http://localhost
#    Primeiro login com ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD
```

## Setup local (sem Docker)

```bash
# Front
cp .env.example .env
npm install
npm run dev

# Backend
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100

# IA Laudo
cd IA_IC
pip install -r requirements.txt
uvicorn main:app --reload --port 8200

# Transcrição (precisa do ffmpeg no PATH)
cd Transcricao
pip install -r requirements.txt
uvicorn main:app --reload --port 8300

# OCR
cd OCR
npm install
npm start
```

## Portas e endpoints

| Serviço      | Porta  | Health |
|--------------|--------|--------|
| Front (prod) | 80     | /health |
| Front (dev)  | 3000   | -       |
| Backend      | 8100   | /health |
| IA Laudo     | 8200   | /health |
| Transcrição  | 8300   | /health |
| OCR          | 8000   | /health |
| Postgres     | 5432   | -       |

## Segurança

- **Autenticação JWT** com `passlib[bcrypt]` para senhas e `python-jose` para tokens.
- **Login não permite auto-cadastro** — apenas admin cria novos usuários (`POST /auth/register`).
- **Bootstrap**: o backend cria um admin inicial (`ADMIN_BOOTSTRAP_*`) na primeira execução. Troque a senha no primeiro login.
- **CORS configurável** em todos os serviços (jamais `"*"`).
- **Security headers** no Nginx: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **Tokens** ficam por padrão em `sessionStorage` (somem ao fechar o navegador). "Manter conectado" migra para `localStorage`.
- **Senhas e segredos** nunca estão no código — sempre em `.env` (que é ignorado pelo Git).
- **Limites de upload** configuráveis em todos os serviços (default: 10 MB OCR, 20 MB transcrição, 25 MB nginx).
- **Validação de tipos MIME** em uploads (OCR e transcrição).
- **Containers rodam como usuário não-root** (uid 10001).

## Variáveis de ambiente principais

### Backend
- `DATABASE_URL` — URL completa do Postgres
- `JWT_SECRET` — segredo de assinatura (gere com `python -c "import secrets; print(secrets.token_urlsafe(64))"`)
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` (default 60), `JWT_REFRESH_TOKEN_EXPIRE_DAYS` (default 7)
- `CORS_ORIGINS` — origens separadas por vírgula
- `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`

### IA Laudo
- `GROQ_API_KEY`, `GROQ_MODEL`
- `CORS_ORIGINS`

### Transcrição
- `WHISPER_MODEL` (tiny/base/small/medium/large), `WHISPER_LANGUAGE`
- `IA_URL` — URL interna do serviço de IA

### OCR
- `MAX_UPLOAD_MB`, `TESSERACT_LANG`

## Comandos úteis

```bash
docker compose up -d --build       # subir tudo
docker compose logs -f backend     # logs do backend
docker compose down -v             # derrubar tudo + apagar volumes
docker compose exec db psql -U postgres plataforma_medica
```

## ⚠️ Aviso de LGPD / PHI

Foi encontrado, em `backend/models/Database/uploads/`, um conjunto de áudios
de consultas e fotos de exames de pacientes reais versionados no Git. Esse
material foi **adicionado ao `.gitignore`**, mas continua no **histórico**
do repositório se já foi commitado anteriormente. Veja
`backend/models/Database/DEPRECATED.md` para o passo-a-passo de remoção do
histórico (`git filter-repo`/BFG) e migração para storage privado.

Enquanto não sanear o histórico, **o repositório não deve ser tornado público**.

## Status

Iniciação Científica em desenvolvimento. A IA atua **apenas como suporte**, não substituindo o médico.
