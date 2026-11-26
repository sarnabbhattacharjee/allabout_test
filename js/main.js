(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const machine = $("#hero-machine");
  const ejectButton = $("#eject-button");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function ejectDisc() {
    const ejected = machine.classList.toggle("is-ejected");
    ejectButton.innerHTML = ejected ? 'INSERT <span>↙</span>' : 'EJECT <span>↗</span>';
    $("#machine-state").textContent = ejected ? "EJECTED / MOTOR IDLE" : "LOADED";
    $("#hero-disc").disabled = ejected;
    $("#hero-disc").setAttribute("aria-label", ejected ? "Disc ejected; insert it to play" : "Play or pause current track");
    window.dispatchEvent(new CustomEvent("obx:eject", { detail: { ejected } }));
    if (window.gsap && !reducedMotion.matches) {
      window.gsap.to("#hero-disc", { yPercent: ejected ? 38 : 0, rotation: ejected ? 9 : 0, duration: .6, ease: "power3.inOut" });
      window.gsap.to("#drive-tray", { yPercent: ejected ? -68 : 0, duration: .45, ease: "power2.out" });
    }
  }
  ejectButton.addEventListener("click", ejectDisc);

  let dragState = null;
  $("#hero-disc").addEventListener("pointerdown", (event) => {
    if (machine.classList.contains("is-ejected")) return;
    const disc = event.currentTarget;
    const rect = disc.getBoundingClientRect();
    dragState = { startX: event.clientX, startY: event.clientY, rotation: 0, centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 };
    disc.setPointerCapture(event.pointerId);
  });
  $("#hero-disc").addEventListener("pointermove", (event) => {
    if (!dragState || machine.classList.contains("is-ejected")) return;
    const angle = Math.atan2(event.clientY - dragState.centerY, event.clientX - dragState.centerX) * 180 / Math.PI;
    const initial = Math.atan2(dragState.startY - dragState.centerY, dragState.startX - dragState.centerX) * 180 / Math.PI;
    dragState.rotation = angle - initial;
    event.currentTarget.style.setProperty("--drag-rotation", `${dragState.rotation}deg`);
    event.currentTarget.style.setProperty("--inspection-angle", `${dragState.rotation}deg`);
  });
  ["pointerup", "pointercancel"].forEach((name) => $("#hero-disc").addEventListener(name, () => { dragState = null; }));

  $("#signal-toggle").addEventListener("click", (event) => {
    const enabled = document.body.classList.toggle("signal-break");
    event.currentTarget.setAttribute("aria-pressed", String(enabled));
    event.currentTarget.querySelector("span").textContent = enabled ? "ON" : "OFF";
  });

  $("#lyrics-toggle").addEventListener("click", (event) => {
    const panel = $("#lyrics-panel");
    const open = panel.hidden;
    panel.hidden = !open;
    event.currentTarget.setAttribute("aria-expanded", String(open));
    event.currentTarget.querySelector("span").textContent = open ? "−" : "＋";
  });

  const overlay = $("#player-overlay");
  function openPlayer() {
    overlay.hidden = false;
    document.body.classList.add("overlay-open");
    if (window.gsap && !reducedMotion.matches) window.gsap.fromTo(".overlay-content > *", { y: 25, opacity: 0 }, { y: 0, opacity: 1, stagger: .08, duration: .45, ease: "power2.out" });
    $("#close-player").focus();
  }
  function closePlayer() {
    overlay.hidden = true;
    document.body.classList.remove("overlay-open");
    $("#expand-button").focus();
  }
  $("#expand-button").addEventListener("click", openPlayer);
  $("#expand-player-button").addEventListener("click", openPlayer);
  $("#close-player").addEventListener("click", closePlayer);
  $("#overlay-queue").addEventListener("click", () => { closePlayer(); openQueue(); });
  $("#overlay-lyrics").addEventListener("click", () => { closePlayer(); $("#lyrics-panel").hidden = false; $("#lyrics-toggle").setAttribute("aria-expanded", "true"); $("#lyrics-panel").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" }); });

  const queuePanel = $("#queue-panel");
  function openQueue() {
    queuePanel.classList.add("is-open");
    queuePanel.setAttribute("aria-hidden", "false");
    $("#queue-close").focus();
  }
  function closeQueue() {
    queuePanel.classList.remove("is-open");
    queuePanel.setAttribute("aria-hidden", "true");
    $("#queue-open").focus();
  }
  $("#queue-open").addEventListener("click", openQueue);
  $("#queue-close").addEventListener("click", closeQueue);
  $("#clear-queue").addEventListener("click", () => { window.OBXPlayer.state.queue.length = 0; $("#queue-list").replaceChildren(); $("#queue-count").textContent = "00"; $("#queue-panel-count").textContent = "00"; });

  const shortcuts = $("#shortcuts-dialog");
  $("#shortcuts-open").addEventListener("click", () => { shortcuts.hidden = false; $("#shortcuts-close").focus(); });
  $("#shortcuts-close").addEventListener("click", () => { shortcuts.hidden = true; $("#shortcuts-open").focus(); });
  shortcuts.addEventListener("click", (event) => {
    if (event.target === shortcuts) { shortcuts.hidden = true; $("#shortcuts-open").focus(); }
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const editing = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    if (editing) return;
    if (event.code === "Space") { event.preventDefault(); window.OBXPlayer.togglePlay(); }
    if (event.key.toLowerCase() === "m") $("#mute-button").click();
    if (event.key.toLowerCase() === "e") ejectDisc();
    if (event.key === "ArrowLeft" && window.OBXPlayer.state.current) { event.preventDefault(); const audio = $("#audio"); audio.currentTime = Math.max(0, audio.currentTime - 5); }
    if (event.key === "ArrowRight" && window.OBXPlayer.state.current) { event.preventDefault(); const audio = $("#audio"); audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 5); }
    if (event.key === "Escape") {
      if (!shortcuts.hidden) { shortcuts.hidden = true; $("#shortcuts-open").focus(); }
      else if (!overlay.hidden) closePlayer();
      else if (queuePanel.classList.contains("is-open")) closeQueue();
    }
    if (event.key === "?") { shortcuts.hidden = false; $("#shortcuts-close").focus(); }
  });

  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mode-button").forEach((item) => item.classList.toggle("is-active", item === button));
      window.dispatchEvent(new CustomEvent("obx:visualizer", { detail: { mode: button.dataset.mode } }));
      $("#visualizer-label").textContent = `${button.dataset.mode.toUpperCase()} / AUDIO REACTIVE`;
    });
  });

  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".main-nav a")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle("is-current", link.hash === `#${entry.target.id}`));
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach((section) => observer.observe(section));
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({
      reduce: "(prefers-reduced-motion: reduce)",
      desktop: "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
      mobile: "(max-width: 900px) and (prefers-reduced-motion: no-preference)"
    }, (context) => {
      const { reduce, desktop, mobile } = context.conditions;
      gsap.from(".hero-title span", { yPercent: 110, opacity: 0, duration: reduce ? .15 : .8, stagger: .11, ease: "power4.out", delay: .08 });
      gsap.from(".machine", { y: 35, rotation: 2, opacity: 0, duration: reduce ? .2 : .9, ease: "power3.out", delay: .25 });
      gsap.from(".hero-stamp, .hero-caption, .hero-meta", { opacity: 0, y: 12, duration: reduce ? .15 : .55, stagger: .08, delay: .48 });
      if (reduce) return;
      gsap.to(".disc-hero", { rotation: 360, duration: 18, ease: "none", repeat: -1, paused: true });
      const heroRotation = gsap.getTweensOf(".disc-hero")[0];
      const handlePlayback = (event) => {
        if (machine.classList.contains("is-ejected")) return;
        if (event.detail.playing) heroRotation?.play();
        else heroRotation?.pause();
      };
      const handleEject = (event) => {
        if (event.detail.ejected) heroRotation?.pause();
        else if (window.OBXPlayer.state.playing) heroRotation?.play();
      };
      window.addEventListener("obx:playback", handlePlayback);
      window.addEventListener("obx:eject", handleEject);
      gsap.to(".disc-object", { rotation: 343, ease: "none", scrollTrigger: { trigger: "#object", start: "top bottom", end: "bottom top", scrub: 1 } });
      gsap.from(".object-heading", { x: -55, opacity: .2, scrollTrigger: { trigger: "#object", start: "top 70%", end: "top 30%", scrub: .6 } });
      gsap.from(".archive-heading-row h2", { y: 55, opacity: .3, scrollTrigger: { trigger: "#archive", start: "top 70%", end: "top 32%", scrub: .6 } });
      gsap.from(".poster-word-one", { xPercent: -8, scrollTrigger: { trigger: "#poster", start: "top bottom", end: "bottom top", scrub: 1 } });
      gsap.from(".poster-word-three", { xPercent: 8, scrollTrigger: { trigger: "#poster", start: "top bottom", end: "bottom top", scrub: 1 } });
      gsap.to(".poster-red-shape", { rotation: 12, scale: 1.12, scrollTrigger: { trigger: "#poster", start: "top bottom", end: "bottom top", scrub: 1 } });
      if (desktop) {
        gsap.from(".listen-object", { scale: .85, scrollTrigger: { trigger: "#listen", start: "top bottom", end: "top 15%", scrub: .7 } });
      }
      if (mobile) ScrollTrigger.config({ ignoreMobileResize: true });
      return () => {
        window.removeEventListener("obx:playback", handlePlayback);
        window.removeEventListener("obx:eject", handleEject);
      };
    });
  }

  const canvas = $("#visualizer");
  const ctx = canvas.getContext("2d");
  let analyser = null;
  let data = null;
  let mode = "radial";
  let animationId = 0;
  let lastFrame = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawVisualizer(now = 0) {
    animationId = 0;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || document.hidden) return;
    if (!analyser || !data || !window.OBXPlayer.state.playing) {
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (window.OBXPlayer.state.playing && !document.hidden) animationId = requestAnimationFrame(drawVisualizer);
      return;
    }
    if (now - lastFrame < 33) { animationId = requestAnimationFrame(drawVisualizer); return; }
    lastFrame = now;
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = rect.width * .38;
    ctx.fillStyle = "#171715";
    if (mode === "radial") {
      const count = 72;
      for (let i = 0; i < count; i++) {
        const value = data[Math.floor(i * data.length / count)] / 255;
        const angle = (i / count) * Math.PI * 2;
        const inner = radius + 5;
        const outer = inner + 8 + value * 44;
        ctx.lineWidth = i % 4 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
        ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
        ctx.strokeStyle = i % 5 === 0 ? "#f4f2eb" : "#171715";
        ctx.stroke();
      }
    } else if (mode === "line") {
      const waveform = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(waveform);
      ctx.beginPath();
      waveform.forEach((value, index) => {
        const x = index / (waveform.length - 1) * rect.width;
        const y = centerY + (value - 128) / 128 * rect.height * .35;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#171715";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (mode === "bars") {
      const width = rect.width / data.length;
      data.forEach((value, index) => {
        const height = (value / 255) * rect.height * .72;
        ctx.fillStyle = index % 4 === 0 ? "#f4f2eb" : "#171715";
        ctx.fillRect(index * width, rect.height - height, Math.max(1, width - 2), height);
      });
    } else {
      const count = 36;
      for (let i = 0; i < count; i++) {
        const value = data[(i * 7) % data.length] / 255;
        const angle = i * 2.399;
        const distance = radius * (.15 + value * .9);
        const size = 1 + value * 6;
        ctx.fillStyle = i % 4 === 0 ? "#f4f2eb" : "#171715";
        ctx.fillRect(centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance, size, size);
      }
    }
    animationId = requestAnimationFrame(drawVisualizer);
  }

  window.addEventListener("obx:analyser", (event) => {
    analyser = event.detail.analyser;
    data = event.detail.data;
    resizeCanvas();
    if (!animationId) animationId = requestAnimationFrame(drawVisualizer);
  });
  window.addEventListener("obx:visualizer", (event) => { mode = event.detail.mode; });
  window.addEventListener("obx:playback", (event) => {
    if (event.detail.playing && !animationId) animationId = requestAnimationFrame(drawVisualizer);
    if (!event.detail.playing && animationId) { cancelAnimationFrame(animationId); animationId = 0; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && animationId) { cancelAnimationFrame(animationId); animationId = 0; }
    else if (!document.hidden && window.OBXPlayer.state.playing && !animationId) animationId = requestAnimationFrame(drawVisualizer);
  });
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
})();
