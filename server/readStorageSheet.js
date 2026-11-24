import ExcelJS from 'exceljs';
import { fetchStorageFile } from './fetchStorageFile.js';

const MAX_SHEET_BYTES = 20 * 1024 * 1024;
const MAX_SHEETS = 20;
const MAX_ROWS = 500;
const MAX_COLUMNS = 50;
const MAX_CELL_CHARS = 200;
// Garde la réponse JSON sous la limite de 4,5 Mo des fonctions Vercel.
const MAX_TOTAL_CHARS = 2_000_000;

export async function readStorageSheet(input) {
  const file = await fetchStorageFile(
    input,
    MAX_SHEET_BYTES,
    'Ce classeur est trop volumineux pour l’aperçu (20 Mo maximum).'
  );
  if (file.error) return file.error;

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(file.bytes);
  } catch {
    return { status: 422, body: { error: 'Ce classeur Excel ne peut pas être lu.' } };
  }

  let budget = MAX_TOTAL_CHARS;
  let truncated = false;
  const sheets = [];

  const visible = workbook.worksheets.filter((sheet) => sheet.state !== 'hidden' && sheet.state !== 'veryHidden');
  if (visible.length > MAX_SHEETS) truncated = true;

  for (const sheet of visible.slice(0, MAX_SHEETS)) {
    if (sheet.rowCount > MAX_ROWS || sheet.columnCount > MAX_COLUMNS) truncated = true;
    const rowLimit = Math.min(sheet.rowCount, MAX_ROWS);
    const columnLimit = Math.min(sheet.columnCount, MAX_COLUMNS);
    const rows = [];
    let widest = 0;

    for (let r = 1; r <= rowLimit && budget > 0; r += 1) {
      const row = sheet.getRow(r);
      const values = [];
      for (let c = 1; c <= columnLimit; c += 1) {
        let text = cellText(row.getCell(c));
        if (text.length > MAX_CELL_CHARS) {
          text = `${text.slice(0, MAX_CELL_CHARS)}…`;
          truncated = true;
        }
        budget -= text.length;
        values.push(text);
      }
      let last = values.length;
      while (last > 0 && values[last - 1] === '') last -= 1;
      widest = Math.max(widest, last);
      rows.push(values);
    }
    if (budget <= 0) truncated = true;

    let lastRow = rows.length;
    while (lastRow > 0 && rows[lastRow - 1].every((value) => value === '')) lastRow -= 1;

    sheets.push({
      name: sheet.name,
      rows: rows.slice(0, lastRow).map((values) => values.slice(0, widest))
    });
    if (budget <= 0) break;
  }

  return { status: 200, body: { sheets, truncated } };
}

function cellText(cell) {
  if (cell.isMerged && cell.master && cell.master.address !== cell.address) {
    return '';
  }
  return valueText(cell.value);
}

function valueText(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || '').join('');
    }
    if ('result' in value) return valueText(value.result);
    if ('formula' in value || 'sharedFormula' in value) return '';
    if ('text' in value) return valueText(value.text);
    if ('error' in value) return String(value.error);
    return '';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: 6, useGrouping: false });
  }
  if (typeof value === 'boolean') return value ? 'VRAI' : 'FAUX';
  return String(value);
}

function formatDate(date) {
  if (Number.isNaN(date.getTime())) return '';
  const hasTime = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0;
  return date.toLocaleString('fr-FR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });
}
