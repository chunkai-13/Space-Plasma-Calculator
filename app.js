/**
 * app.js - 應用程式主控入口
 * 負責頂部導覽列、Tab 互斥切換與網址 Hash 同步、深淺色主題、多語系切換與控制器調度：
 *   - ModernUIController (js/app-ui.js)
 *   - BuilderTabController (js/tab-builder.js)
 *   - LookupTabController (js/tab-lookup.js)
 *   - EquationsTabController (js/tab-equations.js)
 */

class SpacePlasmaApp {
  constructor() {
    this.currentLang = localStorage.getItem("sp_lang") || "zh";
    this.currentTheme = localStorage.getItem("sp_theme") || "dark";
    this.calculator = new PlasmaCustomCalculator();

    this.initDOM();
    this.initControllers();
    this.bindEvents();

    this.applyTheme(this.currentTheme);
    this.applyLanguage(this.currentLang);

    // 依據 URL Hash 初始化 Tab 狀態 (預設首頁為 presets)
    this.initTabFromHash();
    window.addEventListener("hashchange", () => this.initTabFromHash());
  }

  initDOM() {
    this.tabBtns = document.querySelectorAll(".tab-btn");
    this.tabContents = document.querySelectorAll(".tab-content");
    this.themeToggleBtn = document.getElementById("theme-toggle-btn");
    this.langToggleBtn = document.getElementById("lang-toggle-btn");
  }

  initControllers() {
    this.presetState = new PresetStateManager(this);
    this.modernUI = new ModernUIController(this);
    this.builderTab = new BuilderTabController(this);
    this.lookupTab = new LookupTabController(this);
    this.equationsTab = new EquationsTabController(this);
  }

  initTabFromHash() {
    const rawHash = window.location.hash.replace("#section-", "").replace("#", "").trim();
    const validTabs = ["presets", "builder", "units"];
    const targetTab = validTabs.includes(rawHash) ? rawHash : "presets";
    this.switchTab(targetTab, false);
  }

  // 互斥切換工作區 Tab (純 CSS 顯示/隱藏，絕不銷毀 DOM 以保全計算狀態)
  switchTab(tabKey, updateHash = true) {
    const validTabs = ["presets", "builder", "units"];
    const activeTab = validTabs.includes(tabKey) ? tabKey : "presets";

    if (this.tabBtns) {
      this.tabBtns.forEach(b => {
        const isMatch = b.getAttribute("data-tab") === activeTab;
        b.classList.toggle("active", isMatch);
        b.setAttribute("aria-selected", isMatch ? "true" : "false");
        b.setAttribute("tabindex", isMatch ? "0" : "-1");
      });
    }

    if (this.tabContents) {
      this.tabContents.forEach(c => {
        const isTarget = c.id === `section-${activeTab}` || c.getAttribute("data-tab-pane") === activeTab;
        c.classList.toggle("active", isTarget);
      });
    }

    if (updateHash && window.location.hash !== `#${activeTab}`) {
      window.location.hash = activeTab;
    }
  }

  bindEvents() {
    // 1. 分頁導覽：點擊與 WAI-ARIA 鍵盤導覽 (Roving Tabindex)
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const targetTab = btn.getAttribute("data-tab");
          this.switchTab(targetTab, true);
        });
      });
    }

    const tablistNav = document.getElementById("main-tabs-nav") || document.querySelector('[role="tablist"]');
    if (tablistNav) {
      tablistNav.addEventListener("keydown", (e) => {
        const tabs = Array.from(tablistNav.querySelectorAll('[role="tab"]'));
        if (!tabs.length) return;

        const currentIndex = tabs.indexOf(document.activeElement);
        if (currentIndex === -1) return;

        let nextIndex = null;
        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            nextIndex = (currentIndex + 1) % tabs.length;
            break;
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            break;
          case "Home":
            e.preventDefault();
            nextIndex = 0;
            break;
          case "End":
            e.preventDefault();
            nextIndex = tabs.length - 1;
            break;
          default:
            return;
        }

        if (nextIndex !== null) {
          const targetTab = tabs[nextIndex];
          targetTab.focus();
          const targetKey = targetTab.getAttribute("data-tab");
          this.switchTab(targetKey, true);
        }
      });
    }

    // 2. 深淺色主題切換
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener("click", () => {
        this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
        this.applyTheme(this.currentTheme);
      });
    }

    // 3. 語言切換
    if (this.langToggleBtn) {
      this.langToggleBtn.addEventListener("click", () => {
        this.currentLang = this.currentLang === "zh" ? "en" : "zh";
        this.applyLanguage(this.currentLang);
      });
    }

    // 4. 太空環境典型預設場景代入與還原
    document.querySelectorAll(".env-pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const presetId = btn.getAttribute("data-env-preset");
        if (this.presetState) {
          this.presetState.applyPreset(presetId);
        } else if (this.modernUI) {
          this.modernUI.applyEnvironmentPreset(presetId);
        }
      });
    });

    const btnResetEnv = document.getElementById("btn-reset-env-preset");
    if (btnResetEnv) {
      btnResetEnv.addEventListener("click", () => {
        if (this.presetState) {
          this.presetState.resetToPreset();
        }
      });
    }

    // 5. 方程式篩選標籤快速過濾
    document.querySelectorAll(".eq-filter-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".eq-filter-pill").forEach(p => p.classList.toggle("active", p === pill));
        const cat = pill.getAttribute("data-cat");
        if (this.equationsTab) {
          this.equationsTab.filterEquationsByCategory(cat);
        }
      });
    });

    // 6. 雙模公式建構：單一資料源 (SSOT) 雙向綁定
    const latexInput = document.getElementById("latex-quick-input");
    const btnParseLatex = document.getElementById("btn-parse-latex");
    if (latexInput) {
      // 鍵盤輸入即時解析更新畫布與因次檢查 (保持游標不跳動)
      latexInput.addEventListener("input", (e) => {
        if (this.modernUI) {
          this.modernUI.syncFromLatexInput(e.target.value);
        }
      });
      latexInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (this.modernUI) {
            this.modernUI.syncFromLatexInput(latexInput.value);
            this.modernUI.syncToLatexInput({ force: true });
          }
        }
      });
    }
    if (btnParseLatex && latexInput) {
      btnParseLatex.addEventListener("click", () => {
        if (this.modernUI) {
          this.modernUI.syncFromLatexInput(latexInput.value);
          this.modernUI.syncToLatexInput({ force: true });
        }
      });
    }

    // 7. 符號庫分類標籤切換與點擊插入 (更新狀態並反向回填 LaTeX)
    if (this.modernUI) {
      this.modernUI.initSymbolPillTabs();
    }
    document.querySelectorAll(".symbol-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const symType = pill.getAttribute("data-sym-type");
        const symId = pill.getAttribute("data-sym-id");
        if (symType === "constant") {
          this.calculator.addConstant(symId);
        } else if (symType === "quantity") {
          this.calculator.addQuantity(symId);
        } else if (symType === "operator") {
          this.calculator.insertOperator(symId);
        } else if (symType === "fraction") {
          this.calculator.insertFraction();
        } else if (symType === "open_paren") {
          this.calculator.insertOpenParen();
        } else if (symType === "close_paren") {
          this.calculator.insertCloseParen(1);
        }

        if (this.builderTab) {
          this.builderTab.renderTermsList();
          if (this.builderTab.previewUI) {
            this.builderTab.previewUI.updateEquationPreview();
          }
        }
        if (this.modernUI) {
          this.modernUI.syncToLatexInput();
        }
      });
    });

    // 8. 自訂工作台經典範例點擊
    document.querySelectorAll(".preset-btn[data-preset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-preset");
        if (this.builderTab) {
          this.builderTab.loadPresetFormula(pid);
          if (this.modernUI) {
            this.modernUI.syncToLatexInput();
          }
        }
      });
    });

    // 9. 清空與計算按鈕
    const btnClear = document.getElementById("btn-clear-terms");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        this.calculator.clear();
        if (this.modernUI) {
          this.modernUI.syncToLatexInput();
        }
      });
    }
    const btnEqual = document.getElementById("btn-equal");
    if (btnEqual) {
      btnEqual.addEventListener("click", () => {
        if (this.builderTab) {
          const res = this.calculator.compute();
          this.builderTab.renderResultBox(res);
          if (this.modernUI) {
            this.modernUI.updateDimensionBadge();
          }
        }
      });
    }
  }

  // 主題樣式設定
  applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      if (this.themeToggleBtn) {
        this.themeToggleBtn.innerHTML = `<span class="icon">☀️</span> <span class="theme-text">${I18N[this.currentLang].lightMode}</span>`;
      }
    } else {
      document.documentElement.classList.remove("dark");
      if (this.themeToggleBtn) {
        this.themeToggleBtn.innerHTML = `<span class="icon">🌙</span> <span class="theme-text">${I18N[this.currentLang].darkMode}</span>`;
      }
    }
    localStorage.setItem("sp_theme", theme);
  }

  // 多語系切換與各分頁重新渲染
  applyLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem("sp_lang", lang);
    const dict = I18N[lang] || I18N.zh;
    window.dict = dict;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict && dict[key]) {
        if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
          el.setAttribute("placeholder", dict[key]);
        } else {
          el.textContent = dict[key];
        }
      }
    });

    if (this.langToggleBtn && dict) {
      this.langToggleBtn.textContent = dict.langName;
    }
    this.applyTheme(this.currentTheme);

    if (this.builderTab && this.builderTab.previewUI) {
      this.builderTab.previewUI.updateEquationPreview();
    }
    if (this.lookupTab) {
      this.lookupTab.render();
    }
    if (this.equationsTab) {
      this.equationsTab.render();
    }
    if (this.modernUI) {
      this.modernUI.updateDimensionBadge();
    }
    if (this.presetState) {
      this.presetState.updateUIState();
    }
  }
}

// 應用程式初始化
document.addEventListener("DOMContentLoaded", () => {
  window.app = new SpacePlasmaApp();
});
