/**
 * calculator.js - 獨立運算符、游標插入、多層括號排版與因次檢驗引擎
 */

class PlasmaCustomCalculator {
  constructor() {
    this.tokens = [];
    this.nextTokenId = 1;
    this.cursorIndex = 0; // 當前游標插入點位置 (0 ~ tokens.length)
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

  // 設定游標位置
  setCursor(index) {
    this.cursorIndex = Math.max(0, Math.min(this.tokens.length, index));
  }

  // 在指定位置 (預設為 cursorIndex) 插入 Token
  insertToken(token, index = this.cursorIndex) {
    const tid = this.nextTokenId++;
    token.id = tid;

    const at = Math.max(0, Math.min(this.tokens.length, index));
    this.tokens.splice(at, 0, token);
    this.cursorIndex = at + 1; // 游標自動後移
    return token;
  }

  // 插入獨立運算符 (+, -, *, /)
  insertOperator(opValue, index = this.cursorIndex) {
    return this.insertToken({
      type: "operator",
      value: opValue || "+"
    }, index);
  }

  // 插入物理量
  insertQuantity(preset = {}, index = this.cursorIndex) {
    const defaultQty = PHYSICAL_QUANTITIES[0];
    return this.insertToken({
      type: "quantity",
      quantityId: preset.quantityId || defaultQty.id,
      unitId: preset.unitId || defaultQty.units[1].id,
      numberValue: preset.numberValue !== undefined ? preset.numberValue : 10,
      multiplier: preset.multiplier !== undefined ? preset.multiplier : 1,
      power: preset.power !== undefined ? preset.power : 1
    }, index);
  }

  // 插入物理常數
  insertConstant(preset = {}, index = this.cursorIndex) {
    return this.insertToken({
      type: "constant",
      constantId: preset.constantId || "mu0",
      multiplier: preset.multiplier !== undefined ? preset.multiplier : 1,
      power: preset.power !== undefined ? preset.power : 1
    }, index);
  }

  // 插入左括號
  insertOpenParen(index = this.cursorIndex) {
    return this.insertToken({
      type: "open_paren"
    }, index);
  }

  // 插入右括號
  insertCloseParen(power = 1, index = this.cursorIndex) {
    return this.insertToken({
      type: "close_paren",
      power: power || 1
    }, index);
  }

  // 移除指定位置的 Token
  removeTokenAt(index) {
    if (index >= 0 && index < this.tokens.length) {
      this.tokens.splice(index, 1);
      if (this.cursorIndex > index) {
        this.cursorIndex = Math.max(0, this.cursorIndex - 1);
      } else if (this.cursorIndex > this.tokens.length) {
        this.cursorIndex = this.tokens.length;
      }
    }
  }

  // 移除指定 ID 的 Token
  removeTokenById(id) {
    const idx = this.tokens.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.removeTokenAt(idx);
    }
  }

  // 移動 Token 位置
  moveToken(fromIndex, toIndex) {
    if (fromIndex >= 0 && fromIndex < this.tokens.length && toIndex >= 0 && toIndex < this.tokens.length) {
      const item = this.tokens.splice(fromIndex, 1)[0];
      this.tokens.splice(toIndex, 0, item);
      this.cursorIndex = toIndex;
    }
  }

  // 清空
  clear() {
    this.tokens = [];
    this.nextTokenId = 1;
    this.cursorIndex = 0;
    this.lastResult = null;
  }

  // 分析括號配對與層級深度 (Height-based Bracket Typing)
  // 規則: 內層 height=1 -> ( ), 外包層 height=2 -> [ ], 更外包層 height=3 -> { }
  analyzeBrackets() {
    const stack = [];
    const pairs = [];
    const errors = [];

    for (let i = 0; i < this.tokens.length; i++) {
      const t = this.tokens[i];
      if (t.type === "open_paren") {
        stack.push(i);
      } else if (t.type === "close_paren") {
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

    // 建立巢狀包含關係
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

  // 取得對應層級高度的括號符號 (LaTeX 與純文字)
  getBracketStyle(height) {
    const cycle = (height - 1) % 3;
    if (cycle === 1) {
      return {
        openLatex: "\\left[ ",
        closeLatex: " \\right]",
        openText: "[",
        closeText: "]"
      };
    } else if (cycle === 2) {
      return {
        openLatex: "\\left\\{ ",
        closeLatex: " \\right\\}",
        openText: "{",
        closeText: "}"
      };
    } else {
      return {
        openLatex: "\\left( ",
        closeLatex: " \\right)",
        openText: "(",
        closeText: ")"
      };
    }
  }

  // 評估單一運算因子的數值與因次
  evaluateFactor(token) {
    if (token.isPreComputed) {
      return {
        baseValue: token.baseValue,
        dimension: token.dimension,
        power: token.power || 1,
        symbolStr: token.symbolStr,
        latexStr: token.latexStr
      };
    }

    let baseVal = 0;
    let dimension = [0, 0, 0, 0, 0];
    let symbolStr = "";
    let latexStr = "";

    const mult = parseFloat(token.multiplier) || 1;
    const power = parseFloat(token.power) || 1;

    if (token.type === "quantity") {
      const qDef = this.getQuantityDef(token.quantityId);
      const unitDef = qDef.units.find(u => u.id === token.unitId) || qDef.units[0];
      const val = parseFloat(token.numberValue) || 0;
      const siValue = mult * (val * unitDef.toBaseSI);

      baseVal = Math.pow(siValue, power);
      dimension = qDef.dimension.map(d => d * power);

      const multPrefix = mult !== 1 ? `${mult} · ` : "";
      const pwrSuffix = power !== 1 ? `^${power}` : "";
      symbolStr = `${multPrefix}${qDef.symbol}${pwrSuffix}`;

      const multLatex = mult !== 1 ? `${mult} ` : "";
      const pwrLatex = power !== 1 ? `^{${power}}` : "";
      latexStr = `${multLatex}${qDef.symbol}${pwrLatex}`;
    } else if (token.type === "constant") {
      const cDef = this.getConstantDef(token.constantId);
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
      const val = parseFloat(token.numberValue) || 1;
      const siValue = mult * val;
      baseVal = Math.pow(siValue, power);
      dimension = [0, 0, 0, 0, 0];
      symbolStr = `${siValue}${power !== 1 ? `^${power}` : ""}`;
      latexStr = power !== 1 ? `${siValue}^{${power}}` : `${siValue}`;
    }

    return { baseValue: baseVal, dimension, power, symbolStr, latexStr };
  }

  // 產生可視化方程式表現（含插入光標資訊與各 Token 對照）
  generateEquationRepresentation() {
    if (this.tokens.length === 0) {
      return {
        formulaText: "（點擊下方按鈕或此處開始建構方程式）",
        latexFormula: "",
        displayElements: [],
        bracketAnalysis: { isBalanced: true, errors: [] }
      };
    }

    const bracketAnalysis = this.analyzeBrackets();
    const pairsMap = new Map();
    bracketAnalysis.pairs.forEach(p => {
      pairsMap.set(p.openIndex, p);
      pairsMap.set(p.closeIndex, p);
    });

    const displayElements = [];
    const latexParts = [];
    const textParts = [];

    for (let i = 0; i < this.tokens.length; i++) {
      const t = this.tokens[i];
      let elemLabel = "";
      let elemLatex = "";

      if (t.type === "operator") {
        const opSym = t.value === "*" ? "×" : t.value === "/" ? "÷" : t.value;
        const opLatex = t.value === "*" ? "\\times" : t.value === "/" ? "\\div" : t.value;
        elemLabel = opSym;
        elemLatex = ` ${opLatex} `;
      } else if (t.type === "open_paren") {
        const pair = pairsMap.get(i);
        const height = pair ? pair.height : 1;
        const bStyle = this.getBracketStyle(height);
        elemLabel = bStyle.openText;
        elemLatex = bStyle.openLatex;
      } else if (t.type === "close_paren") {
        const pair = pairsMap.get(i);
        const height = pair ? pair.height : 1;
        const bStyle = this.getBracketStyle(height);
        const pwr = t.power && t.power !== 1 ? `^{${t.power}}` : "";
        const pwrTxt = t.power && t.power !== 1 ? `^${t.power}` : "";
        elemLabel = `${bStyle.closeText}${pwrTxt}`;
        elemLatex = `${bStyle.closeLatex}${pwr}`;
      } else {
        const f = this.evaluateFactor(t);
        elemLabel = f.symbolStr;
        elemLatex = f.latexStr;
      }

      displayElements.push({
        index: i,
        token: t,
        label: elemLabel,
        latex: elemLatex
      });

      latexParts.push(elemLatex);
      textParts.push(elemLabel);
    }

    return {
      formulaText: textParts.join(" "),
      latexFormula: latexParts.join(""),
      displayElements,
      bracketAnalysis,
      cursorIndex: this.cursorIndex
    };
  }

  // 計算扁平無括號的多項式子表達式
  evaluateFlatPolynomial(flatTokens) {
    if (flatTokens.length === 0) {
      return { baseValue: 0, dimension: [0, 0, 0, 0, 0], symbolStr: "0", latexStr: "0" };
    }

    const groups = [];
    let currentSign = "+";
    let currentFactors = [];

    let pendingOp = "*"; // 預設乘法連接

    for (let i = 0; i < flatTokens.length; i++) {
      const t = flatTokens[i];

      if (t.type === "operator") {
        if (t.value === "+" || t.value === "-") {
          // 遇到加減號：結束上一群乘除組合
          if (currentFactors.length > 0) {
            groups.push({ sign: currentSign, factors: currentFactors });
            currentFactors = [];
          }
          currentSign = t.value;
          pendingOp = "*";
        } else {
          // 乘除號
          pendingOp = t.value;
        }
      } else {
        // 運算因子 (quantity, constant, precomputed)
        const factorEval = this.evaluateFactor(t);
        currentFactors.push({ op: pendingOp, factor: factorEval });
        pendingOp = "*"; // 預設復位
      }
    }

    if (currentFactors.length > 0) {
      groups.push({ sign: currentSign, factors: currentFactors });
    }

    if (groups.length === 0) {
      throw new Error("運算式無有效計算項目。");
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

    // 單位因次一致性檢驗
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

    // 因次一致：代數累加
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

  // 遞迴多項式計算
  compute() {
    if (this.tokens.length === 0) {
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

    let workingTokens = [...this.tokens];

    try {
      while (true) {
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

        if (lastOpenIdx === -1 || matchCloseIdx === -1) {
          break;
        }

        const closeToken = workingTokens[matchCloseIdx];
        const innerTerms = workingTokens.slice(lastOpenIdx + 1, matchCloseIdx);

        const innerEval = this.evaluateFlatPolynomial(innerTerms);
        const pwr = parseFloat(closeToken.power) || 1;
        const finalVal = Math.pow(innerEval.baseValue, pwr);
        const finalDim = innerEval.dimension.map(d => d * pwr);

        const pwrTxt = pwr !== 1 ? `^${pwr}` : "";
        const pwrLatex = pwr !== 1 ? `^{${pwr}}` : "";

        const compoundToken = {
          isPreComputed: true,
          baseValue: finalVal,
          dimension: finalDim,
          power: 1,
          symbolStr: `(${innerEval.symbolStr})${pwrTxt}`,
          latexStr: `\\left( ${innerEval.latexStr} \\right)${pwrLatex}`
        };

        workingTokens.splice(lastOpenIdx, (matchCloseIdx - lastOpenIdx + 1), compoundToken);
      }

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
