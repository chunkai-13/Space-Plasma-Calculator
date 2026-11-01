/**
 * js/builder-cards-list.js - 建構區頂層多項式項目卡片清單 UI 渲染器
 * 支援卡片折疊/展開、移動排序、數值輸入與多語系即時切換
 */

class BuilderCardsListUI {
  constructor(builder) {
    this.builder = builder;
    this.collapsedIds = new Set();
  }

  get app() { return this.builder.app; }
  get calculator() { return this.builder.calculator; }
  get termsContainer() { return this.builder.termsContainer; }

  // 全部收合 / 展開切換
  toggleCollapseAll() {
    const tokens = this.calculator.tokens;
    if (tokens.length === 0) return;
    if (this.collapsedIds.size >= tokens.length) {
      this.collapsedIds.clear();
    } else {
      tokens.forEach(t => this.collapsedIds.add(t.id));
    }
    this.renderTermsList();
  }

  // 單張卡片收合 / 展開切換
  toggleCardCollapse(tokenId) {
    if (this.collapsedIds.has(tokenId)) {
      this.collapsedIds.delete(tokenId);
    } else {
      this.collapsedIds.add(tokenId);
    }
    this.renderTermsList();
  }

  // 生成折疊時顯示的項目精簡摘要
  getTermSummary(term, isZh) {
    if (term.type === "quantity") {
      const q = this.calculator.getQuantityDef(term.quantityId);
      const name = isZh ? q.nameZh : q.nameEn;
      return `${q.symbol} (${name}): ${term.numberValue} ${term.unitId}${term.power !== 1 ? `^${term.power}` : ''}`;
    }
    if (term.type === "constant") {
      const c = this.calculator.getConstantDef(term.constantId);
      const name = isZh ? c.nameZh : c.nameEn;
      return `${c.symbol} (${name})${term.power !== 1 ? `^${term.power}` : ''}`;
    }
    if (term.type === "fraction") {
      const numLen = term.numerator ? term.numerator.length : 0;
      const denLen = term.denominator ? term.denominator.length : 0;
      return `⬚/⬚ (${numLen}/${denLen} ${isZh ? '項' : 'items'})`;
    }
    if (term.type === "open_paren") return `( ${isZh ? '開括號' : 'Open'}`;
    if (term.type === "close_paren") return `) ${isZh ? '閉括號' : 'Close'}${term.power !== 1 ? `^${term.power}` : ''}`;
    if (term.type === "operator") return `${term.value === '*' ? '·' : term.value}`;
    return "";
  }

  // 生成標頭控制列 (收合圖示 + 序號 + 摘要 + 控制按鈕)
  renderCardHeaderHtml(term, index, total, dict, extraTitleHtml = "") {
    const isCollapsed = this.collapsedIds.has(term.id);
    const summaryText = this.getTermSummary(term, this.app.currentLang === "zh");
    const upBtn = index > 0 ? `<button type="button" class="btn-move btn-move-up" title="${dict.moveUp}">⬆</button>` : '';
    const downBtn = index < total - 1 ? `<button type="button" class="btn-move btn-move-down" title="${dict.moveDown}">⬇</button>` : '';
    const delTitle = term.type === "operator" ? dict.deleteOp : term.type === "fraction" ? dict.deleteFrac : term.type.includes("paren") ? dict.deleteBracket : dict.deleteItem;

    return `
      <div class="term-header">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn-toggle-collapse" title="${isCollapsed ? dict.expandAll : dict.collapseAll}">▼</button>
          <span class="term-idx">#${index + 1}</span>
          <span class="term-summary-badge">${summaryText}</span>
          ${extraTitleHtml}
        </div>
        <div class="term-ctrl-btns">
          ${upBtn}
          ${downBtn}
          <button type="button" class="btn-delete" title="${delTitle}">✕</button>
        </div>
      </div>
    `;
  }

  // 統一綁定通用按鈕 (收合、移動、刪除)
  bindCommonEvents(card, index, term) {
    const btnCollapse = card.querySelector(".btn-toggle-collapse");
    if (btnCollapse) btnCollapse.addEventListener("click", () => this.toggleCardCollapse(term.id));

    const btnUp = card.querySelector(".btn-move-up");
    if (btnUp) btnUp.addEventListener("click", () => { this.calculator.moveToken(index, index - 1); this.renderTermsList(); });

    const btnDown = card.querySelector(".btn-move-down");
    if (btnDown) btnDown.addEventListener("click", () => { this.calculator.moveToken(index, index + 1); this.renderTermsList(); });

    const btnDel = card.querySelector(".btn-delete");
    if (btnDel) btnDel.addEventListener("click", () => {
      this.collapsedIds.delete(term.id);
      this.calculator.removeTokenAt(index);
      this.renderTermsList();
    });
  }

  // 監聽數值或次方輸入
  bindNumericInput(card, selector, onValue) {
    const input = card.querySelector(selector);
    if (!input) return;
    input.addEventListener("input", () => {
      this.calculator.pushHistory();
      onValue(parseFloat(input.value) || 0);
      this.builder.updateEquationPreview();
    });
  }

  renderTermsList() {
    if (!this.termsContainer) return;
    this.termsContainer.innerHTML = "";
    const isZh = this.app.currentLang === "zh";
    const dict = (typeof I18N !== "undefined" && I18N[this.app.currentLang]) || (typeof window !== "undefined" && window.dict) || {};
    const eqRep = this.calculator.generateEquationRepresentation();
    const total = this.calculator.tokens.length;

    const collapseAllBtn = document.getElementById("btn-collapse-all");
    if (collapseAllBtn) {
      const isAllCollapsed = total > 0 && this.collapsedIds.size >= total;
      const labelSpan = collapseAllBtn.querySelector(".collapse-all-text");
      if (labelSpan) labelSpan.textContent = isAllCollapsed ? dict.expandAll : dict.collapseAll;
    }

    this.calculator.tokens.forEach((term, index) => {
      const card = document.createElement("div");
      card.id = `term-card-${term.id}`;
      const isCollapsed = this.collapsedIds.has(term.id);

      if (term.type === "operator") {
        card.className = `term-card-operator ${isCollapsed ? 'is-collapsed' : ''}`;
        const summaryText = this.getTermSummary(term, isZh);
        const upBtn = index > 0 ? `<button type="button" class="btn-move btn-move-up" title="${dict.moveUp}">⬆</button>` : '';
        const downBtn = index < total - 1 ? `<button type="button" class="btn-move btn-move-down" title="${dict.moveDown}">⬇</button>` : '';

        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="btn-toggle-collapse" title="${isCollapsed ? dict.expandAll : dict.collapseAll}">▼</button>
            <span class="term-idx">#${index + 1}</span>
            <span class="term-summary-badge">${summaryText}</span>
            <div class="op-switch-group">
              <button type="button" class="btn-op ${term.value === '+' ? 'active' : ''}" data-val="+">＋</button>
              <button type="button" class="btn-op ${term.value === '-' ? 'active' : ''}" data-val="-">－</button>
              <button type="button" class="btn-op ${term.value === '*' ? 'active' : ''}" data-val="*">·</button>
              <button type="button" class="btn-op ${term.value === '/' ? 'active' : ''}" data-val="/">/</button>
            </div>
            <span class="op-title-text" style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${dict.standaloneOp}</span>
          </div>
          <div class="term-ctrl-btns">
            ${upBtn}
            ${downBtn}
            <button type="button" class="btn-delete" title="${dict.deleteOp}">✕</button>
          </div>
        `;

        card.querySelectorAll(".op-switch-group .btn-op").forEach(b => {
          b.addEventListener("click", () => {
            this.calculator.pushHistory();
            term.value = b.getAttribute("data-val");
            this.renderTermsList();
          });
        });
        this.bindCommonEvents(card, index, term);
        this.termsContainer.appendChild(card);
        return;
      }

      if (term.type === "fraction") {
        card.className = `term-card term-card-fraction ${isCollapsed ? 'is-collapsed' : ''}`;
        const headerHtml = this.renderCardHeaderHtml(term, index, total, dict, `<span style="font-weight: 700; color: #3b82f6;">${dict.fracStructure}</span>`);
        card.innerHTML = `
          ${headerHtml}
          <div class="fraction-card-container">
            <div class="fraction-card-section">
              <div class="fraction-card-header">
                <span>${dict.fracNumerator} (${term.numerator.length} ${dict.termItem})</span>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm btn-frac-add-qty" data-part="numerator">${dict.btnAddQty}</button>
                  <button type="button" class="btn btn-secondary btn-sm btn-frac-add-const" data-part="numerator">${dict.btnAddConst}</button>
                </div>
              </div>
              <div class="fraction-subitems-list" id="frac-num-list-${term.id}">
                ${term.numerator.length === 0 ? `<span style="font-size: 0.8rem; color: var(--text-muted);">${dict.emptyNumeratorTip}</span>` : ''}
              </div>
            </div>

            <div class="fraction-card-section">
              <div class="fraction-card-header">
                <span>${dict.fracDenominator} (${term.denominator.length} ${dict.termItem})</span>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm btn-frac-add-qty" data-part="denominator">${dict.btnAddQty}</button>
                  <button type="button" class="btn btn-secondary btn-sm btn-frac-add-const" data-part="denominator">${dict.btnAddConst}</button>
                </div>
              </div>
              <div class="fraction-subitems-list" id="frac-den-list-${term.id}">
                ${term.denominator.length === 0 ? `<span style="font-size: 0.8rem; color: var(--text-muted);">${dict.emptyDenominatorTip}</span>` : ''}
              </div>
            </div>

            <div style="display: flex; gap: 1rem; align-items: center; padding-top: 0.25rem; flex-wrap: wrap;">
              <div class="form-group flex-half" style="min-width: 140px;">
                <label class="form-label">${dict.fracMultiplier}</label>
                <input type="number" step="any" class="form-input term-frac-mult-input" value="${term.multiplier !== undefined ? term.multiplier : 1}">
              </div>
              <div class="form-group flex-half" style="min-width: 140px;">
                <label class="form-label">${dict.fracPower}</label>
                <input type="number" step="any" class="form-input term-frac-pwr-input" value="${term.power !== undefined ? term.power : 1}">
              </div>
            </div>
          </div>
        `;

        this.bindCommonEvents(card, index, term);
        card.querySelectorAll(".btn-frac-add-qty").forEach(btn => {
          btn.addEventListener("click", () => {
            const part = btn.getAttribute("data-part");
            const idx = part === "numerator" ? term.numerator.length : term.denominator.length;
            this.calculator.insertQuantity({}, { scope: "fraction", fractionId: term.id, part, index: idx });
            this.renderTermsList();
          });
        });
        card.querySelectorAll(".btn-frac-add-const").forEach(btn => {
          btn.addEventListener("click", () => {
            const part = btn.getAttribute("data-part");
            const idx = part === "numerator" ? term.numerator.length : term.denominator.length;
            this.calculator.insertConstant({}, { scope: "fraction", fractionId: term.id, part, index: idx });
            this.renderTermsList();
          });
        });

        this.bindNumericInput(card, ".term-frac-mult-input", val => { term.multiplier = val || 1; });
        this.bindNumericInput(card, ".term-frac-pwr-input", val => { term.power = val || 1; });

        const numEl = card.querySelector(`#frac-num-list-${term.id}`);
        if (numEl && term.numerator.length > 0) {
          numEl.innerHTML = "";
          term.numerator.forEach((sItem, sIdx) => this.builder.renderSubItemCard(sItem, sIdx, term.numerator, "numerator", term, numEl));
        }
        const denEl = card.querySelector(`#frac-den-list-${term.id}`);
        if (denEl && term.denominator.length > 0) {
          denEl.innerHTML = "";
          term.denominator.forEach((sItem, sIdx) => this.builder.renderSubItemCard(sItem, sIdx, term.denominator, "denominator", term, denEl));
        }

        this.termsContainer.appendChild(card);
        return;
      }

      if (term.type === "open_paren" || term.type === "close_paren") {
        const isOpen = term.type === "open_paren";
        const repItem = eqRep.displayElements && eqRep.displayElements[index];
        const bStyle = repItem && repItem.bracketInfo ? repItem.bracketInfo : { nameZh: "小括號 ( )", openText: "(", closeText: ")" };
        const sym = isOpen ? bStyle.openText : bStyle.closeText;
        card.className = `term-card term-card-paren ${isCollapsed ? 'is-collapsed' : ''}`;
        const headerHtml = this.renderCardHeaderHtml(term, index, total, dict, `<span class="paren-symbol-badge" style="font-size: 1.15rem; margin: 0;">${sym}</span>`);

        card.innerHTML = `
          ${headerHtml}
          <div class="paren-desc-row" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding: 0.25rem 0;">
            <div style="display: flex; align-items: center;">
              <span class="paren-symbol-badge">${sym}</span>
              <span class="paren-desc-text">${isOpen ? (isZh ? `開括號：${bStyle.nameZh}（依層級自動變換）` : `Open Bracket: ${bStyle.nameZh}`) : (isZh ? `閉括號：${bStyle.nameZh}（可指定次方）` : `Close Bracket: ${bStyle.nameZh}`)}</span>
            </div>
            ${!isOpen ? `
            <div class="form-group flex-half" style="min-width: 120px;">
              <label class="form-label">${dict.bracketPower}</label>
              <input type="number" step="any" class="form-input term-paren-power-input" value="${term.power !== undefined ? term.power : 1}">
            </div>
            ` : ''}
          </div>
        `;

        this.bindCommonEvents(card, index, term);
        if (!isOpen) this.bindNumericInput(card, ".term-paren-power-input", val => { term.power = val || 1; });
        this.termsContainer.appendChild(card);
        return;
      }

      // 一般物理量或常數卡片
      card.className = `term-card ${isCollapsed ? 'is-collapsed' : ''}`;
      let itemSelectHtml = "";
      let unitSelectHtml = "";

      if (term.type === "quantity") {
        const qDef = this.calculator.getQuantityDef(term.quantityId);
        itemSelectHtml = `
          <select class="term-qty-select form-select">
            ${PHYSICAL_QUANTITIES.map(q => `<option value="${q.id}" ${q.id === term.quantityId ? "selected" : ""}>${isZh ? q.nameZh : q.nameEn} (${q.symbol})</option>`).join("")}
          </select>
        `;
        unitSelectHtml = `
          <select class="term-unit-select form-select">
            ${qDef.units.map(u => `<option value="${u.id}" ${u.id === term.unitId ? "selected" : ""}>${isZh ? (u.labelZh || u.label) : (u.labelEn || u.label)} [${u.system}]</option>`).join("")}
          </select>
        `;
      } else {
        itemSelectHtml = `
          <select class="term-const-select form-select">
            ${Object.values(PHYSICAL_CONSTANTS).map(c => `<option value="${c.id}" ${c.id === term.constantId ? "selected" : ""}>${c.symbol} - ${isZh ? c.nameZh : c.nameEn} (${c.desc})</option>`).join("")}
          </select>
        `;
        unitSelectHtml = `<span class="const-unit-badge">${this.calculator.getConstantDef(term.constantId).unit}</span>`;
      }

      const headerHtml = this.renderCardHeaderHtml(term, index, total, dict);
      card.innerHTML = `
        ${headerHtml}
        <div class="term-body">
          <div class="form-group flex-2">
            <label class="form-label">${dict.qtyOrConst}</label>
            ${itemSelectHtml}
          </div>
          ${term.type === 'quantity' ? `
          <div class="form-group flex-1">
            <label class="form-label">${dict.valLabel}</label>
            <input type="number" step="any" class="form-input term-value-input" value="${term.numberValue}">
          </div>
          ` : ''}
          <div class="form-group flex-1">
            <label class="form-label">${dict.unitLabel}</label>
            ${unitSelectHtml}
          </div>
          <div class="form-group flex-half">
            <label class="form-label">${dict.coeffLabel}</label>
            <input type="number" step="any" class="form-input term-mult-input" value="${term.multiplier}">
          </div>
          <div class="form-group flex-half">
            <label class="form-label">${dict.powerLabel}</label>
            <input type="number" step="any" class="form-input term-power-input" value="${term.power}">
          </div>
        </div>
      `;

      this.bindCommonEvents(card, index, term);

      if (term.type === "quantity") {
        const qtySelect = card.querySelector(".term-qty-select");
        if (qtySelect) {
          qtySelect.addEventListener("change", () => {
            this.calculator.pushHistory();
            term.quantityId = qtySelect.value;
            term.unitId = this.calculator.getQuantityDef(term.quantityId).units[0].id;
            this.renderTermsList();
          });
        }
        const unitSelect = card.querySelector(".term-unit-select");
        if (unitSelect) {
          unitSelect.addEventListener("change", () => {
            this.calculator.pushHistory();
            term.unitId = unitSelect.value;
            this.builder.updateEquationPreview();
          });
        }
        this.bindNumericInput(card, ".term-value-input", val => { term.numberValue = val; });
      } else {
        const constSelect = card.querySelector(".term-const-select");
        if (constSelect) {
          constSelect.addEventListener("change", () => {
            this.calculator.pushHistory();
            term.constantId = constSelect.value;
            this.renderTermsList();
          });
        }
      }

      this.bindNumericInput(card, ".term-mult-input", val => { term.multiplier = val || 1; });
      this.bindNumericInput(card, ".term-power-input", val => { term.power = val || 1; });

      this.termsContainer.appendChild(card);
    });

    this.builder.updateEquationPreview();
  }
}
