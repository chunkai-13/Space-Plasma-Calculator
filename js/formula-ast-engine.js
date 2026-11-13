/**
 * js/formula-ast-engine.js - 公式抽象語法樹引擎 (Formula AST Engine)
 * 依據 ADR-009 規範，提供不透明文件接縫 (Opaque Document Seam)：
 *   - 封裝 Term Nodes 內部樹狀結構
 *   - 內部自主管理 Undo / Redo 快照歷史棧與焦點槽位
 *   - 支援直接語意變異方法、經典公式範本與標準 LaTeX 語法解析
 *   - 具備單向響應觀察者介面 (subscribe)
 */

class FormulaASTEngine extends CalculatorCore {
  constructor() {
    super();
    this.listeners = new Set();
    this.isBroadcasting = false;
  }

  // =========================================================================
  // 1. 單向響應觀察者接縫 (Observer Pattern)
  // =========================================================================

  /**
   * 註冊狀態變更監聽器
   * @param {Function} callback (snapshot) => void
   * @returns {Function} 取消註冊函式
   */
  subscribe(callback) {
    if (typeof callback === "function") {
      this.listeners.add(callback);
    }
    return () => this.listeners.delete(callback);
  }

  /**
   * 廣播最新公式快照 (Formula Document Snapshot)
   */
  notify() {
    if (this.isBroadcasting) return;
    this.isBroadcasting = true;
    try {
      const snapshot = this.getSnapshot();
      this.listeners.forEach(cb => {
        try { cb(snapshot); } catch (e) { console.error("FormulaASTEngine listener error:", e); }
      });
    } finally {
      this.isBroadcasting = false;
    }
  }

  /**
   * 取得不透明文件狀態快照
   */
  getSnapshot() {
    let latex = "";
    try {
      latex = this.toLatex();
    } catch (_) {
      latex = "";
    }

    let dimValidation = null;
    try {
      dimValidation = this.validateDimensions();
    } catch (_) {
      dimValidation = null;
    }

    return {
      terms: JSON.parse(JSON.stringify(this.tokens)),
      termCount: this.tokens.length,
      latex,
      cursorTarget: { ...this.cursorTarget },
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      dimension: dimValidation,
      lastResult: this.lastResult,
      displaySystem: this.displaySystem
    };
  }

  // =========================================================================
  // 2. 焦點與槽位定位模型 (Slot Navigation & Focus Target)
  // =========================================================================

  setFocusTarget(target) {
    this.setCursorTarget(target);
    this.notify();
  }

  getFocusTarget() {
    return { ...this.cursorTarget };
  }

  // =========================================================================
  // 3. 語意變異介面 (Semantic Mutation Methods)
  // =========================================================================

  insertTerm(termDef, target = this.cursorTarget) {
    this.pushHistory();
    const token = this.insertToken(termDef, target);
    this.notify();
    return token;
  }

  insertQty(preset, target = this.cursorTarget) {
    this.pushHistory();
    const token = this.insertQuantity(preset, target);
    this.notify();
    return token;
  }

  insertConst(preset, target = this.cursorTarget) {
    this.pushHistory();
    const token = this.insertConstant(preset, target);
    this.notify();
    return token;
  }

  insertFrac(target = this.cursorTarget) {
    this.pushHistory();
    const token = this.insertFraction(target);
    this.notify();
    return token;
  }

  insertOp(opValue, target = this.cursorTarget) {
    this.pushHistory();
    const token = this.insertOperator(opValue, target);
    this.notify();
    return token;
  }

  insertOpenBracket(target = this.cursorTarget) {
    this.pushHistory();
    const token = this.insertOpenParen(target);
    this.notify();
    return token;
  }

  insertCloseBracket(power = 1, target = this.cursorTarget) {
    this.pushHistory();
    const token = this.insertCloseParen(power, target);
    this.notify();
    return token;
  }

  removeTerm(tokenIdOrIndex, target = this.cursorTarget) {
    this.pushHistory();
    if (typeof tokenIdOrIndex === "number") {
      this.removeTokenAt(tokenIdOrIndex, target);
    } else {
      this.removeToken(tokenIdOrIndex);
    }
    this.notify();
  }

  moveTerm(fromIndex, toIndex, target = this.cursorTarget) {
    this.pushHistory();
    this.moveToken(fromIndex, toIndex, target);
    this.notify();
  }

  clearDocument() {
    this.pushHistory();
    this.clear();
    this.lastResult = null;
    this.notify();
  }

  undoAction() {
    const success = this.undo();
    if (success) this.notify();
    return success;
  }

  redoAction() {
    const success = this.redo();
    if (success) this.notify();
    return success;
  }

  // =========================================================================
  // 4. 經典物理公式範本載入 (Preset Templates)
  // =========================================================================

  loadPreset(presetKey) {
    this.pushHistory();
    this.clear();

    if (presetKey === "presetPB") {
      // 磁壓力: B^2 / (2 * mu0)
      const frac = this.insertFraction();
      this.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 }, { scope: "fraction", fractionId: frac.id, part: "numerator", index: 0 });
      this.insertConstant({ constantId: "mu0", multiplier: 2 }, { scope: "fraction", fractionId: frac.id, part: "denominator", index: 0 });
      this.setCursorTarget({ scope: "root", index: 1 });
    } else if (presetKey === "presetTotalP") {
      // 總壓力: (n * kB * T) + (B^2 / 2mu0)
      this.insertQuantity({ quantityId: "number_density", unitId: "cm_minus3", numberValue: 5 });
      this.insertOperator("*");
      this.insertConstant({ constantId: "kB" });
      this.insertOperator("*");
      this.insertQuantity({ quantityId: "temperature", unitId: "eV", numberValue: 10 });
      this.insertOperator("+");
      const fracPB = this.insertFraction();
      this.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 }, { scope: "fraction", fractionId: fracPB.id, part: "numerator", index: 0 });
      this.insertConstant({ constantId: "mu0", multiplier: 2 }, { scope: "fraction", fractionId: fracPB.id, part: "denominator", index: 0 });
      this.setCursorTarget({ scope: "root", index: this.tokens.length });
    } else if (presetKey === "presetBracket") {
      // 巢狀括號範例: [ ( B^2 / 2mu0 ) + P_th ]
      this.insertOpenParen();
      this.insertOpenParen();
      const fracB = this.insertFraction();
      this.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 }, { scope: "fraction", fractionId: fracB.id, part: "numerator", index: 0 });
      this.insertConstant({ constantId: "mu0", multiplier: 2 }, { scope: "fraction", fractionId: fracB.id, part: "denominator", index: 0 });
      this.setCursorTarget({ scope: "root", index: this.tokens.length });
      this.insertCloseParen(1);
      this.insertOperator("+");
      this.insertQuantity({ quantityId: "plasma_pressure", unitId: "nPa", numberValue: 0.05 });
      this.insertCloseParen(1);
      this.setCursorTarget({ scope: "root", index: this.tokens.length });
    } else if (presetKey === "presetBeta") {
      // 電漿 Beta: (n * kB * T) / (B^2 / 2mu0)
      const fracBeta = this.insertFraction();
      this.insertQuantity({ quantityId: "number_density", unitId: "cm_minus3", numberValue: 5 }, { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 0 });
      this.insertOperator("*", { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 1 });
      this.insertConstant({ constantId: "kB" }, { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 2 });
      this.insertOperator("*", { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 3 });
      this.insertQuantity({ quantityId: "temperature", unitId: "eV", numberValue: 10 }, { scope: "fraction", fractionId: fracBeta.id, part: "numerator", index: 4 });

      this.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 10, power: 2 }, { scope: "fraction", fractionId: fracBeta.id, part: "denominator", index: 0 });
      this.insertOperator("/", { scope: "fraction", fractionId: fracBeta.id, part: "denominator", index: 1 });
      this.insertConstant({ constantId: "mu0", multiplier: 2 }, { scope: "fraction", fractionId: fracBeta.id, part: "denominator", index: 2 });
      this.setCursorTarget({ scope: "root", index: 1 });
    } else if (presetKey === "presetVA") {
      // 阿爾芬速度: 直式分式 B / (mu0^0.5 * mp^0.5 * n^0.5)
      const fracVA = this.insertFraction();
      this.insertQuantity({ quantityId: "magnetic_field", unitId: "nT", numberValue: 5 }, { scope: "fraction", fractionId: fracVA.id, part: "numerator", index: 0 });
      this.insertConstant({ constantId: "mu0", power: 0.5 }, { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 0 });
      this.insertOperator("*", { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 1 });
      this.insertConstant({ constantId: "mp", power: 0.5 }, { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 2 });
      this.insertOperator("*", { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 3 });
      this.insertQuantity({ quantityId: "number_density", unitId: "cm_minus3", numberValue: 5, power: 0.5 }, { scope: "fraction", fractionId: fracVA.id, part: "denominator", index: 4 });
      this.setCursorTarget({ scope: "root", index: 1 });
    }

    this.notify();
  }

  // =========================================================================
  // 5. 語法解析器 (LaTeX Parser into Formula Document)
  // =========================================================================

  parseFromLatex(latexStr) {
    this.pushHistory();
    const str = (latexStr || "").trim();
    if (!str) {
      this.tokens = [];
      this.notify();
      return;
    }

    // 快速匹配經典物理公式模板
    if ((str.includes("B^2") || str.includes("B^{2}")) && (str.includes("mu") || str.includes("μ"))) {
      this.loadPreset("presetPB");
      return;
    }
    if (str.includes("P_th") && str.includes("P_B")) {
      this.loadPreset("presetTotalP");
      return;
    }
    if (str.includes("beta") || (str.includes("nkT") && str.includes("P_B"))) {
      this.loadPreset("presetBeta");
      return;
    }
    if (str.includes("v_A") || (str.includes("B") && (str.includes("rho") || str.includes("mu")))) {
      this.loadPreset("presetVA");
      return;
    }

    this.tokens = [];
    const fracMatch = str.match(/\\frac\{([^}]+)\}\{([^}]+)\}/);
    if (fracMatch) {
      const fracToken = this.insertFraction();
      this._parseTokensIntoList(fracMatch[1], fracToken.numerator);
      this._parseTokensIntoList(fracMatch[2], fracToken.denominator);
    } else {
      this._parseTokensIntoList(str, this.tokens);
    }

    this.notify();
  }

  _parseTokensIntoList(exprStr, container) {
    const cleaned = exprStr
      .replace(/\\cdot|\\times/g, " * ")
      .replace(/\\mu_0|\\mu0|\\mu|mu_0/g, " mu0 ")
      .replace(/\\varepsilon_0|\\epsilon_0|eps0/g, " eps0 ")
      .replace(/m_e/g, " me ")
      .replace(/m_p/g, " mp ")
      .replace(/k_B|k_b/g, " kB ")
      .replace(/P_\{th\}|P_th/g, " P ")
      .replace(/P_B/g, " P ");

    const parts = cleaned.split(/(\s+|\+|-|\*|\/|\(|\))/).map(s => s.trim()).filter(s => s.length > 0);
    const constMap = { e: "e", me: "me", mp: "mp", eps0: "eps0", mu0: "mu0", kB: "kB", c: "c" };
    const qtyMap = { B: "magnetic_field", E: "electric_field", n: "density", T: "temperature", v: "velocity", P: "pressure" };

    parts.forEach(tok => {
      let power = 1;
      let coreTok = tok;
      if (tok.includes("^")) {
        const pParts = tok.split("^");
        coreTok = pParts[0];
        power = parseFloat(pParts[1].replace(/[{}]/g, "")) || 1;
      }

      if (tok === "+" || tok === "-" || tok === "*" || tok === "/") {
        container.push({ id: `op_${Date.now()}_${Math.random()}`, type: "operator", value: tok });
      } else if (tok === "(") {
        container.push({ id: `paren_${Date.now()}_${Math.random()}`, type: "open_paren", parenType: "parenthesis" });
      } else if (tok === ")") {
        container.push({ id: `paren_${Date.now()}_${Math.random()}`, type: "close_paren", parenType: "parenthesis", power });
      } else if (constMap[coreTok]) {
        container.push({
          id: `const_${Date.now()}_${Math.random()}`,
          type: "constant",
          constantId: constMap[coreTok],
          power,
          multiplier: 1
        });
      } else if (qtyMap[coreTok]) {
        container.push({
          id: `qty_${Date.now()}_${Math.random()}`,
          type: "quantity",
          quantityId: qtyMap[coreTok],
          unitId: "default",
          numberValue: 1,
          power
        });
      }
    });
  }

  // =========================================================================
  // 6. LaTeX 輸出、因次檢驗與數值求值介面 (Evaluation & Presentation)
  // =========================================================================

  toLatex() {
    return CalculatorFormatter.generateLatexString(this.tokens, this);
  }

  validateDimensions() {
    if (this.tokens.length === 0) return { isBalanced: true, dimension: null };
    return CalculatorEvaluator.checkDimensionalConsistency(this.tokens, this);
  }

  evaluate(system = this.displaySystem) {
    this.displaySystem = system;
    if (this.tokens.length === 0) {
      throw new Error("請先新增至少一個物理量、常數或分式項目。");
    }

    const bracketAnalysis = this.analyzeBrackets();
    if (!bracketAnalysis.isBalanced) {
      this.lastResult = {
        hasError: true,
        errorType: "BRACKET_UNBALANCED",
        warningTitleZh: "括號未正確閉合警告",
        warningTitleEn: "Unclosed Parentheses Warning",
        mismatchDetails: bracketAnalysis.errors,
        adviceZh: "請確認每一個開括號 (、[、{ 都具備對應的閉括號，系統已依巢狀深度自動變換小中大括號。",
        adviceEn: "Please ensure all opening parentheses have corresponding closing ones.",
        groups: []
      };
      this.notify();
      return CalculatorFormatter.formatResult(this.lastResult, system);
    }

    try {
      const finalEval = CalculatorEvaluator.evaluateTokensExpression(this.tokens, this);
      const matchedQty = CalculatorFormatter.matchDimensionToQuantity(finalEval.dimension);

      this.lastResult = {
        hasError: false,
        valueSI: finalEval.baseValue,
        dimension: finalEval.dimension,
        matchedQuantity: matchedQty,
        groups: finalEval.groups || []
      };

      this.notify();
      return CalculatorFormatter.formatResult(this.lastResult, system);
    } catch (err) {
      this.lastResult = {
        hasError: true,
        errorType: "EVALUATION_ERROR",
        message: err.message,
        groups: []
      };
      this.notify();
      throw err;
    }
  }
}
