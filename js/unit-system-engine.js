/**
 * js/unit-system-engine.js - 單位制度與物理常數深模組 (Unit System Engine)
 * 封裝跨制度 (SI, CGS, Space Physics) 單位轉換、數值正規化、搜尋過濾與常數多制度解析
 */

class UnitSystemEngine {
  /**
   * 次方符號正規化字典，支援上標數字與標準數字互通
   * @private
   */
  static _supMap = {
    "⁻": "-", "⁺": "+", "⁰": "0", "¹": "1", "²": "2",
    "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9"
  };

  /**
   * 多制度物理常數延伸字典 (涵蓋 SI、CGS 與 Space 太空物理常用制度)
   * @private
   */
  static _multiSystemConstants = {
    c: {
      SI: { value: 299792458, unit: "m/s" },
      CGS: { value: 2.99792458e10, unit: "cm/s" },
      Space: { value: 299792.458, unit: "km/s" }
    },
    e: {
      SI: { value: 1.602176634e-19, unit: "C" },
      CGS: { value: 4.80320425e-10, unit: "statC (esu)" },
      Space: { value: 1, unit: "e" }
    },
    kB: {
      SI: { value: 1.380649e-23, unit: "J/K" },
      CGS: { value: 1.380649e-16, unit: "erg/K" },
      Space: { value: 8.617333262e-5, unit: "eV/K" }
    },
    mp: {
      SI: { value: 1.67262192369e-27, unit: "kg" },
      CGS: { value: 1.67262192369e-24, unit: "g" },
      Space: { value: 938.272088, unit: "MeV/c²" }
    },
    me: {
      SI: { value: 9.1093837015e-31, unit: "kg" },
      CGS: { value: 9.1093837015e-28, unit: "g" },
      Space: { value: 0.51099895, unit: "MeV/c²" }
    },
    mu0: {
      SI: { value: 1.25663706212e-6, unit: "H/m (N/A²)" },
      CGS: { value: 1, unit: "無因次 (emu)" },
      Space: { value: 1.25663706212e-6, unit: "H/m" }
    },
    eps0: {
      SI: { value: 8.8541878128e-12, unit: "F/m" },
      CGS: { value: 1, unit: "無因次 (esu)" },
      Space: { value: 8.8541878128e-12, unit: "F/m" }
    },
    G: {
      SI: { value: 6.6743e-11, unit: "m³/(kg·s²)" },
      CGS: { value: 6.6743e-8, unit: "cm³/(g·s²)" },
      Space: { value: 6.6743e-11, unit: "m³/(kg·s²)" }
    },
    RE: {
      SI: { value: 6.371e6, unit: "m" },
      CGS: { value: 6.371e8, unit: "cm" },
      Space: { value: 6371, unit: "km" }
    },
    AU: {
      SI: { value: 1.495978707e11, unit: "m" },
      CGS: { value: 1.495978707e13, unit: "cm" },
      Space: { value: 1.495978707e8, unit: "km" }
    }
  };

  /**
   * 取得所有物理量分類
   * @returns {Array<Object>} 分類陣列
   */
  static getCategories() {
    return typeof QUANTITY_CATEGORIES !== "undefined" ? QUANTITY_CATEGORIES : [];
  }

  /**
   * 依據 ID 取得單一物理量規格定義
   * @param {string} quantityId - 物理量識別碼 (如 'magnetic_field')
   * @returns {Object|null} 物理量物件
   */
  static getQuantity(quantityId) {
    if (typeof PHYSICAL_QUANTITIES === "undefined") return null;
    return PHYSICAL_QUANTITIES.find(q => q.id === quantityId) || null;
  }

  /**
   * 取得物理量清單 (支援依分類篩選)
   * @param {string} [categoryId='all'] - 分類 ID，'all' 表示全數回傳
   * @returns {Array<Object>} 物理量清單
   */
  static getAllQuantities(categoryId = "all") {
    if (typeof PHYSICAL_QUANTITIES === "undefined") return [];
    if (!categoryId || categoryId === "all") {
      return PHYSICAL_QUANTITIES;
    }
    return PHYSICAL_QUANTITIES.filter(q => q.category === categoryId);
  }

  /**
   * 在物理量或全域資料庫中尋找單位規格
   * @param {string} unitId - 單位 ID (如 'nT', 'eV')
   * @param {string} [quantityId] - 可選的物理量 ID
   * @returns {{ quantity: Object, unit: Object }|null}
   */
  static findUnit(unitId, quantityId) {
    if (typeof PHYSICAL_QUANTITIES === "undefined") return null;

    if (quantityId) {
      const q = this.getQuantity(quantityId);
      if (q && q.units) {
        const u = q.units.find(x => x.id === unitId);
        if (u) return { quantity: q, unit: u };
      }
    }

    for (const q of PHYSICAL_QUANTITIES) {
      if (q.units) {
        const u = q.units.find(x => x.id === unitId);
        if (u) return { quantity: q, unit: u };
      }
    }
    return null;
  }

  /**
   * 跨制度單位換算核心方法
   * @param {number|string} rawValue - 輸入數值
   * @param {string} fromUnitId - 來源單位 ID
   * @param {string} toUnitId - 目標單位 ID
   * @param {string} [quantityIdOrCategory] - 指定物理量 ID 或分類，預設自動推斷
   * @returns {Object} 完整轉換結構體
   */
  static convert(rawValue, fromUnitId, toUnitId, quantityIdOrCategory) {
    const num = (typeof rawValue === "number") ? rawValue : parseFloat(rawValue);
    const safeNum = isNaN(num) ? 0 : num;

    let targetQty = quantityIdOrCategory ? this.getQuantity(quantityIdOrCategory) : null;
    let fromUnit = null;
    let toUnit = null;

    if (targetQty && targetQty.units) {
      fromUnit = targetQty.units.find(u => u.id === fromUnitId) || null;
      toUnit = targetQty.units.find(u => u.id === toUnitId) || null;
    }

    // 若未在指定物理量中找到完整配對，全域檢索兼具雙方單位的物理量
    if (!fromUnit || !toUnit) {
      if (typeof PHYSICAL_QUANTITIES !== "undefined") {
        for (const q of PHYSICAL_QUANTITIES) {
          const matchFrom = q.units.find(u => u.id === fromUnitId);
          const matchTo = q.units.find(u => u.id === toUnitId);
          if (matchFrom && matchTo) {
            targetQty = q;
            fromUnit = matchFrom;
            toUnit = matchTo;
            break;
          }
        }
      }
    }

    // 仍未完全匹配時的保底機制
    if (!fromUnit) {
      const lookup = this.findUnit(fromUnitId);
      if (lookup) {
        fromUnit = lookup.unit;
        if (!targetQty) targetQty = lookup.quantity;
      }
    }
    if (!toUnit) {
      const lookup = this.findUnit(toUnitId, targetQty ? targetQty.id : undefined);
      if (lookup) {
        toUnit = lookup.unit;
        if (!targetQty) targetQty = lookup.quantity;
      }
    }

    if (!fromUnit || !toUnit) {
      return {
        value: safeNum,
        formattedValue: this.formatValue(safeNum),
        factor: 1,
        formattedFactor: "1",
        fromUnit: fromUnit || { id: fromUnitId, toBaseSI: 1, system: "Unknown" },
        toUnit: toUnit || { id: toUnitId, toBaseSI: 1, system: "Unknown" },
        quantity: targetQty,
        isExact: true
      };
    }

    const valSI = safeNum * fromUnit.toBaseSI;
    const converted = valSI / toUnit.toBaseSI;
    const factor = fromUnit.toBaseSI / toUnit.toBaseSI;

    const formattedValue = this.formatValue(converted);
    const formattedFactor = (Math.abs(factor) < 1e-3 || Math.abs(factor) >= 1e5)
      ? factor.toExponential(5)
      : factor.toString();

    const isExact = (fromUnit.id === toUnit.id) || (
      factor > 0 && Math.abs(Math.log10(factor) - Math.round(Math.log10(factor))) < 1e-9
    );

    return {
      value: converted,
      formattedValue: formattedValue,
      factor: factor,
      formattedFactor: formattedFactor,
      fromUnit: fromUnit,
      toUnit: toUnit,
      quantity: targetQty,
      isExact: isExact
    };
  }

  /**
   * 數值格式化輔助函式
   * @param {number} val - 數值
   * @param {Object} [options] - 格式化選項
   * @returns {string} 格式化字串
   */
  static formatValue(val, options = {}) {
    if (typeof val !== "number" || isNaN(val)) return "0";
    if (val === 0) return "0";

    const absVal = Math.abs(val);
    const precision = options.precision || 5;

    if (absVal < 1e-4 || absVal >= 1e6) {
      return val.toExponential(precision);
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: precision });
  }

  /**
   * 次方符號字串正規化 (例如將 cm⁻³ 與 cm^-3 互通)
   * @param {string} str - 輸入字串
   * @returns {string} 正規化後字串
   */
  static normalizeExponent(str) {
    if (!str) return "";
    return str
      .replace(/[⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => this._supMap[c] || c)
      .replace(/\^/g, "")
      .replace(/_/g, "");
  }

  /**
   * 智慧檢索物理量 (支援名稱、符號、次方符號與中英文單位)
   * @param {string} keyword - 檢索關鍵字
   * @returns {Array<Object>} 符合之物理量清單
   */
  static searchQuantities(keyword) {
    if (typeof PHYSICAL_QUANTITIES === "undefined") return [];
    const rawKw = (keyword || "").trim().toLowerCase();
    if (!rawKw) return [...PHYSICAL_QUANTITIES];

    const cleanKw = rawKw.replace(/[-\s_]/g, "");
    const normKw = this.normalizeExponent(rawKw);

    return PHYSICAL_QUANTITIES.filter(q => {
      const nameZh = (q.nameZh || "").toLowerCase();
      const nameEn = (q.nameEn || "").toLowerCase();
      const cleanNameEn = nameEn.replace(/[-\s_]/g, "");
      const cleanId = (q.id || "").toLowerCase().replace(/[-\s_]/g, "");
      const symbol = (q.symbol || "").toLowerCase();
      const descZh = (q.descZh || "").toLowerCase();
      const descEn = (q.descEn || "").toLowerCase();

      // 所屬分類大類名稱比對
      const catObj = (typeof QUANTITY_CATEGORIES !== "undefined")
        ? QUANTITY_CATEGORIES.find(c => c.id === q.category) : null;
      const catNameZh = catObj ? catObj.nameZh.toLowerCase() : "";
      const catNameEn = catObj ? catObj.nameEn.toLowerCase() : "";

      if (nameZh.includes(rawKw) ||
          nameEn.includes(rawKw) ||
          cleanNameEn.includes(cleanKw) ||
          cleanId.includes(cleanKw) ||
          symbol.includes(rawKw) ||
          descZh.includes(rawKw) ||
          descEn.includes(rawKw) ||
          catNameZh.includes(rawKw) ||
          catNameEn.includes(rawKw)) {
        return true;
      }

      // 單位清單比對 (含次方符號正規化)
      return (q.units || []).some(u => {
        const uId = (u.id || "").toLowerCase();
        const uLabelZh = (u.labelZh || u.label || "").toLowerCase();
        const uLabelEn = (u.labelEn || "").toLowerCase();
        const uDescZh = (u.descZh || u.desc || "").toLowerCase();
        const uDescEn = (u.descEn || "").toLowerCase();

        return uId.includes(rawKw) ||
               uLabelZh.includes(rawKw) ||
               uLabelEn.includes(rawKw) ||
               uDescZh.includes(rawKw) ||
               uDescEn.includes(rawKw) ||
               this.normalizeExponent(uId).includes(normKw) ||
               this.normalizeExponent(uLabelZh).includes(normKw) ||
               this.normalizeExponent(uLabelEn).includes(normKw);
      });
    });
  }

  /**
   * 取得物理常數 (支援多制度值轉換：SI, CGS, Space)
   * @param {string} constantId - 常數 ID (例如 'c', 'kB', 'mu0')
   * @param {string} [targetSystem='SI'] - 目標單位制度 ('SI', 'CGS', 'Space')
   * @returns {Object|null} 常數結構體
   */
  static getConstant(constantId, targetSystem = "SI") {
    if (typeof PHYSICAL_CONSTANTS === "undefined") return null;
    const baseConst = PHYSICAL_CONSTANTS[constantId];
    if (!baseConst) return null;

    const sysKey = (targetSystem === "CGS" || targetSystem === "Space") ? targetSystem : "SI";
    const multiSys = this._multiSystemConstants[constantId];

    let resolvedValue = baseConst.value;
    let resolvedUnit = baseConst.unit;

    if (multiSys && multiSys[sysKey]) {
      resolvedValue = multiSys[sysKey].value;
      resolvedUnit = multiSys[sysKey].unit;
    }

    return {
      id: baseConst.id,
      symbol: baseConst.symbol,
      value: resolvedValue,
      unit: resolvedUnit,
      system: sysKey,
      nameZh: baseConst.nameZh,
      nameEn: baseConst.nameEn,
      dimension: baseConst.dimension,
      desc: baseConst.desc
    };
  }

  /**
   * 取得所有常數於指定制度之對照清單
   * @param {string} [targetSystem='SI'] - 目標單位制度
   * @returns {Array<Object>} 常數清單
   */
  static getAllConstants(targetSystem = "SI") {
    if (typeof PHYSICAL_CONSTANTS === "undefined") return [];
    return Object.keys(PHYSICAL_CONSTANTS).map(cid => this.getConstant(cid, targetSystem));
  }

  /**
   * 取得跨制度對照矩陣 (SI, CGS, Space Physics)
   * @returns {Array<Object>} 對照清單
   */
  static getSystemComparison() {
    return [
      { quantity: "磁場 (B)", SI: "T (特斯拉)", CGS: "G (高斯, 10⁻⁴ T)", Space: "nT (奈米特斯拉, 10⁻⁹ T)" },
      { quantity: "電場 (E)", SI: "V/m (伏特/公尺)", CGS: "statV/cm (29979 V/m)", Space: "mV/m (10⁻³ V/m)" },
      { quantity: "數密度 (n)", SI: "m⁻³", CGS: "cm⁻³ (10⁶ m⁻³)", Space: "cm⁻³ (#/cc)" },
      { quantity: "速度 (v)", SI: "m/s", CGS: "cm/s (10⁻² m/s)", Space: "km/s (10³ m/s)" },
      { quantity: "溫度 (T)", SI: "K (克耳文)", CGS: "K (克耳文)", Space: "eV (1 eV ≈ 11,605 K)" },
      { quantity: "壓力 (P)", SI: "Pa (帕斯卡)", CGS: "dyn/cm² (0.1 Pa)", Space: "nPa (10⁻⁹ Pa)" },
      { quantity: "能量 (E)", SI: "J (焦耳)", CGS: "erg (10⁻⁷ J)", Space: "keV / MeV" },
      { quantity: "特徵長度 (L)", SI: "m (公尺)", CGS: "cm (10⁻² m)", Space: "km / R_E (6371 km)" }
    ];
  }

  /**
   * 單位制度自動偵測
   * @param {string} unitString - 單位文字或標籤
   * @returns {string} 制度名稱
   */
  static detectUnitSystem(unitString) {
    if (!unitString) return "SI";
    const s = String(unitString).toLowerCase();
    if (s.includes("無因次") || s.includes("dimensionless") || s.includes("比值") || s.includes("ratio")) {
      return "Dimensionless";
    }
    if (s.includes("cgs") || s.includes("gauss") || s.includes("erg") || s.includes("dyn") || s.includes("stat")) {
      return "CGS";
    }
    if (s.includes("space") || s.includes("nt") || s.includes("ev") || s.includes("km/s") || s.includes("npa") || s.includes("r_e")) {
      return "Space";
    }
    return "SI";
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { UnitSystemEngine };
}
