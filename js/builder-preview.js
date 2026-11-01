/**
 * js/builder-preview.js - 建構區即時 KaTeX 方程式預覽與計算結果面板渲染器
 */

class BuilderPreviewUI {
  constructor(builder) {
    this.builder = builder;
  }

  get app() {
    return this.builder.app;
  }

  get calculator() {
    return this.builder.calculator;
  }

  get interactiveFormulaContainer() {
    return this.builder.interactiveFormulaContainer;
  }

  get resultOutputBox() {
    return this.builder.resultOutputBox;
  }

  get previewCursorHint() {
    return this.builder.previewCursorHint;
  }

  get dimStatusBadge() {
    return this.builder.dimStatusBadge;
  }

  get mismatchWarningCard() {
    return this.builder.mismatchWarningCard;
  }

  get btnUndo() {
    return this.builder.btnUndo;
  }

  get btnRedo() {
    return this.builder.btnRedo;
  }

  updateEquationPreview() {
    if (!this.interactiveFormulaContainer) return;

    if (this.btnUndo) this.btnUndo.disabled = !this.calculator.canUndo();
    if (this.btnRedo) this.btnRedo.disabled = !this.calculator.canRedo();

    const isZh = this.app.currentLang === "zh";
    const dict = (typeof I18N !== "undefined" && I18N[this.app.currentLang]) || (typeof window !== "undefined" && window.dict) || {};
    const eqRep = this.calculator.generateEquationRepresentation();
    const curTarget = this.calculator.cursorTarget;

    this.interactiveFormulaContainer.innerHTML = "";

    const createCaretSlot = (target, isActive) => {
      const slot = document.createElement("div");
      slot.className = `formula-caret-slot ${isActive ? "active" : ""}`;
      slot.title = isZh ? "點擊切換插入游標至此" : "Click to place cursor here";
      slot.addEventListener("click", (e) => {
        e.stopPropagation();
        this.calculator.setCursorTarget(target);
        this.updateEquationPreview();
      });
      return slot;
    };

    const renderTokensSequence = (tokens, displayElements, scope, fracId, part, container) => {
      const isCurrentScope = curTarget.scope === scope && (scope === "root" || (curTarget.fractionId === fracId && curTarget.part === part));
      const activeIdx = isCurrentScope ? curTarget.index : -1;

      for (let i = 0; i <= tokens.length; i++) {
        const slotTarget = scope === "root"
          ? { scope: "root", index: i }
          : { scope: "fraction", fractionId: fracId, part, index: i };
        container.appendChild(createCaretSlot(slotTarget, activeIdx === i));

        if (i < tokens.length) {
          const t = tokens[i];
          const itemRep = displayElements && displayElements[i] ? displayElements[i] : null;

          if (t.type === "fraction") {
            const fracBlock = document.createElement("div");
            fracBlock.className = "formula-fraction-block";
            fracBlock.id = `formula-token-${t.id}`;

            // 分子槽位
            const numSlot = document.createElement("div");
            const isNumActive = curTarget.scope === "fraction" && curTarget.fractionId === t.id && curTarget.part === "numerator";
            numSlot.className = `fraction-slot fraction-numerator-slot ${t.numerator.length === 0 ? "empty" : ""} ${isNumActive ? "active-slot" : ""}`;
            numSlot.title = isZh ? "分式分子格 (點擊選取)" : "Fraction numerator slot (click to select)";

            if (t.numerator.length === 0) {
              const placeholder = document.createElement("span");
              placeholder.className = "fraction-slot-placeholder";
              placeholder.textContent = dict.fillNumerator;
              numSlot.appendChild(placeholder);
              numSlot.addEventListener("click", (e) => {
                e.stopPropagation();
                this.calculator.setCursorTarget({ scope: "fraction", fractionId: t.id, part: "numerator", index: 0 });
                this.updateEquationPreview();
              });
            } else {
              const numRep = itemRep && itemRep.numeratorRep ? itemRep.numeratorRep.displayElements : [];
              renderTokensSequence(t.numerator, numRep, "fraction", t.id, "numerator", numSlot);
            }

            // 分數線
            const fLine = document.createElement("div");
            fLine.className = "fraction-line";

            // 分母槽位
            const denSlot = document.createElement("div");
            const isDenActive = curTarget.scope === "fraction" && curTarget.fractionId === t.id && curTarget.part === "denominator";
            denSlot.className = `fraction-slot fraction-denominator-slot ${t.denominator.length === 0 ? "empty" : ""} ${isDenActive ? "active-slot" : ""}`;
            denSlot.title = isZh ? "分式分母格 (點擊選取)" : "Fraction denominator slot (click to select)";

            if (t.denominator.length === 0) {
              const placeholder = document.createElement("span");
              placeholder.className = "fraction-slot-placeholder";
              placeholder.textContent = dict.fillDenominator;
              denSlot.appendChild(placeholder);
              denSlot.addEventListener("click", (e) => {
                e.stopPropagation();
                this.calculator.setCursorTarget({ scope: "fraction", fractionId: t.id, part: "denominator", index: 0 });
                this.updateEquationPreview();
              });
            } else {
              const denRep = itemRep && itemRep.denominatorRep ? itemRep.denominatorRep.displayElements : [];
              renderTokensSequence(t.denominator, denRep, "fraction", t.id, "denominator", denSlot);
            }

            fracBlock.appendChild(numSlot);
            fracBlock.appendChild(fLine);
            fracBlock.appendChild(denSlot);
            container.appendChild(fracBlock);

          } else {
            const chip = document.createElement("div");
            chip.className = `formula-token-chip token-${t.type === "quantity" ? "qty" : t.type === "constant" ? "const" : t.type === "operator" ? "op" : "paren"}`;
            chip.title = `點擊定位第 #${i + 1} 項`;

            if (window.katex && itemRep && itemRep.latex) {
              try {
                window.katex.render(itemRep.latex, chip, { throwOnError: false });
              } catch (e) {
                chip.textContent = itemRep.label;
              }
            } else {
              chip.textContent = itemRep ? itemRep.label : t.type;
            }

            chip.addEventListener("click", (e) => {
              e.stopPropagation();
              const nextTarget = scope === "root"
                ? { scope: "root", index: i + 1 }
                : { scope: "fraction", fractionId: fracId, part, index: i + 1 };
              this.calculator.setCursorTarget(nextTarget);
              this.updateEquationPreview();

              const targetCard = document.getElementById(`term-card-${t.id}`);
              if (targetCard) {
                targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                targetCard.style.outline = "2px solid var(--brand-primary)";
                setTimeout(() => { targetCard.style.outline = ""; }, 1200);
              }
            });

            container.appendChild(chip);
          }
        }
      }
    };

    if (this.calculator.tokens.length === 0) {
      const slot = createCaretSlot({ scope: "root", index: 0 }, true);
      const emptyHint = document.createElement("span");
      emptyHint.style.color = "var(--text-muted)";
      emptyHint.style.fontSize = "0.95rem";
      emptyHint.textContent = dict.emptyExpression;
      this.interactiveFormulaContainer.appendChild(slot);
      this.interactiveFormulaContainer.appendChild(emptyHint);
    } else {
      renderTokensSequence(this.calculator.tokens, eqRep.displayElements, "root", null, null, this.interactiveFormulaContainer);
    }

    if (this.previewCursorHint) {
      const curLabel = isZh ? "📌 當前插入位置：" : "📌 Insertion Target: ";
      const hintTail = isZh ? "（點擊公式中任何間隙或分母/分子格即可切換插入目標）" : "(Click any gap or slot in formula to move cursor)";
      if (curTarget.scope === "fraction") {
        const partName = curTarget.part === "numerator" ? dict.numeratorName : dict.denominatorName;
        const posText = isZh ? `分式 #${curTarget.fractionId} 之【${partName}】第 ${curTarget.index} 格` : `Fraction #${curTarget.fractionId} [${partName}] slot ${curTarget.index}`;
        this.previewCursorHint.innerHTML = `
          <span>${curLabel}<span class="cursor-pos-badge">${posText}</span></span>
          <span style="color: var(--text-muted); font-size: 0.8rem;">${hintTail}</span>
        `;
      } else {
        const posText = isZh ? `頂層第 ${curTarget.index} / ${this.calculator.tokens.length} 項` : `Root item ${curTarget.index} / ${this.calculator.tokens.length}`;
        this.previewCursorHint.innerHTML = `
          <span>${curLabel}<span class="cursor-pos-badge">${posText}</span></span>
          <span style="color: var(--text-muted); font-size: 0.8rem;">${hintTail}</span>
        `;
      }
    }

    if (!this.dimStatusBadge) return;

    try {
      if (this.calculator.tokens.length === 0) {
        this.dimStatusBadge.className = "dim-status-badge";
        this.dimStatusBadge.textContent = I18N[this.app.currentLang].dimReady;
        if (this.mismatchWarningCard) this.mismatchWarningCard.style.display = "none";
        return;
      }

      const res = this.calculator.compute();
      if (res && res.hasError) {
        this.dimStatusBadge.className = "dim-status-badge warning";
        this.dimStatusBadge.textContent = I18N[this.app.currentLang].dimMismatch;

        if (this.mismatchWarningCard) {
          this.mismatchWarningCard.style.display = "block";
          this.mismatchWarningCard.innerHTML = `
            <div class="mismatch-title">
              <span>⚠️</span>
              <span>${isZh ? res.warningTitleZh : res.warningTitleEn}</span>
            </div>
            <ul class="mismatch-list">
              ${res.mismatchDetails.map(d => `<li>${d}</li>`).join("")}
            </ul>
            <div class="mismatch-advice">
              ${isZh ? res.adviceZh : res.adviceEn}
            </div>
          `;
        }
      } else {
        this.dimStatusBadge.className = "dim-status-badge";
        this.dimStatusBadge.textContent = I18N[this.app.currentLang].dimConsistent;
        if (this.mismatchWarningCard) this.mismatchWarningCard.style.display = "none";
      }
    } catch (e) {
      this.dimStatusBadge.className = "dim-status-badge warning";
      this.dimStatusBadge.textContent = e.message;
      if (this.mismatchWarningCard) this.mismatchWarningCard.style.display = "none";
    }
  }

  renderResultBox(res) {
    if (!this.resultOutputBox) return;

    const isZh = this.app.currentLang === "zh";
    const dict = (typeof I18N !== "undefined" && I18N[this.app.currentLang]) || (typeof window !== "undefined" && window.dict) || {};

    if (!res) {
      this.resultOutputBox.innerHTML = `
        <div class="empty-state">
          ${dict.resultPlaceholder}
        </div>
      `;
      return;
    }

    if (res.hasError) {
      this.resultOutputBox.innerHTML = `
        <div class="mismatch-warning-card" style="margin-bottom: 0;">
          <div class="mismatch-title">
            <span>⚠️</span>
            <span>${isZh ? res.warningTitleZh : res.warningTitleEn}</span>
          </div>
          <ul class="mismatch-list">
            ${res.mismatchDetails.map(d => `<li>${d}</li>`).join("")}
          </ul>
          <div class="mismatch-advice">
            ${isZh ? res.adviceZh : res.adviceEn}
          </div>
        </div>
      `;
      return;
    }

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

    let groupsBreakdownHtml = "";
    if (res.groups && res.groups.length > 1) {
      groupsBreakdownHtml = `
        <div style="margin: 1rem 0; font-size: 0.85rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <div style="font-weight: 600; margin-bottom: 0.4rem; color: var(--text-secondary);">${dict.multContributions}</div>
          ${res.groups.map(g => {
            const signStr = g.sign === "-" ? "－ " : "＋ ";
            const valStr = Math.abs(g.valueSI) < 1e-3 || Math.abs(g.valueSI) >= 1e5 ? g.valueSI.toExponential(4) : g.valueSI.toLocaleString(undefined, { maximumFractionDigits: 4 });
            return `
              <div style="padding: 0.2rem 0; color: var(--text-muted);">
                ${signStr}${dict.termItem} #${g.groupIndex} (${g.symbolExpression}): <strong>${valStr}</strong> SI (${g.dimensionStr})
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    this.resultOutputBox.innerHTML = `
      <div class="result-main-grid">
        <div class="result-item-card primary">
          <div class="res-label">${dict.matchedQtyType}</div>
          <div class="res-value" style="font-size: 1.25rem;">
            ${isZh ? res.quantityNameZh : res.quantityNameEn}
          </div>
          <div class="res-sub">${dict.dimensionExpr} ${res.dimensionStr}</div>
        </div>

        <div class="result-item-card">
          <div class="res-label">${dict.computedValue} [${res.system}]</div>
          <div class="res-value">
            ${formattedVal}
          </div>
          <div class="res-sub">${res.unitLabel}</div>
        </div>

        <div class="result-item-card">
          <div class="res-label">${dict.baseSIValue}</div>
          <div class="res-value" style="font-size: 1.15rem;">
            ${rawSIFormatted}
          </div>
          <div class="res-sub">${res.baseUnitSI}</div>
        </div>
      </div>

      ${unitsListHtml}
      ${groupsBreakdownHtml}
    `;
  }
}
