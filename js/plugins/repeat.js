/*:
 * @plugindesc [🐔 자동 반복 드랍] 이벤트(닭)마다 개별 반복주기로 커먼이벤트를 실행해 아이템을 해당 위치에 드랍 (Extended Loot 연동)
 * @author pipupang & ChatGPT
 *
 * @target MZ
 *
 * @param DropCommonEventID
 * @type common_event
 * @text 드랍용 커먼이벤트ID
 * @desc 반복마다 실행할 커먼이벤트 ID(예: 알낳기, 아이템 증감 명령만 넣으세요)
 * @default 3
 *
 * @help
 * ● 각 닭(이벤트)마다 "메모란"에 <Repeat:변수ID> 형식으로 반복주기 지정!
 *  └ 예) <Repeat:21> → 변수[21]값(초)마다 반복됨
 *
 * ● 커먼이벤트에는 반드시 '아이템 증감' 명령을 넣어주세요!
 *  └ Extended Loot 등 드랍 플러그인과 완벽 호환
 *
 * [사용법]
 * 1. 이 플러그인을 js/plugins 폴더에 넣고 플러그인 관리자에서 ON
 * 2. DropCommonEventID 파라미터를 "알 드랍" 커먼이벤트 번호로 설정
 * 3. 각 닭 이벤트의 메모란에 <Repeat:변수ID> 입력!
 * 
 * [예시]
 *   <Repeat:21>      ← 변수[21]값(초)마다 드랍
 *   <Repeat:10>      ← 변수[10]값(초)마다 드랍
 * 
 * [팁]
 * - 커먼이벤트에서 아이템 증감 외에도 이펙트, 사운드 등 자유롭게 넣으세요!
 * - 변수값을 실시간으로 바꿔도 주기가 바로 변경됩니다.
 *
 * -----------------------------
 * made with ChatGPT for pipupang
 */

(() => {
  const pluginName = "repeat";

  // 파라미터 읽기 (플러그인 관리자에서 설정)
  const parameters = PluginManager.parameters(pluginName);
  const DROP_COMMON_ID = Number(parameters.DropCommonEventID || 3);

  Game_Event.prototype.startDropCommonEvent = function() {
    if (!this._dropInterpreter || !this._dropInterpreter.isRunning()) {
      this._dropInterpreter = new Game_Interpreter();
      this._dropInterpreter.setup($dataCommonEvents[DROP_COMMON_ID].list, this._eventId);
    }
  };

  const _Game_Event_update = Game_Event.prototype.update;
  Game_Event.prototype.update = function() {
    _Game_Event_update.call(this);

    if (!this._repeatInit) {
      if (this.event().note) {
        let repVar = this.event().note.match(/<Repeat:(\d+)>/);
        if (repVar) this._repeatVarId = Number(repVar[1]);
        this._repeatTimer = 0;
      }
      this._repeatInit = true;
    }

    if (this._repeatVarId) {
      let interval = Math.max($gameVariables.value(this._repeatVarId), 1);
      if (this._repeatTimer > 0) {
        this._repeatTimer--;
      } else {
        this.startDropCommonEvent();
        this._repeatTimer = interval * 60;
      }
    }

    if (this._dropInterpreter && this._dropInterpreter.isRunning()) {
      this._dropInterpreter.update();
    }
  };
})();
