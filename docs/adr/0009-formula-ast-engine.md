# 0009. Deepen Formula AST Engine and Encapsulate Token Mutation

## Status
Accepted

## Context
In the custom formula builder, raw AST arrays (`calc.tokens`) were directly exposed to multiple presentation modules (`builder-cards-list.js`, `builder-cards-items.js`, `builder-preview.js`, `app-ui.js`). UI callers manually traversed nested token paths, resolved fraction numerator/denominator indices, and managed undo/redo arrays, leaking implementation details across the seam and bloating view controllers.

## Decision
1. Collapse the formula AST evaluation, formatting, dimensional checks, and token manipulation into a deep `FormulaASTEngine` module.
2. Encapsulate all AST node mutations behind an opaque document interface with direct semantic methods (`insertTerm`, `removeTerm`, `insertFraction`, `insertParentheses`, `clear`, `loadPreset`, `parseFromLatex`).
3. Maintain the Undo/Redo snapshot history stack and the active insertion slot path inside `FormulaASTEngine`.
4. Provide a single reactive observer seam (`subscribe`) broadcasting immutable state snapshots (`{ latex, result, dimensionState, canUndo, canRedo }`) to decouple UI components.
5. In accordance with the 500-line hard code limit, organize `FormulaASTEngine` with a single public facade entry point while delegating evaluation, LaTeX formatting, and dimensional validation to private internal adapters.
6. Provide a backward-compatible adapter alias (`PlasmaCustomCalculator`) to guarantee zero-downtime incremental migration across existing call sites.
