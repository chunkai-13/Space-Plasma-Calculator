/**
 * js/tab-equations.js - 分頁三：常用太空物理方程式庫控制器
 */

class EquationsTabController {
  constructor(app) {
    this.app = app;
    this.selectedEquation = EQUATIONS_DATABASE[0];
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.eqCatSelect = document.getElementById("eq-cat-select");
    this.eqSelect = document.getElementById("eq-select");
    this.eqSearch = document.getElementById("eq-search-input");
    this.btnClearSearch = document.getElementById("btn-clear-eq-search");
    this.searchFeedback = document.getElementById("eq-search-feedback");
    this.eqInputsContainer = document.getElementById("eq-inputs-container");
    this.btnComputeEq = document.getElementById("btn-compute-eq");
    this.eqResultBox = document.getElementById("eq-result-box");
    this.formulaEl = document.getElementById("eq-formula-display");
    this.descEl = document.getElementById("eq-desc-display");
  }

  bindEvents() {
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
          this.highlightFormula();
        }
      });
    }

    if (this.eqSearch) {
      const handleSearch = () => {
        this.searchEquations(this.eqSearch.value);
      };
      this.eqSearch.addEventListener("input", handleSearch);
      this.eqSearch.addEventListener("change", handleSearch);
      this.eqSearch.addEventListener("compositionend", handleSearch);

      this.eqSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.searchEquations(this.eqSearch.value);
          this.highlightFormula();
        }
      });
    }

    if (this.btnClearSearch) {
      this.btnClearSearch.addEventListener("click", () => {
        this.clearSearch();
      });
    }

    if (this.btnComputeEq) {
      this.btnComputeEq.addEventListener("click", () => {
        this.computeCurrentEquation();
      });
    }
  }

  clearSearch() {
    if (this.eqSearch) this.eqSearch.value = "";
    if (this.btnClearSearch) this.btnClearSearch.style.display = "none";
    if (this.searchFeedback) this.searchFeedback.innerHTML = "";
    this.filterEquationsByCategory(this.eqCatSelect ? this.eqCatSelect.value : "all");
    this.renderEquationDetail();
  }

  highlightFormula() {
    const card = document.querySelector("#tab-equations .formula-display-card") || this.formulaEl;
    if (card) {
      card.classList.remove("highlight-flash");
      void card.offsetWidth;
      card.classList.add("highlight-flash");
    }
  }

  render() {
    if (!this.eqCatSelect) return;
    const isZh = this.app.currentLang === "zh";

    this.eqCatSelect.innerHTML = `
      <option value="all">${I18N[this.app.currentLang].allEqCats}</option>
      ${EQUATION_CATEGORIES.map(c => `
        <option value="${c.id}">${isZh ? c.nameZh : c.nameEn}</option>
      `).join("")}
    `;

    if (this.eqSearch && this.eqSearch.value.trim()) {
      this.searchEquations(this.eqSearch.value);
    } else {
      this.filterEquationsByCategory("all");
      this.renderEquationDetail();
    }
  }

  filterEquationsByCategory(catId) {
    if (!this.eqSelect) return;
    const isZh = this.app.currentLang === "zh";
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
    const isZh = this.app.currentLang === "zh";
    const rawKw = keyword.trim().toLowerCase();
    const cleanKw = rawKw.replace(/[-\s_]/g, "");

    if (!rawKw) {
      this.clearSearch();
      return;
    }

    if (this.btnClearSearch) {
      this.btnClearSearch.style.display = "block";
    }

    // 震波 / 激波同義詞轉換
    const synKws = [rawKw];
    if (rawKw.includes("震波")) synKws.push(rawKw.replace(/震波/g, "激波"));
    if (rawKw.includes("激波")) synKws.push(rawKw.replace(/激波/g, "震波"));
    if (rawKw.includes("shock")) synKws.push("jump");

    const matches = EQUATIONS_DATABASE.filter(e => {
      const nameZh = e.nameZh.toLowerCase();
      const nameEn = e.nameEn.toLowerCase();
      const cleanNameEn = nameEn.replace(/[-\s_]/g, "");
      const cleanId = e.id.toLowerCase().replace(/[-\s_]/g, "");
      const descZh = (e.descZh || "").toLowerCase();
      const descEn = (e.descEn || "").toLowerCase();
      const latex = (e.formulaLatex || "").toLowerCase();

      // 所屬分類名稱比對
      const catObj = EQUATION_CATEGORIES.find(c => c.id === e.category);
      const catNameZh = catObj ? catObj.nameZh.toLowerCase() : "";
      const catNameEn = catObj ? catObj.nameEn.toLowerCase() : "";

      // 基本比對與同義詞檢索
      const basicMatch = synKws.some(k => {
        return nameZh.includes(k) ||
               nameEn.includes(k) ||
               descZh.includes(k) ||
               descEn.includes(k) ||
               latex.includes(k) ||
               catNameZh.includes(k) ||
               catNameEn.includes(k);
      });

      if (basicMatch || cleanNameEn.includes(cleanKw) || cleanId.includes(cleanKw)) {
        return true;
      }

      // 輸入變數名稱與代號比對
      if (e.inputs && e.inputs.length > 0) {
        return e.inputs.some(inp => {
          const inpId = (inp.id || "").toLowerCase();
          const inpNameZh = (inp.nameZh || "").toLowerCase();
          const inpNameEn = (inp.nameEn || "").toLowerCase();
          return inpId.includes(rawKw) || inpNameZh.includes(rawKw) || inpNameEn.includes(rawKw);
        });
      }

      return false;
    });

    if (matches.length > 0) {
      this.selectedEquation = matches[0];
      this.eqSelect.innerHTML = matches.map(e => `
        <option value="${e.id}">${isZh ? e.nameZh : e.nameEn}</option>
      `).join("");
      this.eqSelect.value = matches[0].id;

      if (this.eqCatSelect) {
        this.eqCatSelect.value = matches[0].category;
      }

      this.renderEquationDetail();
      this.renderSearchFeedback(matches, rawKw);
    } else {
      this.eqSelect.innerHTML = `
        <option value="">${isZh ? "（查無相符方程式）" : "(No matching equation)"}</option>
      `;
      this.renderSearchEmpty(rawKw);
    }
  }

  renderSearchFeedback(matches, kw) {
    if (!this.searchFeedback) return;
    const isZh = this.app.currentLang === "zh";

    const countText = isZh
      ? `找到 ${matches.length} 個與「${kw}」相符的方程式：`
      : `Found ${matches.length} matching equation(s) for "${kw}":`;

    this.searchFeedback.innerHTML = `
      <div class="search-count-text">${countText}</div>
      <div class="search-chips-list">
        ${matches.map(e => `
          <button type="button" class="search-chip ${e.id === this.selectedEquation.id ? 'active' : ''}" data-eid="${e.id}">
            ${isZh ? e.nameZh : e.nameEn}
          </button>
        `).join("")}
      </div>
    `;

    this.searchFeedback.querySelectorAll(".search-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const eid = btn.getAttribute("data-eid");
        const targetEq = EQUATIONS_DATABASE.find(x => x.id === eid);
        if (targetEq) {
          this.selectedEquation = targetEq;
          if (this.eqSelect) this.eqSelect.value = targetEq.id;
          if (this.eqCatSelect) this.eqCatSelect.value = targetEq.category;
          this.renderEquationDetail();
          this.highlightFormula();

          this.searchFeedback.querySelectorAll(".search-chip").forEach(c => {
            c.classList.toggle("active", c.getAttribute("data-eid") === eid);
          });
        }
      });
    });
  }

  renderSearchEmpty(kw) {
    if (!this.searchFeedback) return;
    const isZh = this.app.currentLang === "zh";

    this.searchFeedback.innerHTML = `
      <div class="search-empty-hint">
        ${isZh
          ? `⚠️ 查無與「<strong>${kw}</strong>」相符的方程式。請嘗試輸入方程式名稱（如 Alfven、迴旋、Kappa）、代號（如 v_A、debye）或分類。`
          : `⚠️ No equation matched "<strong>${kw}</strong>". Try searching by equation name (e.g. Alfven, Gyro), symbol (v_A), or category.`}
      </div>
    `;

    if (this.formulaEl) {
      this.formulaEl.textContent = isZh ? "（查無符合方程式）" : "(No matching equation)";
    }
    if (this.descEl) {
      this.descEl.textContent = isZh ? "請修改或清空搜尋字詞以重新瀏覽方程式庫。" : "Please clear or revise your search keywords.";
    }
    if (this.eqInputsContainer) {
      this.eqInputsContainer.innerHTML = "";
    }
  }

  renderEquationDetail() {
    const eq = this.selectedEquation;
    if (!eq) return;

    const isZh = this.app.currentLang === "zh";

    if (window.katex && eq.formulaLatex && this.formulaEl) {
      try {
        window.katex.render(eq.formulaLatex, this.formulaEl, {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        this.formulaEl.textContent = eq.formulaLatex;
      }
    } else if (this.formulaEl) {
      this.formulaEl.textContent = eq.formulaLatex;
    }

    if (this.descEl) {
      this.descEl.textContent = isZh ? eq.descZh : eq.descEn;
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
            <select class="smart-unit-select eq-param-unit" data-param="${input.id}" title="${isZh ? '切換單位 (自動無損換算)' : 'Switch unit (Auto-convert)'}">
              ${qDef.units.map(u => `
                <option value="${u.id}" ${u.id === input.defaultUnit ? "selected" : ""}>
                  ${isZh ? (u.labelZh || u.label) : (u.labelEn || u.label)}
                </option>
              `).join("")}
            </select>
          `;
        }

        row.innerHTML = `
          <div class="form-group flex-1">
            <label class="form-label">${isZh ? input.nameZh : input.nameEn}</label>
            <div class="smart-input-group">
              <input type="number" step="any" class="smart-input-field eq-param-input" data-param="${input.id}" value="${input.default}">
              ${unitSelectHtml}
            </div>
          </div>
        `;
      }

      this.eqInputsContainer.appendChild(row);
    });

    if (this.app && this.app.modernUI) {
      this.app.modernUI.bindSmartInputEvents(this.eqInputsContainer, () => {
        this.computeCurrentEquation();
      });
    }

    this.computeCurrentEquation();
  }

  computeCurrentEquation() {
    const eq = this.selectedEquation;
    if (!eq || !this.eqInputsContainer) return;
    const isZh = this.app.currentLang === "zh";

    const inputs = {};
    const units = {};

    // 清除既有錯誤標記
    this.eqInputsContainer.querySelectorAll(".smart-input-group, .form-input").forEach(el => {
      el.classList.remove("smart-input-error");
    });

    try {
      eq.inputs.forEach(param => {
        if (param.type === "select") {
          const selectEl = this.eqInputsContainer.querySelector(`.eq-param-input[data-param="${param.id}"]`);
          const chosen = param.options.find(o => o.value === (selectEl ? selectEl.value : param.default));
          inputs[param.id] = chosen;
        } else {
          const inputEl = this.eqInputsContainer.querySelector(`.eq-param-input[data-param="${param.id}"]`);
          const rawVal = inputEl ? parseFloat(inputEl.value) : (param.default || 0);
          const parentGroup = inputEl ? inputEl.closest(".smart-input-group") || inputEl : null;

          if (param.unitCategory) {
            const unitEl = this.eqInputsContainer.querySelector(`.eq-param-unit[data-param="${param.id}"]`);
            const qDef = PHYSICAL_QUANTITIES.find(q => q.id === param.unitCategory);
            const uDef = qDef ? qDef.units.find(u => u.id === (unitEl ? unitEl.value : param.defaultUnit)) : null;
            units[param.id] = uDef;

            // 物理邊界防禦斷言
            if (param.unitCategory === "magnetic_field" && rawVal <= 0) {
              if (parentGroup) parentGroup.classList.add("smart-input-error");
              throw new RangeError(isZh ? "磁場強度必須大於 0 (B > 0)" : "Magnetic field B must be greater than 0");
            }
            if (param.unitCategory === "density" && rawVal <= 0) {
              if (parentGroup) parentGroup.classList.add("smart-input-error");
              throw new RangeError(isZh ? "數密度必須大於 0 (n > 0)" : "Number density n must be greater than 0");
            }
            if (param.unitCategory === "temperature") {
              const valK = uDef && uDef.id === "eV" ? rawVal * 11604.518 : rawVal;
              if (valK < 0) {
                if (parentGroup) parentGroup.classList.add("smart-input-error");
                throw new RangeError(isZh ? "熱力學溫度不可低於絕對零度 (T ≥ 0 K)" : "Temperature cannot be below 0 K");
              }
            }
          }

          inputs[param.id] = isNaN(rawVal) ? 0 : rawVal;
        }
      });

      const outputs = eq.calculate(inputs, units);

      // 檢查輸出結果防禦
      if (!outputs || outputs.some(o => isNaN(o.value) || !isFinite(o.value))) {
        throw new RangeError(isZh ? "數值超出物理計算範圍 (產生除以零或無效值)" : "Calculation resulted in an invalid or infinite value");
      }

      this.renderEquationOutputs(outputs);
    } catch (err) {
      if (this.eqResultBox) {
        this.eqResultBox.innerHTML = `
          <div class="calc-error-banner">
            <span class="error-icon">⚠️</span>
            <div><strong>${isZh ? "【物理邊界防禦警告】" : "[Physical Boundary Warning]"}</strong> ${err.message}</div>
          </div>
        `;
      }
    }
  }

  renderEquationOutputs(outputs) {
    if (!this.eqResultBox) return;
    const isZh = this.app.currentLang === "zh";

    this.eqResultBox.innerHTML = `
      <div class="eq-outputs-grid">
        ${outputs.map(out => {
          const formatted = Math.abs(out.value) < 1e-3 || Math.abs(out.value) >= 1e6
            ? out.value.toExponential(4)
            : out.value.toLocaleString(undefined, { maximumFractionDigits: 4 });

          const outUnitDisplay = isZh ? (out.unitZh || out.unit) : (out.unitEn || out.unit);
          const copyVal = out.value.toString();
          const copyWithUnit = `${formatted} ${outUnitDisplay}`;
          const copyLatex = `${Math.abs(out.value) < 1e-3 || Math.abs(out.value) >= 1e6 ? out.value.toExponential(4).replace("e", "\\times 10^{") + "}" : formatted}\\text{ ${outUnitDisplay}}`;

          let altHtml = "";
          if (out.altUnits && out.altUnits.length > 0) {
            altHtml = `
              <div class="eq-alt-units">
                ${out.altUnits.map(a => {
                  const av = Math.abs(a.value) < 1e-3 || Math.abs(a.value) >= 1e6
                    ? a.value.toExponential(4)
                    : a.value.toLocaleString(undefined, { maximumFractionDigits: 4 });
                  const aLabel = isZh ? (a.labelZh || a.label) : (a.labelEn || a.label);
                  return `<span>= <strong>${av}</strong> ${aLabel}</span>`;
                }).join(" ")}
              </div>
            `;
          }

          let meterType = "velocity";
          const uStr = out.unit || "";
          if (uStr.includes("Hz") || uStr.includes("rad/s")) meterType = "frequency";
          else if (uStr.includes("m") || uStr.includes("km")) meterType = "length";
          else if (uStr === "" || uStr === "1") meterType = "dimensionless";

          const meterHtml = typeof ModernUIController !== "undefined"
            ? ModernUIController.renderContextMeter(out.value, meterType)
            : "";

          return `
            <div class="modern-result-card">
              <div class="result-card-header">
                <div class="result-val-title">${isZh ? out.labelZh : out.labelEn}</div>
                <div class="result-actions-bar">
                  <button type="button" class="btn-copy-chip" data-copy-text="${copyVal}" title="${isZh ? '複製數值' : 'Copy value'}">${isZh ? '📋 數值' : '📋 Value'}</button>
                  <button type="button" class="btn-copy-chip" data-copy-text="${copyWithUnit}" title="${isZh ? '複製帶單位' : 'Copy with unit'}">${isZh ? '📋 帶單位' : '📋 With Unit'}</button>
                  <button type="button" class="btn-copy-chip" data-copy-text="${copyLatex}" title="LaTeX">📋 LaTeX</button>
                </div>
              </div>
              <div class="result-val-display">
                <span class="val">${formatted}</span>
                <span class="unit-str">${outUnitDisplay}</span>
              </div>
              ${altHtml}
              ${meterHtml}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
}
