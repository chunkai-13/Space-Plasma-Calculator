/**
 * js/builder-cards-list.js - 建構區頂層多項式項目卡片清單 UI 渲染器
 */

class BuilderCardsListUI {
  constructor(builder) {
    this.builder = builder;
  }

  get app() {
    return this.builder.app;
  }

  get calculator() {
    return this.builder.calculator;
  }

  get termsContainer() {
    return this.builder.termsContainer;
  }

  renderTermsList() {
    if (!this.termsContainer) return;

    this.termsContainer.innerHTML = "";
    const isZh = this.app.currentLang === "zh";
    const eqRep = this.calculator.generateEquationRepresentation();

    this.calculator.tokens.forEach((term, index) => {
      const card = document.createElement("div");
      card.id = `term-card-${term.id}`;

      // 獨立運算符
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

        card.querySelectorAll(".op-switch-group .btn-op").forEach(b => {
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

      // 分式結構
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

        const multInput = card.querySelector(".term-frac-mult-input");
        if (multInput) {
          multInput.addEventListener("input", () => {
            this.calculator.pushHistory();
            term.multiplier = parseFloat(multInput.value) || 1;
            this.builder.updateEquationPreview();
          });
        }

        const pwrInput = card.querySelector(".term-frac-pwr-input");
        if (pwrInput) {
          pwrInput.addEventListener("input", () => {
            this.calculator.pushHistory();
            term.power = parseFloat(pwrInput.value) || 1;
            this.builder.updateEquationPreview();
          });
        }

        const numListEl = card.querySelector(`#frac-num-list-${term.id}`);
        if (numListEl && term.numerator.length > 0) {
          numListEl.innerHTML = "";
          term.numerator.forEach((subItem, sIdx) => {
            this.builder.renderSubItemCard(subItem, sIdx, term.numerator, "numerator", term, numListEl);
          });
        }

        const denListEl = card.querySelector(`#frac-den-list-${term.id}`);
        if (denListEl && term.denominator.length > 0) {
          denListEl.innerHTML = "";
          term.denominator.forEach((subItem, sIdx) => {
            this.builder.renderSubItemCard(subItem, sIdx, term.denominator, "denominator", term, denListEl);
          });
        }

        this.termsContainer.appendChild(card);
        return;
      }

      // 開括號
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

      // 閉括號
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
            this.builder.updateEquationPreview();
          });
        }

        this.termsContainer.appendChild(card);
        return;
      }

      // 一般物理量或常數卡片
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
            this.builder.updateEquationPreview();
          });
        }

        const valInput = card.querySelector(".term-value-input");
        if (valInput) {
          valInput.addEventListener("input", () => {
            this.calculator.pushHistory();
            term.numberValue = parseFloat(valInput.value) || 0;
            this.builder.updateEquationPreview();
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
          this.builder.updateEquationPreview();
        });
      }

      const powerInput = card.querySelector(".term-power-input");
      if (powerInput) {
        powerInput.addEventListener("input", () => {
          this.calculator.pushHistory();
          term.power = parseFloat(powerInput.value) || 1;
          this.builder.updateEquationPreview();
        });
      }

      this.termsContainer.appendChild(card);
    });

    this.builder.updateEquationPreview();
  }
}
