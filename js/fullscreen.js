(function() {
    const button = document.getElementById("fullscreenButton");
    if (!button) return;

    function requestFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }

    button.addEventListener("click", () => {
        requestFullscreen();
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

    document.addEventListener("fullscreenchange", updateButtonVisibility);
    document.addEventListener("webkitfullscreenchange", updateButtonVisibility);
    document.addEventListener("msfullscreenchange", updateButtonVisibility);
})();

