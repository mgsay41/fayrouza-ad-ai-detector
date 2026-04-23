import winston from "winston";
import path from "path";
import fs from "fs";

const logsDir = path.resolve(process.cwd(), "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export interface AuditEntry {
  ad_id?: number;
  job_id?: string;
  decision: string;
  confidence_score?: number;
  violations?: string[];
  processing_ms?: number;
  source: "gemini_analysis" | "admin_override";
  reason?: string;
  reviewer_id?: number;
  created_at: string;
}

const auditLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "audit.log"),
      format: winston.format.printf((info) => {
        const { timestamp, level, ...rest } = info;
        return JSON.stringify({ ...rest, created_at: timestamp });
      }),
    }),
  ],
});

export function writeAudit(entry: AuditEntry): void {
  auditLogger.info("audit", entry);
}

export async function queryAudit(filters: {
  ad_id?: number;
  decision?: string;
  limit: number;
  offset: number;
}): Promise<AuditEntry[]> {
  const logPath = path.join(logsDir, "audit.log");

  if (!fs.existsSync(logPath)) {
    return [];
  }

  const content = (await fs.promises.readFile(logPath, "utf-8")).trim();
  if (!content) {
    return [];
  }

  const lines = content.split("\n");
  const entries: AuditEntry[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as AuditEntry;

      if (filters.ad_id !== undefined && parsed.ad_id !== filters.ad_id) {
        continue;
      }
      if (filters.decision && parsed.decision !== filters.decision) {
        continue;
      }

      entries.push(parsed);
    } catch {
      continue;
    }
  }

  entries.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  return entries.slice(filters.offset, filters.offset + filters.limit);
}
