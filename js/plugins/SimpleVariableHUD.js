/*:
 * @target MZ
 * @plugindesc [1.1] 화면에 변수값과 아이콘을 HUD로 표시 (pipupang용, 자유배포)
 * @author ChatGPT
 *
 * @param HUDList
 * @text HUD 항목 목록
 * @type struct<HUDItem>[]
 * @desc HUD에 표시할 변수ID, 아이콘, 위치, 색상 목록
 * @default []
 *
 * @param FontSize
 * @text 숫자 글씨 크기
 * @type number
 * @min 10
 * @max 72
 * @desc HUD 숫자 표시 크기(px)
 * @default 28
 */

/*~struct~HUDItem:
 * @param varId
 * @text 변수ID
 * @type variable
 * @desc 표시할 게임 변수의 ID
 * 
 * @param icon
 * @text 아이콘 파일명
 * @type file
 * @dir img/pictures/
 * @desc HUD에 사용할 아이콘 이미지 파일명 (확장자 제외)
 *
 * @param x
 * @text X 좌표
 * @type number
 * @desc HUD의 X 위치(px)
 * @default 550
 *
 * @param y
 * @text Y 좌표
 * @type number
 * @desc HUD의 Y 위치(px)
 * @default 20
 *
 * @param color
 * @text 글자색
 * @desc 숫자 표시 색상 (예: #fff, #ff0000)
 * @default #fff
 */

(() => {
    const pluginName = "SimpleVariableHUD";
    const params = PluginManager.parameters(pluginName);

    // HUD 목록 파싱
    const hudListRaw = JSON.parse(params.HUDList || "[]");
    const hudList = hudListRaw.map(str => {
        const obj = JSON.parse(str);
        return {
            varId: Number(obj.varId || 1),
            icon: obj.icon || "",
            x: Number(obj.x || 0),
            y: Number(obj.y || 0),
            color: obj.color || "#fff",
        };
    });

    const fontSize = Number(params.FontSize || 28);

    // Scene_Map에 HUD 표시용 Sprite 추가
    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _Scene_Map_createSpriteset.call(this);
        this._simpleVarHudSprites = [];
        for (let i = 0; i < hudList.length; i++) {
            const hud = hudList[i];
            const sprite = new Sprite();
            sprite.x = hud.x;
            sprite.y = hud.y;
            // 아이콘 스프라이트
            const icon = new Sprite(ImageManager.loadPicture(hud.icon));
            icon.x = 0;
            icon.y = 0;
            sprite.addChild(icon);
            // 텍스트 비트맵
            const text = new Sprite(new Bitmap(64, 32));
            text.x = 36; // 아이콘 오른쪽에
            text.y = 0;
            sprite.addChild(text);
            // 저장
            sprite._iconSprite = icon;
            sprite._textSprite = text;
            this._spriteset._tilemap.addChild(sprite);
            this._simpleVarHudSprites.push({sprite, hud, value: null});
        }
    };

    // 매 프레임마다 변수값 체크해서 변경시 갱신
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (!this._simpleVarHudSprites) return;
        for (let i = 0; i < this._simpleVarHudSprites.length; i++) {
            const obj = this._simpleVarHudSprites[i];
            const val = $gameVariables.value(obj.hud.varId);
            if (obj.value !== val) {
                obj.value = val;
                const bitmap = obj.sprite._textSprite.bitmap;
                bitmap.clear();
                bitmap.fontSize = fontSize;
                bitmap.textColor = obj.hud.color;
                bitmap.drawText(val, 0, 0, 60, 32, "left");
            }
        }
    };
})();
