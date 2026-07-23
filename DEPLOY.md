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

## Onde hospedar a API: **Render, plano free**

Decisão tomada, com o `render.yaml` na raiz pronto. Motivo: é o único gratuito que
junta as quatro exigências — sem cartão, processo único de pé, **Secret Files** (o TSV
entra sem passar pelo Git) e o nosso `Dockerfile` rodando sem alteração.

O que foi descartado e por quê:

| Host | Por que não |
|---|---|
| Hugging Face Spaces | para a Vercel chamar a API sem token o Space teria de ser **público** — e aí o TSV com dados das crianças ficaria baixável por qualquer um |
| PythonAnywhere | web app grátis expira todo mês e o suporte a ASGI (FastAPI) é beta, sem preço definido |
| Fly.io / Koyeb / Oracle | exigem cartão |

**A ressalva do Render free:** o serviço hiberna após ~15 min sem acesso e a primeira
visita seguinte espera ~1 min. Se isso incomodar, aponte um monitor gratuito
(UptimeRobot, cron-job.org) para `https://sua-api/` a cada 10 minutos: o serviço fica
acordado e o consumo (~730 h/mês) cabe na cota de 750 h/mês do plano, desde que ele
seja o único serviço free da conta.

> Nenhum plano gratuito promete disponibilidade contratual. Se em algum momento a
> queda de 1 min for inaceitável, o caminho barato é uma instância paga (~US$ 7/mês no
> próprio Render, sem mudar nada do que está aqui).

## Passo a passo

### 1. API no Render

1. Em [render.com](https://render.com), entre com a conta do GitHub e autorize o
   repositório.
2. **New → Blueprint**, aponte para o repositório e para a branch. O Render lê o
   `render.yaml` e já cria o serviço `primeiro-olhar-api` (Docker, plano free).
3. No serviço → **Environment → Secret Files** → **Add Secret File**:
   - *Filename*: `Formulario2_Resumido.tsv`
   - *Contents*: cole o conteúdo do arquivo local
     (`backend/data/Formulario2_Resumido.tsv`)

   Ele passa a existir em `/etc/secrets/Formulario2_Resumido.tsv`, que é para onde o
   `DATA_PATH` do blueprint já aponta. **Isso não vai para o Git.**
4. Ainda em **Environment**, preencha `ALLOWED_ORIGINS` com a URL da Vercel (passo 2
   abaixo). Na primeira vez ela ainda não existe — deixe em branco, faça o frontend e
   volte aqui. Sem isso o navegador bloqueia todas as chamadas.
5. **Manual Deploy** e acompanhe o log até `Application startup complete`.
6. Confira no navegador:
   - `https://sua-api.onrender.com/` → `{"service":"primeiro-olhar-dashboard","status":"ok"}`
   - `https://sua-api.onrender.com/api/indicators` → deve trazer `totalChildren: 355`

   Se o segundo falhar com erro de arquivo, o Secret File está com nome diferente do
   que o `DATA_PATH` espera.

### 2. Frontend na Vercel

1. Na Vercel: **New Project** → importe o repositório → **Root Directory: `frontend`**
   (o `vercel.json` já define framework, build e o rewrite de SPA).
2. Variável de ambiente: `VITE_API_URL=https://sua-api.onrender.com` (sem barra no fim).
3. Deploy. Se mudar a URL da API depois, **refaça o build** — o Vite injeta a variável
   em build time, não em runtime.

### 3. Fechar o círculo

Volte ao Render e coloque a URL da Vercel em `ALLOWED_ORIGINS` (o serviço reinicia
sozinho). Se usar previews da Vercel, inclua as URLs delas também, separadas por
vírgula — cada preview tem domínio próprio.

Teste final: abra o site, veja as quatro abas do Instituto com dados, e envie um CSV
na aba **Analisar CSV**.

## Verificação já feita localmente

A imagem foi construída e executada aqui simulando o Render (`DATA_PATH` apontando
para um arquivo montado em `/etc/secrets/`, `PORT` injetado, `ALLOWED_ORIGINS` com um
domínio de exemplo). Resultado: `/api/indicators` com os 355 registros do Instituto,
CORS liberando só a origem configurada, e o upload de CSV funcionando dentro do
contêiner. Imagem final: ~471 MB.
