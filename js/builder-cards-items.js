/**
 * js/builder-cards-items.js - 建構區分子/分母子項目卡片 UI 渲染器
 */

class BuilderCardsItemsUI {
  constructor(builder) {
    this.builder = builder;
  }

  get app() {
    return this.builder.app;
  }

  get calculator() {
    return this.builder.calculator;
  }

  // 渲染分式結構內部的子項目卡片 (分子或分母)
  renderSubItemCard(subTerm, subIndex, list, part, parentFrac, container) {
    const isZh = this.app.currentLang === "zh";
    const dict = (typeof I18N !== "undefined" && I18N[this.app.currentLang]) || (typeof window !== "undefined" && window.dict) || {};
    const subCard = document.createElement("div");
    subCard.id = `term-card-${subTerm.id}`;

    // 運算符
    if (subTerm.type === "operator") {
      subCard.className = "subitem-card subitem-card-op";
      subCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="term-idx">#${subIndex + 1}</span>
          <div class="op-switch-group">
            <button type="button" class="btn-op ${subTerm.value === '+' ? 'active' : ''}" data-val="+">＋</button>
            <button type="button" class="btn-op ${subTerm.value === '-' ? 'active' : ''}" data-val="-">－</button>
            <button type="button" class="btn-op ${subTerm.value === '*' ? 'active' : ''}" data-val="*">·</button>
            <button type="button" class="btn-op ${subTerm.value === '/' ? 'active' : ''}" data-val="/">/</button>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${dict.standaloneOp}</span>
        </div>
        <div class="term-ctrl-btns">
          ${subIndex > 0 ? `<button type="button" class="btn-move btn-sub-up" title="${dict.moveUp}">⬆</button>` : ''}
          ${subIndex < list.length - 1 ? `<button type="button" class="btn-move btn-sub-down" title="${dict.moveDown}">⬇</button>` : ''}
          <button type="button" class="btn-delete btn-sub-del" title="${dict.deleteOp}">✕</button>
        </div>
      `;

      subCard.querySelectorAll(".btn-op").forEach(b => {
        b.addEventListener("click", () => {
          this.calculator.pushHistory();
          subTerm.value = b.getAttribute("data-val");
          this.builder.renderTermsList();
        });
      });

      const btnUp = subCard.querySelector(".btn-sub-up");
      if (btnUp) {
        btnUp.addEventListener("click", () => {
          this.calculator.moveToken(subIndex, subIndex - 1, { scope: "fraction", fractionId: parentFrac.id, part, index: subIndex });
          this.builder.renderTermsList();
        });
      }
      const btnDown = subCard.querySelector(".btn-sub-down");
      if (btnDown) {
        btnDown.addEventListener("click", () => {
          this.calculator.moveToken(subIndex, subIndex + 1, { scope: "fraction", fractionId: parentFrac.id, part, index: subIndex });
          this.builder.renderTermsList();
        });
      }
      const btnDel = subCard.querySelector(".btn-sub-del");
      if (btnDel) {
        btnDel.addEventListener("click", () => {
          this.calculator.removeTokenAt(subIndex, { scope: "fraction", fractionId: parentFrac.id, part, index: subIndex });
          this.builder.renderTermsList();
        });
      }

      container.appendChild(subCard);
      return;
    }

    // 括號
    if (subTerm.type === "open_paren" || subTerm.type === "close_paren") {
      const isOpen = subTerm.type === "open_paren";
      subCard.className = "subitem-card subitem-card-paren";
      subCard.innerHTML = `
        <div class="term-header">
          <span class="term-idx">#${subIndex + 1}</span>
          <div class="term-ctrl-btns">
            ${subIndex > 0 ? `<button type="button" class="btn-move btn-sub-up" title="${dict.moveUp}">⬆</button>` : ''}
            ${subIndex < list.length - 1 ? `<button type="button" class="btn-move btn-sub-down" title="${dict.moveDown}">⬇</button>` : ''}
            <button type="button" class="btn-delete btn-sub-del" title="${dict.deleteBracket}">✕</button>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; padding: 0.15rem 0;">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="paren-symbol-badge">${isOpen ? '(' : ')'}</span>
            <span class="paren-desc-text">${isOpen ? (isZh ? '開括號' : 'Open Bracket') : (isZh ? '閉括號' : 'Close Bracket')}</span>
          </div>
          ${!isOpen ? `
          <div class="form-group flex-half" style="min-width: 100px;">
            <label class="form-label">${dict.bracketPower}</label>
            <input type="number" step="any" class="form-input term-sub-power-input" value="${subTerm.power !== undefined ? subTerm.power : 1}">
          </div>
          ` : ''}
        </div>
      `;

      const btnUp = subCard.querySelector(".btn-sub-up");
      if (btnUp) {
        btnUp.addEventListener("click", () => {
          this.calculator.moveToken(subIndex, subIndex - 1, { scope: "fraction", fractionId: parentFrac.id, part, index: subIndex });
          this.builder.renderTermsList();
        });
      }
      const btnDown = subCard.querySelector(".btn-sub-down");
      if (btnDown) {
        btnDown.addEventListener("click", () => {
          this.calculator.moveToken(subIndex, subIndex + 1, { scope: "fraction", fractionId: parentFrac.id, part, index: subIndex });
          this.builder.renderTermsList();
        });
      }
      const btnDel = subCard.querySelector(".btn-sub-del");
      if (btnDel) {
        btnDel.addEventListener("click", () => {
          this.calculator.removeTokenAt(subIndex, { scope: "fraction", fractionId: parentFrac.id, part, index: subIndex });
          this.builder.renderTermsList();
        });
      }
      const pwrInput = subCard.querySelector(".term-sub-power-input");
      if (pwrInput) {
        pwrInput.addEventListener("input", () => {
          this.calculator.pushHistory();
          subTerm.power = parseFloat(pwrInput.value) || 1;
          this.builder.updateEquationPreview();
        });
      }

      container.appendChild(subCard);
      return;
    }

    // 物理量或常數
    subCard.className = "subitem-card";
    let itemDisplayHtml = "";
    let unitSelectHtml = "";

    if (subTerm.type === "quantity") {
      const qDef = this.calculator.getQuantityDef(subTerm.quantityId);
      itemDisplayHtml = `
        <div class="selected-qty-chip">
          <strong class="chip-symbol">${qDef.symbol}</strong>
          <span class="chip-name">${isZh ? qDef.nameZh : qDef.nameEn}</span>
        </div>
      `;

      unitSelectHtml = `
        <select class="term-unit-select form-select">
          ${qDef.units.map(u => `
            <option value="${u.id}" ${u.id === subTerm.unitId ? "selected" : ""}>
              ${isZh ? (u.labelZh || u.label) : (u.labelEn || u.label)} [${u.system}]
            </option>
          `).join("")}
        </select>
      `;
    } else if (subTerm.type === "constant") {
      const cDef = this.calculator.getConstantDef(subTerm.constantId);
      itemDisplayHtml = `
        <div class="selected-qty-chip">
          <strong class="chip-symbol">${cDef.symbol}</strong>
          <span class="chip-name">${isZh ? cDef.nameZh : cDef.nameEn}</span>
        </div>
      `;
      unitSelectHtml = `<span class="const-unit-badge">${cDef.unit}</span>`;
    }

    subCard.innerHTML = `
      <div class="term-header">
        <span class="term-idx">#${subIndex + 1}</span>
        <div class="term-ctrl-btns">
          ${subIndex > 0 ? `<button type="button" class="btn-move btn-sub-up" title="${dict.moveUp}">⬆</button>` : ''}
          ${subIndex < list.length - 1 ? `<button type="button" class="btn-move btn-sub-down" title="${dict.moveDown}">⬇</button>` : ''}
          <button type="button" class="btn-delete btn-sub-del" title="${dict.deleteItem}">✕</button>
        </div>
      </div>
      <div class="term-body">
        <div class="form-group flex-item-badge">
          <label class="form-label">${isZh ? (subTerm.type === 'quantity' ? '物理量' : '物理常數') : (subTerm.type === 'quantity' ? 'Quantity' : 'Constant')}</label>
          ${itemDisplayHtml}
        </div>
        ${subTerm.type === 'quantity' ? `
        <div class="form-group flex-1">
          <label class="form-label">${dict.valLabel}</label>
          <input type="number" step="any" class="form-input term-value-input" value="${subTerm.numberValue !== undefined ? subTerm.numberValue : 10}">
        </div>
        ` : ''}
        <div class="form-group flex-1">
          <label class="form-label">${dict.unitLabel}</label>
          ${unitSelectHtml}
        </div>
        <div class="form-group flex-half">
          <label class="form-label">${dict.coeffLabel}</label>
          <input type="number" step="any" class="form-input term-mult-input" value="${subTerm.multiplier !== undefined ? subTerm.multiplier : 1}">
        </div>
        <div class="form-group flex-half">
          <label class="form-label">${dict.powerLabel}</label>
          <input type="number" step="any" class="form-input term-power-input" value="${subTerm.power !== undefined ? subTerm.power : 1}">
        </div>
      </div>
    `;

    const btnUp = subCard.querySelector(".btn-sub-up");
    if (btnUp) {
      btnUp.addEventListener("click", () => {
        this.calculator.moveToken(subIndex, subIndex - 1, { scope: "fraction", fractionId: parentFrac.id, part, index: subIndex });
        this.builder.renderTermsList();
      });
    }
    const btnDown = subCard.querySelector(".btn-sub-down");
    if (btnDown) {
      btnDown.addEventListener("click", () => {
        this.calculator.moveToken(subIndex, subIndex + 1, { scope: "fraction", fractionId: parentFrac.id, part, index: subIndex });
        this.builder.renderTermsList();
      });
    }
    const btnDel = subCard.querySelector(".btn-sub-del");
    if (btnDel) {
      btnDel.addEventListener("click", () => {
        this.calculator.removeTokenAt(subIndex, { scope: "fraction", fractionId: parentFrac.id, part, index: subIndex });
        this.builder.renderTermsList();
      });
    }

    if (subTerm.type === "quantity") {
      const unitSelect = subCard.querySelector(".term-unit-select");
      if (unitSelect) {
        unitSelect.addEventListener("change", () => {
          this.calculator.pushHistory();
          subTerm.unitId = unitSelect.value;
          this.builder.updateEquationPreview();
        });
      }

      const valInput = subCard.querySelector(".term-value-input");
      if (valInput) {
        valInput.addEventListener("input", () => {
          this.calculator.pushHistory();
          subTerm.numberValue = parseFloat(valInput.value) || 0;
          this.builder.updateEquationPreview();
        });
      }
    }

    const multInput = subCard.querySelector(".term-mult-input");
    if (multInput) {
      multInput.addEventListener("input", () => {
        this.calculator.pushHistory();
        subTerm.multiplier = parseFloat(multInput.value) || 1;
        this.builder.updateEquationPreview();
      });
    }

    const powerInput = subCard.querySelector(".term-power-input");
    if (powerInput) {
      powerInput.addEventListener("input", () => {
        this.calculator.pushHistory();
        subTerm.power = parseFloat(powerInput.value) || 1;
        this.builder.updateEquationPreview();
      });
    }

    container.appendChild(subCard);
  }
}
