//=============================================================================
// VariableHUD.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 변수값을 아이콘 또는 img/pictures 이미지+텍스트+값 형태로 여러개 화면에 표시 (v1.1)
 * @author pipupang+GPT
 *
 * @param DisplayItems
 * @text 표시 항목들
 * @type struct<DisplayItemPic>[]
 * @desc 여러 항목을 등록하면 자동으로 화면에 모두 표시됩니다.
 * @default []
 *
 * @help
 * 각 항목별로 'PictureName'(img/pictures) 또는 'Icon'(아이콘 번호) 중 하나를 지정.
 * PictureName이 있으면 아이콘 대신 그림을 출력합니다.
 * PicWidth/PicHeight는 0이면 원본 크기.
 * 
 * [필수 사용법]
 * 1. js/plugins/VariableHUD.js 저장 및 플러그인 ON
 * 2. 플러그인 매개변수에서 [항목 추가]로 원하는 만큼 등록
 * 3. PictureName(확장자X) 또는 Icon(번호)만 지정해도 됨
 * 4. 게임 내 변수값이 바뀌면 실시간 자동 반영
 */

/*~struct~DisplayItemPic:
 * @param X
 * @type number
 * @text X좌표
 * @default 0
 * 
 * @param Y
 * @type number
 * @text Y좌표
 * @default 0
 * 
 * @param Icon
 * @type number
 * @text 아이콘 번호 (미사용시 0)
 * @default 0
 *
 * @param PictureName
 * @type file
 * @dir img/pictures/
 * @text 표시할 그림 파일명 (아이콘 대신)
 * @default 
 * 
 * @param Label
 * @type string
 * @text 텍스트
 * @default 텍스트
 * 
 * @param VariableId
 * @type variable
 * @text 변수번호
 * @default 1
 * 
 * @param FontSize
 * @type number
 * @text 글자크기
 * @default 24
 *
 * @param PicWidth
 * @type number
 * @text 그림 너비(px, 0=원본)
 * @default 32
 * 
 * @param PicHeight
 * @type number
 * @text 그림 높이(px, 0=원본)
 * @default 32
 */

(() => {
  const parameters = PluginManager.parameters('VariableHUD');
  const displayItems = JSON.parse(parameters["DisplayItems"] || "[]").map(str => {
    const obj = JSON.parse(str);
    return {
      x: Number(obj.X || 0),
      y: Number(obj.Y || 0),
      icon: Number(obj.Icon || 0),
      picture: obj.PictureName || "",
      label: obj.Label || "",
      varId: Number(obj.VariableId || 1),
      fontSize: Number(obj.FontSize || 24),
      picWidth: Number(obj.PicWidth || 32),
      picHeight: Number(obj.PicHeight || 32),
      lastValue: undefined,
      lastLabel: undefined,
      lastIcon: undefined
    };
  });

  const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function () {
    _Scene_Map_createAllWindows.call(this);
    this._variableHUD = new Sprite_VariableHUD();
    this.addChild(this._variableHUD);
  };

  function Sprite_VariableHUD() {
    this.initialize(...arguments);
  }
  Sprite_VariableHUD.prototype = Object.create(Sprite.prototype);
  Sprite_VariableHUD.prototype.constructor = Sprite_VariableHUD;

  Sprite_VariableHUD.prototype.initialize = function () {
    Sprite.prototype.initialize.call(this);
    this._sprites = [];
    this._refreshAll();
  };

  Sprite_VariableHUD.prototype.update = function () {
    Sprite.prototype.update.call(this);
    if (this._sprites.length !== displayItems.length) {
      this._refreshAll();
    }
    for (let i = 0; i < displayItems.length; i++) {
      const sprite = this._sprites[i];
      const item = displayItems[i];
      if (!sprite || !item) continue;
      let v = $gameVariables.value(item.varId);
      if (v !== item.lastValue || item.lastLabel !== item.label || item.lastIcon !== item.icon) {
        sprite._refresh(item);
        item.lastValue = v;
        item.lastLabel = item.label;
        item.lastIcon = item.icon;
      }
      sprite.visible = true;
      sprite.x = item.x;
      sprite.y = item.y;
    }
    for (let i = displayItems.length; i < this._sprites.length; i++) {
      if (this._sprites[i]) this._sprites[i].visible = false;
    }
  };

  Sprite_VariableHUD.prototype._refreshAll = function () {
    this.removeChildren();
    this._sprites = [];
    for (let i = 0; i < displayItems.length; i++) {
      const sp = new Sprite_VariableHUDItem(displayItems[i]);
      this._sprites.push(sp);
      this.addChild(sp);
    }
  };

  function Sprite_VariableHUDItem(item) {
    this.initialize(item);
  }
  Sprite_VariableHUDItem.prototype = Object.create(Sprite.prototype);
  Sprite_VariableHUDItem.prototype.constructor = Sprite_VariableHUDItem;

  Sprite_VariableHUDItem.prototype.initialize = function (item) {
    Sprite.prototype.initialize.call(this);
    this.bitmap = new Bitmap(260, 48);
    this._item = item;
    this._picSprite = null;
    this._refresh(item);
  };

  Sprite_VariableHUDItem.prototype._refresh = function (item) {
    item = item || this._item;
    if (!item) return;
    this._item = item; // 항상 최신값 보존

    this.bitmap.clear();

    if (item.picture && item.picture.length > 0) {
      if (this._picSprite) {
        this.removeChild(this._picSprite);
        this._picSprite = null;
      }
      this._picSprite = new Sprite();
      this.addChild(this._picSprite);

      const picBmp = ImageManager.loadPicture(item.picture);
      this._picSprite.bitmap = picBmp;

      picBmp.addLoadListener(() => {
        const safeItem = this._item;
        if (!safeItem) return;
        const w = safeItem.picWidth > 0 ? safeItem.picWidth : picBmp.width;
        const h = safeItem.picHeight > 0 ? safeItem.picHeight : picBmp.height;
        this._picSprite.x = 0;
        this._picSprite.y = 0;
        this._picSprite.scale.x = w / picBmp.width;
        this._picSprite.scale.y = h / picBmp.height;
      });
    } else {
      if (this._picSprite) {
        this.removeChild(this._picSprite);
        this._picSprite = null;
      }
      const iconIndex = item.icon;
      if (iconIndex > 0) {
        const iconBitmap = ImageManager.loadSystem("IconSet");
        const pw = 32, ph = 32;
        const sx = (iconIndex % 16) * pw;
        const sy = Math.floor(iconIndex / 16) * ph;
        this.bitmap.blt(iconBitmap, sx, sy, pw, ph, 0, 0);
      }
    }

    this.bitmap.fontSize = item.fontSize;
    const text = item.label + ": " + $gameVariables.value(item.varId);
    this.bitmap.drawText(text, 36, 0, 220, 32, "left");
  };
})();
