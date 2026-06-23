import { InvalidIdError } from "../../errors/errors.js";

const ISSUE_ID_REGEX = /^ISSUE-\d{4}$/;

export class IssueId {
  private constructor(private readonly value: string) {}

  static from(raw: string): IssueId {
    if (!ISSUE_ID_REGEX.test(raw)) {
      throw new InvalidIdError(`Invalid IssueId format: "${raw}". Expected ISSUE-XXXX`);
    }
    return new IssueId(raw);
  }

  static generate(counter: number): IssueId {
    const padded = String(counter).padStart(4, "0");
    return new IssueId(`ISSUE-${padded}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: IssueId): boolean {
    return this.value === other.value;
  }
}
