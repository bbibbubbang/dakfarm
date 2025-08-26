/*:
 * @target MZ
 * @plugindesc 상점 옵션: hidebuy, hidesell, buyonce, singlebuy, autoclose (pipupang)
 * @author pipupang + GPT
 *
 * @help
 * 메모에 적으면 동작:
 *   hidebuy   - 구매목록에서 숨김
 *   hidesell  - 판매목록에서 숨김
 *   buyonce   - 이미 소지 중이면 상점에 안뜸 (버리면 다시 뜸)
 *   singlebuy - 반드시 1개만 구매(수량조정 불가)
 *   autoclose      - 해당 아이템 구매 시 상점 즉시 종료
 *   autoclose:A~D  - 구매 시 상점 종료 + 셀프스위치 ON (예: autoclose:A)
 */

(function() {
  // 구매 목록 필터링+가격 꼬임 방지용 캐시
  Window_ShopBuy.prototype.makeItemList = function() {
    this._data = [];
    this._itemPriceList = [];
    const goods = this._shopGoods || (SceneManager._scene && SceneManager._scene._goods) || [];
    for (let i = 0; i < goods.length; i++) {
      const [type, id, , price] = goods[i];
      let item = null;
      if (type === 0) item = $dataItems[id];
      if (type === 1) item = $dataWeapons[id];
      if (type === 2) item = $dataArmors[id];
      if (!item) continue;
      const note = item.note || "";
      if (/\bhidebuy\b/i.test(note)) continue;
      if (/\bbuyonce\b/i.test(note) && $gameParty.hasItem(item, false)) continue;
      this._data.push(item);
      this._itemPriceList.push(price);
    }
  };

  // 가격 꼬임 방지(필터링된 배열에 맞춰서 가격 적용)
  Window_ShopBuy.prototype.price = function(item) {
    const idx = this._data.indexOf(item);
    if (idx >= 0 && this._itemPriceList && this._itemPriceList.length > idx) {
      const price = this._itemPriceList[idx];
      return price ? price : item.price;
    }
    return item.price;
  };

  // 판매목록 hidesell만 필터링
  const _Window_ShopSell_makeItemList = Window_ShopSell.prototype.makeItemList;
  Window_ShopSell.prototype.makeItemList = function() {
    _Window_ShopSell_makeItemList.call(this);
    if (this._data && this._data.length > 0) {
      this._data = this._data.filter(item => {
        if (!item) return false;
        const note = item.note || "";
        return !/\bhidesell\b/i.test(note);
      });
    }
  };

  // 구매 후 실시간 반영(buyonce 등)
  const _Scene_Shop_doBuy = Scene_Shop.prototype.doBuy;
  Scene_Shop.prototype.doBuy = function(number) {
    _Scene_Shop_doBuy.call(this, number);
    if (this._buyWindow && this._buyWindow.makeItemList) {
      this._buyWindow.makeItemList();
      this._buyWindow.refresh();
      this._buyWindow.select(this._buyWindow.index());
    }
  };

  // singlebuy: 반드시 1개만 구매(수량조절 불가)
  const _Window_ShopNumber_setup = Window_ShopNumber.prototype.setup;
  Window_ShopNumber.prototype.setup = function(item, max, price, number) {
    _Window_ShopNumber_setup.call(this, item, max, price, number);
    const note = item && item.note ? item.note : "";
    if (/\bsinglebuy\b/i.test(note)) {
      this._number = 1;
      this._max = 1;
      this.refresh();
      if (typeof this.updateButtonsVisibility === "function") {
        this.updateButtonsVisibility();
      }
    }
  };
  Window_ShopNumber.prototype.changeNumber = function(amount) {
    const item = this._item;
    const note = item && item.note ? item.note : "";
    if (/\bsinglebuy\b/i.test(note)) {
      this._number = 1;
      this.refresh();
      return;
    }
    this._number = (this._number + amount).clamp(1, this._max);
    this.refresh();
  };
  Window_ShopNumber.prototype.onButtonUp = function() {
    const note = this._item && this._item.note ? this._item.note : "";
    if (/\bsinglebuy\b/i.test(note)) {
      this._number = 1;
      this.refresh();
      return;
    }
    Window_ShopNumber.prototype.changeNumber.call(this, 1);
  };
  Window_ShopNumber.prototype.onButtonDown = function() {
    const note = this._item && this._item.note ? this._item.note : "";
    if (/\bsinglebuy\b/i.test(note)) {
      this._number = 1;
      this.refresh();
      return;
    }
    Window_ShopNumber.prototype.changeNumber.call(this, -1);
  };

  // --- autoclose(상점 자동종료/셀프스위치 지원) ---
  const _Scene_Shop_doBuy2 = Scene_Shop.prototype.doBuy;
  Scene_Shop.prototype.doBuy = function(number) {
    _Scene_Shop_doBuy2.call(this, number);
    // autoclose 체크
    const item = this._item;
    if (!item) return;
    const note = item.note || "";
    const acMatch = note.match(/autoclose(?::([A-D]))?/i);
    if (acMatch) {
      // 상점 종료
      this.popScene();
      // 셀프스위치 세팅(있는 경우)
      const sswitch = acMatch[1];
      if (sswitch && $gameMap && $gameMap._interpreter) {
        const eventId = $gameMap._interpreter._eventId;
        if (eventId > 0) {
          const key = [$gameMap.mapId(), eventId, sswitch.toUpperCase()];
          $gameSelfSwitches.setValue(key, true);
        }
      }
    }
  };

})();
