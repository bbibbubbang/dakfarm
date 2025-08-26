/*:
 * @target MZ
 * @plugindesc Custom Shop UI (v3.3 fixed) - 가격/아이콘/구매 UI/버튼 오류 수정
 * @author ChatGPT
 *
 * @command OpenCustomShopUI
 * @text 커스텀 상점 열기
 * @arg Items
 * @type struct<ShopItem>[]
 * @desc 판매할 아이템 목록
 *
 * @help
 * 가격: -1 → DB 가격 / priceVarId 우선 / multiple: true → 복수 구매
 */

/*~struct~ShopItem:
 * @param itemId
 * @type item
 * @desc 판매 아이템 ID
 *
 * @param price
 * @type number
 * @default -1
 * @desc -1은 데이터베이스 가격
 *
 * @param priceVarId
 * @type variable
 * @default 0
 * @desc 가격에 사용할 변수 ID
 *
 * @param multiple
 * @type boolean
 * @default false
 * @desc true면 복수구매 가능
 *
 * @param capacity
 * @type number
 * @default 99
 * @desc 수량 제한
 *
 * @param switchId
 * @type switch
 * @default 0
 * @desc 구매 시 활성화할 스위치
 *
 * @param commonEventId
 * @type common_event
 * @default 0
 * @desc 구매 시 실행할 공통 이벤트
 */

(() => {
  PluginManager.registerCommand("CustomShopUI", "OpenCustomShopUI", args => {
    const items = JSON.parse(args.Items || "[]").map(e => JSON.parse(e));
    SceneManager._customShopParams = items;
    SceneManager.push(Scene_CustomShop);
  });

  class Window_CustomShopList extends Window_Selectable {
    initialize(rect) {
      super.initialize(rect);
      this._data = [];
    }

    maxItems() {
      return this._data.length;
    }

    item() {
      return this._data[this.index()];
    }

    setItems(data) {
      this._data = data;
      this.refresh();
    }

    drawItem(index) {
      const rect = this.itemRect(index);
      const data = this._data[index];
      const item = data.item;
      if (!item) return;

      const price = this.calcPrice(data);
      const owned = $gameParty.numItems(item);
      const disabled =
        $gameParty.gold() < price ||
        owned >= data.capacity ||
        (data.switchId && $gameSwitches.value(data.switchId));

      this.changePaintOpacity(!disabled);
      this.drawIcon(item.iconIndex, rect.x + 4, rect.y + 2);
      this.drawText(item.name, rect.x + 36, rect.y, 200, "left");
      this.drawText(`${price}G`, rect.x, rect.y, rect.width - 8, "right");
      this.changePaintOpacity(true);
    }

    calcPrice(data) {
      const varId = Number(data.priceVarId);
      if (varId > 0) return $gameVariables.value(varId);
      const direct = Number(data.price);
      if (direct >= 0) return direct;
      return data.item ? data.item.price : 0;
    }

    isCurrentItemEnabled() {
      const data = this.item();
      if (!data || !data.item) return false;
      const item = data.item;
      const price = this.calcPrice(data);
      const owned = $gameParty.numItems(item);
      if ($gameParty.gold() < price) return false;
      if (owned >= data.capacity) return false;
      if (data.switchId > 0 && $gameSwitches.value(data.switchId)) return false;
      return true;
    }
  }

  class Scene_CustomShop extends Scene_MenuBase {
    create() {
      super.create();
      this._raw = SceneManager._customShopParams || [];
      SceneManager._customShopParams = null;
      this.prepareItems();
      this.createShopWindow();
    }

    start() {
      super.start();
      this._shopWindow.select(0);
      this._shopWindow.activate();
    }

    prepareItems() {
      this._shopItems = this._raw.map(data => {
        const id = typeof data.itemId === "object" ? Number(data.itemId.id) : Number(data.itemId);
        return {
          item: $dataItems[id],
          itemId: id,
          price: Number(data.price),
          priceVarId: Number(data.priceVarId),
          capacity: Number(data.capacity),
          switchId: Number(data.switchId),
          commonEventId: Number(data.commonEventId),
          multiple: String(data.multiple) === "true"
        };
      });
    }

    createShopWindow() {
      const width = 600;
      const height = Graphics.boxHeight;
      const x = (Graphics.boxWidth - width) / 2;
      const rect = new Rectangle(x, 0, width, height);
      this._shopWindow = new Window_CustomShopList(rect);
      this._shopWindow.setItems(this._shopItems);
      this._shopWindow.setHandler("ok", this.onBuy.bind(this));
      this._shopWindow.setHandler("cancel", this.onCancel.bind(this));
      this.addWindow(this._shopWindow);
    }

    onCancel() {
      console.log("취소 - 뒤로가기 실행");
      this.popScene();
    }

    onBuy() {
      const data = this._shopWindow.item();
      if (!data) return;
      const price = this._shopWindow.calcPrice(data);
      if (!data.item || $gameParty.gold() < price) {
        SoundManager.playBuzzer();
        this._shopWindow.activate();
        return;
      }
      if (data.multiple === true || data.multiple === "true") {
        this.promptAmount(data, price);
      } else {
        this.processBuy(data, 1, price);
      }
    }

    promptAmount(data, pricePer) {
      const max = Math.min(
        Math.floor($gameParty.gold() / pricePer),
        data.capacity - $gameParty.numItems(data.item)
      );
      if (max <= 0) {
        SoundManager.playBuzzer();
        this._shopWindow.activate();
        return;
      }
      this._numberWindow = new Window_ShopNumber(new Rectangle(0, 0, 400, 200));
      this._numberWindow.setup(data.item, pricePer, max);
      this._numberWindow.setHandler("ok", () => {
        const qty = this._numberWindow.number();
        this._numberWindow.close();
        this.removeChild(this._numberWindow);
        this.processBuy(data, qty, pricePer);
      });
      this._numberWindow.setHandler("cancel", () => {
        this._numberWindow.close();
        this.removeChild(this._numberWindow);
        this._shopWindow.activate();
      });
      this.addWindow(this._numberWindow);
    }

    processBuy(data, qty, pricePer) {
      const item = data.item;
      const total = qty * pricePer;
      if (!item || $gameParty.gold() < total) {
        SoundManager.playBuzzer();
        this._shopWindow.activate();
        return;
      }
      $gameParty.loseGold(total);
      if (typeof VD_setShouldDrop === 'function') VD_setShouldDrop(false);
      
      
      let price = item.price;
      if (item.meta.priceVar) {
        const varId = Number(item.meta.priceVar);
        if (!isNaN(varId)) {
          price = $gameVariables.value(varId);
        }
      } else if (item.meta.price && Number(item.meta.price) >= 0) {
        price = Number(item.meta.price);
      }
    
      let container = $gameParty.itemContainer(item);
      if (container) {
        const itemId = item.id;
        if (container[itemId] == null) {
          container[itemId] = 0;
        }
        container[itemId] += qty;
        $gameParty._gold -= price * qty;
        $gameMap.requestRefresh();
      }
    
      if (typeof VD_setShouldDrop === 'function') VD_setShouldDrop(true);
      if (data.switchId > 0) {
        $gameSwitches.setValue(data.switchId, true);
      }
      if (data.commonEventId > 0) {
        $gameTemp.reserveCommonEvent(data.commonEventId);
      }
      $gameMessage.add(`\I[${item.iconIndex}]${item.name} ×${qty} 구입 완료!`);
      this.prepareItems();
      this._shopWindow.setItems(this._shopItems);
      this._shopWindow.refresh();
      this._shopWindow.activate();
    }
  }
})();