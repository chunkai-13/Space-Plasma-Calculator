/**
 * equations.js - 太空電漿物理核心方程式資料庫聚合入口
 * 聚合來自 js/equations-particle.js, js/equations-mhd-waves.js, js/equations-kinetic-shocks.js
 */

const EQUATION_CATEGORIES = [
  { id: "particle_motion", nameZh: "單粒子運動 (Particle Motion)", nameEn: "Particle Motion" },
  { id: "waves_mhd", nameZh: "MHD 磁流體與波動 (MHD & Waves)", nameEn: "MHD & Waves" },
  { id: "characteristic_scales", nameZh: "電漿特徵頻率與尺度 (Scales & Frequencies)", nameEn: "Scales & Frequencies" },
  { id: "jump_conditions", nameZh: "震波跳躍條件 (Rankine-Hugoniot Jump Conditions)", nameEn: "Shock Jump Conditions" },
  { id: "velocity_distributions", nameZh: "速度分布 (Maxwellian / Kappa / RKD)", nameEn: "Velocity Distributions" },
  { id: "electrodynamics", nameZh: "馬克士威與電磁場能量 (Maxwell & Electrodynamics)", nameEn: "Maxwell & Electrodynamics" }
];

const EQUATIONS_DATABASE = [
  ...(typeof PARTICLE_EQUATIONS !== "undefined" ? PARTICLE_EQUATIONS : []),
  ...(typeof MHD_WAVES_EQUATIONS !== "undefined" ? MHD_WAVES_EQUATIONS : []),
  ...(typeof KINETIC_SHOCKS_EQUATIONS !== "undefined" ? KINETIC_SHOCKS_EQUATIONS : [])
];
