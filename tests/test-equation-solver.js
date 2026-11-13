/**
 * tests/test-equation-solver.js - EquationSolver 物理方程式求解深模組測試套件
 * 驗證物理邊界斷言、數值求值精準度、替代單位計算與數量級標尺物理數據
 */

load("constants.js");
load("js/plasma-core.js");
load("js/equations-particle.js");
load("js/equations-mhd-waves.js");
load("js/equations-kinetic-shocks.js");
load("equations.js");
load("js/equation-solver.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion Failed: " + message);
  }
}

print("==================================================");
print(" EquationSolver Automated Test Suite");
print("==================================================");

// Test 1: 質點運動方程式 (迴旋頻率與迴旋半徑)
var resGyro = EquationSolver.solve("gyro_frequency", { B: 10, particle: { m: 1.6726e-27, q: 1.6022e-19 } }, { B: { factor: 1e-9 } });
assert(resGyro.hasError === false, "迴旋頻率計算應成功");
assert(resGyro.outputs.length > 0, "應有輸出結果");
var gyroFreqOut = resGyro.outputs[0];
assert(gyroFreqOut.value > 0, "迴旋頻率應為正值");
assert(gyroFreqOut.meterType === "frequency", "迴旋頻率應解析為 frequency 標尺類型");
assert(gyroFreqOut.meterMetrics !== null, "標尺度量數據不應為空");
print("[✓] Test 1: 質點運動 (gyro_frequency) 求解與標尺映射通過");

// Test 2: MHD 波動 (阿爾芬速度)
var resVA = EquationSolver.solve("alfven_speed", { B: 10, n: 5 }, { B: { factor: 1e-9 }, n: { factor: 1e6 } });
assert(resVA.hasError === false, "阿爾芬速度計算應成功");
var vaOut = resVA.outputs[0];
assert(vaOut.value > 0, "阿爾芬速度應大於 0");
assert(vaOut.meterType === "velocity", "阿爾芬速度應解析為 velocity 標尺類型");
assert(vaOut.allUnits.length >= 2, "應包含替代單位 (m/s, km/s 等)");
print("[✓] Test 2: MHD 波動 (alfven_speed) 求解與多單位映射通過");

// Test 3: 震波跳躍條件 (Rankine-Hugoniot 垂直激波密度躍度)
var resShock = EquationSolver.solve("rankine_hugoniot", { M1: 3, gamma: 1.6667, B1: 5, n1: 5 });
assert(resShock.hasError === false, "激波跳躍計算應成功");
var shockOut = resShock.outputs[0];
assert(shockOut.value > 1, "上游超音速激波壓縮比應大於 1");
assert(shockOut.baseSystem === "無因次" || shockOut.baseSystem === "Dimensionless", "密度比應為無因次");
print("[✓] Test 3: 震波跳躍條件 (rankine_hugoniot) 求解通過");

// Test 4: 物理邊界防禦斷言 - 磁場 B <= 0
var errB = EquationSolver.solve("alfven_speed", { B: 0, n: 5 });
assert(errB.hasError === true, "B=0 必須觸發邊界防禦");
assert(errB.errorType === "BOUNDARY_VIOLATION", "錯誤類型應為 BOUNDARY_VIOLATION");
assert(errB.violatedParamId === "B", "違規參數應為 B");
print("[✓] Test 4: 磁場強度邊界防禦 (B <= 0) 攔截通過");

// Test 5: 物理邊界防禦斷言 - 密度 n <= 0
var errN = EquationSolver.solve("alfven_speed", { B: 10, n: -2 });
assert(errN.hasError === true, "n <= 0 必須觸發邊界防禦");
assert(errN.violatedParamId === "n", "違規參數應為 n");
print("[✓] Test 5: 粒子密度邊界防禦 (n <= 0) 攔截通過");

// Test 6: 物理邊界防禦斷言 - 馬赫數 M1 <= 0 與 絕熱指數 gamma <= 1
var errM = EquationSolver.solve("rankine_hugoniot", { M1: -1, gamma: 1.6667, B1: 5, n1: 5 });
assert(errM.hasError === true && errM.violatedParamId === "M1", "M1 <= 0 必須攔截");
var errGamma = EquationSolver.solve("rankine_hugoniot", { M1: 2, gamma: 0.8, B1: 5, n1: 5 });
assert(errGamma.hasError === true && errGamma.violatedParamId === "gamma", "gamma <= 1 必須攔截");
print("[✓] Test 6: 激波參數邊界防禦 (M1 <= 0, gamma <= 1) 攔截通過");

// Test 7: 數量級標尺維度計算 (computeMeterMetrics)
var freqMetrics = EquationSolver.computeMeterMetrics(1000, "frequency", "Hz");
assert(freqMetrics.meterType === "frequency", "meterType 應為 frequency");
assert(freqMetrics.percent >= 0 && freqMetrics.percent <= 100, "percent 應在 0~100 之間");
print("[✓] Test 7: 數量級標尺對數映射計算通過");

// Test 8: 單位制度自動偵測 (detectUnitSystem)
assert(EquationSolver.detectUnitSystem("nT", true) === "太空常用制", "nT 應為太空常用制");
assert(EquationSolver.detectUnitSystem("Gauss", true) === "高斯制", "Gauss 應為高斯制");
assert(EquationSolver.detectUnitSystem("Tesla", true) === "SI 制", "Tesla 應為 SI 制");
assert(EquationSolver.detectUnitSystem("1", true) === "無因次", "1 應為無因次");
print("[✓] Test 8: 單位制度自動偵測 (detectUnitSystem) 通過");

print("==================================================");
print(" ALL 8 TESTS PASSED PERFECLY!");
print("==================================================");
