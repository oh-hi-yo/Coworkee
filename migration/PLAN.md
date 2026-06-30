# Coworkee Migration Plan

ExtJS (Coworkee) → 現代化全端重寫

- **來源 (reference)**：`C:\workspace\Coworkee`（本 repo，唯讀參考，不改動 client/server 原始碼）
- **目標前端**：`coworkee-web` — Next.js 16 (App Router) + React 19 + Ant Design 5 + TanStack Query 5 + React Hook Form + Zod + NextAuth (Auth.js v5, OIDC)
- **目標後端**：`coworkee-api` — Spring Boot 3 + JDK 17 + PostgreSQL + Flyway + Spring Data JPA + Spring Security Resource Server (JWT)
- **認證服務**：Keycloak（docker-compose），前端 NextAuth 走 OIDC，後端驗證 Keycloak 發的 JWT
- **策略**：Strangler-fig，一次一個垂直切片。Pilot = 員工清單 + 員工詳情（read）

> 原則：這不是語法翻譯。Coworkee 把商業規則藏在 model 的 `calculate`、override 的 `dateDiff`、grid renderer/template、store listener、validator、server 的 Sequelize hook 裡。翻譯時這些「魔法」一條都不能掉。每條規則編號 BR-xx，對應到一條 before/after 測試。

---

## 目標架構對照

| 關注點 | ExtJS (現況) | 目標 |
|---|---|---|
| 框架 | ExtJS 6 universal app (classic+modern, 3 profiles) | Next.js 16 App Router + React 19 |
| UI 元件 | Ext.grid / Ext.Panel / dataview / form fields | Ant Design 5 (Table / Descriptions / Form / Select) |
| Server state | `Ext.data.Store` + `Ext.direct` proxy | TanStack Query 5（useQuery / useMutation）|
| 表單 | Wizard + field validators | React Hook Form + Zod |
| 路由 | `Ext.app.route` token（`person/{id}`）| Next.js route segments |
| 後端 | Node.js + Ext.Direct RPC + Sequelize + SQLite | Spring Boot 3 REST + JPA + PostgreSQL |
| 認證 | 自製 JWT（Person username/password）| Keycloak (OIDC) + NextAuth + Spring Security |
| 派生欄位/格式 | model `calculate`、`Ext.util.Format` override | `src/domain/**` 純 TypeScript 函式 |

---

## 後端 REST API 設計（取代 Ext.Direct）

Ext.Direct 是 RPC（`Server.people.list(params)`），回傳信封 `{ data, total }`。改成 REST：

| ExtJS Direct | REST |
|---|---|
| `Server.people.list(params)` | `GET /api/people?page=&size=&sort=&search=&office_id=&organization_id=` |
| `Server.people.get(id)` | `GET /api/people/{idOrUsernameOrEmail}` |
| `Server.people.insert(params)` | `POST /api/people` |
| `Server.people.update(params)` | `PUT /api/people/{id}` |
| `Server.people.remove` | （原本就是 notImplemented，保留 405/501）|
| `Server.people.filters(params)` | `GET /api/people/filters?field=office_id&label=office.name` |
| `Server.people.generateUsername` | `GET /api/people/generate-username?firstname=&lastname=` |
| `Server.auth.user` | `GET /api/me`（從 JWT 取得）|
| `Server.offices/organizations/events.*` | `GET /api/offices`、`/api/organizations`、`/api/actions` |

- 清單回傳維持 `{ data: [...], total: N }`（前端 anti-corruption layer 吸收）。
- `picture` 欄位由後端輸出**絕對 URL**（對應原本 Sequelize getter `apiUrl + picture`）。
- 寫入欄位 whitelist（對應 `writableFields`），防 mass-assignment。

---

## 認證模型（已定案：方案 A）

原本 Person 同時是「目錄資料」與「登入帳號（username/password）」。接 Keycloak 後**拆開**：

- **Keycloak 負責登入**，建幾個 seed demo 使用者（如 `admin`、`viewer`）。
- **Person 目錄純資料**，API/entity **拿掉 password 欄位**（不再輸出/接收）。
- 寫入權限改用 **Keycloak role + Spring Security `@PreAuthorize`** 控管（取代原本 `readonly` demo 模式 — 已移除）。
- 前端 NextAuth (Auth.js v5) 走 OIDC authorization code flow，token 帶到後端由 Resource Server 驗證。

---

## 分階段交付

1. **Phase 1 — 盤點**（本文件 + `inventory/person.md`）→ 你 review
2. **Phase 2 — 後端**：Spring Boot 骨架、JPA entities、Flyway seed、Person REST API、JWT 驗證、JUnit
3. **Phase 3 — 前端骨架**：Next.js + AntD + TanStack Query、NextAuth OIDC、anti-corruption API layer、`domain/` 純函式 + 單元測試
4. **Phase 4 — Pilot 畫面**：員工清單 + 詳情，before/after parity 測試對齊 BR
5. **Phase 5 — Keycloak 整合**：docker-compose（Keycloak + Postgres）、realm/client/users、端到端串通
6. **Sign-off 後** → 複製此模式做 office / organization / history / create-edit wizard 等其餘切片

---

## Pilot 範圍（已定案：list + detail + create/edit Wizard）

- **員工清單**：AntD Table，遠端分頁/排序（預設 lastname）/篩選（office、organization、search），首字母分組
- **員工詳情**：基本資料（含條件顯示 phone/extension/skype/linkedin）、生日 + 年齡（dateDiff）、到職/離職 + 年資、history（該員工的 actions）、coworkers（同 organization）
- **新增/編輯 Wizard**：三步驟表單（General / Personal / Work），含 username 自動產生（BR-21）、密碼確認（→ 改為 Keycloak，故 pilot Wizard 不含密碼欄）、必填驗證（BR-18~20，Zod）、office/organization 下拉

## 種子資料與決定

- 沿用 `server/data/People.json`、`Offices.json`、`Organizations.json`，轉成 Flyway migration（`V2__seed.sql`）。
- 頭像（`server/public/api/portraits/**`）複製到 `coworkee-api` 由 Spring Boot 靜態服務；`picture` 欄位輸出絕對 URL（對應 BR + Sequelize getter）。
- 完整決定記錄見 `migration/skills/extjs-coworkee-revamp/references/decision-log.md`。
