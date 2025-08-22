/*:
 * @plugindesc 대각선 이동 허용/금지, 항상 대시 금지/허용을 플러그인 설정에서 선택 - ChatGPT
 * @author ChatGPT
 *
 * @param DisableDiagonal
 * @text 대각선 이동 금지
 * @type boolean
 * @on 금지
 * @off 허용
 * @default true
 * @desc true면 대각선 이동 완전 금지, false면 기본 대각선 이동 허용
 *
 * @param NoDashAlways
 * @text 항상 걷기(대시 금지)
 * @type boolean
 * @on 항상 걷기(대시 불가)
 * @off 기본 대시(Shift 허용)
 * @default true
 * @desc true면 항상 걷기(대시 불가), false면 기본 대시 사용(Shift 허용)
 *
 * @help
 * - "대각선 이동 금지"를 ON하면 플레이어/이벤트 모두 대각선 이동이 완전히 막힘.
 * - "항상 걷기(대시 금지)"를 ON하면 플레이어는 항상 걷기만 가능(Shift 불가).
 * 
 * 프로젝트 js/plugins 폴더에 MoveControl.js로 저장하고, 플러그인 관리자에서 활성화하고 설정을 변경하세요.
 */

(() => {
    const params = PluginManager.parameters('MoveControl');
    const disableDiagonal = String(params['DisableDiagonal'] || 'true') === 'true';
    const noDashAlways = String(params['NoDashAlways'] || 'true') === 'true';

    // 항상 걷기(대시 금지)
    if (noDashAlways) {
        Game_Player.prototype.isDashing = function() {
            return false;
        };
    }

    // 대각선 이동 완전 금지 (플레이어/이벤트 공통)
    if (disableDiagonal) {
        Game_Character.prototype.canPassDiagonally = function() {
            return false;
        };
    }
})();
