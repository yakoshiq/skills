# correct - before / after

The task is to prevent a recurring mistake:

> CSV was added to the download menu but not the export endpoint. The same omission happened when JSON was added later. Fix the catalog drift without changing supported formats or adding a framework.

## Without the skill - a fix that invites the next omission

```ts
const menuFormats = ["pdf", "csv", "json"];
const exportFormats = ["pdf", "csv"];
```

Adding `"json"` to the second list repairs this instance. A reminder to update both lists still depends on the next contributor finding and remembering it. A test for JSON alone catches this omission, but leaves two competing catalogs to drift again.

## With the skill - remove the competing source

The supported formats become one authoritative definition used by both consumers:

```ts
const formats = {
  pdf: { label: "PDF", contentType: "application/pdf" },
  csv: { label: "CSV", contentType: "text/csv" },
  json: { label: "JSON", contentType: "application/json" },
} as const;

type Format = keyof typeof formats;

export function downloadMenu() {
  return Object.entries(formats).map(([format, spec]) => ({
    label: spec.label,
    href: `/exports/${format}`,
  }));
}

export function exportContentType(format: string): string {
  if (!Object.hasOwn(formats, format)) {
    throw new Error(`Unsupported export format: ${format}`);
  }
  return formats[format as Format].contentType;
}
```

This illustrates the catalog boundary, not a complete HTTP endpoint. Existing export implementations and their errors remain unchanged. A format is listed only when its actual implementation is available; metadata cannot stand in for a missing exporter.

## Prove the recurring class, not just the remembered value

- Replay the CSV and JSON omissions through the real menu and export boundary. The old implementation must expose the advertised-but-unsupported format; the changed implementation must serve the correct format and content type.
- Add another implemented format to the authoritative catalog in an isolated fixture. Confirm its menu action reaches a working export without editing a second registration list.
- Check that unknown formats are still rejected and existing export errors retain their behavior.

Those are illustrative acceptance checks, not claims that this TypeScript example was executed. They assert consumer-visible behavior rather than comparing two internal arrays or looking for particular source text.

The prevention is structural: the handwritten second catalog is gone. A diagnostic rule or dedicated registry framework is unnecessary here. Remove the obsolete reminder to synchronize lists, but retain any rationale for which formats are supported.

## When a rule cannot be enforced mechanically

“Prefer a clear domain name” requires judgment. Keep a short example or review instruction; do not invent a lint that rejects every conventional `handle` or `process` function. A single defect without evidence of recurrence remains a bounded fix, not permission to redesign its module.

The skill's evidence search is project-scoped. Private session excerpts and incident details do not belong in a public rule table.
