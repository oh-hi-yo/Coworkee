# Component & Construct Mapping: ExtJS → React/AntD/Spring

Consult this before writing any component. Append rows as new constructs appear.

## UI components

| ExtJS construct | Target (React + Ant Design 5) | Notes |
|---|---|---|
| `Ext.grid.Panel` / dataview list | headless data + **AntD `Table`** | columns from domain; server-side paging/sort/filter |
| grid column `renderer` | pure fn in `domain/` + `render` in column def | renderer = business rule, never drop it (BR-15/16/17) |
| list `grouper` (lastname[0]) | client grouping / group header rows | BR-10 |
| `Ext.Panel` (detail) + `tpl` | **AntD `Descriptions` / `Card`** | template conditionals → JSX conditionals (BR-17) |
| `Ext.form` Wizard (multi-screen) | **AntD `Steps` + `Form`** + RHF | one step per screen (BR-18) |
| `textfield/emailfield/datepickerfield` | AntD `Input`/`Input`+rule/`DatePicker` | Zod owns validation |
| `combobox` (local, forceSelection) | AntD `Select` (options from query) | office/organization pickers |
| `passwordfield` / confirm | — (removed) | auth moved to Keycloak (decision A) |
| `Ext.MessageBox` / confirm | AntD `Modal.confirm` / `App.useApp()` | |
| `Ext.LoadMask` | AntD `Spin` / Table `loading` | override set empty message (cosmetic) |
| swipe actions (listswiper) | AntD `Table` row actions / `Dropdown` | mobile profile dropped in pilot |

## State & data

| ExtJS | Target | Notes |
|---|---|---|
| `Ext.data.Model` | TS type + Zod schema | password removed (decision A) |
| model `calculate` field | pure fn in `domain/person/` | `fullname` (BR-02), `url` (BR-01) |
| model field `type:'date', dateFormat:'Y-m-d'` | keep as ISO date string | no TZ conversion (BR-03) |
| `Ext.data.Store` (remote) | **TanStack `useQuery`** + queryOptions | key includes page/sort/filter (BR-09) |
| `store.filter/sort` (remoteFilter/Sort) | params in query key → backend | BR-09/11/12 |
| buffered filter listener (500ms) | debounce 500ms before query | BR-13 |
| `store.sync()` / writer | **`useMutation`** + invalidate | create/edit |
| ViewModel `stores`/`data`/`bind` | component state + query data | server data is NOT global app state |
| ViewController listeners (workflow) | event handlers / dependent queries | onRecordChange → 2 queries (BR-14) |
| `redirectTo(record)` routing | Next.js `useRouter().push(personPath())` | BR-01 |

## Backend (Ext.Direct + Sequelize → Spring Boot)

| ExtJS / Node | Target (Spring Boot 3) | Notes |
|---|---|---|
| Ext.Direct RPC method | `@RestController` endpoint | see PLAN API table |
| reader `rootProperty:'data'` + `total` | response DTO `{ data, total }` | envelope kept; web ACL unwraps |
| Sequelize model | JPA `@Entity` | UUID id |
| Sequelize `scope('nested')` | JPA fetch join / DTO projection | office + organization included |
| Sequelize getter (`apiUrl + picture`) | DTO maps to absolute URL | BR + static portrait serving |
| `writableFields` whitelist | request DTO (only writable fields) | mass-assignment guard |
| validations (isEmail, len, notEmpty) | Bean Validation (`@Email`,`@Size`,`@NotBlank`) | BR-18 |
| `session.readonly` rollback | removed → `@PreAuthorize` by role | decision Q2 |
| JWT (jsonwebtoken) verify | Spring Security Resource Server (Keycloak) | decision Q1 |
| `data.reset()` seed + hourly cron | Flyway `V2__seed.sql` | from the 3 JSON files (Q4) |
| `generateUsername` | service method / REST endpoint | latinize+dedupe (BR-21) |
| `Person.lookup(id|username|email)` | repository query on 3 columns | BR-04 |
