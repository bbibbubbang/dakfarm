/*:
 * @target MZ
 * @plugindesc v1.0 [KR] 5초마다 자동저장 + 부팅 시 자동 로드(슬롯 지정 가능)
 * @author BB
 *
 * @param IntervalSeconds
 * @text 자동저장 간격(초)
 * @type number
 * @min 1
 * @default 5
 *
 * @param SavefileId
 * @text 저장 슬롯(권장: 1=오토세이브)
 * @type number
 * @min 1
 * @default 1
 *
 * @param SkipKey
 * @text 자동로드 건너뛰기 키
 * @type select
 * @option shift
 * @option control
 * @option alt
 * @default shift
 *
 * @help
 * ■ 기능
 * - 맵에 있을 때 설정한 간격(기본 5초)으로 자동저장합니다.
 * - 게임 실행 시 지정 슬롯에 세이브가 있으면 자동으로 로드합니다.
 *   (부팅 순간 Shift/Control/Alt 중 설정한 키를 누르고 있으면 자동로드를 건너뜁니다)
 *
 * ■ 권장 사용법
 * - SavefileId는 1로 두고(오토세이브 전용), 수동 저장은 2번 이상 슬롯을 쓰세요.
 * - 너무 잦으면 IntervalSeconds를 늘리세요(모바일/웹뷰: 10~15초 권장).
 *
 * ■ 주의
 * - 이벤트 실행/메시지 표시/장면 전환 중에는 저장을 미룹니다.
 * - 전투 중에는 저장하지 않습니다(맵 씬에서만 동작).
 *
 * 제작: BB (무료 사용)
 */
(() => {
  const pluginName = 'BB_AutoSaveAndLoadMZ';
  const p = PluginManager.parameters(pluginName);
  const INTERVAL = Math.max(1, Number(p['IntervalSeconds'] || 5));
  const SAVE_ID = Math.max(1, Number(p['SavefileId'] || 1));
  const SKIP_KEY = String(p['SkipKey'] || 'shift'); // 'shift' | 'control' | 'alt'

  function skipKeyPressed() {
    return Input.isPressed(SKIP_KEY);
  }

  // ---------- Auto Load on Boot (from Title) ----------
  let bbTriedAutoload = false;
  const _Scene_Title_start = Scene_Title.prototype.start;
  Scene_Title.prototype.start = function () {
    _Scene_Title_start.call(this);
    if (!bbTriedAutoload && !skipKeyPressed()) {
      bbTriedAutoload = true;
      // 지정 슬롯 로드 시도
      DataManager.loadGame(SAVE_ID)
        .then((success) => {
          if (success) {
            try { SoundManager.playLoad(); } catch (e) {}
            this.fadeOutAll();
            if ($gameSystem && $gameSystem.onAfterLoad) $gameSystem.onAfterLoad();
            SceneManager.goto(Scene_Map);
          }
          // 실패하면(세이브 없음 등) 그냥 타이틀 유지
        })
        .catch((e) => console.error('[BB_AutoSaveAndLoadMZ] autoload error', e));
    }
  };

  // ---------- Auto Save on Map ----------
  let bbSaving = false;

  function bbCanAutoSaveNow() {
    if (bbSaving) return false;
    if (!$gameSystem || !$gameMap) return false;
    if (!$gameSystem.isSaveEnabled()) return false;
    if ($gameMap.isEventRunning && $gameMap.isEventRunning()) return false;
    if ($gameMessage && $gameMessage.isBusy && $gameMessage.isBusy()) return false;
    if (SceneManager.isSceneChanging && SceneManager.isSceneChanging()) return false;
    if (SceneManager.isBusy && SceneManager.isBusy()) return false;
    return true;
  }

  function bbDoAutoSave() {
    bbSaving = true;
    DataManager.saveGameWithoutRescue(SAVE_ID)
      .then(() => {
        if ($gameSystem && $gameSystem.onAfterSave) $gameSystem.onAfterSave();
        // 성공해도 메시지는 따로 띄우지 않음(조용히 저장)
      })
      .catch((e) => console.error('[BB_AutoSaveAndLoadMZ] save failed', e))
      .finally(() => {
        bbSaving = false;
      });
  }

  const _Scene_Map_start = Scene_Map.prototype.start;
  Scene_Map.prototype.start = function () {
    _Scene_Map_start.call(this);
    this._bbNextAutoSaveAt = performance.now() + INTERVAL * 1000;
  };

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function () {
    _Scene_Map_update.call(this);
    if (this._bbNextAutoSaveAt === undefined) {
      this._bbNextAutoSaveAt = performance.now() + INTERVAL * 1000;
    }
    const now = performance.now();
    if (now >= this._bbNextAutoSaveAt) {
      if (bbCanAutoSaveNow()) {
        bbDoAutoSave();
        this._bbNextAutoSaveAt = now + INTERVAL * 1000;
      } else {
        // 바쁠 때는 0.5초 뒤로 미룸
        this._bbNextAutoSaveAt = now + 500;
      }
    }
  };
})();
