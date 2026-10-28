# Mode: cv-revise — Existing CV revision and Word export

## Purpose

Revise an existing CV or export an approved CV to Word without
running a new job evaluation or application pipeline.

## Context

This is a standalone mode. The router loads _profile.md,
_custom.md and this mode file.

Do not load _shared.md or execute auto-pipeline, oferta, text
or pdf as a dependency.

## Input

Use the specific existing CV or approved draft identified
by the user.

If the source is ambiguous, request its exact path.
Do not search unrelated files or reconstruct a previous CV.

## Revision

- Make only the changes explicitly requested.
- Preserve verified career history, dates, titles and achievements.
- Do not invent qualifications, metrics or responsibilities.
- Do not fetch or reanalyse the job description unless explicitly
  requested for a separate tailoring workflow.
- Preserve approved content and formatting where practical.
- Save a new version; do not overwrite the approved original.

## Word export

- Reuse approved CV content without regenerating it with AI.
- Prefer a verified existing local document generator.
- Do not install tools or develop a new generator automatically.
- Honour applicable output rules in _custom.md.
- If no suitable generator exists, report the blocker rather
  than claiming to have created a Word document.

## Validation

For generated Markdown CVs, run verify-cv-facts.mjs and stop
if factual validation fails.

For Word output, verify that the DOCX exists, is readable,
contains the expected CV sections and retains the approved facts.

Report any checks that could not be performed.

## Restrictions

Never automatically:
- Run a full job evaluation or application pipeline.
- Generate unrelated reports or PDFs.
- Update the application tracker.
- Change cv.md or other canonical source files.
- Submit applications or send messages.

Report the output location, changes made and validation result.

## Deterministic DOCX helper

For existing approved DOCX files, use
`scripts/cv_revise_docx.py` with an interpreter containing python-docx.

- Copy only: --source PATH --output PATH
- One exact-text revision: --source PATH --output PATH --old TEXT --new TEXT

Copying preserves the document byte-for-byte.
Exact-text revision requires a unique match within one Word text run.
If that restriction is not met, stop rather than rebuilding the CV.

Always preserve the approved source and use a separate output path.
Verify factual changes against the primary career evidence.
Do not claim that structural checks establish identical visual pagination.
Do not invoke Microsoft Word COM automation, a new evaluation, or
the application pipeline for this operation.