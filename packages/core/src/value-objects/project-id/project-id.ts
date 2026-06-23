import { InvalidIdError } from "../../errors/errors.js";

const PROJECT_ID_REGEX = /^PROJ-\d{4}$/;

export class ProjectId {
  private constructor(private readonly value: string) {}

  static from(raw: string): ProjectId {
    if (!PROJECT_ID_REGEX.test(raw)) {
      throw new InvalidIdError(`Invalid ProjectId format: "${raw}". Expected PROJ-XXXX`);
    }
    return new ProjectId(raw);
  }

  static generate(counter: number): ProjectId {
    const padded = String(counter).padStart(4, "0");
    return new ProjectId(`PROJ-${padded}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ProjectId): boolean {
    return this.value === other.value;
  }
}
