/**
 * calculator.js - 自訂物理量組合計算與因次分析引擎
 */

class PlasmaCustomCalculator {
  constructor() {
    this.terms = [];
    this.nextTermId = 1;
    this.lastResult = null;
    this.displaySystem = "Space"; // 預設以太空常用制顯示 (nT, nPa, km/s, eV 等)
  }

  // 新增一個計算項目
  addTerm(preset = {}) {
    const termId = this.nextTermId++;
    const defaultQty = PHYSICAL_QUANTITIES[0]; // 預設為磁場

    const term = {
      id: termId,
      op: preset.op || "*", // 運算符號: "*" (乘), "/" (除), "+" (加), "-" (減)
      type: preset.type || "quantity", // "quantity", "constant", "pure_number"
      quantityId: preset.quantityId || defaultQty.id,
      constantId: preset.constantId || "mu0",
      numberValue: preset.numberValue !== undefined ? preset.numberValue : 1,
      multiplier: preset.multiplier !== undefined ? preset.multiplier : 1, // 前方係數 (如 1/2 或 2)
      unitId: preset.unitId || defaultQty.units[1].id, // 預設太空單位 nT
      position: preset.position || "numerator", // "numerator" (分子) 或 "denominator" (分母)
      power: preset.power !== undefined ? preset.power : 1 // 次方冪次
    };

    this.terms.push(term);
    return term;
  }

  // 移除項目
  removeTerm(termId) {
    this.terms = this.terms.filter(t => t.id !== termId);
  }

  // 清空所有項目
  clear() {
    this.terms = [];
    this.nextTermId = 1;
    this.lastResult = null;
  }

  // 取得項目所屬物理量定義
  getQuantityDef(quantityId) {
    return PHYSICAL_QUANTITIES.find(q => q.id === quantityId) || PHYSICAL_QUANTITIES[0];
  }

  // 取得常數定義
  getConstantDef(constantId) {
    return PHYSICAL_CONSTANTS[constantId] || PHYSICAL_CONSTANTS.mu0;
  }

  // 計算因次向量與單項在 SI 制下的基底值
  evaluateSingleTerm(term) {
    let baseValue = 0;
    let dimension = [0, 0, 0, 0, 0]; // [M, L, T, I, Theta]
    let desc = "";

    const mult = parseFloat(term.multiplier) || 1;
    const power = parseFloat(term.power) || 1;
    const isDenom = term.position === "denominator";
    const effectivePower = isDenom ? -power : power;

    if (term.type === "quantity") {
      const qDef = this.getQuantityDef(term.quantityId);
      const unitDef = qDef.units.find(u => u.id === term.unitId) || qDef.units[0];
      const val = parseFloat(term.numberValue) || 0;
      const siValue = mult * (val * unitDef.toBaseSI);

      baseValue = Math.pow(siValue, effectivePower);
      dimension = qDef.dimension.map(d => d * effectivePower);
      desc = `${mult !== 1 ? mult + ' × ' : ''}(${val} ${unitDef.id})^${effectivePower}`;
    } else if (term.type === "constant") {
      const cDef = this.getConstantDef(term.constantId);
      const siValue = mult * cDef.value;

      baseValue = Math.pow(siValue, effectivePower);
      dimension = cDef.dimension.map(d => d * effectivePower);
      desc = `${mult !== 1 ? mult + ' × ' : ''}(${cDef.symbol})^${effectivePower}`;
    } else {
      // 純數值
      const val = parseFloat(term.numberValue) || 1;
      const siValue = mult * val;
      baseValue = Math.pow(siValue, effectivePower);
      dimension = [0, 0, 0, 0, 0];
      desc = `${siValue}^${effectivePower}`;
    }

    return { baseValue, dimension, effectivePower, desc };
  }

  // 執行全體因次乘除計算
  compute() {
    if (this.terms.length === 0) {
      throw new Error("請先新增至少一個物理量或常數項目。");
    }

    let totalValueSI = 1;
    let totalDim = [0, 0, 0, 0, 0];

    // 目前核心為乘除組合（太空物理方程式的經典計算方式：分子分母次方積木）
    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];
      const res = this.evaluateSingleTerm(term);

      if (isNaN(res.baseValue) || !isFinite(res.baseValue)) {
        throw new Error(`第 ${i + 1} 個項目的數值無效或產生零除溢位。`);
      }

      totalValueSI *= res.baseValue;
      for (let d = 0; d < 5; d++) {
        totalDim[d] += res.dimension[d];
      }
    }

    // 四捨五入因次浮點微差
    totalDim = totalDim.map(d => Math.round(d * 100) / 100);

    // 反查匹配之物理量
    const matchedQty = this.matchDimensionToQuantity(totalDim);

    this.lastResult = {
      valueSI: totalValueSI,
      dimension: totalDim,
      matchedQuantity: matchedQty
    };

    return this.formatResult(this.displaySystem);
  }

  // 因次比對反查
  matchDimensionToQuantity(dim) {
    for (const q of PHYSICAL_QUANTITIES) {
      let isMatch = true;
      for (let i = 0; i < 5; i++) {
        if (Math.abs(q.dimension[i] - dim[i]) > 0.01) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) return q;
    }
    return null;
  }

  // 格式化輸出單位與換算
  formatResult(targetSystem = "Space") {
    if (!this.lastResult) return null;
    this.displaySystem = targetSystem;

    const { valueSI, dimension, matchedQuantity } = this.lastResult;

    // 若比對到已知物理量
    if (matchedQuantity) {
      let targetUnit = null;
      if (targetSystem === "Space") {
        targetUnit = matchedQuantity.units.find(u => u.system === "Space") || matchedQuantity.units[0];
      } else if (targetSystem === "CGS") {
        targetUnit = matchedQuantity.units.find(u => u.system === "CGS") || matchedQuantity.units[0];
      } else {
        targetUnit = matchedQuantity.units.find(u => u.system === "SI") || matchedQuantity.units[0];
      }

      const displayVal = valueSI / targetUnit.toBaseSI;

      return {
        isKnown: true,
        quantityNameZh: matchedQuantity.nameZh,
        quantityNameEn: matchedQuantity.nameEn,
        value: displayVal,
        unitLabel: targetUnit.label,
        unitId: targetUnit.id,
        system: targetSystem,
        rawSI: valueSI,
        baseUnitSI: matchedQuantity.baseUnitSI,
        dimensionStr: this.formatDimensionString(dimension),
        allUnits: matchedQuantity.units.map(u => ({
          system: u.system,
          label: u.label,
          id: u.id,
          value: valueSI / u.toBaseSI
        }))
      };
    }

    // 若為無因次純數
    const isDimensionless = dimension.every(d => Math.abs(d) < 0.01);
    if (isDimensionless) {
      return {
        isKnown: true,
        quantityNameZh: "無因次純量 (Dimensionless)",
        quantityNameEn: "Dimensionless Scalar",
        value: valueSI,
        unitLabel: "純數值 (無單位)",
        unitId: "1",
        system: targetSystem,
        rawSI: valueSI,
        baseUnitSI: "1",
        dimensionStr: "[無因次]",
        allUnits: []
      };
    }

    // 未知複合維度：直接輸出 SI 基礎因次單位字串 (kg^a m^b s^c A^d K^e)
    const baseUnitStr = this.formatBaseUnitString(dimension);
    return {
      isKnown: false,
      quantityNameZh: "複合導出物理量",
      quantityNameEn: "Composite Derived Quantity",
      value: valueSI,
      unitLabel: baseUnitStr,
      unitId: baseUnitStr,
      system: "SI",
      rawSI: valueSI,
      baseUnitSI: baseUnitStr,
      dimensionStr: this.formatDimensionString(dimension),
      allUnits: []
    };
  }

  // 格式化因次為 [M^a L^b T^c I^d Θ^e]
  formatDimensionString(dim) {
    const symbols = ["M", "L", "T", "I", "Θ"];
    const parts = [];
    for (let i = 0; i < 5; i++) {
      if (Math.abs(dim[i]) > 0.01) {
        parts.push(dim[i] === 1 ? symbols[i] : `${symbols[i]}^${dim[i]}`);
      }
    }
    return parts.length > 0 ? `[${parts.join(" · ")}]` : "[無因次]";
  }

  // 格式化基礎 SI 單位字串
  formatBaseUnitString(dim) {
    const units = ["kg", "m", "s", "A", "K"];
    const parts = [];
    for (let i = 0; i < 5; i++) {
      if (Math.abs(dim[i]) > 0.01) {
        parts.push(dim[i] === 1 ? units[i] : `${units[i]}^${dim[i]}`);
      }
    }
    return parts.length > 0 ? parts.join("·") : "純數";
  }
}
