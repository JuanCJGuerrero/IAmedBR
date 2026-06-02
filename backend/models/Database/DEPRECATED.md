# ⚠️ Backend legado — NÃO USE

Esta pasta (`backend/models/Database/`) contém uma versão **antiga e completa** do
backend, que foi substituída por `backend/app/`.

Mantida temporariamente apenas como referência durante a migração. Pode ser
**deletada inteira** depois que você confirmar que tudo continua funcionando
com a nova estrutura.

## ⚠️ Conteúdo sensível (LGPD)

A pasta `uploads/` que estava aqui contém **dados reais de pacientes**:
- áudios de consultas (`uploads/audios/*.webm`)
- imagens de exames (`uploads/exames/laudo_*/*.jpg`)

Esses arquivos **não devem estar versionados em Git**. O `.gitignore` da raiz
agora os ignora, mas se já foram commitados no histórico, é preciso
**remover do histórico Git** e considerar um aviso de incidente:

```bash
# 1) Remover do índice (mantém os arquivos no disco):
git rm -r --cached backend/models/Database/uploads

# 2) Confirmar com .gitignore atualizado:
git add .gitignore
git commit -m "remove PHI uploads from version control"

# 3) Apagar do histórico — opção recomendada (instalar git-filter-repo antes):
git filter-repo --path backend/models/Database/uploads --invert-paths

# 4) Forçar push (todo mundo precisa re-clonar depois):
git push --force --all
```

Depois disso, **mova os arquivos reais para um storage seguro** (ex.: bucket
S3 com criptografia em repouso e ACL privada) e altere o backend para
referenciar URLs assinadas em vez de arquivos no filesystem do container.

## Diferenças relevantes vs. o novo backend

| Tema | Antigo (este) | Novo (`backend/app/`) |
|------|---------------|------------------------|
| Tabelas | `paciente`, `medico`, `secretaria`, `laudo_paciente`, `laudo_base`, `audio`, `exames`, `laudo_chunks` | `pacientes`, `usuarios` (unificado), `laudos`, `laudos_base`, `audios`, `exames`, `tipos_laudo` |
| Auth | Tabelas separadas, sem JWT consolidado | Tabela única `usuarios` com `papel`, JWT + bcrypt |
| RAG | `laudo_chunks` com embeddings em texto | Não implementado ainda (placeholder) |

Se você quiser **preservar embeddings/RAG** do backend antigo, planeje uma
migração de dados antes de descartar esta pasta.
