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

  render() {
    if (!this.eqCatSelect) return;
    const isZh = this.app.currentLang === "zh";

    this.eqCatSelect.innerHTML = `
      <option value="all">${I18N[this.app.currentLang].allEqCats}</option>
      ${EQUATION_CATEGORIES.map(c => `
        <option value="${c.id}">${isZh ? c.nameZh : c.nameEn}</option>
      `).join("")}
    `;

    this.filterEquationsByCategory("all");
    this.renderEquationDetail();
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
    const kw = keyword.trim().toLowerCase();
    const cleanKw = kw.replace(/[-\s_]/g, "");
    if (!kw) {
      this.filterEquationsByCategory(this.eqCatSelect ? this.eqCatSelect.value : "all");
      return;
    }

    const matches = EQUATIONS_DATABASE.filter(e => {
      const nameZh = e.nameZh.toLowerCase();
      const nameEn = e.nameEn.toLowerCase();
      const cleanNameEn = nameEn.replace(/[-\s_]/g, "");
      const idStr = e.id.toLowerCase().replace(/[-\s_]/g, "");
      const descZh = (e.descZh || "").toLowerCase();
      const descEn = (e.descEn || "").toLowerCase();

      return nameZh.includes(kw) ||
             nameEn.includes(kw) ||
             cleanNameEn.includes(cleanKw) ||
             idStr.includes(cleanKw) ||
             descZh.includes(kw) ||
             descEn.includes(kw) ||
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
            <div class="form-group flex-1">
              <label class="form-label">${isZh ? '單位' : 'Unit'}</label>
              <select class="form-select eq-param-unit" data-param="${input.id}">
                ${qDef.units.map(u => `
                  <option value="${u.id}" ${u.id === input.defaultUnit ? "selected" : ""}>
                    ${isZh ? (u.labelZh || u.label) : (u.labelEn || u.label)}
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
    const isZh = this.app.currentLang === "zh";

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
                  const aLabel = isZh ? (a.labelZh || a.label) : (a.labelEn || a.label);
                  return `<span>= <strong>${av}</strong> ${aLabel}</span>`;
                }).join(" ")}
              </div>
            `;
          }

          const outUnitDisplay = isZh ? (out.unitZh || out.unit) : (out.unitEn || out.unit);

          return `
            <div class="eq-output-card">
              <div class="eq-out-label">${isZh ? out.labelZh : out.labelEn}</div>
              <div class="eq-out-value">
                <span class="val">${formatted}</span>
                <span class="unit">${outUnitDisplay}</span>
              </div>
              ${altHtml}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
}
