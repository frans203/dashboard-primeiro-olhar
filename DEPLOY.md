# Deploy — tudo na Vercel (um projeto, dois serviços)

Frontend e API no mesmo projeto Vercel, mesmo domínio. O `vercel.json` da raiz já
declara os dois serviços e o roteamento:

- `/api/...` → serviço **backend** (FastAPI, `main:app`)
- todo o resto → serviço **frontend** (Vite)

Como a API responde no mesmo domínio do site, **não existe CORS** nesse cenário e a
`VITE_API_URL` fica **vazia** em produção (o cliente usa caminho relativo).

> Alternativa, se um dia quiser sair da Vercel: o `backend/Dockerfile` e o `render.yaml`
> continuam no repositório e funcionam sem alteração. Veja o apêndice no fim.

---

## O que é "Blob" e por que precisamos dele

Blob = **armazenamento de arquivos** (object storage). Pense num HD na internet: você
grava um arquivo com um nome (`institute/dados.tsv`), e depois lê pelo mesmo nome.
É o equivalente Vercel do Amazon S3 — por baixo, é S3 mesmo.

Precisamos dele por causa de uma característica da Vercel: **o servidor não tem disco
nem memória permanentes**. Cada requisição pode ser atendida por uma cópia recém-criada
da aplicação, que nasce sem nada além do código. Duas consequências diretas aqui:

1. **O TSV do Instituto não tem onde morar.** Ele não está no Git (dado pessoal) e não
   cabe em variável de ambiente (limite de 64 KB; o arquivo tem 203 KB).
2. **O CSV que o usuário envia sumiria.** Hoje ele fica na memória do processo; na
   Vercel, a requisição seguinte pode cair em outra cópia que nunca viu esse upload.

O Blob resolve os dois: vira o "disco compartilhado" que todas as cópias enxergam.

**Importante — crie o store como `private`:** em store público, qualquer um com a URL
baixa o arquivo. Em privado, toda leitura exige o token, e quem entrega o conteúdo é a
nossa API. Como o TSV tem nomes, endereços e dados de saúde de crianças, **privado não
é opcional**.

Custo: o plano Hobby inclui uma cota gratuita de armazenamento e operações. Nossos
arquivos somam menos de 1 MB e as leituras são cacheadas — fica muito longe do limite.

---

## Ordem das coisas

Você faz os passos 1 a 3, eu implemento e testo o código com o seu store real
(passo 4), e aí fazemos o deploy juntos (5 a 7).

### 1. Criar o Blob store (você)

1. No painel da Vercel: **Storage → Create Database → Blob**.
2. Nome: `primeiro-olhar-dados`. **Access mode: `Private`.** Region: escolha a mais
   próxima (ex.: `gru1`, São Paulo).
3. Em **Projects**, conecte o store ao projeto `dashboard-primeiro-olhar`. Isso faz a
   Vercel injetar a variável `BLOB_READ_WRITE_TOKEN` no projeto automaticamente — você
   não precisa copiar nada para lá.

### 2. Subir o TSV para o store (você) — **feito**

O arquivo já está no store, na raiz, como `Formulario2_Resumido.tsv` (203 KB). O
caminho pode ser qualquer um; o que importa é a variável `INSTITUTE_BLOB_PATH` bater
**exatamente** com ele.

Esse arquivo **nunca** passa pelo Git. É a única cópia em produção.

### 3. Trazer o token para a sua máquina (você)

Ainda no store, copie o `BLOB_READ_WRITE_TOKEN` (aba **.env.local** / **Quickstart**) e
cole no seu `backend/.env` local:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxx
INSTITUTE_BLOB_PATH=Formulario2_Resumido.tsv
```

O `backend/.env` está no `.gitignore` — o token não vai para o repositório. Ele serve
para eu **testar a integração de verdade** antes de você fazer o deploy, em vez de
mandar você subir código não testado.

### 4. Implementação (eu) — **feita e testada contra o store real**

- `backend/blob_storage.py` — cliente do Blob sobre o **SDK oficial** (`vercel`),
  sempre em modo `private`.
- `backend/cleaning.py` — o TSV do Instituto é lido do Blob quando
  `BLOB_READ_WRITE_TOKEN` existe; sem token, continua lendo do disco. Seu dia a dia
  local não muda.
- `backend/uploaded_dataset.py` — o CSV enviado é gravado no Blob com um nome único por
  envio (`uploads/<id>__<nome>`), nunca sobrescrito, o que evita a janela de cache do
  CDN. O "atual" é simplesmente o mais recente; cada cópia da aplicação baixa e limpa
  uma vez e memoriza. A versão vem do carimbo de tempo do próprio store, então todas as
  cópias calculam o mesmo número.
- `backend/routes/uploads.py` — limite de upload de 10 MB → 4 MB (a Vercel recusa
  corpos acima de ~4,5 MB antes mesmo de chegar no nosso código).
- `tests/test_blob_storage.py` — testes de integração contra o store de verdade,
  ignorados automaticamente quando não há token.

**Nada muda no frontend** e nenhuma tela muda de comportamento.

### 5. Variáveis de ambiente na Vercel (você)

No projeto → **Settings → Environment Variables**:

| Variável | Valor | Observação |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | *(automática)* | criada ao conectar o store no passo 1 |
| `INSTITUTE_BLOB_PATH` | `Formulario2_Resumido.tsv` | caminho exato dentro do store |
| `VITE_API_URL` | *(deixe em branco ou não crie)* | mesmo domínio → caminho relativo |

Não precisa de `ALLOWED_ORIGINS` nem de `DATA_PATH` na Vercel: o primeiro só importa
quando front e API estão em domínios diferentes, e o segundo é o caminho em disco, usado
localmente.

### 6. Deploy (você)

Na tela que você já abriu: **Root Directory `./`**, e Deploy. A Vercel lê o
`vercel.json`, constrói os dois serviços e publica.

### 7. Conferir (você)

Com o site no ar:

1. `https://seu-projeto.vercel.app/api/indicators` → deve devolver
   `"totalChildren": 355`. Se der erro de arquivo, o `INSTITUTE_BLOB_PATH` não bate com
   o caminho que você usou no upload.
2. Abra o site: as quatro abas do Instituto com gráficos preenchidos.
3. Aba **Analisar CSV**: envie um arquivo, veja os números mudarem, **recarregue a
   página** e confirme que os dados continuam lá — é isso que prova que o Blob está
   funcionando (antes, o upload viveria só na memória de uma cópia).

---

## O que muda no seu dia a dia local

Nada. Sem `BLOB_READ_WRITE_TOKEN` no `.env`, o backend continua lendo o TSV do disco e
guardando o CSV enviado em memória, exatamente como hoje:

```bash
# backend
uvicorn main:app --reload --port 8000
# frontend
npm run dev
```

Com o token presente, ele usa o Blob — útil para reproduzir produção quando precisar.

---

## Apêndice — alternativa fora da Vercel

Se algum dia a Vercel não servir, o repositório já tem `backend/Dockerfile` e
`render.yaml`. Nesse cenário o backend roda como processo único e **não precisa de
Blob**: o TSV vai como *Secret File* (`DATA_PATH=/etc/secrets/...`) e o CSV enviado
volta a viver em memória. Aí o front na Vercel precisa de `VITE_API_URL` apontando para
a API e a API precisa de `ALLOWED_ORIGINS` com a URL do front.
