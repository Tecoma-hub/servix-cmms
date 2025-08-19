// frontend/src/components/reports/GenerateReportModal.js
import React, { useMemo, useState } from "react";
import {
  X,
  Download,
  Mail,
  Calendar,
  Loader2,
  Settings,
  BarChart3,
  FileText,
} from "lucide-react";
import api from "../../utils/api"; // your axios instance (JWT is injected)

// ------------------------------------
// Lists / Options
// ------------------------------------
const REPORT_TYPES = [
  { key: "equipmentStatus", label: "Equipment Status Report" },
  { key: "taskManagement", label: "Task Management Report" },
  { key: "preventiveVsCorrective", label: "Preventive vs Corrective Maintenance Report" },
  { key: "staffPerformance", label: "Engineer & Technician Performance Report" },
  { key: "inventorySpareParts", label: "Spare Parts & Inventory Report" },
  { key: "downtimeAnalysis", label: "Downtime Analysis Report" },
  { key: "financialCost", label: "Financial/Cost Report" },
  { key: "complianceAudit", label: "Compliance & Audit Report" },
];

const DEPARTMENTS = [
  "ICU", "Theatre", "Radiology", "Physiotherapy", "Laboratory", "OPD",
  "Maternity", "ENT", "Dental", "Eye",
];

const EQUIPMENT_CATEGORIES = [
  "Ventilator", "Defibrillator", "Monitor", "Infusion Pump", "Suction",
  "Autoclave", "X-Ray", "Ultrasound",
];

const FORMATS = [
  { key: "pdf", label: "PDF (with charts)" },
  { key: "xlsx", label: "Excel (editable)" },
  { key: "docx", label: "Word (narrative)" }, // server returns PDF for docx placeholder if not implemented
];

// ------------------------------------
// Small toggle component
// ------------------------------------
function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? "bg-indigo-600" : "bg-gray-300"
      }`}
      id={id}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ------------------------------------
// Main modal
// ------------------------------------
export default function GenerateReportModal({ open, onClose }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ----- Form State -----
  const [selectedReports, setSelectedReports] = useState([]);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState("");
  const [format, setFormat] = useState("pdf");

  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  const [interactiveExport, setInteractiveExport] = useState(false);
  const [trendPrediction, setTrendPrediction] = useState(false);
  const [heatMaps, setHeatMaps] = useState(false);

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState("monthly");
  const [deliveryNow, setDeliveryNow] = useState(true);
  const [deliveryEmail, setDeliveryEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const reset = () => {
    setSelectedReports([]);
    setDateFrom(today);
    setDateTo(today);
    setDepartments([]);
    setCategories([]);
    setStaff("");
    setFormat("pdf");
    setIncludeCharts(true);
    setIncludeSummary(true);
    setInteractiveExport(false);
    setTrendPrediction(false);
    setHeatMaps(false);
    setScheduleEnabled(false);
    setScheduleFreq("monthly");
    setDeliveryNow(true);
    setDeliveryEmail("");
    setLoading(false);
    setError("");
    setSuccessMsg("");
  };

  const toggleInArray = (value, arr, setter) => {
    if (arr.includes(value)) setter(arr.filter((v) => v !== value));
    else setter([...arr, value]);
  };

  // ------------------------------------
  // Generate handler
  // ------------------------------------
  const handleGenerate = async () => {
    setError("");
    setSuccessMsg("");

    if (selectedReports.length === 0) {
      setError("Select at least one report type.");
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      setError("Start date cannot be after end date.");
      return;
    }
    if (!deliveryNow && !deliveryEmail && !scheduleEnabled) {
      setError("Choose ‘Download Now’, or provide an email, or enable Schedule.");
      return;
    }

    const payload = {
      reports: selectedReports,
      filters: {
        dateFrom,
        dateTo,
        departments,
        categories,
        staff: staff || undefined,
      },
      options: {
        format, // pdf | xlsx | docx
        visuals: { charts: includeCharts, summary: includeSummary },
        advanced: {
          interactiveExport,
          trendPrediction,
          heatMaps,
        },
        schedule: scheduleEnabled
          ? { enabled: true, frequency: scheduleFreq }
          : { enabled: false },
        delivery: { downloadNow: deliveryNow, email: deliveryEmail || undefined },
      },
    };

    try {
      setLoading(true);

      // Ask backend to STREAM the file so the browser download starts immediately
      const response = await api.post("/reports/generate", payload, {
        responseType: "blob",
        headers: { "x-return-blob": "1" },
      });

      const contentType = response.headers["content-type"];

      // Some proxies set application/octet-stream; treat any non-JSON as file
      const isJson =
        contentType && contentType.toLowerCase().includes("application/json");

      if (isJson) {
        // Convert the blob to text then JSON
        const text = await response.data.text();
        const json = JSON.parse(text);
        if (json?.fileUrl) {
          window.open(json.fileUrl, "_blank");
          setSuccessMsg("Report is ready. Opened download link in a new tab.");
        } else {
          setError(json?.message || "Unexpected server response.");
        }
      } else {
        // Blob path — save file
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        const ext =
          format === "xlsx" ? "xlsx" : format === "docx" ? "docx" : "pdf";
        a.href = url;
        a.download = `cmms-report-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setSuccessMsg("Report downloaded successfully.");
      }

      if (scheduleEnabled || (!deliveryNow && deliveryEmail)) {
        setSuccessMsg((prev) => `${prev} Scheduled / email delivery configured.`);
      }
    } catch (err) {
      try {
        const text = await err?.response?.data?.text?.();
        const json = text ? JSON.parse(text) : null;
        setError(
          json?.message ||
            err?.response?.data?.message ||
            err.message ||
            "Failed to generate report."
        );
      } catch (_) {
        setError(
          err?.response?.data?.message || err.message || "Failed to generate report."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Generate Report</h2>
          </div>
          <button
            onClick={() => {
              reset();
              onClose?.();
            }}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5">
          {/* Report Types */}
          <section className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700">Report Types</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {REPORT_TYPES.map((r) => (
                <label
                  key={r.key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(r.key)}
                    onChange={() =>
                      toggleInArray(r.key, selectedReports, setSelectedReports)
                    }
                    className="h-4 w-4"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Filters */}
          <section className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700">Filters</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <label className="w-28 text-sm text-gray-600">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border p-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-28 text-sm text-gray-600">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border p-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  Departments
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleInArray(d, departments, setDepartments)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        departments.includes(d)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  Equipment Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleInArray(c, categories, setCategories)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        categories.includes(c)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-gray-600">
                  Filter by Staff (optional)
                </label>
                <input
                  type="text"
                  value={staff}
                  onChange={(e) => setStaff(e.target.value)}
                  placeholder="e.g., Eng. Mensah or Tech. Adwoa"
                  className="w-full rounded-lg border p-2"
                />
              </div>
            </div>
          </section>

          {/* Output Options */}
          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <BarChart3 className="h-4 w-4" /> Output Options
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-gray-600">Format</div>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map((f) => (
                    <label
                      key={f.key}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="format"
                        checked={format === f.key}
                        onChange={() => setFormat(f.key)}
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Include Charts</div>
                  <div className="text-xs text-gray-500">
                    Pie, bar, trend lines in PDF/Excel
                  </div>
                </div>
                <Toggle checked={includeCharts} onChange={setIncludeCharts} id="charts" />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Include Auto Summary</div>
                  <div className="text-xs text-gray-500">
                    One-paragraph insights at top
                  </div>
                </div>
                <Toggle checked={includeSummary} onChange={setIncludeSummary} id="summary" />
              </div>
            </div>
          </section>

          {/* Advanced Options */}
          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Settings className="h-4 w-4" /> Advanced Options
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Interactive Dashboard Export</div>
                  <div className="text-xs text-gray-500">
                    Enable drill-down in Excel/online
                  </div>
                </div>
                <Toggle
                  checked={interactiveExport}
                  onChange={setInteractiveExport}
                  id="interactive"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Trend Prediction</div>
                  <div className="text-xs text-gray-500">
                    Flag likely-to-fail equipment
                  </div>
                </div>
                <Toggle
                  checked={trendPrediction}
                  onChange={setTrendPrediction}
                  id="prediction"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Heat Maps</div>
                  <div className="text-xs text-gray-500">
                    Highlight heavy-load departments
                  </div>
                </div>
                <Toggle checked={heatMaps} onChange={setHeatMaps} id="heatmaps" />
              </div>
            </div>
          </section>

          {/* Schedule & Delivery */}
          <section className="mb-2">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4" /> Schedule & Delivery
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Schedule</div>
                  <div className="text-xs text-gray-500">Email reports automatically</div>
                </div>
                <Toggle
                  checked={scheduleEnabled}
                  onChange={setScheduleEnabled}
                  id="schedule"
                />
              </div>

              {scheduleEnabled && (
                <div className="flex items-center gap-2">
                  <label className="w-28 text-sm text-gray-600">Frequency</label>
                  <select
                    value={scheduleFreq}
                    onChange={(e) => setScheduleFreq(e.target.value)}
                    className="w-full rounded-lg border p-2"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Download Now</div>
                  <div className="text-xs text-gray-500">Save file to device</div>
                </div>
                <Toggle
                  checked={deliveryNow}
                  onChange={setDeliveryNow}
                  id="downloadNow"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 text-sm text-gray-600">Email To</label>
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={deliveryEmail}
                    onChange={(e) => setDeliveryEmail(e.target.value)}
                    placeholder="e.g., admin@hospital.org"
                    className="w-full rounded-lg border p-2 pr-10"
                  />
                  <Mail className="absolute right-2 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </section>

          {/* Errors / Success */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {successMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t p-5">
          <div className="text-xs text-gray-500">
            Your selections will generate consolidated reports per type with charts and summaries.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                reset();
                onClose?.();
              }}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
