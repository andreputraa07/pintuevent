export function sanitizeCsvCell(value){const text=String(value??"").replaceAll('"','""');return `"${/^[=+\-@]/.test(text)?"'":""}${text}"`}
