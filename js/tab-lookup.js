/**
 * js/tab-lookup.js - 分頁二：物理量查找與即時單位換算控制器 (View Adapter)
 * 委派 UnitSystemEngine 執行跨制度換算、多維度檢索與常數解析
 */

class LookupTabController {
  constructor(app) {
    this.app = app;
    this.selectedQuantity = (typeof UnitSystemEngine !== "undefined")
      ? UnitSystemEngine.getAllQuantities()[0]
      : (typeof PHYSICAL_QUANTITIES !== "undefined" ? PHYSICAL_QUANTITIES[0] : null);
    this.initDOM();
    this.bindEvents();
    if (typeof AppStateStore !== "undefined") {
      AppStateStore.subscribeKey("lang", () => this.render());
    }
  }

  initDOM() {
    this.catSelect = document.getElementById("lookup-cat-select");
    this.qtySelect = document.getElementById("lookup-qty-select");
    this.lookupSearch = document.getElementById("lookup-search-input");
    this.btnClearSearch = document.getElementById("btn-clear-lookup-search");
    this.searchFeedback = document.getElementById("lookup-search-feedback");
    this.unitSpecTable = document.getElementById("unit-spec-table-body");
    this.convInputVal = document.getElementById("conv-input-value");
    this.convFromUnit = document.getElementById("conv-from-unit");
    this.convToUnit = document.getElementById("conv-to-unit");
    this.convResultDisplay = document.getElementById("conv-result-display");
    this.convFactorDisplay = document.getElementById("conv-factor-display");
    this.descBox = document.getElementById("lookup-desc-box");
  }

  bindEvents() {
    if (this.catSelect) {
      this.catSelect.addEventListener("change", () => {
        this.filterQuantitiesByCategory(this.catSelect.value);
      });
    }

    if (this.qtySelect) {
      this.qtySelect.addEventListener("change", () => {
        const q = (typeof UnitSystemEngine !== "undefined")
          ? UnitSystemEngine.getQuantity(this.qtySelect.value)
          : PHYSICAL_QUANTITIES.find(x => x.id === this.qtySelect.value);
        if (q) {
          this.selectedQuantity = q;
          this.renderQuantityDetail();
          this.highlightTable();
        }
      });
    }

    if (this.lookupSearch) {
      const handleSearch = () => {
        this.searchQuantities(this.lookupSearch.value);
      };
      this.lookupSearch.addEventListener("input", handleSearch);
      this.lookupSearch.addEventListener("change", handleSearch);
      this.lookupSearch.addEventListener("compositionend", handleSearch);

      this.lookupSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.searchQuantities(this.lookupSearch.value);
          this.highlightTable();
        }
      });
    }

    if (this.btnClearSearch) {
      this.btnClearSearch.addEventListener("click", () => {
        this.clearSearch();
      });
    }

    if (this.convInputVal) {
      this.convInputVal.addEventListener("input", () => this.updateConversion());
    }
    if (this.convFromUnit) {
      this.convFromUnit.addEventListener("change", () => this.updateConversion());
    }
    if (this.convToUnit) {
      this.convToUnit.addEventListener("change", () => this.updateConversion());
    }

    // 點擊空白處關閉所有開啟中的行動端說明彈跳提示框
    document.addEventListener("click", () => {
      document.querySelectorAll(".unit-desc-popover-wrapper.active").forEach(w => w.classList.remove("active"));
    });
  }

  clearSearch() {
    if (this.lookupSearch) this.lookupSearch.value = "";
    if (this.btnClearSearch) this.btnClearSearch.style.display = "none";
    if (this.searchFeedback) this.searchFeedback.innerHTML = "";
    this.filterQuantitiesByCategory(this.catSelect ? this.catSelect.value : "all");
    this.renderQuantityDetail();
  }

  highlightTable() {
    const tableCard = document.querySelector(".table-responsive");
    if (tableCard) {
      tableCard.classList.remove("highlight-flash");
      void tableCard.offsetWidth; // 強制重繪
      tableCard.classList.add("highlight-flash");
    }
  }

  render() {
    if (!this.catSelect) return;
    const isZh = this.app.currentLang === "zh";
    const categories = (typeof UnitSystemEngine !== "undefined")
      ? UnitSystemEngine.getCategories()
      : QUANTITY_CATEGORIES;

    this.catSelect.innerHTML = `
      <option value="all">${I18N[this.app.currentLang].allCats}</option>
      ${categories.map(c => `
        <option value="${c.id}">${isZh ? c.nameZh : c.nameEn}</option>
      `).join("")}
    `;

    if (this.lookupSearch && this.lookupSearch.value.trim()) {
      this.searchQuantities(this.lookupSearch.value);
    } else {
      this.filterQuantitiesByCategory("all");
      this.renderQuantityDetail();
    }
  }

  filterQuantitiesByCategory(catId) {
    if (!this.qtySelect) return;
    const isZh = this.app.currentLang === "zh";
    const filtered = (typeof UnitSystemEngine !== "undefined")
      ? UnitSystemEngine.getAllQuantities(catId)
      : (catId === "all" ? PHYSICAL_QUANTITIES : PHYSICAL_QUANTITIES.filter(q => q.category === catId));

    this.qtySelect.innerHTML = filtered.map(q => `
      <option value="${q.id}">
        ${isZh ? q.nameZh : q.nameEn} (${q.symbol})
      </option>
    `).join("");

    if (filtered.length > 0) {
      this.selectedQuantity = filtered[0];
      this.qtySelect.value = filtered[0].id;
      this.renderQuantityDetail();
    }
  }

  searchQuantities(keyword) {
    if (!this.qtySelect) return;
    const isZh = this.app.currentLang === "zh";
    const rawKw = (keyword || "").trim();

    if (!rawKw) {
      this.clearSearch();
      return;
    }

    if (this.btnClearSearch) {
      this.btnClearSearch.style.display = "block";
    }

    // 委派 UnitSystemEngine 執行正規化與多維度比對
    const matches = (typeof UnitSystemEngine !== "undefined")
      ? UnitSystemEngine.searchQuantities(rawKw)
      : PHYSICAL_QUANTITIES.filter(q => q.nameZh.includes(rawKw) || q.nameEn.toLowerCase().includes(rawKw.toLowerCase()));

    if (matches.length > 0) {
      this.selectedQuantity = matches[0];
      this.qtySelect.innerHTML = matches.map(q => `
        <option value="${q.id}">
          ${isZh ? q.nameZh : q.nameEn} (${q.symbol})
        </option>
      `).join("");
      this.qtySelect.value = matches[0].id;

      if (this.catSelect) {
        this.catSelect.value = matches[0].category;
      }

      this.renderQuantityDetail();
      this.renderSearchFeedback(matches, rawKw);
    } else {
      this.qtySelect.innerHTML = `
        <option value="">${isZh ? "（查無相符物理量）" : "(No matching quantity)"}</option>
      `;
      this.renderSearchEmpty(rawKw);
    }
  }

  renderSearchFeedback(matches, kw) {
    if (!this.searchFeedback) return;
    const isZh = this.app.currentLang === "zh";

    const countText = isZh
      ? `找到 ${matches.length} 個與「${kw}」相符的物理量：`
      : `Found ${matches.length} matching result(s) for "${kw}":`;

    this.searchFeedback.innerHTML = `
      <div class="search-count-text">${countText}</div>
      <div class="search-chips-list">
        ${matches.map(q => `
          <button type="button" class="search-chip ${q.id === this.selectedQuantity.id ? 'active' : ''}" data-qid="${q.id}">
            ${isZh ? q.nameZh : q.nameEn} (${q.symbol})
          </button>
        `).join("")}
      </div>
    `;

    // 點擊候選膠囊秒速切換
    this.searchFeedback.querySelectorAll(".search-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const qid = btn.getAttribute("data-qid");
        const targetQ = (typeof UnitSystemEngine !== "undefined")
          ? UnitSystemEngine.getQuantity(qid)
          : PHYSICAL_QUANTITIES.find(x => x.id === qid);
        if (targetQ) {
          this.selectedQuantity = targetQ;
          if (this.qtySelect) this.qtySelect.value = targetQ.id;
          if (this.catSelect) this.catSelect.value = targetQ.category;
          this.renderQuantityDetail();
          this.highlightTable();

          this.searchFeedback.querySelectorAll(".search-chip").forEach(c => {
            c.classList.toggle("active", c.getAttribute("data-qid") === qid);
          });
        }
      });
    });
  }

  renderSearchEmpty(kw) {
    if (!this.searchFeedback) return;
    const isZh = this.app.currentLang === "zh";

    this.searchFeedback.innerHTML = `
      <div class="search-empty-hint">
        ${isZh
          ? `⚠️ 查無與「<strong>${kw}</strong>」相符的物理量。請嘗試物理量名稱（如磁場、速度）、英文（如 B、eV）或單位（如 nT、Pa）。`
          : `⚠️ No physical quantity matched "<strong>${kw}</strong>". Try searching by name (e.g. Magnetic Field), symbol (B), or unit (nT).`}
      </div>
    `;

    if (this.unitSpecTable) {
      this.unitSpecTable.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            ${isZh ? "查無相符單位規格資料" : "No unit specifications match the query"}
          </td>
        </tr>
      `;
    }
    if (this.descBox) {
      this.descBox.textContent = isZh ? "請修改或清空搜尋字詞以重新檢視規格。" : "Please clear or revise your search keywords.";
    }
  }

  renderQuantityDetail() {
    const q = this.selectedQuantity;
    if (!q) return;

    const isZh = this.app.currentLang === "zh";
    if (this.descBox) {
      this.descBox.textContent = isZh ? q.descZh : q.descEn;
    }

    if (this.unitSpecTable) {
      this.unitSpecTable.innerHTML = q.units.map(u => {
        const uLabel = isZh ? (u.labelZh || u.label) : (u.labelEn || u.label);
        const descText = isZh ? (u.descZh || u.desc) : (u.descEn || u.desc);
        const factorStr = (typeof UnitSystemEngine !== "undefined")
          ? UnitSystemEngine.formatValue(u.toBaseSI)
          : (u.toBaseSI >= 1e-3 && u.toBaseSI <= 1e4 ? u.toBaseSI : u.toBaseSI.toExponential());
        return `
        <tr>
          <td class="col-sys"><span class="badge-system badge-${u.system.toLowerCase()}">${u.system}</span></td>
          <td class="col-unit"><strong>${uLabel}</strong></td>
          <td class="col-factor"><code>${factorStr} ${q.baseUnitSI}</code></td>
          <td class="col-desc">
            <span class="unit-desc-full">${descText}</span>
            <div class="unit-desc-popover-wrapper">
              <button type="button" class="btn-unit-desc-pop" aria-label="${isZh ? '檢視說明' : 'View description'}" title="${descText}">
                <span class="desc-info-icon" aria-hidden="true">?</span>
              </button>
              <div class="unit-desc-tooltip-bubble" role="tooltip">
                <div class="tooltip-bubble-header">${uLabel}</div>
                <div class="tooltip-bubble-body">${descText}</div>
              </div>
            </div>
          </td>
          <td class="col-action" style="text-align: center;">
            <button type="button" class="btn-copy-chip btn-apply-conv" data-unit-id="${u.id}" title="${isZh ? '將此單位帶入下方換算器來源端' : 'Set as converter source'}">
              ${isZh ? '帶入換算' : 'Convert'}
            </button>
          </td>
        </tr>
      `;
      }).join("");

      // 綁定行動版說明彈跳提示框事件
      this.unitSpecTable.querySelectorAll(".btn-unit-desc-pop").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const wrapper = btn.closest(".unit-desc-popover-wrapper");
          const isOpened = wrapper && wrapper.classList.contains("active");
          this.unitSpecTable.querySelectorAll(".unit-desc-popover-wrapper.active").forEach(w => w.classList.remove("active"));
          if (wrapper && !isOpened) {
            wrapper.classList.add("active");
          }
        });
      });

      // 綁定「帶入換算」按鈕事件
      this.unitSpecTable.querySelectorAll(".btn-apply-conv").forEach(btn => {
        btn.addEventListener("click", () => {
          const uid = btn.getAttribute("data-unit-id");
          if (this.convFromUnit && uid) {
            this.convFromUnit.value = uid;
            this.updateConversion();

            // 按鈕微互動：即時標記已帶入
            const origHtml = btn.innerHTML;
            btn.classList.add("applied");
            btn.innerHTML = `<span>✓ ${isZh ? '已帶入' : 'Applied'}</span>`;
            setTimeout(() => {
              btn.classList.remove("applied");
              btn.innerHTML = origHtml;
            }, 800);

            // 視圖導引：平滑滾動至換算器區塊
            const converterElement = document.querySelector(".converter-box");
            if (converterElement) {
              converterElement.scrollIntoView({ behavior: "smooth", block: "nearest" });

              // 聚焦視覺強調：容器與來源欄位觸發 0.8s 脈衝光效
              const pulseTargets = [converterElement, this.convFromUnit, this.convInputVal];
              pulseTargets.forEach(el => {
                if (!el) return;
                el.classList.remove("pulse-highlight", "highlight-flash");
                void el.offsetWidth;
                el.classList.add("pulse-highlight");
              });
            }

            // 焦點控制：自動移至數值輸入框並全選，便於鍵盤快速修改
            if (this.convInputVal) {
              this.convInputVal.focus({ preventScroll: true });
              this.convInputVal.select();
            }
          }
        });
      });
    }

    if (this.convFromUnit && this.convToUnit) {
      this.convFromUnit.innerHTML = q.units.map(u => `<option value="${u.id}">${isZh ? (u.labelZh || u.label) : (u.labelEn || u.label)}</option>`).join("");
      this.convToUnit.innerHTML = q.units.map(u => `<option value="${u.id}">${isZh ? (u.labelZh || u.label) : (u.labelEn || u.label)}</option>`).join("");

      if (q.units.length > 1) {
        this.convToUnit.selectedIndex = 1;
      }

      this.updateConversion();
    }
  }

  updateConversion() {
    const q = this.selectedQuantity;
    if (!q || !this.convInputVal || !this.convFromUnit || !this.convToUnit) return;

    // 委派 UnitSystemEngine 執行精確換算與比率推算
    const res = (typeof UnitSystemEngine !== "undefined")
      ? UnitSystemEngine.convert(this.convInputVal.value, this.convFromUnit.value, this.convToUnit.value, q.id)
      : {
          formattedValue: "0",
          formattedFactor: "1",
          fromUnit: { id: this.convFromUnit.value },
          toUnit: { id: this.convToUnit.value }
        };

    if (this.convResultDisplay) {
      this.convResultDisplay.textContent = `${res.formattedValue} ${res.toUnit.id}`;
    }
    if (this.convFactorDisplay) {
      const convMultText = I18N[this.app.currentLang].conversionMultiplierText;
      this.convFactorDisplay.innerHTML = `1 ${res.fromUnit.id} = <strong>${res.formattedFactor}</strong> ${res.toUnit.id} (${convMultText} ${res.formattedFactor})`;
    }
  }
}
