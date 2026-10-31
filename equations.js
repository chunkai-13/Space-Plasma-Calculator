/**
 * equations.js - 太空電漿物理核心方程式資料庫與計算模組
 */

// 高精度 Gamma 函數（用於 Kappa 分布計算）
function gammaFunction(z) {
  const g = 7;
  const C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109583115912,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];

  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gammaFunction(1 - z));
  }
  z -= 1;
  let x = C[0];
  for (let i = 1; i < g + 2; i++) {
    x += C[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

const EQUATION_CATEGORIES = [
  { id: "particle_motion", nameZh: "單粒子運動 (Particle Motion)", nameEn: "Particle Motion" },
  { id: "waves_mhd", nameZh: "MHD 磁流體與波動 (MHD & Waves)", nameEn: "MHD & Waves" },
  { id: "characteristic_scales", nameZh: "電漿特徵頻率與尺度 (Scales & Frequencies)", nameEn: "Scales & Frequencies" },
  { id: "jump_conditions", nameZh: "震波跳躍條件 (Rankine-Hugoniot Jump Conditions)", nameEn: "Shock Jump Conditions" },
  { id: "velocity_distributions", nameZh: "速度分布 (Maxwellian / Kappa / RKD)", nameEn: "Velocity Distributions" },
  { id: "electrodynamics", nameZh: "馬克士威與電磁場能量 (Maxwell & Electrodynamics)", nameEn: "Maxwell & Electrodynamics" }
];

const EQUATIONS_DATABASE = [
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
      // 太空常用單位: eV / nT
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
      const E_SI = inputs.E * units.E.toBaseSI; // V/m
      const B_SI = inputs.B * units.B.toBaseSI; // T
      const v_E = E_SI / B_SI; // m/s

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
  },

  // 2. MHD 磁流體與波動
  {
    id: "alfven_speed",
    category: "waves_mhd",
    nameZh: "阿爾芬速度 (Alfvén Speed)",
    nameEn: "Alfvén Speed (v_A)",
    formulaLatex: "v_A = \\frac{B}{\\sqrt{\\mu_0 \\rho}} = \\frac{B}{\\sqrt{\\mu_0 n_i m_i}}",
    descZh: "磁化電漿中沿磁力線傳播的橫波相速度，是太空電漿中最重要的特徵速度之一。太陽風中常為 30 ~ 70 km/s，磁層瓣區可達上千 km/s。",
    descEn: "Phase velocity of Alfvén waves traveling along magnetic field lines.",
    inputs: [
      {
        id: "B",
        nameZh: "磁場強度 (B)",
        nameEn: "Magnetic Field (B)",
        default: 10,
        unitCategory: "magnetic_field",
        defaultUnit: "nT"
      },
      {
        id: "n",
        nameZh: "離子數密度 (n_i)",
        nameEn: "Ion Number Density (n_i)",
        default: 5,
        unitCategory: "number_density",
        defaultUnit: "cm_minus3"
      },
      {
        id: "ion_mass",
        nameZh: "主導離子質量",
        nameEn: "Dominant Ion Mass",
        type: "select",
        options: [
          { value: "proton", labelZh: "質子 / 氫 (H⁺)", labelEn: "Proton / Hydrogen (H⁺)", m: 1.67262192369e-27 },
          { value: "he4", labelZh: "氦離子 (He²⁺)", labelEn: "Helium (He²⁺)", m: 4 * 1.6726e-27 },
          { value: "o16", labelZh: "氧離子 (O⁺)", labelEn: "Oxygen (O⁺)", m: 16 * 1.6726e-27 }
        ],
        default: "proton"
      }
    ],
    calculate: (inputs, units) => {
      const B_T = inputs.B * units.B.toBaseSI;
      const n_SI = inputs.n * units.n.toBaseSI;
      const rho = n_SI * inputs.ion_mass.m;
      const mu0 = PHYSICAL_CONSTANTS.mu0.value;
      const v_A = B_T / Math.sqrt(mu0 * rho);

      return [
        { labelZh: "阿爾芬速度 (v_A)", labelEn: "Alfvén Speed (v_A)", value: v_A * 1e-3, unit: "km/s", altUnits: [
          { label: "m/s", value: v_A }
        ]},
        { labelZh: "質量密度 (ρ)", labelEn: "Mass Density (ρ)", value: rho, unit: "kg/m³", altUnits: [
          { label: "g/cm³", value: rho * 1e-3 }
        ]}
      ];
    }
  },
  {
    id: "sound_speed",
    category: "waves_mhd",
    nameZh: "離子聲速 (Ion Sound Speed)",
    nameEn: "Ion Sound Speed (c_s)",
    formulaLatex: "c_s = \\sqrt{\\frac{\\gamma_e k_B T_e + \\gamma_i k_B T_i}{m_i}} \\approx \\sqrt{\\frac{\\gamma k_B T}{m_i}}",
    descZh: "電漿中的壓縮縱波速度。在太空物理中，常取多方指數 γ = 5/3。",
    descEn: "Phase speed of ion acoustic compressional waves in plasma.",
    inputs: [
      {
        id: "T",
        nameZh: "電漿溫度 (T)",
        nameEn: "Plasma Temperature (T)",
        default: 10,
        unitCategory: "temperature",
        defaultUnit: "eV"
      },
      {
        id: "gamma",
        nameZh: "絕熱指數 (γ)",
        nameEn: "Adiabatic Index (γ)",
        default: 1.666667
      },
      {
        id: "ion_mass",
        nameZh: "離子種類",
        nameEn: "Ion Species",
        type: "select",
        options: [
          { value: "proton", labelZh: "質子 (m_p)", labelEn: "Proton (m_p)", m: 1.67262192369e-27 },
          { value: "oxygen", labelZh: "氧離子 (O⁺)", labelEn: "Oxygen (O⁺)", m: 16 * 1.6726e-27 }
        ],
        default: "proton"
      }
    ],
    calculate: (inputs, units) => {
      const T_K = inputs.T * units.T.toBaseSI;
      const kB = PHYSICAL_CONSTANTS.kB.value;
      const c_s = Math.sqrt((inputs.gamma * kB * T_K) / inputs.ion_mass.m);

      return [
        { labelZh: "離子聲速 (c_s)", labelEn: "Sound Speed (c_s)", value: c_s * 1e-3, unit: "km/s", altUnits: [
          { label: "m/s", value: c_s }
        ]}
      ];
    }
  },
  {
    id: "plasma_beta_calc",
    category: "waves_mhd",
    nameZh: "電漿貝他值 (Plasma Beta, β)",
    nameEn: "Plasma Beta (β)",
    formulaLatex: "\\beta = \\frac{P_{thermal}}{P_B} = \\frac{n k_B (T_e + T_i)}{\\frac{B^2}{2\\mu_0}}",
    descZh: "熱壓力與磁壓力的比值，決定電漿是由磁場支配（β ≪ 1）還是由粒子動力壓支配（β ≫ 1）。",
    descEn: "Ratio of plasma thermal pressure to magnetic pressure.",
    inputs: [
      {
        id: "n",
        nameZh: "電漿密度 (n)",
        nameEn: "Plasma Density (n)",
        default: 5,
        unitCategory: "number_density",
        defaultUnit: "cm_minus3"
      },
      {
        id: "T",
        nameZh: "總溫度 (T_e + T_i)",
        nameEn: "Total Temperature (T_e + T_i)",
        default: 20,
        unitCategory: "temperature",
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
      const n_SI = inputs.n * units.n.toBaseSI;
      const T_K = inputs.T * units.T.toBaseSI;
      const B_T = inputs.B * units.B.toBaseSI;
      const kB = PHYSICAL_CONSTANTS.kB.value;
      const mu0 = PHYSICAL_CONSTANTS.mu0.value;

      const P_th = n_SI * kB * T_K; // Pa
      const P_B = (B_T * B_T) / (2 * mu0); // Pa
      const beta = P_th / P_B;

      return [
        { labelZh: "電漿貝他值 (β)", labelEn: "Plasma Beta (β)", value: beta, unit: "無因次 (dimensionless)" },
        { labelZh: "熱壓力 (P_th)", labelEn: "Thermal Pressure (P_th)", value: P_th * 1e9, unit: "nPa", altUnits: [
          { label: "Pa", value: P_th }
        ]},
        { labelZh: "磁壓力 (P_B)", labelEn: "Magnetic Pressure (P_B)", value: P_B * 1e9, unit: "nPa", altUnits: [
          { label: "Pa", value: P_B }
        ]}
      ];
    }
  },

  // 3. 電漿特徵頻率與尺度
  {
    id: "plasma_frequency",
    category: "characteristic_scales",
    nameZh: "電漿頻率 (朗繆爾頻率)",
    nameEn: "Plasma Frequency (ω_p)",
    formulaLatex: "\\omega_{pe} = \\sqrt{\\frac{n_e e^2}{\\varepsilon_0 m_e}}, \\quad f_{pe} \\approx 8980 \\sqrt{n_e [\\text{cm}^{-3}]} \\text{ Hz}",
    descZh: "無碰撞電漿中電子靜電震盪的固有頻率，也是電磁波穿透電漿的截止頻率（低於此頻率的電磁波會被全反射）。",
    descEn: "Natural frequency of electrostatic electron oscillations in plasma.",
    inputs: [
      {
        id: "n_e",
        nameZh: "電子數密度 (n_e)",
        nameEn: "Electron Density (n_e)",
        default: 5,
        unitCategory: "number_density",
        defaultUnit: "cm_minus3"
      }
    ],
    calculate: (inputs, units) => {
      const n_SI = inputs.n_e * units.n_e.toBaseSI;
      const e = PHYSICAL_CONSTANTS.e.value;
      const me = PHYSICAL_CONSTANTS.me.value;
      const mp = PHYSICAL_CONSTANTS.mp.value;
      const eps0 = PHYSICAL_CONSTANTS.eps0.value;

      const omega_pe = Math.sqrt((n_SI * e * e) / (eps0 * me));
      const f_pe = omega_pe / (2 * Math.PI);
      const omega_pi = Math.sqrt((n_SI * e * e) / (eps0 * mp));
      const f_pi = omega_pi / (2 * Math.PI);

      return [
        { labelZh: "電子電漿頻率 (f_pe)", labelEn: "Electron Linear Frequency (f_pe)", value: f_pe * 1e-3, unit: "kHz", altUnits: [
          { label: "Hz", value: f_pe },
          { label: "MHz", value: f_pe * 1e-6 }
        ]},
        { labelZh: "電子角電漿頻率 (ω_pe)", labelEn: "Electron Angular Frequency (ω_pe)", value: omega_pe, unit: "rad/s" },
        { labelZh: "離子(質子)電漿頻率 (f_pi)", labelEn: "Ion Plasma Frequency (f_pi)", value: f_pi, unit: "Hz", altUnits: [
          { label: "kHz", value: f_pi * 1e-3 }
        ]}
      ];
    }
  },
  {
    id: "debye_length",
    category: "characteristic_scales",
    nameZh: "德拜長度與德拜球 (Debye Length & Sphere)",
    nameEn: "Debye Length & Debye Sphere",
    formulaLatex: "\\lambda_D = \\sqrt{\\frac{\\varepsilon_0 k_B T_e}{n_e e^2}} \\approx 7430 \\sqrt{\\frac{T_e [\\text{eV}]}{n_e [\\text{cm}^{-3}]}} \\text{ mm}",
    descZh: "靜電屏蔽特徵距離。在尺度大於 λ_D 時，電漿呈現整體電中性（準中性）。",
    descEn: "Characteristic screening distance for electrostatic potentials.",
    inputs: [
      {
        id: "n_e",
        nameZh: "電子數密度 (n_e)",
        nameEn: "Electron Density (n_e)",
        default: 5,
        unitCategory: "number_density",
        defaultUnit: "cm_minus3"
      },
      {
        id: "T_e",
        nameZh: "電子溫度 (T_e)",
        nameEn: "Electron Temperature (T_e)",
        default: 10,
        unitCategory: "temperature",
        defaultUnit: "eV"
      }
    ],
    calculate: (inputs, units) => {
      const n_SI = inputs.n_e * units.n_e.toBaseSI;
      const T_K = inputs.T_e * units.T_e.toBaseSI;
      const e = PHYSICAL_CONSTANTS.e.value;
      const eps0 = PHYSICAL_CONSTANTS.eps0.value;
      const kB = PHYSICAL_CONSTANTS.kB.value;

      const lambda_D = Math.sqrt((eps0 * kB * T_K) / (n_SI * e * e));
      const N_D = (4 / 3) * Math.PI * n_SI * Math.pow(lambda_D, 3);

      return [
        { labelZh: "德拜長度 (λ_D)", labelEn: "Debye Length (λ_D)", value: lambda_D, unit: "m", altUnits: [
          { label: "cm", value: lambda_D * 100 },
          { label: "mm", value: lambda_D * 1000 }
        ]},
        { labelZh: "德拜球粒子數 (N_D)", labelEn: "Debye Sphere Particles (N_D)", value: N_D, unit: "無因次 (準中性需 N_D ≫ 1)" }
      ];
    }
  },
  {
    id: "inertial_lengths",
    category: "characteristic_scales",
    nameZh: "慣性長度 (Skin Depth / 趨膚深度)",
    nameEn: "Inertial Lengths (Skin Depths)",
    formulaLatex: "d_i = \\frac{c}{\\omega_{pi}} = \\sqrt{\\frac{m_i}{\\mu_0 n_i e^2}}, \\quad d_e = \\frac{c}{\\omega_{pe}}",
    descZh: "磁重聯擴散區特徵空間尺度。在 d_i 尺度內離子解耦，進入霍爾 MHD (Hall MHD) 體系；在 d_e 尺度內電子解耦。",
    descEn: "Scales at which ions (d_i) and electrons (d_e) decouple from magnetic field lines.",
    inputs: [
      {
        id: "n",
        nameZh: "電漿數密度 (n)",
        nameEn: "Plasma Density (n)",
        default: 5,
        unitCategory: "number_density",
        defaultUnit: "cm_minus3"
      }
    ],
    calculate: (inputs, units) => {
      const n_SI = inputs.n * units.n.toBaseSI;
      const c = PHYSICAL_CONSTANTS.c.value;
      const e = PHYSICAL_CONSTANTS.e.value;
      const me = PHYSICAL_CONSTANTS.me.value;
      const mp = PHYSICAL_CONSTANTS.mp.value;
      const eps0 = PHYSICAL_CONSTANTS.eps0.value;

      const omega_pi = Math.sqrt((n_SI * e * e) / (eps0 * mp));
      const omega_pe = Math.sqrt((n_SI * e * e) / (eps0 * me));
      const d_i = c / omega_pi;
      const d_e = c / omega_pe;

      return [
        { labelZh: "離子慣性長度 (d_i)", labelEn: "Ion Inertial Length (d_i)", value: d_i * 1e-3, unit: "km", altUnits: [
          { label: "m", value: d_i }
        ]},
        { labelZh: "電子慣性長度 (d_e)", labelEn: "Electron Inertial Length (d_e)", value: d_e * 1e-3, unit: "km", altUnits: [
          { label: "m", value: d_e }
        ]}
      ];
    }
  },

  // 4. 震波跳躍條件 (Jump Conditions)
  {
    id: "rankine_hugoniot",
    category: "jump_conditions",
    nameZh: "Rankine-Hugoniot 激波跳躍條件",
    nameEn: "Rankine-Hugoniot Shock Jump Conditions",
    formulaLatex: "r = \\frac{\\rho_2}{\\rho_1} = \\frac{(\\gamma+1) M_1^2}{(\\gamma-1) M_1^2 + 2}, \\quad \\frac{P_2}{P_1} = \\frac{2\\gamma M_1^2 - (\\gamma-1)}{\\gamma+1}",
    descZh: "無碰撞激波前後的物理量跳躍比值。對於垂直快激波，磁場跳躍比與密度壓縮比相同 (B₂/B₁ = r)。強激波極限為 r → (γ+1)/(γ-1) = 4 (當 γ=5/3)。",
    descEn: "Jump ratios for density, pressure, and magnetic field across a collisionless shock.",
    inputs: [
      {
        id: "M1",
        nameZh: "上游激波馬赫數 (M₁)",
        nameEn: "Upstream Shock Mach Number (M₁)",
        default: 5
      },
      {
        id: "gamma",
        nameZh: "多方指數 (γ)",
        nameEn: "Polytropic Index (γ)",
        default: 1.666667
      },
      {
        id: "B1",
        nameZh: "上游磁場 (B₁)",
        nameEn: "Upstream Magnetic Field (B₁)",
        default: 5,
        unitCategory: "magnetic_field",
        defaultUnit: "nT"
      },
      {
        id: "n1",
        nameZh: "上游密度 (n₁)",
        nameEn: "Upstream Number Density (n₁)",
        default: 5,
        unitCategory: "number_density",
        defaultUnit: "cm_minus3"
      }
    ],
    calculate: (inputs, units) => {
      const M = inputs.M1;
      const g = inputs.gamma;
      if (M <= 1) {
        throw new Error("激波馬赫數 M₁ 必須大於 1 (超聲速/超阿爾芬速)。");
      }
      const r = ((g + 1) * M * M) / ((g - 1) * M * M + 2);
      const P_ratio = (2 * g * M * M - (g - 1)) / (g + 1);
      const T_ratio = P_ratio / r;

      const n1 = inputs.n1;
      const n2 = n1 * r;
      const B1 = inputs.B;
      const B2 = inputs.B1 * r; // 垂直震波近似

      return [
        { labelZh: "密度壓縮比 (r = ρ₂/ρ₁)", labelEn: "Density Compression Ratio (r)", value: r, unit: "比值 (Ratio)" },
        { labelZh: "壓力跳躍比 (P₂/P₁)", labelEn: "Pressure Jump Ratio (P₂/P₁)", value: P_ratio, unit: "比值 (Ratio)" },
        { labelZh: "溫度跳躍比 (T₂/T₁)", labelEn: "Temperature Jump Ratio (T₂/T₁)", value: T_ratio, unit: "比值 (Ratio)" },
        { labelZh: "下游估計密度 (n₂)", labelEn: "Downstream Density (n₂)", value: n2, unit: units.n1.label },
        { labelZh: "下游估計垂直磁場 (B₂)", labelEn: "Downstream Field (B₂)", value: B2, unit: units.B1.label }
      ];
    }
  },

  // 5. 速度分布函數
  {
    id: "maxwellian_distribution",
    category: "velocity_distributions",
    nameZh: "馬克士威速度分布 (Maxwellian Distribution)",
    nameEn: "Maxwellian Velocity Distribution",
    formulaLatex: "v_{th} = \\sqrt{\\frac{2 k_B T}{m}}, \\quad f_M(v) = n \\left(\\frac{m}{2\\pi k_B T}\\right)^{3/2} \\exp\\left(-\\frac{m v^2}{2 k_B T}\\right)",
    descZh: "熱平衡狀態下的標準速度分布，定義了最概然熱速度 v_th、平均速度與方均根速度。",
    descEn: "Thermal equilibrium velocity distribution describing core plasma populations.",
    inputs: [
      {
        id: "particle",
        nameZh: "粒子種類",
        nameEn: "Particle Type",
        type: "select",
        options: [
          { value: "electron", labelZh: "電子 (m_e)", labelEn: "Electron (m_e)", m: 9.1093837015e-31 },
          { value: "proton", labelZh: "質子 (m_p)", labelEn: "Proton (m_p)", m: 1.67262192369e-27 }
        ],
        default: "electron"
      },
      {
        id: "T",
        nameZh: "溫度 (T)",
        nameEn: "Temperature (T)",
        default: 10,
        unitCategory: "temperature",
        defaultUnit: "eV"
      },
      {
        id: "n",
        nameZh: "數密度 (n)",
        nameEn: "Number Density (n)",
        default: 5,
        unitCategory: "number_density",
        defaultUnit: "cm_minus3"
      },
      {
        id: "v_eval",
        nameZh: "欲計算分布之速度點 (v)",
        nameEn: "Evaluation Velocity (v)",
        default: 1000,
        unitCategory: "velocity",
        defaultUnit: "km_per_s"
      }
    ],
    calculate: (inputs, units) => {
      const m = inputs.particle.m;
      const T_K = inputs.T * units.T.toBaseSI;
      const n_SI = inputs.n * units.n.toBaseSI;
      const v_SI = inputs.v_eval * units.v_eval.toBaseSI;
      const kB = PHYSICAL_CONSTANTS.kB.value;

      const v_th = Math.sqrt((2 * kB * T_K) / m);
      const v_avg = Math.sqrt((8 * kB * T_K) / (Math.PI * m));
      const v_rms = Math.sqrt((3 * kB * T_K) / m);

      // f_M(v) in SI: s³ / m⁶
      const A = n_SI * Math.pow(m / (2 * Math.PI * kB * T_K), 1.5);
      const f_v = A * Math.exp(-(m * v_SI * v_SI) / (2 * kB * T_K));

      return [
        { labelZh: "最概然熱速度 (v_th)", labelEn: "Most Probable Speed (v_th)", value: v_th * 1e-3, unit: "km/s", altUnits: [
          { label: "m/s", value: v_th }
        ]},
        { labelZh: "平均速度 (v_avg)", labelEn: "Average Speed (v_avg)", value: v_avg * 1e-3, unit: "km/s" },
        { labelZh: "方均根速度 (v_rms)", labelEn: "RMS Speed (v_rms)", value: v_rms * 1e-3, unit: "km/s" },
        { labelZh: "分布函數值 f_M(v)", labelEn: "Phase Space Density f(v)", value: f_v, unit: "s³/m⁶" }
      ];
    }
  },
  {
    id: "kappa_distribution",
    category: "velocity_distributions",
    nameZh: "卡帕速度分布 (Standard Kappa Distribution)",
    nameEn: "Standard Kappa Distribution",
    formulaLatex: "\\theta = \\sqrt{\\frac{2\\kappa - 3}{\\kappa} \\frac{k_B T}{m}}, \\quad f_\\kappa(v) = \\frac{n}{(\\pi\\kappa\\theta^2)^{3/2}} \\frac{\\Gamma(\\kappa+1)}{\\Gamma(\\kappa-1/2)} \\left(1 + \\frac{v^2}{\\kappa\\theta^2}\\right)^{-(\\kappa+1)}",
    descZh: "太空非平衡無碰撞電漿最廣泛採用的速度分布。具備高能冪律拖尾（Suprathermal tail）。當 κ → ∞ 時退化為馬克士威分布，要求 κ > 1.5。",
    descEn: "Power-law suprathermal tail distribution universally observed in collisionless space plasmas.",
    inputs: [
      {
        id: "kappa",
        nameZh: "卡帕指數 (κ, 需 > 1.5)",
        nameEn: "Kappa Index (κ > 1.5)",
        default: 3.5
      },
      {
        id: "particle",
        nameZh: "粒子種類",
        nameEn: "Particle Type",
        type: "select",
        options: [
          { value: "electron", labelZh: "電子 (m_e)", labelEn: "Electron (m_e)", m: 9.1093837015e-31 },
          { value: "proton", labelZh: "質子 (m_p)", labelEn: "Proton (m_p)", m: 1.67262192369e-27 }
        ],
        default: "electron"
      },
      {
        id: "T",
        nameZh: "等效動態溫度 (T)",
        nameEn: "Effective Temperature (T)",
        default: 10,
        unitCategory: "temperature",
        defaultUnit: "eV"
      },
      {
        id: "n",
        nameZh: "數密度 (n)",
        nameEn: "Number Density (n)",
        default: 5,
        unitCategory: "number_density",
        defaultUnit: "cm_minus3"
      },
      {
        id: "v_eval",
        nameZh: "欲計算之速度點 (v)",
        nameEn: "Velocity (v)",
        default: 2000,
        unitCategory: "velocity",
        defaultUnit: "km_per_s"
      }
    ],
    calculate: (inputs, units) => {
      const kappa = inputs.kappa;
      if (kappa <= 1.5) {
        throw new Error("標準 Kappa 分布要求 κ > 1.5，以保證二階力矩（溫度）收斂。");
      }
      const m = inputs.particle.m;
      const T_K = inputs.T * units.T.toBaseSI;
      const n_SI = inputs.n * units.n.toBaseSI;
      const v_SI = inputs.v_eval * units.v_eval.toBaseSI;
      const kB = PHYSICAL_CONSTANTS.kB.value;

      // 特徵速度 theta
      const theta = Math.sqrt(((2 * kappa - 3) / kappa) * ((kB * T_K) / m));

      // 歸一化係數 A_kappa
      const gammaTop = gammaFunction(kappa + 1);
      const gammaBot = gammaFunction(kappa - 0.5);
      const normFactor = (n_SI / Math.pow(Math.PI * kappa * theta * theta, 1.5)) * (gammaTop / gammaBot);

      // f_kappa(v)
      const baseTerm = 1 + (v_SI * v_SI) / (kappa * theta * theta);
      const f_val = normFactor * Math.pow(baseTerm, -(kappa + 1));

      return [
        { labelZh: "卡帕特徵速度 (θ)", labelEn: "Characteristic Speed (θ)", value: theta * 1e-3, unit: "km/s", altUnits: [
          { label: "m/s", value: theta }
        ]},
        { labelZh: "分布函數值 f_κ(v)", labelEn: "Phase Space Density f(v)", value: f_val, unit: "s³/m⁶" }
      ];
    }
  },
  {
    id: "regularized_kappa",
    category: "velocity_distributions",
    nameZh: "正則化卡帕分布 (Regularized Kappa Distribution, RKD)",
    nameEn: "Regularized Kappa Distribution (RKD)",
    formulaLatex: "f_{RKD}(v) = A_{RKD} \\left(1 + \\frac{v^2}{\\kappa\\theta^2}\\right)^{-(\\kappa+1)} \\exp\\left(-\\alpha^2 \\frac{v^2}{\\theta^2}\\right)",
    descZh: "為解決標準 Kappa 分布高能動量高階矩（如熱能流）在巨觀上發散問題，由 Scherer 等人引入高能指數截斷因子 exp(-α² v²/θ²)，α 通常極小 (約 10⁻⁴ ~ 10⁻²)。",
    descEn: "Suppresses ultra-relativistic divergence using an exponential cutoff factor exp(-α² v²/θ²).",
    inputs: [
      {
        id: "kappa",
        nameZh: "卡帕指數 (κ)",
        nameEn: "Kappa Index (κ)",
        default: 3.0
      },
      {
        id: "alpha",
        nameZh: "正則化截斷參數 (α)",
        nameEn: "Cutoff Parameter (α)",
        default: 0.01
      },
      {
        id: "T",
        nameZh: "核心溫度 (T)",
        nameEn: "Core Temperature (T)",
        default: 10,
        unitCategory: "temperature",
        defaultUnit: "eV"
      },
      {
        id: "v_eval",
        nameZh: "評估速度 (v)",
        nameEn: "Evaluation Velocity (v)",
        default: 3000,
        unitCategory: "velocity",
        defaultUnit: "km_per_s"
      }
    ],
    calculate: (inputs, units) => {
      const kappa = inputs.kappa;
      const alpha = inputs.alpha;
      const T_K = inputs.T * units.T.toBaseSI;
      const v_SI = inputs.v_eval * units.v_eval.toBaseSI;
      const kB = PHYSICAL_CONSTANTS.kB.value;
      const me = PHYSICAL_CONSTANTS.me.value;

      const theta = Math.sqrt(((2 * kappa - 3) / kappa) * ((kB * T_K) / me));
      const v_ratio = v_SI / theta;
      const cutoff = Math.exp(-alpha * alpha * v_ratio * v_ratio);
      const kappa_factor = Math.pow(1 + (v_ratio * v_ratio) / kappa, -(kappa + 1));

      return [
        { labelZh: "特徵熱速度 (θ)", labelEn: "Thermal Speed (θ)", value: theta * 1e-3, unit: "km/s" },
        { labelZh: "高能指數截斷因子", labelEn: "Exponential Cutoff Factor", value: cutoff, unit: "無因次 (≤ 1)" },
        { labelZh: "相對未截斷 Kappa 比值", labelEn: "Ratio to Standard Kappa", value: cutoff, unit: "比值" }
      ];
    }
  },

  // 6. 馬克士威與電磁場能量
  {
    id: "poynting_energy_density",
    category: "electrodynamics",
    nameZh: "坡印廷向量與電磁能通量",
    nameEn: "Poynting Flux & Electromagnetic Energy",
    formulaLatex: "S = \\frac{|\\mathbf{E} \\times \\mathbf{B}|}{\\mu_0} = \\frac{E_\\perp B}{\\mu_0}, \\quad u_{EM} = \\frac{1}{2}\\varepsilon_0 E^2 + \\frac{B^2}{2\\mu_0}",
    descZh: "電磁波與阿爾芬波傳輸的能量通量。常應用於估算極光電流系與電離層焦耳加熱的電磁能輸入率。",
    descEn: "Rate of energy transfer per unit area by electromagnetic waves.",
    inputs: [
      {
        id: "E",
        nameZh: "垂直電場 (E_⊥)",
        nameEn: "Electric Field (E_⊥)",
        default: 50,
        unitCategory: "electric_field",
        defaultUnit: "mV_per_m"
      },
      {
        id: "B",
        nameZh: "磁場強度 (B)",
        nameEn: "Magnetic Field (B)",
        default: 100,
        unitCategory: "magnetic_field",
        defaultUnit: "nT"
      }
    ],
    calculate: (inputs, units) => {
      const E_SI = inputs.E * units.E.toBaseSI; // V/m
      const B_SI = inputs.B * units.B.toBaseSI; // T
      const mu0 = PHYSICAL_CONSTANTS.mu0.value;
      const eps0 = PHYSICAL_CONSTANTS.eps0.value;

      const S = (E_SI * B_SI) / mu0; // W/m^2
      const u_E = 0.5 * eps0 * E_SI * E_SI;
      const u_B = (B_SI * B_SI) / (2 * mu0);

      return [
        { labelZh: "坡印廷能通量 (S)", labelEn: "Poynting Flux (S)", value: S * 1e3, unit: "mW/m²", altUnits: [
          { label: "W/m²", value: S },
          { label: "μW/m²", value: S * 1e6 }
        ]},
        { labelZh: "磁能量密度 (u_B)", labelEn: "Magnetic Energy Density (u_B)", value: u_B * 1e9, unit: "nPa (nJ/m³)" },
        { labelZh: "電能量密度 (u_E)", labelEn: "Electric Energy Density (u_E)", value: u_E * 1e9, unit: "nPa (nJ/m³)" }
      ];
    }
  }
];
