# Implementation Plan: System Architecture Refactoring & Alumni Simulation

## Phase 4: AppContext Facade Pattern (Completed)
- **Status**: Completed & Verified.
- Created 9 specialized domain contexts in `src/context/`:
  1. `ThemeContext.tsx`
  2. `SecurityAndOpsContext.tsx`
  3. `AuthContext.tsx`
  4. `CartableContext.tsx`
  5. `CoursesContext.tsx`
  6. `ProductsContext.tsx`
  7. `CounselingContext.tsx`
  8. `WelfareContext.tsx`
  9. `ResearchAndRulingsContext.tsx`
- Refactored `src/context/AppContext.tsx` into a clean Facade Provider with nested domain providers and `useMemo` stabilization.
- Verified across 60 consumer components with 0 errors.

## Phase 5: Theme Customizer Decomposition (Completed)
- **Status**: Completed & Verified.
- Refactored `src/components/admin/ThemeCustomizerModal.tsx` (2,862 lines) into 9 modular subcomponents under `src/components/admin/theme_customizer_subcomponents/`:
  1. `CustomizerTabBar.tsx`: 15-tab navigation bar.
  2. `CustomizerModulesTab.tsx`: Section re-ordering and module toggles.
  3. `CustomizerRulingsTab.tsx`: Rulings showcase and custom list management.
  4. `CustomizerResearchTab.tsx`: Research promo showcase and 4-card grant config.
  5. `CustomizerShowcaseTabs.tsx`: Courses, counseling, welfare, books, and multimedia showcase editors.
  6. `CustomizerHeroStatsTab.tsx`: Hero banner and 4-stat VIP counters editor.
  7. `CustomizerFontsTab.tsx`: Section-by-section font size scaler.
  8. `CustomizerBentoCardsTab.tsx`: 9 Bento Grid cards ordering, size, and content editor.
  9. `CustomizerStylingModesTab.tsx`: Canvas theme palettes, course/publication layout modes, and titles.
- Rewrote `ThemeCustomizerModal.tsx` into a clean 260-line orchestrator.
- **Verification**: `npx -p typescript tsc --noEmit` passed with 0 errors; `npx vite build` compiled in 1.89s with clean code-split chunk `ThemeCustomizerModal-DyKlukGh.js`.

## Admin Alumni View Simulation Feature (Completed)
- **Status**: Completed & Verified.
- Added button in `AdminControlCenter.tsx` header: "مشاهده سامانه از دید دانش‌آموختگان".
- Added floating return bar in `CrextioLayout.tsx` and `MizanLayout.tsx` when simulated as alumni: "بازگشت به پنل مدیریت".
