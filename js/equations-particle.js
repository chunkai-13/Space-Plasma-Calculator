/**
 * js/equations-particle.js - 太空電漿物理方程式庫：單粒子運動 (Particle Motion)
 */

const PARTICLE_EQUATIONS = [
  // 1. 單粒子運動
  {
    id: "gyro_frequency",
    category: "particle_motion",
    nameZh: "迴旋頻率 (回旋/拉莫爾頻率)",
    nameEn: "Gyro-frequency (Cyclotron Frequency)",
    formulaLatex: "\\omega_c = \\frac{|q| B}{m}, \\quad f_c = \\frac{\\omega_c}{2\\pi}",
    descZh: "帶電粒子在磁場中繞磁力線迴旋的特徵頻率。電子頻率較高（約數百 kHz），質子頻率較低（約數 Hz）。",
    descEn: "Rate at which a charged particle gyrates around a magnetic field line.",
    inputs: [
      {
        id: "particle",
        nameZh: "粒子種類",
        nameEn: "Particle Type",
        type: "select",
        options: [
          { value: "electron", labelZh: "電子 (e⁻)", labelEn: "Electron (e⁻)", q: -1.602176634e-19, m: 9.1093837015e-31 },
          { value: "proton", labelZh: "質子 / 氫離子 (p⁺)", labelEn: "Proton (p⁺)", q: 1.602176634e-19, m: 1.67262192369e-27 },
          { value: "alpha", labelZh: "Alpha 粒子 (He²⁺)", labelEn: "Alpha (He²⁺)", q: 2 * 1.602176634e-19, m: 4 * 1.6726e-27 },
          { value: "oxygen", labelZh: "氧離子 (O⁺)", labelEn: "Oxygen (O⁺)", q: 1.602176634e-19, m: 16 * 1.6726e-27 }
        ],
        default: "electron"
      },
      {
        id: "B",
        nameZh: "磁場強度 (B)",
        nameEn: "Magnetic Field (B)",
        default: 10,
        unitCategory: "magnetic_field",
        defaultUnit: "nT"
      }
    ],
    calculate: (inputs, units) => {
      const p = inputs.particle;
      const B_T = inputs.B * units.B.toBaseSI;
      const omega_c = (Math.abs(p.q) * B_T) / p.m;
      const f_c = omega_c / (2 * Math.PI);

      return [
        { labelZh: "角迴旋頻率 (ω_c)", labelEn: "Angular Gyro-frequency (ω_c)", value: omega_c, unit: "rad/s" },
        { labelZh: "線性迴旋頻率 (f_c)", labelEn: "Linear Gyro-frequency (f_c)", value: f_c, unit: "Hz", altUnits: [
          { label: "kHz", value: f_c * 1e-3 },
          { label: "MHz", value: f_c * 1e-6 }
        ]},
        { labelZh: "迴旋週期 (T_c = 1/f_c)", labelEn: "Gyro-period (T_c)", value: 1 / f_c, unit: "s", altUnits: [
          { label: "ms", value: (1 / f_c) * 1e3 },
          { label: "μs", value: (1 / f_c) * 1e6 }
        ]}
      ];
    }
  },
  {
    id: "gyro_radius",
    category: "particle_motion",
    nameZh: "迴旋半徑 (拉莫爾半徑)",
    nameEn: "Gyro-radius (Larmor Radius)",
    formulaLatex: "r_L = \\frac{m v_\\perp}{|q| B} = \\frac{\\sqrt{2 m k_B T_\\perp}}{|q| B}",
    descZh: "粒子繞磁力線旋轉時軌跡的圓半徑，決定了流體描述（MHD）何時有效或需考慮微觀動態效應。",
    descEn: "Radius of circular motion of a charged particle in the plane perpendicular to B.",
    inputs: [
      {
        id: "particle",
        nameZh: "粒子種類",
        nameEn: "Particle Type",
        type: "select",
        options: [
          { value: "electron", labelZh: "電子 (e⁻)", labelEn: "Electron (e⁻)", q: 1.602176634e-19, m: 9.1093837015e-31 },
          { value: "proton", labelZh: "質子 (p⁺)", labelEn: "Proton (p⁺)", q: 1.602176634e-19, m: 1.67262192369e-27 }
        ],
        default: "proton"
      },
      {
        id: "energy_or_v",
        nameZh: "垂直動能 (E_⊥) 或 溫度 (T_⊥)",
        nameEn: "Perpendicular Energy (E_⊥)",
        default: 10,
        unitCategory: "energy",
        defaultUnit: "eV"
      },
      {
        id: "B",
        nameZh: "磁場強度 (B)",
        nameEn: "Magnetic Field (B)",
        default: 10,
        unitCategory: "magnetic_field",
        defaultUnit: "nT"
      }
    ],
    calculate: (inputs, units) => {
      const p = inputs.particle;
      const B_T = inputs.B * units.B.toBaseSI;
      const E_perp_J = inputs.energy_or_v * units.energy_or_v.toBaseSI;
      const v_perp = Math.sqrt((2 * E_perp_J) / p.m);
      const r_L = (p.m * v_perp) / (p.q * B_T);

      return [
        { labelZh: "迴旋半徑 (r_L)", labelEn: "Gyro-radius (r_L)", value: r_L, unit: "m", altUnits: [
          { label: "km", value: r_L * 1e-3 },
          { label: "R_E (地球半徑)", value: r_L / 6.371e6 }
        ]},
        { labelZh: "垂直運動速度 (v_⊥)", labelEn: "Perpendicular Speed (v_⊥)", value: v_perp, unit: "m/s", altUnits: [
          { label: "km/s", value: v_perp * 1e-3 }
        ]}
      ];
    }
  },
  {
    id: "magnetic_moment",
    category: "particle_motion",
    nameZh: "磁矩 (第一絕熱不變量)",
    nameEn: "Magnetic Moment (First Adiabatic Invariant)",
    formulaLatex: "\\mu = \\frac{m v_\\perp^2}{2 B} = \\frac{W_\\perp}{B}",
    descZh: "粒子繞磁力線迴旋產生的微觀磁偶極矩。在慢變磁場中為常數，是磁鏡效應與粒子捕捉的關鍵物理量。",
    descEn: "First adiabatic invariant of particle motion in slowly varying fields.",
    inputs: [
      {
        id: "W_perp",
        nameZh: "垂直動能 (W_⊥)",
        nameEn: "Perpendicular Energy (W_⊥)",
        default: 100,
        unitCategory: "energy",
        defaultUnit: "eV"
      },
      {
        id: "B",
        nameZh: "磁場強度 (B)",
        nameEn: "Magnetic Field (B)",
        default: 20,
        unitCategory: "magnetic_field",
        defaultUnit: "nT"
      }
    ],
    calculate: (inputs, units) => {
      const W_J = inputs.W_perp * units.W_perp.toBaseSI;
      const B_T = inputs.B * units.B.toBaseSI;
      const mu_SI = W_J / B_T; // J/T
      const W_eV = inputs.W_perp * (units.W_perp.id === "eV" ? 1 : W_J / 1.602176634e-19);
      const B_nT = inputs.B * (units.B.id === "nT" ? 1 : B_T * 1e9);
      const mu_space = W_eV / B_nT; // eV / nT

      return [
        { labelZh: "太空常用磁矩 (μ)", labelEn: "Space Magnetic Moment (μ)", value: mu_space, unit: "eV/nT" },
        { labelZh: "SI 磁矩 (μ)", labelEn: "SI Magnetic Moment (μ)", value: mu_SI, unit: "J/T (A·m²)" },
        { labelZh: "CGS 磁矩 (μ)", labelEn: "CGS Magnetic Moment (μ)", value: mu_SI * 1e3, unit: "erg/G" }
      ];
    }
  },
  {
    id: "exb_drift",
    category: "particle_motion",
    nameZh: "E × B 漂移速度",
    nameEn: "E × B Drift Velocity",
    formulaLatex: "\\mathbf{v}_E = \\frac{\\mathbf{E} \\times \\mathbf{B}}{B^2}, \\quad v_E = \\frac{E_\\perp}{B}",
    descZh: "由電場與磁場正交所引起的導心漂移運動，漂移速度與粒子質量與電荷的正負號皆無關，正負電荷以同速度同向漂移。",
    descEn: "Drift velocity perpendicular to both E and B, independent of mass and charge.",
    inputs: [
      {
        id: "E",
        nameZh: "垂直電場強度 (E_⊥)",
        nameEn: "Perpendicular Electric Field (E_⊥)",
        default: 2,
        unitCategory: "electric_field",
        defaultUnit: "mV_per_m"
      },
      {
        id: "B",
        nameZh: "磁場強度 (B)",
        nameEn: "Magnetic Field (B)",
        default: 20,
        unitCategory: "magnetic_field",
        defaultUnit: "nT"
      }
    ],
    calculate: (inputs, units) => {
      const E_SI = inputs.E * units.E.toBaseSI;
      const B_SI = inputs.B * units.B.toBaseSI;
      const v_E = E_SI / B_SI;

      return [
        { labelZh: "E × B 漂移速度 (v_E)", labelEn: "E × B Drift Speed (v_E)", value: v_E * 1e-3, unit: "km/s", altUnits: [
          { label: "m/s", value: v_E }
        ]}
      ];
    }
  },
  {
    id: "gradient_curvature_drift",
    category: "particle_motion",
    nameZh: "梯度與曲率漂移速度 (∇B & Curvature Drift)",
    nameEn: "Gradient-B & Curvature Drift",
    formulaLatex: "v_d = \\frac{W_\\perp}{q B L_B} + \\frac{2 W_\\parallel}{q B R_c}",
    descZh: "非均勻彎曲磁場中引起的導心漂移。因正負粒子漂移方向相反，在地球磁層中形成向西流動的環電流 (Ring Current)。",
    descEn: "Drifts caused by spatial gradients and magnetic line curvature. Drives the ring current.",
    inputs: [
      {
        id: "particle",
        nameZh: "粒子種類",
        nameEn: "Particle Type",
        type: "select",
        options: [
          { value: "proton", labelZh: "質子 (p⁺, 向西漂移)", labelEn: "Proton (p⁺, Westward)", q: 1.602176634e-19, m: 1.67262192369e-27 },
          { value: "electron", labelZh: "電子 (e⁻, 向東漂移)", labelEn: "Electron (e⁻, Eastward)", q: -1.602176634e-19, m: 9.1093837015e-31 }
        ],
        default: "proton"
      },
      {
        id: "W_perp",
        nameZh: "垂直動能 (W_⊥)",
        nameEn: "Perpendicular Kinetic Energy",
        default: 30,
        unitCategory: "energy",
        defaultUnit: "keV"
      },
      {
        id: "W_para",
        nameZh: "平行動能 (W_∥)",
        nameEn: "Parallel Kinetic Energy",
        default: 15,
        unitCategory: "energy",
        defaultUnit: "keV"
      },
      {
        id: "B",
        nameZh: "當地磁場強度 (B)",
        nameEn: "Local Magnetic Field (B)",
        default: 100,
        unitCategory: "magnetic_field",
        defaultUnit: "nT"
      },
      {
        id: "Rc",
        nameZh: "磁力線曲率半徑 / 梯度尺度 (R_c ≈ L_B)",
        nameEn: "Curvature Radius (R_c)",
        default: 2,
        unitCategory: "length",
        defaultUnit: "RE"
      }
    ],
    calculate: (inputs, units) => {
      const p = inputs.particle;
      const W_perp_J = inputs.W_perp * units.W_perp.toBaseSI;
      const W_para_J = inputs.W_para * units.W_para.toBaseSI;
      const B_T = inputs.B * units.B.toBaseSI;
      const Rc_m = inputs.Rc * units.Rc.toBaseSI;

      const v_grad = W_perp_J / (p.q * B_T * Rc_m);
      const v_curv = (2 * W_para_J) / (p.q * B_T * Rc_m);
      const v_total = v_grad + v_curv;

      return [
        { labelZh: "總導心漂移速度 (v_d)", labelEn: "Total Drift Speed (v_d)", value: Math.abs(v_total) * 1e-3, unit: "km/s", altUnits: [
          { label: "m/s", value: Math.abs(v_total) }
        ]},
        { labelZh: "梯度漂移分量 (v_∇B)", labelEn: "Grad-B Component", value: Math.abs(v_grad) * 1e-3, unit: "km/s" },
        { labelZh: "曲率漂移分量 (v_c)", labelEn: "Curvature Component", value: Math.abs(v_curv) * 1e-3, unit: "km/s" }
      ];
    }
  }
];
