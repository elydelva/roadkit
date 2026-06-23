import { InvalidIdError } from "../../errors/errors.js";

const TRACE_ID_REGEX = /^TRACE-\d{8}T\d{4}-[0-9a-f]{6}$/;

export class TraceId {
  private constructor(private readonly value: string) {}

  static from(raw: string): TraceId {
    if (!TRACE_ID_REGEX.test(raw)) {
      throw new InvalidIdError(
        `Invalid TraceId format: "${raw}". Expected TRACE-YYYYMMDDTHHmm-XXXXXX`
      );
    }
    return new TraceId(raw);
  }

  static generate(): TraceId {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `T${pad(now.getHours())}${pad(now.getMinutes())}`;
    const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
    return new TraceId(`TRACE-${stamp}-${hex}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TraceId): boolean {
    return this.value === other.value;
  }
}
