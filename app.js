/**
 * app.js - 主應用程式互動邏輯、獨立運算符、點擊聚焦插入與分頁控制器
 */

// 多語系字典
const I18N = {
  zh: {
    appTitle: "太空電漿物理計算與單位查詢工具",
    appSubtitle: "Space Plasma Physics Quantity & Unit Calculator",
    tabCalc: "自訂物理量計算",
    tabLookup: "查找單位與換算",
    tabEq: "太空物理方程式",
    darkMode: "深色模式",
    lightMode: "淺色模式",
    langName: "English",
    
    // Tab 1
    builderTitle: "自訂運算建構區",
    builderDesc: "自由組合物理量與常數，支援獨立 ＋、－、×、÷ 運算符與括號，點擊上方公式任意位置即可自由插入項目。",
    previewTitle: "目前建構的方程式：",
    dimReady: "因次檢驗就緒",
    dimConsistent: "因次完全相符 ✓",
    dimMismatch: "單位因次不符 ⚠️",
    btnAddQty: "＋ 物理量",
    btnAddConst: "＋ 物理常數",
    btnClear: "清空全部",
    presetLabel: "快速帶入經典範例：",
    presetPB: "磁壓力 (B² / 2μ₀)",
    presetTotalP: "總壓力 (P_th + P_B)",
    presetBracket: "巢狀括號 [ (P_B) + P_th ]",
    presetBeta: "電漿 Beta (nkT / P_B)",
    presetVA: "阿爾芬速度 (B / √(μ₀ ρ))",
    btnEqual: "＝ 計算結果",
    resultTitle: "計算結果輸出",
    resultPlaceholder: "請於上方建構多項式後，點擊「＝ 計算結果」按鈕。",
    outputSystem: "輸出制度：",
    sysSpace: "太空常用制 (Space)",
    sysSI: "國際單位制 (SI)",
    sysCGS: "高斯制 (CGS)",
    btnCopy: "複製數值",
    copied: "已複製！",
    termPower: "次方",
    termMult: "係數",
    termDelete: "刪除",

    // Tab 2
    lookupTitle: "物理量與單位對照手冊",
    searchPlaceholder: "輸入物理量名稱、英文或代號搜尋 (例如: 磁場, B, Alfven, 密度)...",
    catLabel: "物理量類別：",
    allCats: "全部類別",
    qtyLabel: "選擇物理量：",
    unitTableTitle: "單位制度規格對照",
    converterTitle: "即時單位換算器",
    fromLabel: "來源數值與單位：",
    toLabel: "目標單位：",
    calcConvert: "換算結果：",
    multiplierNote: "換算倍率公式：",

    // Tab 3
    eqTitle: "太空物理方程式計算庫",
    eqSearchPlaceholder: "搜尋方程式 (例如: Alfven, 迴旋, Kappa, Rankine, 德拜)...",
    eqCatLabel: "方程式類別：",
    allEqCats: "全部類別",
    selectEq: "選擇方程式：",
    btnComputeEq: "計算此方程式",
    eqResultTitle: "方程式解算結果",
    paramInputs: "參數數值與單位輸入："
  },
  en: {
    appTitle: "Space Plasma Physics Calculator",
    appSubtitle: "Plasma Quantities, Unit Lookup & Equations",
    tabCalc: "Custom Calculator",
    tabLookup: "Units & Converter",
    tabEq: "Space Physics Equations",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    langName: "繁體中文",

    // Tab 1
    builderTitle: "Expression Builder",
    builderDesc: "Build polynomial expressions with standalone +, -, ×, ÷. Click any position on the formula above to insert items.",
    previewTitle: "Current Equation Preview:",
    dimReady: "Ready",
    dimConsistent: "Dimensions Match ✓",
    dimMismatch: "Dimension Mismatch ⚠️",
    btnAddQty: "+ Quantity",
    btnAddConst: "+ Constant",
    btnClear: "Clear All",
    presetLabel: "Quick Presets:",
    presetPB: "Magnetic Pressure (B² / 2μ₀)",
    presetTotalP: "Total Pressure (P_th + P_B)",
    presetBracket: "Nested Brackets [ (P_B) + P_th ]",
    presetBeta: "Plasma Beta (nkT / P_B)",
    presetVA: "Alfvén Speed (B / √(μ₀ ρ))",
    btnEqual: "= Compute Result",
    resultTitle: "Calculation Output",
    resultPlaceholder: "Construct your polynomial expression above and click '= Compute Result'.",
    outputSystem: "Output System:",
    sysSpace: "Space Units",
    sysSI: "SI Units",
    sysCGS: "CGS Units",
    btnCopy: "Copy Value",
    copied: "Copied!",
    termPower: "Power",
    termMult: "Coeff",
    termDelete: "Delete",

    // Tab 2
    lookupTitle: "Physical Quantities & Unit Reference",
    searchPlaceholder: "Search by name, symbol or unit (e.g., B, magnetic, alfven, n)...",
    catLabel: "Category:",
    allCats: "All Categories",
    qtyLabel: "Select Quantity:",
    unitTableTitle: "Unit Specifications Across Systems",
    converterTitle: "Instant Unit Converter",
    fromLabel: "Source Value & Unit:",
    toLabel: "Target Unit:",
    calcConvert: "Converted Result:",
    multiplierNote: "Conversion Factor:",

    // Tab 3
    eqTitle: "Space Physics Equations Library",
    eqSearchPlaceholder: "Search equations (e.g. alfven, gyro, kappa, shock, debye)...",
    eqCatLabel: "Equation Category:",
    allEqCats: "All Categories",
    selectEq: "Select Equation:",
    btnComputeEq: "Compute Equation",
    eqResultTitle: "Solution & Outputs",
    paramInputs: "Input Parameters & Units:"
  }
};

class SpacePlasmaApp {
  constructor() {
    this.currentLang = localStorage.getItem("sp_lang") || "zh";
    this.currentTheme = localStorage.getItem("sp_theme") || "dark";
    this.calculator = new PlasmaCustomCalculator();
    this.selectedQuantity = PHYSICAL_QUANTITIES[0];
    this.selectedEquation = EQUATIONS_DATABASE[0];

    this.initDOM();
    this.bindEvents();
    this.applyTheme(this.currentTheme);
    this.applyLanguage(this.currentLang);

    // 預設填入範例：磁壓力
    this.loadPreset("presetPB");
    this.renderLookupTab();
    this.renderEquationsTab();
  }

  initDOM() {
    // 導覽列與分頁按鈕
    this.tabBtns = document.querySelectorAll(".tab-btn");
    this.tabContents = document.querySelectorAll(".tab-content");
    this.themeToggleBtn = document.getElementById("theme-toggle-btn");
    this.langToggleBtn = document.getElementById("lang-toggle-btn");

    // 分頁一元件
    this.termsContainer = document.getElementById("terms-container");
    this.btnAddQty = document.getElementById("btn-add-qty");
    this.btnAddConst = document.getElementById("btn-add-const");
    this.btnAddFraction = document.getElementById("btn-add-fraction");
    this.btnAddOpenParen = document.getElementById("btn-add-open-paren");
    this.btnAddCloseParen = document.getElementById("btn-add-close-paren");
    this.btnClearTerms = document.getElementById("btn-clear-terms");
    this.btnEqual = document.getElementById("btn-equal");
    this.btnUndo = document.getElementById("btn-undo");
    this.btnRedo = document.getElementById("btn-redo");
    this.resultOutputBox = document.getElementById("result-output-box");
    this.sysRadios = document.querySelectorAll("input[name='display-system']");

    // 即時方程式看板元件
    this.interactiveFormulaContainer = document.getElementById("interactive-formula-container");
    this.dimStatusBadge = document.getElementById("dim-status-badge");
    this.mismatchWarningCard = document.getElementById("mismatch-warning-card");
    this.previewCursorHint = document.getElementById("preview-cursor-hint");

    // 分頁二元件
    this.catSelect = document.getElementById("lookup-cat-select");
    this.qtySelect = document.getElementById("lookup-qty-select");
    this.lookupSearch = document.getElementById("lookup-search-input");
    this.unitSpecTable = document.getElementById("unit-spec-table-body");
    this.convInputVal = document.getElementById("conv-input-value");
    this.convFromUnit = document.getElementById("conv-from-unit");
    this.convToUnit = document.getElementById("conv-to-unit");
    this.convResultDisplay = document.getElementById("conv-result-display");
    this.convFactorDisplay = document.getElementById("conv-factor-display");

    // 分頁三元件
    this.eqCatSelect = document.getElementById("eq-cat-select");
    this.eqSelect = document.getElementById("eq-select");
    this.eqSearch = document.getElementById("eq-search-input");
    this.eqInputsContainer = document.getElementById("eq-inputs-container");
    this.btnComputeEq = document.getElementById("btn-compute-eq");
    this.eqResultBox = document.getElementById("eq-result-box");
  }

  bindEvents() {
    // 分頁切換
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const targetTab = btn.getAttribute("data-tab");
          this.switchTab(targetTab);
        });
      });
    }

    // 主題與語言
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener("click", () => {
        this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
        this.applyTheme(this.currentTheme);
      });
    }

    if (this.langToggleBtn) {
      this.langToggleBtn.addEventListener("click", () => {
        this.currentLang = this.currentLang === "zh" ? "en" : "zh";
        this.applyLanguage(this.currentLang);
      });
    }

    // 獨立運算符號按鈕點擊 (在當前游標處插入)
    document.querySelectorAll(".btn-op-action").forEach(btn => {
      btn.addEventListener("click", () => {
        const op = btn.getAttribute("data-insert-op");
        this.calculator.insertOperator(op);
        this.renderTermsList();
      });
    });

    // 插入分式
    if (this.btnAddFraction) {
      this.btnAddFraction.addEventListener("click", () => {
        this.calculator.insertFraction();
        this.renderTermsList();
      });
    }

    // 插入物理量
    if (this.btnAddQty) {
      this.btnAddQty.addEventListener("click", () => {
        this.calculator.insertQuantity();
        this.renderTermsList();
      });
    }

    // 插入常數
    if (this.btnAddConst) {
      this.btnAddConst.addEventListener("click", () => {
        this.calculator.insertConstant();
        this.renderTermsList();
      });
    }

    // 插入開括號 (自動變換為小中大括號)
    if (this.btnAddOpenParen) {
      this.btnAddOpenParen.addEventListener("click", () => {
        this.calculator.insertOpenParen();
        this.renderTermsList();
      });
    }

    // 插入閉括號 (自動變換為小中大括號)
    if (this.btnAddCloseParen) {
      this.btnAddCloseParen.addEventListener("click", () => {
        this.calculator.insertCloseParen(1);
        this.renderTermsList();
      });
    }

    // 上一步 (Undo)
    if (this.btnUndo) {
      this.btnUndo.addEventListener("click", () => {
        if (this.calculator.undo()) {
          this.renderTermsList();
        }
      });
    }

    // 下一步 (Redo)
    if (this.btnRedo) {
      this.btnRedo.addEventListener("click", () => {
        if (this.calculator.redo()) {
          this.renderTermsList();
        }
      });
    }

    // 鍵盤快捷鍵 (Command + Z / Command + Shift + Z)
    window.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            if (this.calculator.redo()) this.renderTermsList();
          } else {
            if (this.calculator.undo()) this.renderTermsList();
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          if (this.calculator.redo()) this.renderTermsList();
        }
      }
    });

    // 清空
    if (this.btnClearTerms) {
      this.btnClearTerms.addEventListener("click", () => {
        this.calculator.clear();
        this.renderTermsList();
        this.renderResultBox(null);
      });
    }

    // 計算
    if (this.btnEqual) {
      this.btnEqual.addEventListener("click", () => {
        try {
          const res = this.calculator.compute();
          this.renderResultBox(res);
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // 制度切換
    if (this.sysRadios) {
      this.sysRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
          const sys = e.target.value;
          const res = this.calculator.formatResult(sys);
          this.renderResultBox(res);
        });
      });
    }

    // 預設快速按鈕
    document.querySelectorAll(".preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const presetKey = btn.getAttribute("data-preset");
        this.loadPreset(presetKey);
      });
    });

    // 分頁二：單位查詢與換算
    if (this.catSelect) {
      this.catSelect.addEventListener("change", () => {
        this.filterQuantitiesByCategory(this.catSelect.value);
      });
    }

    if (this.qtySelect) {
      this.qtySelect.addEventListener("change", () => {
        const q = PHYSICAL_QUANTITIES.find(x => x.id === this.qtySelect.value);
        if (q) {
          this.selectedQuantity = q;
          this.renderQuantityDetail();
        }
      });
    }

    if (this.lookupSearch) {
      this.lookupSearch.addEventListener("input", () => {
        this.searchQuantities(this.lookupSearch.value);
      });
    }

    if (this.convInputVal) {
      this.convInputVal.addEventListener("input", () => this.updateConversion());
    }
    if (this.convFromUnit) {
      this.convFromUnit.addEventListener("change", () => this.updateConversion());
    }
    if (this.convToUnit) {
      this.convToUnit.addEventListener("change", () => this.updateConversion());
    }

    // 分頁三：方程式
    if (this.eqCatSelect) {
      this.eqCatSelect.addEventListener("change", () => {
        this.filterEquationsByCategory(this.eqCatSelect.value);
      });
    }

    if (this.eqSelect) {
      this.eqSelect.addEventListener("change", () => {
        const eq = EQUATIONS_DATABASE.find(e => e.id === this.eqSelect.value);
        if (eq) {
          this.selectedEquation = eq;
          this.renderEquationDetail();
        }
      });
    }

    if (this.eqSearch) {
      this.eqSearch.addEventListener("input", () => {
        this.searchEquations(this.eqSearch.value);
      });
    }

    if (this.btnComputeEq) {
      this.btnComputeEq.addEventListener("click", () => {
        this.computeCurrentEquation();
      });
    }
  }

  // 切換分頁
  switchTab(tabId) {
    if (this.tabBtns) {
      this.tabBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-tab") === tabId));
    }
    if (this.tabContents) {
      this.tabContents.forEach(c => c.classList.toggle("active", c.id === `tab-${tabId}`));
    }
  }

  // 主題控制
  applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      if (this.themeToggleBtn) {
        this.themeToggleBtn.innerHTML = `<span class="icon">☀️</span> <span class="theme-text">${I18N[this.currentLang].lightMode}</span>`;
      }
    } else {
      document.documentElement.classList.remove("dark");
      if (this.themeToggleBtn) {
        this.themeToggleBtn.innerHTML = `<span class="icon">🌙</span> <span class="theme-text">${I18N[this.currentLang].darkMode}</span>`;
      }
    }
    localStorage.setItem("sp_theme", theme);
  }

  // 多語系控制
  applyLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem("sp_lang", lang);
    const dict = I18N[lang];

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
          el.setAttribute("placeholder", dict[key]);
        } else {
          el.textContent = dict[key];
        }
      }
    });

    if (this.langToggleBtn) {
      this.langToggleBtn.textContent = dict.langName;
    }
    this.applyTheme(this.currentTheme);

    this.renderTermsList();
    this.renderLookupTab();
    this.renderEquationsTab();
  }

  // -------------------------
  // 分頁一：自訂物理量計算
  // -------------------------
  loadPreset(presetKey) {
    this.calculator.clear();

    if (presetKey === "presetPB") {
      // 磁壓力: 直式分式 B^2 / (2 * mu0)
      const frac = this.calculator.insertFraction();
      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 }, { scope: "fraction", fractionId: frac.id, part: "numerator", index: 0 });
      this.calculator.insertConstant({ constantId: "mu0", multiplier: 2 }, { scope: "fraction", fractionId: frac.id, part: "denominator", index: 0 });
      this.calculator.setCursorTarget({ scope: "root", index: 1 });
    } else if (presetKey === "presetTotalP") {
      // 總壓力: (n * kB * T) + (B^2 / 2mu0)
      this.calculator.insertQuantity({ quantityId: "number_density", unitId: "cm_minus3", numberValue: 5 });
      this.calculator.insertOperator("*");
      this.calculator.insertConstant({ constantId: "kB" });
      this.calculator.insertOperator("*");
      this.calculator.insertQuantity({ quantityId: "temperature", unitId: "eV", numberValue: 10 });
      this.calculator.insertOperator("+");
      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 });
      this.calculator.insertOperator("/");
      this.calculator.insertConstant({ constantId: "mu0", multiplier: 2 });
    } else if (presetKey === "presetBracket") {
      // 巢狀括號範例: [ (B^2 / 2mu0) + P_th ]
      this.calculator.insertOpenParen();
      this.calculator.insertOpenParen();
      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 });
      this.calculator.insertOperator("/");
      this.calculator.insertConstant({ constantId: "mu0", multiplier: 2 });
      this.calculator.insertCloseParen(1);
      this.calculator.insertOperator("+");
      this.calculator.insertQuantity({ quantityId: "plasma_pressure", unitId: "nPa", numberValue: 0.05 });
      this.calculator.insertCloseParen(1);
    } else if (presetKey === "presetBeta") {
      // 電漿 Beta: (n * kB * T) / (B^2 / 2mu0)
      this.calculator.insertQuantity({ quantityId: "number_density", unitId: "cm_minus3", numberValue: 5 });
      this.calculator.insertOperator("*");
      this.calculator.insertQuantity({ quantityId: "temperature", unitId: "eV", numberValue: 15 });
      this.calculator.insertOperator("*");
      this.calculator.insertConstant({ constantId: "kB" });
      this.calculator.insertOperator("/");
      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 });
      this.calculator.insertOperator("*");
      this.calculator.insertConstant({ constantId: "mu0", multiplier: 2 });
    } else if (presetKey === "presetVA") {
      // 阿爾芬速度: B / (mu0^0.5 * mp^0.5 * n^0.5)
      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 5 });
      this.calculator.insertOperator("/");
      this.calculator.insertConstant({ constantId: "mu0", power: 0.5 });
      this.calculator.insertOperator("/");
      this.calculator.insertConstant({ constantId: "mp", power: 0.5 });
      this.calculator.insertOperator("/");
      this.calculator.insertQuantity({ quantityId: "number_density", unitId: "cm_minus3", numberValue: 5, power: 0.5 });
    }

    this.renderTermsList();
    const res = this.calculator.compute();
    this.renderResultBox(res);
  }

  // 更新頂部方程式呈現看板 (支援點選任意位置切換插入點、分式直式槽位與括號層級)
  updateEquationPreview() {
    if (!this.interactiveFormulaContainer) return;

    // 更新歷史復原/重做按鈕狀態
    if (this.btnUndo) this.btnUndo.disabled = !this.calculator.canUndo();
    if (this.btnRedo) this.btnRedo.disabled = !this.calculator.canRedo();

    const isZh = this.currentLang === "zh";
    const eqRep = this.calculator.generateEquationRepresentation();
    const curTarget = this.calculator.cursorTarget;

    this.interactiveFormulaContainer.innerHTML = "";

    // 輔助函式：建立一個插入游標槽位
    const createCaretSlot = (target, isActive) => {
      const slot = document.createElement("div");
      slot.className = `formula-caret-slot ${isActive ? "active" : ""}`;
      slot.title = `點擊切換插入游標至此`;
      slot.addEventListener("click", (e) => {
        e.stopPropagation();
        this.calculator.setCursorTarget(target);
        this.updateEquationPreview();
      });
      return slot;
    };

    // 輔助函式：遞迴渲染 Token 序列 (頂層或分式的分子/分母)
    const renderTokensSequence = (tokens, displayElements, scope, fracId, part, container) => {
      const isCurrentScope = curTarget.scope === scope && (scope === "root" || (curTarget.fractionId === fracId && curTarget.part === part));
      const activeIdx = isCurrentScope ? curTarget.index : -1;

      for (let i = 0; i <= tokens.length; i++) {
        // 游標插入槽位
        const slotTarget = scope === "root"
          ? { scope: "root", index: i }
          : { scope: "fraction", fractionId: fracId, part, index: i };
        container.appendChild(createCaretSlot(slotTarget, activeIdx === i));

        if (i < tokens.length) {
          const t = tokens[i];
          const itemRep = displayElements && displayElements[i] ? displayElements[i] : null;

          if (t.type === "fraction") {
            // 直式分式展示區塊 (包含分子槽位、分數線、分母槽位)
            const fracBlock = document.createElement("div");
            fracBlock.className = "formula-fraction-block";
            fracBlock.id = `formula-token-${t.id}`;

            // 分子槽位
            const numSlot = document.createElement("div");
            const isNumActive = curTarget.scope === "fraction" && curTarget.fractionId === t.id && curTarget.part === "numerator";
            numSlot.className = `fraction-slot fraction-numerator-slot ${t.numerator.length === 0 ? "empty" : ""} ${isNumActive ? "active-slot" : ""}`;
            numSlot.title = "分式分子格 (點擊選取)";

            if (t.numerator.length === 0) {
              const placeholder = document.createElement("span");
              placeholder.className = "fraction-slot-placeholder";
              placeholder.textContent = isZh ? "點此填寫分子" : "Numerator";
              numSlot.appendChild(placeholder);
              numSlot.addEventListener("click", (e) => {
                e.stopPropagation();
                this.calculator.setCursorTarget({ scope: "fraction", fractionId: t.id, part: "numerator", index: 0 });
                this.updateEquationPreview();
              });
            } else {
              const numRep = itemRep && itemRep.numeratorRep ? itemRep.numeratorRep.displayElements : [];
              renderTokensSequence(t.numerator, numRep, "fraction", t.id, "numerator", numSlot);
            }

            // 分數線
            const fLine = document.createElement("div");
            fLine.className = "fraction-line";

            // 分母槽位
            const denSlot = document.createElement("div");
            const isDenActive = curTarget.scope === "fraction" && curTarget.fractionId === t.id && curTarget.part === "denominator";
            denSlot.className = `fraction-slot fraction-denominator-slot ${t.denominator.length === 0 ? "empty" : ""} ${isDenActive ? "active-slot" : ""}`;
            denSlot.title = "分式分母格 (點擊選取)";

            if (t.denominator.length === 0) {
              const placeholder = document.createElement("span");
              placeholder.className = "fraction-slot-placeholder";
              placeholder.textContent = isZh ? "點此填寫分母" : "Denominator";
              denSlot.appendChild(placeholder);
              denSlot.addEventListener("click", (e) => {
                e.stopPropagation();
                this.calculator.setCursorTarget({ scope: "fraction", fractionId: t.id, part: "denominator", index: 0 });
                this.updateEquationPreview();
              });
            } else {
              const denRep = itemRep && itemRep.denominatorRep ? itemRep.denominatorRep.displayElements : [];
              renderTokensSequence(t.denominator, denRep, "fraction", t.id, "denominator", denSlot);
            }

            fracBlock.appendChild(numSlot);
            fracBlock.appendChild(fLine);
            fracBlock.appendChild(denSlot);
            container.appendChild(fracBlock);

          } else {
            // 一般 Token Chip (物理量、常數、獨立運算符、自動層級括號)
            const chip = document.createElement("div");
            chip.className = `formula-token-chip token-${t.type === "quantity" ? "qty" : t.type === "constant" ? "const" : t.type === "operator" ? "op" : "paren"}`;
            chip.title = `點擊定位第 #${i + 1} 項`;

            // KaTeX 渲染：單獨括號晶片使用 chipOpenLatex / chipCloseLatex，絕不出現 \left(
            if (window.katex && itemRep && itemRep.latex) {
              try {
                window.katex.render(itemRep.latex, chip, { throwOnError: false });
              } catch (e) {
                chip.textContent = itemRep.label;
              }
            } else {
              chip.textContent = itemRep ? itemRep.label : t.type;
            }

            chip.addEventListener("click", (e) => {
              e.stopPropagation();
              const nextTarget = scope === "root"
                ? { scope: "root", index: i + 1 }
                : { scope: "fraction", fractionId: fracId, part, index: i + 1 };
              this.calculator.setCursorTarget(nextTarget);
              this.updateEquationPreview();

              const targetCard = document.getElementById(`term-card-${t.id}`);
              if (targetCard) {
                targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                targetCard.style.outline = "2px solid var(--brand-primary)";
                setTimeout(() => { targetCard.style.outline = ""; }, 1200);
              }
            });

            container.appendChild(chip);
          }
        }
      }
    };

    if (this.calculator.tokens.length === 0) {
      const slot = createCaretSlot({ scope: "root", index: 0 }, true);
      const emptyHint = document.createElement("span");
      emptyHint.style.color = "var(--text-muted)";
      emptyHint.style.fontSize = "0.95rem";
      emptyHint.textContent = isZh ? "（算式目前為空，請點擊下方按鈕加入項目或分式）" : "(Expression is empty, click buttons below)";
      this.interactiveFormulaContainer.appendChild(slot);
      this.interactiveFormulaContainer.appendChild(emptyHint);
    } else {
      renderTokensSequence(this.calculator.tokens, eqRep.displayElements, "root", null, null, this.interactiveFormulaContainer);
    }

    // 更新游標位置提示標籤
    if (this.previewCursorHint) {
      if (curTarget.scope === "fraction") {
        const partName = curTarget.part === "numerator" ? (isZh ? "分子" : "Numerator") : (isZh ? "分母" : "Denominator");
        this.previewCursorHint.innerHTML = `
          <span>📌 當前插入位置：<span class="cursor-pos-badge">分式 #${curTarget.fractionId} 之【${partName}】第 ${curTarget.index} 格</span></span>
          <span style="color: var(--text-muted); font-size: 0.8rem;">（點擊公式中任何間隙或分母/分子格即可切換插入目標）</span>
        `;
      } else {
        this.previewCursorHint.innerHTML = `
          <span>📌 當前插入位置：<span class="cursor-pos-badge">頂層第 ${curTarget.index} / ${this.calculator.tokens.length} 項</span></span>
          <span style="color: var(--text-muted); font-size: 0.8rem;">（點擊公式中任何間隙或分母/分子格即可切換插入目標）</span>
        `;
      }
    }

    // 更新因次檢驗狀態
    if (!this.dimStatusBadge) return;

    try {
      if (this.calculator.tokens.length === 0) {
        this.dimStatusBadge.className = "dim-status-badge";
        this.dimStatusBadge.textContent = I18N[this.currentLang].dimReady;
        if (this.mismatchWarningCard) this.mismatchWarningCard.style.display = "none";
        return;
      }

      const res = this.calculator.compute();
      if (res && res.hasError) {
        this.dimStatusBadge.className = "dim-status-badge warning";
        this.dimStatusBadge.textContent = I18N[this.currentLang].dimMismatch;

        if (this.mismatchWarningCard) {
          this.mismatchWarningCard.style.display = "block";
          this.mismatchWarningCard.innerHTML = `
            <div class="mismatch-title">
              <span>⚠️</span>
              <span>${isZh ? res.warningTitleZh : res.warningTitleEn}</span>
            </div>
            <ul class="mismatch-list">
              ${res.mismatchDetails.map(d => `<li>${d}</li>`).join("")}
            </ul>
            <div class="mismatch-advice">
              ${isZh ? res.adviceZh : res.adviceEn}
            </div>
          `;
        }
      } else {
        this.dimStatusBadge.className = "dim-status-badge";
        this.dimStatusBadge.textContent = I18N[this.currentLang].dimConsistent;
        if (this.mismatchWarningCard) this.mismatchWarningCard.style.display = "none";
      }
    } catch (e) {
      this.dimStatusBadge.className = "dim-status-badge warning";
      this.dimStatusBadge.textContent = e.message;
      if (this.mismatchWarningCard) this.mismatchWarningCard.style.display = "none";
    }
  }

  // 渲染下方項目編輯清單 (支援分式結構、括號層級與獨立運算符)
  renderTermsList() {
    if (!this.termsContainer) return;

    this.termsContainer.innerHTML = "";
    const isZh = this.currentLang === "zh";
    const eqRep = this.calculator.generateEquationRepresentation();

    this.calculator.tokens.forEach((term, index) => {
      const card = document.createElement("div");
      card.id = `term-card-${term.id}`;

      // 分支一：獨立運算符卡片
      if (term.type === "operator") {
        card.className = "term-card-operator";
        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="term-idx">#${index + 1}</span>
            <div class="op-switch-group">
              <button type="button" class="btn-op ${term.value === '+' ? 'active' : ''}" data-val="+">＋</button>
              <button type="button" class="btn-op ${term.value === '-' ? 'active' : ''}" data-val="-">－</button>
              <button type="button" class="btn-op ${term.value === '*' ? 'active' : ''}" data-val="*">×</button>
              <button type="button" class="btn-op ${term.value === '/' ? 'active' : ''}" data-val="/">÷</button>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">獨立運算符號</span>
          </div>
          <div class="term-ctrl-btns">
            ${index > 0 ? `<button type="button" class="btn-move btn-move-up" title="往前移">⬆</button>` : ''}
            ${index < this.calculator.tokens.length - 1 ? `<button type="button" class="btn-move btn-move-down" title="往後移">⬇</button>` : ''}
            <button type="button" class="btn-delete" title="刪除此符號">✕</button>
          </div>
        `;

        const opBtns = card.querySelectorAll(".op-switch-group .btn-op");
        opBtns.forEach(b => {
          b.addEventListener("click", () => {
            this.calculator.pushHistory();
            term.value = b.getAttribute("data-val");
            this.renderTermsList();
          });
        });

        const btnUp = card.querySelector(".btn-move-up");
        if (btnUp) {
          btnUp.addEventListener("click", () => {
            this.calculator.moveToken(index, index - 1);
            this.renderTermsList();
          });
        }

        const btnDown = card.querySelector(".btn-move-down");
        if (btnDown) {
          btnDown.addEventListener("click", () => {
            this.calculator.moveToken(index, index + 1);
            this.renderTermsList();
          });
        }

        const btnDel = card.querySelector(".btn-delete");
        if (btnDel) {
          btnDel.addEventListener("click", () => {
            this.calculator.removeTokenAt(index);
            this.renderTermsList();
          });
        }

        this.termsContainer.appendChild(card);
        return;
      }

      // 分支二：分式結構卡片 (分子與分母雙區塊)
      if (term.type === "fraction") {
        card.className = "term-card term-card-fraction";
        card.innerHTML = `
          <div class="term-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="term-idx">#${index + 1}</span>
              <span style="font-weight: 700; color: #3b82f6;">⬚/⬚ 分式結構 (Fraction)</span>
            </div>
            <div class="term-ctrl-btns">
              ${index > 0 ? `<button type="button" class="btn-move btn-move-up" title="往前移">⬆</button>` : ''}
              ${index < this.calculator.tokens.length - 1 ? `<button type="button" class="btn-move btn-move-down" title="往後移">⬇</button>` : ''}
              <button type="button" class="btn-delete" title="刪除此分式">✕</button>
            </div>
          </div>
          <div class="fraction-card-container">
            <!-- 分子區塊 -->
            <div class="fraction-card-section">
              <div class="fraction-card-header">
                <span>【分子 Numerator】 (${term.numerator.length} 項)</span>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm btn-frac-add-qty" data-part="numerator">＋ 物理量</button>
                  <button type="button" class="btn btn-secondary btn-sm btn-frac-add-const" data-part="numerator">＋ 常數</button>
                </div>
              </div>
              <div class="fraction-subitems-list" id="frac-num-list-${term.id}">
                ${term.numerator.length === 0 ? `<span style="font-size: 0.8rem; color: var(--text-muted);">（分子為空，點擊上方按鈕或公式看板中的分子格加入）</span>` : ''}
              </div>
            </div>

            <!-- 分母區塊 -->
            <div class="fraction-card-section">
              <div class="fraction-card-header">
                <span>【分母 Denominator】 (${term.denominator.length} 項)</span>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm btn-frac-add-qty" data-part="denominator">＋ 物理量</button>
                  <button type="button" class="btn btn-secondary btn-sm btn-frac-add-const" data-part="denominator">＋ 常數</button>
                </div>
              </div>
              <div class="fraction-subitems-list" id="frac-den-list-${term.id}">
                ${term.denominator.length === 0 ? `<span style="font-size: 0.8rem; color: var(--text-muted);">（分母為空，點擊上方按鈕或公式看板中的分母格加入）</span>` : ''}
              </div>
            </div>

            <!-- 分式整體係數與次方 -->
            <div style="display: flex; gap: 1rem; align-items: center; padding-top: 0.25rem;">
              <div class="form-group flex-half">
                <label class="form-label">${isZh ? '分式整體係數' : 'Multiplier'}</label>
                <input type="number" step="any" class="form-input term-frac-mult-input" value="${term.multiplier !== undefined ? term.multiplier : 1}">
              </div>
              <div class="form-group flex-half">
                <label class="form-label">${isZh ? '分式整體次方' : 'Power'}</label>
                <input type="number" step="any" class="form-input term-frac-pwr-input" value="${term.power !== undefined ? term.power : 1}">
              </div>
            </div>
          </div>
        `;

        // 綁定分式控制
        const btnUp = card.querySelector(".btn-move-up");
        if (btnUp) {
          btnUp.addEventListener("click", () => {
            this.calculator.moveToken(index, index - 1);
            this.renderTermsList();
          });
        }
        const btnDown = card.querySelector(".btn-move-down");
        if (btnDown) {
          btnDown.addEventListener("click", () => {
            this.calculator.moveToken(index, index + 1);
            this.renderTermsList();
          });
        }
        const btnDel = card.querySelector(".btn-delete");
        if (btnDel) {
          btnDel.addEventListener("click", () => {
            this.calculator.removeTokenAt(index);
            this.renderTermsList();
          });
        }

        // 分子/分母新增按鈕
        card.querySelectorAll(".btn-frac-add-qty").forEach(btn => {
          btn.addEventListener("click", () => {
            const part = btn.getAttribute("data-part");
            this.calculator.insertQuantity({}, { scope: "fraction", fractionId: term.id, part, index: (part === "numerator" ? term.numerator.length : term.denominator.length) });
            this.renderTermsList();
          });
        });

        card.querySelectorAll(".btn-frac-add-const").forEach(btn => {
          btn.addEventListener("click", () => {
            const part = btn.getAttribute("data-part");
            this.calculator.insertConstant({}, { scope: "fraction", fractionId: term.id, part, index: (part === "numerator" ? term.numerator.length : term.denominator.length) });
            this.renderTermsList();
          });
        });

        // 係數與次方輸入
        const multInput = card.querySelector(".term-frac-mult-input");
        if (multInput) {
          multInput.addEventListener("input", () => {
            this.calculator.pushHistory();
            term.multiplier = parseFloat(multInput.value) || 1;
            this.updateEquationPreview();
          });
        }

        const pwrInput = card.querySelector(".term-frac-pwr-input");
        if (pwrInput) {
          pwrInput.addEventListener("input", () => {
            this.calculator.pushHistory();
            term.power = parseFloat(pwrInput.value) || 1;
            this.updateEquationPreview();
          });
        }

        this.termsContainer.appendChild(card);
        return;
      }

      // 分支三：開括號卡片 (依層級自動變換為小中大括號)
      if (term.type === "open_paren") {
        const repItem = eqRep.displayElements && eqRep.displayElements[index];
        const bStyle = repItem && repItem.bracketInfo ? repItem.bracketInfo : { nameZh: "小括號 ( )", openText: "(" };
        card.className = "term-card term-card-paren";
        card.innerHTML = `
          <div class="term-header">
            <span class="term-idx">#${index + 1}</span>
            <div class="term-ctrl-btns">
              ${index > 0 ? `<button type="button" class="btn-move btn-move-up" title="往前移">⬆</button>` : ''}
              ${index < this.calculator.tokens.length - 1 ? `<button type="button" class="btn-move btn-move-down" title="往後移">⬇</button>` : ''}
              <button type="button" class="btn-delete" title="刪除此括號">✕</button>
            </div>
          </div>
          <div style="display: flex; align-items: center; padding: 0.25rem 0;">
            <span class="paren-symbol-badge">${bStyle.openText}</span>
            <span class="paren-desc-text">${isZh ? `開括號：${bStyle.nameZh}（依巢狀深度自動變換）` : `Open Bracket: ${bStyle.nameZh}`}</span>
          </div>
        `;

        const btnUp = card.querySelector(".btn-move-up");
        if (btnUp) {
          btnUp.addEventListener("click", () => {
            this.calculator.moveToken(index, index - 1);
            this.renderTermsList();
          });
        }
        const btnDown = card.querySelector(".btn-move-down");
        if (btnDown) {
          btnDown.addEventListener("click", () => {
            this.calculator.moveToken(index, index + 1);
            this.renderTermsList();
          });
        }
        const btnDel = card.querySelector(".btn-delete");
        if (btnDel) {
          btnDel.addEventListener("click", () => {
            this.calculator.removeTokenAt(index);
            this.renderTermsList();
          });
        }

        this.termsContainer.appendChild(card);
        return;
      }

      // 分支四：閉括號卡片 (依層級自動變換為小中大括號)
      if (term.type === "close_paren") {
        const repItem = eqRep.displayElements && eqRep.displayElements[index];
        const bStyle = repItem && repItem.bracketInfo ? repItem.bracketInfo : { nameZh: "小括號 ( )", closeText: ")" };
        card.className = "term-card term-card-paren";
        card.innerHTML = `
          <div class="term-header">
            <span class="term-idx">#${index + 1}</span>
            <div class="term-ctrl-btns">
              ${index > 0 ? `<button type="button" class="btn-move btn-move-up" title="往前移">⬆</button>` : ''}
              ${index < this.calculator.tokens.length - 1 ? `<button type="button" class="btn-move btn-move-down" title="往後移">⬇</button>` : ''}
              <button type="button" class="btn-delete" title="刪除此括號">✕</button>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding: 0.25rem 0;">
            <div style="display: flex; align-items: center;">
              <span class="paren-symbol-badge">${bStyle.closeText}</span>
              <span class="paren-desc-text">${isZh ? `閉括號：${bStyle.nameZh}（可指定整體次方）` : `Close Bracket: ${bStyle.nameZh}`}</span>
            </div>
            <div class="form-group flex-half" style="min-width: 120px;">
              <label class="form-label">${isZh ? '括號次方' : 'Power'}</label>
              <input type="number" step="any" class="form-input term-paren-power-input" value="${term.power !== undefined ? term.power : 1}">
            </div>
          </div>
        `;

        const btnUp = card.querySelector(".btn-move-up");
        if (btnUp) {
          btnUp.addEventListener("click", () => {
            this.calculator.moveToken(index, index - 1);
            this.renderTermsList();
          });
        }
        const btnDown = card.querySelector(".btn-move-down");
        if (btnDown) {
          btnDown.addEventListener("click", () => {
            this.calculator.moveToken(index, index + 1);
            this.renderTermsList();
          });
        }
        const btnDel = card.querySelector(".btn-delete");
        if (btnDel) {
          btnDel.addEventListener("click", () => {
            this.calculator.removeTokenAt(index);
            this.renderTermsList();
          });
        }

        const pwrInput = card.querySelector(".term-paren-power-input");
        if (pwrInput) {
          pwrInput.addEventListener("input", () => {
            this.calculator.pushHistory();
            term.power = parseFloat(pwrInput.value) || 1;
            this.updateEquationPreview();
          });
        }

        this.termsContainer.appendChild(card);
        return;
      }

      // 分支五：一般物理量或常數項目卡片
      card.className = "term-card";

      let itemSelectHtml = "";
      let unitSelectHtml = "";

      if (term.type === "quantity") {
        const qDef = this.calculator.getQuantityDef(term.quantityId);
        itemSelectHtml = `
          <select class="term-qty-select form-select">
            ${PHYSICAL_QUANTITIES.map(q => `
              <option value="${q.id}" ${q.id === term.quantityId ? "selected" : ""}>
                ${isZh ? q.nameZh : q.nameEn} (${q.symbol})
              </option>
            `).join("")}
          </select>
        `;

        unitSelectHtml = `
          <select class="term-unit-select form-select">
            ${qDef.units.map(u => `
              <option value="${u.id}" ${u.id === term.unitId ? "selected" : ""}>
                ${u.label} [${u.system}]
              </option>
            `).join("")}
          </select>
        `;
      } else if (term.type === "constant") {
        itemSelectHtml = `
          <select class="term-const-select form-select">
            ${Object.values(PHYSICAL_CONSTANTS).map(c => `
              <option value="${c.id}" ${c.id === term.constantId ? "selected" : ""}>
                ${c.symbol} - ${isZh ? c.nameZh : c.nameEn} (${c.desc})
              </option>
            `).join("")}
          </select>
        `;
        unitSelectHtml = `<span class="const-unit-badge">${this.calculator.getConstantDef(term.constantId).unit}</span>`;
      }

      card.innerHTML = `
        <div class="term-header">
          <span class="term-idx">#${index + 1}</span>
          <div class="term-ctrl-btns">
            ${index > 0 ? `<button type="button" class="btn-move btn-move-up" title="往前移">⬆</button>` : ''}
            ${index < this.calculator.tokens.length - 1 ? `<button type="button" class="btn-move btn-move-down" title="往後移">⬇</button>` : ''}
            <button type="button" class="btn-delete" title="刪除此項">✕</button>
          </div>
        </div>
        <div class="term-body">
          <div class="form-group flex-2">
            <label class="form-label">${isZh ? '物理量 / 常數' : 'Quantity / Constant'}</label>
            ${itemSelectHtml}
          </div>
          ${term.type === 'quantity' ? `
          <div class="form-group flex-1">
            <label class="form-label">${isZh ? '數值' : 'Value'}</label>
            <input type="number" step="any" class="form-input term-value-input" value="${term.numberValue}">
          </div>
          ` : ''}
          <div class="form-group flex-1">
            <label class="form-label">${isZh ? '單位 / 符號' : 'Unit'}</label>
            ${unitSelectHtml}
          </div>
          <div class="form-group flex-half">
            <label class="form-label">${isZh ? '係數' : 'Coeff'}</label>
            <input type="number" step="any" class="form-input term-mult-input" value="${term.multiplier}">
          </div>
          <div class="form-group flex-half">
            <label class="form-label">${isZh ? '次方' : 'Power'}</label>
            <input type="number" step="any" class="form-input term-power-input" value="${term.power}">
          </div>
        </div>
      `;

      const btnUp = card.querySelector(".btn-move-up");
      if (btnUp) {
        btnUp.addEventListener("click", () => {
          this.calculator.moveToken(index, index - 1);
          this.renderTermsList();
        });
      }
      const btnDown = card.querySelector(".btn-move-down");
      if (btnDown) {
        btnDown.addEventListener("click", () => {
          this.calculator.moveToken(index, index + 1);
          this.renderTermsList();
        });
      }
      const btnDel = card.querySelector(".btn-delete");
      if (btnDel) {
        btnDel.addEventListener("click", () => {
          this.calculator.removeTokenAt(index);
          this.renderTermsList();
        });
      }

      if (term.type === "quantity") {
        const qtySelect = card.querySelector(".term-qty-select");
        if (qtySelect) {
          qtySelect.addEventListener("change", () => {
            this.calculator.pushHistory();
            term.quantityId = qtySelect.value;
            const newQ = this.calculator.getQuantityDef(term.quantityId);
            term.unitId = newQ.units[0].id;
            this.renderTermsList();
          });
        }

        const unitSelect = card.querySelector(".term-unit-select");
        if (unitSelect) {
          unitSelect.addEventListener("change", () => {
            this.calculator.pushHistory();
            term.unitId = unitSelect.value;
            this.updateEquationPreview();
          });
        }

        const valInput = card.querySelector(".term-value-input");
        if (valInput) {
          valInput.addEventListener("input", () => {
            this.calculator.pushHistory();
            term.numberValue = parseFloat(valInput.value) || 0;
            this.updateEquationPreview();
          });
        }
      } else if (term.type === "constant") {
        const constSelect = card.querySelector(".term-const-select");
        if (constSelect) {
          constSelect.addEventListener("change", () => {
            this.calculator.pushHistory();
            term.constantId = constSelect.value;
            this.renderTermsList();
          });
        }
      }

      const multInput = card.querySelector(".term-mult-input");
      if (multInput) {
        multInput.addEventListener("input", () => {
          this.calculator.pushHistory();
          term.multiplier = parseFloat(multInput.value) || 1;
          this.updateEquationPreview();
        });
      }

      const powerInput = card.querySelector(".term-power-input");
      if (powerInput) {
        powerInput.addEventListener("input", () => {
          this.calculator.pushHistory();
          term.power = parseFloat(powerInput.value) || 1;
          this.updateEquationPreview();
        });
      }

      this.termsContainer.appendChild(card);
    });

    this.updateEquationPreview();
  }

  renderResultBox(res) {
    if (!this.resultOutputBox) return;

    if (!res) {
      this.resultOutputBox.innerHTML = `
        <div class="empty-state">
          ${I18N[this.currentLang].resultPlaceholder}
        </div>
      `;
      return;
    }

    const isZh = this.currentLang === "zh";

    if (res.hasError) {
      this.resultOutputBox.innerHTML = `
        <div class="mismatch-warning-card" style="margin-bottom: 0;">
          <div class="mismatch-title">
            <span>⚠️</span>
            <span>${isZh ? res.warningTitleZh : res.warningTitleEn}</span>
          </div>
          <ul class="mismatch-list">
            ${res.mismatchDetails.map(d => `<li>${d}</li>`).join("")}
          </ul>
          <div class="mismatch-advice">
            ${isZh ? res.adviceZh : res.adviceEn}
          </div>
        </div>
      `;
      return;
    }

    const formattedVal = Math.abs(res.value) < 1e-3 || Math.abs(res.value) >= 1e5
      ? res.value.toExponential(4)
      : res.value.toLocaleString(undefined, { maximumFractionDigits: 4 });

    const rawSIFormatted = Math.abs(res.rawSI) < 1e-3 || Math.abs(res.rawSI) >= 1e5
      ? res.rawSI.toExponential(4)
      : res.rawSI.toLocaleString(undefined, { maximumFractionDigits: 4 });

    let unitsListHtml = "";
    if (res.allUnits && res.allUnits.length > 0) {
      unitsListHtml = `
        <div class="alt-units-grid">
          ${res.allUnits.map(u => {
            const v = Math.abs(u.value) < 1e-3 || Math.abs(u.value) >= 1e5 ? u.value.toExponential(4) : u.value.toLocaleString(undefined, { maximumFractionDigits: 4 });
            return `
              <div class="alt-unit-pill ${u.system === res.system ? 'active' : ''}">
                <span class="unit-system">[${u.system}]</span>
                <span class="unit-val">${v}</span>
                <span class="unit-name">${u.label}</span>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    let groupsBreakdownHtml = "";
    if (res.groups && res.groups.length > 1) {
      groupsBreakdownHtml = `
        <div style="margin: 1rem 0; font-size: 0.85rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <div style="font-weight: 600; margin-bottom: 0.4rem; color: var(--text-secondary);">多項式各項計算貢獻分解：</div>
          ${res.groups.map(g => {
            const signStr = g.sign === "-" ? "－ " : "＋ ";
            const valStr = Math.abs(g.valueSI) < 1e-3 || Math.abs(g.valueSI) >= 1e5 ? g.valueSI.toExponential(4) : g.valueSI.toLocaleString(undefined, { maximumFractionDigits: 4 });
            const qName = g.matchedQuantity ? (isZh ? g.matchedQuantity.nameZh : g.matchedQuantity.nameEn) : g.dimensionStr;
            return `
              <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; color: var(--text-muted);">
                <span>${signStr}項 #${g.groupIndex} (${g.symbolExpression}) [${qName}]</span>
                <code>${valStr} SI</code>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    this.resultOutputBox.innerHTML = `
      <div class="calc-result-header">
        <div class="matched-quantity">
          <span class="badge-system">${res.system} 制輸出</span>
          <h3>${isZh ? res.quantityNameZh : res.quantityNameEn}</h3>
        </div>
        <div class="dimension-tag">
          因次維度: <code>${res.dimensionStr}</code>
        </div>
      </div>

      <div class="calc-main-value">
        <span class="number-display">${formattedVal}</span>
        <span class="unit-display">${res.unitLabel}</span>
      </div>

      <div class="calc-si-ref">
        SI 基本制等值：<code>${rawSIFormatted} ${res.baseUnitSI}</code>
      </div>

      ${groupsBreakdownHtml}
      ${unitsListHtml}

      <div class="result-actions">
        <button type="button" class="btn btn-outline" id="btn-copy-result">
          📋 ${I18N[this.currentLang].btnCopy}
        </button>
      </div>
    `;

    const copyBtn = document.getElementById("btn-copy-result");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(`${formattedVal} ${res.unitLabel}`);
        copyBtn.textContent = `✓ ${I18N[this.currentLang].copied}`;
        setTimeout(() => {
          copyBtn.textContent = `📋 ${I18N[this.currentLang].btnCopy}`;
        }, 2000);
      });
    }
  }

  // -------------------------
  // 分頁二：查找單位與換算
  // -------------------------
  renderLookupTab() {
    if (!this.catSelect) return;
    const isZh = this.currentLang === "zh";

    this.catSelect.innerHTML = `
      <option value="all">${I18N[this.currentLang].allCats}</option>
      ${QUANTITY_CATEGORIES.map(c => `
        <option value="${c.id}">${isZh ? c.nameZh : c.nameEn}</option>
      `).join("")}
    `;

    this.filterQuantitiesByCategory("all");
    this.renderQuantityDetail();
  }

  filterQuantitiesByCategory(catId) {
    if (!this.qtySelect) return;
    const isZh = this.currentLang === "zh";
    const filtered = catId === "all"
      ? PHYSICAL_QUANTITIES
      : PHYSICAL_QUANTITIES.filter(q => q.category === catId);

    this.qtySelect.innerHTML = filtered.map(q => `
      <option value="${q.id}">
        ${isZh ? q.nameZh : q.nameEn} (${q.symbol})
      </option>
    `).join("");

    if (filtered.length > 0) {
      this.selectedQuantity = filtered[0];
      this.qtySelect.value = filtered[0].id;
      this.renderQuantityDetail();
    }
  }

  searchQuantities(keyword) {
    if (!this.qtySelect) return;
    const isZh = this.currentLang === "zh";
    const kw = keyword.trim().toLowerCase();
    if (!kw) {
      this.filterQuantitiesByCategory(this.catSelect ? this.catSelect.value : "all");
      return;
    }

    const matches = PHYSICAL_QUANTITIES.filter(q => {
      return q.nameZh.toLowerCase().includes(kw) ||
             q.nameEn.toLowerCase().includes(kw) ||
             q.symbol.toLowerCase().includes(kw) ||
             q.units.some(u => u.label.toLowerCase().includes(kw) || u.id.toLowerCase().includes(kw));
    });

    this.qtySelect.innerHTML = matches.map(q => `
      <option value="${q.id}">
        ${isZh ? q.nameZh : q.nameEn} (${q.symbol})
      </option>
    `).join("");

    if (matches.length > 0) {
      this.selectedQuantity = matches[0];
      this.renderQuantityDetail();
    }
  }

  renderQuantityDetail() {
    const q = this.selectedQuantity;
    if (!q) return;

    const isZh = this.currentLang === "zh";
    const descBox = document.getElementById("lookup-desc-box");
    if (descBox) {
      descBox.textContent = isZh ? q.descZh : q.descEn;
    }

    if (this.unitSpecTable) {
      this.unitSpecTable.innerHTML = q.units.map(u => `
        <tr>
          <td><span class="badge-system badge-${u.system.toLowerCase()}">${u.system}</span></td>
          <td><strong>${u.label}</strong></td>
          <td><code>${u.toBaseSI >= 1e-3 && u.toBaseSI <= 1e4 ? u.toBaseSI : u.toBaseSI.toExponential()} ${q.baseUnitSI}</code></td>
          <td>${u.desc}</td>
        </tr>
      `).join("");
    }

    if (this.convFromUnit && this.convToUnit) {
      this.convFromUnit.innerHTML = q.units.map(u => `<option value="${u.id}">${u.label}</option>`).join("");
      this.convToUnit.innerHTML = q.units.map(u => `<option value="${u.id}">${u.label}</option>`).join("");

      if (q.units.length > 1) {
        this.convToUnit.selectedIndex = 1;
      }

      this.updateConversion();
    }
  }

  updateConversion() {
    const q = this.selectedQuantity;
    if (!q || !this.convInputVal || !this.convFromUnit || !this.convToUnit) return;

    const val = parseFloat(this.convInputVal.value) || 0;
    const fromUnit = q.units.find(u => u.id === this.convFromUnit.value) || q.units[0];
    const toUnit = q.units.find(u => u.id === this.convToUnit.value) || q.units[0];

    const valSI = val * fromUnit.toBaseSI;
    const converted = valSI / toUnit.toBaseSI;
    const factor = fromUnit.toBaseSI / toUnit.toBaseSI;

    const formattedVal = Math.abs(converted) < 1e-4 || Math.abs(converted) >= 1e6
      ? converted.toExponential(5)
      : converted.toLocaleString(undefined, { maximumFractionDigits: 5 });

    const factorStr = Math.abs(factor) < 1e-3 || Math.abs(factor) >= 1e5
      ? factor.toExponential(5)
      : factor.toString();

    if (this.convResultDisplay) {
      this.convResultDisplay.textContent = `${formattedVal} ${toUnit.id}`;
    }
    if (this.convFactorDisplay) {
      this.convFactorDisplay.innerHTML = `1 ${fromUnit.id} = <strong>${factorStr}</strong> ${toUnit.id} (數值乘以 ${factorStr})`;
    }
  }

  // -------------------------
  // 分頁三：太空物理方程式
  // -------------------------
  renderEquationsTab() {
    if (!this.eqCatSelect) return;
    const isZh = this.currentLang === "zh";

    this.eqCatSelect.innerHTML = `
      <option value="all">${I18N[this.currentLang].allEqCats}</option>
      ${EQUATION_CATEGORIES.map(c => `
        <option value="${c.id}">${isZh ? c.nameZh : c.nameEn}</option>
      `).join("")}
    `;

    this.filterEquationsByCategory("all");
    this.renderEquationDetail();
  }

  filterEquationsByCategory(catId) {
    if (!this.eqSelect) return;
    const isZh = this.currentLang === "zh";
    const filtered = catId === "all"
      ? EQUATIONS_DATABASE
      : EQUATIONS_DATABASE.filter(e => e.category === catId);

    this.eqSelect.innerHTML = filtered.map(e => `
      <option value="${e.id}">${isZh ? e.nameZh : e.nameEn}</option>
    `).join("");

    if (filtered.length > 0) {
      this.selectedEquation = filtered[0];
      this.eqSelect.value = filtered[0].id;
      this.renderEquationDetail();
    }
  }

  searchEquations(keyword) {
    if (!this.eqSelect) return;
    const isZh = this.currentLang === "zh";
    const kw = keyword.trim().toLowerCase();
    if (!kw) {
      this.filterEquationsByCategory(this.eqCatSelect ? this.eqCatSelect.value : "all");
      return;
    }

    const matches = EQUATIONS_DATABASE.filter(e => {
      return e.nameZh.toLowerCase().includes(kw) ||
             e.nameEn.toLowerCase().includes(kw) ||
             e.formulaLatex.toLowerCase().includes(kw);
    });

    this.eqSelect.innerHTML = matches.map(e => `
      <option value="${e.id}">${isZh ? e.nameZh : e.nameEn}</option>
    `).join("");

    if (matches.length > 0) {
      this.selectedEquation = matches[0];
      this.renderEquationDetail();
    }
  }

  renderEquationDetail() {
    const eq = this.selectedEquation;
    if (!eq) return;

    const isZh = this.currentLang === "zh";
    const formulaEl = document.getElementById("eq-formula-display");

    if (window.katex && eq.formulaLatex && formulaEl) {
      try {
        window.katex.render(eq.formulaLatex, formulaEl, {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        formulaEl.textContent = eq.formulaLatex;
      }
    } else if (formulaEl) {
      formulaEl.textContent = eq.formulaLatex;
    }

    const descEl = document.getElementById("eq-desc-display");
    if (descEl) {
      descEl.textContent = isZh ? eq.descZh : eq.descEn;
    }

    if (!this.eqInputsContainer) return;

    this.eqInputsContainer.innerHTML = "";

    eq.inputs.forEach(input => {
      const row = document.createElement("div");
      row.className = "form-row eq-param-row";

      if (input.type === "select") {
        row.innerHTML = `
          <div class="form-group flex-2">
            <label class="form-label">${isZh ? input.nameZh : input.nameEn}</label>
            <select class="form-select eq-param-input" data-param="${input.id}">
              ${input.options.map(opt => `
                <option value="${opt.value}" ${opt.value === input.default ? "selected" : ""}>
                  ${isZh ? opt.labelZh : opt.labelEn}
                </option>
              `).join("")}
            </select>
          </div>
        `;
      } else {
        const qDef = input.unitCategory ? PHYSICAL_QUANTITIES.find(q => q.id === input.unitCategory) : null;
        let unitSelectHtml = "";
        if (qDef) {
          unitSelectHtml = `
            <div class="form-group flex-1">
              <label class="form-label">${isZh ? '單位' : 'Unit'}</label>
              <select class="form-select eq-param-unit" data-param="${input.id}">
                ${qDef.units.map(u => `
                  <option value="${u.id}" ${u.id === input.defaultUnit ? "selected" : ""}>
                    ${u.label}
                  </option>
                `).join("")}
              </select>
            </div>
          `;
        }

        row.innerHTML = `
          <div class="form-group flex-2">
            <label class="form-label">${isZh ? input.nameZh : input.nameEn}</label>
            <input type="number" step="any" class="form-input eq-param-input" data-param="${input.id}" value="${input.default}">
          </div>
          ${unitSelectHtml}
        `;
      }

      this.eqInputsContainer.appendChild(row);
    });

    this.computeCurrentEquation();
  }

  computeCurrentEquation() {
    const eq = this.selectedEquation;
    if (!eq || !this.eqInputsContainer) return;

    const isZh = this.currentLang === "zh";
    const inputs = {};
    const units = {};

    try {
      eq.inputs.forEach(param => {
        if (param.type === "select") {
          const selectEl = this.eqInputsContainer.querySelector(`.eq-param-input[data-param="${param.id}"]`);
          const chosen = param.options.find(o => o.value === (selectEl ? selectEl.value : param.default));
          inputs[param.id] = chosen;
        } else {
          const inputEl = this.eqInputsContainer.querySelector(`.eq-param-input[data-param="${param.id}"]`);
          inputs[param.id] = inputEl ? (parseFloat(inputEl.value) || 0) : (param.default || 0);

          if (param.unitCategory) {
            const unitEl = this.eqInputsContainer.querySelector(`.eq-param-unit[data-param="${param.id}"]`);
            const qDef = PHYSICAL_QUANTITIES.find(q => q.id === param.unitCategory);
            const uDef = qDef ? qDef.units.find(u => u.id === (unitEl ? unitEl.value : param.defaultUnit)) : null;
            units[param.id] = uDef;
          }
        }
      });

      const outputs = eq.calculate(inputs, units);
      this.renderEquationOutputs(outputs);
    } catch (err) {
      if (this.eqResultBox) {
        this.eqResultBox.innerHTML = `
          <div class="calc-error">⚠️ ${err.message}</div>
        `;
      }
    }
  }

  renderEquationOutputs(outputs) {
    if (!this.eqResultBox) return;
    const isZh = this.currentLang === "zh";

    this.eqResultBox.innerHTML = `
      <div class="eq-outputs-grid">
        ${outputs.map(out => {
          const formatted = Math.abs(out.value) < 1e-3 || Math.abs(out.value) >= 1e6
            ? out.value.toExponential(4)
            : out.value.toLocaleString(undefined, { maximumFractionDigits: 4 });

          let altHtml = "";
          if (out.altUnits && out.altUnits.length > 0) {
            altHtml = `
              <div class="eq-alt-units">
                ${out.altUnits.map(a => {
                  const av = Math.abs(a.value) < 1e-3 || Math.abs(a.value) >= 1e6
                    ? a.value.toExponential(4)
                    : a.value.toLocaleString(undefined, { maximumFractionDigits: 4 });
                  return `<span>= <strong>${av}</strong> ${a.label}</span>`;
                }).join(" ")}
              </div>
            `;
          }

          return `
            <div class="eq-output-card">
              <div class="eq-out-label">${isZh ? out.labelZh : out.labelEn}</div>
              <div class="eq-out-value">
                <span class="val">${formatted}</span>
                <span class="unit">${out.unit}</span>
              </div>
              ${altHtml}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
}

// 應用程式初始化
document.addEventListener("DOMContentLoaded", () => {
  window.app = new SpacePlasmaApp();
});
