/**
 * js/tab-lookup.js - 分頁二：物理量查找與即時單位換算控制器
 */

class LookupTabController {
  constructor(app) {
    this.app = app;
    this.selectedQuantity = PHYSICAL_QUANTITIES[0];
    this.initDOM();
    this.bindEvents();
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
        const q = PHYSICAL_QUANTITIES.find(x => x.id === this.qtySelect.value);
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

    this.catSelect.innerHTML = `
      <option value="all">${I18N[this.app.currentLang].allCats}</option>
      ${QUANTITY_CATEGORIES.map(c => `
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
    const filtered = catId === "all"
      ? PHYSICAL_QUANTITIES
      : PHYSICAL_QUANTITIES.filter(q => q.category === catId);

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
    const rawKw = keyword.trim().toLowerCase();
    const cleanKw = rawKw.replace(/[-\s_]/g, "");

    if (!rawKw) {
      this.clearSearch();
      return;
    }

    if (this.btnClearSearch) {
      this.btnClearSearch.style.display = "block";
    }

    // 次方符號正規化處理 (例如將 cm^-3 與 cm⁻³ 互通)
    const normExponent = (str) => {
      if (!str) return "";
      const supMap = { "⁻": "-", "⁺": "+", "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
      return str.replace(/[⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => supMap[c] || c).replace(/\^/g, "").replace(/_/g, "");
    };
    const normKw = normExponent(rawKw);

    const matches = PHYSICAL_QUANTITIES.filter(q => {
      const nameZh = q.nameZh.toLowerCase();
      const nameEn = q.nameEn.toLowerCase();
      const cleanNameEn = nameEn.replace(/[-\s_]/g, "");
      const cleanId = q.id.toLowerCase().replace(/[-\s_]/g, "");
      const symbol = q.symbol.toLowerCase();
      const descZh = (q.descZh || "").toLowerCase();
      const descEn = (q.descEn || "").toLowerCase();

      // 所屬分類大類名稱比對
      const catObj = QUANTITY_CATEGORIES.find(c => c.id === q.category);
      const catNameZh = catObj ? catObj.nameZh.toLowerCase() : "";
      const catNameEn = catObj ? catObj.nameEn.toLowerCase() : "";

      // 基本資訊比對（名稱、ID、符號、描述、分類）
      if (nameZh.includes(rawKw) ||
          nameEn.includes(rawKw) ||
          cleanNameEn.includes(cleanKw) ||
          cleanId.includes(cleanKw) ||
          symbol.includes(rawKw) ||
          descZh.includes(rawKw) ||
          descEn.includes(rawKw) ||
          catNameZh.includes(rawKw) ||
          catNameEn.includes(rawKw)) {
        return true;
      }

      // 單位清單比對 (含次方符號正規化)
      return q.units.some(u => {
        const uId = u.id.toLowerCase();
        const uLabelZh = (u.labelZh || u.label || "").toLowerCase();
        const uLabelEn = (u.labelEn || "").toLowerCase();
        const uDescZh = (u.descZh || u.desc || "").toLowerCase();
        const uDescEn = (u.descEn || "").toLowerCase();

        return uId.includes(rawKw) ||
               uLabelZh.includes(rawKw) ||
               uLabelEn.includes(rawKw) ||
               uDescZh.includes(rawKw) ||
               uDescEn.includes(rawKw) ||
               normExponent(uId).includes(normKw) ||
               normExponent(uLabelZh).includes(normKw) ||
               normExponent(uLabelEn).includes(normKw);
      });
    });

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
        const targetQ = PHYSICAL_QUANTITIES.find(x => x.id === qid);
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
      this.unitSpecTable.innerHTML = q.units.map(u => `
        <tr>
          <td><span class="badge-system badge-${u.system.toLowerCase()}">${u.system}</span></td>
          <td><strong>${isZh ? (u.labelZh || u.label) : (u.labelEn || u.label)}</strong></td>
          <td><code>${u.toBaseSI >= 1e-3 && u.toBaseSI <= 1e4 ? u.toBaseSI : u.toBaseSI.toExponential()} ${q.baseUnitSI}</code></td>
          <td>${isZh ? (u.descZh || u.desc) : (u.descEn || u.desc)}</td>
          <td style="text-align: center;">
            <button type="button" class="btn-copy-chip btn-apply-conv" data-unit-id="${u.id}" title="${isZh ? '將此單位帶入下方換算器來源端' : 'Set as converter source'}">
              🔄 ${isZh ? '帶入換算' : 'Convert'}
            </button>
          </td>
        </tr>
      `).join("");

      // 綁定「帶入換算」按鈕事件
      this.unitSpecTable.querySelectorAll(".btn-apply-conv").forEach(btn => {
        btn.addEventListener("click", () => {
          const uid = btn.getAttribute("data-unit-id");
          if (this.convFromUnit && uid) {
            this.convFromUnit.value = uid;
            this.updateConversion();
            const convBox = document.querySelector(".converter-box");
            if (convBox) {
              convBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
              convBox.classList.remove("highlight-flash");
              void convBox.offsetWidth;
              convBox.classList.add("highlight-flash");
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

    const val = parseFloat(this.convInputVal.value) || 0;
    const fromUnit = q.units.find(u => u.id === this.convFromUnit.value) || q.units[0];
    const toUnit = q.units.find(u => u.id === this.convToUnit.value) || q.units[0];

    const valSI = val * fromUnit.toBaseSI;
    const converted = valSI / toUnit.toBaseSI;
    const factor = fromUnit.toBaseSI / toUnit.toBaseSI;

    const formattedVal = Math.abs(converted) < 1e-4 || Math.abs(converted) >= 1e6
      ? converted.toExponential(5)
      : converted.toLocaleString(undefined, { maximumFractionDigits: 5 });

    const factorStr = Math.abs(factor) < 1e-3 || Math.abs(factor) >= 1e5
      ? factor.toExponential(5)
      : factor.toString();

    if (this.convResultDisplay) {
      this.convResultDisplay.textContent = `${formattedVal} ${toUnit.id}`;
    }
    if (this.convFactorDisplay) {
      const convMultText = I18N[this.app.currentLang].conversionMultiplierText;
      this.convFactorDisplay.innerHTML = `1 ${fromUnit.id} = <strong>${factorStr}</strong> ${toUnit.id} (${convMultText} ${factorStr})`;
    }
  }
}
