/**
 * js/app-ui.js - 現代化科學 UI 互動核心控制器
 * 職責：
 *   1. 智慧參數輸入 (Smart Inputs) 與無損單位切換
 *   2. 太陽風與太空環境典型預設場景代入與自訂狀態追蹤 (Environment Presets)
 *   3. 太空物理情境數量級對照標尺 (Physical Context Meter)
 *   4. 一鍵複製數值、帶單位與 LaTeX 剪貼簿輔助 (Clipboard Actions)
 *   5. 自訂運算工作台雙向綁定與即時因次防呆 (SSOT Two-Way Binding & Dimension Guard)
 *   6. 符號庫分類標籤切換 (Categorized Pill Tabs)
 */

class ModernUIController {
  constructor(app) {
    this.app = app;
    this.currentEnvPreset = "solar_wind_1au";
    this.isParsingFromInput = false;
    this.initClipboardHelpers();
  }

  // =========================================================================
  // 1. 太空環境典型預設場景代理 (委由 PresetStateManager 處理)
  // =========================================================================
  applyEnvironmentPreset(presetId) {
    if (this.app.presetState) {
      this.app.presetState.applyPreset(presetId);
    }
  }

  markPresetCustomized() {
    if (this.app.presetState) {
      this.app.presetState.checkDirtyState();
    }
  }

  // =========================================================================
  // 2. 智慧參數輸入與無損單位即時換算 (Smart Inputs)
  // =========================================================================
  bindSmartInputEvents(container, onComputeCallback) {
    if (!container) return;

    container.querySelectorAll(".eq-param-input").forEach(input => {
      const handleInput = () => {
        this.markPresetCustomized();
        if (onComputeCallback) onComputeCallback();
      };
      input.addEventListener("input", handleInput);
      input.addEventListener("change", handleInput);
    });

    container.querySelectorAll(".eq-param-unit").forEach(select => {
      select.setAttribute("data-prev-unit", select.value);

      select.addEventListener("change", () => {
        this.markPresetCustomized();
        const paramId = select.getAttribute("data-param");
        const prevUnitId = select.getAttribute("data-prev-unit");
        const newUnitId = select.value;
        const inputEl = container.querySelector(`.eq-param-input[data-param="${paramId}"]`);

        if (inputEl && prevUnitId && newUnitId !== prevUnitId) {
          const currentVal = parseFloat(inputEl.value);
          if (!isNaN(currentVal) && currentVal !== 0) {
            const paramDef = this.findParameterDefinition(paramId);
            if (paramDef && paramDef.unitCategory) {
              const qDef = PHYSICAL_QUANTITIES.find(q => q.id === paramDef.unitCategory);
              if (qDef && qDef.units) {
                const prevU = qDef.units.find(u => u.id === prevUnitId);
                const newU = qDef.units.find(u => u.id === newUnitId);
                if (prevU && newU && prevU.toBaseSI && newU.toBaseSI) {
                  const convertedVal = currentVal * (prevU.toBaseSI / newU.toBaseSI);
                  if (Math.abs(convertedVal) < 1e-4 || Math.abs(convertedVal) >= 1e6) {
                    inputEl.value = convertedVal.toExponential(4);
                  } else {
                    inputEl.value = parseFloat(convertedVal.toPrecision(6));
                  }
                  inputEl.classList.remove("input-highlight-pulse");
                  void inputEl.offsetWidth;
                  inputEl.classList.add("input-highlight-pulse");
                }
              }
            }
          }
        }

        select.setAttribute("data-prev-unit", newUnitId);
        if (onComputeCallback) onComputeCallback();
      });
    });
  }

  findParameterDefinition(paramId) {
    if (!this.app.equationsTab || !this.app.equationsTab.selectedEquation) return null;
    return this.app.equationsTab.selectedEquation.inputs.find(i => i.id === paramId);
  }

  // =========================================================================
  // 3. 太空物理情境數量級標尺 (Physical Context Meter)
  // =========================================================================
  static renderContextMeter(numVal, meterType = "velocity", origUnit = "") {
    if (!numVal || isNaN(numVal) || numVal <= 0 || !meterType) return "";

    let minLog = 0, maxLog = 6, valLog = Math.log10(Math.abs(numVal));
    let labelLeft = "太陽風 (Solar Wind)", labelMid = "磁層 (Magnetosphere)", labelRight = "電離層 (Ionosphere)";

    if (meterType === "frequency") {
      let hz = Math.abs(numVal);
      if (origUnit.includes("rad/s")) hz = hz / (2 * Math.PI);
      else if (origUnit.includes("kHz")) hz = hz * 1e3;
      else if (origUnit.includes("MHz")) hz = hz * 1e6;
      else if (origUnit.includes("GHz")) hz = hz * 1e9;
      else if (origUnit.includes("mHz")) hz = hz * 1e-3;
      valLog = Math.log10(hz);
      minLog = -1; maxLog = 6;
    } else if (meterType === "time") {
      let sec = Math.abs(numVal);
      if (origUnit === "ms") sec = sec * 1e-3;
      else if (origUnit === "μs" || origUnit === "us") sec = sec * 1e-6;
      else if (origUnit === "ns") sec = sec * 1e-9;
      valLog = Math.log10(1 / sec);
      minLog = -1; maxLog = 6;
    } else if (meterType === "velocity") {
      let kms = Math.abs(numVal);
      if (origUnit === "m/s") kms = kms / 1000;
      else if (origUnit === "cm/s") kms = kms / 100000;
      valLog = Math.log10(kms);
      minLog = 0; maxLog = 3.5;
      labelLeft = "電離層 (Ionosphere)"; labelMid = "磁層 (Magnetosphere)"; labelRight = "太陽風 (Solar Wind)";
    } else if (meterType === "length") {
      let m = Math.abs(numVal);
      if (origUnit === "km") m = m * 1000;
      else if (origUnit === "cm") m = m * 0.01;
      valLog = Math.log10(m);
      minLog = 0; maxLog = 7;
      labelLeft = "微觀尺度 (Debye)"; labelMid = "動力學尺度 (Kinetic)"; labelRight = "巨觀尺度 (MHD)";
    } else if (meterType === "beta") {
      minLog = -3; maxLog = 2;
      labelLeft = "強磁主導 (β ≪ 1)"; labelMid = "邊界平衡 (β ~ 1)"; labelRight = "熱能主導 (β ≫ 1)";
    } else if (meterType === "ratio") {
      minLog = 0; maxLog = 2;
      labelLeft = "弱激波 (M ~ 1)"; labelMid = "中等激波"; labelRight = "強激波 (M ≫ 1)";
    } else {
      return "";
    }

    const clampedLog = Math.max(minLog, Math.min(maxLog, valLog));
    const percent = ((clampedLog - minLog) / (maxLog - minLog)) * 100;

    return `
      <div class="context-meter-box">
        <div class="context-meter-header">
          <span>典型太空電漿環境數量級對照 (Order of Magnitude Context)</span>
          <span class="code-badge font-mono">${numVal > 1e4 || numVal < 1e-2 ? numVal.toExponential(2) : numVal.toFixed(2)}</span>
        </div>
        <div class="context-meter-track">
          <div class="context-meter-segment sw" title="太陽風常態區間"></div>
          <div class="context-meter-segment mp" title="地球磁層頂/磁尾區間"></div>
          <div class="context-meter-segment iono" title="電離層/近地高密區間"></div>
          <div class="context-meter-pin" style="left: ${percent.toFixed(1)}%;" title="目前計算值定位 (${percent.toFixed(0)}%)"></div>
        </div>
        <div class="context-meter-labels">
          <span>${labelLeft}</span>
          <span>${labelMid}</span>
          <span>${labelRight}</span>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 4. 一鍵複製剪貼簿輔助 (Clipboard Actions)
  // =========================================================================
  initClipboardHelpers() {
    document.addEventListener("click", e => {
      const chip = e.target.closest(".btn-copy-chip");
      if (!chip) return;

      const text = chip.getAttribute("data-copy-text");
      if (!text) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.flashCopiedState(chip);
        });
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        this.flashCopiedState(chip);
      }
    });
  }

  flashCopiedState(el) {
    const origHtml = el.innerHTML;
    el.classList.add("copied");
    el.innerHTML = "<span>✓ 已複製</span>";
    setTimeout(() => {
      el.classList.remove("copied");
      el.innerHTML = origHtml;
    }, 1500);
  }

  // =========================================================================
  // 5. 自訂運算工作台雙向綁定 (SSOT Two-Way Binding) 與因次防呆
  // =========================================================================

  // 當使用者在 LaTeX 文字框輸入時，即時解析並同步至視覺畫布與因次檢查
  syncFromLatexInput(latexStr) {
    const calc = this.app.calculator;
    if (!calc) return;

    this.isParsingFromInput = true;
    try {
      const str = (latexStr || "").trim();
      if (!str) {
        calc.tokens = [];
        if (this.app.builderTab) this.app.builderTab.renderTermsList();
        this.refreshBuilderPreview();
        this.updateDimensionBadge(null);
        return;
      }

      // 1. 快速匹配常見經典結構
      if ((str.includes("B^2") || str.includes("B^{2}")) && (str.includes("mu") || str.includes("μ"))) {
        this.app.builderTab.loadPresetFormula("presetPB");
      } else if (str.includes("P_th") && str.includes("P_B")) {
        this.app.builderTab.loadPresetFormula("presetTotalP");
      } else if (str.includes("beta") || (str.includes("nkT") && str.includes("P_B"))) {
        this.app.builderTab.loadPresetFormula("presetBeta");
      } else if (str.includes("v_A") || (str.includes("B") && (str.includes("rho") || str.includes("mu")))) {
        this.app.builderTab.loadPresetFormula("presetVA");
      } else {
        calc.tokens = [];
        const fracMatch = str.match(/\\frac\{([^}]+)\}\{([^}]+)\}/);
        if (fracMatch) {
          const fracToken = calc.insertFraction();
          this.parseTokensIntoList(fracMatch[1], fracToken.numerator);
          this.parseTokensIntoList(fracMatch[2], fracToken.denominator);
        } else {
          this.parseTokensIntoList(str, calc.tokens);
        }
        if (this.app.builderTab) this.app.builderTab.renderTermsList();
      }

      this.refreshBuilderPreview();
      this.updateDimensionBadge();
    } finally {
      this.isParsingFromInput = false;
    }
  }

  parseTokensIntoList(exprStr, container) {
    const cleaned = exprStr
      .replace(/\\cdot|\\times/g, " * ")
      .replace(/\\mu_0|\\mu0|\\mu|mu_0/g, " mu0 ")
      .replace(/\\varepsilon_0|\\epsilon_0|eps0/g, " eps0 ")
      .replace(/m_e/g, " me ")
      .replace(/m_p/g, " mp ")
      .replace(/k_B|k_b/g, " kB ")
      .replace(/P_\{th\}|P_th/g, " P ")
      .replace(/P_B/g, " P ");

    const parts = cleaned.split(/(\s+|\+|-|\*|\/|\(|\))/).map(s => s.trim()).filter(s => s.length > 0);
    const constMap = { e: "e", me: "me", mp: "mp", eps0: "eps0", mu0: "mu0", kB: "kB", c: "c" };
    const qtyMap = { B: "magnetic_field", E: "electric_field", n: "density", T: "temperature", v: "velocity", P: "pressure" };

    parts.forEach(tok => {
      let power = 1;
      let coreTok = tok;
      if (tok.includes("^")) {
        const pParts = tok.split("^");
        coreTok = pParts[0];
        power = parseFloat(pParts[1].replace(/[{}]/g, "")) || 1;
      }

      if (tok === "+" || tok === "-" || tok === "*" || tok === "/") {
        container.push({ id: `op_${Date.now()}_${Math.random()}`, type: "operator", value: tok });
      } else if (tok === "(") {
        container.push({ id: `open_${Date.now()}_${Math.random()}`, type: "open_paren" });
      } else if (tok === ")") {
        container.push({ id: `close_${Date.now()}_${Math.random()}`, type: "close_paren", power: 1 });
      } else if (constMap[coreTok]) {
        container.push({ id: `c_${Date.now()}_${Math.random()}`, type: "constant", constantId: constMap[coreTok], multiplier: 1, power });
      } else if (qtyMap[coreTok]) {
        const qId = qtyMap[coreTok];
        const qDef = PHYSICAL_QUANTITIES.find(q => q.id === qId);
        const uId = qDef ? (qDef.units[1] || qDef.units[0]).id : "T";
        container.push({ id: `q_${Date.now()}_${Math.random()}`, type: "quantity", quantityId: qId, unitId: uId, numberValue: 1, multiplier: 1, power });
      }
    });
  }

  // 當公式 AST 變更時，反向生成最新 LaTeX 回填至輸入框 (具備無損游標維持與語義防抖)
  syncToLatexInput(options = {}) {
    const calc = this.app.calculator;
    if (!calc) return;

    this.refreshBuilderPreview();
    const rep = calc.generateEquationRepresentation();
    const newLatex = rep.latexFormula || "";
    const inputEl = document.getElementById("latex-quick-input");
    if (!inputEl) return;

    const currentVal = inputEl.value;
    const isFocused = document.activeElement === inputEl;

    // 語義正規化比對：消除多餘空白、乘號變體與花括號格式差異
    const normalize = s => (s || "").replace(/\s+/g, "").replace(/\\cdot|\\times/g, "*").replace(/\{(\w)\}/g, "$1");
    const isSemanticallyEqual = currentVal === newLatex || normalize(currentVal) === normalize(newLatex);

    // 1. 若當前處於 input 事件驅動階段 (使用者正在打字) 且語義未變，絕不覆寫 value 以保全游標與原生撤銷棧
    if (this.isParsingFromInput && isSemanticallyEqual) {
      this.updateDimensionBadge();
      return;
    }

    // 2. 若非強制更新且字面內容已完全一致，直接跳過重寫
    if (!options.force && currentVal === newLatex) {
      this.updateDimensionBadge();
      return;
    }

    // 3. 需回填更新時：無損紀錄當前選取範圍起訖點
    const { selectionStart, selectionEnd } = inputEl;

    inputEl.value = newLatex;

    // 4. 若當前輸入框擁有焦點，立即精確還原文字游標位置
    if (isFocused && selectionStart !== null && selectionEnd !== null) {
      const targetStart = Math.min(selectionStart, newLatex.length);
      const targetEnd = Math.min(selectionEnd, newLatex.length);
      try {
        inputEl.setSelectionRange(targetStart, targetEnd);
      } catch (e) {
        // 瀏覽器邊界防護
      }
    }

    this.updateDimensionBadge();
  }

  refreshBuilderPreview() {
    if (this.app.builderTab && this.app.builderTab.previewUI) {
      this.app.builderTab.previewUI.updateEquationPreview();
    }
  }

  // 因次防呆檢查 (以綠色/紅色狀態標籤顯示，嚴禁使用 alert)
  updateDimensionBadge(forcedStatus = undefined) {
    const badge = document.getElementById("dim-status-badge");
    const warningCard = document.getElementById("mismatch-warning-card");
    if (!badge) return;

    const isZh = this.app.currentLang === "zh";
    const calc = this.app.calculator;

    if (forcedStatus === null || !calc || calc.tokens.length === 0) {
      badge.className = "dim-status-badge dim-badge-modern valid";
      badge.textContent = isZh ? "因次檢驗就緒" : "Dimension Ready";
      if (warningCard) warningCard.style.display = "none";
      return;
    }

    try {
      const res = calc.compute();
      if (res && res.hasError) {
        badge.className = "dim-status-badge dim-badge-modern invalid";
        const msg = res.mismatchDetails && res.mismatchDetails.length > 0 ? res.mismatchDetails[0] : res.warningTitleZh;
        badge.textContent = isZh ? `✕ 因次衝突：${msg}` : `✕ Dimension Mismatch`;
        if (warningCard) {
          warningCard.style.display = "block";
          warningCard.innerHTML = `<div class="calc-error-banner"><span>⚠️</span><div>${msg}</div></div>`;
        }
      } else {
        badge.className = "dim-status-badge dim-badge-modern valid";
        const qName = res && res.matchedQuantity ? (isZh ? res.matchedQuantity.nameZh : res.matchedQuantity.nameEn) : (isZh ? "無因次純量" : "Dimensionless");
        badge.textContent = isZh ? `✓ 因次平衡：[${qName}]` : `✓ Balanced: [${qName}]`;
        if (warningCard) warningCard.style.display = "none";
      }
    } catch (e) {
      badge.className = "dim-status-badge dim-badge-modern invalid";
      badge.textContent = `✕ 因次衝突：${e.message}`;
      if (warningCard) {
        warningCard.style.display = "block";
        warningCard.innerHTML = `<div class="calc-error-banner"><span>⚠️</span><div>${e.message}</div></div>`;
      }
    }
  }

  // =========================================================================
  // 6. 符號庫分類標籤切換 (Categorized Pill Tabs)
  // =========================================================================
  initSymbolPillTabs() {
    const nav = document.getElementById("symbol-tab-nav");
    if (!nav) return;

    nav.querySelectorAll(".symbol-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-sym-cat");
        nav.querySelectorAll(".symbol-tab-btn").forEach(b => b.classList.toggle("active", b === btn));
        document.querySelectorAll(".symbol-pills-row").forEach(row => {
          row.style.display = row.getAttribute("data-sym-cat") === cat ? "flex" : "none";
        });
      });
    });
  }
}

if (typeof window !== "undefined") {
  window.ModernUIController = ModernUIController;
}
