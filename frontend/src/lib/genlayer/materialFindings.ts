import { validRecordId } from '../commitments';
import type { MaterialFinding, MaterialFindingCode, MaterialFindingReference } from '../../types/domain';

export const MATERIAL_FINDING_CODES: readonly MaterialFindingCode[] = [
  'FACT', 'RULE', 'PROCEDURE', 'OUTCOME', 'REMEDY', 'CONFLICT',
];

export function parseMaterialFindingsJson(
  raw: string,
  allowedScopes: readonly MaterialFindingReference['scope'][],
): MaterialFinding[] {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('malformed_material_findings_json'); }
  if (!Array.isArray(value) || value.length > 4) throw new Error('invalid_material_findings');
  const result: MaterialFinding[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)
      || Object.keys(item).sort().join(',') !== 'code,sources') throw new Error('invalid_material_finding');
    const finding = item as Record<string, unknown>;
    if (typeof finding.code !== 'string' || !MATERIAL_FINDING_CODES.includes(finding.code as MaterialFindingCode)
      || !Array.isArray(finding.sources) || finding.sources.length < 1 || finding.sources.length > 2) {
      throw new Error('invalid_material_finding');
    }
    const sources: MaterialFindingReference[] = [];
    const sourceKeys = new Set<string>();
    for (const ref of finding.sources) {
      if (!ref || typeof ref !== 'object' || Array.isArray(ref)
        || Object.keys(ref).sort().join(',') !== 'quote,scope,source_id') throw new Error('invalid_material_finding_reference');
      const source = ref as Record<string, unknown>;
      if (typeof source.scope !== 'string' || !allowedScopes.includes(source.scope as MaterialFindingReference['scope'])
        || typeof source.source_id !== 'string' || !validRecordId(source.source_id)
        || typeof source.quote !== 'string' || !source.quote.trim() || source.quote.length > 180) {
        throw new Error('invalid_material_finding_reference');
      }
      const sourceKey = `${source.scope}:${source.source_id}`;
      if (sourceKeys.has(sourceKey)) throw new Error('duplicate_material_finding_reference');
      sourceKeys.add(sourceKey);
      sources.push({ scope: source.scope as MaterialFindingReference['scope'], source_id: source.source_id, quote: source.quote });
    }
    sources.sort((a, b) => a.scope.localeCompare(b.scope) || a.source_id.localeCompare(b.source_id) || a.quote.localeCompare(b.quote));
    const canonical: MaterialFinding = { code: finding.code as MaterialFindingCode, sources };
    const marker = JSON.stringify(canonical);
    if (seen.has(marker)) throw new Error('duplicate_material_finding');
    seen.add(marker);
    result.push(canonical);
  }
  result.sort((a, b) => a.code.localeCompare(b.code) || JSON.stringify(a.sources).localeCompare(JSON.stringify(b.sources)));
  return result;
}

/** Python json.dumps(..., ensure_ascii=True, separators=(',', ':')) parity. */
export function pythonCompactJson(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) =>
      `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
  }
  if (Array.isArray(value)) return `[${value.map(pythonCompactJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${pythonCompactJson(key)}:${pythonCompactJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
