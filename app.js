/**
 * app.js - 應用程式主控入口
 * 負責頂部導覽列、Tab 互斥切換與網址 Hash 同步、深淺色主題、多語系切換與控制器調度
 * 狀態管理全面委派 AppStateStore 單一真實來源 (SSOT)
 */

class SpacePlasmaApp {
  constructor() {
    this.calculator = new PlasmaCustomCalculator();

    this.initDOM();
    this.initControllers();
    this.initStoreSubscriptions();
    this.bindEvents();

    // 依據 AppStateStore 初始狀態進行首次介面同步
    this.applyTheme(AppStateStore.get("theme"));
    this.applyLanguage(AppStateStore.get("lang"));

    // 依據 URL Hash 初始化 Tab 狀態 (預設為 presets)
    this.initTabFromHash();
    window.addEventListener("hashchange", () => this.initTabFromHash());
  }

  // 向後相容屬性存取器：委派 AppStateStore
  get currentLang() {
    return AppStateStore.get("lang");
  }
  set currentLang(val) {
    AppStateStore.setLanguage(val);
  }

  get currentTheme() {
    return AppStateStore.get("theme");
  }
  set currentTheme(val) {
    AppStateStore.setTheme(val);
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

  initStoreSubscriptions() {
    // 訂閱主題變更事件
    AppStateStore.subscribeKey("theme", (theme) => {
      this.applyTheme(theme);
    });

    // 訂閱語言變更事件
    AppStateStore.subscribeKey("lang", (lang) => {
      this.applyLanguage(lang);
    });

    // 訂閱分頁切換事件
    AppStateStore.subscribeKey("activeTab", (tabKey) => {
      this.syncTabDOM(tabKey);
    });
  }

  initTabFromHash() {
    const rawHash = window.location.hash.replace("#section-", "").replace("#", "").trim();
    const validTabs = ["presets", "builder", "units"];
    const targetTab = validTabs.includes(rawHash) ? rawHash : "presets";
    AppStateStore.setActiveTab(targetTab);
    this.syncTabDOM(targetTab, false);
  }

  // 互斥切換工作區 Tab (純 CSS 顯示/隱藏，絕不銷毀 DOM 以保全計算狀態)
  switchTab(tabKey, updateHash = true) {
    const validTabs = ["presets", "builder", "units"];
    const activeTab = validTabs.includes(tabKey) ? tabKey : "presets";

    AppStateStore.setActiveTab(activeTab);
    this.syncTabDOM(activeTab, updateHash);
  }

  syncTabDOM(activeTab, updateHash = true) {
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
        AppStateStore.toggleTheme();
      });
    }

    // 3. 語言切換
    if (this.langToggleBtn) {
      this.langToggleBtn.addEventListener("click", () => {
        AppStateStore.toggleLanguage();
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

    // 7. 符號庫分類標籤切換與點擊插入
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
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);

    if (this.themeToggleBtn) {
      const lang = AppStateStore.get("lang");
      const dict = (typeof I18N !== "undefined" && I18N[lang]) ? I18N[lang] : { lightMode: "淺色模式", darkMode: "深色模式" };
      const modeText = isDark ? dict.lightMode : dict.darkMode;
      const icon = isDark ? "☀️" : "🌙";
      this.themeToggleBtn.innerHTML = `<span class="icon">${icon}</span> <span class="theme-text">${modeText}</span>`;
    }
  }

  // 多語系切換與各分頁重新渲染
  applyLanguage(lang) {
    const dict = (typeof I18N !== "undefined" && I18N[lang]) ? I18N[lang] : (typeof I18N !== "undefined" ? I18N.zh : null);
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
    this.applyTheme(AppStateStore.get("theme"));

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
