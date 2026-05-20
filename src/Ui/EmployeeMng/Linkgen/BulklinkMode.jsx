import React, { useState, useRef, useCallback } from "react";
import {
  X,
  AlertCircle,
  Loader,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
  Users,
  Upload,
  FileText,
  Table2,
  Type,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RotateCcw,
  Download,
  Minus,
} from "lucide-react";
import employeeService from "../../../services/employeeService";

// ─── Helpers ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractEmailsFromText(raw) {
  return raw
    .split(/[\s,;\n\r\t]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => EMAIL_RE.test(s));
}

function dedupeEmails(list) {
  const seen = new Set();
  return list.filter((e) => {
    if (seen.has(e)) return false;
    seen.add(e);
    return true;
  });
}

async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(extractEmailsFromText(e.target.result));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function parseExcel(file) {
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const allEmails = [];
        wb.SheetNames.forEach((name) => {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
          rows.forEach((row) =>
            row.forEach((cell) => {
              const val = String(cell || "").trim().toLowerCase();
              if (EMAIL_RE.test(val)) allEmails.push(val);
            })
          );
        });
        resolve(allEmails);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─── StatusBadge ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    idle:    { icon: null,                                           cls: "bg-slate-100 text-slate-500",     label: "Queued"  },
    sending: { icon: <Loader2 className="w-3 h-3 animate-spin" />,  cls: "bg-blue-100 text-blue-600",       label: "Sending" },
    success: { icon: <CheckCircle2 className="w-3 h-3" />,          cls: "bg-emerald-100 text-emerald-700", label: "Sent"    },
    error:   { icon: <XCircle className="w-3 h-3" />,               cls: "bg-red-100 text-red-600",         label: "Failed"  },
    skipped: { icon: <Minus className="w-3 h-3" />,                 cls: "bg-amber-100 text-amber-600",     label: "Skipped" },
  };
  const { icon, cls, label } = map[status] || map.idle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {icon}{label}
    </span>
  );
};

// ─── BulkLinkModal ──────────────────────────────────────────────────────────

const BulkLinkModal = ({ onClose, showToast = () => {} }) => {
  const [inputTab,   setInputTab]   = useState("file");
  const [pasteText,  setPasteText]  = useState("");
  const [dragging,   setDragging]   = useState(false);
  const [parseError, setParseError] = useState("");
  const [isParsing,  setIsParsing]  = useState(false);
  const [rows,       setRows]       = useState([]);
  const [isSending,  setIsSending]  = useState(false);
  const [sendDone,   setSendDone]   = useState(false);
  const [expandErr,  setExpandErr]  = useState(null);

  const fileRef  = useRef();
  const abortRef = useRef(false);

  const stats = {
    total:    rows.length,
    selected: rows.filter((r) => r.selected).length,
    success:  rows.filter((r) => r.status === "success").length,
    failed:   rows.filter((r) => r.status === "error").length,
  };

  const loadEmails = useCallback((emails) => {
    const unique = dedupeEmails(emails);
    if (unique.length === 0) {
      setParseError("No valid email addresses found. Please check your input.");
      return;
    }
    setParseError("");
    setRows(unique.map((email) => ({ email, selected: true, status: "idle", error: "", linkUrl: "" })));
    setSendDone(false);
  }, []);

  const handleFile = useCallback(async (file) => {
    setIsParsing(true);
    setParseError("");
    try {
      const emails = file.name.match(/\.xlsx?$/i)
        ? await parseExcel(file)
        : await parseCSV(file);
      loadEmails(emails);
    } catch {
      setParseError("Could not read the file. Please use CSV, XLSX, or plain text.");
    } finally {
      setIsParsing(false);
    }
  }, [loadEmails]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const toggleRow = (email) =>
    setRows((prev) => prev.map((r) => (r.email === email ? { ...r, selected: !r.selected } : r)));

  const toggleAll = () => {
    const allSelected = rows.every((r) => r.selected);
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const removeRow    = (email) => setRows((prev) => prev.filter((r) => r.email !== email));
  const removeSelected = ()   => setRows((prev) => prev.filter((r) => !r.selected));

  const handleSend = async () => {
    const toSend = rows.filter((r) => r.selected && r.status !== "success");
    if (!toSend.length) return;

    setIsSending(true);
    abortRef.current = false;

    for (const row of toSend) {
      if (abortRef.current) break;

      setRows((prev) => prev.map((r) => (r.email === row.email ? { ...r, status: "sending" } : r)));

      try {
        const res = await employeeService.generateRegistrationLink({
          employeeEmail: row.email,
          expiresInDays: 7,
        });
        if (!res.success) throw new Error(res.message || "Failed to generate link");

        await employeeService.sendRegistrationEmail({
          to:              row.email,
          registrationUrl: res.data.registrationUrl,
          expiresAt:       res.data.expiresAt,
          subject:         "Your Registration Link — Insta ICT Solutions",
        });

        setRows((prev) =>
          prev.map((r) =>
            r.email === row.email ? { ...r, status: "success", linkUrl: res.data.registrationUrl } : r
          )
        );
      } catch (err) {
        setRows((prev) =>
          prev.map((r) =>
            r.email === row.email ? { ...r, status: "error", error: err.message || "Unknown error" } : r
          )
        );
      }

      await new Promise((res) => setTimeout(res, 300));
    }

    setIsSending(false);
    setSendDone(true);
    const sent = rows.filter((r) => r.status === "success").length;
    showToast(`Done! ${sent} link(s) sent successfully.`, "success");
  };

  const retryFailed = () => {
    setRows((prev) =>
      prev.map((r) => (r.status === "error" ? { ...r, status: "idle", error: "", selected: true } : r))
    );
    setSendDone(false);
  };

  const exportFailed = () => {
    const blob = new Blob(
      [rows.filter((r) => r.status === "error").map((r) => r.email).join("\n")],
      { type: "text/csv" }
    );
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "failed-emails.csv",
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => {
    setRows([]); setPasteText(""); setParseError("");
    setSendDone(false); setIsSending(false); abortRef.current = false;
  };

  const hasRows = rows.length > 0;

  return (
   <div className="fixed inset-0 bg-white/10 backdrop-blur-[3px] flex items-center justify-center z-[1200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full" style={{ maxWidth: 680, maxHeight: "92vh" }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2"><Users className="w-5 h-5" /></div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Bulk Registration Links</h3>
              <p className="text-blue-100 text-xs mt-0.5">Upload emails → preview → send links in one go</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Input section */}
          {!hasRows && (
            <div className="space-y-4">
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                {[
                  { key: "file",  icon: <Upload className="w-4 h-4" />, label: "Upload File"  },
                  { key: "paste", icon: <Type   className="w-4 h-4" />, label: "Paste Emails" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setInputTab(t.key); setParseError(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                      inputTab === t.key ? "bg-white shadow text-indigo-700" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>

              {inputTab === "file" && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                    dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                  />
                  {isParsing
                    ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3" />
                    : <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />}
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    {isParsing ? "Reading file…" : "Drop your file here or click to browse"}
                  </p>
                  <p className="text-xs text-slate-400">Supports CSV, Excel (.xlsx / .xls), or plain TXT</p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {[
                      { icon: <FileText className="w-4 h-4" />, label: "CSV"  },
                      { icon: <Table2   className="w-4 h-4" />, label: "XLSX" },
                      { icon: <Type     className="w-4 h-4" />, label: "TXT"  },
                    ].map((f) => (
                      <span key={f.label} className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">
                        {f.icon}{f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {inputTab === "paste" && (
                <div className="space-y-3">
                  <textarea
                    rows={7}
                    value={pasteText}
                    onChange={(e) => { setPasteText(e.target.value); setParseError(""); }}
                    placeholder={"Paste email addresses — one per line, or comma/semicolon separated:\n\nalice@example.com\nbob@company.org, carol@firm.in"}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => loadEmails(extractEmailsFromText(pasteText))}
                    disabled={!pasteText.trim()}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all disabled:opacity-40"
                  >
                    Parse Emails
                  </button>
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{parseError}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>How it works:</strong> Upload or paste emails → review the list → select which ones to send →
                  links are generated and emailed one by one with live status. Duplicates removed automatically.
                </p>
              </div>
            </div>
          )}

          {/* Email table */}
          {hasRows && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total",    val: stats.total,    cls: "bg-slate-50   border-slate-200   text-slate-700"   },
                  { label: "Selected", val: stats.selected, cls: "bg-indigo-50  border-indigo-200  text-indigo-700"  },
                  { label: "Sent",     val: stats.success,  cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                  { label: "Failed",   val: stats.failed,   cls: "bg-red-50     border-red-200     text-red-700"     },
                ].map((s) => (
                  <div key={s.label} className={`border rounded-xl p-3 text-center ${s.cls}`}>
                    <div className="text-2xl font-black">{s.val}</div>
                    <div className="text-xs font-semibold mt-0.5 opacity-70">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={toggleAll} className="text-xs font-semibold text-indigo-600 hover:underline">
                    {rows.every((r) => r.selected) ? "Deselect All" : "Select All"}
                  </button>
                  {rows.some((r) => r.selected) && !isSending && (
                    <button onClick={removeSelected} className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Remove Selected
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {stats.failed > 0 && sendDone && (
                    <>
                      <button onClick={retryFailed} className="text-xs font-semibold text-amber-600 hover:underline flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Retry Failed
                      </button>
                      <button onClick={exportFailed} className="text-xs font-semibold text-slate-600 hover:underline flex items-center gap-1">
                        <Download className="w-3 h-3" /> Export Failed
                      </button>
                    </>
                  )}
                  {!isSending && (
                    <button onClick={handleReset} className="text-xs font-semibold text-slate-400 hover:underline flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Start Over
                    </button>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[32px_1fr_110px_24px] items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <input type="checkbox" checked={rows.every((r) => r.selected)} onChange={toggleAll} className="rounded accent-indigo-600" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                  <span />
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {rows.map((row) => (
                    <div key={row.email}>
                      <div className="grid grid-cols-[32px_1fr_110px_24px] items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleRow(row.email)}
                          disabled={isSending || row.status === "success"}
                          className="rounded accent-indigo-600"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800 font-medium truncate">{row.email}</p>
                          {row.status === "error" && (
                            <button
                              onClick={() => setExpandErr(expandErr === row.email ? null : row.email)}
                              className="text-xs text-red-500 flex items-center gap-0.5 mt-0.5"
                            >
                              {expandErr === row.email ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              View error
                            </button>
                          )}
                          {row.status === "success" && row.linkUrl && (
                            <p className="text-xs text-emerald-600 font-mono truncate mt-0.5">{row.linkUrl}</p>
                          )}
                        </div>
                        <StatusBadge status={row.status} />
                        <button onClick={() => removeRow(row.email)} disabled={isSending} className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-30">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {expandErr === row.email && row.error && (
                        <div className="px-12 pb-2.5">
                          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed">{row.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(isSending || sendDone) && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">
                      {isSending ? `Sending… (${stats.success + stats.failed} / ${stats.selected})` : "Complete"}
                    </span>
                    <span className="text-xs text-slate-400">{stats.success} sent · {stats.failed} failed</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.selected ? ((stats.success + stats.failed) / stats.selected) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {sendDone && stats.failed === 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-800 font-semibold">All {stats.success} link(s) sent successfully!</p>
                </div>
              )}
              {sendDone && stats.failed > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    <strong>{stats.success}</strong> sent · <strong>{stats.failed}</strong> failed.
                    Use <em>Retry Failed</em> above or export the list to fix.
                  </p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>Note:</strong> Each link expires in 7 days · one-time use · requires HR approval.
                  Sent links appear in the <strong>Pending Approvals</strong> tab once submitted by the employee.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4 bg-white rounded-b-2xl flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {hasRows ? `${stats.selected} of ${stats.total} email(s) selected` : "No emails loaded yet"}
          </div>
          <div className="flex items-center gap-3">
            {isSending ? (
              <button
                onClick={() => { abortRef.current = true; }}
                className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-200 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Stop Sending
              </button>
            ) : (
              <>
                <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  {sendDone ? "Close" : "Cancel"}
                </button>
                {hasRows && !sendDone && (
                  <button
                    onClick={handleSend}
                    disabled={stats.selected === 0}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all disabled:opacity-40 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send {stats.selected > 0 ? `${stats.selected} Link${stats.selected > 1 ? "s" : ""}` : "Links"}
                  </button>
                )}
                {sendDone && stats.failed > 0 && (
                  <button onClick={retryFailed} className="px-5 py-2.5 bg-amber-500 text-white rounded-lg font-semibold text-sm hover:bg-amber-600 transition-all flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Retry {stats.failed} Failed
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkLinkModal;