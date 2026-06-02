# Backend de Laudos

> **Nota:** O conteúdo real do backend está em `backend/app/`.
> Este diretório é histórico e pode ser removido em um próximo commit.

API em Python com FastAPI e PostgreSQL.

## Como rodar (dev)

```bash
cd backend
cp .env.example .env       # ajuste segredos antes de subir
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100
```

## Endpoints principais

- `POST /auth/login` — login com e-mail/senha
- `GET  /auth/me` — usuário autenticado
- `GET  /pacientes` — lista pacientes (autenticação obrigatória)
- `POST /pacientes` — cria paciente
- `GET/POST/PUT/DELETE /laudos/...`
- `GET /laudos/tipos` — categorias
- `GET /laudos/base` — modelos de laudo
