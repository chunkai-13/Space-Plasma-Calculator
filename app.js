/**
 * app.js - 主應用程式互動邏輯、多語系、深色模式與分頁控制器
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
    builderDesc: "自由組合物理量與常數，設定分子、分母、係數與次方量進行計算。",
    btnAddQty: "＋ 新增物理量",
    btnAddConst: "＋ 插入常用常數",
    btnClear: "清空項目",
    presetLabel: "快速帶入經典範例：",
    presetPB: "磁壓力 (B² / 2μ₀)",
    presetBeta: "電漿 Beta (nkT / P_B)",
    presetVA: "阿爾芬速度 (B / √(μ₀ ρ))",
    btnEqual: "＝ 計算結果",
    resultTitle: "計算結果輸出",
    resultPlaceholder: "請於上方新增項目後，點擊「＝ 計算結果」按鈕。",
    outputSystem: "輸出制度：",
    sysSpace: "太空常用制 (Space)",
    sysSI: "國際單位制 (SI)",
    sysCGS: "高斯制 (CGS)",
    btnCopy: "複製數值",
    copied: "已複製！",
    termNumerator: "分子",
    termDenominator: "分母",
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
    builderDesc: "Combine physical quantities, constants, exponents, and numerators/denominators.",
    btnAddQty: "+ Add Quantity",
    btnAddConst: "+ Insert Constant",
    btnClear: "Clear All",
    presetLabel: "Quick Presets:",
    presetPB: "Magnetic Pressure (B² / 2μ₀)",
    presetBeta: "Plasma Beta (nkT / P_B)",
    presetVA: "Alfvén Speed (B / √(μ₀ ρ))",
    btnEqual: "= Compute Result",
    resultTitle: "Calculation Output",
    resultPlaceholder: "Add terms above and click '= Compute Result'.",
    outputSystem: "Output System:",
    sysSpace: "Space Units",
    sysSI: "SI Units",
    sysCGS: "CGS Units",
    btnCopy: "Copy Value",
    copied: "Copied!",
    termNumerator: "Num",
    termDenominator: "Denom",
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
    this.btnClearTerms = document.getElementById("btn-clear-terms");
    this.btnEqual = document.getElementById("btn-equal");
    this.resultOutputBox = document.getElementById("result-output-box");
    this.sysRadios = document.querySelectorAll("input[name='display-system']");

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
    this.eqFormulaCard = document.getElementById("eq-formula-card");
    this.eqInputsContainer = document.getElementById("eq-inputs-container");
    this.btnComputeEq = document.getElementById("btn-compute-eq");
    this.eqResultBox = document.getElementById("eq-result-box");
  }

  bindEvents() {
    // 分頁切換
    this.tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        this.switchTab(targetTab);
      });
    });

    // 主題與語言
    this.themeToggleBtn.addEventListener("click", () => {
      this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
      this.applyTheme(this.currentTheme);
    });

    this.langToggleBtn.addEventListener("click", () => {
      this.currentLang = this.currentLang === "zh" ? "en" : "zh";
      this.applyLanguage(this.currentLang);
    });

    // 分頁一事件
    this.btnAddQty.addEventListener("click", () => {
      this.calculator.addTerm({ type: "quantity" });
      this.renderTermsList();
    });

    this.btnAddConst.addEventListener("click", () => {
      this.calculator.addTerm({ type: "constant" });
      this.renderTermsList();
    });

    this.btnClearTerms.addEventListener("click", () => {
      this.calculator.clear();
      this.renderTermsList();
      this.renderResultBox(null);
    });

    this.btnEqual.addEventListener("click", () => {
      try {
        const res = this.calculator.compute();
        this.renderResultBox(res);
      } catch (err) {
        alert(err.message);
      }
    });

    this.sysRadios.forEach(radio => {
      radio.addEventListener("change", (e) => {
        const sys = e.target.value;
        const res = this.calculator.formatResult(sys);
        this.renderResultBox(res);
      });
    });

    // 預設快速按鈕
    document.querySelectorAll(".preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const presetKey = btn.getAttribute("data-preset");
        this.loadPreset(presetKey);
      });
    });

    // 分頁二：單位查詢與換算
    this.catSelect.addEventListener("change", () => {
      this.filterQuantitiesByCategory(this.catSelect.value);
    });

    this.qtySelect.addEventListener("change", () => {
      const q = PHYSICAL_QUANTITIES.find(x => x.id === this.qtySelect.value);
      if (q) {
        this.selectedQuantity = q;
        this.renderQuantityDetail();
      }
    });

    this.lookupSearch.addEventListener("input", () => {
      this.searchQuantities(this.lookupSearch.value);
    });

    this.convInputVal.addEventListener("input", () => this.updateConversion());
    this.convFromUnit.addEventListener("change", () => this.updateConversion());
    this.convToUnit.addEventListener("change", () => this.updateConversion());

    // 分頁三：方程式
    this.eqCatSelect.addEventListener("change", () => {
      this.filterEquationsByCategory(this.eqCatSelect.value);
    });

    this.eqSelect.addEventListener("change", () => {
      const eq = EQUATIONS_DATABASE.find(e => e.id === this.eqSelect.value);
      if (eq) {
        this.selectedEquation = eq;
        this.renderEquationDetail();
      }
    });

    this.eqSearch.addEventListener("input", () => {
      this.searchEquations(this.eqSearch.value);
    });

    this.btnComputeEq.addEventListener("click", () => {
      this.computeCurrentEquation();
    });
  }

  // 切換分頁
  switchTab(tabId) {
    this.tabBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-tab") === tabId));
    this.tabContents.forEach(c => c.classList.toggle("active", c.id === `tab-${tabId}`));
  }

  // 主題控制
  applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      this.themeToggleBtn.innerHTML = `<span class="icon">☀️</span> <span class="theme-text">${I18N[this.currentLang].lightMode}</span>`;
    } else {
      document.documentElement.classList.remove("dark");
      this.themeToggleBtn.innerHTML = `<span class="icon">🌙</span> <span class="theme-text">${I18N[this.currentLang].darkMode}</span>`;
    }
    localStorage.setItem("sp_theme", theme);
  }

  // 多語系控制
  applyLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem("sp_lang", lang);
    const dict = I18N[lang];

    // 更新常規靜態文字
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

    this.langToggleBtn.textContent = dict.langName;
    this.applyTheme(this.currentTheme); // 更新主題按鈕文字

    // 重新渲染動態組件
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
      // 磁壓力: B^2 / (2 * mu0)
      // 第 1 項: 磁場 B = 10 nT, 分子, 2 次方
      this.calculator.addTerm({
        type: "quantity",
        quantityId: "magnetic_field",
        unitId: "nT",
        numberValue: 10,
        multiplier: 1,
        position: "numerator",
        power: 2
      });
      // 第 2 項: 真空磁導率 mu0, 分母, 1 次方, 係數 2
      this.calculator.addTerm({
        type: "constant",
        constantId: "mu0",
        multiplier: 2,
        position: "denominator",
        power: 1
      });
    } else if (presetKey === "presetBeta") {
      // 電漿 Beta: nkT / (B^2 / 2mu0)
      this.calculator.addTerm({
        type: "quantity",
        quantityId: "number_density",
        unitId: "cm_minus3",
        numberValue: 5,
        position: "numerator",
        power: 1
      });
      this.calculator.addTerm({
        type: "quantity",
        quantityId: "temperature",
        unitId: "eV",
        numberValue: 15,
        position: "numerator",
        power: 1
      });
      this.calculator.addTerm({
        type: "constant",
        constantId: "kB",
        position: "numerator",
        power: 1
      });
      this.calculator.addTerm({
        type: "quantity",
        quantityId: "magnetic_field",
        unitId: "nT",
        numberValue: 10,
        position: "denominator",
        power: 2
      });
      this.calculator.addTerm({
        type: "constant",
        constantId: "mu0",
        multiplier: 2,
        position: "numerator", // 乘在分子等於除以分母的 1/2mu0
        power: 1
      });
    } else if (presetKey === "presetVA") {
      // 阿爾芬速度: B / sqrt(mu0 * mp * n)
      this.calculator.addTerm({
        type: "quantity",
        quantityId: "magnetic_field",
        unitId: "nT",
        numberValue: 5,
        position: "numerator",
        power: 1
      });
      this.calculator.addTerm({
        type: "constant",
        constantId: "mu0",
        position: "denominator",
        power: 0.5
      });
      this.calculator.addTerm({
        type: "constant",
        constantId: "mp",
        position: "denominator",
        power: 0.5
      });
      this.calculator.addTerm({
        type: "quantity",
        quantityId: "number_density",
        unitId: "cm_minus3",
        numberValue: 5,
        position: "denominator",
        power: 0.5
      });
    }

    this.renderTermsList();
    const res = this.calculator.compute();
    this.renderResultBox(res);
  }

  renderTermsList() {
    this.termsContainer.innerHTML = "";
    const isZh = this.currentLang === "zh";

    this.calculator.terms.forEach((term, index) => {
      const card = document.createElement("div");
      card.className = "term-card";

      // 種類選單
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
          <div class="term-pos-toggle">
            <button type="button" class="btn-toggle ${term.position === 'numerator' ? 'active' : ''}" data-pos="numerator">
              ${isZh ? '分子' : 'Num'}
            </button>
            <button type="button" class="btn-toggle ${term.position === 'denominator' ? 'active' : ''}" data-pos="denominator">
              ${isZh ? '分母' : 'Denom'}
            </button>
          </div>
          <button type="button" class="btn-delete" title="刪除此項">✕</button>
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

      // 綁定項目內部變動事件
      const posBtns = card.querySelectorAll(".term-pos-toggle .btn-toggle");
      posBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          term.position = btn.getAttribute("data-pos");
          this.renderTermsList();
        });
      });

      const btnDel = card.querySelector(".btn-delete");
      btnDel.addEventListener("click", () => {
        this.calculator.removeTerm(term.id);
        this.renderTermsList();
      });

      if (term.type === "quantity") {
        const qtySelect = card.querySelector(".term-qty-select");
        qtySelect.addEventListener("change", () => {
          term.quantityId = qtySelect.value;
          const newQ = this.calculator.getQuantityDef(term.quantityId);
          term.unitId = newQ.units[0].id;
          this.renderTermsList();
        });

        const unitSelect = card.querySelector(".term-unit-select");
        unitSelect.addEventListener("change", () => {
          term.unitId = unitSelect.value;
        });

        const valInput = card.querySelector(".term-value-input");
        valInput.addEventListener("input", () => {
          term.numberValue = parseFloat(valInput.value) || 0;
        });
      } else if (term.type === "constant") {
        const constSelect = card.querySelector(".term-const-select");
        constSelect.addEventListener("change", () => {
          term.constantId = constSelect.value;
          this.renderTermsList();
        });
      }

      const multInput = card.querySelector(".term-mult-input");
      multInput.addEventListener("input", () => {
        term.multiplier = parseFloat(multInput.value) || 1;
      });

      const powerInput = card.querySelector(".term-power-input");
      powerInput.addEventListener("input", () => {
        term.power = parseFloat(powerInput.value) || 1;
      });

      this.termsContainer.appendChild(card);
    });
  }

  renderResultBox(res) {
    if (!res) {
      this.resultOutputBox.innerHTML = `
        <div class="empty-state">
          ${I18N[this.currentLang].resultPlaceholder}
        </div>
      `;
      return;
    }

    const isZh = this.currentLang === "zh";
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

      ${unitsListHtml}

      <div class="result-actions">
        <button type="button" class="btn btn-outline" id="btn-copy-result">
          📋 ${I18N[this.currentLang].btnCopy}
        </button>
      </div>
    `;

    document.getElementById("btn-copy-result").addEventListener("click", () => {
      navigator.clipboard.writeText(`${formattedVal} ${res.unitLabel}`);
      const btn = document.getElementById("btn-copy-result");
      btn.textContent = `✓ ${I18N[this.currentLang].copied}`;
      setTimeout(() => {
        btn.textContent = `📋 ${I18N[this.currentLang].btnCopy}`;
      }, 2000);
    });
  }

  // -------------------------
  // 分頁二：查找單位與換算
  // -------------------------
  renderLookupTab() {
    const isZh = this.currentLang === "zh";

    // 填充類別選單
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
    const isZh = this.currentLang === "zh";
    const kw = keyword.trim().toLowerCase();
    if (!kw) {
      this.filterQuantitiesByCategory(this.catSelect.value);
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
    document.getElementById("lookup-desc-box").textContent = isZh ? q.descZh : q.descEn;

    // 渲染單位對照表
    this.unitSpecTable.innerHTML = q.units.map(u => `
      <tr>
        <td><span class="badge-system badge-${u.system.toLowerCase()}">${u.system}</span></td>
        <td><strong>${u.label}</strong></td>
        <td><code>${u.toBaseSI >= 1e-3 && u.toBaseSI <= 1e4 ? u.toBaseSI : u.toBaseSI.toExponential()} ${q.baseUnitSI}</code></td>
        <td>${u.desc}</td>
      </tr>
    `).join("");

    // 填充換算選單
    this.convFromUnit.innerHTML = q.units.map(u => `<option value="${u.id}">${u.label}</option>`).join("");
    this.convToUnit.innerHTML = q.units.map(u => `<option value="${u.id}">${u.label}</option>`).join("");

    if (q.units.length > 1) {
      this.convToUnit.selectedIndex = 1;
    }

    this.updateConversion();
  }

  updateConversion() {
    const q = this.selectedQuantity;
    if (!q) return;

    const val = parseFloat(this.convInputVal.value) || 0;
    const fromUnit = q.units.find(u => u.id === this.convFromUnit.value) || q.units[0];
    const toUnit = q.units.find(u => u.id === this.convToUnit.value) || q.units[0];

    // 換算到 SI 再換到目標單位
    const valSI = val * fromUnit.toBaseSI;
    const converted = valSI / toUnit.toBaseSI;
    const factor = fromUnit.toBaseSI / toUnit.toBaseSI;

    const formattedVal = Math.abs(converted) < 1e-4 || Math.abs(converted) >= 1e6
      ? converted.toExponential(5)
      : converted.toLocaleString(undefined, { maximumFractionDigits: 5 });

    const factorStr = Math.abs(factor) < 1e-3 || Math.abs(factor) >= 1e5
      ? factor.toExponential(5)
      : factor.toString();

    this.convResultDisplay.textContent = `${formattedVal} ${toUnit.id}`;
    this.convFactorDisplay.innerHTML = `1 ${fromUnit.id} = <strong>${factorStr}</strong> ${toUnit.id} (數值乘以 ${factorStr})`;
  }

  // -------------------------
  // 分頁三：太空物理方程式
  // -------------------------
  renderEquationsTab() {
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
    const isZh = this.currentLang === "zh";
    const kw = keyword.trim().toLowerCase();
    if (!kw) {
      this.filterEquationsByCategory(this.eqCatSelect.value);
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
    document.getElementById("eq-formula-display").textContent = eq.formulaLatex;
    document.getElementById("eq-desc-display").textContent = isZh ? eq.descZh : eq.descEn;

    // 動態渲染參數輸入表單
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

    // 自動計算一次
    this.computeCurrentEquation();
  }

  computeCurrentEquation() {
    const eq = this.selectedEquation;
    if (!eq) return;

    const isZh = this.currentLang === "zh";
    const inputs = {};
    const units = {};

    try {
      eq.inputs.forEach(param => {
        if (param.type === "select") {
          const selectEl = this.eqInputsContainer.querySelector(`.eq-param-input[data-param="${param.id}"]`);
          const chosen = param.options.find(o => o.value === selectEl.value);
          inputs[param.id] = chosen;
        } else {
          const inputEl = this.eqInputsContainer.querySelector(`.eq-param-input[data-param="${param.id}"]`);
          inputs[param.id] = parseFloat(inputEl.value) || 0;

          if (param.unitCategory) {
            const unitEl = this.eqInputsContainer.querySelector(`.eq-param-unit[data-param="${param.id}"]`);
            const qDef = PHYSICAL_QUANTITIES.find(q => q.id === param.unitCategory);
            const uDef = qDef.units.find(u => u.id === unitEl.value);
            units[param.id] = uDef;
          }
        }
      });

      const outputs = eq.calculate(inputs, units);
      this.renderEquationOutputs(outputs);
    } catch (err) {
      this.eqResultBox.innerHTML = `
        <div class="calc-error">⚠️ ${err.message}</div>
      `;
    }
  }

  renderEquationOutputs(outputs) {
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
