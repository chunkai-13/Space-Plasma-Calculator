# 0010. Deepen Physics Presets Engine and Decouple Calculation from DOM Presentation

## Status
Accepted

## Context
In the formula presets tab, `tab-equations.js` reached 496 lines (4 lines from the 500-line hard project ceiling) because it functioned both as the UI presentation layer and the physics orchestrator. Parameter boundary assertions ($B \le 0$, $n \le 0$, $T < 0$), numerical evaluations, alternative unit mapping, unit system detections, and physical context meter scaling were intertwined with DOM rendering templates, preventing automated headless testing of core plasma equations.

## Decision
1. Extract a pure, DOM-free deep module `EquationSolver` in `js/equation-solver.js`.
2. Provide a single evaluation interface: `solve(equationIdOrDef, rawInputs, inputUnits, options) => EquationSolveResult`.
3. Encapsulate all physical boundary guards within `EquationSolver`, returning structured violation objects (`{ hasError: true, errorType: 'BOUNDARY_VIOLATION', message, violatedParamId }`) instead of manipulating DOM error classes directly.
4. Resolve alternative unit systems (SI, CGS, Space) and calculate physical context meter scaling metrics inside `EquationSolver`.
5. Demote `tab-equations.js` to a pure view adapter, reducing its size from 496 lines to under 260 lines.
6. Establish an automated headless unit test suite (`tests/test-equation-solver.js`) covering particle motion, MHD waves, shock jump conditions, and boundary assertion failures.
