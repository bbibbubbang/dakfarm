/*:
 * @target MZ
 * @plugindesc [WebView 전용] 인덱스 수정 없이 전체화면/뷰포트 맞춤/버튼 제공 v1.0
 * @author you
 *
 * @help
 * - 인덱스(index.html) 수정 없이 전체화면을 지원합니다.
 * - 처음 터치/클릭 시 자동 전체화면(옵션) 진입 시도(모바일/웹뷰 우선).
 * - 캔버스를 항상 화면에 맞게 100% 채우도록 리사이즈합니다.
 * - 우상단 고정 토글 버튼 제공(옵션).
 * - 설정은 localStorage로 기억됩니다.
 *
 * 사용법
 * 1) 파일을 js/plugins/FullscreenWebView.js 로 저장
 * 2) 플러그인 매니저에서 ON
 *
 * 주의
 * - 일부 WebView/브라우저 정책에 따라 자동 전체화면은 사용자 제스처 후에만 허용됩니다.
 * - iOS WebView는 requestFullscreen 제약이 있을 수 있으므로 토글 버튼 사용을 권장합니다.
 *
 * @param showButton
 * @text 전체화면 버튼 표시
 * @type boolean
 * @default true
 *
 * @param autoEnterOnFirstTap
 * @text 첫 입력 시 자동 전체화면
 * @type boolean
 * @default true
 *
 * @param rememberState
 * @text 전체화면 상태 기억
 * @type boolean
 * @default true
 *
 * @param buttonRight
 * @text 버튼 오른쪽 여백(px)
 * @type number
 * @default 12
 *
 * @param buttonTop
 * @text 버튼 위쪽 여백(px)
 * @type number
 * @default 12
 *
 * @param buttonScale
 * @text 버튼 크기 배율
 * @type number
 * @decimals 2
 * @min 0.5
 * @max 3
 * @default 1
 */

(() => {
  const PLUGIN_NAME = "FullscreenWebView";
  const ps = PluginManager.parameters(PLUGIN_NAME);

  const SHOW_BUTTON = ps["showButton"] === "true";
  const AUTO_ENTER = ps["autoEnterOnFirstTap"] === "true";
  const REMEMBER = ps["rememberState"] === "true";
  const BTN_RIGHT = Number(ps["buttonRight"] || 12);
  const BTN_TOP   = Number(ps["buttonTop"] || 12);
  const BTN_SCALE = Number(ps["buttonScale"] || 1);

  const LS_KEY = "fswv_fullscreen_pref";

  // ---- 유틸 ----
  const isFullscreen = () => {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  };

  const canRequestFullscreen = (el) => {
    return !!(el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen);
  };

  const requestFullscreen = async (el) => {
    try {
      if (el.requestFullscreen) return await el.requestFullscreen();
      if (el.webkitRequestFullscreen) return await el.webkitRequestFullscreen();
      if (el.msRequestFullscreen) return await el.msRequestFullscreen();
    } catch (e) {
      // ignore
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) return await document.exitFullscreen();
      if (document.webkitExitFullscreen) return await document.webkitExitFullscreen();
      if (document.msExitFullscreen) return await document.msExitFullscreen();
    } catch (e) {
      // ignore
    }
  };

  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // ---- 캔버스/뷰포트 맞춤 ----
  function fitCanvasToViewport() {
    // RPG Maker MZ 캔버스 id는 "GameCanvas"
    const canvas = document.getElementById("GameCanvas");
    if (!canvas) return;

    // CSS로 뷰포트 꽉 채우기
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.maxWidth = "100vw";
    canvas.style.maxHeight = "100vh";
    canvas.style.margin = "0";
    canvas.style.padding = "0";

    // 상위 요소도 여백 제거
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // iOS Safari 주소창 이슈 완화용
    if (isIOS()) {
      // 1vh 버그 보정: CSS 변수로 실제 픽셀 기반 vh 제공
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      canvas.style.height = "calc(var(--vh) * 100)";
    }
  }

  function setupResizeHandlers() {
    window.addEventListener("resize", () => {
      fitCanvasToViewport();
    });
    window.addEventListener("orientationchange", () => {
      setTimeout(fitCanvasToViewport, 300);
    });
  }

  // ---- 버튼 UI ----
  let _fsBtn = null;
  function createFullscreenButton() {
    if (!SHOW_BUTTON) return;
    if (_fsBtn) return;

    const btn = document.createElement("button");
    _fsBtn = btn;
    btn.setAttribute("aria-label", "Toggle Fullscreen");
    btn.style.position = "fixed";
    btn.style.right = BTN_RIGHT + "px";
    btn.style.top = BTN_TOP + "px";
    btn.style.zIndex = "9999";
    btn.style.width = 48 * BTN_SCALE + "px";
    btn.style.height = 48 * BTN_SCALE + "px";
    btn.style.border = "none";
    btn.style.borderRadius = "12px";
    btn.style.background = "rgba(0,0,0,0.35)";
    btn.style.backdropFilter = "blur(4px)";
    btn.style.cursor = "pointer";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.transition = "opacity .2s ease";
    btn.style.userSelect = "none";

    btn.onmouseenter = () => (btn.style.background = "rgba(0,0,0,0.5)");
    btn.onmouseleave = () => (btn.style.background = "rgba(0,0,0,0.35)");

    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="${24 * BTN_SCALE}" height="${24 * BTN_SCALE}" fill="white" aria-hidden="true">
        <path d="M7 14H5v5h5v-2H7v-3zm0-4h3V7h2v5H7V10zM14 19h5v-5h-2v3h-3v2zM19 5h-5v2h3v3h2V5z"/>
      </svg>
    `;

    btn.addEventListener("click", async () => {
      if (isFullscreen()) {
        await exitFullscreen();
        if (REMEMBER) localStorage.setItem(LS_KEY, "off");
      } else {
        await requestFullscreen(document.documentElement);
        if (REMEMBER) localStorage.setItem(LS_KEY, "on");
      }
      updateButtonVisibility();
    });

    document.body.appendChild(btn);
    updateButtonVisibility();
  }

  function updateButtonVisibility() {
    if (!_fsBtn) return;
    // 전체화면 여부와 상관없이 버튼은 계속 보이게(토글용)
    _fsBtn.style.opacity = "1";
  }

  // ---- 첫 입력 시 자동 전체화면 ----
  let _armed = false;
  function armAutoEnter() {
    if (!AUTO_ENTER) return;
    if (_armed) return;
    _armed = true;

    const handler = async () => {
      if (isFullscreen()) return cleanup();
      // rememberState가 on일 때만 자동 진입 유지
      if (REMEMBER) {
        const pref = localStorage.getItem(LS_KEY);
        if (pref === "off") return cleanup();
      }
      if (canRequestFullscreen(document.documentElement)) {
        await requestFullscreen(document.documentElement);
        if (REMEMBER) localStorage.setItem(LS_KEY, "on");
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", handler, { passive: true });
      window.removeEventListener("keydown", handler, { passive: true });
    };

    window.addEventListener("pointerdown", handler, { passive: true });
    window.addEventListener("keydown", handler, { passive: true });
  }

  // ---- 부팅 훅 ----
  const _Scene_Boot_start = Scene_Boot.prototype.start;
  Scene_Boot.prototype.start = function() {
    _Scene_Boot_start.call(this);

    // DOM 준비 후 실행(한 프레임 뒤)
    requestAnimationFrame(() => {
      fitCanvasToViewport();
      setupResizeHandlers();
      createFullscreenButton();

      // 이전 상태 기억 적용
      if (REMEMBER) {
        const pref = localStorage.getItem(LS_KEY);
        if (pref === "on") {
          // 일부 환경은 사용자 제스처 전 자동 거부됨 → 첫 입력에서 재시도하도록 arm 유지
          requestFullscreen(document.documentElement);
        }
      }
      armAutoEnter();
    });
  };

  // 캔버스 생성 이후에도 스타일 유지를 위해 Graphics 초기화 지점에도 훅(안전망)
  const _Graphics__createCanvas = Graphics._createCanvas;
  Graphics._createCanvas = function() {
    _Graphics__createCanvas.call(this);
    setTimeout(fitCanvasToViewport, 0);
  };

})();
