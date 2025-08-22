(function() {
    const button = document.getElementById("fullscreenButton");
    if (!button) return;

    function requestFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            return elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            return elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            return elem.msRequestFullscreen();
        }
    }

    function lockLandscape() {
        const orientation = screen.orientation;
        if (orientation && orientation.lock) {
            orientation.lock("landscape").catch(() => {});
        }
    }

    function unlockOrientation() {
        const orientation = screen.orientation;
        if (orientation && orientation.unlock) {
            orientation.unlock();
        }
    }

    button.addEventListener("click", () => {
        const fullscreenPromise = requestFullscreen();
        if (fullscreenPromise && fullscreenPromise.then) {
            fullscreenPromise.then(lockLandscape).catch(lockLandscape);
        } else {
            lockLandscape();
        }
    });

    function updateButtonVisibility() {
        if (document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement) {
            button.style.display = "none";
        } else {
            button.style.display = "block";
        }
    }

    function handleFullscreenChange() {
        updateButtonVisibility();
        if (document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement) {
            lockLandscape();
        } else {
            unlockOrientation();
        }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
})();

