/**
 * tests/test-unit-system-engine.js - UnitSystemEngine 單位制度與物理常數深模組測試套件
 * 驗證跨制度單位換算、常數多維解析、指數搜尋與制度自動偵測
 */

load("constants.js");
load("js/plasma-core.js");
load("js/unit-system-engine.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion Failed: " + message);
  }
}

print("==================================================");
print(" UnitSystemEngine Automated Test Suite");
print("==================================================");

// Test 1: 磁場單位換算 (nT <-> T <-> G)
var resB1 = UnitSystemEngine.convert(1000, "nT", "T", "magnetic_field");
assert(Math.abs(resB1.value - 1e-6) < 1e-15, "1000 nT 應等於 1e-6 T");
assert(resB1.factor === 1e-9, "nT 轉 T 之比率應為 1e-9");
assert(resB1.isExact === true, "純 10 的次冪比率應判定為 isExact=true");

var resB2 = UnitSystemEngine.convert(1, "G", "nT", "magnetic_field");
assert(Math.abs(resB2.value - 1e5) < 1e-6, "1 G 應等於 100,000 nT");
print("[✓] Test 1: 磁場跨制度單位換算 (nT, T, G) 通過");

// Test 2: 電漿溫度換算 (eV <-> K)
var resT = UnitSystemEngine.convert(1, "eV", "K", "temperature");
assert(Math.abs(resT.value - 11604.525) < 1e-3, "1 eV 應約等於 11,605 K");
var resKeV = UnitSystemEngine.convert(1, "keV", "eV", "temperature");
assert(Math.abs(resKeV.value - 1000) < 1e-5, "1 keV 應等於 1000 eV");
print("[✓] Test 2: 電漿溫度換算 (eV, keV, K) 通過");

// Test 3: 粒子數密度換算 (cm⁻³ <-> m⁻³)
var resN = UnitSystemEngine.convert(5, "cm_minus3", "m_minus3", "number_density");
assert(Math.abs(resN.value - 5e6) < 1e-3, "5 cm⁻³ 應等於 5,000,000 m⁻³");
assert(resN.isExact === true, "cm⁻³ 轉 m⁻³ 應為精確次冪轉換");
print("[✓] Test 3: 數密度換算 (cm⁻³ 到 m⁻³) 通過");

// Test 4: 流速與波速換算 (km/s <-> m/s <-> c)
var resV = UnitSystemEngine.convert(400, "km_per_s", "m_per_s", "velocity");
assert(Math.abs(resV.value - 400000) < 1e-3, "400 km/s 太陽風應等於 400,000 m/s");
var resC = UnitSystemEngine.convert(1, "speed_of_light", "km_per_s", "velocity");
assert(Math.abs(resC.value - 299792.458) < 1e-3, "1 c 應等於 299,792.458 km/s");
print("[✓] Test 4: 流速與光速換算 (km/s, m/s, c) 通過");

// Test 5: 智慧檢索與指數符號正規化
var searchExp = UnitSystemEngine.searchQuantities("cm^-3");
assert(searchExp.length > 0, "輸入 cm^-3 應成功搜尋到包含 cm⁻³ 的數密度物理量");
assert(searchExp.some(function(q) { return q.id === "number_density"; }), "搜尋結果應包含 number_density");

var searchB = UnitSystemEngine.searchQuantities("磁場");
assert(searchB.some(function(q) { return q.id === "magnetic_field"; }), "輸入中文關鍵字應命中磁場");
print("[✓] Test 5: 智慧檢索與指數符號正規化 (cm^-3, 磁場) 通過");

// Test 6: 多制度物理常數查詢 (SI, CGS, Space)
var constC_SI = UnitSystemEngine.getConstant("c", "SI");
var constC_CGS = UnitSystemEngine.getConstant("c", "CGS");
var constC_Space = UnitSystemEngine.getConstant("c", "Space");
assert(constC_SI.value === 299792458, "SI 光速應為 299,792,458 m/s");
assert(constC_CGS.value === 2.99792458e10, "CGS 光速應為 2.99792458e10 cm/s");
assert(constC_Space.value === 299792.458, "Space 光速應為 299,792.458 km/s");

var constKB_Space = UnitSystemEngine.getConstant("kB", "Space");
assert(constKB_Space.unit === "eV/K", "Space 制度波茲曼常數單位應為 eV/K");
print("[✓] Test 6: 多制度常數查詢 (c, kB 於 SI/CGS/Space) 通過");

// Test 7: 跨制度對照矩陣結構檢驗
var comparison = UnitSystemEngine.getSystemComparison();
assert(Array.isArray(comparison), "對照矩陣應為陣列");
assert(comparison.length >= 8, "對照矩陣應包含至少 8 種關鍵物理量");
assert(comparison[0].quantity.indexOf("磁場") >= 0, "首項應包含磁場對照");
print("[✓] Test 7: 跨制度對照矩陣 (getSystemComparison) 通過");

// Test 8: 單位制度自動偵測
assert(UnitSystemEngine.detectUnitSystem("nT (Nanotesla)") === "Space", "nT 應偵測為 Space 制度");
assert(UnitSystemEngine.detectUnitSystem("G (Gauss)") === "CGS", "G 應偵測為 CGS 制度");
assert(UnitSystemEngine.detectUnitSystem("T (Tesla)") === "SI", "T 應偵測為 SI 制度");
assert(UnitSystemEngine.detectUnitSystem("無因次比值") === "Dimensionless", "無因次比值應偵測為 Dimensionless");
print("[✓] Test 8: 單位制度自動偵測 (detectUnitSystem) 通過");

print("==================================================");
print(" ALL 8 TESTS PASSED PERFECTLY!");
print("==================================================");
