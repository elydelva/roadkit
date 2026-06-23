import { InvalidIdError } from "../../errors/errors.js";

const SPEC_ID_REGEX = /^SPEC-\d{4}$/;

export class SpecId {
  private constructor(private readonly value: string) {}

  static from(raw: string): SpecId {
    if (!SPEC_ID_REGEX.test(raw)) {
      throw new InvalidIdError(`Invalid SpecId format: "${raw}". Expected SPEC-XXXX`);
    }
    return new SpecId(raw);
  }

  static generate(counter: number): SpecId {
    const padded = String(counter).padStart(4, "0");
    return new SpecId(`SPEC-${padded}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SpecId): boolean {
    return this.value === other.value;
  }
}
