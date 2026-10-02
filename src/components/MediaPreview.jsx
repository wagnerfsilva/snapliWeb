export default function MediaPreview({ media, className = "w-full h-full object-cover", controls = false }) {
  if (!media.thumbnailUrl && !media.watermarkedUrl && !media.previewUrl) {
    return <div className="w-full h-full flex items-center justify-center text-xs text-muted p-3 text-center">{media.processingStatus === "failed" ? "Falha no processamento" : "Processando"}</div>;
  }
  if (media.mediaType === "video" && controls && media.previewUrl) {
    return <video src={media.previewUrl} poster={media.thumbnailUrl || media.watermarkedUrl} controls playsInline preload="none" className={className} aria-label={media.originalFilename || "Prévia do vídeo"} />;
  }
  return <img src={media.thumbnailUrl || media.watermarkedUrl || media.previewUrl} alt={media.originalFilename || "Prévia"} loading="lazy" className={className} />;
}