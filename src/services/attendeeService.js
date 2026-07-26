export function sanitizeCsvCell(value) {
  const text = String(value ?? "").replaceAll('"', '""');
  const safePrefix = /^[=+\-@]/.test(text) ? "'" : "";
  return `"${safePrefix}${text}"`;
}
