# Deploy

Duas peças, dois lugares:

| Peça | Onde | Por quê |
|---|---|---|
| Frontend (Vite) | **Vercel** | build estático, encaixe perfeito e gratuito |
| API (FastAPI) | **um processo que fica de pé** | o CSV enviado vive na memória do processo |

## Por que a API não vai para a Vercel

Funções serverless são efêmeras e replicadas. O `POST /api/uploads` guarda o CSV na
memória de **uma** instância; a requisição seguinte pode cair em outra, que responde
"Nenhum CSV enviado". A tela **Analisar CSV** funcionaria de forma intermitente. Some
a isso o limite de ~4,5 MB no corpo da requisição (nosso upload aceita 10 MB) e o
cold start relendo o TSV a cada instância nova.

Por isso a API precisa de **um processo vivo e único**. O `backend/Dockerfile` é
neutro: a mesma imagem roda em qualquer host abaixo.

> **Consequência aceita:** quando o host reinicia ou hiberna, o CSV enviado se perde
> (é memória). Basta reenviar. Os dados do Instituto não dependem disso — vêm do TSV
> em disco.

## O TSV do Instituto não está no repositório

`backend/data/*.tsv` está no `.gitignore` — são nomes, endereços e dados de saúde de
crianças. **Nenhum deploy que puxa do Git leva o arquivo.** Coloque-o no host por fora
e aponte `DATA_PATH` para ele:

- **Render** → *Environment → Secret Files*: adicione `Formulario2_Resumido.tsv`
  (vira `/etc/secrets/Formulario2_Resumido.tsv`) e defina
  `DATA_PATH=/etc/secrets/Formulario2_Resumido.tsv`.
- **Hugging Face Spaces** → suba o arquivo pela UI do Space (mantenha o Space
  **privado**) em `data/` e use o `DATA_PATH` padrão do Dockerfile.
- **VM** → copie via `scp` para um diretório e aponte `DATA_PATH` para ele.

Sem o arquivo no lugar certo, a API sobe e quebra no startup.

## Onde hospedar a API (grátis)

Termos de tier gratuito mudam com frequência — confirme antes de escolher.

| Host | Fica de pé? | Cartão? | Observação |
|---|---|---|---|
| **Hugging Face Spaces** (Docker) | hiberna só após ~48 h sem acesso | não | RAM folgada; deixe o Space privado |
| **Render** (free web service) | hiberna após ~15 min ociosa, acorda em ~1 min | não | caminho mais convencional; tem *Secret Files* |
| **Fly.io / Koyeb** | máquina para e acorda sob demanda | sim | acordar é rápido (~1-2 s) |
| **Oracle Cloud Always Free** (VM) | 24/7 de verdade | sim (verificação) | você administra a VM |

Para "não cai e é de graça", **Hugging Face Spaces** é o que mais se aproxima;
**Render** é o mais convencional se a hibernação de 15 min for tolerável.

## Passo a passo

### 1. API

1. Suba o repositório no GitHub (o TSV **não** vai junto — confira com
   `git ls-files backend/data`, que deve mostrar só o `.gitkeep`).
2. No host, crie um serviço apontando para `backend/` usando o `Dockerfile`.
3. Coloque o TSV no host e configure as variáveis:
   - `DATA_PATH` → caminho do arquivo no host
   - `ALLOWED_ORIGINS` → a URL do frontend na Vercel (ex.:
     `https://seu-projeto.vercel.app`) — **sem isso o navegador bloqueia tudo**
   - `PORT` → normalmente o host injeta sozinho
4. Confira: `GET https://sua-api/` deve responder
   `{"service":"primeiro-olhar-dashboard","status":"ok"}` e `GET /api/indicators`
   deve trazer `totalChildren`.

### 2. Frontend

1. Na Vercel: **New Project** → importe o repositório → **Root Directory: `frontend`**
   (o `vercel.json` já define framework, build e o rewrite de SPA).
2. Variável de ambiente: `VITE_API_URL=https://sua-api` (sem barra no fim).
3. Deploy. Se mudar a URL da API depois, **refaça o build** — o Vite injeta a variável
   em build time, não em runtime.

### 3. Fechar o círculo

A URL definitiva da Vercel precisa estar em `ALLOWED_ORIGINS` na API. Se você alterar
o domínio (ou usar previews), inclua-os também — cada preview tem uma URL própria.
