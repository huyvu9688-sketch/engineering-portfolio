import { Download, Trash2, FileText, Box, Image as ImageIcon, FileSpreadsheet, BookText } from "lucide-react";
import { getCategory } from "@/features/file-database/lib/categories";
import { formatFileSize } from "@/features/file-database/lib/format";
import type { CategoryKey, DocumentRecord } from "@/features/file-database/lib/types";

const ICON: Record<CategoryKey, typeof FileText> = {
  cad_3d: Box,
  drawing_2d: FileText,
  datasheet: FileText,
  standard: BookText,
  report: FileSpreadsheet,
  image: ImageIcon,
};

export function DocumentCard({
  doc,
  downloadUrl,
  onDelete,
}: {
  doc: DocumentRecord;
  downloadUrl: string;
  /** When provided (admin view), shows a delete button. */
  onDelete?: () => void;
}) {
  const Icon = ICON[doc.category] ?? FileText;
  const date = new Date(doc.created_at).toISOString().slice(0, 10);

  return (
    <article className="flex flex-col rounded-lg border border-hairline bg-surface p-5 transition-colors hover:border-accent">
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-5 w-5 stroke-[1.5] text-ink-muted" />
        <span className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
          {getCategory(doc.category)?.label}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight">{doc.title}</h3>
      {doc.description && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{doc.description}</p>
      )}

      {doc.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {doc.tags.map((t) => (
            <li
              key={t}
              className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-faint"
            >
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-hairline pt-4">
        <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-ink-faint">
          .{doc.file_ext} · {formatFileSize(doc.size_bytes)} · {date}
        </span>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              aria-label={`Delete ${doc.title}`}
              className="rounded-full border border-hairline p-2 text-ink-faint transition-colors hover:border-state-error hover:text-state-error"
            >
              <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
            </button>
          )}
          <a
            href={downloadUrl}
            download={doc.original_filename}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-on-dark transition-colors hover:bg-accent"
          >
            <Download className="h-3 w-3 stroke-[1.5]" />
            Download
          </a>
        </div>
      </div>
    </article>
  );
}
