# 0011. Unify Cross-System Unit Conversions and Physical Constants into UnitSystemEngine

## Status
Accepted

## Context
In the physical quantity lookup and conversion tab, `tab-lookup.js` performed low-level arithmetic transformations, floating-point scaling, and exponent normalization for search queries directly inside UI event callbacks. Concurrently, physical constants were hardcoded strictly in SI units in `constants.js`, forcing plasma physics users and external consumers to manually compute conversions between CGS (Gaussian/esu/emu), SI, and Space Physics operational units (e.g., $\text{nT}$, $\text{eV}$, $\text{km/s}$, $\text{cm}^{-3}$). This scattered conversion logic made headless testing difficult and created risk of precision loss or inconsistent scaling factors across modules.

## Decision
1. Extract a pure, DOM-free deep module `UnitSystemEngine` in `js/unit-system-engine.js`.
2. Provide a single, comprehensive conversion seam: `convert(value, fromUnitId, toUnitId, quantityIdOrCategory) => { value, formattedValue, factor, formattedFactor, fromUnit, toUnit, quantity, isExact }`.
3. Encapsulate multi-system physical constant lookup (`getConstant(constantId, targetSystem = 'SI')`) supporting SI, CGS, and Space Physics representations for fundamental constants ($c$, $e$, $k_B$, $m_p$, $m_e$, $\mu_0$, $\varepsilon_0$, $G$, $R_E$, $\text{AU}$).
4. Encapsulate exponent-normalized query parsing and multi-field matching (`searchQuantities(keyword)`) inside `UnitSystemEngine`, handling superscript exponents ($\text{cm}^{-3} \leftrightarrow \text{cm⁻³}$).
5. Demote `tab-lookup.js` to a pure view adapter, reducing its size from 433 lines to 389 lines, delegating all conversion math, search filtering, and unit specs to `UnitSystemEngine`.
6. Establish an automated headless test suite (`tests/test-unit-system-engine.js`) verifying conversions, constant queries, and query normalization across all three unit systems.
