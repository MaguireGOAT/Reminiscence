export function exportLogsCsv(logs) {
  const header = [
    "日期",
    "活動計劃",
    "主題",
    "出席人數",
    "投入程度",
    "備註",
    "難忘片段"
  ];
  const rows = logs.map((log) => [
    log.date,
    log.planTitle || "",
    log.theme,
    String(log.attendance),
    log.engagement,
    log.notes,
    log.memories
  ]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `憶當年小組紀錄-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
