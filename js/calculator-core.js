/**
 * js/calculator-core.js - 運算器核心：Token 模型、游標目標、歷史堆疊 (Undo/Redo) 與括號分析
 */

class CalculatorCore {
  constructor() {
    this.tokens = [];
    this.nextTokenId = 1;
    this.cursorTarget = { scope: "root", index: 0 };
    this.lastResult = null;
    this.displaySystem = "Space";

    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 40;
  }

  getQuantityDef(quantityId) {
    return PHYSICAL_QUANTITIES.find(q => q.id === quantityId) || PHYSICAL_QUANTITIES[0];
  }

  getConstantDef(constantId) {
    return PHYSICAL_CONSTANTS[constantId] || PHYSICAL_CONSTANTS.mu0;
  }

  pushHistory() {
    const snapshot = JSON.stringify({
      tokens: this.tokens,
      nextTokenId: this.nextTokenId,
      cursorTarget: this.cursorTarget
    });
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === snapshot) {
      return;
    }
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

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

  insertToken(token, target = this.cursorTarget) {
    this.pushHistory();
    const tid = this.nextTokenId++;
    token.id = tid;

    const { list, index, parentFrac, part } = this.resolveTargetList(target);
    list.splice(index, 0, token);

    if (parentFrac) {
      this.cursorTarget = { scope: "fraction", fractionId: parentFrac.id, part, index: index + 1 };
    } else {
      this.cursorTarget = { scope: "root", index: index + 1 };
    }
    return token;
  }

  insertOperator(opValue, target = this.cursorTarget) {
    return this.insertToken({
      type: "operator",
      value: opValue || "+"
    }, target);
  }

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

  insertConstant(preset = {}, target = this.cursorTarget) {
    return this.insertToken({
      type: "constant",
      constantId: preset.constantId || "mu0",
      multiplier: preset.multiplier !== undefined ? preset.multiplier : 1,
      power: preset.power !== undefined ? preset.power : 1
    }, target);
  }

  insertOpenParen(target = this.cursorTarget) {
    return this.insertToken({
      type: "open_paren"
    }, target);
  }

  insertCloseParen(power = 1, target = this.cursorTarget) {
    return this.insertToken({
      type: "close_paren",
      power: power || 1
    }, target);
  }

  insertFraction(target = this.cursorTarget) {
    this.pushHistory();
    const fracId = this.nextTokenId++;
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

    this.cursorTarget = {
      scope: "fraction",
      fractionId: fracId,
      part: "numerator",
      index: 0
    };
    return fracToken;
  }

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

  clear() {
    this.pushHistory();
    this.tokens = [];
    this.nextTokenId = 1;
    this.cursorTarget = { scope: "root", index: 0 };
    this.lastResult = null;
  }

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

    for (let i = 0; i < pairs.length; i++) {
      for (let j = 0; j < pairs.length; j++) {
        if (i !== j) {
          if (pairs[i].openIndex < pairs[j].openIndex && pairs[i].closeIndex > pairs[j].closeIndex) {
            pairs[i].children.push(pairs[j]);
          }
        }
      }
    }

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
}
