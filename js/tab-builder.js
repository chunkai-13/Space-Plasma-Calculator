/**
 * js/tab-builder.js - 分頁一：自訂物理量建構區控制器主體
 * 協同模組：
 *   - js/builder-preview.js (BuilderPreviewUI: 即時 KaTeX 預覽、游標插入點、計算結果面板)
 *   - js/builder-cards-list.js (BuilderCardsListUI: 頂層卡片清單渲染與操作)
 *   - js/builder-cards-items.js (BuilderCardsItemsUI: 分式分子/分母子項目卡片渲染)
 */

class BuilderTabController {
  constructor(app) {
    this.app = app;
    this.calculator = app.calculator;

    this.previewUI = new BuilderPreviewUI(this);
    this.cardsListUI = new BuilderCardsListUI(this);
    this.cardsItemsUI = new BuilderCardsItemsUI(this);

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.termsContainer = document.getElementById("terms-container");
    this.btnAddQty = document.getElementById("btn-add-qty");
    this.btnAddConst = document.getElementById("btn-add-const");
    this.btnAddFraction = document.getElementById("btn-add-fraction");
    this.btnAddOpenParen = document.getElementById("btn-add-open-paren");
    this.btnAddCloseParen = document.getElementById("btn-add-close-paren");
    this.btnClearTerms = document.getElementById("btn-clear-terms");
    this.btnEqual = document.getElementById("btn-equal");
    this.btnUndo = document.getElementById("btn-undo");
    this.btnRedo = document.getElementById("btn-redo");
    this.resultOutputBox = document.getElementById("result-output-box");
    this.sysRadios = document.querySelectorAll("input[name='display-system']");
    this.interactiveFormulaContainer = document.getElementById("interactive-formula-container");
    this.dimStatusBadge = document.getElementById("dim-status-badge");
    this.mismatchWarningCard = document.getElementById("mismatch-warning-card");
    this.previewCursorHint = document.getElementById("preview-cursor-hint");
    this.btnCollapseAll = document.getElementById("btn-collapse-all");
  }

  bindEvents() {
    // 全部收合 / 展開按鈕
    if (this.btnCollapseAll) {
      this.btnCollapseAll.addEventListener("click", () => {
        this.cardsListUI.toggleCollapseAll();
      });
    }

    // 清空全部
    if (this.btnClearTerms) {
      this.btnClearTerms.addEventListener("click", () => {
        this.calculator.clear();
        this.renderTermsList();
        this.renderResultBox(null);
      });
    }

    // 執行計算
    if (this.btnEqual) {
      this.btnEqual.addEventListener("click", () => {
        try {
          const dict = (typeof I18N !== "undefined" && I18N[this.app.currentLang]) || (typeof window !== "undefined" && window.dict) || {};
          const res = this.calculator.compute();
          this.renderResultBox(res);
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // 上一步 (Undo)
    if (this.btnUndo) {
      this.btnUndo.addEventListener("click", () => {
        if (this.calculator.undo()) {
          this.renderTermsList();
          this.updateEquationPreview();
          if (this.app.modernUI) this.app.modernUI.syncToLatexInput();
        }
      });
    }

    // 下一步 (Redo)
    if (this.btnRedo) {
      this.btnRedo.addEventListener("click", () => {
        if (this.calculator.redo()) {
          this.renderTermsList();
          this.updateEquationPreview();
          if (this.app.modernUI) this.app.modernUI.syncToLatexInput();
        }
      });
    }

    // 制度切換
    if (this.sysRadios) {
      this.sysRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
          const sys = e.target.value;
          const res = this.calculator.formatResult(sys);
          this.renderResultBox(res);
        });
      });
    }

    // 經典預設範例
    document.querySelectorAll(".preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const presetKey = btn.getAttribute("data-preset");
        this.loadPreset(presetKey);
      });
    });

    // 鍵盤快捷鍵 (Command/Ctrl + Z / Shift+Z / Y)
    window.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            if (this.calculator.redo()) {
              this.renderTermsList();
              this.updateEquationPreview();
              if (this.app.modernUI) this.app.modernUI.syncToLatexInput();
            }
          } else {
            if (this.calculator.undo()) {
              this.renderTermsList();
              this.updateEquationPreview();
              if (this.app.modernUI) this.app.modernUI.syncToLatexInput();
            }
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          if (this.calculator.redo()) {
            this.renderTermsList();
            this.updateEquationPreview();
            if (this.app.modernUI) this.app.modernUI.syncToLatexInput();
          }
        }
      }
    });
  }

  loadPresetFormula(presetKey) {
    this.loadPreset(presetKey);
  }

  loadPreset(presetKey) {
    this.calculator.clear();

    if (presetKey === "presetPB") {
      // 磁壓力: 直式分式 B^2 / (2 * mu0)
      const frac = this.calculator.insertFraction();
      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 }, { scope: "fraction", fractionId: frac.id, part: "numerator", index: 0 });
      this.calculator.insertConstant({ constantId: "mu0", multiplier: 2 }, { scope: "fraction", fractionId: frac.id, part: "denominator", index: 0 });
      this.calculator.setCursorTarget({ scope: "root", index: 1 });
    } else if (presetKey === "presetTotalP") {
      // 總壓力: (n * kB * T) + 直式分式 (B^2 / 2mu0)
      this.calculator.insertQuantity({ quantityId: "number_density", unitId: "cm_minus3", numberValue: 5 });
      this.calculator.insertOperator("*");
      this.calculator.insertConstant({ constantId: "kB" });
      this.calculator.insertOperator("*");
      this.calculator.insertQuantity({ quantityId: "temperature", unitId: "eV", numberValue: 10 });
      this.calculator.insertOperator("+");
      const fracPB = this.calculator.insertFraction();
      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 }, { scope: "fraction", fractionId: fracPB.id, part: "numerator", index: 0 });
      this.calculator.insertConstant({ constantId: "mu0", multiplier: 2 }, { scope: "fraction", fractionId: fracPB.id, part: "denominator", index: 0 });
      this.calculator.setCursorTarget({ scope: "root", index: this.calculator.tokens.length });
    } else if (presetKey === "presetBracket") {
      // 巢狀括號範例: [ ( 直式分式 B^2 / 2mu0 ) + P_th ]
      this.calculator.insertOpenParen();
      this.calculator.insertOpenParen();
      const fracB = this.calculator.insertFraction();
      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 }, { scope: "fraction", fractionId: fracB.id, part: "numerator", index: 0 });
      this.calculator.insertConstant({ constantId: "mu0", multiplier: 2 }, { scope: "fraction", fractionId: fracB.id, part: "denominator", index: 0 });
      this.calculator.setCursorTarget({ scope: "root", index: this.calculator.tokens.length });
      this.calculator.insertCloseParen(1);
      this.calculator.insertOperator("+");
      this.calculator.insertQuantity({ quantityId: "plasma_pressure", unitId: "nPa", numberValue: 0.05 });
      this.calculator.insertCloseParen(1);
      this.calculator.setCursorTarget({ scope: "root", index: this.calculator.tokens.length });
    } else if (presetKey === "presetBeta") {
      // 電漿 Beta: 直式大分式 (n * kB * T) / (B^2 / 2mu0)
      const fracBeta = this.calculator.insertFraction();
      this.calculator.insertQuantity({ quantityId: "number_density", unitId: "cm_minus3", numberValue: 5 }, { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 0 });
      this.calculator.insertOperator("*", { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 1 });
      this.calculator.insertConstant({ constantId: "kB" }, { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 2 });
      this.calculator.insertOperator("*", { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 3 });
      this.calculator.insertQuantity({ quantityId: "temperature", unitId: "eV", numberValue: 15 }, { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 4 });

      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 }, { scope: "fraction", fractionId: fracBeta.id, part: "denominator", index: 0 });
      this.calculator.insertOperator("/", { scope: "fraction", fractionId: fracBeta.id, part: "denominator", index: 1 });
      this.calculator.insertConstant({ constantId: "mu0", multiplier: 2 }, { scope: "fraction", fractionId: fracBeta.id, part: "denominator", index: 2 });
      this.calculator.setCursorTarget({ scope: "root", index: 1 });
    } else if (presetKey === "presetVA") {
      // 阿爾芬速度: 直式分式 B / (mu0^0.5 * mp^0.5 * n^0.5)
      const fracVA = this.calculator.insertFraction();
      this.calculator.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 5 }, { scope: "fraction", fractionId: fracVA.id, part: "numerator", index: 0 });
      this.calculator.insertConstant({ constantId: "mu0", power: 0.5 }, { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 0 });
      this.calculator.insertOperator("*", { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 1 });
      this.calculator.insertConstant({ constantId: "mp", power: 0.5 }, { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 2 });
      this.calculator.insertOperator("*", { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 3 });
      this.calculator.insertQuantity({ quantityId: "number_density", unitId: "cm_minus3", numberValue: 5, power: 0.5 }, { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 4 });
      this.calculator.setCursorTarget({ scope: "root", index: 1 });
    }

    this.renderTermsList();
    this.updateEquationPreview();
    const res = this.calculator.compute();
    this.renderResultBox(res);
    if (this.app.modernUI) {
      this.app.modernUI.syncToLatexInput();
      this.app.modernUI.updateDimensionBadge();
    }
  }

  // 委派介面：保持對外與其他分頁呼叫契約 100% 相容
  updateEquationPreview() {
    this.updateHistoryButtons();
    return this.previewUI.updateEquationPreview();
  }

  updateHistoryButtons() {
    if (this.btnUndo) this.btnUndo.disabled = !this.calculator.canUndo();
    if (this.btnRedo) this.btnRedo.disabled = !this.calculator.canRedo();
  }

  renderResultBox(res) {
    this.updateHistoryButtons();
    return this.previewUI.renderResultBox(res);
  }

  renderTermsList() {
    this.updateHistoryButtons();
    return this.cardsListUI.renderTermsList();
  }

  renderSubItemCard(subTerm, subIndex, list, part, parentFrac, container) {
    return this.cardsItemsUI.renderSubItemCard(subTerm, subIndex, list, part, parentFrac, container);
  }
}
