/**
 * js/preset-state-manager.js - 太空物理環境預設場景狀態管理器 (Preset State Manager)
 * 負責場景標準基準值管理、輸入框髒狀態 (Dirty State) 監聽、浮點數容差比對與一鍵還原
 */

class PresetStateManager {
  static ENV_PRESETS = {
    solar_wind_1au: {
      id: "solar_wind_1au",
      nameZh: "1 AU 太陽風",
      nameEn: "1 AU Solar Wind",
      icon: "⚡",
      values: {
        B: { val: 5, unit: "nT" },
        B1: { val: 5, unit: "nT" },
        n: { val: 5, unit: "cm^-3" },
        n1: { val: 5, unit: "cm^-3" },
        ne: { val: 5, unit: "cm^-3" },
        ni: { val: 5, unit: "cm^-3" },
        np: { val: 5, unit: "cm^-3" },
        T: { val: 10, unit: "eV" },
        Te: { val: 10, unit: "eV" },
        Ti: { val: 10, unit: "eV" },
        Tp: { val: 10, unit: "eV" },
        v: { val: 400, unit: "km/s" },
        W_perp: { val: 10, unit: "eV" },
        v_perp: { val: 400, unit: "km/s" }
      }
    },
    magnetopause: {
      id: "magnetopause",
      nameZh: "地球磁層頂",
      nameEn: "Magnetopause",
      icon: "🛡️",
      values: {
        B: { val: 50, unit: "nT" },
        B1: { val: 50, unit: "nT" },
        n: { val: 10, unit: "cm^-3" },
        n1: { val: 10, unit: "cm^-3" },
        ne: { val: 10, unit: "cm^-3" },
        ni: { val: 10, unit: "cm^-3" },
        np: { val: 10, unit: "cm^-3" },
        T: { val: 100, unit: "eV" },
        Te: { val: 50, unit: "eV" },
        Ti: { val: 150, unit: "eV" },
        Tp: { val: 150, unit: "eV" },
        v: { val: 100, unit: "km/s" },
        W_perp: { val: 100, unit: "eV" },
        v_perp: { val: 100, unit: "km/s" }
      }
    },
    magnetotail: {
      id: "magnetotail",
      nameZh: "地球磁尾",
      nameEn: "Magnetotail",
      icon: "🌌",
      values: {
        B: { val: 20, unit: "nT" },
        B1: { val: 20, unit: "nT" },
        n: { val: 0.2, unit: "cm^-3" },
        n1: { val: 0.2, unit: "cm^-3" },
        ne: { val: 0.2, unit: "cm^-3" },
        ni: { val: 0.2, unit: "cm^-3" },
        np: { val: 0.2, unit: "cm^-3" },
        T: { val: 1000, unit: "eV" },
        Te: { val: 500, unit: "eV" },
        Ti: { val: 2000, unit: "eV" },
        Tp: { val: 2000, unit: "eV" },
        v: { val: 50, unit: "km/s" },
        W_perp: { val: 1000, unit: "eV" },
        v_perp: { val: 50, unit: "km/s" }
      }
    },
    ionosphere_f: {
      id: "ionosphere_f",
      nameZh: "電離層 F層",
      nameEn: "Ionosphere F-layer",
      icon: "🌍",
      values: {
        B: { val: 30000, unit: "nT" },
        B1: { val: 30000, unit: "nT" },
        n: { val: 1000000, unit: "cm^-3" },
        n1: { val: 1000000, unit: "cm^-3" },
        ne: { val: 1000000, unit: "cm^-3" },
        ni: { val: 1000000, unit: "cm^-3" },
        np: { val: 1000000, unit: "cm^-3" },
        T: { val: 0.1, unit: "eV" },
        Te: { val: 0.15, unit: "eV" },
        Ti: { val: 0.1, unit: "eV" },
        Tp: { val: 0.1, unit: "eV" },
        v: { val: 1, unit: "km/s" },
        W_perp: { val: 0.1, unit: "eV" },
        v_perp: { val: 1, unit: "km/s" }
      }
    }
  };

  constructor(app) {
    this.app = app;
    this.currentPresetId = "solar_wind_1au";
    this.baselineSnapshot = {};
    this.isDirty = false;
    this.tolerance = 1e-6; // 浮點數比對容差
    this.initDOM();
  }

  initDOM() {
    this.container = document.getElementById("eq-inputs-container");
    this.presetButtons = document.querySelectorAll(".env-pill-btn");
    this.btnReset = document.getElementById("btn-reset-env-preset");

    if (this.btnReset) {
      this.btnReset.addEventListener("click", () => {
        this.resetToPreset();
      });
    }

    if (this.presetButtons) {
      this.presetButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          const presetId = btn.getAttribute("data-env-preset");
          if (presetId) this.applyPreset(presetId);
        });
      });
    }
  }

  /**
   * 套用選定的典型太空環境預設場景
   * @param {string} presetId
   */
  applyPreset(presetId) {
    const preset = PresetStateManager.ENV_PRESETS[presetId];
    if (!preset) return;

    this.currentPresetId = presetId;
    const container = document.getElementById("eq-inputs-container");
    if (!container) return;

    // 將數值填入各輸入欄位，並加上過渡高亮動畫
    Object.entries(preset.values).forEach(([key, conf]) => {
      const inputEl = container.querySelector(`.eq-param-input[data-param="${key}"]`);
      const unitEl = container.querySelector(`.eq-param-unit[data-param="${key}"]`);

      if (inputEl) {
        inputEl.value = conf.val;
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

    // 拍下最新標準基準值快照
    this.takeBaselineSnapshot();
    this.isDirty = false;
    this.updateUIState();

    // 觸發方程式解算
    if (this.app.equationsTab) {
      this.app.equationsTab.computeCurrentEquation();
    }
  }

  /**
   * 擷取當前所有輸入項之基準狀態快照
   */
  takeBaselineSnapshot() {
    const container = document.getElementById("eq-inputs-container");
    if (!container) return;

    this.baselineSnapshot = {};
    container.querySelectorAll(".eq-param-input").forEach(inp => {
      const paramId = inp.getAttribute("data-param");
      if (!paramId) return;

      const unitEl = container.querySelector(`.eq-param-unit[data-param="${paramId}"]`);
      this.baselineSnapshot[paramId] = {
        val: parseFloat(inp.value),
        unit: unitEl ? unitEl.value : null
      };
    });
  }

  /**
   * 即時檢查當前數值是否偏離基準值 (考慮浮點數誤差 1e-6)
   */
  checkDirtyState() {
    const container = document.getElementById("eq-inputs-container");
    if (!container || !this.baselineSnapshot) return;

    let hasDeviation = false;
    const inputs = container.querySelectorAll(".eq-param-input");

    for (const inp of inputs) {
      const paramId = inp.getAttribute("data-param");
      const base = this.baselineSnapshot[paramId];
      if (!base) continue;

      const currentVal = parseFloat(inp.value);
      const unitEl = container.querySelector(`.eq-param-unit[data-param="${paramId}"]`);
      const currentUnit = unitEl ? unitEl.value : null;

      // 檢查單位是否被更動
      if (base.unit !== null && currentUnit !== null && base.unit !== currentUnit) {
        hasDeviation = true;
        break;
      }

      // 檢查數值是否偏離超過容差
      if (isNaN(currentVal) || Math.abs(currentVal - base.val) > this.tolerance) {
        hasDeviation = true;
        break;
      }
    }

    if (this.isDirty !== hasDeviation) {
      this.isDirty = hasDeviation;
      this.updateUIState();
    }
  }

  /**
   * 一鍵還原回當前場景之標準預設值
   */
  resetToPreset() {
    if (this.currentPresetId) {
      this.applyPreset(this.currentPresetId);
    }
  }

  /**
   * 更新場景按鈕與還原按鈕視覺狀態
   */
  updateUIState() {
    const isZh = this.app.currentLang === "zh";
    const dirtyText = isZh ? " (已修改)" : " (Modified)";

    this.presetButtons = document.querySelectorAll(".env-pill-btn");
    this.presetButtons.forEach(btn => {
      const pid = btn.getAttribute("data-env-preset");
      const isCurrent = pid === this.currentPresetId;
      const baseLabel = (typeof I18N !== "undefined" && I18N[this.app.currentLang])
        ? I18N[this.app.currentLang][btn.getAttribute("data-i18n")] || btn.textContent
        : btn.textContent;
      const cleanLabel = baseLabel.replace(/\s*\((已修改|已自訂|Modified|Customized)\)/g, "");

      if (isCurrent) {
        if (this.isDirty) {
          btn.classList.remove("active");
          btn.classList.add("is-customized");
          btn.innerHTML = `${cleanLabel} <span class="preset-dirty-tag">${dirtyText.trim()}</span>`;
          btn.title = isZh ? "數值已自訂偏離標準場景" : "Values modified from standard preset";
        } else {
          btn.classList.add("active");
          btn.classList.remove("is-customized");
          btn.textContent = cleanLabel;
          btn.title = isZh ? "標準太空場景數值" : "Standard preset values";
        }
      } else {
        btn.classList.remove("active", "is-customized");
        btn.textContent = cleanLabel;
      }
    });

    // 控制還原按鈕之顯示狀態
    this.btnReset = document.getElementById("btn-reset-env-preset");
    if (this.btnReset) {
      this.btnReset.style.display = this.isDirty ? "inline-flex" : "none";
      if (this.isDirty) {
        this.btnReset.classList.remove("btn-reset-pulse");
        void this.btnReset.offsetWidth;
        this.btnReset.classList.add("btn-reset-pulse");
      }
    }
  }

  /**
   * 綁定參數輸入容器內的即時比對事件
   * @param {HTMLElement} container
   */
  bindInputs(container) {
    if (!container) return;

    container.querySelectorAll(".eq-param-input").forEach(inp => {
      inp.addEventListener("input", () => this.checkDirtyState());
      inp.addEventListener("change", () => this.checkDirtyState());
    });

    container.querySelectorAll(".eq-param-unit").forEach(sel => {
      sel.addEventListener("change", () => this.checkDirtyState());
    });
  }
}
