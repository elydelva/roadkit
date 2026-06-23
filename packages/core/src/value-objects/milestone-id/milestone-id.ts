import { InvalidIdError } from "../../errors/errors.js";

const MILESTONE_ID_REGEX = /^MILE-\d{4}$/;

export class MilestoneId {
  private constructor(private readonly value: string) {}

  static from(raw: string): MilestoneId {
    if (!MILESTONE_ID_REGEX.test(raw)) {
      throw new InvalidIdError(`Invalid MilestoneId format: "${raw}". Expected MILE-XXXX`);
    }
    return new MilestoneId(raw);
  }

  static generate(counter: number): MilestoneId {
    const padded = String(counter).padStart(4, "0");
    return new MilestoneId(`MILE-${padded}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MilestoneId): boolean {
    return this.value === other.value;
  }
}
