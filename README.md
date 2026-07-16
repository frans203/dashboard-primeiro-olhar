# Instituto Primeiro Olhar — Dashboard

Dashboard de visualização de dados do Instituto Primeiro Olhar, instituto de apoio a
crianças com síndrome de Down. A aplicação lê o formulário de cadastro das famílias,
normaliza os dados e apresenta **indicadores, gráficos e cruzamentos** por perfil
demográfico, de saúde e socioeconômico.

O projeto é dividido em duas partes independentes:

| Pasta | Stack | Papel |
|---|---|---|
| [`backend/`](backend/CLAUDE.md) | Python · FastAPI · pandas | Lê o TSV em memória, limpa/normaliza e serve os agregados como JSON. Sem banco de dados. |
| [`frontend/`](frontend/CLAUDE.md) | React · Vite · TypeScript · Recharts | Consome a API e renderiza os gráficos, tabelas e cards com filtros por gráfico. |

Cada pasta tem um `CLAUDE.md` com a arquitetura detalhada, o mapa de módulos e as
convenções a seguir ao adicionar uma rota ou um gráfico.

## Dados

A API é alimentada por um único arquivo TSV — o formulário de cadastro das famílias
(355 linhas × 40 colunas) — lido em memória no startup. **Não há banco de dados nem
upload de arquivos.**

> **O arquivo de dados não está versionado.** Ele contém dados pessoais identificáveis
> de crianças (nome, data de nascimento, endereço, histórico de saúde, renda familiar)
> e por isso está no `.gitignore`. Para rodar o projeto localmente, coloque o arquivo em
> `backend/data/Formulario2_Resumido.tsv`.

## Como rodar

Os dois serviços sobem separados. O backend precisa estar no ar para o frontend
mostrar dados reais.

### Backend — http://localhost:8000

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
para outra origem, defina `VITE_API_BASE_URL`.

Build de produção: `npm run build`. Checagem de tipos: `npm run lint`.

## Estado atual

A base está montada e as convenções fixadas; boa parte das rotas e dos gráficos ainda
está marcada com `# TODO` / `// TODO`, seguindo um molde já implementado ponta a ponta:

- **Backend:** o pipeline de limpeza (`cleaning.py`), o motor de filtros
  (`apply_filters`), o cache e os DTOs estão prontos. A rota
  `/api/filters/therapies` é a referência completa; as demais têm assinatura, DTO e
  resposta tipada definidos, com o corpo retornando 501.
- **Frontend:** `ExampleSexChart` é o molde de gráfico já ligado do store de filtros até
  a query. Os demais gráficos se copiam a partir dele, trocando o hook de query e o
  componente de gráfico.

Toda rota nova deve subir com seus testes de pytest — veja a regra de testes no
[`backend/CLAUDE.md`](backend/CLAUDE.md).
