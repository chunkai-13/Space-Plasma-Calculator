/**
 * tests/test-formula-ast-engine.js - FormulaASTEngine 核心測試套件
 * 驗證不透明文件接縫、語意變異方法、快照歷史棧、因次一致性與求值正確性
 */

load("constants.js");
load("js/calculator-core.js");
load("js/calculator-evaluator.js");
load("js/calculator-formatter.js");
load("js/formula-ast-engine.js");
load("calculator.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion Failed: " + message);
  }
}

print("==================================================");
print(" FormulaASTEngine Automated Test Suite");
print("==================================================");

// Test 1: 初始化狀態與不可變快照
var engine = new FormulaASTEngine();
var snap0 = engine.getSnapshot();
assert(snap0.termCount === 0, "初始項目數應為 0");
assert(snap0.canUndo === false, "初始不能 Undo");
assert(snap0.canRedo === false, "初始不能 Redo");
assert(Object.isFrozen(snap0), "快照物件應被凍結 (Immutable)");
assert(Object.isFrozen(snap0.terms), "快照內部 terms 陣列應被凍結");
print("[✓] Test 1: 初始狀態檢驗與不可變快照通過");

// Test 2: 語意插入與快照更新
engine.insertQty({ quantityId: "magnetic_field", unitId: "nT", numberValue: 20 });
var snap1 = engine.getSnapshot();
assert(snap1.termCount === 1, "插入物理量後項目數應為 1");
assert(snap1.canUndo === true, "插入項目後應可 Undo");

// 驗證語意方法 insertFraction, insertParentheses, clear
var fracToken = engine.insertFraction();
assert(fracToken && fracToken.type === "fraction", "insertFraction 應成功插入分式節點");
var parens = engine.insertParentheses();
assert(parens && parens.open && parens.close, "insertParentheses 應成功插入括號對");
engine.clear();
assert(engine.getSnapshot().termCount === 0, "clear 語意方法應清空文件");
engine.insertQty({ quantityId: "magnetic_field", unitId: "nT", numberValue: 20 });
print("[✓] Test 2: 語意變異介面 (insertFraction, insertParentheses, clear) 通過");

// Test 3: 觀察者模式 (subscribe) 廣播
var notified = false;
var receivedSnapshot = null;
var unsub = engine.subscribe(function(snap) {
  notified = true;
  receivedSnapshot = snap;
});
engine.insertOp("*");
assert(notified === true, "變異操作應觸發 subscribe 回呼");
assert(receivedSnapshot.termCount === 2, "訂閱接收到的快照項目數應為 2");
unsub();
print("[✓] Test 3: 觀察者模式單向廣播通過");

// Test 4: 復原與重做 (Undo / Redo)
engine.undoAction();
assert(engine.getSnapshot().termCount === 1, "Undo 後項目數應恢復為 1");
assert(engine.canRedo() === true, "Undo 後應可 Redo");
engine.redoAction();
assert(engine.getSnapshot().termCount === 2, "Redo 後項目數應恢復為 2");
print("[✓] Test 4: Undo / Redo 快照歷史棧通過");

// Test 5: 經典公式範本與求值 (Magnetic Pressure)
engine.loadPreset("presetPB");
var snapPB = engine.getSnapshot();
assert(snapPB.termCount === 1, "presetPB 頂層分式項目數應為 1");
var evalPB = engine.evaluate("Space");
assert(evalPB.hasError === false, "presetPB 計算不應有錯誤");
assert(evalPB.quantityNameZh === "壓力 / 能量密度", "因次反查應為壓力");
assert(Math.abs(evalPB.rawSI - 3.97887e-11) < 1e-15, "磁壓力數值應吻合理論值");
print("[✓] Test 5: 經典公式範本 loadPreset(presetPB) 求值通過");

// Test 6: 經典公式範本 (Alfvén Speed)
engine.loadPreset("presetVA");
var evalVA = engine.evaluate("Space");
assert(evalVA.hasError === false, "presetVA 計算不應有錯誤");
assert(evalVA.quantityNameZh.includes("速度"), "因次反查應包含速度");
print("[✓] Test 6: 經典公式範本 loadPreset(presetVA) 求值通過");

// Test 7: LaTeX 雙向解析
engine.parseFromLatex("B^2 / (2 * mu0)");
assert(engine.getSnapshot().termCount === 1, "解析 LaTeX 後應正確建構分式結構");
var evalLatex = engine.evaluate("Space");
assert(evalLatex.hasError === false, "解析後之公式應能正常計算");
print("[✓] Test 7: parseFromLatex 解析與求值通過");

// Test 8: 向後相容包裝層 (PlasmaCustomCalculator)
var legacyCalc = new PlasmaCustomCalculator();
legacyCalc.addQuantity("magnetic_field");
assert(legacyCalc.tokens.length === 1, "Legacy calc.tokens 應正確同步");
var legacyRes = legacyCalc.compute();
assert(legacyRes.hasError === false, "Legacy compute() 應委派成功");
print("[✓] Test 8: 向後相容層 PlasmaCustomCalculator 驗證通過");

print("==================================================");
print(" ALL 8 TESTS PASSED PERFECLY!");
print("==================================================");
