/*:
 * @target MZ
 * @plugindesc v1.0 [KR] 5초마다 자동저장 + 부팅 시 자동 로드(슬롯 지정 가능) (save 함수 폴백)
 * @author You
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
 * - 맵 씬에서 설정 간격(기본 5초)으로 자동저장.
 * - 게임 실행 시 지정 슬롯 세이브가 있으면 자동 로드.
 *   (부팅 때 설정 키를 누르고 있으면 자동로드 건너뜀)
 *
 * ■ 메모
 * - 일부 환경에서 DataManager.saveGameWithoutRescue가 없을 수 있어
 *   자동으로 DataManager.saveGame으로 폴백함.
 *
 * ■ 주의
 * - 이벤트 실행/메시지 표시/장면 전환 중에는 저장 보류.
 * - 전투/타이틀 등 맵 외 장면에선 저장 안 함.
 */
(() => {
  const pluginName = 'BB_AutoSaveAndLoadMZ';
  const p = PluginManager.parameters(pluginName);
  const INTERVAL = Math.max(1, Number(p['IntervalSeconds'] || 5));
  const SAVE_ID = Math.max(1, Number(p['SavefileId'] || 1));
  const SKIP_KEY = String(p['SkipKey'] || 'shift'); // 'shift' | 'control' | 'alt'

  // ----- 키 체크 -----
  function skipKeyPressed() { return Input.isPressed(SKIP_KEY); }

  // ----- 저장 함수 폴백 -----
  function saveGamePromise(slotId) {
    const fn = DataManager.saveGameWithoutRescue || DataManager.saveGame;
    try {
      const result = fn.call(DataManager, slotId);
      // MZ는 Promise<boolean> 반환. 혹시 동기라면 Promise로 감싸기.
      if (result && typeof result.then === 'function') return result;
      return Promise.resolve(!!result);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // ----- 부팅 시 자동 로드 -----
  let triedAutoload = false;
  const _Scene_Title_start = Scene_Title.prototype.start;
  Scene_Title.prototype.start = function () {
    _Scene_Title_start.call(this);
    if (!triedAutoload && !skipKeyPressed()) {
      triedAutoload = true;
      if (DataManager && DataManager.loadGame) {
        DataManager.loadGame(SAVE_ID).then(success => {
          if (success) {
            try { SoundManager.playLoad(); } catch (_) {}
            this.fadeOutAll();
            if ($gameSystem && $gameSystem.onAfterLoad) $gameSystem.onAfterLoad();
            SceneManager.goto(Scene_Map);
          }
        }).catch(e => console.error('[BB_AutoSaveAndLoadMZ] autoload error', e));
      }
    }
  };

  // ----- 맵에서 자동 저장 -----
  let savingNow = false;

  function canAutoSaveNow() {
    if (savingNow) return false;
    if (!$gameSystem || !$gameMap) return false;
    if (!$gameSystem.isSaveEnabled()) return false;
    if ($gameMap.isEventRunning && $gameMap.isEventRunning()) return false;
    if ($gameMessage && $gameMessage.isBusy && $gameMessage.isBusy()) return false;
    if (SceneManager.isSceneChanging && SceneManager.isSceneChanging()) return false;
    if (SceneManager.isBusy && SceneManager.isBusy()) return false;
    // 맵 씬에서만
    if (!(SceneManager._scene instanceof Scene_Map)) return false;
    return true;
  }

  function doAutoSave() {
    savingNow = true;
    saveGamePromise(SAVE_ID)
      .then(() => {
        if ($gameSystem && $gameSystem.onAfterSave) $gameSystem.onAfterSave();
      })
      .catch(e => console.error('[BB_AutoSaveAndLoadMZ] save failed', e))
      .finally(() => { savingNow = false; });
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
      if (canAutoSaveNow()) {
        doAutoSave();
        this._bbNextAutoSaveAt = now + INTERVAL * 1000;
      } else {
        this._bbNextAutoSaveAt = now + 500; // 잠깐 보류
      }
    }
  };
})();
