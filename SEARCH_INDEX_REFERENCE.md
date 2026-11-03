# 太空電漿物理計算與單位對照手冊：搜尋關鍵字檢索手冊

本文件完整收錄「太空電漿物理計算與單位查詢工具（Space Plasma Calculator）」中，**分頁二（物理量與單位對照手冊）**與**分頁三（太空物理方程式計算庫）**的所有收錄項目、物理定義、符號代號與可供輸入之搜尋關鍵字清單。

---

## 搜尋引擎支援特性說明

系統內建即時智慧模糊檢索（Live Search），支援以下特性：
1. **大小寫無差別檢索**：輸入 `b`、`B`、`nT`、`nt`、`Alfven`、`alfven` 均可精確比對。
2. **符號與分隔符號正規化**：自動忽略底線（`_`）、連字號（`-`）與空格，輸入 `magnetic_field`、`magneticfield` 或 `magnetic field` 皆可找到相同項目。
3. **上標與次方符號互通**：輸入鍵盤常規之 `cm^-3`、`cm-3`、`m^-3`，可自動對應至單位清單中之 `cm⁻³` 與 `m⁻³`。
4. **同義詞智慧映射**：
   * 「震波」與「激波」雙向互通。
   * 「迴旋」、「回旋」、「拉莫爾（Larmor）」與「Cyclotron」雙向互通。
   * 輸入分類名稱（如「熱力學」、「波動」、「震波」）可自動列出該類別下所有項目。

---

## 第一部分：物理量與單位對照手冊（共 13 類物理量）

### 總覽清單

| 編號 | 物理量代號 | 中文名稱 | 英文名稱 | 所屬大類 | SI 基本單位 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `B` | 磁場 (磁感應強度) | Magnetic Field (B) | 基本場量與電磁 | T |
| 2 | `E` | 電場強度 | Electric Field (E) | 基本場量與電磁 | V/m |
| 3 | `P` | 壓力 / 能量密度 | Pressure / Energy Density (P) | 熱力學與壓力能量 | Pa |
| 4 | `n` | 數密度 (數目密度) | Number Density (n) | 熱力學與壓力能量 | m⁻³ |
| 5 | `v` | 速度 (流速 / 波動速度) | Velocity (v) | 單粒子運動與漂移 | m/s |
| 6 | `T` | 溫度 / 熱能 | Temperature / Thermal Energy (T) | 熱力學與壓力能量 | K |
| 7 | `f`, `ω` | 頻率 / 角頻率 | Frequency / Angular Frequency (f, ω) | 電漿頻率與波動 | Hz |
| 8 | `L`, `r`, `λ` | 長度與特徵尺度 | Length & Characteristic Scale (L) | 電漿尺度與長度 | m |
| 9 | `J` | 電流密度 | Current Density (J) | 基本場量與電磁 | A/m² |
| 10 | `W`, `E` | 能量 / 功 | Energy / Work (W) | 熱力學與壓力能量 | J |
| 11 | `μ` | 磁矩 (第一絕熱不變量) | Magnetic Moment (μ) | 單粒子運動與漂移 | A·m² (J/T) |
| 12 | `S` | 坡印廷能通量 (能流密度) | Poynting Flux (S) | 基本場量與電磁 | W/m² |
| 13 | `β` | 電漿貝他值 (無因次比值) | Plasma Beta (β) | 熱力學與壓力能量 | 1 (無因次) |

---

### 各物理量詳細規格與可檢索關鍵字

#### 1. 磁場 (磁感應強度) — `magnetic_field`
* **符號**：`B`
* **英文名稱**：Magnetic Field (B)
* **所屬大類**：基本場量與電磁（Fields & Electromagnetics）
* **支援單位**：
  * `T`：T (特斯拉 / Tesla) [SI]
  * `nT`：nT (奈米特斯拉 / Nanotesla) [Space]
  * `G`：G (高斯 / Gauss) [CGS]
  * `gamma`：γ (Gamma) [Space]
  * `mT`：mT (毫特斯拉 / Millitesla) [SI]
  * `uT`：μT (微特斯拉 / Microtesla) [SI]
* **對應可搜尋關鍵字**：
  `磁場`, `磁感應強度`, `磁力`, `magnetic`, `magnetic_field`, `magneticfield`, `B`, `T`, `nT`, `tesla`, `特斯拉`, `gauss`, `高斯`, `gamma`, `γ`, `G`, `mT`, `uT`, `μT`, `太陽風`, `磁層`, `基本場量`

#### 2. 電場強度 — `electric_field`
* **符號**：`E`
* **英文名稱**：Electric Field (E)
* **所屬大類**：基本場量與電磁（Fields & Electromagnetics）
* **支援單位**：
  * `V_per_m`：V/m (伏特/公尺 / Volts/meter) [SI]
  * `mV_per_m`：mV/m (毫伏/公尺 / Millivolts/meter) [Space]
  * `uV_per_m`：μV/m (微伏/公尺 / Microvolts/meter) [Space]
  * `statV_per_cm`：statV/cm (靜伏/公分 / Statvolts/cm) [CGS]
* **對應可搜尋關鍵字**：
  `電場`, `電場強度`, `對流電場`, `electric`, `electric_field`, `electricfield`, `E`, `V/m`, `mV/m`, `uV/m`, `μV/m`, `volt`, `伏特`, `靜伏`, `statV`, `statV/cm`, `esu`, `極區`, `重聯`, `基本場量`

#### 3. 壓力 / 能量密度 — `plasma_pressure`
* **符號**：`P`
* **英文名稱**：Pressure / Energy Density (P)
* **所屬大類**：熱力學與壓力能量（Thermodynamics & Energy）
* **支援單位**：
  * `Pa`：Pa (帕斯卡 / Pascal, N/m²) [SI]
  * `nPa`：nPa (奈帕斯卡 / Nanopascal) [Space]
  * `pPa`：pPa (皮帕斯卡 / Picopascal) [Space]
  * `dyn_per_cm2`：dyn/cm² (達因/平方公分 / Dynes/cm²) [CGS]
  * `bar`：bar (巴 / Bar) [SI]
  * `eV_per_cm3`：eV/cm³ (能量密度 / Energy Density) [Space]
* **對應可搜尋關鍵字**：
  `壓力`, `能量密度`, `熱壓力`, `磁壓力`, `動壓`, `plasma_pressure`, `pressure`, `P`, `Pa`, `nPa`, `pPa`, `pascal`, `帕斯卡`, `dyn`, `達因`, `dyn/cm2`, `dyn/cm²`, `bar`, `巴`, `eV/cm3`, `eV/cm³`, `熱力學`

#### 4. 數密度 (數目密度) — `number_density`
* **符號**：`n`
* **英文名稱**：Number Density (n)
* **所屬大類**：熱力學與壓力能量（Thermodynamics & Energy）
* **支援單位**：
  * `m_minus3`：m⁻³ (每立方公尺 / per m³) [SI]
  * `cm_minus3`：cm⁻³ (#/cc, 每立方公分 / per cm³) [Space]
* **對應可搜尋關鍵字**：
  `數密度`, `數目密度`, `粒子密度`, `電漿密度`, `number_density`, `density`, `n`, `cm^-3`, `cm-3`, `cm⁻³`, `m^-3`, `m-3`, `m⁻³`, `#/cc`, `cc`, `太陽風密度`, `電離層`, `熱力學`

#### 5. 速度 (流速 / 波動速度) — `velocity`
* **符號**：`v`
* **英文名稱**：Velocity (v)
* **所屬大類**：單粒子運動與漂移（Particle Motion & Drifts）
* **支援單位**：
  * `m_per_s`：m/s (公尺/秒 / Meters/sec) [SI]
  * `km_per_s`：km/s (公里/秒 / Kilometers/sec) [Space]
  * `cm_per_s`：cm/s (公分/秒 / Centimeters/sec) [CGS]
  * `speed_of_light`：c (光速百分比/倍數 / Speed of light) [Space]
* **對應可搜尋關鍵字**：
  `速度`, `流速`, `波動速度`, `熱速度`, `阿爾芬速度`, `光速`, `velocity`, `speed`, `v`, `m/s`, `km/s`, `cm/s`, `c`, `speed_of_light`, `流體`, `粒子運動`

#### 6. 溫度 / 熱能 — `temperature`
* **符號**：`T`
* **英文名稱**：Temperature / Thermal Energy (T)
* **所屬大類**：熱力學與壓力能量（Thermodynamics & Energy）
* **支援單位**：
  * `K`：K (絕對溫標/克耳文 / Kelvin) [SI]
  * `eV`：eV (電子伏特, 相當於 k_B T / Electronvolt) [Space]
  * `keV`：keV (千電子伏特 / Kiloelectronvolt) [Space]
  * `MK`：MK (百萬克耳文 / Mega-Kelvin) [Space]
* **對應可搜尋關鍵字**：
  `溫度`, `熱能`, `離子溫度`, `電子溫度`, `temperature`, `T`, `K`, `kelvin`, `克耳文`, `絕對溫度`, `eV`, `keV`, `電子伏特`, `MK`, `百萬度`, `日冕`, `耀斑`, `環電流`, `熱力學`

#### 7. 頻率 / 角頻率 — `frequency`
* **符號**：`f / ω`
* **英文名稱**：Frequency / Angular Frequency (f, ω)
* **所屬大類**：電漿頻率與波動（Plasma Frequencies & Waves）
* **支援單位**：
  * `Hz`：Hz (赫茲 / Hertz) [SI]
  * `rad_per_s`：rad/s (弧度/秒, ω / Radians/sec) [SI]
  * `kHz`：kHz (千赫茲 / Kilohertz) [Space]
  * `MHz`：MHz (百萬赫茲 / Megahertz) [Space]
  * `mHz`：mHz (毫赫茲 / Millihertz) [Space]
* **對應可搜尋關鍵字**：
  `頻率`, `角頻率`, `迴旋頻率`, `電漿頻率`, `脈動`, `frequency`, `f`, `omega`, `ω`, `Hz`, `rad/s`, `rad_per_s`, `kHz`, `MHz`, `mHz`, `hertz`, `赫茲`, `ULF`, `波動`

#### 8. 長度與特徵尺度 — `length`
* **符號**：`L / r / λ`
* **英文名稱**：Length & Characteristic Scale (L)
* **所屬大類**：電漿尺度與長度（Plasma Scales & Lengths）
* **支援單位**：
  * `m`：m (公尺 / Meters) [SI]
  * `km`：km (公里 / Kilometers) [Space]
  * `cm`：cm (公分 / Centimeters) [CGS]
  * `RE`：R_E (地球半徑, 6371 km / Earth Radii) [Space]
  * `AU`：AU (天文單位 / Astronomical Unit) [Space]
* **對應可搜尋關鍵字**：
  `長度`, `特徵尺度`, `尺度`, `迴旋半徑`, `德拜長度`, `慣性長度`, `地球半徑`, `天文單位`, `length`, `scale`, `L`, `r`, `lambda`, `λ`, `m`, `km`, `cm`, `RE`, `R_E`, `AU`, `6371`, `電漿尺度`

#### 9. 電流密度 — `current_density`
* **符號**：`J`
* **英文名稱**：Current Density (J)
* **所屬大類**：基本場量與電磁（Fields & Electromagnetics）
* **支援單位**：
  * `A_per_m2`：A/m² (安培/平方公尺 / Amperes/m²) [SI]
  * `uA_per_m2`：μA/m² (微安/平方公尺 / Microamperes/m²) [Space]
  * `nA_per_m2`：nA/m² (奈安/平方公尺 / Nanoamperes/m²) [Space]
* **對應可搜尋關鍵字**：
  `電流密度`, `電流片`, `極光電流`, `白克蘭電流`, `current`, `current_density`, `J`, `A/m2`, `A/m²`, `uA/m2`, `μA/m²`, `nA/m2`, `nA/m²`, `ampere`, `安培`, `Birkeland`, `基本場量`

#### 10. 能量 / 功 — `energy`
* **符號**：`W / E`
* **英文名稱**：Energy / Work (W)
* **所屬大類**：熱力學與壓力能量（Thermodynamics & Energy）
* **支援單位**：
  * `J`：J (焦耳 / Joules) [SI]
  * `erg`：erg (爾格 / Ergs) [CGS]
  * `eV`：eV (電子伏特 / Electronvolts) [Space]
  * `keV`：keV (千電子伏特 / Kiloelectronvolts) [Space]
  * `MeV`：MeV (百萬電子伏特 / Megaelectronvolts) [Space]
* **對應可搜尋關鍵字**：
  `能量`, `功`, `動能`, `輻射帶`, `高能粒子`, `energy`, `work`, `W`, `E`, `J`, `joule`, `焦耳`, `erg`, `爾格`, `eV`, `keV`, `MeV`, `Van Allen`, `熱力學`

#### 11. 磁矩 (第一絕熱不變量) — `magnetic_moment`
* **符號**：`μ`
* **英文名稱**：Magnetic Moment (μ)
* **所屬大類**：單粒子運動與漂移（Particle Motion & Drifts）
* **支援單位**：
  * `A_m2`：A·m² (或 J/T) [SI]
  * `eV_per_nT`：eV/nT (電子伏特/奈特斯拉 / eV/Nanotesla) [Space]
  * `MeV_per_G`：MeV/G (百萬電子伏特/高斯 / MeV/Gauss) [Space]
  * `erg_per_G`：erg/G (爾格/高斯 / Erg/Gauss) [CGS]
* **對應可搜尋關鍵字**：
  `磁矩`, `第一絕熱不變量`, `絕熱不變量`, `magnetic_moment`, `moment`, `mu`, `μ`, `A*m2`, `A·m²`, `J/T`, `eV/nT`, `MeV/G`, `erg/G`, `捕獲粒子`, `粒子運動`

#### 12. 坡印廷能通量 (能流密度) — `poynting_flux`
* **符號**：`S`
* **英文名稱**：Poynting Flux (S)
* **所屬大類**：基本場量與電磁（Fields & Electromagnetics）
* **支援單位**：
  * `W_per_m2`：W/m² (瓦特/平方公尺 / Watts/m²) [SI]
  * `mW_per_m2`：mW/m² (毫瓦/平方公尺 / Milliwatts/m²) [Space]
  * `uW_per_m2`：μW/m² (微瓦/平方公尺 / Microwatts/m²) [Space]
  * `erg_per_cm2_s`：erg/(cm²·s) [CGS]
* **對應可搜尋關鍵字**：
  `坡印廷`, `坡印廷能通量`, `能流密度`, `電磁能流`, `poynting`, `poynting_flux`, `S`, `W/m2`, `W/m²`, `mW/m2`, `mW/m²`, `uW/m2`, `μW/m²`, `erg/(cm2*s)`, `watt`, `瓦特`, `基本場量`

#### 13. 電漿貝他值 (無因次比值) — `plasma_beta`
* **符號**：`β`
* **英文名稱**：Plasma Beta (β)
* **所屬大類**：熱力學與壓力能量（Thermodynamics & Energy）
* **支援單位**：
  * `dimensionless`：無因次 (純數值 / Pure number) [SI]
* **對應可搜尋關鍵字**：
  `貝他`, `電漿貝他`, `貝塔`, `無因次`, `比值`, `beta`, `plasma_beta`, `β`, `dimensionless`, `P_th/P_B`, `熱壓磁壓比`, `熱力學`

---

## 第二部分：太空物理方程式計算庫（共 17 個方程式）

### 總覽清單

| 編號 | 方程式 ID | 中文名稱 | 英文名稱 | 所屬分類 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `gyro_frequency` | 迴旋頻率 (回旋/拉莫爾頻率) | Gyro-frequency (Cyclotron / Larmor Frequency) | 單粒子運動 |
| 2 | `gyro_radius` | 迴旋半徑 (Gyroradius / 拉莫爾半徑 - 依能量 E_⊥) | Gyroradius (Larmor Radius - from Energy E_⊥) | 單粒子運動 |
| 3 | `gyro_radius_velocity` | 迴旋半徑 (Gyroradius - 依垂直速度 v_⊥) | Gyroradius from Velocity (v_⊥) | 單粒子運動 |
| 4 | `magnetic_moment` | 磁矩 (第一絕熱不變量) | Magnetic Moment (First Adiabatic Invariant) | 單粒子運動 |
| 5 | `exb_drift` | E × B 漂移速度 | E × B Drift Velocity | 單粒子運動 |
| 6 | `gradient_curvature_drift` | 梯度與曲率漂移速度 (∇B & Curvature Drift) | Gradient-B & Curvature Drift | 單粒子運動 |
| 7 | `alfven_speed` | 阿爾芬速度 (Alfvén Speed) | Alfvén Speed (v_A) | MHD 磁流體與波動 |
| 8 | `sound_speed` | 離子聲速 (Ion Sound Speed) | Ion Sound Speed (c_s) | MHD 磁流體與波動 |
| 9 | `plasma_beta_calc` | 電漿貝他值 (Plasma Beta, β) | Plasma Beta (β) | MHD 磁流體與波動 |
| 10 | `plasma_frequency` | 電漿頻率 (朗繆爾頻率) | Plasma Frequency (ω_p) | 電漿特徵頻率與尺度 |
| 11 | `debye_length` | 德拜長度與德拜球 (Debye Length & Sphere) | Debye Length & Debye Sphere | 電漿特徵頻率與尺度 |
| 12 | `inertial_lengths` | 慣性長度 (Skin Depth / 趨膚深度) | Inertial Lengths (Skin Depths) | 電漿特徵頻率與尺度 |
| 13 | `rankine_hugoniot` | Rankine-Hugoniot 激波跳躍條件 (震波跳躍條件) | Rankine-Hugoniot Shock Jump Conditions | 震波跳躍條件 |
| 14 | `maxwellian_distribution` | 馬克士威速度分布 (Maxwellian Distribution) | Maxwellian Velocity Distribution | 速度分布 |
| 15 | `kappa_distribution` | 卡帕速度分布 (Standard Kappa Distribution) | Standard Kappa Distribution | 速度分布 |
| 16 | `regularized_kappa` | 正則化卡帕分布 (Regularized Kappa Distribution, RKD) | Regularized Kappa Distribution (RKD) | 速度分布 |
| 17 | `poynting_energy_density` | 坡印廷向量與電磁能通量 | Poynting Flux & Electromagnetic Energy | 馬克士威與電磁場能量 |

---

### 各方程式詳細規格與可檢索關鍵字

#### 1. 迴旋頻率 (回旋/拉莫爾頻率) — `gyro_frequency`
* **分類**：單粒子運動 (`particle_motion`)
* **數學式**：$\omega_c = \frac{|q| B}{m}, \quad f_c = \frac{\omega_c}{2\pi}$
* **輸入參數**：
  * `particle`：粒子種類（電子 e⁻、質子 p⁺、Alpha 粒子 He²⁺、氧離子 O⁺）
  * `B`：磁場強度
* **對應可搜尋關鍵字**：
  `迴旋頻率`, `回旋頻率`, `拉莫爾頻率`, `拉摩爾`, `迴旋`, `回旋`, `gyro`, `gyro_frequency`, `gyrofrequency`, `cyclotron`, `larmor`, `omega_c`, `\omega_c`, `f_c`, `頻率`, `粒子運動`

#### 2. 迴旋半徑 (Gyroradius - 依能量 E_⊥) — `gyro_radius`
* **分類**：單粒子運動 (`particle_motion`)
* **數學式**：$r_g = \frac{m v_\perp}{|q| B} = \frac{\sqrt{2 m E_\perp}}{|q| B} = \frac{\sqrt{2 m k_B T_\perp}}{|q| B}$
* **輸入參數**：
  * `particle`：粒子種類（電子、質子、Alpha、氧離子）
  * `B`：磁場強度
  * `energy_or_v`：垂直動能 $E_\perp$ (eV / keV / J)
* **對應可搜尋關鍵字**：
  `迴旋半徑`, `回旋半徑`, `拉莫爾半徑`, `拉摩爾`, `gyroradius`, `gyro_radius`, `larmor radius`, `larmor`, `cyclotron radius`, `r_g`, `r_L`, `垂直動能`, `磁剛度`, `rigidity`, `粒子運動`

#### 3. 迴旋半徑 (Gyroradius - 依垂直速度 v_⊥) — `gyro_radius_velocity`
* **分類**：單粒子運動 (`particle_motion`)
* **數學式**：$r_g = \frac{m v_\perp}{|q| B}$
* **輸入參數**：
  * `particle`：粒子種類（電子、質子、Alpha、氧離子）
  * `B`：磁場強度
  * `v_perp`：垂直運動速度 $v_\perp$ (km/s / m/s)
* **對應可搜尋關鍵字**：
  `迴旋半徑`, `回旋半徑`, `速度計算迴旋半徑`, `gyroradius`, `gyro_radius_velocity`, `v_perp`, `r_g`, `垂直速度`, `粒子運動`

#### 4. 磁矩 (第一絕熱不變量) — `magnetic_moment`
* **分類**：單粒子運動 (`particle_motion`)
* **數學式**：$\mu = \frac{m v_\perp^2}{2 B} = \frac{W_\perp}{B}$
* **輸入參數**：
  * `particle`：粒子種類
  * `B`：磁場強度
  * `v_perp`：垂直速度
* **對應可搜尋關鍵字**：
  `磁矩`, `第一絕熱不變量`, `絕熱不變量`, `magnetic_moment`, `adiabatic`, `mu`, `\mu`, `W_perp/B`, `鏡像力`, `磁鏡`, `粒子運動`

#### 5. E × B 漂移速度 — `exb_drift`
* **分類**：單粒子運動 (`particle_motion`)
* **數學式**：$\mathbf{v}_E = \frac{\mathbf{E} \times \mathbf{B}}{B^2}, \quad v_E = \frac{E_\perp}{B}$
* **輸入參數**：
  * `E`：垂直電場強度 $E_\perp$
  * `B`：磁場強度 $B$
* **對應可搜尋關鍵字**：
  `exb`, `e cross b`, `E×B`, `E*B`, `exb_drift`, `電場漂移`, `漂移速度`, `對流漂移`, `v_E`, `\mathbf{v}_E`, `粒子運動`

#### 6. 梯度與曲率漂移速度 (∇B & Curvature Drift) — `gradient_curvature_drift`
* **分類**：單粒子運動 (`particle_motion`)
* **數學式**：$v_d = \frac{W_\perp}{q B L_B} + \frac{2 W_\parallel}{q B R_c}$
* **輸入參數**：
  * `particle`：粒子種類
  * `B`：局部磁場強度
  * `W_perp`：垂直動能
  * `W_para`：平行動能
  * `L_B`：磁場梯度特徵長度
  * `R_c`：磁力線曲率半徑
* **對應可搜尋關鍵字**：
  `梯度漂移`, `曲率漂移`, `導心漂移`, `環電流漂移`, `gradient_curvature_drift`, `grad b`, `curvature`, `v_d`, `L_B`, `R_c`, `粒子運動`

#### 7. 阿爾芬速度 (Alfvén Speed) — `alfven_speed`
* **分類**：MHD 磁流體與波動 (`waves_mhd`)
* **數學式**：$v_A = \frac{B}{\sqrt{\mu_0 \rho}} = \frac{B}{\sqrt{\mu_0 n_i m_i}}$
* **輸入參數**：
  * `B`：磁場強度
  * `n_i`：離子數密度
  * `ion_mass`：離子質量種類（質子 p⁺、氦離子 He²⁺、氧離子 O⁺）
* **對應可搜尋關鍵字**：
  `阿爾芬`, `阿爾芬速度`, `阿爾芬波`, `alfven`, `alfven_speed`, `alfvén`, `v_A`, `mu_0`, `rho`, `質子密度`, `MHD`, `磁流體`, `波動`

#### 8. 離子聲速 (Ion Sound Speed) — `sound_speed`
* **分類**：MHD 磁流體與波動 (`waves_mhd`)
* **數學式**：$c_s = \sqrt{\frac{\gamma_e k_B T_e + \gamma_i k_B T_i}{m_i}} \approx \sqrt{\frac{\gamma k_B T}{m_i}}$
* **輸入參數**：
  * `T`：電漿溫度
  * `gamma`：絕熱指數 $\gamma$ (預設 5/3)
  * `ion_mass`：離子質量種類
* **對應可搜尋關鍵字**：
  `離子聲速`, `聲速`, `音速`, `sound_speed`, `acoustic`, `c_s`, `gamma`, `絕熱指數`, `MHD`, `磁流體`, `波動`

#### 9. 電漿貝他值 (Plasma Beta, β) — `plasma_beta_calc`
* **分類**：MHD 磁流體與波動 (`waves_mhd`)
* **數學式**：$\beta = \frac{P_{thermal}}{P_B} = \frac{n k_B (T_e + T_i)}{\frac{B^2}{2\mu_0}}$
* **輸入參數**：
  * `n`：電漿密度
  * `T`：總溫度 $(T_e + T_i)$
  * `B`：磁場強度
* **對應可搜尋關鍵字**：
  `電漿貝他`, `貝他值`, `貝塔`, `beta`, `plasma_beta_calc`, `plasma_beta`, `β`, `P_th`, `P_B`, `熱壓`, `磁壓`, `熱壓磁壓比`, `MHD`

#### 10. 電漿頻率 (朗繆爾頻率) — `plasma_frequency`
* **分類**：電漿特徵頻率與尺度 (`characteristic_scales`)
* **數學式**：$\omega_{pe} = \sqrt{\frac{n_e e^2}{\varepsilon_0 m_e}}, \quad f_{pe} \approx 8980 \sqrt{n_e [\text{cm}^{-3}]} \text{ Hz}$
* **輸入參數**：
  * `n_e`：電子數密度
* **對應可搜尋關鍵字**：
  `電漿頻率`, `朗繆爾頻率`, `朗繆爾`, `朗謬爾`, `plasma_frequency`, `langmuir`, `omega_pe`, `\omega_{pe}`, `f_pe`, `8980`, `特徵頻率`, `尺度`

#### 11. 德拜長度與德拜球 (Debye Length & Sphere) — `debye_length`
* **分類**：電漿特徵頻率與尺度 (`characteristic_scales`)
* **數學式**：$\lambda_D = \sqrt{\frac{\varepsilon_0 k_B T_e}{n_e e^2}} \approx 7430 \sqrt{\frac{T_e [\text{eV}]}{n_e [\text{cm}^{-3}]}} \text{ mm}$
* **輸入參數**：
  * `n_e`：電子數密度
  * `T_e`：電子溫度 (eV / K)
* **對應可搜尋關鍵字**：
  `德拜長度`, `德拜球`, `德拜遮蔽`, `德拜`, `debye`, `debye_length`, `lambda_D`, `\lambda_D`, `N_D`, `準中性`, `屏蔽長度`, `7430`, `尺度`

#### 12. 慣性長度 (Skin Depth / 趨膚深度) — `inertial_lengths`
* **分類**：電漿特徵頻率與尺度 (`characteristic_scales`)
* **數學式**：$d_i = \frac{c}{\omega_{pi}} = \sqrt{\frac{m_i}{\mu_0 n_i e^2}}, \quad d_e = \frac{c}{\omega_{pe}}$
* **輸入參數**：
  * `n`：電漿數密度
  * `ion_mass`：離子種類
* **對應可搜尋關鍵字**：
  `慣性長度`, `趨膚深度`, `離子慣性長度`, `電子慣性長度`, `inertial_lengths`, `skin depth`, `inertial skin depth`, `d_i`, `d_e`, `霍爾效應`, `Hall MHD`, `磁重聯擴散區`, `尺度`

#### 13. Rankine-Hugoniot 激波跳躍條件 (震波跳躍條件) — `rankine_hugoniot`
* **分類**：震波跳躍條件 (`jump_conditions`)
* **數學式**：$r = \frac{\rho_2}{\rho_1} = \frac{(\gamma+1) M_1^2}{(\gamma-1) M_1^2 + 2}, \quad \frac{P_2}{P_1} = \frac{2\gamma M_1^2 - (\gamma-1)}{\gamma+1}$
* **輸入參數**：
  * `M1`：上游馬赫數 $M_1$
  * `gamma`：比熱比 $\gamma$ (預設 5/3)
  * `n1`：上游密度 $n_1$
  * `B1`：上游垂直磁場 $B_1$
* **對應可搜尋關鍵字**：
  `震波`, `激波`, `震波跳躍條件`, `激波跳躍條件`, `rankine_hugoniot`, `rankine`, `hugoniot`, `shock`, `jump conditions`, `馬赫數`, `mach`, `M1`, `壓縮比`, `跳躍比`, `弓形震波`, `Bow Shock`

#### 14. 馬克士威速度分布 (Maxwellian Distribution) — `maxwellian_distribution`
* **分類**：速度分布 (`velocity_distributions`)
* **數學式**：$v_{th} = \sqrt{\frac{2 k_B T}{m}}, \quad f_M(v) = n \left(\frac{m}{2\pi k_B T}\right)^{3/2} \exp\left(-\frac{m v^2}{2 k_B T}\right)$
* **輸入參數**：
  * `n`：數密度
  * `T`：溫度
  * `v_eval`：欲估算之粒子速度
  * `particle`：粒子種類
* **對應可搜尋關鍵字**：
  `馬克士威`, `馬克斯威`, `熱平衡分布`, `高斯分布`, `速度分布`, `maxwellian_distribution`, `maxwellian`, `maxwell`, `v_th`, `f_M`, `最概然熱速度`, `方均根速度`

#### 15. 卡帕速度分布 (Standard Kappa Distribution) — `kappa_distribution`
* **分類**：速度分布 (`velocity_distributions`)
* **數學式**：$\theta = \sqrt{\frac{2\kappa - 3}{\kappa} \frac{k_B T}{m}}, \quad f_\kappa(v) = \frac{n}{(\pi\kappa\theta^2)^{3/2}} \frac{\Gamma(\kappa+1)}{\Gamma(\kappa-1/2)} \left(1 + \frac{v^2}{\kappa\theta^2}\right)^{-(\kappa+1)}$
* **輸入參數**：
  * `kappa`：卡帕指數 $\kappa$ (需 > 1.5)
  * `n`：數密度
  * `T`：溫度
  * `v_eval`：評估速度
* **對應可搜尋關鍵字**：
  `卡帕`, `卡帕分布`, `非熱平衡分布`, `超熱粒子`, `冪律尾部`, `kappa_distribution`, `kappa`, `\kappa`, `theta`, `\theta`, `power-law`, `太陽風超熱電子`, `速度分布`

#### 16. 正則化卡帕分布 (Regularized Kappa Distribution, RKD) — `regularized_kappa`
* **分類**：速度分布 (`velocity_distributions`)
* **數學式**：$f_{RKD}(v) = A_{RKD} \left(1 + \frac{v^2}{\kappa\theta^2}\right)^{-(\kappa+1)} \exp\left(-\alpha^2 \frac{v^2}{\theta^2}\right)$
* **輸入參數**：
  * `kappa`：卡帕指數 $\kappa$
  * `alpha`：高能指數截斷因子 $\alpha$
  * `T`：溫度
  * `v_eval`：評估速度
* **對應可搜尋關鍵字**：
  `正則化卡帕`, `正則化卡帕分布`, `RKD`, `截斷卡帕`, `高能截斷`, `regularized_kappa`, `regularized kappa`, `alpha`, `\alpha`, `超高能發散修復`, `速度分布`

#### 17. 坡印廷向量與電磁能通量 — `poynting_energy_density`
* **分類**：馬克士威與電磁場能量 (`electrodynamics`)
* **數學式**：$S = \frac{|\mathbf{E} \times \mathbf{B}|}{\mu_0} = \frac{E_\perp B}{\mu_0}, \quad u_{EM} = \frac{1}{2}\varepsilon_0 E^2 + \frac{B^2}{2\mu_0}$
* **輸入參數**：
  * `E`：電場強度
  * `B`：磁場強度
* **對應可搜尋關鍵字**：
  `坡印廷`, `坡印廷向量`, `電磁能通量`, `能量密度`, `磁能密度`, `電能密度`, `poynting_energy_density`, `poynting`, `S`, `u_B`, `u_E`, `u_{EM}`, `E×B`, `阿爾芬波能流`, `電磁場能量`
