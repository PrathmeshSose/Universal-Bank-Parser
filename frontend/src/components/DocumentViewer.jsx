import React from "react";
import {
  X,
  FileText,
  Download,
} from "lucide-react";

function DocumentViewer({
  file,
  previewUrl,
  onClose,
}) {
  if (!file || !previewUrl) {
    return null;
  }

  const isPdf =
    file.type === "application/pdf" ||
    file.name?.toLowerCase().endsWith(".pdf");

  const handleDownload = () => {
    const link = document.createElement("a");

    link.href = previewUrl;
    link.download = file.name || "bank-statement";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex min-h-[64px] items-center justify-between border-b border-slate-200 bg-[#11152a] px-5 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
              <FileText size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold">
                Document Preview
              </h2>

              <p className="truncate text-[10px] text-slate-400">
                {file.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <Download size={15} />
              Download
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
              title="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* DOCUMENT */}
        <div className="min-h-0 flex-1 bg-slate-100 p-3 md:p-5">
          {isPdf ? (
            <iframe
              src={previewUrl}
              title="Bank Statement PDF Preview"
              className="h-full w-full rounded-xl border border-slate-200 bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-200 p-5">
              <img
                src={previewUrl}
                alt={file.name || "Bank statement"}
                className="max-h-full max-w-full rounded-lg object-contain shadow-xl"
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex min-h-[48px] items-center justify-between border-t border-slate-200 bg-white px-5">
          <p className="text-[10px] text-slate-400">
            Preview is generated locally from the selected file.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#11152a] px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentViewer;