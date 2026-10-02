import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, RefreshCw, CheckCircle, Trash2 } from "lucide-react";
import { videosAPI } from "../lib/api";
import MediaPreview from "./MediaPreview";

const labels = { pending: "Aguardando envio", uploading: "Enviando", processing: "Processando", completed: "Pronto", failed: "Falhou" };

export default function VideoUpload({ eventId, onBusyChange }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const cancelRef = useRef(false);
  const update = (key, change) => setItems(previous => previous.map(item => item.key === key ? { ...item, ...change } : item));
  const processingIds = items.filter(item => item.status === "processing" && item.id).map(item => item.id).join(",");

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => () => { cancelRef.current = true; onBusyChange?.(false); }, [onBusyChange]);

  useEffect(() => {
    if (!processingIds) return;
    let active = true;
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        for (const id of processingIds.split(",")) {
          const response = await videosAPI.status(id);
          if (!active) return;
          const data = response.data.data;
          setItems(previous => previous.map(item => item.id === id ? {
            ...item, ...data, status: ["completed", "failed"].includes(data.processingStatus) ? data.processingStatus : "processing", error: data.processingError
          } : item));
        }
      } catch { return; }
      finally { polling = false; }
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [processingIds]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "video/quicktime": [".mov"], "video/mp4": [".mp4"] },
    maxSize: 500 * 1024 * 1024,
    disabled: busy,
    onDrop: (accepted, rejected) => {
      setItems(previous => [...previous, ...accepted.map(file => ({ key: crypto.randomUUID(), file, status: "pending", progress: 0 }))]);
      if (rejected.length) setItems(previous => [...previous, ...rejected.map(({ file }) => ({ key: crypto.randomUUID(), file, status: "failed", error: "Formato inválido ou arquivo maior que 500 MiB" }))]);
    }
  });

  const send = async item => {
    const storageKey = `snapli-video-upload:${eventId}:${item.file.name}:${item.file.size}:${item.file.lastModified}`;
    let session;
    try { session = JSON.parse(localStorage.getItem(storageKey) || "null"); } catch { session = null; }
    if (!session) {
      const response = await videosAPI.start({ eventId, filename: item.file.name, fileSize: item.file.size, mimeType: item.file.type });
      session = { ...response.data.data, parts: [] };
      localStorage.setItem(storageKey, JSON.stringify(session));
    }
    update(item.key, { id: session.id, status: "uploading", error: null });
    for (let partNumber = 1; partNumber <= session.partCount; partNumber++) {
      if (cancelRef.current) throw new Error("Envio pausado; selecione Enviar para retomar");
      const start = (partNumber - 1) * session.partSize;
      const blob = item.file.slice(start, Math.min(start + session.partSize, item.file.size));
      if (!session.parts.some(part => part.PartNumber === partNumber)) {
        let completed = false;
        for (let attempt = 0; attempt < 3 && !completed; attempt++) {
          try {
            const response = await videosAPI.part(session.id, partNumber, blob, event => {
              update(item.key, { progress: Math.round((start + event.loaded) * 100 / item.file.size) });
            });
            session.parts.push(response.data.data);
            localStorage.setItem(storageKey, JSON.stringify(session));
            completed = true;
          } catch (error) { if (attempt === 2 || (error.response?.status && error.response.status < 500)) throw error; }
        }
      }
      update(item.key, { progress: Math.round(Math.min(start + blob.size, item.file.size) * 100 / item.file.size) });
    }
    await videosAPI.complete(session.id, session.parts);
    localStorage.removeItem(storageKey);
    update(item.key, { status: "processing", progress: 100 });
  };

  const sendAll = async () => {
    if (!eventId || busyRef.current) return;
    busyRef.current = true;
    cancelRef.current = false;
    setBusy(true);
    try {
      for (const item of items.filter(item => item.status === "pending" || (item.status === "failed" && item.processingStatus !== "failed"))) {
        if (cancelRef.current) break;
        try { await send(item); }
        catch (error) { update(item.key, { status: "failed", error: error.response?.data?.message || error.message }); }
      }
    } finally { busyRef.current = false; setBusy(false); }
  };

  return <div className="space-y-4">
    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive ? "border-lime" : "border-white/10"}`}>
      <input {...getInputProps()} />
      <Upload className="h-10 w-10 text-dim mx-auto mb-3" />
      <p className="font-medium">Selecionar vídeos</p>
      <p className="text-sm text-muted mt-1">MOV / MP4 · 120 segundos · 500 MiB</p>
    </div>
    <div className="flex gap-2">
      <button className="btn btn-primary flex items-center gap-2" onClick={sendAll} disabled={busy || !eventId || !items.some(item => item.status === "pending" || (item.status === "failed" && item.processingStatus !== "failed"))}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Enviar vídeos
      </button>
      {busy && <button className="btn btn-secondary" onClick={() => { cancelRef.current = true; }}>Pausar</button>}
    </div>
    {items.map(item => <div key={item.key} className="py-3 border-b border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm break-all">{item.file.name}</p>
          <p className="text-xs text-muted">{labels[item.status]}{item.status === "uploading" ? ` · ${item.progress}%` : ""}</p>
          {item.error && <p className="text-sm text-red-400 break-words mt-1">{item.error}</p>}
          {item.status === "completed" && item.faceCount === 0 && <p className="text-sm text-muted">Nenhum rosto indexável</p>}
        </div>
        {item.status === "completed" ? <CheckCircle className="h-5 w-5 text-teal shrink-0" /> : item.id && item.processingStatus === "failed" ?
          <button title="Reprocessar vídeo" aria-label="Reprocessar vídeo" className="btn btn-secondary p-2" disabled={busy} onClick={async () => {
            try { await videosAPI.retry(item.id); update(item.key, { status: "processing", error: null }); }
            catch (error) { update(item.key, { error: error.response?.data?.message || "Não foi possível reprocessar" }); }
          }}><RefreshCw className="h-4 w-4" /></button> : !busy && !item.id &&
          <button title="Remover vídeo selecionado" aria-label="Remover vídeo selecionado" onClick={() => setItems(previous => previous.filter(entry => entry.key !== item.key))}><Trash2 className="h-4 w-4" /></button>}
      </div>
      {item.status === "uploading" && <progress value={item.progress} max="100" className="w-full h-2 mt-2 accent-lime" />}
      {item.status === "completed" && <div className="mt-3 aspect-video max-w-sm"><MediaPreview media={{ ...item, mediaType: "video" }} controls className="w-full h-full object-contain" /></div>}
    </div>)}
  </div>;
}