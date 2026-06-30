# 環境設置（動工前）— Windows 本機

目標：在你本機能 build/run 後端 `coworkee-api`、前端 `coworkee-web`，並用 Docker 跑
Keycloak + PostgreSQL。下面每一步都附安裝指令與驗證方式。

## 0. 總覽：要裝什麼

| 軟體 | 版本 | 用途 | 必要性 |
|---|---|---|---|
| Git | 任意 | 版控（已裝）| ✅ 已完成 |
| JDK (Temurin) | **17** | build/run Spring Boot 3 後端 | 必要 |
| Node.js | **20 LTS 或 22** | build/run Next.js 前端 | 必要 |
| Docker Desktop | 最新 | 跑 Keycloak + PostgreSQL | 必要 |
| Maven | — | 用專案內建 `mvnw` 即可，**不必另裝** | 選用 |
| Playwright | 最新 | e2e 驗收（每個 phase 必過）| 必要 |
| VS Code（或你慣用 IDE）| — | 編輯/Claude Code | 建議 |

> 後端用 JDK **17**（Spring Boot 3 最低需求）。前端用 Node 20+。資料庫與認證服務
> 全部用 Docker 起，不需在本機裝 Postgres / Keycloak。Playwright 由各 repo 的 npm
> 安裝，但**瀏覽器引擎要另外下載一次**（`npx playwright install`，見下方）。

## 1. 安裝指令（PowerShell，winget）

```powershell
winget install --id EclipseAdoptium.Temurin.17.JDK -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Docker.DockerDesktop -e
```

裝完**關閉並重開**終端機（讓 PATH 生效）。Docker Desktop 第一次要手動開啟一次、等它
顯示「Engine running」。

Playwright 是各 repo 的 npm 依賴，會在建立 repo 時 `npm i -D @playwright/test`，但
**瀏覽器引擎需在本機下載一次**（這步全域、跨 repo 共用）：

```powershell
npx playwright install        # 首次必跑，下載 Chromium 等瀏覽器
```

> 這行要等 Phase 2/3 的 repo 建好、`npm install` 之後跑；現在先知道有這步即可。

## 2. 驗證

```powershell
java -version       # 應顯示 17.x
node -v             # 應顯示 v20.x 或 v22.x
npm -v
docker --version
docker compose version
```

`java -version` 若仍顯示舊版本，檢查環境變數 `JAVA_HOME` 是否指向 JDK 17，並把
`%JAVA_HOME%\bin` 放到 PATH 最前面。

## 3. 倉庫佈局（母資料夾 `C:\workspace`）

```
C:\workspace\
├─ Coworkee\        ← ExtJS 來源（唯讀參考）+ migration\ 文件與 skill
├─ coworkee-api\    ← 後端（Phase 2 建立）
└─ coworkee-web\    ← 前端（Phase 3 建立）
```

`coworkee-api` 與 `coworkee-web` 會在切到 Claude Code 後由我各自 `git init` 建立。

## 4. 服務埠（固定，避免衝突）

| 服務 | 埠 | 備註 |
|---|---|---|
| PostgreSQL | 5432 | Docker |
| Keycloak | 8081 | Docker（避開 8080）|
| 後端 coworkee-api | 8080 | 本機 `./mvnw spring-boot:run` |
| 前端 coworkee-web | 3000 | 本機 `npm run dev` |

## 5. Docker：Keycloak + PostgreSQL（Phase 5 提供完整檔）

會在 `coworkee-api\docker-compose.yml` 提供，內容大致：

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: coworkee
      POSTGRES_USER: coworkee
      POSTGRES_PASSWORD: coworkee
    ports: ["5432:5432"]
  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    command: start-dev --import-realm
    ports: ["8081:8080"]
    volumes:
      - ./keycloak/realm-coworkee.json:/opt/keycloak/data/import/realm-coworkee.json
```

啟動：`docker compose up -d`。Keycloak admin console：http://localhost:8081
（admin/admin，dev 模式）。會自動匯入 realm `coworkee`。

## 6. 環境變數範本（之後各 repo 會附 `.env.example`）

後端 `coworkee-api`（`application.yml` 或環境變數）：

```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/coworkee
SPRING_DATASOURCE_USERNAME=coworkee
SPRING_DATASOURCE_PASSWORD=coworkee
# Resource Server 驗證 Keycloak 發的 JWT
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=http://localhost:8081/realms/coworkee
APP_PORTRAITS_BASE_URL=http://localhost:8080
```

前端 `coworkee-web`（`.env.local`）：

```
AUTH_SECRET=<用 `npx auth secret` 產生>
AUTH_KEYCLOAK_ISSUER=http://localhost:8081/realms/coworkee
AUTH_KEYCLOAK_ID=coworkee-web
AUTH_KEYCLOAK_SECRET=<Keycloak client secret>
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

## 7. 啟動順序（pilot 完成後）

1. `cd coworkee-api && docker compose up -d`（起 Postgres + Keycloak）
2. `cd coworkee-api && ./mvnw spring-boot:run`（後端，Flyway 自動建表 + 灌種子）
3. `cd coworkee-web && npm install && npm run dev`（前端）
4. 瀏覽 http://localhost:3000 → 導向 Keycloak 登入 → 員工目錄

## 8. 常見問題

- **Docker Desktop 未啟動** → compose 會連不上 daemon；先開 Docker Desktop。
- **埠被占用** → 改該服務的對外埠並同步 `.env`。
- **JDK 版本不對** → Spring Boot 3 啟動報 class file version 錯，代表跑在 JDK < 17。
- **Keycloak 登入後 401（後端）** → 檢查 `issuer-uri` 與 token 的 `iss` 是否一致
  （localhost vs 127.0.0.1、埠號）。

## 9. 測試與驗收工具

每個 phase 都要過三關（見 IMPLEMENTATION-PLAN「驗收閘門」）：本機 build + 單元測試 +
**Playwright e2e**。

- **後端**：JUnit + Testcontainers（`./mvnw verify` 會自動起臨時 Postgres）；
  Playwright **API tests** 打跑起來的後端。
- **前端**：Vitest（單元/元件）+ Playwright **UI e2e**（真瀏覽器）。

Playwright 由各 repo 的 npm 安裝，首次需下載瀏覽器：

```powershell
# 在 coworkee-web（與 coworkee-api 的 e2e 目錄）
npm i -D @playwright/test
npx playwright install        # 下載 Chromium 等瀏覽器（首次必跑）
```

前端 e2e 需要後端 + Keycloak 先啟動；會用 Playwright `webServer` 或啟動腳本自動編排，
所以跑 e2e 前請先 `docker compose up -d`。
