/**
 * js/equation-solver.js - 太空物理方程式求解器深模組 (Equation Solver)
 * 依據 ADR-010 規範，提供無 DOM 依賴的純粹物理評估接縫 (Pure Physics Evaluation Seam)：
 *   - 封裝參數物理邊界斷言 (assertPhysicalBoundary)
 *   - 執行數值計算與除零/無窮大防禦
 *   - 處理多制度 (SI / CGS / Space) 替代單位計算與偵測
 *   - 解析數量級標尺物理對數維度與定位百分比
 */

class EquationSolver {
  /**
   * 檢驗單一參數是否違反物理邊界
   */
  static assertPhysicalBoundary(param, rawVal, uDef, isZh = true) {
    if (isNaN(rawVal)) {
      return isZh ? "錯誤：請輸入有效數值" : "Error: Please enter a valid number";
    }
    const c = param.unitCategory, id = param.id;
    if ((c === "magnetic_field" || id === "B" || id === "B1") && rawVal <= 0) {
      return isZh ? "錯誤：磁場強度必須大於 0 (B > 0)" : "Error: Magnetic field B must be greater than 0";
    }
    if ((c === "density" || c === "number_density" || ["n", "n1", "ne", "ni", "np"].includes(id)) && rawVal <= 0) {
      return isZh ? "錯誤：粒子數密度必須大於 0 (n > 0)" : "Error: Number density n must be greater than 0";
    }
    if (c === "temperature" || ["T", "Te", "Ti", "Tp"].includes(id)) {
      const valK = uDef && uDef.id === "eV" ? rawVal * 11604.518 : rawVal;
      if (valK < 0) return isZh ? "錯誤：熱力學溫度不可低於絕對零度 (T ≥ 0 K)" : "Error: Temperature cannot be below 0 K";
    }
    if (id === "Rc" && rawVal <= 0) return isZh ? "錯誤：曲率半徑必須大於 0 (Rc > 0)" : "Error: Curvature radius must be > 0";
    if (id === "gamma" && rawVal <= 1) return isZh ? "錯誤：絕熱指數必須大於 1 (γ > 1)" : "Error: Adiabatic index γ must be > 1";
    if (id === "M1" && rawVal <= 0) return isZh ? "錯誤：上游馬赫數必須大於 0 (M1 > 0)" : "Error: Upstream Mach number M1 must be > 0";
    if (id === "kappa" && rawVal <= 1.5) return isZh ? "錯誤：Kappa 指數必須大於 1.5 (κ > 1.5)" : "Error: Kappa index must be > 1.5";
    return null;
  }

  /**
   * 清理單位字串中的說明括號
   */
  static cleanUnit(str) {
    if (!str) return "";
    const cleaned = str.replace(/\s*\(.*?\)/g, "").trim();
    return cleaned || str;
  }

  /**
   * 辨識單位所屬之物理制度 (SI / CGS / 太空常用制 / 無因次)
   */
  static detectUnitSystem(uStr, isZh = true) {
    if (!uStr) return "";
    if (typeof UnitSystemEngine !== "undefined" && typeof UnitSystemEngine.detectUnitSystem === "function") {
      const sys = UnitSystemEngine.detectUnitSystem(uStr);
      if (sys === "Dimensionless") return isZh ? "無因次" : "Dimensionless";
      if (sys === "Space") return isZh ? "太空常用制" : "Space";
      if (sys === "CGS") return isZh ? "高斯制" : "CGS";
      return isZh ? "SI 制" : "SI";
    }
    const s = uStr.trim();
    if (s === "1" || s === "" || s.includes("無因次") || s.includes("比值") || s.toLowerCase().includes("ratio") || s.toLowerCase().includes("dimensionless")) {
      return isZh ? "無因次" : "Dimensionless";
    }
    const token = s.replace(/[\(\)\[\]]/g, "").trim();
    const SP = ["nT", "gamma", "γ", "km", "km/s", "c", "eV", "keV", "MeV", "GeV", "nPa", "pPa", "kHz", "MHz", "GHz", "mHz", "ms", "μs", "us", "ns", "cm⁻³", "cm^-3", "cc", "/cm³", "RE", "AU", "eV/nT"];
    const CGS = ["G", "Gauss", "dyn/cm²", "dyn/cm^2", "dyn", "erg", "erg/G", "cm", "cm/s", "g/cm³", "barye"];
    if (SP.some(u => token === u || token.startsWith(u + " ") || token.endsWith(" " + u) || token.startsWith(u + "/") || token.endsWith("/" + u))) return isZh ? "太空常用制" : "Space";
    if (CGS.some(u => token === u || token.startsWith(u + " ") || token.endsWith(" " + u) || token.startsWith(u + "/") || token.endsWith("/" + u))) return isZh ? "高斯制" : "CGS";
    return isZh ? "SI 制" : "SI";
  }

  /**
   * 解析輸出物理量之數量級標尺維度類型
   */
  static resolveMeterType(out) {
    const u = (out.unit || "").trim(), lbl = ((out.labelZh || "") + " " + (out.labelEn || "")).toLowerCase();
    if (!u || u === "1" || u.includes("Dimensionless") || u.includes("Ratio") || u.includes("比值") || u === "≤ 1") {
      return (lbl.includes("beta") || lbl.includes("貝他") || lbl.includes("mach") || lbl.includes("馬赫")) ? "beta" : (lbl.includes("比") || lbl.includes("ratio") ? "ratio" : null);
    }
    if (u.includes("Hz") || u.includes("rad/s")) return "frequency";
    if (["s", "ms", "μs", "us", "ns"].includes(u)) return "time";
    if (["km/s", "m/s", "cm/s"].includes(u)) return "velocity";
    if (["m", "km", "cm"].includes(u)) return "length";
    return null;
  }

  /**
   * 計算數量級標尺對數百分比與物理定位
   */
  static computeMeterMetrics(numVal, meterType, origUnit = "") {
    if (!numVal || isNaN(numVal) || numVal <= 0 || !meterType) return null;

    let minLog = 0, maxLog = 6, valLog = Math.log10(Math.abs(numVal));

    if (meterType === "frequency") {
      let hz = Math.abs(numVal);
      if (origUnit.includes("rad/s")) hz = hz / (2 * Math.PI);
      else if (origUnit.includes("kHz")) hz = hz * 1e3;
      else if (origUnit.includes("MHz")) hz = hz * 1e6;
      else if (origUnit.includes("GHz")) hz = hz * 1e9;
      else if (origUnit.includes("mHz")) hz = hz * 1e-3;
      valLog = Math.log10(hz);
      minLog = -1; maxLog = 6;
    } else if (meterType === "time") {
      let sec = Math.abs(numVal);
      if (origUnit === "ms") sec = sec * 1e-3;
      else if (origUnit === "μs" || origUnit === "us") sec = sec * 1e-6;
      else if (origUnit === "ns") sec = sec * 1e-9;
      valLog = Math.log10(1 / sec);
      minLog = -1; maxLog = 6;
    } else if (meterType === "velocity") {
      let kms = Math.abs(numVal);
      if (origUnit === "m/s") kms = kms / 1000;
      else if (origUnit === "cm/s") kms = kms / 100000;
      valLog = Math.log10(kms);
      minLog = 0; maxLog = 3.5;
    } else if (meterType === "length") {
      let m = Math.abs(numVal);
      if (origUnit === "km") m = m * 1000;
      else if (origUnit === "cm") m = m * 0.01;
      valLog = Math.log10(m);
      minLog = 0; maxLog = 7;
    } else if (meterType === "beta") {
      minLog = -3; maxLog = 2;
    } else if (meterType === "ratio") {
      minLog = 0; maxLog = 2;
    } else {
      return null;
    }

    const clampedLog = Math.max(minLog, Math.min(maxLog, valLog));
    const percent = ((clampedLog - minLog) / (maxLog - minLog)) * 100;

    return {
      meterType,
      percent: parseFloat(percent.toFixed(1)),
      valLog: parseFloat(valLog.toFixed(2))
    };
  }

  /**
   * 核心求值接縫：執行前置邊界檢驗、數值求值、替代單位計算與標尺物理定位
   * @param {string|Object} equationIdOrDef - 方程式識別碼或定義物件
   * @param {Object} rawInputs - 使用者輸入參數映射 { [paramId]: value }
   * @param {Object} inputUnits - 參數單位定義映射 { [paramId]: unitDef }
   * @param {Object} options - 語言與設定選項 { isZh: true }
   * @returns {Object} 結構化結果 EquationSolveResult
   */
  static solve(equationIdOrDef, rawInputs = {}, inputUnits = {}, options = {}) {
    const isZh = options.isZh !== false;
    const eq = typeof equationIdOrDef === "string"
      ? (typeof EQUATIONS_DATABASE !== "undefined" ? EQUATIONS_DATABASE.find(e => e.id === equationIdOrDef) : null)
      : equationIdOrDef;

    if (!eq) {
      return {
        hasError: true,
        errorType: "NOT_FOUND",
        message: isZh ? "錯誤：找不到指定的方程式" : "Error: Equation not found"
      };
    }

    const resolvedInputs = {};
    const resolvedUnits = { ...inputUnits };

    // 1. 逐項參數邊界檢驗
    for (const param of eq.inputs) {
      if (param.type === "select") {
        const val = rawInputs[param.id] !== undefined ? rawInputs[param.id] : param.default;
        let chosen = null;
        if (typeof val === "object" && val !== null && val.m !== undefined && val.q !== undefined) {
          chosen = val;
        } else {
          const matchVal = (val && typeof val === "object" && val.value) ? val.value : val;
          chosen = param.options.find(o => o.value === matchVal) || param.options.find(o => o.value === param.default) || param.options[0];
        }

        if (chosen && chosen.m !== undefined && chosen.m <= 0) {
          return {
            hasError: true,
            errorType: "BOUNDARY_VIOLATION",
            violatedParamId: param.id,
            message: isZh ? "錯誤：粒子質量必須大於 0 (m > 0)" : "Error: Particle mass must be > 0"
          };
        }
        if (chosen && chosen.q !== undefined && chosen.q === 0 && eq.id.includes("gyro")) {
          return {
            hasError: true,
            errorType: "BOUNDARY_VIOLATION",
            violatedParamId: param.id,
            message: isZh ? "錯誤：中性粒子不產生迴旋運動 (q ≠ 0)" : "Error: Neutral particle has no gyration (q ≠ 0)"
          };
        }
        resolvedInputs[param.id] = chosen;
      } else {
        const rawVal = rawInputs[param.id] !== undefined ? parseFloat(rawInputs[param.id]) : (param.default || 0);
        let uDef = resolvedUnits[param.id] || null;
        if (!uDef && param.unitCategory) {
          const qDef = (typeof PHYSICAL_QUANTITIES !== "undefined")
            ? PHYSICAL_QUANTITIES.find(q => q.id === param.unitCategory) : null;
          uDef = qDef ? (qDef.units.find(u => u.id === param.defaultUnit) || qDef.units[0]) : { toBaseSI: 1, factor: 1 };
        }
        if (uDef && uDef.toBaseSI === undefined && uDef.factor !== undefined) {
          uDef.toBaseSI = uDef.factor;
        }
        resolvedUnits[param.id] = uDef;

        const errMsg = this.assertPhysicalBoundary(param, rawVal, uDef, isZh);
        if (errMsg) {
          return {
            hasError: true,
            errorType: "BOUNDARY_VIOLATION",
            violatedParamId: param.id,
            message: errMsg
          };
        }
        resolvedInputs[param.id] = isNaN(rawVal) ? 0 : rawVal;
      }
    }

    // 2. 呼叫底層物理公式求值
    let rawOutputs = null;
    try {
      rawOutputs = eq.calculate(resolvedInputs, resolvedUnits);
    } catch (calcErr) {
      return {
        hasError: true,
        errorType: "CALCULATION_ERROR",
        message: calcErr.message || (isZh ? "計算發生內部錯誤" : "Calculation error")
      };
    }

    if (!rawOutputs || rawOutputs.some(o => isNaN(o.value) || !isFinite(o.value))) {
      return {
        hasError: true,
        errorType: "NUMERICAL_OVERFLOW",
        message: isZh ? "錯誤：數值超出物理計算範圍 (產生除以零或無效值)" : "Error: Value out of physical range"
      };
    }

    // 3. 處理輸出項目：替代單位、制度偵測與數量級標尺物理數據
    const enrichedOutputs = rawOutputs.map((out, outIdx) => {
      const rawBaseUnit = isZh ? (out.unitZh || out.unit) : (out.unitEn || out.unit);
      const baseUnitStr = this.cleanUnit(rawBaseUnit);
      const baseSystem = this.detectUnitSystem(baseUnitStr, isZh);

      const allUnits = [{ label: baseUnitStr, value: out.value, isBase: true, system: baseSystem }];
      if (out.altUnits) {
        allUnits.push(...out.altUnits.map(a => {
          const lbl = this.cleanUnit(isZh ? (a.labelZh || a.label) : (a.labelEn || a.label));
          return {
            label: lbl,
            value: a.value,
            system: this.detectUnitSystem(lbl, isZh)
          };
        }));
      }

      const meterType = this.resolveMeterType(out);
      const meterMetrics = meterType ? this.computeMeterMetrics(out.value, meterType, out.unit || "") : null;

      return {
        ...out,
        outIndex: outIdx,
        baseUnitStr,
        baseSystem,
        allUnits,
        meterType,
        meterMetrics
      };
    });

    return {
      hasError: false,
      equation: eq,
      inputs: resolvedInputs,
      units: resolvedUnits,
      outputs: enrichedOutputs
    };
  }
}
