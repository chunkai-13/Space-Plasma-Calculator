/**
 * js/plasma-core.js - 太空電漿物理核心演算法引擎
 * 包含：7 維因次分析引擎 (DimensionChecker)、對數域數值運算與物理量類別 (Quantity)、
 * 單位制度解耦轉換層 (UnitConverter) 以及太空物理六大核心方程式 (PlasmaEquations)
 * 無外部相依性 (Zero-dependency)，相容瀏覽器全域環境與 ES6 / CommonJS 模組。
 */

// =========================================================================
// 1. 因次衝突錯誤類別 (DimensionMismatchError)
// =========================================================================
class DimensionMismatchError extends Error {
  constructor(message, expected = null, actual = null, context = "") {
    super(message);
    this.name = "DimensionMismatchError";
    this.expected = expected;
    this.actual = actual;
    this.context = context;
  }
}

// =========================================================================
// 2. 7 維因次分析引擎 (DimensionChecker)
// =========================================================================
class DimensionChecker {
  /**
   * 7 維基本物理因次向量：[M, L, T, I, Θ, N, J]
   * 0: M  (Mass, 質量, kg)
   * 1: L  (Length, 長度, m)
   * 2: T  (Time, 時間, s)
   * 3: I  (Electric Current, 電流, A)
   * 4: Θ  (Thermodynamic Temperature, 熱力學溫度, K)
   * 5: N  (Amount of Substance, 物質的量, mol)
   * 6: J  (Luminous Intensity, 發光強度, cd)
   */
  static DIMS = Object.freeze({
    SCALAR:         Object.freeze([0, 0, 0, 0, 0, 0, 0]),
    MASS:           Object.freeze([1, 0, 0, 0, 0, 0, 0]),
    LENGTH:         Object.freeze([0, 1, 0, 0, 0, 0, 0]),
    TIME:           Object.freeze([0, 0, 1, 0, 0, 0, 0]),
    CURRENT:        Object.freeze([0, 0, 0, 1, 0, 0, 0]),
    TEMPERATURE:    Object.freeze([0, 0, 0, 0, 1, 0, 0]),
    AMOUNT:         Object.freeze([0, 0, 0, 0, 0, 1, 0]),
    LUMINOUS:       Object.freeze([0, 0, 0, 0, 0, 0, 1]),

    // 常用衍生物理量因次
    FREQUENCY:      Object.freeze([0, 0, -1, 0, 0, 0, 0]),
    VELOCITY:       Object.freeze([0, 1, -1, 0, 0, 0, 0]),
    ACCELERATION:   Object.freeze([0, 1, -2, 0, 0, 0, 0]),
    FORCE:          Object.freeze([1, 1, -2, 0, 0, 0, 0]),
    PRESSURE:       Object.freeze([1, -1, -2, 0, 0, 0, 0]),
    ENERGY:         Object.freeze([1, 2, -2, 0, 0, 0, 0]),
    POWER:          Object.freeze([1, 2, -3, 0, 0, 0, 0]),
    CHARGE:         Object.freeze([0, 0, 1, 1, 0, 0, 0]),
    VOLTAGE:        Object.freeze([1, 2, -3, -1, 0, 0, 0]),
    MAGNETIC_B:     Object.freeze([1, 0, -2, -1, 0, 0, 0]),
    NUMBER_DENSITY: Object.freeze([0, -3, 0, 0, 0, 0, 0]),
    MASS_DENSITY:   Object.freeze([1, -3, 0, 0, 0, 0, 0]),
    PERMITTIVITY:   Object.freeze([-1, -3, 4, 2, 0, 0, 0]),
    PERMEABILITY:   Object.freeze([1, 1, -2, -2, 0, 0, 0]),
    BOLTZMANN:      Object.freeze([1, 2, -2, 0, -1, 0, 0])
  });

  static isEqual(d1, d2, tol = 1e-6) {
    if (!Array.isArray(d1) || !Array.isArray(d2)) return false;
    if (d1.length !== 7 || d2.length !== 7) return false;
    for (let i = 0; i < 7; i++) {
      if (Math.abs(d1[i] - d2[i]) > tol) return false;
    }
    return true;
  }

  static isDimensionless(d, tol = 1e-6) {
    if (!Array.isArray(d) || d.length !== 7) return false;
    return d.every(v => Math.abs(v) <= tol);
  }

  static add(d1, d2) {
    const res = new Array(7);
    for (let i = 0; i < 7; i++) res[i] = d1[i] + d2[i];
    return res;
  }

  static subtract(d1, d2) {
    const res = new Array(7);
    for (let i = 0; i < 7; i++) res[i] = d1[i] - d2[i];
    return res;
  }

  static scale(d, power) {
    const res = new Array(7);
    for (let i = 0; i < 7; i++) res[i] = d[i] * power;
    return res;
  }

  static assertEquivalent(d1, d2, context = "加減運算") {
    if (!DimensionChecker.isEqual(d1, d2)) {
      throw new DimensionMismatchError(
        `[因次衝突錯誤] 在 ${context} 運算中兩項因次不一致：左側為 ${DimensionChecker.format(d1)}，右側為 ${DimensionChecker.format(d2)}。`,
        d1,
        d2,
        context
      );
    }
  }

  static assertDimensionless(d, context = "超越函數") {
    if (!DimensionChecker.isDimensionless(d)) {
      throw new DimensionMismatchError(
        `[因次衝突錯誤] ${context} 的引數必須為無因次純量，當前因次為 ${DimensionChecker.format(d)}。`,
        DimensionChecker.DIMS.SCALAR,
        d,
        context
      );
    }
  }

  static format(dim) {
    if (!dim || dim.length !== 7) return "未知因次";
    if (DimensionChecker.isDimensionless(dim)) return "1 (無因次/純量)";

    const baseSymbols = ["kg", "m", "s", "A", "K", "mol", "cd"];
    const numerators = [];
    const denominators = [];

    for (let i = 0; i < 7; i++) {
      const p = Math.round(dim[i] * 1000) / 1000;
      if (p > 0) {
        numerators.push(p === 1 ? baseSymbols[i] : `${baseSymbols[i]}^${p}`);
      } else if (p < 0) {
        denominators.push(p === -1 ? baseSymbols[i] : `${baseSymbols[i]}^${Math.abs(p)}`);
      }
    }

    if (numerators.length === 0 && denominators.length === 0) return "1";
    const numStr = numerators.length > 0 ? numerators.join("·") : "1";
    if (denominators.length === 0) return numStr;
    return `${numStr} / (${denominators.join("·")})`;
  }
}

// =========================================================================
// 3. 物理量核心類別 (Quantity)：支援對數域運算與下溢防護
// =========================================================================
class Quantity {
  constructor(value, dimension = DimensionChecker.DIMS.SCALAR, logMag = null, sign = null) {
    this.value = Number(value);
    this.dimension = Object.freeze([...dimension]);

    if (sign !== null && logMag !== null) {
      this.sign = sign;
      this.logMag = logMag;
      if (!isFinite(this.value) || this.value === 0) {
        this.value = this.sign * Math.exp(this.logMag);
      }
    } else {
      if (isNaN(this.value) || this.value === 0) {
        this.sign = 0;
        this.logMag = -Infinity;
      } else {
        this.sign = this.value > 0 ? 1 : -1;
        this.logMag = Math.log(Math.abs(this.value));
      }
    }
  }

  static get CONSTANTS() {
    return {
      c:    new Quantity(299792458, DimensionChecker.DIMS.VELOCITY),
      mu0:  new Quantity(1.25663706212e-6, DimensionChecker.DIMS.PERMEABILITY),
      eps0: new Quantity(8.8541878128e-12, DimensionChecker.DIMS.PERMITTIVITY),
      kB:   new Quantity(1.380649e-23, DimensionChecker.DIMS.BOLTZMANN),
      e:    new Quantity(1.602176634e-19, DimensionChecker.DIMS.CHARGE),
      me:   new Quantity(9.1093837015e-31, DimensionChecker.DIMS.MASS),
      mp:   new Quantity(1.67262192369e-27, DimensionChecker.DIMS.MASS),
      pi:   new Quantity(Math.PI, DimensionChecker.DIMS.SCALAR)
    };
  }

  add(other, context = "加法") {
    const qOther = other instanceof Quantity ? other : new Quantity(other);
    DimensionChecker.assertEquivalent(this.dimension, qOther.dimension, context);
    return new Quantity(this.value + qOther.value, this.dimension);
  }

  subtract(other, context = "減法") {
    const qOther = other instanceof Quantity ? other : new Quantity(other);
    DimensionChecker.assertEquivalent(this.dimension, qOther.dimension, context);
    return new Quantity(this.value - qOther.value, this.dimension);
  }

  multiply(other) {
    const qOther = other instanceof Quantity ? other : new Quantity(other);
    if (this.sign === 0 || qOther.sign === 0) {
      return new Quantity(0, DimensionChecker.add(this.dimension, qOther.dimension));
    }
    const newSign = this.sign * qOther.sign;
    const newLogMag = this.logMag + qOther.logMag;
    const newDim = DimensionChecker.add(this.dimension, qOther.dimension);
    return new Quantity(newSign * Math.exp(newLogMag), newDim, newLogMag, newSign);
  }

  divide(other) {
    const qOther = other instanceof Quantity ? other : new Quantity(other);
    if (qOther.sign === 0) {
      throw new RangeError("除數不可為 0");
    }
    if (this.sign === 0) {
      return new Quantity(0, DimensionChecker.subtract(this.dimension, qOther.dimension));
    }
    const newSign = this.sign * qOther.sign;
    const newLogMag = this.logMag - qOther.logMag;
    const newDim = DimensionChecker.subtract(this.dimension, qOther.dimension);
    return new Quantity(newSign * Math.exp(newLogMag), newDim, newLogMag, newSign);
  }

  pow(power) {
    let p = power;
    if (power instanceof Quantity) {
      DimensionChecker.assertDimensionless(power.dimension, "指數冪次運算");
      p = power.value;
    }
    if (this.sign === 0) {
      return new Quantity(0, DimensionChecker.scale(this.dimension, p));
    }
    if (this.sign < 0 && Math.floor(p) !== p) {
      throw new RangeError("負數基底無法進行非整數次方運算");
    }
    const newSign = this.sign < 0 ? (Math.round(p) % 2 === 0 ? 1 : -1) : 1;
    const newLogMag = this.logMag * p;
    const newDim = DimensionChecker.scale(this.dimension, p);
    return new Quantity(newSign * Math.exp(newLogMag), newDim, newLogMag, newSign);
  }

  sqrt() {
    return this.pow(0.5);
  }

  ln() {
    DimensionChecker.assertDimensionless(this.dimension, "自然對數 ln");
    if (this.value <= 0) throw new RangeError("自然對數引數必須為大於 0 之無因次純量");
    return new Quantity(Math.log(this.value), DimensionChecker.DIMS.SCALAR);
  }

  exp() {
    DimensionChecker.assertDimensionless(this.dimension, "指數函數 exp");
    return new Quantity(Math.exp(this.value), DimensionChecker.DIMS.SCALAR);
  }

  sin() {
    DimensionChecker.assertDimensionless(this.dimension, "正弦函數 sin");
    return new Quantity(Math.sin(this.value), DimensionChecker.DIMS.SCALAR);
  }

  cos() {
    DimensionChecker.assertDimensionless(this.dimension, "餘弦函數 cos");
    return new Quantity(Math.cos(this.value), DimensionChecker.DIMS.SCALAR);
  }

  /**
   * 對數域連乘除求值器
   * 專為連乘積、開方與極端數量級設計，避免直接計算浮點數產生下溢（Underflow）
   */
  static evaluateLogProduct(terms) {
    let totalSign = 1;
    let totalLogMag = 0;
    let totalDim = [...DimensionChecker.DIMS.SCALAR];

    for (const term of terms) {
      const q = term.quantity instanceof Quantity ? term.quantity : new Quantity(term.quantity);
      const pwr = Number(term.power !== undefined ? term.power : 1);

      if (q.sign === 0) {
        return new Quantity(0, DimensionChecker.scale(q.dimension, pwr));
      }
      if (q.sign < 0 && Math.floor(pwr) !== pwr) {
        throw new RangeError("對數域連乘運算不支援負數開非整數冪");
      }
      if (q.sign < 0 && Math.round(pwr) % 2 !== 0) {
        totalSign *= -1;
      }
      totalLogMag += pwr * q.logMag;
      totalDim = DimensionChecker.add(totalDim, DimensionChecker.scale(q.dimension, pwr));
    }

    const value = totalSign * Math.exp(totalLogMag);
    return new Quantity(value, totalDim, totalLogMag, totalSign);
  }

  toScientific(digits = 4) {
    if (this.sign === 0 || !isFinite(this.logMag)) return "0.0000e+0";
    const log10Val = this.logMag / Math.LN10;
    const exponent = Math.floor(log10Val);
    const mantissa = this.sign * Math.pow(10, log10Val - exponent);
    return `${mantissa.toFixed(digits)}e${exponent >= 0 ? "+" : ""}${exponent}`;
  }
}

// =========================================================================
// 4. 單位制度隔離與映射層 (UnitConverter)
// =========================================================================
class UnitConverter {
  static get FACTORS() {
    return {
      MAGNETIC_B: { T: 1.0, nT: 1e-9, G: 1e-4 },
      DENSITY:    { "m^-3": 1.0, "cm^-3": 1e6 },
      VELOCITY:   { "m/s": 1.0, "km/s": 1e3, c: 299792458 },
      PRESSURE:   { Pa: 1.0, nPa: 1e-9, "dyn/cm^2": 0.1 }
    };
  }

  /**
   * 溫度（K）與電子伏特（eV）嚴格解耦
   * E = e · V 換算為焦耳（J，能量因次 [1, 2, -2, 0, 0, 0, 0]）
   * T = E / kB 換算為開氏溫標（K，溫度因次 [0, 0, 0, 0, 1, 0, 0]）
   */
  static eVToJoules(eV) {
    return new Quantity(eV * 1.602176634e-19, DimensionChecker.DIMS.ENERGY);
  }

  static eVToKelvin(eV) {
    const energyJ = eV * 1.602176634e-19;
    const kelvin = energyJ / 1.380649e-23;
    return new Quantity(kelvin, DimensionChecker.DIMS.TEMPERATURE);
  }

  static kelvinToEV(K) {
    const energyJ = K * 1.380649e-23;
    return energyJ / 1.602176634e-19;
  }
}

// =========================================================================
// 5. 太空電漿物理核心方程式庫 (PlasmaEquations)
// =========================================================================
class PlasmaEquations {
  /**
   * 1. 電子與離子電漿頻率 (Electron & Ion Plasma Frequency)
   * ω_pe = sqrt( n_e · e² / (ε₀ · m_e) )
   * ω_pi = sqrt( n_i · q_i² / (ε₀ · m_i) )
   */
  static electronPlasmaFrequency(ne_cm3) {
    const ne_SI = new Quantity(ne_cm3 * 1e6, DimensionChecker.DIMS.NUMBER_DENSITY);
    const C = Quantity.CONSTANTS;
    return Quantity.evaluateLogProduct([
      { quantity: ne_SI, power: 0.5 },
      { quantity: C.e, power: 1.0 },
      { quantity: C.eps0, power: -0.5 },
      { quantity: C.me, power: -0.5 }
    ]);
  }

  static ionPlasmaFrequency(ni_cm3, mi = Quantity.CONSTANTS.mp, qi = Quantity.CONSTANTS.e) {
    const ni_SI = new Quantity(ni_cm3 * 1e6, DimensionChecker.DIMS.NUMBER_DENSITY);
    const C = Quantity.CONSTANTS;
    return Quantity.evaluateLogProduct([
      { quantity: ni_SI, power: 0.5 },
      { quantity: qi, power: 1.0 },
      { quantity: C.eps0, power: -0.5 },
      { quantity: mi, power: -0.5 }
    ]);
  }

  /**
   * 2. 電子與離子迴旋頻率 (Electron & Ion Cyclotron Frequency)
   * Ω_ce = e · B / m_e
   * Ω_ci = q_i · B / m_i
   */
  static electronCyclotronFrequency(B_nT) {
    const B_SI = new Quantity(B_nT * 1e-9, DimensionChecker.DIMS.MAGNETIC_B);
    const C = Quantity.CONSTANTS;
    return Quantity.evaluateLogProduct([
      { quantity: C.e, power: 1.0 },
      { quantity: B_SI, power: 1.0 },
      { quantity: C.me, power: -1.0 }
    ]);
  }

  static ionCyclotronFrequency(B_nT, mi = Quantity.CONSTANTS.mp, qi = Quantity.CONSTANTS.e) {
    const B_SI = new Quantity(B_nT * 1e-9, DimensionChecker.DIMS.MAGNETIC_B);
    return Quantity.evaluateLogProduct([
      { quantity: qi, power: 1.0 },
      { quantity: B_SI, power: 1.0 },
      { quantity: mi, power: -1.0 }
    ]);
  }

  /**
   * 3. 德拜長度 (Debye Length)
   * λ_D = sqrt( ε₀ · k_B · T / (n · e²) )
   */
  static debyeLength(ne_cm3, Te_eV) {
    const ne_SI = new Quantity(ne_cm3 * 1e6, DimensionChecker.DIMS.NUMBER_DENSITY);
    const energy_J = UnitConverter.eVToJoules(Te_eV);
    const C = Quantity.CONSTANTS;
    return Quantity.evaluateLogProduct([
      { quantity: C.eps0, power: 0.5 },
      { quantity: energy_J, power: 0.5 },
      { quantity: ne_SI, power: -0.5 },
      { quantity: C.e, power: -1.0 }
    ]);
  }

  /**
   * 4. 電子與離子迴旋半徑 (Electron & Ion Gyroradius / Larmor Radius)
   * ρ = v_th / Ω = sqrt(m · k_B · T) / (q · B)
   */
  static electronGyroradius(Te_eV, B_nT) {
    const B_SI = new Quantity(B_nT * 1e-9, DimensionChecker.DIMS.MAGNETIC_B);
    const energy_J = UnitConverter.eVToJoules(Te_eV);
    const C = Quantity.CONSTANTS;
    return Quantity.evaluateLogProduct([
      { quantity: C.me, power: 0.5 },
      { quantity: energy_J, power: 0.5 },
      { quantity: C.e, power: -1.0 },
      { quantity: B_SI, power: -1.0 }
    ]);
  }

  static ionGyroradius(Ti_eV, B_nT, mi = Quantity.CONSTANTS.mp, qi = Quantity.CONSTANTS.e) {
    const B_SI = new Quantity(B_nT * 1e-9, DimensionChecker.DIMS.MAGNETIC_B);
    const energy_J = UnitConverter.eVToJoules(Ti_eV);
    return Quantity.evaluateLogProduct([
      { quantity: mi, power: 0.5 },
      { quantity: energy_J, power: 0.5 },
      { quantity: qi, power: -1.0 },
      { quantity: B_SI, power: -1.0 }
    ]);
  }

  /**
   * 5. 阿爾芬速度 (Alfvén Speed)
   * v_A = B / sqrt(μ₀ · ρ_mass)
   * 若輸入質子數密度 np (cm⁻³)，自動帶入質子質量 mp 計算質量密度 ρ = np · mp
   */
  static alfvenSpeed(B_nT, np_cm3) {
    const B_SI = new Quantity(B_nT * 1e-9, DimensionChecker.DIMS.MAGNETIC_B);
    const np_SI = new Quantity(np_cm3 * 1e6, DimensionChecker.DIMS.NUMBER_DENSITY);
    const C = Quantity.CONSTANTS;
    const rho_mass = np_SI.multiply(C.mp);
    return Quantity.evaluateLogProduct([
      { quantity: B_SI, power: 1.0 },
      { quantity: C.mu0, power: -0.5 },
      { quantity: rho_mass, power: -0.5 }
    ]);
  }

  /**
   * 6. 電漿貝塔值 (Plasma Beta)
   * β = P_thermal / P_magnetic = (2 · μ₀ · n · k_B · T) / B²
   */
  static plasmaBeta(n_cm3, T_eV, B_nT) {
    const B_SI = new Quantity(B_nT * 1e-9, DimensionChecker.DIMS.MAGNETIC_B);
    const n_SI = new Quantity(n_cm3 * 1e6, DimensionChecker.DIMS.NUMBER_DENSITY);
    const energy_J = UnitConverter.eVToJoules(T_eV);
    const C = Quantity.CONSTANTS;
    const factorTwo = new Quantity(2.0, DimensionChecker.DIMS.SCALAR);

    return Quantity.evaluateLogProduct([
      { quantity: factorTwo, power: 1.0 },
      { quantity: C.mu0, power: 1.0 },
      { quantity: n_SI, power: 1.0 },
      { quantity: energy_J, power: 1.0 },
      { quantity: B_SI, power: -2.0 }
    ]);
  }
}

// 瀏覽器全域環境與模組相容導出
if (typeof window !== "undefined") {
  window.DimensionMismatchError = DimensionMismatchError;
  window.DimensionChecker = DimensionChecker;
  window.Quantity = Quantity;
  window.UnitConverter = UnitConverter;
  window.PlasmaEquations = PlasmaEquations;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DimensionMismatchError,
    DimensionChecker,
    Quantity,
    UnitConverter,
    PlasmaEquations
  };
}
