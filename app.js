/**
 * app.js - 應用程式主控入口
 * 負責頂部導覽列、深淺色主題、多語系切換與三大功能控制器調度：
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
  }

  initDOM() {
    this.tabBtns = document.querySelectorAll(".tab-btn");
    this.tabContents = document.querySelectorAll(".tab-content");
    this.themeToggleBtn = document.getElementById("theme-toggle-btn");
    this.langToggleBtn = document.getElementById("lang-toggle-btn");
  }

  initControllers() {
    // 實例化三大分頁獨立控制器
    this.builderTab = new BuilderTabController(this);
    this.lookupTab = new LookupTabController(this);
    this.equationsTab = new EquationsTabController(this);
  }

  bindEvents() {
    // 分頁切換
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const targetTab = btn.getAttribute("data-tab");
          this.switchTab(targetTab);
        });
      });
    }

    // 深淺色主題切換
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener("click", () => {
        this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
        this.applyTheme(this.currentTheme);
      });
    }

    // 語言切換
    if (this.langToggleBtn) {
      this.langToggleBtn.addEventListener("click", () => {
        this.currentLang = this.currentLang === "zh" ? "en" : "zh";
        this.applyLanguage(this.currentLang);
      });
    }
  }

  // 切換分頁
  switchTab(tabId) {
    if (this.tabBtns) {
      this.tabBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-tab") === tabId));
    }
    if (this.tabContents) {
      this.tabContents.forEach(c => {
        const isTarget = c.id === `tab-${tabId}`;
        c.classList.toggle("active", isTarget);
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

    // 觸發各控制器更新
    if (this.builderTab) {
      this.builderTab.renderTermsList();
      if (this.builderTab.calculator && this.builderTab.calculator.lastResult) {
        const sysRadio = document.querySelector("input[name='outputSystem']:checked");
        const sys = sysRadio ? sysRadio.value : "Space";
        const res = this.builderTab.calculator.formatResult(sys);
        this.builderTab.renderResultBox(res);
      }
    }
    if (this.lookupTab) {
      this.lookupTab.render();
    }
    if (this.equationsTab) {
      this.equationsTab.render();
    }
  }
}

// 應用程式初始化
document.addEventListener("DOMContentLoaded", () => {
  window.app = new SpacePlasmaApp();
});
