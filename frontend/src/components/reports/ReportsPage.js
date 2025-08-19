// frontend/src/components/reports/ReportsPage.js
import React, { useState } from "react";
import GenerateReportModal from "./GenerateReportModal";

export default function ReportsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">Reports</h1>
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700"
          >
            📑 Generate Report
          </button>
        </div>

        {/* Helpful intro / empty state */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Welcome to CMMS Reports</h2>
          <p className="text-slate-600 mb-4">
            Create equipment, task, compliance, and performance reports with rich filters and export formats.
            Use the <span className="font-medium">Generate Report</span> button to get started.
          </p>
          <ul className="list-disc ml-6 text-slate-600">
            <li>Export to PDF, Excel, or Word.</li>
            <li>Include charts and auto summaries.</li>
            <li>Schedule automatic deliveries to email.</li>
          </ul>
        </div>
      </div>

      <GenerateReportModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
