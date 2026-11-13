/**
 * js/tab-equations.js - 分頁三：常用太空物理方程式庫視圖適配器 (View Adapter)
 * 委派 EquationSolver 進行物理邊界斷言、數值解算與標尺映射 (< 260 行)
 */

class EquationsTabController {
  constructor(app) {
    this.app = app;
    this.selectedEquation = typeof EQUATIONS_DATABASE !== "undefined" ? EQUATIONS_DATABASE[0] : null;
    this.initDOM();
    this.bindEvents();
    if (typeof AppStateStore !== "undefined") {
      AppStateStore.subscribeKey("lang", () => this.render());
    }
    this.render();
  }

  initDOM() {
    [
      ["eqCatSelect", "eq-cat-select"], ["eqSelect", "eq-select"],
      ["eqSearch", "eq-search-input"], ["btnClearSearch", "btn-clear-eq-search"],
      ["searchFeedback", "eq-search-feedback"], ["eqInputsContainer", "eq-inputs-container"],
      ["btnComputeEq", "btn-compute-eq"], ["eqResultBox", "eq-result-box"],
      ["formulaEl", "eq-formula-display"], ["descEl", "eq-desc-display"]
    ].forEach(([prop, id]) => { this[prop] = document.getElementById(id); });
  }

  bindEvents() {
    this.eqCatSelect?.addEventListener("change", () => this.filterEquationsByCategory(this.eqCatSelect.value));
    this.eqSelect?.addEventListener("change", () => {
      const eq = EQUATIONS_DATABASE.find(e => e.id === this.eqSelect.value);
      if (eq) { this.selectedEquation = eq; this.renderEquationDetail(); this.highlightFormula(); }
    });

    if (this.eqSearch) {
      const onSearch = () => this.searchEquations(this.eqSearch.value);
      ["input", "change", "compositionend"].forEach(ev => this.eqSearch.addEventListener(ev, onSearch));
      this.eqSearch.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); onSearch(); this.highlightFormula(); } });
    }

    this.btnClearSearch?.addEventListener("click", () => this.clearSearch());
    this.btnComputeEq?.addEventListener("click", () => this.computeCurrentEquation());
  }

  clearSearch() {
    if (this.eqSearch) this.eqSearch.value = "";
    this.btnClearSearch && (this.btnClearSearch.style.display = "none");
    this.searchFeedback && (this.searchFeedback.innerHTML = "");
    this.filterEquationsByCategory(this.eqCatSelect?.value || "all");
  }

  highlightFormula() {
    const card = document.querySelector("#tab-equations .formula-display-card") || this.formulaEl;
    if (card) { card.classList.remove("highlight-flash"); void card.offsetWidth; card.classList.add("highlight-flash"); }
  }

  render() {
    if (!this.eqCatSelect) return;
    const isZh = (typeof AppStateStore !== "undefined" ? AppStateStore.get("lang") : this.app.currentLang) === "zh";
    const dict = (typeof I18N !== "undefined" && I18N[isZh ? "zh" : "en"]) || { allEqCats: "所有分類" };
    this.eqCatSelect.innerHTML = `<option value="all">${dict.allEqCats}</option>${EQUATION_CATEGORIES.map(c => `<option value="${c.id}">${isZh ? c.nameZh : c.nameEn}</option>`).join("")}`;
    if (this.eqSearch?.value.trim()) this.searchEquations(this.eqSearch.value); else this.filterEquationsByCategory(this.eqCatSelect?.value || "all");
  }

  filterEquationsByCategory(catId) {
    if (!this.eqSelect) return;
    const isZh = (typeof AppStateStore !== "undefined" ? AppStateStore.get("lang") : this.app.currentLang) === "zh";
    const filtered = catId === "all" ? EQUATIONS_DATABASE : EQUATIONS_DATABASE.filter(e => e.category === catId);
    if (this.eqCatSelect && this.eqCatSelect.value !== catId) this.eqCatSelect.value = catId;
    document.querySelectorAll(".eq-filter-pill").forEach(p => p.classList.toggle("active", p.getAttribute("data-cat") === catId));
    this.eqSelect.innerHTML = filtered.map(e => `<option value="${e.id}">${isZh ? e.nameZh : e.nameEn}</option>`).join("");
    if (filtered.length > 0) {
      this.selectedEquation = filtered[0];
      this.eqSelect.value = filtered[0].id;
      this.renderEquationDetail();
    }
  }

  searchEquations(keyword) {
    if (!this.eqSelect) return;
    const isZh = (typeof AppStateStore !== "undefined" ? AppStateStore.get("lang") : this.app.currentLang) === "zh";
    const rawKw = keyword.trim().toLowerCase();
    if (!rawKw) { this.clearSearch(); return; }
    if (this.btnClearSearch) this.btnClearSearch.style.display = "block";

    const syns = [rawKw, rawKw.replace(/震波/g, "激波"), rawKw.replace(/激波/g, "震波")];
    const matches = EQUATIONS_DATABASE.filter(e => {
      const nZh = e.nameZh.toLowerCase(), nEn = e.nameEn.toLowerCase();
      const dZh = (e.descZh || "").toLowerCase(), dEn = (e.descEn || "").toLowerCase();
      const cat = EQUATION_CATEGORIES.find(c => c.id === e.category);
      const catZh = cat ? cat.nameZh.toLowerCase() : "", catEn = cat ? cat.nameEn.toLowerCase() : "";
      if (syns.some(k => nZh.includes(k) || nEn.includes(k) || dZh.includes(k) || dEn.includes(k) || (e.formulaLatex || "").toLowerCase().includes(k) || catZh.includes(k) || catEn.includes(k))) return true;
      if (nEn.replace(/[-\s_]/g, "").includes(rawKw.replace(/[-\s_]/g, "")) || e.id.toLowerCase().replace(/[-\s_]/g, "").includes(rawKw.replace(/[-\s_]/g, ""))) return true;
      return e.inputs?.some(i => (i.id || "").toLowerCase().includes(rawKw) || (i.nameZh || "").toLowerCase().includes(rawKw) || (i.nameEn || "").toLowerCase().includes(rawKw));
    });

    if (matches.length > 0) {
      this.selectedEquation = matches[0];
      this.eqSelect.innerHTML = matches.map(e => `<option value="${e.id}">${isZh ? e.nameZh : e.nameEn}</option>`).join("");
      this.eqSelect.value = matches[0].id;
      if (this.eqCatSelect) this.eqCatSelect.value = matches[0].category;
      document.querySelectorAll(".eq-filter-pill").forEach(p => p.classList.toggle("active", p.getAttribute("data-cat") === matches[0].category));
      this.renderEquationDetail();
      this.renderSearchFeedback(matches, rawKw);
    } else {
      this.eqSelect.innerHTML = `<option value="">${isZh ? "（查無相符方程式）" : "(No matching equation)"}</option>`;
      this.renderSearchEmpty(rawKw);
    }
  }

  renderSearchFeedback(matches, kw) {
    if (!this.searchFeedback) return;
    const isZh = (typeof AppStateStore !== "undefined" ? AppStateStore.get("lang") : this.app.currentLang) === "zh";
    this.searchFeedback.innerHTML = `
      <div class="search-count-text">${isZh ? `找到 ${matches.length} 個與「${kw}」相符的方程式：` : `Found ${matches.length} matching equation(s) for "${kw}":`}</div>
      <div class="search-chips-list">${matches.map(e => `<button type="button" class="search-chip ${e.id === this.selectedEquation.id ? 'active' : ''}" data-eid="${e.id}">${isZh ? e.nameZh : e.nameEn}</button>`).join("")}</div>
    `;
    this.searchFeedback.querySelectorAll(".search-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetEq = EQUATIONS_DATABASE.find(x => x.id === btn.getAttribute("data-eid"));
        if (!targetEq) return;
        this.selectedEquation = targetEq;
        if (this.eqSelect) this.eqSelect.value = targetEq.id;
        if (this.eqCatSelect) this.eqCatSelect.value = targetEq.category;
        this.renderEquationDetail();
        this.highlightFormula();
        this.searchFeedback.querySelectorAll(".search-chip").forEach(c => c.classList.toggle("active", c.getAttribute("data-eid") === targetEq.id));
      });
    });
  }

  renderSearchEmpty(kw) {
    if (!this.searchFeedback) return;
    const isZh = (typeof AppStateStore !== "undefined" ? AppStateStore.get("lang") : this.app.currentLang) === "zh";
    this.searchFeedback.innerHTML = `<div class="search-empty-hint">${isZh ? `查無與「<strong>${kw}</strong>」相符的方程式。請嘗試名稱、代號或分類。` : `No equation matched "<strong>${kw}</strong>".`}</div>`;
    if (this.formulaEl) this.formulaEl.textContent = isZh ? "（查無符合方程式）" : "(No matching equation)";
    if (this.descEl) this.descEl.textContent = isZh ? "請修改或清空搜尋字詞以重新瀏覽方程式庫。" : "Please clear or revise your search keywords.";
    if (this.eqInputsContainer) this.eqInputsContainer.innerHTML = "";
  }

  renderEquationDetail() {
    const eq = this.selectedEquation;
    if (!eq) return;
    const isZh = (typeof AppStateStore !== "undefined" ? AppStateStore.get("lang") : this.app.currentLang) === "zh";

    if (window.katex && eq.formulaLatex && this.formulaEl) {
      try { window.katex.render(eq.formulaLatex, this.formulaEl, { displayMode: true, throwOnError: false }); }
      catch (_) { this.formulaEl.textContent = eq.formulaLatex; }
    } else if (this.formulaEl) {
      this.formulaEl.textContent = eq.formulaLatex;
    }

    if (this.descEl) this.descEl.textContent = isZh ? eq.descZh : eq.descEn;
    if (!this.eqInputsContainer) return;
    this.eqInputsContainer.innerHTML = "";

    eq.inputs.forEach(input => {
      const row = document.createElement("div");
      row.className = "form-row eq-param-row";
      if (input.type === "select") {
        row.innerHTML = `<div class="form-group flex-2"><label class="form-label">${isZh ? input.nameZh : input.nameEn}</label><select class="form-select eq-param-input" data-param="${input.id}">${input.options.map(opt => `<option value="${opt.value}" ${opt.value === input.default ? "selected" : ""}>${isZh ? opt.labelZh : opt.labelEn}</option>`).join("")}</select></div>`;
      } else {
        const qDef = (typeof UnitSystemEngine !== "undefined" && input.unitCategory) ? UnitSystemEngine.getQuantity(input.unitCategory) : (input.unitCategory && typeof PHYSICAL_QUANTITIES !== "undefined" ? PHYSICAL_QUANTITIES.find(q => q.id === input.unitCategory) : null);
        const unitHtml = qDef ? `<select class="smart-unit-select eq-param-unit" data-param="${input.id}" title="${isZh ? '切換單位' : 'Switch unit'}">${qDef.units.map(u => `<option value="${u.id}" ${u.id === input.defaultUnit ? "selected" : ""}>${isZh ? (u.labelZh || u.label) : (u.labelEn || u.label)}</option>`).join("")}</select>` : "";
        row.innerHTML = `<div class="form-group flex-1"><label class="form-label">${isZh ? input.nameZh : input.nameEn}</label><div class="smart-input-group"><input type="number" step="any" class="smart-input-field eq-param-input" data-param="${input.id}" value="${input.default}">${unitHtml}</div></div>`;
      }
      this.eqInputsContainer.appendChild(row);
    });

    this.app?.modernUI?.bindSmartInputEvents(this.eqInputsContainer, () => this.computeCurrentEquation());
    this.app?.presetState?.takeBaselineSnapshot();
    this.computeCurrentEquation();
  }

  computeCurrentEquation() {
    const eq = this.selectedEquation;
    if (!eq || !this.eqInputsContainer) return;
    const isZh = (typeof AppStateStore !== "undefined" ? AppStateStore.get("lang") : this.app.currentLang) === "zh";

    this.eqInputsContainer.querySelectorAll(".smart-input-group, .form-input, .eq-param-input").forEach(el => el.classList.remove("smart-input-error", "input-shake"));

    const rawInputs = {}, inputUnits = {};
    eq.inputs.forEach(param => {
      const inputEl = this.eqInputsContainer.querySelector(`.eq-param-input[data-param="${param.id}"]`);
      if (param.type === "select") {
        rawInputs[param.id] = inputEl ? inputEl.value : param.default;
      } else {
        rawInputs[param.id] = inputEl ? parseFloat(inputEl.value) : (param.default || 0);
        if (param.unitCategory) {
          const unitEl = this.eqInputsContainer.querySelector(`.eq-param-unit[data-param="${param.id}"]`);
          const qDef = (typeof UnitSystemEngine !== "undefined") ? UnitSystemEngine.getQuantity(param.unitCategory) : PHYSICAL_QUANTITIES.find(q => q.id === param.unitCategory);
          inputUnits[param.id] = qDef ? qDef.units.find(u => u.id === (unitEl ? unitEl.value : param.defaultUnit)) : null;
        }
      }
    });

    const result = EquationSolver.solve(eq, rawInputs, inputUnits, { isZh });
    if (result.hasError) {
      if (result.violatedParamId) {
        const inp = this.eqInputsContainer.querySelector(`.eq-param-input[data-param="${result.violatedParamId}"]`);
        const grp = inp ? inp.closest(".smart-input-group") || inp : null;
        if (grp) { grp.classList.remove("input-shake"); void grp.offsetWidth; grp.classList.add("smart-input-error", "input-shake"); }
      }
      if (this.eqResultBox) {
        this.eqResultBox.innerHTML = `<div class="calc-error-banner input-shake" role="alert"><span class="error-badge">!</span><div><strong>${isZh ? "【物理邊界防禦警告】" : "[Physical Boundary Warning]"}</strong> ${result.message}</div></div>`;
      }
      return;
    }
    this.renderEquationOutputs(result.outputs);
  }

  renderEquationOutputs(outputs) {
    if (!this.eqResultBox) return;
    const isZh = (typeof AppStateStore !== "undefined" ? AppStateStore.get("lang") : this.app.currentLang) === "zh";

    this.eqResultBox.innerHTML = `<div class="eq-outputs-grid">${outputs.map((out, outIdx) => {
      const baseUnit = out.baseUnitStr || out.unit || "";
      const allUnits = out.allUnits || [{ label: baseUnit, value: out.value, isBase: true }];
      out._allUnits = allUnits;
      const fmtVal = this.formatNum(out.value);
      const copyLatex = `${this.formatLatexNum(out.value)}\\text{ ${baseUnit}}`;

      const altHtml = (out.altUnits && out.altUnits.length > 0) ? `<div class="eq-alt-units" id="eq-alt-units-${outIdx}">${out.altUnits.map(a => `<span>= <strong>${this.formatNum(a.value)}</strong> ${a.label} <span class="unit-sys-tag">[${a.system}]</span></span>`).join(" ")}</div>` : "";
      const meterHtml = (typeof ModernUIController !== "undefined" && out.meterType) ? ModernUIController.renderContextMeter(out.value, out.meterType, out.unit || "", isZh) : "";
      const baseSysTag = out.baseSystem ? ` <span class="unit-sys-badge">[${out.baseSystem}]</span>` : "";

      const selHtml = allUnits.length > 1
        ? `<select class="smart-unit-select eq-out-unit-select" data-out-idx="${outIdx}" title="${isZh ? '切換輸出單位' : 'Switch output unit'}" style="margin-left: 0.5rem; font-size: 0.95rem; vertical-align: middle;">${allUnits.map((u, i) => `<option value="${i}">${u.label}${u.system ? ` [${u.system}]` : ''}</option>`).join("")}</select>`
        : `<span class="unit-str">${baseUnit}</span>${baseSysTag}`;

      return `<div class="modern-result-card" id="modern-result-card-${outIdx}">
        <div class="result-card-header"><div class="result-val-title">${isZh ? out.labelZh : out.labelEn}</div><div class="result-actions-bar">
          <button type="button" class="btn-copy-chip btn-copy-val" data-copy-text="${out.value}" title="${isZh ? '複製數值' : 'Copy value'}">${isZh ? '數值' : 'Value'}</button>
          <button type="button" class="btn-copy-chip btn-copy-with-unit" data-copy-text="${fmtVal} ${baseUnit}" title="${isZh ? '複製帶單位' : 'Copy with unit'}">${isZh ? '帶單位' : 'With Unit'}</button>
          <button type="button" class="btn-copy-chip btn-copy-latex" data-copy-text="${copyLatex}" title="LaTeX">LaTeX</button>
        </div></div>
        <div class="result-val-display"><span class="val">${fmtVal}</span>${selHtml}</div>
        ${altHtml}${meterHtml}
      </div>`;
    }).join("")}</div>`;

    this.eqResultBox.querySelectorAll(".eq-out-unit-select").forEach(sel => {
      sel.addEventListener("change", (e) => {
        const outIdx = parseInt(sel.getAttribute("data-out-idx"), 10);
        const selected = (outputs[outIdx]?._allUnits || [])[parseInt(e.target.value, 10)];
        const card = document.getElementById(`modern-result-card-${outIdx}`);
        if (!selected || !card) return;
        const fmt = this.formatNum(selected.value);
        card.querySelector(".val") && (card.querySelector(".val").textContent = fmt);
        card.querySelector(".btn-copy-val")?.setAttribute("data-copy-text", selected.value.toString());
        card.querySelector(".btn-copy-with-unit")?.setAttribute("data-copy-text", `${fmt} ${selected.label}`);
        card.querySelector(".btn-copy-latex")?.setAttribute("data-copy-text", `${this.formatLatexNum(selected.value)}\\text{ ${selected.label}}`);
      });
    });
  }

  formatNum(val) { return Math.abs(val) < 1e-3 || Math.abs(val) >= 1e6 ? val.toExponential(4) : val.toLocaleString(undefined, { maximumFractionDigits: 4 }); }
  formatLatexNum(val) { return Math.abs(val) < 1e-3 || Math.abs(val) >= 1e6 ? val.toExponential(4).replace("e", "\\times 10^{") + "}" : this.formatNum(val); }
}
