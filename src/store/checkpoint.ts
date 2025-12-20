import fs from "node:fs";
import path from "node:path";

type CheckpointData = {
  lastProcessedBlock?: number;
  processedEventIds?: Record<string, true>;
};

export class CheckpointStore {
  private filePath: string;
  private data: CheckpointData;

  constructor(opts: { filePath: string }) {
    this.filePath = opts.filePath;
    this.data = {};
    this.load();
  }

  private load() {
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      this.data = JSON.parse(raw) as CheckpointData;
      if (!this.data.processedEventIds) this.data.processedEventIds = {};
    } catch {
      this.data = { processedEventIds: {} };
    }
  }

  private save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
  }

  getLastProcessedBlock(): number | undefined {
    return this.data.lastProcessedBlock;
  }

  setLastProcessedBlock(block: number) {
    this.data.lastProcessedBlock = block;
    this.save();
  }

  hasEvent(eventId: string): boolean {
    return Boolean(this.data.processedEventIds?.[eventId]);
  }

  markEvent(eventId: string) {
    if (!this.data.processedEventIds) this.data.processedEventIds = {};
    this.data.processedEventIds[eventId] = true;
    // Avoid unbounded growth: keep only the most recent N by trimming when large.
    const keys = Object.keys(this.data.processedEventIds);
    const MAX = 50_000;
    if (keys.length > MAX) {
      // delete oldest-ish by lexical sort (good enough because ids include block numbers)
      keys.sort();
      for (const k of keys.slice(0, keys.length - MAX)) delete this.data.processedEventIds[k];
    }
    this.save();
  }
}


