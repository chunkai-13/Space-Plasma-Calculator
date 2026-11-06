# 太空電漿物理計算與單位查詢工具 交接文檔（Handoff Documentation）

文件版本：v5.7  
更新日期：2026-11-06  
專案儲存庫：chunkai-13/Space-Plasma-Calculator (main branch)

---

## 一、 專案概述與系統定位

「太空電漿物理計算與單位查詢工具（Space Plasma Calculator）」是一款專為太空物理學家、天文物理學者及工程師設計的純前端單頁式漸進式網頁應用（Progressive Web App, PWA）。

系統整合三大核心業務模組：
1. **方程式速算庫（Presets / Equations）**：內建質點運動、磁流體波（MHD Waves）、動態激波（Kinetic Shocks）三大範疇的太空電漿物理公式，並支援典型太空環境（太陽風、磁層、電離層）預設值載入與即時物理數量級標尺比對。
2. **自訂運算工作台（Custom Builder）**：提供基於抽象語法樹（AST）的公式自訂建構引擎，支援符號運算、變數宣告、多項式運算、動態單位換算與雙向 LaTeX 輸入同步。
3. **單位與常數手冊（Lookup & Constants）**：提供太空常用制、高斯制（CGS）、國際標準制（SI）的物理常數查詢與物理量規格對照表，並內建即時單位換算器與微互動導引。

系統採純前端無框架（Vanilla JavaScript ES6+ 與模組化原生 CSS）架構，無依賴任何龐大前端框架（如 React 或 Vue），第三方函式庫僅引入 KaTeX 進行科學數學公式排版。

---

## 二、 核心架構決策（Architecture Decision Records, ADRs）

### ADR-001：純 CSS 互斥 Tab 視圖與乾淨 Hash 路由（v5.0）
* **問題背景**：先前版本三大區塊在頁面上縱向連續平鋪，造成行動端與桌面端過長滾動，降低操作聚焦度；且重新掛載 DOM 會破壞自訂工作台中正在編輯的公式 AST 狀態。
* **架構決策**：
  1. `<main>` 容器下的三大 `<section>`（`section-presets`、`section-builder`、`section-units`）設定為單一啟用模式（Single Active View）。
  2. 僅透過 CSS `.tab-pane.active { display: block; }` 與預設 `display: none;` 控制切換，嚴格禁止銷毀或重建 DOM，保證自訂運算工作台公式狀態零丟失。
  3. 雙向同步 `window.location.hash`（`#presets`、`#builder`、`#units`），監聽 `hashchange` 事件以原生支援瀏覽器上一頁與下一頁歷史導航。

### ADR-002：W3C WAI-ARIA 無障礙標準與 Roving Tabindex（v5.5）
* **問題背景**：鍵盤操作者與螢幕閱讀器使用者無法流暢導航主要分頁標籤，不符現代無障礙規範。
* **架構決策**：
  1. 頂部導覽列設定 `role="tablist"`，各分頁按鈕設定 `role="tab"`，內容容器設定 `role="tabpanel"`，並建立對應之 `aria-controls` 與 `aria-labelledby` 關聯。
  2. 實作 Roving Tabindex 機制：啟用中分頁設定 `tabindex="0"` 與 `aria-selected="true"`，未啟用分頁設定 `tabindex="-1"` 與 `aria-selected="false"`。
  3. 監聽 `keydown` 事件：支援方向鍵（`ArrowRight`、`ArrowDown`、`ArrowLeft`、`ArrowUp`）循環轉移焦點並即時觸發視圖啟用；支援 `Home` 鍵聚焦首項、`End` 鍵聚焦末項。

### ADR-003：典型太空環境基準態與髒狀態管理（v5.1）
* **問題背景**：當使用者選擇「1 AU 太陽風」等場景預設值後，若手動微調參數輸入框，UI 仍維持場景選中外觀，容易誤導使用者認為當前數值仍為標準場景數據。
* **架構決策**：
  1. 獨立實作 `PresetStateManager` 模組，在點選場景時記錄基準態（Baseline State）。
  2. 監聽參數輸入框之 `input` 事件，利用浮點數容差 $|val - baseline| > 10^{-6}$ 判定是否偏離。
  3. 當偏離時，場景按鈕立即切換為「已自訂（Customized / Modified）」橘色外框樣式並卸除標準選中狀態；若使用者手動還原至基準數值，按鈕自動恢復標準選中狀態。
  4. 提供「還原預設值」快捷機制，一鍵重新寫入該場景之標準物理參數。

### ADR-004：LaTeX 編輯器無損游標維持與撤銷棧隔離（v5.4）
* **問題背景**：自訂工作台中 LaTeX 輸入框在雙向綁定公式 AST 時，使用者於文字中段鍵入字元會導致字串被重置，原生 Caret 強制跳回末尾，破壞連續輸入體驗；且全域按鍵攔截會破壞文字框的原生 `Ctrl+Z` / `Cmd+Z` 撤銷棧。
* **架構決策**：
  1. 引入解析中互斥鎖 `isParsingFromInput`，輸入期間阻斷反向重繪。
  2. 實作字串語義等價比對（Semantic Identity Check），若內容結構未變則不重寫 `value`。
  3. 記錄鍵入時的選取範圍 `selectionStart` 與 `selectionEnd`，若必須回填則立即使用 `setSelectionRange()` 精準還原游標。
  4. 於工作台按鍵監聽器中隔離 `INPUT` 與 `TEXTAREA` 元素，保留原生撤銷歷史紀錄。

### ADR-005：太空電漿物理數值邊界防禦與抖動反饋（v5.3）
* **問題背景**：若輸入磁場 $B \le 0$、密度 $n \le 0$ 或溫度低於絕對零度，計算引擎會產出 `NaN`、`Infinity` 或負迴旋半徑等無物理意義數據。
* **架構決策**：
  1. 實作運算前置斷言（Pre-calculation Assertion）：強制校驗 $B > 0$、$n > 0$、$T \ge 0$、$m \ne 0$ 與 $q \ne 0$。
  2. 非阻塞錯誤反饋（Non-blocking Error UI）：嚴禁使用 `window.alert()`。數值違規時，出錯輸入框套用醒目紅色邊框與 `shake` 輕微抖動動畫；結果區域則以警示卡片明確提示出錯原因。數值合法後即時恢復常態運算。

### ADR-006：數量級標尺物理對稱映射（v4.7、v5.5）
* **問題背景**：迴旋週期 $T_C$ 數值極小（例如毫秒級 $3.57 \times 10^{-3}\text{ s}$），若直接計算對數會導致定位圓點截斷貼死於最左端，產生「頻率在磁層、週期在太陽風」的物理矛盾。
* **架構決策**：
  1. 時間維度標尺採用倒數映射 $f_{\text{equiv}} = 1/T_C$，其對數值 $\log_{10}(f_{\text{equiv}})$ 與頻率維度嚴格對齊。
  2. 數量級文字標籤特化為「太陽風 (長週期)」、「磁層 (毫秒級)」、「電離層 (微秒級)」，圓點精確落於磁層中段（約 49%），完整還原物理真實性。

### ADR-007：單位規格表 RWD 與微互動導引（v5.2、v5.6）
* **問題背景**：單位手冊五欄表格在行動裝置撐破視窗；點擊「帶入換算」後使用者無法直觀感知換算器已更新。
* **架構決策**：
  1. 表格包裹於獨立橫向滾動容器，小螢幕下「常用情境說明」折疊為問號彈窗，按鈕觸控熱區維持大於 44px $\times$ 44px。
  2. 點擊「帶入換算」時觸發微互動：按鈕切換「已帶入」樣式，畫面平滑滾動至換算器（`scrollIntoView({ behavior: 'smooth', block: 'nearest' })`），換算器觸發 0.8 秒淡藍色脈衝光效（`pulseGlow`），並將輸入框聚焦反白（`focus({ preventScroll: true })` 與 `select()`）。

### ADR-008：單檔 500 行代碼防線原則（Modular Defense Strategy）
* **架構決策**：為杜絕大型單體程式碼造成的維護困難與注意力稀釋（Attention Dilution），專案建立了 `./scripts/check-line-counts.sh` 檢測機制。全專案 30 個原生 JavaScript 與 CSS 模組之檔案行數皆強制限制在 500 行以內。

---

## 三、 專案檔案清單與模組職責說明

目前專案檔案結構如下：

```
Space Plasma Calculator/
├── index.html                       # 主應用入口骨架，包含三大分頁標籤與無障礙標記
├── styles.css                       # 樣式聚合入口檔案（引用 css/ 下各子模組）
├── app.js                           # 應用總調度器，負責路由、分頁切換、無障礙事件與全域狀態
├── constants.js                     # 物理常數與單位換算係數定義資料庫
├── equations.js                     # 方程式速算庫頂層匯整介面
├── calculator.js                    # 自訂運算工作台頂層匯整介面
├── manifest.json                    # PWA 應用設定檔
├── sw.js                            # PWA Service Worker 快取管理器（Network-First 策略）
├── 啟動應用.command                   # 本地快速雙擊啟動腳本
├── scripts/
│   └── check-line-counts.sh         # 單檔行數防線檢查自動化腳本（門檻 500 行）
├── css/
│   ├── base.css                     # 設計系統基礎變數、字體與全域 Reset
│   ├── layout.css                   # 視窗佈局、導覽列、互斥分頁面板樣式
│   ├── components.css               # 卡片、按鈕、輸入框、徽章等基礎元件樣式
│   ├── builder.css                  # 自訂工作台運算面板、工具列與 AST 畫布樣式
│   ├── builder-cards.css            # 自訂工作台公式項卡片樣式
│   ├── lookup-equations.css         # 方程式速算卡片、數量級標尺、單位手冊與微互動動畫
│   ├── modern-ui.css                # 現代深色科技主題外觀、邊界錯誤震動動畫（shake）
│   └── responsive.css               # 行動裝置與窄螢幕響應式（RWD）排版適配規則
├── js/
│   ├── i18n.js                      # 雙語多語系字典與動態替換控制器（繁體中文 / 英文）
│   ├── plasma-core.js               # 太空電漿物理核心演算法與數學公式運算庫
│   ├── equations-particle.js        # 單粒子迴旋、磁矩、漂移運動方程式定義
│   ├── equations-mhd-waves.js       # 磁流體波（阿爾芬波、磁聲波）方程式定義
│   ├── equations-kinetic-shocks.js  # 動態激波、朗繆爾波、德拜遮蔽方程式定義
│   ├── tab-equations.js             # 分頁一：方程式速算庫視圖與參數動態表單控制器
│   ├── preset-state-manager.js      # 典型太空環境基準態與髒狀態即時追蹤管理器
│   ├── app-ui.js                    # 物理數量級標尺、智慧單位下拉選單、剪貼簿控制器
│   ├── calculator-core.js           # 自訂運算 AST 節點、公式狀態管理核心
│   ├── calculator-evaluator.js      # 自訂運算語法解析器與安全數值評估器
│   ├── calculator-formatter.js      # 自訂運算 LaTeX 與數學字串格式化器
│   ├── builder-cards-items.js       # 自訂工作台項目卡片渲染器
│   ├── builder-cards-list.js        # 自訂工作台卡片清單與拖曳/調整排序器
│   ├── builder-preview.js           # 自訂工作台 KaTeX 公式即時預覽器
│   ├── tab-builder.js               # 分頁二：自訂運算工作台視圖控制器
│   └── tab-lookup.js                # 分頁三：單位與常數手冊、即時單位換算控制器
├── katex/                           # 離線 KaTeX 數學公式排版引擎
└── docs/
    └── handoff.md                   # 本系統交接文檔
```

---

## 四、 核心模組檔案行數稽核（截至 v5.6）

依據 `./scripts/check-line-counts.sh` 執行結果，全專案 30 個原始碼檔案均完全合規：

| 檔案名稱 | 當前行數 | 規範上限 | 狀態 |
| :--- | :--- | :--- | :--- |
| `app.js` | 337 | 500 | 合格 OK |
| `calculator.js` | 121 | 500 | 合格 OK |
| `constants.js` | 357 | 500 | 合格 OK |
| `equations.js` | 19 | 500 | 合格 OK |
| `styles.css` | 10 | 500 | 合格 OK |
| `sw.js` | 82 | 500 | 合格 OK |
| `css/base.css` | 80 | 500 | 合格 OK |
| `css/layout.css` | 129 | 500 | 合格 OK |
| `css/components.css` | 473 | 500 | 合格 OK |
| `css/builder.css` | 327 | 500 | 合格 OK |
| `css/builder-cards.css` | 335 | 500 | 合格 OK |
| `css/lookup-equations.css` | 440 | 500 | 合格 OK |
| `css/modern-ui.css` | 484 | 500 | 合格 OK |
| `css/responsive.css` | 329 | 500 | 合格 OK |
| `js/i18n.js` | 328 | 500 | 合格 OK |
| `js/plasma-core.js` | 484 | 500 | 合格 OK |
| `js/equations-particle.js` | 333 | 500 | 合格 OK |
| `js/equations-mhd-waves.js` | 295 | 500 | 合格 OK |
| `js/equations-kinetic-shocks.js` | 351 | 500 | 合格 OK |
| `js/tab-equations.js` | 496 | 500 | 合格 OK |
| `js/preset-state-manager.js` | 302 | 500 | 合格 OK |
| `js/app-ui.js` | 443 | 500 | 合格 OK |
| `js/calculator-core.js` | 366 | 500 | 合格 OK |
| `js/calculator-evaluator.js` | 313 | 500 | 合格 OK |
| `js/calculator-formatter.js` | 261 | 500 | 合格 OK |
| `js/builder-cards-items.js` | 272 | 500 | 合格 OK |
| `js/builder-cards-list.js` | 369 | 500 | 合格 OK |
| `js/builder-preview.js` | 374 | 500 | 合格 OK |
| `js/tab-builder.js` | 246 | 500 | 合格 OK |
| `js/tab-lookup.js` | 433 | 500 | 合格 OK |

---

## 五、 版本演進歷程與已交付功能（Milestones）

* **v1.0 ~ v3.0**：完成太空電漿物理三大方程式庫（質點、波、激波）與基礎計算機功能，加入 KaTeX 離線排版支援，支援 PWA 離線安裝。
* **v3.1 ~ v3.7**：重構搜尋引擎，支援模糊匹配與即時標籤高亮；新增物理常數手冊與雙語國際化支援。
* **v4.0 ~ v4.9**：進行現代科學深色 UI 重構，引入數量級標尺（Order of Magnitude Context）；統一各卡片單位制標籤（SI、高斯制、太空常用制）；重構公式 AST 預覽。
* **v5.0**：實作純 CSS 互斥 Tab 視圖，消滅長滾動問題；建立乾淨的 URL Hash 路由體系（`#presets`、`#builder`、`#units`）。
* **v5.1**：實作典型太空環境預設值「髒狀態（Dirty State）」追蹤管理模組，提供即時狀態比對與一鍵還原機制。
* **v5.2**：針對行動裝置與窄螢幕全面優化單位規格對照表（RWD 橫向滾動容器、常用情境彈窗與符合無障礙觸控尺寸之按鈕）。
* **v5.3**：建立嚴格的數值邊界防禦與非阻塞錯誤回饋（前置斷言阻斷 $B \le 0$、$n \le 0$ 等無效輸入，觸發紅框輕微抖動動畫與解算結果警示卡片）。
* **v5.4**：解決自訂工作台 LaTeX 輸入框雙向綁定時的游標強制跳至尾端問題，實作無損選取範圍維持與原生撤銷歷史保護。
* **v5.5**：補齊導覽列 W3C WAI-ARIA 鍵盤導覽標準（Roving Tabindex、方向鍵循環切換、Home/End 支援）；修正數量級標尺時間週期對數映射。
* **v5.6**：優化單位手冊「帶入換算」微互動（平滑滾動至換算器、容器與輸入框 0.8 秒淡藍色脈衝光效、自動焦點轉移與文字全選）。
* **v5.7（當前版本）**：全面修復英文版介面下方程式速算庫（Formula Presets）結果卡片中「典型太空電漿環境數量級對照（Order of Magnitude Context）」區塊的中文字元殘留問題，標題、物理情境標籤（太陽風、磁層、電離層、微觀/動力學/巨觀尺度、磁能/熱能主導、激波強度）與軌道提示 tooltips 全數支援雙語自動切換。

---

## 六、 待辦事項與後續技術規劃（Roadmap & Backlog）

1. **方程式速算庫導出功能（Export Capability）**：
   * 支援將當前方程式計算之所有輸入、輸出與數量級標尺數據，一鍵導出為純文字報告、JSON 結構化資料或 CSV 試算表。
2. **自訂工作台預設模板擴充（Builder Presets Library）**：
   * 在自訂工作台中增加常用的複合式太空物理公式模板（如 Parker 太陽風流速解、磁重聯率公式、激波跳躍 Rankine-Hugoniot 關係式）。
3. **離線 Service Worker 增強與快取精準剔除**：
   * 建立自動化腳本以雜湊值（Content Hash）取代手動更新版本號（`?v=5.x`），提升快取更新的自動化與可靠度。
4. **單元測試與自動化迴歸測試套件**：
   * 建立基於原生環境的 Headless 測試腳本，自動校驗 `js/plasma-core.js` 內 40+ 道物理公式的理論數值精度與邊界防禦反應。

---

## 七、 驗證與部署標準作業流程（Deployment SOP）

接手工程師在修改任何程式碼並發布前，必須嚴格執行以下驗證步驟：

1. **檔案長度防線稽核**：
   ```bash
   cd "Space Plasma Calculator"
   ./scripts/check-line-counts.sh
   ```
   * 確保所有 30 個核心原始碼檔案行數維持在 500 行以內，杜絕代碼膨脹。
2. **語法完整性驗證**：
   ```bash
   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc "js/tab-lookup.js"
   ```
   * 確保無任何 ES6+ 語法解析錯誤。
3. **版本號統一升級**：
   * 若修改了 CSS 或 JS，需於 `sw.js` 中提升 `CACHE_NAME`（如 `plasma-calc-v5.7`）。
   * 同步更新 `styles.css` 內的子模組引數、`index.html` 的資源引用版本標籤，以及 `sw.js` 內的 `ASSETS` 清單。
4. **Git 提交與推播**：
   ```bash
   git add .
   git commit -m "feat(scope): 描述具體功能與變更 (v5.7)"
   git push origin main
   ```
