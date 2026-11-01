/**
 * calculator.js - 獨立運算符、游標插入、分式 (分子/分母槽位)、多層括號排版、歷史復原 (Undo/Redo) 與因次檢驗引擎
 */

class PlasmaCustomCalculator {
  constructor() {
    this.tokens = [];
    this.nextTokenId = 1;
    // 游標定位目標: { scope: 'root', index: 0 } 或 { scope: 'fraction', fractionId: id, part: 'numerator'|'denominator', index: 0 }
    this.cursorTarget = { scope: "root", index: 0 };
    this.lastResult = null;
    this.displaySystem = "Space"; // 預設太空常用制

    // 歷史復原與重做堆疊 (Undo / Redo)
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 40;
  }

  // 取得物理量定義
  getQuantityDef(quantityId) {
    return PHYSICAL_QUANTITIES.find(q => q.id === quantityId) || PHYSICAL_QUANTITIES[0];
  }

  // 取得常數定義
  getConstantDef(constantId) {
    return PHYSICAL_CONSTANTS[constantId] || PHYSICAL_CONSTANTS.mu0;
  }

  // 儲存當前狀態至歷史堆疊 (呼叫於任何異動前)
  pushHistory() {
    const snapshot = JSON.stringify({
      tokens: this.tokens,
      nextTokenId: this.nextTokenId,
      cursorTarget: this.cursorTarget
    });
    // 避免重複推入相同狀態
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === snapshot) {
      return;
    }
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // 每次新異動皆清除重做堆疊
  }

  // 上一步 (Undo)
  undo() {
    if (!this.canUndo()) return false;
    const currentSnapshot = JSON.stringify({
      tokens: this.tokens,
      nextTokenId: this.nextTokenId,
      cursorTarget: this.cursorTarget
    });
    this.redoStack.push(currentSnapshot);

    const prevState = JSON.parse(this.undoStack.pop());
    this.tokens = prevState.tokens || [];
    this.nextTokenId = prevState.nextTokenId || (this.tokens.length + 1);
    this.cursorTarget = prevState.cursorTarget || { scope: "root", index: 0 };
    return true;
  }

  // 下一步 (Redo)
  redo() {
    if (!this.canRedo()) return false;
    const currentSnapshot = JSON.stringify({
      tokens: this.tokens,
      nextTokenId: this.nextTokenId,
      cursorTarget: this.cursorTarget
    });
    this.undoStack.push(currentSnapshot);

    const nextState = JSON.parse(this.redoStack.pop());
    this.tokens = nextState.tokens || [];
    this.nextTokenId = nextState.nextTokenId || (this.tokens.length + 1);
    this.cursorTarget = nextState.cursorTarget || { scope: "root", index: 0 };
    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  // 設定游標目標
  setCursorTarget(target) {
    if (!target) {
      this.cursorTarget = { scope: "root", index: this.tokens.length };
      return;
    }
    if (target.scope === "fraction") {
      const frac = this.findTokenById(target.fractionId, this.tokens);
      if (frac && frac.type === "fraction") {
        const list = target.part === "denominator" ? frac.denominator : frac.numerator;
        const validIdx = Math.max(0, Math.min(list.length, target.index || 0));
        this.cursorTarget = { scope: "fraction", fractionId: target.fractionId, part: target.part, index: validIdx };
        return;
      }
    }
    const validIdx = Math.max(0, Math.min(this.tokens.length, target.index || 0));
    this.cursorTarget = { scope: "root", index: validIdx };
  }

  // 依 ID 遞迴尋找 Token
  findTokenById(id, list = this.tokens) {
    for (const t of list) {
      if (t.id === id) return t;
      if (t.type === "fraction") {
        const inNum = this.findTokenById(id, t.numerator);
        if (inNum) return inNum;
        const inDen = this.findTokenById(id, t.denominator);
        if (inDen) return inDen;
      }
    }
    return null;
  }

  // 取得目標列表參照與有效索引
  resolveTargetList(target = this.cursorTarget) {
    if (target && target.scope === "fraction") {
      const frac = this.findTokenById(target.fractionId, this.tokens);
      if (frac && frac.type === "fraction") {
        const list = target.part === "denominator" ? frac.denominator : frac.numerator;
        const index = Math.max(0, Math.min(list.length, target.index !== undefined ? target.index : list.length));
        return { list, index, parentFrac: frac, part: target.part };
      }
    }
    const index = Math.max(0, Math.min(this.tokens.length, target && target.index !== undefined ? target.index : this.tokens.length));
    return { list: this.tokens, index, parentFrac: null, part: null };
  }

  // 在當前游標處插入 Token
  insertToken(token, target = this.cursorTarget) {
    this.pushHistory();
    const tid = this.nextTokenId++;
    token.id = tid;

    const { list, index, parentFrac, part } = this.resolveTargetList(target);
    list.splice(index, 0, token);

    // 游標自動後移
    if (parentFrac) {
      this.cursorTarget = { scope: "fraction", fractionId: parentFrac.id, part, index: index + 1 };
    } else {
      this.cursorTarget = { scope: "root", index: index + 1 };
    }
    return token;
  }

  // 插入獨立運算符 (+, -, *, /)
  insertOperator(opValue, target = this.cursorTarget) {
    return this.insertToken({
      type: "operator",
      value: opValue || "+"
    }, target);
  }

  // 插入物理量
  insertQuantity(preset = {}, target = this.cursorTarget) {
    const defaultQty = PHYSICAL_QUANTITIES[0];
    return this.insertToken({
      type: "quantity",
      quantityId: preset.quantityId || defaultQty.id,
      unitId: preset.unitId || defaultQty.units[1].id,
      numberValue: preset.numberValue !== undefined ? preset.numberValue : 10,
      multiplier: preset.multiplier !== undefined ? preset.multiplier : 1,
      power: preset.power !== undefined ? preset.power : 1
    }, target);
  }

  // 插入物理常數
  insertConstant(preset = {}, target = this.cursorTarget) {
    return this.insertToken({
      type: "constant",
      constantId: preset.constantId || "mu0",
      multiplier: preset.multiplier !== undefined ? preset.multiplier : 1,
      power: preset.power !== undefined ? preset.power : 1
    }, target);
  }

  // 插入左括號
  insertOpenParen(target = this.cursorTarget) {
    return this.insertToken({
      type: "open_paren"
    }, target);
  }

  // 插入右括號
  insertCloseParen(power = 1, target = this.cursorTarget) {
    return this.insertToken({
      type: "close_paren",
      power: power || 1
    }, target);
  }

  // 插入分式結構 (分子與分母空格)
  insertFraction(target = this.cursorTarget) {
    this.pushHistory();
    const fracId = this.nextTokenId++;
    const defaultQty = PHYSICAL_QUANTITIES[0];

    // 分式結構預設分子為空，分母為空，等待使用者填入
    const fracToken = {
      id: fracId,
      type: "fraction",
      numerator: [],
      denominator: [],
      multiplier: 1,
      power: 1
    };

    const { list, index } = this.resolveTargetList(target);
    list.splice(index, 0, fracToken);

    // 游標預設跳入該分式的「分子」第 0 格
    this.cursorTarget = {
      scope: "fraction",
      fractionId: fracId,
      part: "numerator",
      index: 0
    };
    return fracToken;
  }

  // 移除指定位置的 Token
  removeTokenAt(index, target = this.cursorTarget) {
    this.pushHistory();
    const { list, parentFrac, part } = this.resolveTargetList(target);
    if (index >= 0 && index < list.length) {
      list.splice(index, 1);
      const newIdx = Math.max(0, Math.min(list.length, index));
      if (parentFrac) {
        this.cursorTarget = { scope: "fraction", fractionId: parentFrac.id, part, index: newIdx };
      } else {
        this.cursorTarget = { scope: "root", index: newIdx };
      }
    }
  }

  // 依 ID 遞迴刪除 Token
  removeTokenById(id, list = this.tokens) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        this.pushHistory();
        list.splice(i, 1);
        this.setCursorTarget({ scope: "root", index: Math.min(this.tokens.length, i) });
        return true;
      }
      if (list[i].type === "fraction") {
        if (this.removeTokenById(id, list[i].numerator)) return true;
        if (this.removeTokenById(id, list[i].denominator)) return true;
      }
    }
    return false;
  }

  // 移動 Token 位置
  moveToken(fromIndex, toIndex, target = this.cursorTarget) {
    this.pushHistory();
    const { list, parentFrac, part } = this.resolveTargetList(target);
    if (fromIndex >= 0 && fromIndex < list.length && toIndex >= 0 && toIndex < list.length) {
      const item = list.splice(fromIndex, 1)[0];
      list.splice(toIndex, 0, item);
      if (parentFrac) {
        this.cursorTarget = { scope: "fraction", fractionId: parentFrac.id, part, index: toIndex };
      } else {
        this.cursorTarget = { scope: "root", index: toIndex };
      }
    }
  }

  // 清空全部
  clear() {
    this.pushHistory();
    this.tokens = [];
    this.nextTokenId = 1;
    this.cursorTarget = { scope: "root", index: 0 };
    this.lastResult = null;
  }

  // 分析括號配對與層級深度 (Height-based Bracket Typing)
  // 規則: 內層 height=1 -> ( ), 外包層 height=2 -> [ ], 更外包層 height=3 -> { }
  analyzeBrackets(tokens = this.tokens) {
    const stack = [];
    const pairs = [];
    const errors = [];

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
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
          errors.push(`位置 #${i + 1} 存在多餘的未匹配閉括號。`);
        }
      }
    }

    if (stack.length > 0) {
      errors.push(`尚有 ${stack.length} 個開括號未閉合。`);
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

    return { pairs, errors, isBalanced: errors.length === 0, openStack: stack };
  }

  // 取得對應層級高度的括號符號 (LaTeX 與純文字)
  getBracketStyle(height) {
    const cycle = (height - 1) % 3;
    if (cycle === 1) {
      return {
        nameZh: "中括號 [ ]",
        height,
        openLatex: "\\left[ ",
        closeLatex: " \\right]",
        chipOpenLatex: "[",
        chipCloseLatex: "]",
        openText: "[",
        closeText: "]"
      };
    } else if (cycle === 2) {
      return {
        nameZh: "大括號 { }",
        height,
        openLatex: "\\left\\{ ",
        closeLatex: " \\right\\}",
        chipOpenLatex: "\\{",
        chipCloseLatex: "\\}",
        openText: "{",
        closeText: "}"
      };
    } else {
      return {
        nameZh: "小括號 ( )",
        height,
        openLatex: "\\left( ",
        closeLatex: " \\right)",
        chipOpenLatex: "(",
        chipCloseLatex: ")",
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
      const uDef = qDef.units.find(u => u.id === token.unitId) || qDef.units[0];
      const val = parseFloat(token.numberValue) || 0;

      const singleValSI = val * uDef.toBaseSI;
      baseVal = (mult * singleValSI);
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
      const cDef = this.getConstantDef(token.constantId);
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
      // 評估分式結構
      const numEval = this.evaluateTokensExpression(token.numerator.length > 0 ? token.numerator : [
        { isPreComputed: true, baseValue: 1, dimension: [0,0,0,0,0], power: 1, symbolStr: "1", latexStr: "1" }
      ]);
      const denEval = this.evaluateTokensExpression(token.denominator.length > 0 ? token.denominator : [
        { isPreComputed: true, baseValue: 1, dimension: [0,0,0,0,0], power: 1, symbolStr: "1", latexStr: "1" }
      ]);

      if (Math.abs(denEval.baseValue) < 1e-30) {
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

  // 產生可視化方程式表現（包含各 Token Chip、Slot 資訊與分式結構）
  generateEquationRepresentation(tokens = this.tokens, scope = "root", parentId = null) {
    if (tokens.length === 0) {
      return {
        formulaText: "（算式為空）",
        latexFormula: "",
        displayElements: [],
        bracketAnalysis: { isBalanced: true, errors: [] }
      };
    }

    const bracketAnalysis = this.analyzeBrackets(tokens);
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
        const opSym = t.value === "*" ? "×" : t.value === "/" ? "÷" : t.value;
        const opLatex = t.value === "*" ? "\\times" : t.value === "/" ? "\\div" : t.value;
        elemLabel = opSym;
        elemLatex = ` ${opLatex} `;
        chipLatex = opLatex;

        displayElements.push({
          index: i,
          token: t,
          label: elemLabel,
          latex: chipLatex,
          type: "operator"
        });

      } else if (t.type === "open_paren") {
        const pair = pairsMap.get(i);
        const height = pair ? pair.height : (bracketAnalysis.openStack.includes(i) ? 1 : 1);
        const bStyle = this.getBracketStyle(height);
        elemLabel = bStyle.openText;
        elemLatex = bStyle.openLatex;
        chipLatex = bStyle.chipOpenLatex; // 單獨晶片使用合法無配對語法，防止 KaTeX \left( 拋錯

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
        const bStyle = this.getBracketStyle(height);
        const pwr = t.power && t.power !== 1 ? `^{${t.power}}` : "";
        const pwrTxt = t.power && t.power !== 1 ? `^${t.power}` : "";
        elemLabel = `${bStyle.closeText}${pwrTxt}`;
        elemLatex = `${bStyle.closeLatex}${pwr}`;
        chipLatex = `${bStyle.chipCloseLatex}${pwr}`; // 單獨晶片使用合法語法

        displayElements.push({
          index: i,
          token: t,
          label: elemLabel,
          latex: chipLatex,
          bracketInfo: bStyle,
          type: "close_paren"
        });

      } else if (t.type === "fraction") {
        // 分式結構：遞迴產生分子與分母的表現
        const numRep = this.generateEquationRepresentation(t.numerator, "fraction", t.id);
        const denRep = this.generateEquationRepresentation(t.denominator, "fraction", t.id);

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
        const f = this.evaluateFactor(t);
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
      cursorTarget: this.cursorTarget
    };
  }

  // 計算扁平無括號多項式
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
        const factorEval = this.evaluateFactor(t);
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

    // 計算各乘除群組
    groups.forEach((g, idx) => {
      let gVal = 1;
      let gDim = [0, 0, 0, 0, 0];
      const symbolParts = [];
      const latexNum = [];
      const latexDen = [];

      g.factors.forEach(f => {
        if (f.op === "/") {
          if (Math.abs(f.factor.baseValue) < 1e-30) {
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

  // 遞迴多項式表達式計算 (處理括號配對與分式)
  evaluateTokensExpression(tokens) {
    if (tokens.length === 0) {
      return { baseValue: 0, dimension: [0, 0, 0, 0, 0], symbolStr: "0", latexStr: "0", groups: [] };
    }

    const bracketAnalysis = this.analyzeBrackets(tokens);
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

      const innerEval = this.evaluateTokensExpression(innerTerms);
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

    return this.evaluateFlatPolynomial(workingTokens);
  }

  // 總計算入口
  compute() {
    if (this.tokens.length === 0) {
      throw new Error("請先新增至少一個物理量、常數或分式項目。");
    }

    const bracketAnalysis = this.analyzeBrackets();
    if (!bracketAnalysis.isBalanced) {
      this.lastResult = {
        hasError: true,
        errorType: "BRACKET_UNBALANCED",
        warningTitleZh: "括號未正確閉合警告",
        warningTitleEn: "Unclosed Parentheses Warning",
        mismatchDetails: bracketAnalysis.errors,
        adviceZh: "請確認每一個開括號 (、[、{ 都具備對應的閉括號，系統已依巢狀深度自動變換小中大括號。",
        adviceEn: "Please ensure all opening parentheses have corresponding closing ones.",
        groups: []
      };
      return this.formatResult(this.displaySystem);
    }

    try {
      const finalEval = this.evaluateTokensExpression(this.tokens);
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
