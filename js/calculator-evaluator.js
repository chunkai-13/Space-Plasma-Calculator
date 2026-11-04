/**
 * js/calculator-evaluator.js - 運算器評估引擎：單項因子評估、扁平多項式計算、因次一致性檢驗與遞迴求解
 */

class CalculatorEvaluator {
  static evaluateFactor(token, coreInstance) {
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
      const qDef = coreInstance.getQuantityDef(token.quantityId);
      const uDef = qDef.units.find(u => u.id === token.unitId) || qDef.units[0];
      const val = parseFloat(token.numberValue) || 0;

      const singleValSI = val * uDef.toBaseSI;
      baseVal = mult * singleValSI;
      baseVal = Math.pow(baseVal, power);

      dimension = qDef.dimension.map(d => d * power);

      const multPrefix = mult !== 1 ? `${mult} ` : "";
      const multLatex = mult !== 1 ? `${mult}` : "";
      const pwrSuffix = power !== 1 ? `^${power}` : "";
      const pwrLatex = power !== 1 ? `^{${power}}` : "";

      const qSymLatex = qDef.symbolLatex || qDef.symbol;
      symbolStr = `${multPrefix}${qDef.symbol}${pwrSuffix}`;
      latexStr = `${multLatex}${qSymLatex}${pwrLatex}`;

    } else if (token.type === "constant") {
      const cDef = coreInstance.getConstantDef(token.constantId);
      const cVal = cDef.value !== undefined ? cDef.value : (cDef.valueSI || 1);
      baseVal = mult * cVal;
      baseVal = Math.pow(baseVal, power);

      dimension = cDef.dimension.map(d => d * power);

      const multPrefix = mult !== 1 ? `${mult} ` : "";
      const multLatex = mult !== 1 ? `${mult}` : "";
      const pwrSuffix = power !== 1 ? `^${power}` : "";
      const pwrLatex = power !== 1 ? `^{${power}}` : "";

      const constLatexMap = {
        mu0: "\\mu_0",
        eps0: "\\varepsilon_0",
        c: "c",
        kB: "k_B",
        e: "e",
        mp: "m_p",
        me: "m_e",
        G: "G",
        RE: "R_E",
        AU: "\\text{AU}"
      };
      const cSymLatex = cDef.symbolLatex || constLatexMap[token.constantId] || cDef.symbol;

      symbolStr = `${multPrefix}${cDef.symbol}${pwrSuffix}`;
      latexStr = `${multLatex}${cSymLatex}${pwrLatex}`;

    } else if (token.type === "fraction") {
      const numEval = CalculatorEvaluator.evaluateTokensExpression(
        token.numerator.length > 0 ? token.numerator : [{ isPreComputed: true, baseValue: 1, dimension: [0,0,0,0,0], power: 1, symbolStr: "1", latexStr: "1" }],
        coreInstance
      );
      const denEval = CalculatorEvaluator.evaluateTokensExpression(
        token.denominator.length > 0 ? token.denominator : [{ isPreComputed: true, baseValue: 1, dimension: [0,0,0,0,0], power: 1, symbolStr: "1", latexStr: "1" }],
        coreInstance
      );

      if (!isFinite(denEval.baseValue) || isNaN(denEval.baseValue) || Math.abs(denEval.baseValue) < 1e-99) {
        throw new Error("分式的分母值不可為 0。");
      }

      let ratioVal = (numEval.baseValue / denEval.baseValue) * mult;
      baseVal = Math.pow(ratioVal, power);

      dimension = [0, 0, 0, 0, 0];
      for (let d = 0; d < 5; d++) {
        dimension[d] = (numEval.dimension[d] - denEval.dimension[d]) * power;
      }
      dimension = dimension.map(d => Math.round(d * 100) / 100);

      const multLatex = mult !== 1 ? `${mult}` : "";
      const pwrLatex = power !== 1 ? `^{${power}}` : "";
      const pwrText = power !== 1 ? `^${power}` : "";

      if (power !== 1) {
        latexStr = `${multLatex}\\left( \\frac{${numEval.latexStr || "1"}}{${denEval.latexStr || "1"}} \\right)${pwrLatex}`;
        symbolStr = `(${numEval.symbolStr || "1"} / ${denEval.symbolStr || "1"})${pwrText}`;
      } else {
        latexStr = `${multLatex}\\frac{${numEval.latexStr || "1"}}{${denEval.latexStr || "1"}}`;
        symbolStr = `(${numEval.symbolStr || "1"} / ${denEval.symbolStr || "1"})`;
      }
    }

    return {
      baseValue: baseVal,
      dimension,
      power,
      symbolStr,
      latexStr
    };
  }

  static evaluateFlatPolynomial(flatTokens, coreInstance) {
    if (flatTokens.length === 0) {
      return { baseValue: 0, dimension: [0, 0, 0, 0, 0], symbolStr: "0", latexStr: "0" };
    }

    const groups = [];
    let currentSign = "+";
    let currentFactors = [];
    let pendingOp = "*";

    for (let i = 0; i < flatTokens.length; i++) {
      const t = flatTokens[i];

      if (t.type === "operator") {
        if (t.value === "+" || t.value === "-") {
          if (currentFactors.length > 0) {
            groups.push({ sign: currentSign, factors: currentFactors });
            currentFactors = [];
          }
          currentSign = t.value;
          pendingOp = "*";
        } else {
          pendingOp = t.value;
        }
      } else {
        const factorEval = CalculatorEvaluator.evaluateFactor(t, coreInstance);
        currentFactors.push({ op: pendingOp, factor: factorEval });
        pendingOp = "*";
      }
    }

    if (currentFactors.length > 0) {
      groups.push({ sign: currentSign, factors: currentFactors });
    }

    if (groups.length === 0) {
      throw new Error("運算式無有效計算項目。");
    }

    groups.forEach((g, idx) => {
      let gVal = 1;
      let gDim = [0, 0, 0, 0, 0];
      const symbolParts = [];
      const latexNum = [];
      const latexDen = [];

      g.factors.forEach(f => {
        if (f.op === "/") {
          if (!isFinite(f.factor.baseValue) || isNaN(f.factor.baseValue) || Math.abs(f.factor.baseValue) < 1e-99) {
            throw new Error("運算過程發生除以零錯誤。");
          }
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
      g.matchedQuantity = CalculatorFormatter.matchDimensionToQuantity(gDim);
      g.dimensionStr = CalculatorFormatter.formatDimensionString(gDim);
      g.symbolExpression = symbolParts.join(" · ");

      if (latexDen.length > 0) {
        g.latexExpression = `\\frac{${latexNum.join(" \\cdot ") || "1"}}{${latexDen.join(" \\cdot ")}}`;
      } else {
        g.latexExpression = latexNum.join(" \\cdot ");
      }
    });

    const baseDim = groups[0].dimension;
    const mismatches = [];

    for (let i = 1; i < groups.length; i++) {
      const g = groups[i];
      let match = true;
      for (let d = 0; d < 5; d++) {
        if (Math.abs(g.dimension[d] - baseDim[d]) > 0.01) {
          match = false;
          break;
        }
      }
      if (!match) {
        mismatches.push({
          groupIndex: g.groupIndex,
          currentExpression: g.symbolExpression,
          currentDimStr: g.dimensionStr,
          currentTermQty: g.matchedQuantity,
          firstTermDimStr: groups[0].dimensionStr,
          firstTermQty: groups[0].matchedQuantity
        });
      }
    }

    if (mismatches.length > 0) {
      const mismatchErr = new Error("DIMENSION_MISMATCH");
      mismatchErr.mismatches = mismatches;
      mismatchErr.groups = groups;
      throw mismatchErr;
    }

    let totalSI = 0;
    const repSymbols = [];
    const repLatex = [];

    groups.forEach((g, idx) => {
      const signPrefix = (idx > 0 || g.sign === "-") ? ` ${g.sign} ` : "";
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

  static evaluateTokensExpression(tokens, coreInstance) {
    if (tokens.length === 0) {
      return { baseValue: 0, dimension: [0, 0, 0, 0, 0], symbolStr: "0", latexStr: "0", groups: [] };
    }

    const bracketAnalysis = coreInstance.analyzeBrackets(tokens);
    if (!bracketAnalysis.isBalanced) {
      throw new Error(`括號未閉合：${bracketAnalysis.errors.join("; ")}`);
    }

    let workingTokens = [...tokens];

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

      const innerEval = CalculatorEvaluator.evaluateTokensExpression(innerTerms, coreInstance);
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

    return CalculatorEvaluator.evaluateFlatPolynomial(workingTokens, coreInstance);
  }
}
