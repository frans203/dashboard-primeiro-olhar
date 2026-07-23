import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import * as React from "react";

import { deleteUploadedDataset, queryKeys, uploadDataset } from "@/api/endpoints";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui-kit";
import { useUploadStatus } from "@/hooks/useUploadStatus";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Sends the CSV that feeds the "Analisar CSV" page and shows what is loaded.
 *
 * What is loaded is server state, read through `useUploadStatus`. Sending a new file
 * replaces the previous one; the mutation writes the new status into that cache entry,
 * its `version` changes, and every chart re-keys and refetches on its own.
 */
const ACCEPT = ".csv,.tsv,.txt";

function formatUploadedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function CsvUploadCard() {
  const queryClient = useQueryClient();
  const status = useUploadStatus();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const upload = useMutation({
    mutationFn: (file: File) => uploadDataset(file),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.uploadStatus, data);
    },
  });

  const remove = useMutation({
    mutationFn: deleteUploadedDataset,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.uploadStatus, null);
    },
  });

  const current = status.data ?? null;
  const busy = upload.isPending || remove.isPending;

  function send(files: FileList | null) {
    const file = files?.[0];
    if (file) upload.mutate(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!busy) send(event.dataTransfer.files);
  }

  const errorMessage =
    upload.error instanceof Error
      ? upload.error.message
      : upload.isError
        ? "Não foi possível enviar o arquivo."
        : null;

  return (
    <Card contentClassName="space-y-4 pt-6">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          {upload.isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </span>

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {upload.isPending
              ? "Processando o arquivo…"
              : "Arraste o CSV aqui ou escolha um arquivo"}
          </p>
          <p className="text-xs text-muted-foreground">
            Mesmo formato do formulário do Instituto (.csv, .tsv ou .txt — vírgula,
            ponto e vírgula ou tabulação).
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            send(event.target.files);
            event.target.value = ""; // reenviar o mesmo arquivo dispara o change de novo
          }}
        />
        <PrimaryButton
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {current ? "Trocar arquivo" : "Escolher arquivo"}
        </PrimaryButton>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      ) : null}

      {current ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {current.filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCount(current.rowCount)} registros · enviado em{" "}
                {formatUploadedAt(current.uploadedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Dados carregados
            </span>
            <SecondaryButton
              variant="outline"
              disabled={busy}
              onClick={() => remove.mutate()}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </SecondaryButton>
          </div>
        </div>
      ) : null}

      {current?.warnings.length ? (
        <ul className="space-y-1 rounded-lg bg-brand-yellow/20 p-3 text-xs text-foreground">
          {current.warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
