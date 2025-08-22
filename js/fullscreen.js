function adjustGameSize() {
    if (window.Graphics && Graphics.resize) {
        Graphics.resize(window.innerWidth, window.innerHeight);
    }
}

async function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        await elem.requestFullscreen({ navigationUI: "hide" });
    } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
    }

    if (screen.orientation && screen.orientation.lock) {
        try {
            await screen.orientation.lock("landscape");
        } catch (e) {
            // Ignore errors
        }
    }

    adjustGameSize();
    setTimeout(() => window.scrollTo(0, 1), 0);
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("fullscreenBtn");
    if (btn) {
        btn.addEventListener("click", enterFullscreen);
    }
    window.addEventListener("resize", adjustGameSize);
});
