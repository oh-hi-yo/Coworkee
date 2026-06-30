# Business-Logic Port Patterns ("魔法" → 純函式)

Recurring ExtJS patterns and exactly how each is re-platformed. Each links to a `BR-xx`
in `migration/inventory/person.md` and must have a before/after test.

## P1 — model `calculate` field → pure function
ExtJS: `{ name:'fullname', calculate: d => d.firstname+' '+d.lastname }` (BR-02),
`url` (BR-01).
Port: `coworkee-web/src/domain/person/derive.ts` → `fullName(p)`, `personPath(p)`.
Test: table-driven, include empty/missing name parts.

## P2 — `Ext.util.Format.dateDiff` override → `domain/format/dateDiff.ts` (HIGH RISK)
ExtJS override (BR-15): auto-selects unit (ms→y by thresholds) and pluralizes via
`Ext.util.Format.plural`. Used for birthday age and tenure (BR-17).
Port: replicate threshold ladder and pluralization EXACTLY; pin with characterization
tests BEFORE writing the React detail page. Do not "improve" the thresholds.

## P3 — date fields `Y-m-d` DATEONLY → ISO string, no TZ (BR-03)
Keep birthday/started/ended as `YYYY-MM-DD` strings end-to-end; never `new Date()` them
into local time (would shift the day). Zod: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`.

## P4 — Ext.Direct envelope → anti-corruption layer (BR-09, reader config)
Backend returns `{ data, total }`; `src/api/people.ts` unwraps + `PersonSchema.parse`.
Components only ever see clean typed `Person`. Keeps envelope quirks out of UI.

## P5 — id/username/email lookup quirk → backend, drop phantom hack (BR-04)
ExtJS used a phantom-record trick because `list` matched id OR username OR email.
Port: `GET /api/people/{key}` resolves all three server-side; frontend just calls it.

## P6 — `generateUsername` → service + hook (BR-21)
Rule: `latinize(first + '.' + last)` → non-alphanumeric → `_` → lowercase; if taken,
append smallest free numeric suffix. Stateful UX: auto-fill on name blur, but never
overwrite a value the user typed manually (`_generatedUsername` flag).
Port: backend `GET /api/people/generate-username`; web `useGenerateUsername` hook that
preserves the "manual edit wins" semantics.

## P7 — remoteFilter/Sort + buffered listener → query key + debounce (BR-09/12/13)
Filters/sort/search live in the TanStack Query key; debounce input 500ms before the key
changes. Backend does the actual filtering/sorting/paging.

## P8 — ViewController workflow → dependent queries (BR-14)
`onRecordChange` loaded history (actions by `recipient_id`) and coworkers (same
`organizationId`, `id != current`). Port: two `useQuery` calls keyed by `personId` and
`organizationId`, enabled once the person is loaded.

## P9 — contact URIs → pure functions (BR-05~08)
`tel:` (+`;ext=` per RFC3966), `skype:{username}?call`, `mailto:`, LinkedIn URL.
Port: `domain/person/contact.ts`; buttons call these. Test edge cases (empty phone/ext).

## P10 — field/validation overrides → Zod + AntD form rules (BR-18, BR-19/20 N/A)
Required set (BR-18) → Zod schema. Password rules (BR-19/20) are N/A under Keycloak
(ADR-004). `requiredMessage` "This field is required" preserved as default message.

## P11 — list grouping (lastname[0]) → pure fn + injected header rows (BR-10)
`domain/person/grouping.ts` `groupByLastInitial` returns ordered `{letter, items}` from
the lastname-sorted backend result; the list page injects synthetic group-header rows into
the AntD Table (first cell `colSpan=COLS`, others `colSpan:0`).

## BR coverage matrix (no orphan rules)

| BR | Rule | Covered by |
|---|---|---|
| BR-01 | personPath | web `derive.test.ts`; backend `url` field |
| BR-02 | fullName | web `derive.test.ts`; backend `PersonApiIntegrationTest` |
| BR-03 | dates no TZ | web `date.test.ts` (parseLocalDate), Zod `isoDate`; e2e detail format |
| BR-04 | id∨username∨email | backend `PersonApiIntegrationTest` + API e2e; web `getPerson` |
| BR-05~08 | contact URIs | web `contact.test.ts`; detail page buttons |
| BR-09 | paging/sort(lastname) | backend integration + API e2e; pilot e2e list |
| BR-10 | A-Z grouping | web `grouping.test.ts`; pilot e2e list groups |
| BR-11 | distinct filters | backend integration (filters) + list UI; pilot e2e |
| BR-12 | filters in URL | list page searchParams sync; pilot e2e search |
| BR-13 | debounce 500ms | list page; pilot e2e search |
| BR-14 | history + coworkers | detail page dependent queries; pilot e2e detail |
| BR-15 | dateDiff | web `dateDiff.test.ts` (exhaustive, incl. leap-day); e2e detail age/tenure |
| BR-16 | actionIcon | web `actionIcon.test.ts` |
| BR-17 | conditional + F jS,Y | web `date.test.ts`; detail page; e2e detail |
| BR-18 | required validation | backend integration (400); web `personForm` schema; pilot e2e wizard |
| BR-19/20 | password rules | **N/A** (ADR-004 — Person has no password) |
| BR-21 | generateUsername | backend `UsernameGeneratorTest` + integration + API e2e; pilot e2e (auto + manual-wins) |
