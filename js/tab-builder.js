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
      // 若當前焦點在文字輸入框或文字區域中，允許原生文字撤銷/重做，不攔截預設事件
      const targetTag = e.target ? e.target.tagName : "";
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || (e.target && e.target.isContentEditable)) {
        return;
      }

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
    if (typeof this.calculator.loadPreset === "function") {
      this.calculator.loadPreset(presetKey);
    }

    this.renderTermsList();
    this.updateEquationPreview();
    try {
      const res = this.calculator.compute();
      this.renderResultBox(res);
    } catch (_) {}

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
