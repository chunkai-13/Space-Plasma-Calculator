/**
 * js/calculator-formatter.js - 運算器格式化引擎：KaTeX 公式表現生成、因次字串與各制度輸出結果格式化
 */

class CalculatorFormatter {
  static generateEquationRepresentation(tokens, coreInstance, scope = "root", parentId = null) {
    if (!tokens || tokens.length === 0) {
      return {
        formulaText: "（算式為空）",
        latexFormula: "",
        displayElements: [],
        bracketAnalysis: { isBalanced: true, errors: [] }
      };
    }

    const bracketAnalysis = coreInstance.analyzeBrackets(tokens);
    const pairsMap = new Map();
    bracketAnalysis.pairs.forEach(p => {
      pairsMap.set(p.openIndex, p);
      pairsMap.set(p.closeIndex, p);
    });

    const displayElements = [];
    const latexParts = [];
    const textParts = [];

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      let elemLabel = "";
      let elemLatex = "";
      let chipLatex = "";

      if (t.type === "operator") {
        const opSym = t.value === "*" ? "·" : t.value === "/" ? "/" : t.value;
        const opLatex = t.value === "*" ? "\\cdot" : t.value === "/" ? "/" : t.value;
        elemLabel = opSym;
        elemLatex = ` ${opLatex} `;
        chipLatex = opLatex;

        displayElements.push({
          index: i,
          token: t,
          label: elemLabel,
          latex: chipLatex,
          type: "operator",
          opValue: t.value
        });

      } else if (t.type === "open_paren") {
        const pair = pairsMap.get(i);
        const height = pair ? pair.height : (bracketAnalysis.openStack && bracketAnalysis.openStack.includes(i) ? 1 : 1);
        const bStyle = coreInstance.getBracketStyle(height);
        elemLabel = bStyle.openText;
        elemLatex = bStyle.openLatex;
        chipLatex = bStyle.chipOpenLatex;

        displayElements.push({
          index: i,
          token: t,
          label: elemLabel,
          latex: chipLatex,
          bracketInfo: bStyle,
          type: "open_paren"
        });

      } else if (t.type === "close_paren") {
        const pair = pairsMap.get(i);
        const height = pair ? pair.height : 1;
        const bStyle = coreInstance.getBracketStyle(height);
        const pwr = t.power && t.power !== 1 ? `^{${t.power}}` : "";
        const pwrTxt = t.power && t.power !== 1 ? `^${t.power}` : "";
        elemLabel = `${bStyle.closeText}${pwrTxt}`;
        elemLatex = `${bStyle.closeLatex}${pwr}`;
        chipLatex = `${bStyle.chipCloseLatex}${pwr}`;

        displayElements.push({
          index: i,
          token: t,
          label: elemLabel,
          latex: chipLatex,
          bracketInfo: bStyle,
          type: "close_paren"
        });

      } else if (t.type === "fraction") {
        const numRep = CalculatorFormatter.generateEquationRepresentation(t.numerator, coreInstance, "fraction", t.id);
        const denRep = CalculatorFormatter.generateEquationRepresentation(t.denominator, coreInstance, "fraction", t.id);

        const pwr = t.power && t.power !== 1 ? `^{${t.power}}` : "";
        const pwrTxt = t.power && t.power !== 1 ? `^${t.power}` : "";

        elemLatex = `\\frac{${numRep.latexFormula || "1"}}{${denRep.latexFormula || "1"}}${pwr}`;
        elemLabel = `(${numRep.formulaText || "1"} / ${denRep.formulaText || "1"})${pwrTxt}`;

        displayElements.push({
          index: i,
          token: t,
          label: elemLabel,
          latex: elemLatex,
          type: "fraction",
          numeratorRep: numRep,
          denominatorRep: denRep
        });

      } else {
        const f = CalculatorEvaluator.evaluateFactor(t, coreInstance);
        elemLabel = f.symbolStr;
        elemLatex = f.latexStr;
        chipLatex = f.latexStr;

        displayElements.push({
          index: i,
          token: t,
          label: elemLabel,
          latex: chipLatex,
          type: t.type
        });
      }

      latexParts.push(elemLatex);
      textParts.push(elemLabel);
    }

    return {
      formulaText: textParts.join(" "),
      latexFormula: latexParts.join(""),
      displayElements,
      bracketAnalysis,
      cursorTarget: coreInstance.cursorTarget
    };
  }

  static matchDimensionToQuantity(dim) {
    if (!PHYSICAL_QUANTITIES) return null;
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

  static formatResult(lastResult, targetSystem = "Space") {
    if (!lastResult) return null;

    if (lastResult.hasError) {
      return lastResult;
    }

    const { valueSI, dimension, matchedQuantity, groups } = lastResult;

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
        dimensionStr: CalculatorFormatter.formatDimensionString(dimension),
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

    const baseUnitStr = CalculatorFormatter.formatBaseUnitString(dimension);
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
      dimensionStr: CalculatorFormatter.formatDimensionString(dimension),
      allUnits: [],
      groups
    };
  }

  static formatDimensionString(dim) {
    const symbols = ["M", "L", "T", "I", "Θ"];
    const parts = [];
    for (let i = 0; i < 5; i++) {
      if (Math.abs(dim[i]) > 0.01) {
        parts.push(dim[i] === 1 ? symbols[i] : `${symbols[i]}^${dim[i]}`);
      }
    }
    return parts.length > 0 ? `[${parts.join(" · ")}]` : "[無因次]";
  }

  static formatBaseUnitString(dim) {
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
