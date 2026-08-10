# Mind Flow

App web para criar e organizar mapas mentais. Os mapas ficam guardados no navegador (`localStorage`) e podes exportar em PNG, SVG ou JSON.

**App em produção:** https://mind-flow-xi.vercel.app

## Correr localmente

**Requisitos:** Node.js 18+

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (`dist/`) |
| `npm run preview` | Pré-visualizar o build |
| `npm run lint` | Verificar TypeScript |

## Deploy (Vercel)

O projeto está configurado para a Vercel com `base: '/'`. Cada push para `main` deve republicar automaticamente.

Para GitHub Pages (subpath `/mind-flow/`), faz o build com:

```bash
GITHUB_PAGES=true npm run build
```

## Atalhos de teclado

- `Ctrl/Cmd + Z` — Desfazer
- `Ctrl/Cmd + Shift + Z` ou `Ctrl + Y` — Refazer
- `Tab` — Adicionar sub-nó ao selecionado
- `Delete` / `Backspace` — Apagar nó selecionado (exceto a raiz)
- `Escape` — Fechar painéis / desselecionar
- Duplo clique num balão — Editar texto
