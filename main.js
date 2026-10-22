
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const introScreen = document.getElementById("introScreen");
    const enterButton = document.getElementById("enterButton");
    const invitation = document.getElementById("invitation");

    const music = document.getElementById("carnivalMusic");
    const musicToggle = document.getElementById("musicToggle");
    const musicLabel = document.getElementById("musicLabel");

    const canvas = document.getElementById("confettiCanvas");
    const context = canvas.getContext("2d");

    const countdownMessage = document.getElementById("countdownMessage");
    const whatsappButton = document.getElementById("whatsappButton");
    const mapsButton = document.getElementById("mapsButton");

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    /*
     * Event configuration.
     *
     * Month indexes start at zero:
     * 10 = November.
     *
     * The countdown ends on November 7, 2026, at 8:00 p.m.
     * using the visitor's local device time.
     */
    const EVENT_DATE = new Date(2026, 10, 7, 20, 0, 0);

    const EVENT_CONFIG = {
        whatsappPhone: "",
        venue: "DonBosco",
        mapsUrl: ""
    };

    let hasEntered = false;
    let countdownInterval = null;
    let confettiAnimationFrame = null;
    let confettiPieces = [];
    let resizeTimeout = null;

    /* Music controls */

    function updateMusicButton() {
        const isPlaying = !music.paused && !music.ended;

        musicToggle.classList.toggle("is-playing", isPlaying);

        musicToggle.setAttribute(
            "aria-label",
            isPlaying ? "Pausar música" : "Reproducir música"
        );

        musicLabel.textContent = isPlaying
            ? "Pausar música"
            : "Reproducir música";
    }

    async function playMusic() {
        try {
            await music.play();
            updateMusicButton();
            return true;
        } catch (error) {
            updateMusicButton();

            console.warn(
                "No se pudo reproducir el audio. Comprueba assets/audio/carnaval.mp3.",
                error
            );

            return false;
        }
    }

    function pauseMusic() {
        music.pause();
        updateMusicButton();
    }

    music.addEventListener("play", updateMusicButton);
    music.addEventListener("pause", updateMusicButton);
    music.addEventListener("ended", updateMusicButton);

    music.addEventListener("error", () => {
        console.error(
            "Error al cargar la canción. Revisa la ruta y el formato del archivo."
        );
        updateMusicButton();
    });

    musicToggle.addEventListener("click", async () => {
        if (music.paused) {
            await playMusic();
        } else {
            pauseMusic();
        }
    });

    /* Open the invitation */

    enterButton.addEventListener("click", async () => {
        if (hasEntered) {
            return;
        }

        hasEntered = true;
        enterButton.disabled = true;

        /*
         * Request audio playback immediately after the user's click.
         * Browsers may block autoplay when no user interaction occurred.
         */
        await playMusic();

        introScreen.classList.add("is-exiting");

        invitation.setAttribute("aria-hidden", "false");
        invitation.classList.add("is-open");

        musicToggle.hidden = false;
        document.body.classList.remove("is-locked");

        if (!reducedMotion) {
            startConfetti();
        }

        observeRevealElements();

        window.setTimeout(() => {
            introScreen.hidden = true;

            document.getElementById("mensaje").scrollIntoView({
                behavior: reducedMotion ? "auto" : "smooth",
                block: "start"
            });
        }, reducedMotion ? 50 : 900);
    });

    /* Reveal elements when they enter the viewport */

    function observeRevealElements() {
        const elements = document.querySelectorAll(
            "#invitation .reveal:not(.is-visible)"
        );

        if (!("IntersectionObserver" in window)) {
            elements.forEach((element) => {
                element.classList.add("is-visible");
            });

            return;
        }

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        currentObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -35px 0px"
            }
        );

        elements.forEach((element) => {
            observer.observe(element);
        });
    }

    /* Countdown */

    const countdownElements = {
        days: document.getElementById("days"),
        hours: document.getElementById("hours"),
        minutes: document.getElementById("minutes"),
        seconds: document.getElementById("seconds")
    };

    function formatNumber(value, length = 2) {
        return String(value).padStart(length, "0");
    }

    function updateCountdown() {
        const now = new Date();
        const difference = EVENT_DATE.getTime() - now.getTime();

        if (difference <= 0) {
            Object.values(countdownElements).forEach((element) => {
                element.textContent = "00";
            });

            countdownMessage.textContent =
                "¡Llegó la hora! Que comience la celebración de Flor.";

            if (countdownInterval !== null) {
                window.clearInterval(countdownInterval);
                countdownInterval = null;
            }

            return;
        }

        const totalSeconds = Math.floor(difference / 1000);

        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        countdownElements.days.textContent = formatNumber(days, 3);
        countdownElements.hours.textContent = formatNumber(hours);
        countdownElements.minutes.textContent = formatNumber(minutes);
        countdownElements.seconds.textContent = formatNumber(seconds);

        countdownMessage.textContent =
            "El gran encuentro será el 7 de noviembre a las 8:00 p. m.";
    }

    function startCountdown() {
        updateCountdown();

        if (countdownInterval !== null) {
            window.clearInterval(countdownInterval);
        }

        countdownInterval = window.setInterval(updateCountdown, 1000);
    }

    startCountdown();

    /* Confetti canvas */

    const confettiColors = [
        "#ff287c",
        "#ffd36a",
        "#27ead0",
        "#ff8b38",
        "#a66cff",
        "#fff8f0"
    ];

    function resizeCanvas() {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(window.innerWidth * pixelRatio);
        canvas.height = Math.floor(window.innerHeight * pixelRatio);

        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function createConfettiPiece(initial = false) {
        return {
            x: Math.random() * window.innerWidth,
            y: initial
                ? Math.random() * window.innerHeight
                : -20,
            size: Math.random() * 5 + 3,
            speedY: Math.random() * 2.5 + 1.2,
            speedX: Math.random() * 2 - 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.12,
            sway: Math.random() * 1.5,
            phase: Math.random() * Math.PI * 2,
            color: confettiColors[
                Math.floor(Math.random() * confettiColors.length)
            ],
            shape: Math.random() > 0.35 ? "rect" : "circle",
            opacity: Math.random() * 0.45 + 0.55
        };
    }

    function drawConfettiPiece(piece) {
        context.save();

        context.globalAlpha = piece.opacity;
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;

        if (piece.shape === "circle") {
            context.beginPath();
            context.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
            context.fill();
        } else {
            context.fillRect(
                -piece.size / 2,
                -piece.size / 2,
                piece.size,
                piece.size * 1.6
            );
        }

        context.restore();
    }

    function animateConfetti() {
        context.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        confettiPieces.forEach((piece) => {
            piece.phase += 0.025;
            piece.x += piece.speedX + Math.sin(piece.phase) * piece.sway;
            piece.y += piece.speedY;
            piece.rotation += piece.rotationSpeed;

            drawConfettiPiece(piece);
        });

        confettiPieces = confettiPieces.filter(
            (piece) => piece.y < window.innerHeight + 30
        );

        if (confettiPieces.length > 0) {
            confettiAnimationFrame =
                window.requestAnimationFrame(animateConfetti);
        } else {
            context.clearRect(
                0,
                0,
                window.innerWidth,
                window.innerHeight
            );

            confettiAnimationFrame = null;
        }
    }

    function startConfetti() {
        if (reducedMotion) {
            return;
        }

        if (confettiAnimationFrame !== null) {
            window.cancelAnimationFrame(confettiAnimationFrame);
            confettiAnimationFrame = null;
        }

        resizeCanvas();

        confettiPieces = Array.from(
            { length: 150 },
            () => createConfettiPiece(true)
        );

        animateConfetti();
    }

    /* Resize handling */

    window.addEventListener("resize", () => {
        if (resizeTimeout !== null) {
            window.clearTimeout(resizeTimeout);
        }

        resizeTimeout = window.setTimeout(() => {
            resizeCanvas();

            if (confettiPieces.length > 0) {
                if (confettiAnimationFrame !== null) {
                    window.cancelAnimationFrame(confettiAnimationFrame);
                }

                animateConfetti();
            }
        }, 150);
    });

    /* WhatsApp confirmation */

    function configureWhatsApp() {
        const message =
            "Hola, quiero confirmar mi asistencia a los quince años " +
            "de Flor Gonzales el sábado 7 de noviembre de 2026 " +
            "a las 8:00 p. m. en DonBosco.";

        const encodedMessage = encodeURIComponent(message);

        if (EVENT_CONFIG.whatsappPhone.trim()) {
            const phone = EVENT_CONFIG.whatsappPhone.replace(/\D/g, "");

            whatsappButton.href =
                `https://wa.me/${phone}?text=${encodedMessage}`;
        } else {
            whatsappButton.href =
                `https://wa.me/?text=${encodedMessage}`;
        }
    }

    /* Venue location */

    function configureMaps() {
        if (EVENT_CONFIG.mapsUrl.trim()) {
            mapsButton.href = EVENT_CONFIG.mapsUrl;
            return;
        }

        const query = EVENT_CONFIG.venue
            ? `${EVENT_CONFIG.venue}, Barranquilla, Colombia`
            : "Barranquilla, Colombia";

        mapsButton.href =
            "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent(query);
    }

    configureWhatsApp();
    configureMaps();

    /* Initial canvas setup */

    resizeCanvas();
});
