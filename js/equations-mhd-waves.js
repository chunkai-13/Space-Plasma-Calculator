/**
 * js/equations-mhd-waves.js - 太空電漿物理方程式庫：MHD 磁流體、波動與電漿特徵尺度
 */

const MHD_WAVES_EQUATIONS = [
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

      const P_th = n_SI * kB * T_K;
      const P_B = (B_T * B_T) / (2 * mu0);
      const beta = P_th / P_B;

      return [
        { labelZh: "電漿貝他值 (β)", labelEn: "Plasma Beta (β)", value: beta, unitZh: "無因次", unitEn: "Dimensionless", unit: "Dimensionless" },
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
        { labelZh: "德拜球粒子數 (N_D)", labelEn: "Debye Sphere Particles (N_D)", value: N_D, unitZh: "無因次", unitEn: "Dimensionless", unit: "Dimensionless" }
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
  }
];
