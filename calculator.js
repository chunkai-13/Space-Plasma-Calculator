/**
 * calculator.js - 多項式運算、巢狀括號層級排版與因次一致性檢驗引擎
 */

class PlasmaCustomCalculator {
  constructor() {
    this.terms = [];
    this.nextTermId = 1;
    this.lastResult = null;
    this.displaySystem = "Space"; // 預設太空常用制
  }

  // 取得物理量定義
  getQuantityDef(quantityId) {
    return PHYSICAL_QUANTITIES.find(q => q.id === quantityId) || PHYSICAL_QUANTITIES[0];
  }

  // 取得常數定義
  getConstantDef(constantId) {
    return PHYSICAL_CONSTANTS[constantId] || PHYSICAL_CONSTANTS.mu0;
  }

  // 新增項目
  addTerm(preset = {}) {
    const termId = this.nextTermId++;
    const defaultQty = PHYSICAL_QUANTITIES[0];
    const isFirst = this.terms.length === 0;

    const term = {
      id: termId,
      type: preset.type || "quantity", // "quantity", "constant", "open_paren", "close_paren"
      operator: preset.operator || (isFirst ? "+" : "+"),
      quantityId: preset.quantityId || defaultQty.id,
      constantId: preset.constantId || "mu0",
      numberValue: preset.numberValue !== undefined ? preset.numberValue : 10,
      multiplier: preset.multiplier !== undefined ? preset.multiplier : 1,
      unitId: preset.unitId || defaultQty.units[1].id,
      power: preset.power !== undefined ? preset.power : 1
    };

    this.terms.push(term);
    return term;
  }

  // 插入左括號
  addOpenParen(operator = "+") {
    return this.addTerm({
      type: "open_paren",
      operator: this.terms.length === 0 ? "+" : operator
    });
  }

  // 插入右括號
  addCloseParen(power = 1) {
    return this.addTerm({
      type: "close_paren",
      power: power || 1
    });
  }

  // 移除項目
  removeTerm(termId) {
    this.terms = this.terms.filter(t => t.id !== termId);
    if (this.terms.length > 0 && this.terms[0].operator !== "-") {
      this.terms[0].operator = "+";
    }
  }

  // 清空
  clear() {
    this.terms = [];
    this.nextTermId = 1;
    this.lastResult = null;
  }

  // 分析括號配對與層級深度 (Bracket Matching & Height-based Level Classifier)
  analyzeBrackets() {
    const stack = [];
    const pairs = []; // { openIndex, closeIndex, height }
    const errors = [];

    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];
      if (term.type === "open_paren") {
        stack.push(i);
      } else if (term.type === "close_paren") {
        if (stack.length > 0) {
          const openIdx = stack.pop();
          pairs.push({
            openIndex: openIdx,
            closeIndex: i,
            height: 1,
            children: []
          });
        } else {
          errors.push(`位置 #${i + 1} 存在多餘的未匹配右括號。`);
        }
      }
    }

    if (stack.length > 0) {
      errors.push(`尚有 ${stack.length} 個左括號未閉合。`);
    }

    // 計算巢狀包含關係以決定括號層級高度 (Height)
    // 內層括號 height = 1 -> 小括號 ( )
    // 外層包含內層 height = 2 -> 中括號 [ ]
    // 更外層 height = 3 -> 大括號 { }
    for (let i = 0; i < pairs.length; i++) {
      for (let j = 0; j < pairs.length; j++) {
        if (i !== j) {
          if (pairs[i].openIndex < pairs[j].openIndex && pairs[i].closeIndex > pairs[j].closeIndex) {
            pairs[i].children.push(pairs[j]);
          }
        }
      }
    }

    // 遞迴計算每個 pair 的最大子高度
    function calcPairHeight(p) {
      if (!p.children || p.children.length === 0) {
        p.height = 1;
        return 1;
      }
      let maxChild = 0;
      p.children.forEach(c => {
        maxChild = Math.max(maxChild, calcPairHeight(c));
      });
      p.height = 1 + maxChild;
      return p.height;
    }

    pairs.forEach(p => calcPairHeight(p));

    return { pairs, errors, isBalanced: errors.length === 0 };
  }

  // 根據層級高度取得對應括號樣式 (LaTeX 與純文字)
  // height=1 -> ( ), height=2 -> [ ], height=3 -> { }
  getBracketStyle(height) {
    const cycle = (height - 1) % 3;
    if (cycle === 1) {
      return {
        openLatex: "\\left[ ",
        closeLatex: " \\right]",
        openText: "[",
        closeText: "]",
        className: "bracket-level-2"
      };
    } else if (cycle === 2) {
      return {
        openLatex: "\\left\\{ ",
        closeLatex: " \\right\\}",
        openText: "{",
        closeText: "}",
        className: "bracket-level-3"
      };
    } else {
      return {
        openLatex: "\\left( ",
        closeLatex: " \\right)",
        openText: "(",
        closeText: ")",
        className: "bracket-level-1"
      };
    }
  }

  // 單一因子數值與因次評估
  evaluateFactor(term) {
    if (term.isPreComputed) {
      return {
        baseValue: term.baseValue,
        dimension: term.dimension,
        power: term.power || 1,
        symbolStr: term.symbolStr,
        latexStr: term.latexStr
      };
    }

    let baseVal = 0;
    let dimension = [0, 0, 0, 0, 0];
    let symbolStr = "";
    let latexStr = "";

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

      const multLatex = mult !== 1 ? `${mult} ` : "";
      const pwrLatex = power !== 1 ? `^{${power}}` : "";
      latexStr = `${multLatex}${qDef.symbol}${pwrLatex}`;
    } else if (term.type === "constant") {
      const cDef = this.getConstantDef(term.constantId);
      const siValue = mult * cDef.value;

      baseVal = Math.pow(siValue, power);
      dimension = cDef.dimension.map(d => d * power);

      const multPrefix = mult !== 1 ? `${mult} · ` : "";
      const pwrSuffix = power !== 1 ? `^${power}` : "";
      symbolStr = `${multPrefix}${cDef.symbol}${pwrSuffix}`;

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
    } else {
      const val = parseFloat(term.numberValue) || 1;
      const siValue = mult * val;
      baseVal = Math.pow(siValue, power);
      dimension = [0, 0, 0, 0, 0];
      symbolStr = `${siValue}${power !== 1 ? `^${power}` : ""}`;
      latexStr = power !== 1 ? `${siValue}^{${power}}` : `${siValue}`;
    }

    return { baseValue: baseVal, dimension, power, symbolStr, latexStr };
  }

  // 產生包含多層括號變換的 LaTeX 與公式文字
  generateEquationRepresentation() {
    if (this.terms.length === 0) {
      return {
        formulaText: "（尚未新增任何運算項目）",
        latexFormula: "",
        bracketAnalysis: { isBalanced: true, errors: [] }
      };
    }

    const bracketAnalysis = this.analyzeBrackets();
    const pairsMap = new Map();
    bracketAnalysis.pairs.forEach(p => {
      pairsMap.set(p.openIndex, p);
      pairsMap.set(p.closeIndex, p);
    });

    let latexParts = [];
    let textParts = [];

    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];
      const isFirst = i === 0;
      let opSign = term.operator || "+";
      let opText = isFirst ? (opSign === "-" ? "- " : "") : ` ${opSign === "*" ? "·" : opSign === "/" ? "/" : opSign} `;
      let opLatex = isFirst ? (opSign === "-" ? "- " : "") : ` ${opSign === "*" ? "\\cdot" : opSign === "/" ? "/" : opSign} `;

      if (term.type === "open_paren") {
        const pair = pairsMap.get(i);
        const height = pair ? pair.height : 1;
        const bStyle = this.getBracketStyle(height);

        textParts.push(`${opText}${bStyle.openText}`);
        latexParts.push(`${opLatex}${bStyle.openLatex}`);
      } else if (term.type === "close_paren") {
        const pair = pairsMap.get(i);
        const height = pair ? pair.height : 1;
        const bStyle = this.getBracketStyle(height);
        const pwr = term.power && term.power !== 1 ? `^{${term.power}}` : "";
        const pwrTxt = term.power && term.power !== 1 ? `^${term.power}` : "";

        textParts.push(`${bStyle.closeText}${pwrTxt}`);
        latexParts.push(`${bStyle.closeLatex}${pwr}`);
      } else {
        const factor = this.evaluateFactor(term);
        textParts.push(`${opText}${factor.symbolStr}`);
        latexParts.push(`${opLatex}${factor.latexStr}`);
      }
    }

    return {
      formulaText: textParts.join("").trim(),
      latexFormula: latexParts.join("").trim(),
      bracketAnalysis
    };
  }

  // 計算一組不含括號的扁平多項式序列 (Flat Polynomial Sub-Evaluator)
  evaluateFlatPolynomial(flatTerms) {
    if (flatTerms.length === 0) {
      return { baseValue: 0, dimension: [0, 0, 0, 0, 0], symbolStr: "0", latexStr: "0" };
    }

    const groups = [];
    let currentGroup = { sign: "+", factors: [] };

    for (let i = 0; i < flatTerms.length; i++) {
      const term = flatTerms[i];
      const op = term.operator || "+";
      const factorEval = this.evaluateFactor(term);

      if (op === "+" || op === "-") {
        if (i === 0) {
          currentGroup.sign = op;
          currentGroup.factors.push({ op: "*", factor: factorEval });
        } else {
          groups.push(currentGroup);
          currentGroup = { sign: op, factors: [{ op: "*", factor: factorEval }] };
        }
      } else {
        currentGroup.factors.push({ op, factor: factorEval });
      }
    }

    if (currentGroup.factors.length > 0) {
      groups.push(currentGroup);
    }

    // 計算各群乘除值與維度
    groups.forEach((g, idx) => {
      let gVal = 1;
      let gDim = [0, 0, 0, 0, 0];
      const symbolParts = [];
      const latexNum = [];
      const latexDen = [];

      g.factors.forEach(f => {
        if (f.op === "/") {
          gVal /= f.factor.baseValue;
          for (let d = 0; d < 5; d++) {
            gDim[d] -= f.factor.dimension[d];
          }
          symbolParts.push(`/ (${f.factor.symbolStr})`);
          latexDen.push(f.factor.latexStr);
        } else {
          gVal *= f.factor.baseValue;
          for (let d = 0; d < 5; d++) {
            gDim[d] += f.factor.dimension[d];
          }
          symbolParts.push(f.factor.symbolStr);
          latexNum.push(f.factor.latexStr);
        }
      });

      gDim = gDim.map(d => Math.round(d * 100) / 100);
      g.valueSI = gVal;
      g.dimension = gDim;
      g.groupIndex = idx + 1;
      g.matchedQuantity = this.matchDimensionToQuantity(gDim);
      g.dimensionStr = this.formatDimensionString(gDim);
      g.symbolExpression = symbolParts.join(" · ");

      if (latexDen.length > 0) {
        g.latexExpression = `\\frac{${latexNum.join(" \\cdot ") || "1"}}{${latexDen.join(" \\cdot ")}}`;
      } else {
        g.latexExpression = latexNum.join(" \\cdot ");
      }
    });

    // 因次一致性檢驗
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

    if (mismatches.length > 0) {
      const err = new Error("DIMENSION_MISMATCH");
      err.mismatches = mismatches;
      err.groups = groups;
      throw err;
    }

    // 因次相符：累加求值
    let totalSI = 0;
    const repSymbols = [];
    const repLatex = [];

    groups.forEach((g, idx) => {
      const signPrefix = idx === 0 ? (g.sign === "-" ? "- " : "") : ` ${g.sign} `;
      if (g.sign === "-") {
        totalSI -= g.valueSI;
      } else {
        totalSI += g.valueSI;
      }
      repSymbols.push(`${signPrefix}${g.symbolExpression}`);
      repLatex.push(`${signPrefix}${g.latexExpression}`);
    });

    return {
      baseValue: totalSI,
      dimension: baseDim,
      symbolStr: repSymbols.join(""),
      latexStr: repLatex.join(""),
      groups
    };
  }

  // 遞迴解析帶括號之完整多項式表達式
  compute() {
    if (this.terms.length === 0) {
      throw new Error("請先新增至少一個物理量或常數項目。");
    }

    const bracketAnalysis = this.analyzeBrackets();
    if (!bracketAnalysis.isBalanced) {
      this.lastResult = {
        hasError: true,
        errorType: "BRACKET_UNBALANCED",
        warningTitleZh: "括號未正確閉合警告",
        warningTitleEn: "Unclosed Parentheses Warning",
        mismatchDetails: bracketAnalysis.errors,
        adviceZh: "請確認每一個左括號 ( 都具備對應的右括號 )，且括號順序正確閉合。",
        adviceEn: "Please ensure all opening parentheses have corresponding closing ones.",
        groups: []
      };
      return this.formatResult(this.displaySystem);
    }

    // 依序由內而外求值括號區塊
    let workingTokens = [...this.terms];

    try {
      while (true) {
        // 尋找最內層的一對匹配括號
        let lastOpenIdx = -1;
        let matchCloseIdx = -1;

        for (let i = 0; i < workingTokens.length; i++) {
          if (workingTokens[i].type === "open_paren") {
            lastOpenIdx = i;
          } else if (workingTokens[i].type === "close_paren") {
            if (lastOpenIdx !== -1) {
              matchCloseIdx = i;
              break;
            }
          }
        }

        // 若無括號，跳出進入頂層求值
        if (lastOpenIdx === -1 || matchCloseIdx === -1) {
          break;
        }

        const openToken = workingTokens[lastOpenIdx];
        const closeToken = workingTokens[matchCloseIdx];
        const innerTerms = workingTokens.slice(lastOpenIdx + 1, matchCloseIdx);

        // 計算括號內部
        const innerEval = this.evaluateFlatPolynomial(innerTerms);
        const pwr = parseFloat(closeToken.power) || 1;
        const finalVal = Math.pow(innerEval.baseValue, pwr);
        const finalDim = innerEval.dimension.map(d => d * pwr);

        const pwrTxt = pwr !== 1 ? `^${pwr}` : "";
        const pwrLatex = pwr !== 1 ? `^{${pwr}}` : "";

        // 封裝為單一複合合成因子
        const compoundToken = {
          isPreComputed: true,
          operator: openToken.operator || "+",
          baseValue: finalVal,
          dimension: finalDim,
          power: 1,
          symbolStr: `(${innerEval.symbolStr})${pwrTxt}`,
          latexStr: `\\left( ${innerEval.latexStr} \\right)${pwrLatex}`
        };

        // 替換
        workingTokens.splice(lastOpenIdx, (matchCloseIdx - lastOpenIdx + 1), compoundToken);
      }

      // 求值頂層
      const finalEval = this.evaluateFlatPolynomial(workingTokens);
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

  // 格式化輸出
  formatResult(targetSystem = "Space") {
    if (!this.lastResult) return null;
    this.displaySystem = targetSystem;

    if (this.lastResult.hasError) {
      return this.lastResult;
    }

    const { valueSI, dimension, matchedQuantity, groups } = this.lastResult;

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

  // 格式化因次字串
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
