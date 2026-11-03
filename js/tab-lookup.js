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
        }
      });
    }

    if (this.lookupSearch) {
      this.lookupSearch.addEventListener("input", () => {
        this.searchQuantities(this.lookupSearch.value);
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

  render() {
    if (!this.catSelect) return;
    const isZh = this.app.currentLang === "zh";

    this.catSelect.innerHTML = `
      <option value="all">${I18N[this.app.currentLang].allCats}</option>
      ${QUANTITY_CATEGORIES.map(c => `
        <option value="${c.id}">${isZh ? c.nameZh : c.nameEn}</option>
      `).join("")}
    `;

    this.filterQuantitiesByCategory("all");
    this.renderQuantityDetail();
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
      this.filterQuantitiesByCategory(this.catSelect ? this.catSelect.value : "all");
      return;
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

    this.qtySelect.innerHTML = matches.map(q => `
      <option value="${q.id}">
        ${isZh ? q.nameZh : q.nameEn} (${q.symbol})
      </option>
    `).join("");

    if (matches.length > 0) {
      this.selectedQuantity = matches[0];
      this.renderQuantityDetail();
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
        </tr>
      `).join("");
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
