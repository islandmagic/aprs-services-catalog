#!/usr/bin/env node
/**
 * Validates services/*.json and compiles dist/aprs-services.v1.json for GitHub Pages.
 *
 * Usage:
 *   node scripts/compile-catalog.mjs --out _site/aprs-services.v1.json
 *   node scripts/compile-catalog.mjs --out /tmp/aprs-services.v1.json
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const servicesDir = join(repoRoot, "services");
const schemaPath = join(repoRoot, "schema", "service.v1.schema.json");
const sourceURL = "https://github.com/islandmagic/aprs-services-catalog";

function parseArgs(argv) {
  const outIndex = argv.indexOf("--out");
  const outPath =
    outIndex >= 0 && argv[outIndex + 1]
      ? argv[outIndex + 1]
      : join(repoRoot, "_site", "aprs-services.v1.json");
  return { outPath };
}

function catalogVersion() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

function loadServices() {
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const files = readdirSync(servicesDir)
    .filter((name) => name.endsWith(".json") && !name.startsWith("_"))
    .sort();

  if (files.length === 0) {
    throw new Error("No service files found in services/");
  }

  const services = [];
  const seenIds = new Set();
  const seenCallsigns = new Map();

  for (const file of files) {
    const path = join(servicesDir, file);
    const raw = readFileSync(path, "utf8");
    let service;
    try {
      service = JSON.parse(raw);
    } catch (error) {
      throw new Error(`${file}: invalid JSON — ${error.message}`);
    }

    if (!validate(service)) {
      const detail = ajv.errorsText(validate.errors, { separator: "\n" });
      throw new Error(`${file}: schema validation failed\n${detail}`);
    }

    const expectedId = basename(file, ".json");
    if (service.id !== expectedId) {
      throw new Error(`${file}: id "${service.id}" must match filename "${expectedId}"`);
    }

    if (seenIds.has(service.id)) {
      throw new Error(`Duplicate service id: ${service.id}`);
    }
    seenIds.add(service.id);

    for (const callsign of service.callsigns) {
      const upper = callsign.toUpperCase();
      if (seenCallsigns.has(upper)) {
        throw new Error(
          `Duplicate callsign ${upper} in ${file} (already in ${seenCallsigns.get(upper)})`
        );
      }
      seenCallsigns.set(upper, file);
    }

    services.push(service);
  }

  services.sort((a, b) => a.id.localeCompare(b.id));
  return services;
}

function main() {
  const { outPath } = parseArgs(process.argv.slice(2));
  const services = loadServices();
  const now = new Date();

  const catalog = {
    schema_version: 1,
    catalog_version: catalogVersion(),
    updated_at: now.toISOString(),
    source_url: sourceURL,
    service_count: services.length,
    services,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath} (${services.length} services)`);
}

main();
