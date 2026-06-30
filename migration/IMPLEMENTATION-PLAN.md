# 實作計劃（動工後）— 展開版

承接 `PLAN.md`（架構/決定）與 `inventory/person.md`（BR-01~21）。本文件把每個 phase
拆成可在 Claude Code 直接執行的具體交付物、檔案結構、API 規格、測試對照與驗收標準。

決定回顧（定案）：REST、兩 repo、Keycloak 管登入(Person 去除 password)、開放寫入用
role 控管、pilot 含 list+detail+create/edit Wizard、沿用 JSON 種子 + 後端服務頭像。

執行順序：**Phase 2 後端 → Phase 3 前端骨架 → Phase 5 Keycloak（提前，因前後端認證都要
它）→ Phase 4 pilot 畫面 → 驗收**。每個 sub-task 完成即更新 skill 的 references。

---

## 驗收閘門（每個 phase 強制，缺一不可）

**任何 phase 未全數通過下列項目，不得標記完成、不得進入下一個 phase。** 全部在
**你的本機**執行（沙箱 JDK 11 無法 build 後端）。

| # | 閘門 | 後端 `coworkee-api` | 前端 `coworkee-web` |
|---|---|---|---|
| G1 | 本機 build 通過 | `./mvnw clean verify`（含 compile + test）| `npm run build` 必須成功 |
| G2 | 單元測試通過 | JUnit（`./mvnw test`）全綠 | Vitest（`npm run test`）全綠 |
| G3 | **Playwright e2e 通過** | Playwright **API tests**（`request` fixture 打 REST）| Playwright **UI e2e**（瀏覽器流程）|

- **Playwright 是唯一指定的 e2e 工具**，從 Phase 2 就開始用（後端以 Playwright 的
  API request context 寫端點 e2e；前端用瀏覽器 e2e）。
- e2e 放在各 repo 的 `e2e/` 目錄；前端 e2e 需要後端 + Keycloak 已啟動（用 Playwright
  `webServer` 或啟動腳本）。
- 每個 phase 的「驗收標準」段落 = G1+G2+G3 + 該 phase 專屬情境。
- 建議在各 repo 加一條 `verify` 腳本一鍵跑完三關，並（之後）接上 CI。
- BR 對照矩陣中每條規則最終都要被某個 unit 或 Playwright 測試覆蓋。

---

## Phase 2 — 後端 `coworkee-api`

### 2.1 專案初始化
Spring Boot **3.3.x（最新 3.x）/ Java 17**，Maven wrapper。依賴：
Spring Web、Spring Data JPA、Validation、Flyway、PostgreSQL Driver、
OAuth2 Resource Server、Lombok、Testcontainers(test)、Spring Boot Test。

### 2.2 套件結構
```
com.coworkee.api
├─ CoworkeeApiApplication.java
├─ config/         SecurityConfig, WebConfig(static portraits, CORS)
├─ person/         Person(entity), PersonRepository, PersonService,
│                  PersonController, dto/(PersonDto, PersonListItemDto,
│                  CreatePersonRequest, UpdatePersonRequest), PersonMapper
├─ office/         Office(entity), repo, controller, dto
├─ organization/   Organization(entity), repo, controller, dto
├─ action/         Action(entity), repo, controller, dto
├─ common/         ApiEnvelope<T>{data,total}, PageQuery, GlobalExceptionHandler
└─ me/             MeController (GET /api/me from JWT)
```

### 2.3 Entities（對應 inventory 資料模型）
- **Person**：`id UUID`, email(unique,@Email), username(unique,@Size≥6), firstname,
  lastname, title, phone, extension, skype, linkedin, picture, birthday(LocalDate),
  started(LocalDate), ended(LocalDate)。`@ManyToOne` office、organization；
  `@OneToMany` actions。**無 password 欄**（ADR-004）。
- **Office**：id, name, address…（依 `data/Offices.json`）。
- **Organization**：id, name, manager(`@ManyToOne` Person)。
- **Action**：id, type, subject, recipient(`@ManyToOne` Person), created。

### 2.4 Flyway
- `V1__schema.sql`：建表 + FK + unique 約束。
- `V2__seed.sql`：由 `Coworkee/server/data/{People,Offices,Organizations}.json`
  轉成 INSERT（保留原 UUID/關聯）。頭像檔複製到
  `src/main/resources/static/api/portraits/**`。
- 隨機關聯：原本 `data.js` 啟動時隨機指派 office/org/manager/recipient；種子改為
  **固定**指派（migration 內寫死），讓資料可重現、測試穩定。

### 2.5 DTO 與 picture URL
- `picture` 輸出絕對 URL：`APP_PORTRAITS_BASE_URL + "/api/portraits/..."`（對應原
  Sequelize getter）。在 `PersonMapper` 處理。
- 寫入只接受 whitelist 欄位（`CreatePersonRequest`/`UpdatePersonRequest`），對應原
  `writableFields`，防 mass-assignment。

### 2.6 REST endpoints
| Method | Path | 說明 | BR |
|---|---|---|---|
| GET | `/api/people` | 分頁/排序(預設 lastname)/篩選(office_id, organization_id)/search | BR-09/11/12 |
| GET | `/api/people/{key}` | key 比對 id ∨ username ∨ email | BR-04 |
| POST | `/api/people` | 新增（需 write role）| BR-18 |
| PUT | `/api/people/{id}` | 編輯（需 write role）| BR-18 |
| GET | `/api/people/filters?field=&label=` | distinct 篩選選項 | BR-11 |
| GET | `/api/people/generate-username?firstname=&lastname=` | latinize+dedupe | BR-21 |
| GET | `/api/offices` / `/api/organizations` | 下拉/篩選來源 | |
| GET | `/api/actions?recipient_id=` | 員工 history | BR-14 |
| GET | `/api/me` | 由 JWT 取得目前使用者 | |

- 清單回傳 `{ "data": [...], "total": N }`（envelope 保留，前端 ACL 解包）。
- 搜尋欄位：email, firstname, lastname, title, phone, extension, skype, linkedin。

### 2.7 安全（Resource Server）
- `SecurityConfig`：`oauth2ResourceServer().jwt()`，issuer = Keycloak realm。
- 從 Keycloak token 的 `realm_access.roles` 對映成 `ROLE_*`（自訂 converter）。
- 讀取端點放行給已認證使用者；寫入端點 `@PreAuthorize("hasRole('coworkee-admin')")`。
- CORS 允許 `http://localhost:3000`。

### 2.8 測試（JUnit + Testcontainers Postgres）
- `generateUsername`：latinize/小寫/底線/數字後綴 dedupe（含撞名情境）→ BR-21。
- `GET /api/people/{key}`：id、username、email 三種都能查到同一人 → BR-04。
- 清單分頁/排序(lastname)/篩選/search → BR-09/11/12。
- picture 輸出為絕對 URL。
- 寫入端點未帶 admin role → 403；帶 admin → 201/200。
- 必填驗證（Bean Validation）→ 400 → BR-18。

### 2.9 驗收標準（G1+G2+G3）
- **G1**：`./mvnw clean verify` 成功（compile + 測試）。
- **G2**：JUnit 全綠（含 2.8 的 BR 測試）。
- **G3 Playwright API e2e**（`coworkee-api/e2e/`，對啟動中的後端 + Keycloak）：
  - 取 Keycloak token → `GET /api/people` 回傳種子資料、分頁/排序/篩選/search 正確
  - `GET /api/people/{key}` 用 id/username/email 皆命中同一人（BR-04）
  - admin token 可 `POST`/`PUT`；viewer token 寫入得 403
  - `generate-username` 撞名情境正確（BR-21）
- 三關全綠才算 Phase 2 完成。

---

## Phase 3 — 前端 `coworkee-web` 骨架 + 資料層 + 認證

### 3.1 初始化
`create-next-app`（App Router、TypeScript、ESLint）。依賴：
`antd`、`@ant-design/nextjs-registry`、`@tanstack/react-query`、
`react-hook-form`、`zod`、`@hookform/resolvers`、`next-auth@beta`(v5)、`dayjs`。
測試：`vitest`、`@testing-library/react`、`msw`、`@playwright/test`。

### 3.2 結構
```
coworkee-web/src
├─ app/
│  ├─ layout.tsx (AntD registry + Providers)
│  ├─ (auth)/...                NextAuth 頁
│  ├─ people/page.tsx           員工清單
│  ├─ people/[key]/page.tsx     員工詳情
│  └─ people/[key]/edit, people/new   Wizard
├─ domain/                      純函式 + 單元測試（無 React 依賴）
│  ├─ person/derive.ts          fullName(BR-02), personPath(BR-01)
│  ├─ person/contact.ts         tel/skype/mailto/linkedin URI (BR-05~08)
│  ├─ format/dateDiff.ts        人類可讀時間差 (BR-15, 高風險)
│  └─ format/actionIcon.ts      (BR-16)
├─ api/                         anti-corruption layer
│  ├─ http.ts                   fetch 包裝（帶 token、解 envelope）
│  ├─ schemas.ts                Zod: Person, Office, Organization, Action
│  └─ people.ts                 listPeople/getPerson/createPerson/... (P4)
├─ lib/                         queryClient, auth helpers
└─ components/                  共用 UI
```

### 3.3 domain 純函式（先寫 + Vitest，定義「正確」）
- `dateDiff.ts`：**完全複製** ExtJS 門檻階梯與複數化（BR-15）；先寫
  characterization 測試 pin 住現有行為，再用於詳情頁。
- `derive.ts`/`contact.ts`：BR-01/02/05~08，table-driven 測試含空值邊界。
- 日期一律以 `YYYY-MM-DD` 字串處理，不轉本地時區（BR-03）。

### 3.4 API 層（解包 + Zod）
- `http.ts`：附 NextAuth token、`{data,total}` 解包、錯誤信封處理。
- `people.ts`：每個後端端點一個 typed function，回傳乾淨 `Person`。
- TanStack Query：`queryOptions` factory，key 含 page/sort/filter/search（P7）。

### 3.5 認證（NextAuth v5 OIDC）
- `auth.ts`：Keycloak provider（issuer/client/secret）。
- `middleware.ts`：未登入導向登入。
- access token 注入 API 請求（`http.ts` 讀 session token）。
- 角色從 token 取出，前端依 role 顯示/隱藏「新增/編輯」。

### 3.6 驗收標準（G1+G2+G3）
- **G1**：`npm run build` 成功（type-check 通過）。
- **G2**：Vitest 全綠 — domain 純函式 parity（dateDiff BR-15、derive/contact BR-01/02/05~08）。
- **G3 Playwright UI e2e**（`coworkee-web/e2e/`）：app 啟動 smoke test — 未登入導向
  Keycloak 登入頁；登入後清單頁能打到後端取得資料並渲染（依賴 Phase 2 後端 +
  Phase 5 Keycloak 已起，用 Playwright `webServer` 編排）。
- 三關全綠才算 Phase 3 完成。

---

## Phase 5 — Keycloak realm + docker-compose（提前到 Phase 4 之前）

### 5.1 交付物
- `coworkee-api/docker-compose.yml`：postgres:16 + keycloak:26（見 ENVIRONMENT.md）。
- `coworkee-api/keycloak/realm-coworkee.json`：realm 匯出，含
  - client `coworkee-web`（confidential、redirect `http://localhost:3000/*`）
  - roles：`coworkee-admin`、`coworkee-viewer`
  - 種子 users：`admin`(admin role)、`viewer`(viewer role)，預設密碼
  - 把 realm roles 放進 token（mapper）
### 5.2 串接
- 後端 `issuer-uri` 指向 realm；role converter 映射。
- 前端 `.env.local` 填 client id/secret。
### 5.3 驗收（G1+G2+G3）
- **G1**：前後端在接上 Keycloak 後 `./mvnw clean verify` 與 `npm run build` 仍成功。
- **G2**：既有單元測試不退化（全綠）。
- **G3 Playwright e2e**：`docker compose up -d` 後，Playwright 跑完整登入流程 —
  admin 登入 → 可見新增/編輯；viewer 登入 → 寫入按鈕隱藏且後端 `POST/PUT` 回 403。
- 三關全綠才算 Phase 5 完成。

---

## Phase 4 — Pilot 畫面 + parity 測試

### 4.1 員工清單 `app/people/page.tsx`
- AntD `Table`：欄位 fullname/title/office/organization/phone；遠端分頁/排序
  (預設 lastname)/篩選(office、organization、search)；首字母分組（BR-10）；
  search debounce 500ms（BR-13）；篩選同步到 URL searchParams（BR-12）。
- 點列 → `personPath()` 導到詳情（BR-01）。

### 4.2 員工詳情 `app/people/[key]/page.tsx`
- AntD `Descriptions`/`Card`：條件顯示 phone/extension/skype/linkedin（BR-17）；
  生日 `F jS, Y` + 年齡 dateDiff；到職日；有離職日則顯示離職 + 年資
  `dateDiff(started, ended)`（BR-15/17）。
- 聯絡按鈕呼叫 contact 純函式（BR-05~08）。
- history（`/api/actions?recipient_id`）+ coworkers（同 org、排除自己）兩個
  dependent query（BR-14）。

### 4.3 新增/編輯 Wizard `app/people/new`、`app/people/[key]/edit`
- AntD `Steps`（General / Personal / Work）+ React Hook Form + Zod。
- 必填驗證（BR-18，Zod）；**無密碼欄**（ADR-004，BR-19/20 不適用）。
- username 自動產生：離開姓名欄呼叫 `/api/people/generate-username`，但使用者手動改過
  就不覆寫（保留 `_generatedUsername` 語意，BR-21）→ `useGenerateUsername` hook。
- office/organization `Select`（選項來自 query）。
- 送出 → `useMutation` → 成功後 invalidate 清單 query。

### 4.4 測試與 BR 對照矩陣
| 種類 | 工具 | 覆蓋 |
|---|---|---|
| 純函式 parity | Vitest | BR-01,02,03,05,06,07,08,15,16,21 |
| 元件 | RTL + MSW | 清單渲染/分組/篩選(BR-09~13)、詳情條件顯示(BR-17)、Wizard 驗證(BR-18)、username 自動產生(BR-21) |
| 工作流 | RTL + MSW | 詳情 history/coworkers 載入(BR-14) |
| E2E | Playwright | 登入→清單篩選→開詳情→編輯→存檔→清單更新 |
- 覆蓋閘門：inventory 每條 BR 至少對應一個測試（BR-19/20 標記 N/A 並註明原因）。

### 4.5 驗收標準（Pilot Definition of Done，G1+G2+G3 + 情境）
- **G1**：後端 `./mvnw clean verify` 成功；前端 `npm run build` 成功。
- **G2**：後端 JUnit + 前端 Vitest（含全部 parity 測試）全綠。
- **G3 Playwright e2e**（關鍵旅程，全綠）：
  1. 登入 → 清單分頁/排序(lastname)/篩選(office、org)/搜尋/首字母分組與 ExtJS 一致
  2. 開詳情 → 年齡/年資數字與 ExtJS `dateDiff` 一致；條件顯示欄位正確；history/coworkers 載入
  3. 新增員工 → username 自動產生（手動改過不覆寫）→ 存檔 → 清單出現新員工
  4. 編輯員工 → 存檔 → 清單反映更新
  5. admin 能寫、viewer 寫入得 403 且 UI 隱藏寫入
- **其他**：BR 對照矩陣無孤兒（BR-19/20 標 N/A 並註明原因）；skill 四份 reference
  已更新到對應 phase。
- 上述全數通過才算 Pilot 完成、可 sign-off。

---

## 切到 Claude Code 後的執行清單（給未來 session）

1. 讀 `migration/skills/extjs-coworkee-revamp/SKILL.md` 與四份 references。
2. 依序 Phase 2 → 3 → 5 → 4，每個 sub-task 完成即：跑測試 → 更新對應 reference →
   commit（建議 commit message 帶 BR/ADR 編號）。
3. 任何遇到 inventory 未涵蓋的「魔法」→ 先補 `inventory/person.md` 的 BR，再實作。
4. 擴展到 office/organization/history 時，重跑同一套流程並 append references。
