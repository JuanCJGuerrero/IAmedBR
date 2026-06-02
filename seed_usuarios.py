"""
Seed de usuários de teste — execute DENTRO do container pm-backend:

  docker exec -it pm-backend python /app/seed_usuarios.py

Ou no host (com o banco rodando via Docker e porta exposta):

  cd backend
  python ../seed_usuarios.py

Cria os três papéis: admin, medico, secretaria.
Idempotente — não duplica se o e-mail já existe.
"""

import os, sys

# Adiciona o backend ao path para importar os módulos do app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.database import SessionLocal, Base, engine
from app.models import Usuario
from app.security import hash_password

Base.metadata.create_all(bind=engine)

USUARIOS = [
    {
        "nome": "Administrador",
        "email": "admin@local",
        "password": "admin123",
        "papel": "admin",
    },
    {
        "nome": "Dr. João Silva",
        "email": "medico@local",
        "password": "medico123",
        "papel": "medico",
    },
    {
        "nome": "Ana Secretaria",
        "email": "secretaria@local",
        "password": "secreta123",
        "papel": "secretaria",
    },
]

with SessionLocal() as db:
    for u in USUARIOS:
        existing = db.query(Usuario).filter(Usuario.email == u["email"]).first()
        if existing:
            print(f"  ✓ já existe: {u['email']} ({u['papel']})")
        else:
            novo = Usuario(
                nome=u["nome"],
                email=u["email"],
                senha_hash=hash_password(u["password"]),
                papel=u["papel"],
                ativo=True,
            )
            db.add(novo)
            print(f"  + criado:    {u['email']} / {u['password']} ({u['papel']})")
    db.commit()

print("\nUsuários de teste disponíveis:")
print("  admin@local      / admin123   → Administrador")
print("  medico@local     / medico123  → Médico / Radiologista")
print("  secretaria@local / secreta123 → Secretaria")
