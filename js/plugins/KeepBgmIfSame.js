/*:
 * @plugindesc 맵 이동 시 BGM이 같으면 음악을 끊지 않고 이어서 재생합니다. (Keep BGM If Same)
 * @author ChatGPT
 * 
 * @help
 * ▷ 사용법
 * 1. 플러그인 파일명을 KeepBgmIfSame.js 등으로 저장
 * 2. RPG Maker MV/MZ 프로젝트의 js/plugins 폴더에 복사
 * 3. 플러그인 관리자에서 활성화
 * 
 * ▷ 동작 방식
 * - 맵의 BGM 설정이 이전 맵과 완전히 같으면 음악이 끊기지 않고 자연스럽게 이어집니다.
 * - 볼륨, 피치, 팬 설정까지 모두 같아야 유지됩니다.
 * - 다를 경우에는 원래대로 BGM이 다시 처음부터 재생됩니다.
 */

(function() {
    var _Scene_Map_playMapBgm = Scene_Map.prototype.playMapBgm;
    Scene_Map.prototype.playMapBgm = function() {
        var mapBgm = $dataMap.bgm;
        var currentBgm = AudioManager._currentBgm;
        // 맵 BGM 설정이 있고, 지금 BGM과 같으면 다시 재생하지 않음
        if (mapBgm && currentBgm && mapBgm.name === currentBgm.name) {
            if (mapBgm.volume === currentBgm.volume &&
                mapBgm.pitch === currentBgm.pitch &&
                mapBgm.pan === currentBgm.pan) {
                return;
            }
        }
        _Scene_Map_playMapBgm.call(this);
    };
})();
