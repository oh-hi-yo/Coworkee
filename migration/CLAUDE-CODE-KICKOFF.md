# Claude Code 開工 Prompt

把下面整段貼給 Claude Code（在 `C:\workspace` 開啟）。

---

你要接手一個 ExtJS（Coworkee 員工目錄）→ 現代化全端的遷移專案。工作母資料夾是
`C:\workspace`。請嚴格依既有文件執行，不要自行更改架構決定。

## 第一步：讀文件（先讀完再動作）
1. `C:\workspace\Coworkee\migration\skills\extjs-coworkee-revamp\SKILL.md` 及其
   `references\` 下四份（component-mapping、decision-log、business-logic-patterns、
   skills-and-tools）— 這是本專案的 playbook 與決定記錄，請遵循。
2. `C:\workspace\Coworkee\migration\PLAN.md`（架構與定案）
3. `C:\workspace\Coworkee\migration\ENVIRONMENT.md`（環境設置）
4. `C:\workspace\Coworkee\migration\IMPLEMENTATION-PLAN.md`（展開實作 + 驗收閘門）
5. `C:\workspace\Coworkee\migration\inventory\person.md`（BR-01~21 商業規則）

`C:\workspace\Coworkee\client` 與 `server` 是**唯讀參考**，不可修改。目標 repo
`coworkee-api`、`coworkee-web` 之後建在 `C:\workspace\` 下作為 Coworkee 的兄弟資料夾。

## 第二步：環境安裝與驗證（Phase 0，先做這個）
依 `ENVIRONMENT.md` 安裝並驗證：
- 安裝 JDK 17（Temurin）、Node 20+、Docker Desktop（winget 指令見文件）。
- 凡是需要系統管理員權限、或 Docker Desktop 首次需手動開啟/接受授權的步驟，**暫停並
  明確告訴我要點什麼**，不要硬跑。
- 安裝完跑驗證指令，並用表格回報結果：

  | 項目 | 期望 | 實際 | 狀態 |
  |---|---|---|---|
  | java -version | 17.x | ? | ✅/❌ |
  | node -v | 20/22 | ? | |
  | npm -v | — | ? | |
  | docker --version | 有 | ? | |
  | docker compose version | 有 | ? | |

- Playwright 瀏覽器引擎（`npx playwright install`）等之後 repo 建好、`npm install`
  後再裝，這裡先不用。

**只有當 java=17、node、docker 三項都 ✅，才進入第三步。** 任何一項 ❌ 就停下來等我處理。

## 第三步：開始實作（Phase 2 起）
驗證通過後，依 `IMPLEMENTATION-PLAN.md` 的順序執行：**Phase 2 後端 → Phase 3 前端骨架
→ Phase 5 Keycloak → Phase 4 pilot 畫面**。

每個 phase / sub-task 必須遵守**驗收閘門（G1+G2+G3，缺一不可）**：
- **G1**：本機 build 通過（後端 `./mvnw clean verify`、前端 `npm run build`）
- **G2**：單元測試全綠（JUnit / Vitest）
- **G3**：**Playwright e2e** 通過（後端用 API request context、前端用真瀏覽器）

任一閘門紅燈就停下修到綠，不得跳下一個 phase。每個 sub-task 完成後：
1. 跑滿 G1–G3 並貼出結果。
2. 更新 skill `extjs-coworkee-revamp` 對應的 reference（新 component 對照、新決定 ADR、
   新移植 pattern、phase 進度）。
3. `git commit`，訊息帶上對應的 BR/ADR 編號。

實作中若發現 inventory 未涵蓋的「魔法」，先補 `inventory/person.md` 的 BR 再實作，不可
默默丟掉或「順手清理」未知行為。

## 定案（不要重問，照做）
- 兩個獨立 repo：`coworkee-api`、`coworkee-web`。
- REST（非 Ext.Direct）；清單回傳 `{ data, total }` 信封，前端 anti-corruption 層解包。
- 認證：Keycloak(OIDC) + NextAuth + Spring Security Resource Server；**Person 移除
  password 欄**；寫入用 Keycloak role + `@PreAuthorize` 控管（無 readonly 模式）。
- 資料：PostgreSQL（docker）；沿用 Coworkee 三個 JSON 種子轉 Flyway；頭像由後端靜態服務，
  `picture` 輸出絕對 URL。
- Pilot 範圍：員工清單 + 詳情 + 新增/編輯 Wizard（Wizard 無密碼欄）。
- e2e 一律用 Playwright。

先讀文件，然後開始第二步（環境安裝與驗證），完成後把驗證表回報給我再繼續。
