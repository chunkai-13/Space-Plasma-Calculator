/**
 * calculator.js - 多項式運算、因次一致性檢驗與公式生成引擎
 */

class PlasmaCustomCalculator {
  constructor() {
    this.terms = [];
    this.nextTermId = 1;
    this.lastResult = null;
    this.displaySystem = "Space"; // 預設以太空常用制顯示 (nT, nPa, km/s, eV 等)
  }

  // 取得物理量定義
  getQuantityDef(quantityId) {
    return PHYSICAL_QUANTITIES.find(q => q.id === quantityId) || PHYSICAL_QUANTITIES[0];
  }

  // 取得常數定義
  getConstantDef(constantId) {
    return PHYSICAL_CONSTANTS[constantId] || PHYSICAL_CONSTANTS.mu0;
  }

  // 新增運算項目
  addTerm(preset = {}) {
    const termId = this.nextTermId++;
    const defaultQty = PHYSICAL_QUANTITIES[0]; // 預設磁場

    const isFirst = this.terms.length === 0;

    const term = {
      id: termId,
      // 運算符號: 第一項通常為 "+" (或空)，後續項可為 "+", "-", "*", "/"
      operator: preset.operator || (isFirst ? "+" : "+"),
      type: preset.type || "quantity", // "quantity", "constant", "pure_number"
      quantityId: preset.quantityId || defaultQty.id,
      constantId: preset.constantId || "mu0",
      numberValue: preset.numberValue !== undefined ? preset.numberValue : 10,
      multiplier: preset.multiplier !== undefined ? preset.multiplier : 1, // 前方係數 (例如 2 或 0.5)
      unitId: preset.unitId || defaultQty.units[1].id, // 預設太空單位 nT
      power: preset.power !== undefined ? preset.power : 1 // 指數次方 (如 2, 1, 0.5 等)
    };

    this.terms.push(term);
    return term;
  }

  // 移除項目
  removeTerm(termId) {
    this.terms = this.terms.filter(t => t.id !== termId);
    if (this.terms.length > 0 && this.terms[0].operator !== "-") {
      this.terms[0].operator = "+";
    }
  }

  // 清空所有項目
  clear() {
    this.terms = [];
    this.nextTermId = 1;
    this.lastResult = null;
  }

  // 計算單一因子的 SI 基準值與維度向量
  evaluateSingleFactor(term) {
    let baseVal = 0;
    let dimension = [0, 0, 0, 0, 0]; // [M, L, T, I, Theta]
    let symbolStr = "";
    let valueStr = "";
    let latexStr = "";
    let unitLabel = "";

    const mult = parseFloat(term.multiplier) || 1;
    const power = parseFloat(term.power) || 1;

    if (term.type === "quantity") {
      const qDef = this.getQuantityDef(term.quantityId);
      const unitDef = qDef.units.find(u => u.id === term.unitId) || qDef.units[0];
      const val = parseFloat(term.numberValue) || 0;
      const siValue = mult * (val * unitDef.toBaseSI);

      baseVal = Math.pow(siValue, power);
      dimension = qDef.dimension.map(d => d * power);

      const multPrefix = mult !== 1 ? `${mult} · ` : "";
      const pwrSuffix = power !== 1 ? `^${power}` : "";
      symbolStr = `${multPrefix}${qDef.symbol}${pwrSuffix}`;
      valueStr = `${multPrefix}(${val} ${unitDef.id})${pwrSuffix}`;

      // LaTeX 表示
      const multLatex = mult !== 1 ? `${mult} ` : "";
      const pwrLatex = power !== 1 ? `^{${power}}` : "";
      latexStr = `${multLatex}${qDef.symbol}${pwrLatex}`;

      unitLabel = unitDef.label;
    } else if (term.type === "constant") {
      const cDef = this.getConstantDef(term.constantId);
      const siValue = mult * cDef.value;

      baseVal = Math.pow(siValue, power);
      dimension = cDef.dimension.map(d => d * power);

      const multPrefix = mult !== 1 ? `${mult} · ` : "";
      const pwrSuffix = power !== 1 ? `^${power}` : "";
      symbolStr = `${multPrefix}${cDef.symbol}${pwrSuffix}`;
      valueStr = `${multPrefix}${cDef.symbol}${pwrSuffix}`;

      // LaTeX 表示
      let cSymLatex = cDef.symbol;
      if (cDef.id === "mu0") cSymLatex = "\\mu_0";
      else if (cDef.id === "eps0") cSymLatex = "\\varepsilon_0";
      else if (cDef.id === "kB") cSymLatex = "k_B";
      else if (cDef.id === "mp") cSymLatex = "m_p";
      else if (cDef.id === "me") cSymLatex = "m_e";
      else if (cDef.id === "RE") cSymLatex = "R_E";

      const multLatex = mult !== 1 ? `${mult} ` : "";
      const pwrLatex = power !== 1 ? `^{${power}}` : "";
      latexStr = `${multLatex}${cSymLatex}${pwrLatex}`;

      unitLabel = cDef.unit;
    } else {
      // 純數值
      const val = parseFloat(term.numberValue) || 1;
      const siValue = mult * val;
      baseVal = Math.pow(siValue, power);
      dimension = [0, 0, 0, 0, 0];

      const pwrSuffix = power !== 1 ? `^${power}` : "";
      symbolStr = `${siValue}${pwrSuffix}`;
      valueStr = `${siValue}${pwrSuffix}`;
      latexStr = power !== 1 ? `${siValue}^{${power}}` : `${siValue}`;
      unitLabel = "純數值";
    }

    return {
      baseValue: baseVal,
      dimension,
      power,
      symbolStr,
      valueStr,
      latexStr,
      unitLabel
    };
  }

  // 解析多項式：將由 (+, -, *, /) 連接的運算項依優先序拆解成相加減的項群
  parsePolynomialGroups() {
    if (this.terms.length === 0) return [];

    const groups = [];
    let currentGroup = {
      sign: "+",
      factors: [] // { op: "*|/", factor: evaluatedFactor, termRef: term }
    };

    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];
      const op = term.operator || "+";
      const factorEval = this.evaluateSingleFactor(term);

      if (op === "+" || op === "-") {
        if (i === 0) {
          currentGroup.sign = op;
          currentGroup.factors.push({ op: "*", factor: factorEval, termRef: term });
        } else {
          // 結束上一群，開啟新的多項式加減項
          groups.push(currentGroup);
          currentGroup = {
            sign: op,
            factors: [{ op: "*", factor: factorEval, termRef: term }]
          };
        }
      } else {
        // "*" 或 "/"：屬於同一個項的連乘連除
        currentGroup.factors.push({ op, factor: factorEval, termRef: term });
      }
    }

    if (currentGroup.factors.length > 0) {
      groups.push(currentGroup);
    }

    // 計算每個 group（乘除複合項）的總數值與總因次
    groups.forEach((g, idx) => {
      let gVal = 1;
      let gDim = [0, 0, 0, 0, 0];
      const symbolParts = [];
      const valueParts = [];

      g.factors.forEach((f, fIdx) => {
        if (f.op === "/") {
          gVal /= f.factor.baseValue;
          for (let d = 0; d < 5; d++) {
            gDim[d] -= f.factor.dimension[d];
          }
          symbolParts.push(`/ (${f.factor.symbolStr})`);
          valueParts.push(`/ (${f.factor.valueStr})`);
        } else {
          // "*"
          gVal *= f.factor.baseValue;
          for (let d = 0; d < 5; d++) {
            gDim[d] += f.factor.dimension[d];
          }
          if (fIdx > 0) {
            symbolParts.push(`· ${f.factor.symbolStr}`);
            valueParts.push(`· ${f.factor.valueStr}`);
          } else {
            symbolParts.push(f.factor.symbolStr);
            valueParts.push(f.factor.valueStr);
          }
        }
      });

      // 浮點精度修整
      gDim = gDim.map(d => Math.round(d * 100) / 100);

      g.groupIndex = idx + 1;
      g.valueSI = gVal;
      g.dimension = gDim;
      g.matchedQuantity = this.matchDimensionToQuantity(gDim);
      g.dimensionStr = this.formatDimensionString(gDim);
      g.symbolExpression = symbolParts.join(" ");
      g.valueExpression = valueParts.join(" ");
    });

    return groups;
  }

  // 產生目前的數學方程式呈現（LaTeX 與乾淨文字公式）
  generateEquationRepresentation() {
    if (this.terms.length === 0) {
      return {
        formulaText: "（尚未新增任何運算項目）",
        formulaHtml: `<span class="empty-formula">（尚未新增任何運算項目）</span>`,
        latexFormula: "",
        symbolicText: ""
      };
    }

    const groups = this.parsePolynomialGroups();
    const formulaParts = [];
    const htmlParts = [];
    const latexParts = [];

    groups.forEach((g, idx) => {
      const signPrefix = idx === 0 ? (g.sign === "-" ? "- " : "") : ` ${g.sign} `;
      formulaParts.push(`${signPrefix}${g.symbolExpression}`);

      // HTML 精緻排版
      const numFactors = g.factors.filter(f => f.op === "*");
      const denFactors = g.factors.filter(f => f.op === "/");

      let termHtml = "";
      let termLatex = "";

      if (denFactors.length > 0) {
        // 分式結構呈現
        const numStr = numFactors.map(f => this.formatFactorHtml(f.factor)).join(" · ");
        const denStr = denFactors.map(f => this.formatFactorHtml(f.factor)).join(" · ");
        termHtml = `
          <span class="math-fraction">
            <span class="math-num">${numStr || "1"}</span>
            <span class="math-denom">${denStr}</span>
          </span>
        `;

        const numLatex = numFactors.map(f => f.factor.latexStr).join(" \\cdot ");
        const denLatex = denFactors.map(f => f.factor.latexStr).join(" \\cdot ");
        termLatex = `\\frac{${numLatex || "1"}}{${denLatex}}`;
      } else {
        termHtml = numFactors.map(f => this.formatFactorHtml(f.factor)).join(" · ");
        termLatex = numFactors.map(f => f.factor.latexStr).join(" \\cdot ");
      }

      htmlParts.push(`
        <span class="math-term-group" data-group-idx="${idx + 1}">
          <span class="math-op">${signPrefix}</span>
          ${termHtml}
        </span>
      `);

      latexParts.push(`${signPrefix}${termLatex}`);
    });

    return {
      formulaText: formulaParts.join(""),
      formulaHtml: htmlParts.join(""),
      latexFormula: latexParts.join(""),
      groups
    };
  }

  // 格式化單一因子為 HTML (支援上標次方等)
  formatFactorHtml(factor) {
    const pwr = factor.power;
    const pwrHtml = pwr !== 1 ? `<sup>${pwr}</sup>` : "";
    return `<span class="math-factor">${factor.symbolStr.replace(/\^.+$/, "")}${pwrHtml}</span>`;
  }

  // 執行多項式因次一致性檢驗與計算
  compute() {
    if (this.terms.length === 0) {
      throw new Error("請先新增至少一個物理量或常數項目。");
    }

    const groups = this.parsePolynomialGroups();
    if (groups.length === 0) {
      throw new Error("無法解析當前運算式。");
    }

    // 單位因次一致性檢驗 (Dimensional Consistency Check)
    const baseDim = groups[0].dimension;
    const mismatches = [];

    for (let i = 1; i < groups.length; i++) {
      const g = groups[i];
      let isSame = true;
      for (let d = 0; d < 5; d++) {
        if (Math.abs(g.dimension[d] - baseDim[d]) > 0.01) {
          isSame = false;
          break;
        }
      }
      if (!isSame) {
        mismatches.push({
          groupIndex: g.groupIndex,
          expectedDim: baseDim,
          actualDim: g.dimension,
          firstTermQty: groups[0].matchedQuantity,
          currentTermQty: g.matchedQuantity,
          firstTermDimStr: groups[0].dimensionStr,
          currentTermDimStr: g.dimensionStr,
          currentExpression: g.symbolExpression
        });
      }
    }

    // 若有單位因次不符，產生具體警告回傳
    if (mismatches.length > 0) {
      this.lastResult = {
        hasError: true,
        errorType: "DIMENSION_MISMATCH",
        mismatches,
        groups
      };
      return this.formatResult(this.displaySystem);
    }

    // 單位因次完全相符：進行代數累加
    let totalSI = 0;
    groups.forEach(g => {
      if (g.sign === "-") {
        totalSI -= g.valueSI;
      } else {
        totalSI += g.valueSI;
      }
    });

    const finalDim = baseDim;
    const matchedQty = this.matchDimensionToQuantity(finalDim);

    this.lastResult = {
      hasError: false,
      valueSI: totalSI,
      dimension: finalDim,
      matchedQuantity: matchedQty,
      groups
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

    // 若有因次不相符警告
    if (this.lastResult.hasError) {
      const firstGroup = this.lastResult.groups[0];
      const mismatchDetails = this.lastResult.mismatches.map(m => {
        const q1Name = m.firstTermQty ? m.firstTermQty.nameZh : m.firstTermDimStr;
        const q2Name = m.currentTermQty ? m.currentTermQty.nameZh : m.currentTermDimStr;
        return `項 #${m.groupIndex} (${m.currentExpression}) 之因次為【${q2Name}】，與第 1 項之因次【${q1Name}】不符。`;
      });

      return {
        hasError: true,
        warningTitleZh: "多項式單位因次不符警告",
        warningTitleEn: "Dimensional Inconsistency Warning",
        mismatchDetails,
        adviceZh: "在物理運算中，只有具有相同因次（相同物理量類別）的項才能進行相加（＋）或相減（－）。請檢查各項目的次方或運算符號是否有誤。",
        adviceEn: "In physical equations, only terms with identical dimensions can be added or subtracted. Please check exponents or operators.",
        groups: this.lastResult.groups
      };
    }

    const { valueSI, dimension, matchedQuantity, groups } = this.lastResult;

    // 比對到已知物理量
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
        hasError: false,
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
        })),
        groups
      };
    }

    // 無因次純數
    const isDimensionless = dimension.every(d => Math.abs(d) < 0.01);
    if (isDimensionless) {
      return {
        hasError: false,
        isKnown: true,
        quantityNameZh: "無因次純量 (Dimensionless)",
        quantityNameEn: "Dimensionless Scalar",
        value: valueSI,
        unitLabel: "純數值 (無因次)",
        unitId: "1",
        system: targetSystem,
        rawSI: valueSI,
        baseUnitSI: "1",
        dimensionStr: "[無因次]",
        allUnits: [],
        groups
      };
    }

    // 複合導出維度
    const baseUnitStr = this.formatBaseUnitString(dimension);
    return {
      hasError: false,
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
      allUnits: [],
      groups
    };
  }

  // 格式化因次為 [M^a · L^b · T^c ...]
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
