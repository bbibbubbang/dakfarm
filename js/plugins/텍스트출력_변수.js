/*~struct~HUDConfig:
 * @param Variable ID
 * @type variable
 * @default 1
 *
 * @param Text Label
 * @default 점수:
 *
 * @param X Static
 * @text X 좌표 (숫자)
 * @type number
 * @default 
 * @desc 숫자로 직접 입력하는 경우

 * @param Y Static
 * @text Y 좌표 (숫자)
 * @type number
 * @default 
 * @desc 숫자로 직접 입력하는 경우

 * @param X Variable ID
 * @text X 좌표 (변수)
 * @type variable
 * @default 0

 * @param Y Variable ID
 * @text Y 좌표 (변수)
 * @type variable
 * @default 0
 */

/*:
 * @target MZ
 * @plugindesc 여러 HUD 표시 - 위치는 숫자 또는 변수 중 입력된 값 우선 사용
 * @author ChatGPT
 *
 * @param HUD List
 * @text HUD 설정 목록
 * @type struct<HUDConfig>[]
 * @default []
 */

(() => {
  const parameters = PluginManager.parameters("텍스트출력_변수");
  const hudList = JSON.parse(parameters["HUD List"] || "[]").map(e => JSON.parse(e));

  const getX = cfg => {
    if (cfg["X Static"] !== "") return Number(cfg["X Static"]);
    if (Number(cfg["X Variable ID"])) return $gameVariables.value(Number(cfg["X Variable ID"]));
    return 0;
  };

  const getY = cfg => {
    if (cfg["Y Static"] !== "") return Number(cfg["Y Static"]);
    if (Number(cfg["Y Variable ID"])) return $gameVariables.value(Number(cfg["Y Variable ID"]));
    return 0;
  };

  const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function () {
    _Scene_Map_createAllWindows.call(this);
    this._hudSprites = [];

    for (const cfg of hudList) {
      const sprite = new Sprite(new Bitmap(200, 48));
      sprite.bitmap.fontSize = 20;
      this.addChild(sprite);
      this._hudSprites.push({ sprite, cfg });
    }
  };

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function () {
    _Scene_Map_update.call(this);
    for (const { sprite, cfg } of this._hudSprites) {
      const variableId = Number(cfg["Variable ID"]);
      const label = cfg["Text Label"] || "";
      const value = $gameVariables.value(variableId);

      const x = getX(cfg);
      const y = getY(cfg);

      const bitmap = sprite.bitmap;
      bitmap.clear();
      bitmap.drawText(`${label} ${value}`, 0, 0, 200, 48, "left");
      sprite.x = x;
      sprite.y = y;
    }
  };
})();