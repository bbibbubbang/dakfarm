/*:
 * @target MZ
 * @plugindesc 모바일 해상도 고정 (1280x720) + 확대 방지 전용 플러그인. 회전 고정 기능 없음.
 * @author ChatGPT
 * @help
 * - 해상도를 1280x720으로 고정합니다.
 * - 자동 확대 방지로 UI가 깨지지 않습니다.
 * - 회전 고정 기능은 포함되지 않았습니다.
 */

(() => {
  const width = 1280;
  const height = 720;

  // 고정 해상도 설정
  Graphics._defaultWidth = width;
  Graphics._defaultHeight = height;

  // 확대 방지
  Graphics._updateRealScale = function () {
    this._realScale = 1;
  };

  // 내부 스크린 설정 고정
  SceneManager._screenWidth = width;
  SceneManager._screenHeight = height;
  SceneManager._boxWidth = width;
  SceneManager._boxHeight = height;
})();
