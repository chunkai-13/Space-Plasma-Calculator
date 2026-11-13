/**
 * calculator.js - 自訂電漿運算器總整合入口 (向後相容包裝層，繼承 FormulaASTEngine)
 * 依據 ADR-009，底層模組架構為：
 *   - js/calculator-core.js (Token 模型、游標管理、歷史堆疊、括號分析)
 *   - js/calculator-evaluator.js (數值計算、因次維度相加減檢驗、除零檢查)
 *   - js/calculator-formatter.js (KaTeX 看板結構、因次字串、各制度輸出格式化)
 *   - js/formula-ast-engine.js (FormulaASTEngine 深模組，具備不透明文件接縫與觀察者)
 */

class PlasmaCustomCalculator extends FormulaASTEngine {
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

  // 計算入口 (委託至 evaluate)
  compute() {
    return this.evaluate(this.displaySystem);
  }
}
