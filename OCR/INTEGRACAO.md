# Integração OCR de Documentos Brasileiros
## IAmedBR — Plataforma Médica Integrada

> Substitui o microserviço `OCR/` (Node.js + Tesseract.js) por Python + PaddleOCR,
> com suporte nativo a RG, CNH, RNE e Passaporte brasileiro.

---

## Arquivos entregues

```
OCR/
├── main.py              ← App FastAPI (substitui index.js)
├── document_parser.py   ← Parser de campos para documentos BR
├── requirements.txt     ← Dependências Python
├── Dockerfile           ← Imagem Docker (drop-in replacement)
└── .env.example         ← Variáveis de ambiente

frontend/src/
├── api/ocr.ts           ← Camada HTTP para o serviço OCR
└── components/
    └── DocumentUpload.tsx  ← Componente de upload com auto-preenchimento
```

---

## 1. Substituir o microserviço OCR

### 1.1 Copiar os arquivos

Copie os arquivos da pasta `OCR/` deste pacote para dentro da pasta `OCR/` do seu
projeto, **substituindo** o conteúdo existente:

```
IAmedBR/
└── OCR/
    ├── main.py              ← novo
    ├── document_parser.py   ← novo
    ├── requirements.txt     ← novo (substituir)
    ├── Dockerfile           ← novo (substituir)
    └── .env.example         ← novo (substituir)
```

> O `index.js`, `package.json` e `node_modules/` do serviço antigo podem ser
> removidos — não são mais necessários.

### 1.2 Criar o `.env` do serviço OCR

```bash
cp OCR/.env.example OCR/.env
```

Conteúdo padrão (já funciona para desenvolvimento local):

```env
CORS_ORIGINS=http://localhost:3000
MAX_UPLOAD_MB=10
```

---

## 2. Atualizar o docker-compose.yml

O serviço mantém a **mesma porta 8000** e o mesmo endpoint `/health`,
então a maioria das configurações não muda. O único ajuste necessário é
o contexto de build, que agora usa Python em vez de Node:

Localize o bloco do serviço `ocr` no seu `docker-compose.yml` e confirme
que está assim (ou atualize se necessário):

```yaml
ocr:
  build:
    context: ./OCR
    dockerfile: Dockerfile
  ports:
    - "8000:8000"
  env_file:
    - ./OCR/.env
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "python", "-c",
           "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
    interval: 30s
    timeout: 10s
    retries: 3
```

> **Atenção:** Se o seu `docker-compose.yml` tinha `command: node index.js`
> ou similar no serviço `ocr`, remova essa linha — o `CMD` já está no Dockerfile.

---

## 3. Atualizar o `.env` do frontend

Adicione a variável abaixo no `.env` da raiz do projeto (ou `frontend/.env`):

```env
VITE_OCR_URL=http://localhost:8000
```

Em produção (com Docker/Nginx), use a URL interna do Docker ou o domínio público:

```env
# Exemplo produção
VITE_OCR_URL=https://api.seudominio.com.br/ocr
```

---

## 4. Copiar os arquivos do frontend

Copie os dois arquivos para dentro do seu projeto React:

```
frontend/src/api/ocr.ts                    ← camada HTTP
frontend/src/components/DocumentUpload.tsx ← componente de upload
```

> `ocr.ts` usa `axios` (já presente no projeto via `src/api/`).
> `DocumentUpload.tsx` usa apenas Tailwind (já configurado).
> Nenhuma dependência nova no frontend.

---

## 5. Usar o componente no formulário de cadastro

### Exemplo mínimo

```tsx
// Exemplo: página de cadastro de paciente
import { useState } from 'react'
import { DocumentUpload } from '@/components/DocumentUpload'

const camposVazios = {
  nome_completo: '',
  cpf: '',
  rg: '',
  data_nascimento: '',
  nome_pai: '',
  nome_mae: '',
  naturalidade: '',
  nacionalidade: '',
}

export function CadastroPage() {
  const [form, setForm] = useState(camposVazios)

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Cadastro de Paciente</h1>

      {/* Upload do documento — preenche o formulário automaticamente */}
      <DocumentUpload
        onExtracted={(campos) =>
          setForm((prev) => ({ ...prev, ...campos }))
        }
      />

      {/* Campos do formulário — já vêm preenchidos após o OCR */}
      <input
        placeholder="Nome completo"
        value={form.nome_completo}
        onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
        className="w-full border rounded p-2"
      />
      <input
        placeholder="CPF"
        value={form.cpf}
        onChange={(e) => setForm({ ...form, cpf: e.target.value })}
        className="w-full border rounded p-2"
      />
      {/* ...demais campos... */}
    </div>
  )
}
```

### Campos retornados pelo OCR

| Campo retornado       | Tipo            | Exemplo                  |
|-----------------------|-----------------|--------------------------|
| `nome_completo`       | string          | `"Maria Silva Santos"`   |
| `cpf`                 | string          | `"123.456.789-09"`       |
| `rg`                  | string          | `"12.345.678-9"`         |
| `data_nascimento`     | string dd/mm/aa | `"15/03/1990"`           |
| `nome_pai`            | string          | `"João Silva"`           |
| `nome_mae`            | string          | `"Ana Santos"`           |
| `naturalidade`        | string          | `"São Paulo"`            |
| `nacionalidade`       | string          | `"Brasileira"`           |
| `cnh_numero`          | string          | `"00123456789"` (CNH)    |
| `cnh_categoria`       | string          | `"B"` (CNH)              |

---

## 6. Testar localmente (sem Docker)

```bash
# Terminal — subir o serviço OCR
cd OCR
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Testar com `curl`:

```bash
# Enviar uma foto de RG
curl -X POST http://localhost:8000/ocr/document \
     -F "file=@/caminho/para/rg.jpg"

# Resposta esperada:
# {
#   "success": true,
#   "data": {
#     "document_type": "RG",
#     "name": "Maria Silva Santos",
#     "cpf": "123.456.789-09",
#     ...
#   }
# }
```

Documentação interativa (Swagger): http://localhost:8000/docs

---

## 7. Subir com Docker

```bash
# Na raiz do projeto IAmedBR
docker compose up -d --build ocr

# Verificar logs
docker compose logs -f ocr

# Testar health
curl http://localhost:8000/health
# → {"status":"ok","service":"ocr-br","version":"2.0.0"}
```

> **Primeira build:** O Dockerfile baixa os modelos PaddleOCR (~100 MB) durante
> o `docker build`. Isso é intencional — evita cold-start lento na primeira
> requisição. Em CI/CD, use cache de layers do Docker para não baixar toda vez.

---

## 8. Configurações para produção

### Nginx (já existente no projeto)

Adicione um location para o serviço OCR no seu `nginx.conf`:

```nginx
location /ocr/ {
    proxy_pass         http://ocr:8000/;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    client_max_body_size 10m;   # deve bater com MAX_UPLOAD_MB
}
```

### LGPD / PHI — atenção obrigatória

O microserviço OCR **não persiste nenhum arquivo** — processa em memória e
descarta. Mas atenção:

- **Não logue** o campo `raw_text` em produção — ele contém dados sensíveis do paciente.
- **Não armazene** as imagens enviadas sem consentimento explícito do paciente.
- O projeto já tem o aviso sobre PHI no histórico do Git (`DEPRECATED.md`).
  Sane o histórico antes de tornar o repositório público.

---

## 9. Ajuste fino do parser (quando necessário)

O `document_parser.py` usa regex + heurísticas para extrair os campos. Como
cada estado emite RG com layout diferente, pode ser necessário ajustar alguns
padrões. Os pontos mais comuns de falha e como corrigir:

**Nome não detectado:** O parser procura linhas com keyword `NOME` ou linhas
em MAIÚSCULAS com 2+ palavras. Se o OCR fragmentar o nome em múltiplas linhas,
aumente o contexto em `_extract_name()`.

**CPF não validado:** O dígito verificador está sendo checado. Se o OCR leu
um dígito errado (comum em imagens de baixa qualidade), a validação vai falhar.
Melhore a iluminação/resolução da foto.

**Datas trocadas:** O parser classifica datas por palavras-chave próximas
(`NASC`, `VALID`, `EXPEDI`). Se o documento não tiver esses labels, as datas
são atribuídas em ordem de aparição. Adicione keywords específicas do documento
em `_classify_dates()`.

---

## Dependências adicionadas ao projeto

| Serviço   | Antes                | Depois                            |
|-----------|----------------------|-----------------------------------|
| `OCR/`    | Node.js + Tesseract  | Python 3.11 + PaddleOCR + FastAPI |
| Frontend  | sem alteração        | `VITE_OCR_URL` no `.env`          |
| Backend   | sem alteração        | —                                 |
| Nginx     | sem alteração        | adicionar `location /ocr/`        |

Nenhuma dependência nova no `backend/` ou `IA_IC/`.
