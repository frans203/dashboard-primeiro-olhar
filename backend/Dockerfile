# API container. Deliberately host-agnostic: the same image runs on Render, Fly,
# Koyeb, Hugging Face Spaces or any VM — see DEPLOY.md.
#
# The institute's TSV is NOT baked in (it is not in the repository — personal data).
# Put it on the host and point DATA_PATH at it; see DEPLOY.md.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencies first: this layer is cached while only the source changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# The dataset lands here by default; DEPLOY.md shows how to place the file.
ENV DATA_PATH=/app/data/Formulario2_Resumido.tsv

# Hosts inject the port to listen on; 8000 is the local default. `sh -c` is needed so
# ${PORT} is expanded at runtime rather than taken literally.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
