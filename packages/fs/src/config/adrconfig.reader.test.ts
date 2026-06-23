import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_FILE } from "../constants.js";
import { readADRConfig, writeADRConfig } from "./adrconfig.reader.js";

async function mkTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "roadkit-config-test-"));
}

describe("readADRConfig", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkTempDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns defaults when the config file is absent", async () => {
    const config = await readADRConfig(tempDir);
    expect(config.idFormat).toBe("ADR-XXXX");
    expect(config.types).toEqual(["tech-choice", "process", "architecture"]);
    expect(config.templates).toEqual({});
  });

  it("reads a valid config", async () => {
    await fs.writeFile(
      path.join(tempDir, CONFIG_FILE),
      "idFormat: REQ-XXX\ntypes:\n  - a\n  - b\ntemplates:\n  default: tpl.md\n",
      "utf-8"
    );
    const config = await readADRConfig(tempDir);
    expect(config.idFormat).toBe("REQ-XXX");
    expect(config.types).toEqual(["a", "b"]);
    expect(config.templates).toEqual({ default: "tpl.md" });
  });

  it("falls back per-field for a partial config", async () => {
    await fs.writeFile(path.join(tempDir, CONFIG_FILE), "idFormat: ONLY-ID\n", "utf-8");
    const config = await readADRConfig(tempDir);
    expect(config.idFormat).toBe("ONLY-ID");
    expect(config.types).toEqual(["tech-choice", "process", "architecture"]);
    expect(config.templates).toEqual({});
  });

  it("ignores non-string entries in the types array", async () => {
    await fs.writeFile(
      path.join(tempDir, CONFIG_FILE),
      "types:\n  - good\n  - 42\n  - alsoGood\n",
      "utf-8"
    );
    const config = await readADRConfig(tempDir);
    expect(config.types).toEqual(["good", "alsoGood"]);
  });

  it("falls back when fields have wrong types", async () => {
    await fs.writeFile(
      path.join(tempDir, CONFIG_FILE),
      "idFormat: 123\ntypes: not-an-array\ntemplates: also-not-an-object\n",
      "utf-8"
    );
    const config = await readADRConfig(tempDir);
    expect(config.idFormat).toBe("ADR-XXXX");
    expect(config.types).toEqual(["tech-choice", "process", "architecture"]);
    expect(config.templates).toEqual({});
  });

  it("returns defaults for a scalar (non-object) YAML document", async () => {
    await fs.writeFile(path.join(tempDir, CONFIG_FILE), "just a string\n", "utf-8");
    const config = await readADRConfig(tempDir);
    expect(config.idFormat).toBe("ADR-XXXX");
    expect(config.types).toEqual(["tech-choice", "process", "architecture"]);
  });

  it("round-trips through writeADRConfig", async () => {
    await writeADRConfig(tempDir, {
      idFormat: "DEC-XXX",
      types: ["x"],
      templates: { y: "z.md" },
    });
    const config = await readADRConfig(tempDir);
    expect(config.idFormat).toBe("DEC-XXX");
    expect(config.types).toEqual(["x"]);
    expect(config.templates).toEqual({ y: "z.md" });
  });
});
