/**
 * js/app-state-store.js - 全域反應式狀態儲存庫與事件總線 (App State Store & Event Bus)
 * 封裝應用程式核心反應式狀態 (語言、主題、作用中分頁、典型環境場景、髒狀態) 與跨模組解耦事件通訊
 */

class AppStateStore {
  /**
   * 內部狀態儲存體
   * @private
   */
  static _state = {
    lang: "zh",
    theme: "dark",
    activeTab: "presets",
    activeEnvironment: null,
    isDirty: false
  };

  /**
   * 狀態變更訂閱監聽器清單
   * @private
   */
  static _listeners = new Set();

  /**
   * 鍵值專屬監聽器字典
   * @private
   */
  static _keyListeners = new Map();

  /**
   * 事件總線處理器字典
   * @private
   */
  static _eventHandlers = new Map();

  /**
   * 初始化儲存庫，自持久化媒介還原或偵測系統設定
   */
  static init() {
    let savedLang = "zh";
    let savedTheme = "dark";

    if (typeof localStorage !== "undefined") {
      try {
        const storedLang = localStorage.getItem("sp_lang");
        if (storedLang === "zh" || storedLang === "en") {
          savedLang = storedLang;
        }
        const storedTheme = localStorage.getItem("sp_theme");
        if (storedTheme === "dark" || storedTheme === "light") {
          savedTheme = storedTheme;
        }
      } catch (e) {
        // 忽略私密瀏覽或受限環境例外
      }
    }

    this._state = {
      lang: savedLang,
      theme: savedTheme,
      activeTab: "presets",
      activeEnvironment: null,
      isDirty: false
    };
  }

  /**
   * 取得當前狀態之淺拷貝不可變快照
   * @returns {Object} 狀態物件快照
   */
  static getSnapshot() {
    return Object.freeze({ ...this._state });
  }

  /**
   * 取得當前狀態之別名
   * @returns {Object}
   */
  static getState() {
    return this.getSnapshot();
  }

  /**
   * 取得特定狀態屬性
   * @param {string} key - 屬性名稱
   * @returns {*} 屬性數值
   */
  static get(key) {
    return this._state[key];
  }

  /**
   * 內部狀態變異與廣播機制
   * @private
   * @param {Object} partialState - 部分更新之狀態
   */
  static _setState(partialState) {
    const prevState = { ...this._state };
    const changedKeys = [];

    for (const key of Object.keys(partialState)) {
      if (this._state[key] !== partialState[key]) {
        this._state[key] = partialState[key];
        changedKeys.push(key);
      }
    }

    if (changedKeys.length === 0) return;

    const currentSnapshot = this.getSnapshot();

    // 觸發全域訂閱者
    for (const listener of this._listeners) {
      try {
        listener(currentSnapshot, changedKeys, prevState);
      } catch (err) {
        console.error("Error in AppStateStore subscriber:", err);
      }
    }

    // 觸發單一鍵值訂閱者
    for (const key of changedKeys) {
      const listeners = this._keyListeners.get(key);
      if (listeners) {
        for (const kListener of listeners) {
          try {
            kListener(this._state[key], prevState[key], currentSnapshot);
          } catch (err) {
            console.error(`Error in AppStateStore key subscriber (${key}):`, err);
          }
        }
      }
    }
  }

  /**
   * 訂閱全域狀態變更
   * @param {Function} listener - 回呼函式 (snapshot, changedKeys, prevState) => void
   * @returns {Function} 取消訂閱函式
   */
  static subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * 訂閱特定鍵值變更
   * @param {string} key - 狀態鍵名稱 (如 'lang', 'theme', 'activeTab')
   * @param {Function} listener - 回呼函式 (newValue, prevValue, snapshot) => void
   * @returns {Function} 取消訂閱函式
   */
  static subscribeKey(key, listener) {
    if (typeof listener !== "function") return () => {};
    if (!this._keyListeners.has(key)) {
      this._keyListeners.set(key, new Set());
    }
    const set = this._keyListeners.get(key);
    set.add(listener);
    return () => set.delete(listener);
  }

  /**
   * 設定介面語言
   * @param {string} lang - 'zh' 或 'en'
   */
  static setLanguage(lang) {
    const targetLang = (lang === "en") ? "en" : "zh";
    if (this._state.lang === targetLang) return;

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("sp_lang", targetLang);
      } catch (e) {}
    }

    this._setState({ lang: targetLang });
    this.emit("langChange", { lang: targetLang });
  }

  /**
   * 切換介面語言 (zh <-> en)
   * @returns {string} 切換後語言
   */
  static toggleLanguage() {
    const nextLang = this._state.lang === "zh" ? "en" : "zh";
    this.setLanguage(nextLang);
    return nextLang;
  }

  /**
   * 設定主題外觀
   * @param {string} theme - 'dark' 或 'light'
   */
  static setTheme(theme) {
    const targetTheme = (theme === "light") ? "light" : "dark";
    if (this._state.theme === targetTheme) return;

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("sp_theme", targetTheme);
      } catch (e) {}
    }

    this._setState({ theme: targetTheme });
    this.emit("themeChange", { theme: targetTheme });
  }

  /**
   * 切換深淺色主題 (dark <-> light)
   * @returns {string} 切換後主題
   */
  static toggleTheme() {
    const nextTheme = this._state.theme === "dark" ? "light" : "dark";
    this.setTheme(nextTheme);
    return nextTheme;
  }

  /**
   * 設定作用中分頁
   * @param {string} tabKey - 'presets' | 'builder' | 'units'
   */
  static setActiveTab(tabKey) {
    const validTabs = ["presets", "builder", "units"];
    const targetTab = validTabs.includes(tabKey) ? tabKey : "presets";
    if (this._state.activeTab === targetTab) return;

    this._setState({ activeTab: targetTab });
    this.emit("tabChange", { tab: targetTab });
  }

  /**
   * 設定典型環境場景識別碼與髒狀態
   * @param {string|null} envId - 場景識別碼 (如 'solar_wind_1au')
   * @param {boolean} [isDirty=false] - 參數是否偏離基準態
   */
  static setEnvironment(envId, isDirty = false) {
    this._setState({
      activeEnvironment: envId,
      isDirty: !!isDirty
    });
    this.emit("environmentChange", { envId, isDirty });
  }

  /**
   * 設定參數偏離之髒狀態
   * @param {boolean} isDirty - 是否為髒狀態
   */
  static setDirty(isDirty) {
    const dirtyBool = !!isDirty;
    if (this._state.isDirty === dirtyBool) return;
    this._setState({ isDirty: dirtyBool });
    this.emit("dirtyStateChange", { isDirty: dirtyBool });
  }

  /**
   * 事件總線：監聽事件
   * @param {string} event - 事件識別名稱
   * @param {Function} handler - 處理函式 (data) => void
   * @returns {Function} 取消監聽函式
   */
  static on(event, handler) {
    if (!event || typeof handler !== "function") return () => {};
    if (!this._eventHandlers.has(event)) {
      this._eventHandlers.set(event, new Set());
    }
    const handlers = this._eventHandlers.get(event);
    handlers.add(handler);
    return () => handlers.delete(handler);
  }

  /**
   * 事件總線：移除監聽
   * @param {string} event - 事件名稱
   * @param {Function} handler - 欲移除之處理函式
   */
  static off(event, handler) {
    const handlers = this._eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 事件總線：廣播發布事件
   * @param {string} event - 事件名稱
   * @param {*} [data] - 附加資料
   */
  static emit(event, data) {
    const handlers = this._eventHandlers.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (err) {
        console.error(`Error in AppStateStore event handler (${event}):`, err);
      }
    }
  }

  /**
   * 重置儲存庫至初始狀態 (測試輔助用途)
   */
  static reset() {
    this._state = {
      lang: "zh",
      theme: "dark",
      activeTab: "presets",
      activeEnvironment: null,
      isDirty: false
    };
    this._listeners.clear();
    this._keyListeners.clear();
    this._eventHandlers.clear();
  }
}

// 預設執行自我初始化
AppStateStore.init();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AppStateStore };
}
