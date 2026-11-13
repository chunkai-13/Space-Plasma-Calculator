# Space Plasma Calculator

Single-page progressive web application for space plasma calculations, dimensional verification, and unit conversions.

## Language

**Formula Document**:
The complete in-memory abstract syntax tree representing an authored physical formula in the custom builder.
_Avoid_: Equation state, token list, formula model

**Term Node**:
An atomic node within a Formula Document, such as a physical quantity, physical constant, operator, parenthesis, or fraction slot.
_Avoid_: Token, item, element

**Formula AST Engine**:
The deep module encapsulating the creation, mutation, history stack, LaTeX representation, dimensional consistency, and numerical evaluation of a Formula Document.
_Avoid_: Calculator core, formula builder, evaluator service

**Physical Context Meter**:
The logarithmic benchmark scale comparing a computed physical quantity against typical space environments (solar wind, magnetosphere, ionosphere).
_Avoid_: Range gauge, scale slider, magnitude bar

**Equation Solver**:
The deep module encapsulating physical boundary assertions, unit normalization, numerical evaluation, alternative unit scaling, and physical context meter metric resolution for predefined space plasma equations.
_Avoid_: Equation controller, equation manager, formula evaluator service

**Unit System Engine**:
The deep module encapsulating cross-system unit conversions (SI, CGS, Space Physics), numerical formatting, exponent normalization search, and multi-system physical constant lookup.
_Avoid_: Unit converter helper, constants directory, lookup utility

**App State Store**:
The deep module encapsulating the single source of truth for reactive global application state (language, theme, active tab, environment preset, dirty state), persistent storage, state subscription, and cross-module decoupled event dispatching.
_Avoid_: Global state object, event bus utility, app state manager, app config
