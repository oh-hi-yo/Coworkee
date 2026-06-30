# Migration Inventory: Person 模組

掃描範圍：`client/app/{model,store,view/person,view/widgets,overrides}` + `server/{api,models,utils}`。

## 商業規則 (Business Rules)

| # | 位置 | 種類 | 規則（白話）| 為什麼存在 | React/Spring 目標家 |
|---|---|---|---|---|---|
| BR-01 | model/Base.js `url` calculate | 派生欄位 | `url = "{entityName 小寫}/{id}"`，用於路由與連結 | ExtJS 路由 token | `domain/person/links.ts` `personPath()` |
| BR-02 | model/Person.js `fullname` calculate | 派生欄位 | `fullname = firstname + ' ' + lastname` | 顯示 | 純函式 `fullName()` |
| BR-03 | model/Person.js 日期欄位 | 資料格式 | birthday/started/ended 用 `Y-m-d`（DATEONLY，無時區）| 避免時區位移 | Zod `z.string().date()`，前端不轉 Date 時區 |
| BR-04 | model/Person.js statics.load | API 合約怪癖 | 用 phantom record 先建再以 id 查，因 server `list` 對 id 會同時比對 id/username/email，回傳 id 可能不同 | server lookup 行為 | `GET /api/people/{key}` 後端比對三欄；前端不做 phantom hack |
| BR-05 | model/Person.js phoneCall | 外部動作 | 撥號 URI：`tel:{phone}` 若有分機加 `;ext={extension}`（RFC3966）| 行動裝置撥號 | `domain/person/contact.ts` `telUri()` |
| BR-06 | model/Person.js skypeCall | 外部動作 | `skype:{username}?call` | Skype | `skypeUri()` |
| BR-07 | model/Person.js mailTo | 外部動作 | `mailto:{email}` | 寄信 | `mailtoUri()` |
| BR-08 | model/Person.js linkedIn | 外部動作 | `http://www.linkedin.com/in/{username}`，開新分頁 | LinkedIn | `linkedinUrl()` |
| BR-09 | store/People.js | 清單行為 | remoteFilter + remoteSort，預設排序 `lastname` | 大量資料伺服器端處理 | TanStack Query key 含 sort/filter，後端排序 |
| BR-10 | view/person/BrowseModel.js grouper | 清單分組 | 依 `lastname[0]`（姓氏首字母）分組 | A-Z 目錄 | AntD Table 前端分組 / group header |
| BR-11 | BrowseModel.js offices/organizations | 篩選來源 | 篩選選項來自 `people` service 的 `office_id`/`organization_id` distinct 值，label 取 `office.name`/`organization.name` | 動態篩選清單 | `GET /api/people/filters` |
| BR-12 | widgets/BrowseController.onRouteChange | 路由→篩選 | route 內 `field/value` 配對轉成 filter；`search` 為特殊欄位 | 可分享的篩選 URL | Next.js searchParams → query key |
| BR-13 | widgets/BrowseController.initViewModel | 效能 | 篩選變更 buffered 500ms 才送出 | 避免狂打 API | debounce 500ms |
| BR-14 | view/person/ShowController.onRecordChange | 工作流 | 選定員工後：載入 history（actions filter `recipient_id`）+ coworkers（同 `organizationId` 且 `id != 當前`）| 詳情頁關聯資料 | 詳情頁兩個 useQuery（依 personId / organizationId）|
| BR-15 | overrides/util/Format.js dateDiff | 格式/商業 | 自訂人類可讀時間差，auto 單位（ms→y）+ 複數化 | 生日年齡、年資顯示 | `domain/format/dateDiff.ts` 純函式（**高風險，先 pin 測試**）|
| BR-16 | overrides/util/Format.js actionIconCls | 格式 | type→icon 對應（profile→user、email→envelope、skype/linkedin→x-fab）| icon 顯示 | `domain/format/actionIcon.ts` |
| BR-17 | view/person/ShowDetails.js tpl | 顯示規則 | 條件顯示 phone/extension/skype/linkedin；生日 `F jS, Y` + dateDiff；到職日；若有離職日顯示離職 + 年資 `dateDiff(started, ended)` | 履歷顯示 | AntD Descriptions + domain 函式 |
| BR-18 | view/person/Wizard.js | 表單驗證 | 必填：firstname, lastname, username, birthday, email, phone, title, started, office, organization | 資料完整性 | Zod schema |
| BR-19 | Wizard.js password | 表單驗證 | password 僅在新增(phantom)時必填；編輯時空白=不變，placeholder「Keep password unchanged」 | 編輯不強制改密碼 | Zod 條件式 + 後端空白略過 |
| BR-20 | Wizard.js password_check / doPasswordMatch | 表單驗證 | 確認密碼需與 password 相同；password 有值前 disabled | 防打錯 | RHF `refine` 比對 |
| BR-21 | WizardController.onNameFieldsBlur / onUsernameChange | 表單行為 | 離開姓名欄自動產生 username；若使用者手動改過 username 就不覆蓋（`_generatedUsername` 狀態旗標）| UX 便利 | `useGenerateUsername` hook，保留「手動則不覆寫」語意 |

## API 合約（來自 server/api/people.js + models/person.js）

- **傳輸**：Ext.Direct RPC，namespace `Server.people`，信封 `{ data, total }`，reader `rootProperty: 'data'`、`messageProperty: 'message'`。
- **Person 欄位**：`id`(UUID v4), email(必填,唯一,Email), username(必填,唯一,len≥6), password(必填,輸出排除), firstname, lastname(必填), title, phone, extension, skype, linkedin, picture(輸出加 apiUrl 前綴), birthday(DATEONLY 必填), started, ended。
- **關聯**：belongsTo Office、Organization；hasMany Action。`nested` scope 一併帶出 office + organization 並排除 password。
- **writableFields whitelist**：email, username, password, firstname, lastname, title, phone, extension, skype, linkedin, picture, birthday, started, ended, office_id, organization_id。
- **searchable 欄位**（驅動 search/filter）：email, firstname, lastname, title, phone, extension, skype, linkedin。
- **insert/update** 在 transaction 內；若 `session.readonly` 則丟錯 → rollback（demo 防寫）。
- **update**：password 為 null/'' → 刪除該欄（保持不變）。
- **remove** → notImplemented。
- **generateUsername**：`latinize(first + '.' + last)` → 非英數轉 `_` → 小寫；若已存在則找最小可用數字後綴。
- **Auth（將被 Keycloak 取代）**：login 比對 username/email + **明碼** password；JWT 簽 `user_id`，`expiresIn` 86400s；verify Bearer token。
- **資料**：SQLite，啟動時與每小時 cron `data.reset()` 用 JSON 種子重建，關聯隨機指派。

## Open Questions（已定案）

- **Q1 認證模型** → 方案 A：Keycloak 管登入 + seed users；Person 目錄拿掉 password。BR-19/BR-20（密碼必填、確認密碼）在目標**不適用於 Person**（登入交給 Keycloak），pilot Wizard 不含密碼欄。
- **Q2 readonly demo 模式** → 移除；改用 Keycloak role + `@PreAuthorize` 控管寫入。
- **Q3 Pilot 範圍** → 含 create/edit Wizard（BR-18、BR-21 仍要做；BR-19/20 因 Q1 不適用）。
- **Q4 資料種子** → 沿用 Coworkee 三個 JSON 種子轉 Flyway；頭像由後端靜態服務，`picture` 輸出絕對 URL。
