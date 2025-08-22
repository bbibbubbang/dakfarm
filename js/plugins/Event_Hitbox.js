//=============================================================================
// Event_Hitbox.js (최적화판)
//=============================================================================
/*:
 * @plugindesc 히트박스 중앙/짝수(left/right)+reverse(위아래) 지원, xy오프셋 없이 (MV/MZ) [최적화: 8칸 이내만 검사]
 * @author ChatGPT
 * @target MZ
 * @command SetEventHitbox
 * @text SetEventHitbox
 * @desc 이벤트 히트박스 중앙/짝수(left/right)/reverse 지원
 * @arg w
 * @type number
 * @text 가로 칸수
 * @default 1
 * @arg h
 * @type number
 * @text 세로 칸수
 * @default 1
 * @arg reverse
 * @type boolean
 * @text 세로칸 역순(위로)
 * @default true
 * @arg horigin
 * @type select
 * @option left
 * @option right
 * @text 가로확장기준(짝수일때)
 * @desc 가로칸수가 짝수일 때, left=왼쪽, right=오른쪽 기준
 * @default left
 */

(function() {
    // ★ 플레이어에서 8칸 이내 이벤트만 검사(성능 최적화)
    const HITBOX_RADIUS = 8; // 필요시 5~15로 조정 가능

    Game_Event.prototype.getHitboxData = function() {
        if (this.list()) {
            for (let i = 0; i < this.list().length; i++) {
                let cmd = this.list()[i];
                // MZ: 플러그인 명령
                if (cmd.code === 357 && cmd.parameters[0] === "Event_Hitbox" && cmd.parameters[1] === "SetEventHitbox") {
                    let args = cmd.parameters[3];
                    let w = Number(args.w || 1);
                    let h = Number(args.h || 1);
                    let reverse = (typeof args.reverse === "undefined") ? true :
                        (args.reverse === 'true' || args.reverse === true);
                    let horigin = args.horigin || "left";
                    let ox;
                    if (w % 2 === 1) { // 홀수: 중앙 기준
                        ox = -Math.floor(w / 2);
                    } else { // 짝수: 기준 옵션
                        ox = (horigin === "right") ? -(w / 2 - 1) : -w / 2;
                    }
                    let oy = 0; // y오프셋 제거!
                    return {w, h, ox, oy, reverse};
                }
                // MV: 플러그인 커맨드
                if (cmd.code === 356) {
                    let args = cmd.parameters[0].split(" ");
                    if (args[0].toLowerCase() === "seteventhitbox") {
                        let w = Number(args[1] || 1);
                        let h = Number(args[2] || 1);
                        let reverse = (typeof args[5] === "undefined") ? true :
                            (['reverse','rev','r'].includes(args[5].toLowerCase()));
                        let horigin = args[6] || "left";
                        let ox;
                        if (w % 2 === 1) {
                            ox = -Math.floor(w / 2);
                        } else {
                            ox = (horigin === "right") ? -(w / 2 - 1) : -w / 2;
                        }
                        let oy = 0;
                        return {w, h, ox, oy, reverse};
                    }
                }
            }
        }
        return null;
    };

    Game_Event.prototype.hitboxContains = function(x, y) {
        var d = this._hitboxData || this.getHitboxData();
        if (!d) return false;
        for (var dx = 0; dx < d.w; dx++) {
            for (var dy = 0; dy < d.h; dy++) {
                var tx = this.x + (d.ox || 0) + dx;
                var ty = this.y + (d.oy || 0) + (d.reverse ? -dy : dy);
                if (tx === x && ty === y) return true;
            }
        }
        return false;
    };

    var _Game_Event_initialize = Game_Event.prototype.initialize;
    Game_Event.prototype.initialize = function(mapId, eventId) {
        _Game_Event_initialize.call(this, mapId, eventId);
        this._hitboxData = this.getHitboxData();
    };
    var _Game_Event_refresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function() {
        _Game_Event_refresh.call(this);
        this._hitboxData = this.getHitboxData();
    };

    // ★ 플레이어에서 반경 HITBOX_RADIUS(8칸) 이내 이벤트만 검사
    Game_Map.prototype.isEventHitboxBlocking = function(x, y) {
        return this.events().some(function(ev) {
            // 반경 제한: HITBOX_RADIUS 이내만 검사
            if (Math.abs(ev.x - x) > HITBOX_RADIUS || Math.abs(ev.y - y) > HITBOX_RADIUS) return false;
            return ev.hitboxContains && ev.hitboxContains(x, y);
        });
    };

    var _Game_Map_isPassable = Game_Map.prototype.isPassable;
    Game_Map.prototype.isPassable = function(x, y, d) {
        if (this.isEventHitboxBlocking(x, y)) return false;
        return _Game_Map_isPassable.call(this, x, y, d);
    };

    var _Game_Player_canPass = Game_Player.prototype.canPass;
    Game_Player.prototype.canPass = function(x, y, d) {
        if ($gameMap.isEventHitboxBlocking(x, y)) return false;
        return _Game_Player_canPass.call(this, x, y, d);
    };

    if (PluginManager.registerCommand) {
        PluginManager.registerCommand("Event_Hitbox", "SetEventHitbox", function(args) {});
    }
})();
