# Instituto Primeiro Olhar — Dashboard

Dashboard de visualização de dados do Instituto Primeiro Olhar, instituto de apoio a
crianças com síndrome de Down. A aplicação lê o formulário de cadastro das famílias,
normaliza os dados e apresenta **indicadores, gráficos e cruzamentos** por perfil
demográfico, de saúde e socioeconômico.

O projeto é dividido em duas partes independentes:

| Pasta | Stack | Papel |
|---|---|---|
| [`backend/`](backend/CLAUDE.md) | Python · FastAPI · pandas | Limpa/normaliza os dados e serve os agregados como JSON. Sem banco de dados. Dois datasets: o TSV do Instituto (fixo) e um CSV enviado pela tela (substituível). |
| [`frontend/`](frontend/CLAUDE.md) | React · Vite · TypeScript · Recharts | Consome a API e renderiza os gráficos, tabelas e cards com filtros por gráfico. |

Cada pasta tem um `CLAUDE.md` com a arquitetura detalhada, o mapa de módulos e as
convenções a seguir ao adicionar uma rota ou um gráfico.

## Dados — leia antes de rodar

A API serve **dois datasets**, com as mesmas rotas e os mesmos gráficos:

- **O do Instituto** (`/api/*`) — o formulário de cadastro das famílias
  (355 linhas × 40 colunas). Fixo, nunca muda.
- **Um CSV enviado pela tela "Analisar CSV"** (`/api/uploads/*`) — qualquer arquivo no
  mesmo formato. Enviar outro substitui o anterior.

**O arquivo do Instituto não está no repositório e você precisa colocá-lo
manualmente**, neste caminho:

```
backend/data/Formulario2_Resumido.tsv
```

O formato é **TSV** (separado por tabulação). Para usar outro caminho, defina
`DATA_PATH`; em produção o arquivo vem do Vercel Blob (`INSTITUTE_BLOB_PATH`) — veja
[Variáveis de ambiente](#variáveis-de-ambiente). Sem o arquivo, o serviço **sobe do
mesmo jeito**: as rotas `/api/*` respondem **503 dizendo o que falta**, e a tela de
CSV continua funcionando.

Peça o arquivo a quem já trabalha no projeto — ele não é versionado porque contém dados
pessoais identificáveis das crianças (nome, data de nascimento, endereço, histórico de
saúde e renda familiar) e o repositório é público. Não commite o arquivo: ele está no
`.gitignore` justamente para isso.

## Como rodar

Os dois serviços sobem separados. O backend precisa estar no ar para o frontend
mostrar dados reais.

### Backend — http://localhost:8000

Confira antes que o TSV esteja em `backend/data/Formulario2_Resumido.tsv` (veja
[Dados](#dados--leia-antes-de-rodar)) — sem ele o serviço não inicia.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Documentação interativa da API em http://localhost:8000/docs.
Testes: `pytest -q`.

### Frontend — http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

Em desenvolvimento o Vite faz proxy de `/api` para `http://localhost:8000`. Para apontar
para outra origem, defina `VITE_API_URL`.

Build de produção: `npm run build`. Checagem de tipos: `npm run lint`.

## Variáveis de ambiente

Cada lado tem um `.env.example` comentado — copie para `.env` (que está no
`.gitignore`). **Nada é obrigatório para rodar local:** sem nenhuma variável, a API lê o
TSV do disco e guarda o CSV enviado em memória.

### Backend (`backend/.env`)

| Variável | Para quê | Padrão |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob. Com ele, o TSV é lido do Blob e cada CSV enviado é gravado lá. Obrigatório em host serverless. Na Vercel, conectar o store ao projeto injeta sozinho. | ausente → disco/memória |
| `INSTITUTE_BLOB_PATH` | Caminho do TSV dentro do store. Definir significa "o arquivo mora no Blob". | ausente → usa o disco |
| `DATA_PATH` | Caminho do TSV em disco (hosts com volume/secret file). | `backend/data/Formulario2_Resumido.tsv` |
| `ALLOWED_ORIGINS` | Origens liberadas no CORS, separadas por vírgula. Só importa se o front estiver em outro domínio. | `http://localhost:5173,http://127.0.0.1:5173` |
| `PORT` | Porta HTTP. A maioria dos hosts injeta sozinha. | `8000` |

### Frontend (`frontend/.env`)

| Variável | Para quê | Padrão |
|---|---|---|
| `VITE_API_URL` | Origem da API. **Vazio** = caminho relativo (`/api/...`), que serve tanto o proxy do Vite em dev quanto o deploy na Vercel (mesmo domínio, sem CORS). Preencha só quando a API estiver em outro domínio. | vazio |

Valores `VITE_*` são injetados em **build time** — mudou a URL, refaça o build.

## Deploy

Frontend e API vivem no **mesmo projeto Vercel**, como dois serviços declarados em
`vercel.json`: `/api/...` vai para o backend (FastAPI) e o resto para o frontend (Vite).
Mesmo domínio, então não há CORS.

Como o ambiente serverless não tem disco nem memória permanentes, os dois datasets ficam
num **Vercel Blob store privado**: o TSV do Instituto e cada CSV enviado. O passo a
passo completo — criar o store, subir o arquivo, variáveis, e o que conferir depois —
está em [`DEPLOY.md`](DEPLOY.md), que também traz a alternativa fora da Vercel
(`backend/Dockerfile` + `render.yaml`, sem Blob).

## Testes

```bash
cd backend && pytest -q     # 65 testes
cd frontend && npm run lint # tsc --noEmit
```

Os testes de Blob (`backend/tests/test_blob_storage.py`) falam com um store de verdade e
são **ignorados automaticamente** quando não há `BLOB_READ_WRITE_TOKEN` no `.env`.

Toda rota nova deve subir com seus testes de pytest — veja a regra de testes no
[`backend/CLAUDE.md`](backend/CLAUDE.md).
