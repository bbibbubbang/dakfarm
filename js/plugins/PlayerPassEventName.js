/*:
 * @plugindesc [플레이어 관통 커스텀] 플레이어는 선택한 이벤트 이름만 통과, 나머지 이벤트는 정상 충돌 (MV/MZ 공용)
 * @author pipupang & ChatGPT
 *
 * @target MZ
 *
 * @param PassEventNames
 * @type string[]
 * @text 관통할 이벤트 이름 목록
 * @desc 플레이어가 관통할 이벤트 이름을 쉼표(,)로 여러 개 입력 (예: 닭,Chicken,NPC2)
 * @default ["닭"]
 *
 * @help
 * ● 플레이어는 지정한 이름의 이벤트(예: "닭")만 통과, 나머지 이벤트와는 정상 충돌!
 * ● "지형태그 차단" 플러그인 등과 함께 사용해도 무방합니다.
 *
 * [사용법]
 * 1. 플러그인 등록 후 '관통할 이벤트 이름 목록'에 이벤트 이름 입력
 * 2. 예) ["닭"], ["닭", "Chicken"] 등
 *
 * -----------------------------
 * made with ChatGPT for pipupang
 */

(() => {
  const pluginName = "PlayerPassEventName";
  const parameters = PluginManager.parameters(pluginName);
  const PASS_EVENT_NAMES = JSON.parse(parameters.PassEventNames || "[]");

  const _Game_Player_isCollidedWithEvents = Game_Player.prototype.isCollidedWithEvents;
  Game_Player.prototype.isCollidedWithEvents = function(x, y) {
    const events = $gameMap.eventsXyNt(x, y);
    return events.some(event => {
      // 설정한 이름에 해당하는 이벤트는 관통
      if (PASS_EVENT_NAMES.includes(event.event().name)) return false;
      return event.isNormalPriority();
    });
  };
})();
