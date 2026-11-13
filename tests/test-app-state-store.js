/**
 * tests/test-app-state-store.js - AppStateStore 全域反應式狀態儲存庫與事件總線測試套件
 * 驗證狀態變異、鍵值訂閱、不可變快照與事件總線分發
 */

load("js/app-state-store.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion Failed: " + message);
  }
}

print("==================================================");
print(" AppStateStore Automated Test Suite");
print("==================================================");

// 重置測試環境
AppStateStore.reset();

// Test 1: 初始狀態與快照擷取
var snap1 = AppStateStore.getSnapshot();
assert(snap1.lang === "zh", "初始語言應為 zh");
assert(snap1.theme === "dark", "初始主題應為 dark");
assert(snap1.activeTab === "presets", "初始分頁應為 presets");
assert(snap1.isDirty === false, "初始髒狀態應為 false");
print("[✓] Test 1: 初始狀態與快照擷取通過");

// Test 2: 主題設定與雙向切換
AppStateStore.setTheme("light");
assert(AppStateStore.get("theme") === "light", "設定 light 主題應生效");
var toggledTheme = AppStateStore.toggleTheme();
assert(toggledTheme === "dark", "toggleTheme 應切換回 dark");
assert(AppStateStore.get("theme") === "dark", "當前主題應為 dark");
print("[✓] Test 2: 主題設定與切換 (dark/light) 通過");

// Test 3: 語言設定與切換
AppStateStore.setLanguage("en");
assert(AppStateStore.get("lang") === "en", "設定 en 語言應生效");
var toggledLang = AppStateStore.toggleLanguage();
assert(toggledLang === "zh", "toggleLanguage 應切換回 zh");
assert(AppStateStore.get("lang") === "zh", "當前語言應為 zh");
print("[✓] Test 3: 語言設定與切換 (zh/en) 通過");

// Test 4: 作用中分頁切換與安全防禦
AppStateStore.setActiveTab("builder");
assert(AppStateStore.get("activeTab") === "builder", "設定 builder 分頁應生效");
AppStateStore.setActiveTab("invalid_tab");
assert(AppStateStore.get("activeTab") === "presets", "無效分頁應安全保底回 presets");
print("[✓] Test 4: 作用中分頁切換與防禦回退通過");

// Test 5: 全域狀態訂閱 (subscribe)
var globalTriggered = 0;
var unsubscribeGlobal = AppStateStore.subscribe(function(snapshot, changedKeys) {
  globalTriggered++;
  assert(changedKeys.indexOf("isDirty") >= 0, "變更鍵應包含 isDirty");
});

AppStateStore.setDirty(true);
assert(globalTriggered === 1, "全域訂閱者應被呼叫 1 次");
unsubscribeGlobal();
AppStateStore.setDirty(false);
assert(globalTriggered === 1, "取消訂閱後不應再被呼叫");
print("[✓] Test 5: 全域狀態訂閱與取消機制 (subscribe) 通過");

// Test 6: 單一鍵值專屬訂閱 (subscribeKey)
var keyTriggered = 0;
var receivedVal = null;
var unsubscribeKey = AppStateStore.subscribeKey("lang", function(newVal, prevVal) {
  keyTriggered++;
  receivedVal = newVal;
  assert(prevVal === "zh", "先前語言應為 zh");
});

AppStateStore.setTheme("light"); // 不應觸發 lang 訂閱
assert(keyTriggered === 0, "變更其他鍵不應觸發 lang 訂閱者");

AppStateStore.setLanguage("en");
assert(keyTriggered === 1, "變更 lang 應精確觸發訂閱者");
assert(receivedVal === "en", "接收之新值應為 en");
unsubscribeKey();
print("[✓] Test 6: 單一鍵值專屬訂閱 (subscribeKey) 通過");

// Test 7: 事件總線發布與訂閱 (Event Bus on/emit/off)
var eventData = null;
var eventCount = 0;
var offEvent = AppStateStore.on("plasma:test-event", function(payload) {
  eventCount++;
  eventData = payload;
});

AppStateStore.emit("plasma:test-event", { calculationId: "calc_01", value: 42 });
assert(eventCount === 1, "事件總線應成功接收發布");
assert(eventData && eventData.value === 42, "事件資料酬載應正確傳遞");

offEvent();
AppStateStore.emit("plasma:test-event", { value: 100 });
assert(eventCount === 1, "取消事件監聽後不應再觸發");
print("[✓] Test 7: 事件總線發布與訂閱機制 (on/emit/off) 通過");

// Test 8: 快照不可變性防禦 (Immutable Snapshot Guard)
var frozenSnap = AppStateStore.getSnapshot();
assert(Object.isFrozen(frozenSnap), "快照物件應被 Object.freeze 凍結");

var mutationFailed = false;
try {
  frozenSnap.lang = "fr";
} catch (e) {
  mutationFailed = true;
}
assert(mutationFailed || frozenSnap.lang === "en", "快照直接變異應失敗或被忽略");
assert(AppStateStore.get("lang") === "en", "內部狀態不受外部惡意改動影響");
print("[✓] Test 8: 快照不可變性防禦通過");

print("==================================================");
print(" ALL 8 TESTS PASSED PERFECTLY!");
print("==================================================");
