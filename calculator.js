/**
 * calculator.js - 自訂電漿運算器總整合入口 (向後相容包裝層)
 * 底層模組拆分為：
 *   - js/calculator-core.js (Token 模型、游標管理、歷史堆疊、括號分析)
 *   - js/calculator-evaluator.js (數值計算、因次維度相加減檢驗、除零檢查)
 *   - js/calculator-formatter.js (KaTeX 看板結構、因次字串、各制度輸出格式化)
 */

class PlasmaCustomCalculator extends CalculatorCore {
  constructor() {
    super();
  }

  // 快捷插入物理常數 (相容字串與物件傳參)
  addConstant(symOrObj, target = this.cursorTarget) {
    const preset = typeof symOrObj === "string" ? { constantId: symOrObj } : (symOrObj || {});
    return this.insertConstant(preset, target);
  }

  // 快捷插入物理量 (相容字串與物件傳參)
  addQuantity(symOrObj, target = this.cursorTarget) {
    const preset = typeof symOrObj === "string" ? { quantityId: symOrObj } : (symOrObj || {});
    return this.insertQuantity(preset, target);
  }

  // 評估因子
  evaluateFactor(token) {
    return CalculatorEvaluator.evaluateFactor(token, this);
  }

  // 產生可視化方程式表現結構
  generateEquationRepresentation(tokens = this.tokens, scope = "root", parentId = null) {
    return CalculatorFormatter.generateEquationRepresentation(tokens, this, scope, parentId);
  }

  // 計算扁平多項式
  evaluateFlatPolynomial(flatTokens) {
    return CalculatorEvaluator.evaluateFlatPolynomial(flatTokens, this);
  }

  // 評估遞迴表達式
  evaluateTokensExpression(tokens) {
    return CalculatorEvaluator.evaluateTokensExpression(tokens, this);
  }

  // 因次比對反查
  matchDimensionToQuantity(dim) {
    return CalculatorFormatter.matchDimensionToQuantity(dim);
  }

  // 格式化輸出
  formatResult(targetSystem = "Space") {
    return CalculatorFormatter.formatResult(this.lastResult, targetSystem);
  }

  // 格式化因次字串
  formatDimensionString(dim) {
    return CalculatorFormatter.formatDimensionString(dim);
  }

  // 格式化基礎 SI 單位字串
  formatBaseUnitString(dim) {
    return CalculatorFormatter.formatBaseUnitString(dim);
  }

  // 計算入口
  compute() {
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
      return this.formatResult(this.displaySystem);
    }

    try {
      const finalEval = this.evaluateTokensExpression(this.tokens);
      const matchedQty = this.matchDimensionToQuantity(finalEval.dimension);

      this.lastResult = {
        hasError: false,
        valueSI: finalEval.baseValue,
        dimension: finalEval.dimension,
        matchedQuantity: matchedQty,
        groups: finalEval.groups || []
      };

      return this.formatResult(this.displaySystem);
    } catch (err) {
      if (err.message === "DIMENSION_MISMATCH") {
        this.lastResult = {
          hasError: true,
          errorType: "DIMENSION_MISMATCH",
          warningTitleZh: "多項式單位因次不符警告",
          warningTitleEn: "Dimensional Inconsistency Warning",
          mismatchDetails: err.mismatches.map(m => {
            const q1Name = m.firstTermQty ? m.firstTermQty.nameZh : m.firstTermDimStr;
            const q2Name = m.currentTermQty ? m.currentTermQty.nameZh : m.currentTermDimStr;
            return `項 #${m.groupIndex} (${m.currentExpression}) 之因次為【${q2Name}】，與同式中之因次【${q1Name}】不符，無法相加減。`;
          }),
          adviceZh: "在物理運算中，只有具有相同因次（相同物理量類別）的項才能進行相加（＋）或相減（－）。請檢查括號內外各項目的次方或運算符號。",
          adviceEn: "Only terms with identical dimensions can be added or subtracted.",
          groups: err.groups
        };
        return this.formatResult(this.displaySystem);
      }
      throw err;
    }
  }
}
