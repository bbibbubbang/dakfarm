//=============================================================================
// MoveSpeedParameter.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 플러그인 설정/명령으로 플레이어 이동속도를 1~99까지 자유롭게 변경 (초고속 지원)
 * @author ChatGPT
 *
 * @param DefaultMoveSpeed
 * @text 기본 이동속도(1~99)
 * @type number
 * @min 1
 * @max 99
 * @default 4
 *
 * @command SetMoveSpeed
 * @text 이동속도 변경
 * @desc 이벤트에서 이 명령 사용시 지정한 속도로 즉시 변경 (1~99)
 *
 * @arg speed
 * @text 이동속도(1~99)
 * @type number
 * @min 1
 * @max 99
 * @default 4
 *
 * @help
 * - 플러그인 매니저에서 "기본 이동속도"를 1~99로 설정 가능.
 * - 게임 시작/맵 이동시 자동 반영.
 * - 이벤트 > 플러그인 명령(SetMoveSpeed)에서 1~99로 입력시 즉시 반영.
 * - 스크립트에서도 $gamePlayer.setMoveSpeed(숫자);로 언제든 변경 가능.
 * - 7 이상 초고속은 벽 뚫림 등 부작용 있음, 실험/특수 연출 용도로 추천!
 */

(() => {
    // 파라미터 가져오기
    const parameters = PluginManager.parameters('MoveSpeedParameter');
    const defaultMoveSpeed = Number(parameters['DefaultMoveSpeed'] || 4);

    // 게임 시작/맵 이동마다 항상 적용
    const _Game_Player_setupForNewMap = Game_Player.prototype.setupForNewMap;
    Game_Player.prototype.setupForNewMap = function() {
        _Game_Player_setupForNewMap.apply(this, arguments);
        this.setMoveSpeed(defaultMoveSpeed);
    };
    const _Game_Player_initialize = Game_Player.prototype.initialize;
    Game_Player.prototype.initialize = function() {
        _Game_Player_initialize.apply(this, arguments);
        this.setMoveSpeed(defaultMoveSpeed);
    };

    // 플러그인 명령(MZ)
    if (PluginManager.registerCommand) {
        PluginManager.registerCommand('MoveSpeedParameter', 'SetMoveSpeed', args => {
            let speed = Number(args.speed || 4);
            speed = Math.max(1, Math.min(99, speed));
            $gamePlayer.setMoveSpeed(speed);
        });
    } else {
        // MV용 플러그인 명령
        var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
        Game_Interpreter.prototype.pluginCommand = function(command, args) {
            _Game_Interpreter_pluginCommand.call(this, command, args);
            if (command.toLowerCase() === 'setmovespeed') {
                var speed = Number(args[0] || 4);
                speed = Math.max(1, Math.min(99, speed));
                $gamePlayer.setMoveSpeed(speed);
            }
        };
    }
})();
