/**
 * js/equations-kinetic-shocks.js - 太空電漿物理方程式庫：震波跳躍條件、速度分布函數 (Maxwellian/Kappa/RKD) 與電磁能量
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

const KINETIC_SHOCKS_EQUATIONS = [
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
      const B1 = inputs.B1;
      const B2 = inputs.B1 * r;

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

      const theta = Math.sqrt(((2 * kappa - 3) / kappa) * ((kB * T_K) / m));

      const gammaTop = gammaFunction(kappa + 1);
      const gammaBot = gammaFunction(kappa - 0.5);
      const normFactor = (n_SI / Math.pow(Math.PI * kappa * theta * theta, 1.5)) * (gammaTop / gammaBot);

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
    descZh: "為解決標準 Kappa 分布高能動量高階矩在巨觀上發散問題，由 Scherer 等人引入高能指數截斷因子 exp(-α² v²/θ²)，α 通常極小 (約 10⁻⁴ ~ 10⁻²)。",
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
      const E_SI = inputs.E * units.E.toBaseSI;
      const B_SI = inputs.B * units.B.toBaseSI;
      const mu0 = PHYSICAL_CONSTANTS.mu0.value;
      const eps0 = PHYSICAL_CONSTANTS.eps0.value;

      const S = (E_SI * B_SI) / mu0;
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
