# IAmedBR — Fundação do Design System

Configurar a base visual e técnica do SaaS médico **IAmedBR** antes de qualquer tela. Sem páginas novas nesta etapa — apenas tokens, fontes, componentes base e logotipo prontos para uso.

## Posicionamento (guia de tom)

> "Cuide do seu paciente enquanto a IA cuida do laudo."

SaaS para clínicas pequenas e médias no Brasil, foco em diagnóstico por imagem (radiologia, ultrassom, tomografia). Tom **profissional, clínico, premium**. Sem emojis em UI séria.

---

## 1. Paleta de cores (tokens HSL no `index.css`)

Todas as cores entram como variáveis CSS HSL e são expostas no `tailwind.config.ts` como classes utilitárias semânticas.

| Token | Uso | Valor |
|---|---|---|
| `--primary` | Azul principal | `#0066FF` |
| `--accent` | Verde clínico | `#10B981` |
| `--background-dark` | Fundo escuro hero/sections | `#0F172A` |
| `--foreground` | Texto principal | `#171717` |
| `--surface` | Fundo claro de seções | `#f6f7f9` |
| `--surface-muted` | Fundo claro alternativo | `#fafafa` |
| `--warning` | Alerta | `#F59E0B` |
| `--destructive` | Erro | `#EF4444` |
| `--white-70` | Branco translúcido sobre escuro | `rgba(255,255,255,0.7)` |

Também: `--ring` azul translúcido `rgba(37,99,235,.15)` para focus de inputs.

## 2. Tipografia (Google Fonts)

Importadas via `<link>` no `index.html` (preconnect + display=swap) e mapeadas em `tailwind.config.ts`:

- `font-serif` → **Instrument Serif** — headlines (palavras-chave em `italic`)
- `font-sans` → **Manrope** (semibold) — sub-headlines e botões
- `font-pill` → **Cabin** (medium) — pills/badges
- `font-body` → **Inter** (regular/medium) — corpo de texto (default `body`)

## 3. Logotipo `<Logo />`

Componente reutilizável em `src/components/Logo.tsx`:

- **Símbolo**: cubo/losango com cruz médica ao centro, traço `#0066FF`, em caixa `bg-white p-1.5 rounded-lg shadow-sm`. SVG inline.
- **Wordmark**: "IAmedBR" em **Manrope bold**, cor adaptável (escura no claro / branca no escuro) via prop `variant="light" | "dark"`.
- Props: `size` (`sm` | `md` | `lg`), `showWordmark` (bool), `variant`.

## 4. Componentes base (variantes shadcn estilizadas)

Atualizar os componentes shadcn já existentes para refletir a marca:

- **Button**
  - `primary` (default): bg `#0066FF`, texto branco, `hover:brightness-110`, sombra azul translúcida `shadow-[0_8px_24px_-8px_rgba(0,102,255,0.45)]`
  - `secondary`: branco com borda `slate-200`, texto escuro
  - `outline`: borda e texto azul `#0066FF`, fundo transparente
  - `ghost`, `destructive`, `link` mantidos
- **Input**: altura **44px**, borda `slate-200`, `focus-visible:ring-2 ring-[rgba(37,99,235,0.15)]`, `focus-visible:border-primary`
- **Card**: `bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow`
- **Badge / Pill**: nova variante `pill` com `font-pill` (Cabin medium), arredondado total, padding horizontal generoso
- **Sonner Toaster**: posição `top-right`, tema neutro, alinhado à paleta
- **Dialog (Modal)**: centralizado, overlay `bg-black/50 backdrop-blur-sm`, conteúdo `rounded-xl shadow-xl`

## 5. Estrutura de arquivos a tocar

```text
index.html                       # <link> Google Fonts
tailwind.config.ts               # cores semânticas + famílias de fonte + sombras
src/index.css                    # tokens HSL :root, reset tipográfico
src/components/Logo.tsx          # NOVO — símbolo + wordmark
src/components/ui/button.tsx     # variantes da marca
src/components/ui/input.tsx      # altura 44px + focus ring azul
src/components/ui/card.tsx       # rounded-xl + shadow hover
src/components/ui/badge.tsx      # variante pill (Cabin)
src/components/ui/sonner.tsx     # position top-right
src/components/ui/dialog.tsx     # backdrop blur
src/App.tsx                      # garantir <Toaster /> Sonner montado
src/pages/Index.tsx              # tela de "design system preview" mínima
```

## 6. Tela de verificação (temporária)

`Index.tsx` vira uma **página de showcase** curta exibindo: logo (claro e escuro), amostras de tipografia (H1 serif com itálico, sub Manrope, pill Cabin, corpo Inter), botões (primary/secondary/outline), input com focus, card e um toast de exemplo. Serve só para validar visualmente o design system. Será substituída na próxima etapa pelas telas reais.

## Detalhes técnicos

- Cores em **HSL** dentro de `:root` (padrão shadcn) — ex.: `--primary: 217 100% 50%;` para `#0066FF`. Tailwind consome via `hsl(var(--primary))`.
- Sombra azul do botão primário definida como token: `--shadow-primary: 0 8px 24px -8px rgba(0,102,255,0.45)`.
- `font-feature-settings` para Inter ativando `'cv11', 'ss01'` (legibilidade clínica).
- Sem alterações em rotas, providers ou lógica — apenas camada visual.
- Nenhuma dependência nova precisa ser instalada (shadcn, lucide-react, sonner e react-router já estão no projeto).

## Fora de escopo (próximas etapas)

Telas (landing, login, dashboard, upload de exames, laudo IA, etc.), autenticação, banco de dados, integrações. Aguardando seu próximo comando após a aprovação desta base.