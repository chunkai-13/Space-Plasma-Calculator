/**
 * constants.js - 太空電漿物理常數、物理量與單位對照資料庫
 */

// 基本物理常數（SI 單位）
const PHYSICAL_CONSTANTS = {
  mu0: {
    id: "mu0",
    nameZh: "真空磁導率",
    nameEn: "Vacuum Permeability",
    symbol: "μ₀",
    value: 1.25663706212e-6,
    unit: "N/A² (H/m)",
    dimension: [1, 1, -2, -2, 0], // [M, L, T, I, Theta]
    desc: "4π × 10⁻⁷ H/m"
  },
  eps0: {
    id: "eps0",
    nameZh: "真空介電常數",
    nameEn: "Vacuum Permittivity",
    symbol: "ε₀",
    value: 8.8541878128e-12,
    unit: "F/m",
    dimension: [-1, -3, 4, 2, 0],
    desc: "1 / (μ₀ c²)"
  },
  c: {
    id: "c",
    nameZh: "真空光速",
    nameEn: "Speed of Light",
    symbol: "c",
    value: 299792458,
    unit: "m/s",
    dimension: [0, 1, -1, 0, 0],
    desc: "299,792,458 m/s"
  },
  kB: {
    id: "kB",
    nameZh: "波茲曼常數",
    nameEn: "Boltzmann Constant",
    symbol: "k_B",
    value: 1.380649e-23,
    unit: "J/K",
    dimension: [1, 2, -2, 0, -1],
    desc: "1.380649 × 10⁻²³ J/K"
  },
  e: {
    id: "e",
    nameZh: "基本電荷量",
    nameEn: "Elementary Charge",
    symbol: "e",
    value: 1.602176634e-19,
    unit: "C",
    dimension: [0, 0, 1, 1, 0],
    desc: "1.602176634 × 10⁻¹⁹ C"
  },
  mp: {
    id: "mp",
    nameZh: "質子質量",
    nameEn: "Proton Mass",
    symbol: "m_p",
    value: 1.67262192369e-27,
    unit: "kg",
    dimension: [1, 0, 0, 0, 0],
    desc: "1.67262 × 10⁻²⁷ kg"
  },
  me: {
    id: "me",
    nameZh: "電子質量",
    nameEn: "Electron Mass",
    symbol: "m_e",
    value: 9.1093837015e-31,
    unit: "kg",
    dimension: [1, 0, 0, 0, 0],
    desc: "9.10938 × 10⁻³¹ kg"
  },
  G: {
    id: "G",
    nameZh: "萬有引力常數",
    nameEn: "Gravitational Constant",
    symbol: "G",
    value: 6.6743e-11,
    unit: "m³/(kg·s²)",
    dimension: [-1, 3, -2, 0, 0],
    desc: "6.6743 × 10⁻¹¹ m³/(kg·s²)"
  },
  RE: {
    id: "RE",
    nameZh: "地球半徑",
    nameEn: "Earth Radius",
    symbol: "R_E",
    value: 6.371e6,
    unit: "m",
    dimension: [0, 1, 0, 0, 0],
    desc: "6,371 km"
  },
  AU: {
    id: "AU",
    nameZh: "天文單位",
    nameEn: "Astronomical Unit",
    symbol: "AU",
    value: 1.495978707e11,
    unit: "m",
    dimension: [0, 1, 0, 0, 0],
    desc: "1.496 × 10¹¹ m (~1.5×10⁸ km)"
  }
};

// 物理量類別分類
const QUANTITY_CATEGORIES = [
  { id: "fields", nameZh: "基本場量與電磁", nameEn: "Fields & Electromagnetics" },
  { id: "plasma_scales", nameZh: "電漿尺度與長度", nameEn: "Plasma Scales & Lengths" },
  { id: "plasma_freq", nameZh: "電漿頻率與波動", nameEn: "Plasma Frequencies & Waves" },
  { id: "thermo_pressure", nameZh: "熱力學與壓力能量", nameEn: "Thermodynamics & Energy" },
  { id: "particle_motion", nameZh: "單粒子運動與漂移", nameEn: "Particle Motion & Drifts" },
  { id: "space_units", nameZh: "天文與太空常用長度/時間", nameEn: "Astrophysical Scales" }
];

// 完整物理量清單與多制度單位對照
// 維度定義: [M(kg), L(m), T(s), I(A), Theta(K)]
const PHYSICAL_QUANTITIES = [
  {
    id: "magnetic_field",
    category: "fields",
    symbol: "B",
    nameZh: "磁場 (磁感應強度)",
    nameEn: "Magnetic Field (B)",
    dimension: [1, 0, -2, -1, 0],
    baseUnitSI: "T",
    units: [
      { id: "T", label: "T (特斯拉)", system: "SI", toBaseSI: 1, desc: "1 T = 10⁴ G = 10⁹ nT" },
      { id: "nT", label: "nT (奈米特斯拉)", system: "Space", toBaseSI: 1e-9, desc: "太空磁層與太陽風最常用單位" },
      { id: "G", label: "G (高斯)", system: "CGS", toBaseSI: 1e-4, desc: "1 G = 10⁻⁴ T = 10⁵ nT" },
      { id: "gamma", label: "γ (Gamma)", system: "Space", toBaseSI: 1e-9, desc: "1 γ = 1 nT (地球物理歷史慣用)" },
      { id: "mT", label: "mT (毫特斯拉)", system: "SI", toBaseSI: 1e-3, desc: "1 mT = 10 G" },
      { id: "uT", label: "μT (微特斯拉)", system: "SI", toBaseSI: 1e-6, desc: "地表磁場約 30 ~ 60 μT" }
    ],
    defaultDisplayUnit: { SI: "T", CGS: "G", Space: "nT" },
    descZh: "描述空間中磁力強弱的向量場，太空觀測普遍以 nT 為標準單位。",
    descEn: "Vector field describing magnetic force. Typically measured in nT in space."
  },
  {
    id: "electric_field",
    category: "fields",
    symbol: "E",
    nameZh: "電場強度",
    nameEn: "Electric Field (E)",
    dimension: [1, 1, -3, -1, 0],
    baseUnitSI: "V/m",
    units: [
      { id: "V_per_m", label: "V/m (伏特/公尺)", system: "SI", toBaseSI: 1, desc: "SI 基本導出單位" },
      { id: "mV_per_m", label: "mV/m (毫伏/公尺)", system: "Space", toBaseSI: 1e-3, desc: "磁層極區與磁重聯電場常用單位" },
      { id: "uV_per_m", label: "μV/m (微伏/公尺)", system: "Space", toBaseSI: 1e-6, desc: "微弱波動電場單位" },
      { id: "statV_per_cm", label: "statV/cm (靜伏/公分)", system: "CGS", toBaseSI: 29979.2458, desc: "CGS 靜電制 (esu)" }
    ],
    defaultDisplayUnit: { SI: "V/m", CGS: "statV/cm", Space: "mV/m" },
    descZh: "單位正電荷受力。太空中對流電場常介於數個至數十個 mV/m。",
    descEn: "Electric force per unit charge. Space convection fields are often in mV/m."
  },
  {
    id: "plasma_pressure",
    category: "thermo_pressure",
    symbol: "P",
    nameZh: "壓力 / 能量密度",
    nameEn: "Pressure / Energy Density (P)",
    dimension: [1, -1, -2, 0, 0],
    baseUnitSI: "Pa",
    units: [
      { id: "Pa", label: "Pa (帕斯卡, N/m²)", system: "SI", toBaseSI: 1, desc: "1 Pa = 1 J/m³" },
      { id: "nPa", label: "nPa (奈帕斯卡)", system: "Space", toBaseSI: 1e-9, desc: "太陽風動壓與熱壓常用單位 (1 nPa = 10⁻⁹ Pa)" },
      { id: "pPa", label: "pPa (皮帕斯卡)", system: "Space", toBaseSI: 1e-12, desc: "10⁻¹² Pa" },
      { id: "dyn_per_cm2", label: "dyn/cm² (達因/平方公分)", system: "CGS", toBaseSI: 0.1, desc: "1 dyn/cm² = 0.1 Pa" },
      { id: "bar", label: "bar (巴)", system: "SI", toBaseSI: 1e5, desc: "1 bar = 10⁵ Pa" },
      { id: "eV_per_cm3", label: "eV/cm³ (能量密度)", system: "Space", toBaseSI: 1.602176634e-13, desc: "宇宙射線與熱粒子能量密度" }
    ],
    defaultDisplayUnit: { SI: "Pa", CGS: "dyn/cm²", Space: "nPa" },
    descZh: "包含熱壓力 P = nkT、磁壓力 P_B = B²/(2μ₀) 與動壓 P_dyn = ρv²。",
    descEn: "Includes thermal pressure, magnetic pressure, and dynamic ram pressure."
  },
  {
    id: "number_density",
    category: "thermo_pressure",
    symbol: "n",
    nameZh: "數密度 (數目密度)",
    nameEn: "Number Density (n)",
    dimension: [0, -3, 0, 0, 0],
    baseUnitSI: "m^-3",
    units: [
      { id: "m_minus3", label: "m⁻³ (每立方公尺)", system: "SI", toBaseSI: 1, desc: "1 m⁻³" },
      { id: "cm_minus3", label: "cm⁻³ (#/cc, 每立方公分)", system: "Space", toBaseSI: 1e6, desc: "太陽風 1 AU 約 5 cm⁻³；電離層可達 10⁶ cm⁻³" }
    ],
    defaultDisplayUnit: { SI: "m⁻³", CGS: "cm⁻³", Space: "cm⁻³" },
    descZh: "每單位體積內的粒子數目。太空電漿幾乎全面慣用 cm⁻³ (#/cc)。",
    descEn: "Number of particles per unit volume. Widely expressed as cm⁻³ (#/cc) in space."
  },
  {
    id: "velocity",
    category: "particle_motion",
    symbol: "v",
    nameZh: "速度 (流速 / 波動速度)",
    nameEn: "Velocity (v)",
    dimension: [0, 1, -1, 0, 0],
    baseUnitSI: "m/s",
    units: [
      { id: "m_per_s", label: "m/s (公尺/秒)", system: "SI", toBaseSI: 1, desc: "SI 基本單位" },
      { id: "km_per_s", label: "km/s (公里/秒)", system: "Space", toBaseSI: 1e3, desc: "太陽風流速約 300 ~ 800 km/s，Alfven 速度常用單位" },
      { id: "cm_per_s", label: "cm/s (公分/秒)", system: "CGS", toBaseSI: 1e-2, desc: "CGS 單位" },
      { id: "speed_of_light", label: "c (光速百分比/倍數)", system: "Space", toBaseSI: 299792458, desc: "相對論性高能粒子速度" }
    ],
    defaultDisplayUnit: { SI: "m/s", CGS: "cm/s", Space: "km/s" },
    descZh: "流體流速、熱速度或阿爾芬波動速度，太空領域習慣用 km/s。",
    descEn: "Bulk speed, thermal velocity, or wave speed. Commonly in km/s."
  },
  {
    id: "temperature",
    category: "thermo_pressure",
    symbol: "T",
    nameZh: "溫度 / 熱能",
    nameEn: "Temperature / Thermal Energy (T)",
    dimension: [0, 0, 0, 0, 1], // [M, L, T, I, Theta]
    baseUnitSI: "K",
    units: [
      { id: "K", label: "K (絕對溫標/克耳文)", system: "SI", toBaseSI: 1, desc: "絕對溫度" },
      { id: "eV", label: "eV (電子伏特, 相當於 k_B T)", system: "Space", toBaseSI: 11604.525, desc: "1 eV ≈ 11,605 K (電漿物理最常用溫度表示法)" },
      { id: "keV", label: "keV (千電子伏特)", system: "Space", toBaseSI: 1.1604525e7, desc: "1 keV ≈ 1.16 × 10⁷ K (磁層環電流與太陽耀斑離子溫度)" },
      { id: "MK", label: "MK (百萬克耳文, 10⁶ K)", system: "Space", toBaseSI: 1e6, desc: "太陽日冕約 1 ~ 3 MK" }
    ],
    defaultDisplayUnit: { SI: "K", CGS: "K", Space: "eV" },
    descZh: "在電漿物理中，溫度極常以電子伏特 (eV) 表示（即 k_B T / e）。",
    descEn: "In space plasma, temperature is predominantly expressed in energy units (eV)."
  },
  {
    id: "frequency",
    category: "plasma_freq",
    symbol: "f / ω",
    nameZh: "頻率 / 角頻率",
    nameEn: "Frequency / Angular Frequency (f, ω)",
    dimension: [0, 0, -1, 0, 0],
    baseUnitSI: "Hz",
    units: [
      { id: "Hz", label: "Hz (赫茲)", system: "SI", toBaseSI: 1, desc: "每秒次數" },
      { id: "rad_per_s", label: "rad/s (弧度/秒, ω)", system: "SI", toBaseSI: 1 / (2 * Math.PI), desc: "角頻率 ω = 2π f" },
      { id: "kHz", label: "kHz (千赫茲)", system: "Space", toBaseSI: 1e3, desc: "電漿波動常見頻段" },
      { id: "MHz", label: "MHz (百萬赫茲)", system: "Space", toBaseSI: 1e6, desc: "電子電漿頻率常用單位" },
      { id: "mHz", label: "mHz (毫赫茲)", system: "Space", toBaseSI: 1e-3, desc: "超低頻 ULF 磁層脈動常用單位" }
    ],
    defaultDisplayUnit: { SI: "Hz", CGS: "Hz", Space: "kHz" },
    descZh: "迴旋頻率、電漿頻率與各類波動頻率。",
    descEn: "Cyclotron frequency, plasma frequency, and wave oscillation rates."
  },
  {
    id: "length",
    category: "plasma_scales",
    symbol: "L / r / λ",
    nameZh: "長度與特徵尺度",
    nameEn: "Length & Characteristic Scale (L)",
    dimension: [0, 1, 0, 0, 0],
    baseUnitSI: "m",
    units: [
      { id: "m", label: "m (公尺)", system: "SI", toBaseSI: 1, desc: "SI 基本單位" },
      { id: "km", label: "km (公里)", system: "Space", toBaseSI: 1e3, desc: "迴旋半徑、慣性長度常見單位" },
      { id: "cm", label: "cm (公分)", system: "CGS", toBaseSI: 1e-2, desc: "Debye 長度常見單位" },
      { id: "RE", label: "R_E (地球半徑, 6371 km)", system: "Space", toBaseSI: 6.371e6, desc: "磁層空間定位標準尺度 (1 R_E = 6371 km)" },
      { id: "AU", label: "AU (天文單位)", system: "Space", toBaseSI: 1.495978707e11, desc: "日球層與行星際尺度" }
    ],
    defaultDisplayUnit: { SI: "m", CGS: "cm", Space: "km" },
    descZh: "德拜長度、迴旋半徑、離子慣性長度與行星磁層尺度。",
    descEn: "Debye length, gyro-radius, inertial skin depth, and magnetospheric scale."
  },
  {
    id: "current_density",
    category: "fields",
    symbol: "J",
    nameZh: "電流密度",
    nameEn: "Current Density (J)",
    dimension: [0, -2, 0, 1, 0],
    baseUnitSI: "A/m^2",
    units: [
      { id: "A_per_m2", label: "A/m² (安培/平方公尺)", system: "SI", toBaseSI: 1, desc: "SI 導出單位" },
      { id: "uA_per_m2", label: "μA/m² (微安/平方公尺)", system: "Space", toBaseSI: 1e-6, desc: "極光場向電流 (Birkeland currents) 常用單位" },
      { id: "nA_per_m2", label: "nA/m² (奈安/平方公尺)", system: "Space", toBaseSI: 1e-9, desc: "磁層尾電流片常用單位" }
    ],
    defaultDisplayUnit: { SI: "A/m²", CGS: "A/m²", Space: "μA/m²" },
    descZh: "描述電流強度空間分布，極光與磁重聯電流片常用 μA/m² 或 nA/m²。",
    descEn: "Birkeland field-aligned currents and tail currents are often in μA/m²."
  },
  {
    id: "energy",
    category: "thermo_pressure",
    symbol: "W / E",
    nameZh: "能量 / 功",
    nameEn: "Energy / Work (W)",
    dimension: [1, 2, -2, 0, 0],
    baseUnitSI: "J",
    units: [
      { id: "J", label: "J (焦耳)", system: "SI", toBaseSI: 1, desc: "SI 能量單位" },
      { id: "erg", label: "erg (爾格)", system: "CGS", toBaseSI: 1e-7, desc: "1 erg = 10⁻⁷ J" },
      { id: "eV", label: "eV (電子伏特)", system: "Space", toBaseSI: 1.602176634e-19, desc: "單粒子動能常用單位" },
      { id: "keV", label: "keV (千電子伏特)", system: "Space", toBaseSI: 1.602176634e-16, desc: "磁層捕獲粒子常用單位" },
      { id: "MeV", label: "MeV (百萬電子伏特)", system: "Space", toBaseSI: 1.602176634e-13, desc: "Van Allen 輻射帶高能相對論性粒子" }
    ],
    defaultDisplayUnit: { SI: "J", CGS: "erg", Space: "keV" },
    descZh: "單粒子運動動能、熱能與磁重聯釋放能量。",
    descEn: "Kinetic energy, thermal energy, and magnetic reconnection release energy."
  },
  {
    id: "magnetic_moment",
    category: "particle_motion",
    symbol: "μ",
    nameZh: "磁矩 (第一絕熱不變量)",
    nameEn: "Magnetic Moment (μ)",
    dimension: [1, 2, 0, 1, 0], // J/T = [M L^2 T^-2] / [M T^-2 I^-1] = [L^2 I]
    baseUnitSI: "A·m²",
    units: [
      { id: "A_m2", label: "A·m² (或 J/T)", system: "SI", toBaseSI: 1, desc: "1 A·m² = 1 J/T" },
      { id: "eV_per_nT", label: "eV/nT (電子伏特/奈特斯拉)", system: "Space", toBaseSI: 1.602176634e-10, desc: "太空粒子物理最實用磁矩單位 (1 eV/nT = 1.602×10⁻¹⁰ J/T)" },
      { id: "MeV_per_G", label: "MeV/G (百萬電子伏特/高斯)", system: "Space", toBaseSI: 1.602176634e-9, desc: "輻射帶高能粒子常用單位" },
      { id: "erg_per_G", label: "erg/G (爾格/高斯)", system: "CGS", toBaseSI: 1e-3, desc: "CGS 單位 (1 erg/G = 10⁻³ J/T)" }
    ],
    defaultDisplayUnit: { SI: "J/T", CGS: "erg/G", Space: "eV/nT" },
    descZh: "μ = m v_⊥² / (2 B)，在慢變磁場中保持不變的第一絕熱不變量。",
    descEn: "First adiabatic invariant. In space, eV/nT is the standard convenient unit."
  },
  {
    id: "poynting_flux",
    category: "fields",
    symbol: "S",
    nameZh: "坡印廷能通量 (能流密度)",
    nameEn: "Poynting Flux (S)",
    dimension: [1, 0, -3, 0, 0],
    baseUnitSI: "W/m^2",
    units: [
      { id: "W_per_m2", label: "W/m² (瓦特/平方公尺)", system: "SI", toBaseSI: 1, desc: "SI 能流密度單位" },
      { id: "mW_per_m2", label: "mW/m² (毫瓦/平方公尺)", system: "Space", toBaseSI: 1e-3, desc: "極區電離層電磁能量輸入常用單位" },
      { id: "uW_per_m2", label: "μW/m² (微瓦/平方公尺)", system: "Space", toBaseSI: 1e-6, desc: "阿爾芬波能量傳輸" },
      { id: "erg_per_cm2_s", label: "erg/(cm²·s)", system: "CGS", toBaseSI: 1e-3, desc: "1 erg/(cm²·s) = 1 mW/m²" }
    ],
    defaultDisplayUnit: { SI: "W/m²", CGS: "erg/(cm²·s)", Space: "mW/m²" },
    descZh: "S = (E × B) / μ₀，描述電磁場能量傳輸的速率與方向。",
    descEn: "S = (E × B) / μ₀. Measures electromagnetic energy flux into ionosphere."
  },
  {
    id: "plasma_beta",
    category: "thermo_pressure",
    symbol: "β",
    nameZh: "電漿貝他值 (無因次比值)",
    nameEn: "Plasma Beta (β)",
    dimension: [0, 0, 0, 0, 0],
    baseUnitSI: "1",
    units: [
      { id: "dimensionless", label: "無因次 (純數值)", system: "SI", toBaseSI: 1, desc: "β = P_thermal / P_magnetic" }
    ],
    defaultDisplayUnit: { SI: "1", CGS: "1", Space: "1" },
    descZh: "熱壓力與磁壓力的比值。太陽風 β ~ 1，磁層尾波片 β > 1，磁層頂外側 β < 1。",
    descEn: "Ratio of plasma thermal pressure to magnetic pressure."
  }
];
