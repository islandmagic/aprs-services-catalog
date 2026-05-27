# APRS Service Catalog

Machine-readable catalog of APRS bots and services for [Radio Messenger](https://radiomessenger.app). One JSON file per service; CI compiles and publishes a single artifact to GitHub Pages.

## Published catalog

After merge to `master`:

```
https://islandmagic.github.io/aprs-services-catalog/aprs-services.v1.json
```

## Add a bot (humans and agents)

1. Copy `services/_template.json` → `services/{id}.json` (filename must match `id`).
2. Fill required fields:
   - `callsigns`: uppercase base callsigns only (no SSID suffix in the array).
   - `icon.type`: `sf_symbol` with a valid SF Symbol name.
   - `compose.commands`: at least one command with a `match` rule (stubs may use `[]`).
3. Open a PR — CI validates JSON Schema and unique callsigns.
4. Merge — GitHub Pages deploys the compiled catalog (~1 min).

### Agent checklist

- [ ] Unique `id` (lowercase slug)
- [ ] Filename `{id}.json` matches `"id"`
- [ ] All `callsigns` uppercase, no duplicates across files
- [ ] Each command has unique `id` within the service
- [ ] `match.type` is one of: `prefix`, `any`, `freeform`, `parameterized`
- [ ] Run `npm run validate` locally before pushing

## Local development

```bash
npm ci
npm run validate          # compile to /tmp
npm run compile           # compile to _site/ (Pages output)
```

## Schema

See [`schema/service.v1.schema.json`](schema/service.v1.schema.json).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
