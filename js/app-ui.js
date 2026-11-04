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
    this.initClipboardHelpers();
  }

  // =========================================================================
  // 1. 太空環境典型預設場景資料庫 (Environment Presets)
  // =========================================================================
  static ENV_PRESETS = Object.freeze({
    solar_wind_1au: {
      id: "solar_wind_1au",
      nameZh: "1 AU 太陽風",
      nameEn: "1 AU Solar Wind",
      icon: "⚡",
      values: {
        B: { val: 5, unit: "nT" },
        n: { val: 5, unit: "cm^-3" },
        ne: { val: 5, unit: "cm^-3" },
        ni: { val: 5, unit: "cm^-3" },
        np: { val: 5, unit: "cm^-3" },
        T: { val: 10, unit: "eV" },
        Te: { val: 10, unit: "eV" },
        Ti: { val: 10, unit: "eV" },
        Tp: { val: 10, unit: "eV" },
        v: { val: 400, unit: "km/s" },
        v_flow: { val: 400, unit: "km/s" }
      }
    },
    magnetopause: {
      id: "magnetopause",
      nameZh: "地球磁層頂",
      nameEn: "Magnetopause",
      icon: "🛡️",
      values: {
        B: { val: 50, unit: "nT" },
        n: { val: 10, unit: "cm^-3" },
        ne: { val: 10, unit: "cm^-3" },
        ni: { val: 10, unit: "cm^-3" },
        np: { val: 10, unit: "cm^-3" },
        T: { val: 50, unit: "eV" },
        Te: { val: 50, unit: "eV" },
        Ti: { val: 100, unit: "eV" },
        Tp: { val: 100, unit: "eV" },
        v: { val: 150, unit: "km/s" }
      }
    },
    magnetotail: {
      id: "magnetotail",
      nameZh: "地球磁尾",
      nameEn: "Magnetotail",
      icon: "🌌",
      values: {
        B: { val: 20, unit: "nT" },
        n: { val: 0.2, unit: "cm^-3" },
        ne: { val: 0.2, unit: "cm^-3" },
        ni: { val: 0.2, unit: "cm^-3" },
        np: { val: 0.2, unit: "cm^-3" },
        T: { val: 1000, unit: "eV" },
        Te: { val: 500, unit: "eV" },
        Ti: { val: 2000, unit: "eV" },
        Tp: { val: 2000, unit: "eV" },
        v: { val: 50, unit: "km/s" }
      }
    },
    ionosphere_f: {
      id: "ionosphere_f",
      nameZh: "電離層 F層",
      nameEn: "Ionosphere F-layer",
      icon: "🌍",
      values: {
        B: { val: 30000, unit: "nT" },
        n: { val: 1000000, unit: "cm^-3" },
        ne: { val: 1000000, unit: "cm^-3" },
        ni: { val: 1000000, unit: "cm^-3" },
        np: { val: 1000000, unit: "cm^-3" },
        T: { val: 0.1, unit: "eV" },
        Te: { val: 0.15, unit: "eV" },
        Ti: { val: 0.1, unit: "eV" },
        Tp: { val: 0.1, unit: "eV" },
        v: { val: 1, unit: "km/s" }
      }
    }
  });

  // 套用典型太空環境場景數值與過渡動效
  applyEnvironmentPreset(presetId) {
    const preset = ModernUIController.ENV_PRESETS[presetId];
    if (!preset) return;

    this.currentEnvPreset = presetId;
    const inputsContainer = document.getElementById("eq-inputs-container");
    if (!inputsContainer) return;

    // 更新場景按鈕外觀狀態
    document.querySelectorAll(".env-pill-btn").forEach(btn => {
      const match = btn.getAttribute("data-env-preset") === presetId;
      btn.classList.toggle("active", match);
      btn.classList.remove("is-customized");
      const baseLabel = (typeof I18N !== "undefined" && I18N[this.app.currentLang])
        ? I18N[this.app.currentLang][btn.getAttribute("data-i18n")] || btn.textContent
        : btn.textContent;
      btn.textContent = baseLabel.replace(" (自訂)", "").replace(" (Customized)", "");
    });

    Object.entries(preset.values).forEach(([key, conf]) => {
      const inputEl = inputsContainer.querySelector(`.eq-param-input[data-param="${key}"]`);
      const unitEl = inputsContainer.querySelector(`.eq-param-unit[data-param="${key}"]`);

      if (inputEl) {
        inputEl.value = conf.val;
        // 加入醒目過渡動畫
        inputEl.classList.remove("input-highlight-pulse");
        void inputEl.offsetWidth;
        inputEl.classList.add("input-highlight-pulse");
      }
      if (unitEl && conf.unit) {
        for (let i = 0; i < unitEl.options.length; i++) {
          if (unitEl.options[i].value === conf.unit) {
            unitEl.selectedIndex = i;
            break;
          }
        }
      }
    });

    if (this.app.equationsTab) {
      this.app.equationsTab.computeCurrentEquation();
    }
  }

  // 當使用者手動修改參數時，標記場景為「已自訂修改」
  markPresetCustomized() {
    const activeBtn = document.querySelector(".env-pill-btn.active");
    if (activeBtn && !activeBtn.classList.contains("is-customized")) {
      activeBtn.classList.add("is-customized");
      const isZh = this.app.currentLang === "zh";
      const suffix = isZh ? " (已自訂)" : " (Customized)";
      if (!activeBtn.textContent.includes(suffix)) {
        activeBtn.textContent += suffix;
      }
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
  static renderContextMeter(numVal, unitType = "velocity") {
    if (!numVal || isNaN(numVal) || numVal <= 0) return "";

    let minLog = 0;
    let maxLog = 8;
    let labelLeft = "太陽風 (Solar Wind)";
    let labelMid = "磁層 (Magnetosphere)";
    let labelRight = "電離層 (Ionosphere)";

    if (unitType === "frequency") {
      minLog = -1;
      maxLog = 6;
    } else if (unitType === "length") {
      minLog = 0;
      maxLog = 7;
    } else if (unitType === "dimensionless") {
      minLog = -3;
      maxLog = 2;
      labelLeft = "強磁/低 Beta";
      labelMid = "邊界平衡 ~1";
      labelRight = "高 Beta/熱能主導";
    }

    const valLog = Math.log10(Math.abs(numVal));
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

    const str = (latexStr || "").trim();
    if (!str) {
      calc.tokens = [];
      this.refreshBuilderPreview();
      this.updateDimensionBadge(null);
      return;
    }

    // 簡易快速解析常見經典結構
    if (str.includes("B^2") && (str.includes("mu") || str.includes("μ"))) {
      this.app.builderTab.loadPresetFormula("presetPB");
    } else if (str.includes("P_th") && str.includes("P_B")) {
      this.app.builderTab.loadPresetFormula("presetTotalP");
    } else if (str.includes("beta") || (str.includes("nkT") && str.includes("P_B"))) {
      this.app.builderTab.loadPresetFormula("presetBeta");
    } else if (str.includes("v_A") || (str.includes("B") && str.includes("rho"))) {
      this.app.builderTab.loadPresetFormula("presetVA");
    } else {
      calc.tokens = [];
      const tokens = str.split(/(\s+|\+|-|\*|\/|\^)/).filter(t => t.trim().length > 0);
      tokens.forEach(tok => {
        if (tok === "+" || tok === "-" || tok === "*" || tok === "/") {
          calc.insertOperator(tok === "*" ? "*" : tok);
        } else if (PHYSICAL_CONSTANTS[tok]) {
          calc.addConstant(tok);
        } else {
          const q = PHYSICAL_QUANTITIES.find(x => x.symbol === tok || x.id === tok);
          if (q) calc.addQuantity(q.id);
        }
      });
    }

    this.refreshBuilderPreview();
    this.updateDimensionBadge();
  }

  // 當使用者點擊按鈕插入符號時，更新核心狀態並反向生成最新 LaTeX 回填至輸入框
  syncToLatexInput() {
    const calc = this.app.calculator;
    if (!calc) return;

    this.refreshBuilderPreview();
    const rep = calc.generateEquationRepresentation();
    const inputEl = document.getElementById("latex-quick-input");
    if (inputEl) {
      inputEl.value = rep.latexFormula || "";
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
