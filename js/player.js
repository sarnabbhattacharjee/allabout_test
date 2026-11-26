(() => {
  "use strict";

  const tracks = [
    { id: "dda01", title: "DDA01", artist: "John Oestmann", genre: "AMBIENT", duration: "2:24", seconds: 144, art: "#f13720", label: "AMBIENT / 02:24", album: "Disk Drive Ambient", file: "DDA01.mp3", archive: "diskdriveambient", source: "https://archive.org/details/diskdriveambient", license: "CC0 1.0 Universal", attribution: "John Oestmann — CC0 1.0 Universal" },
    { id: "dda02", title: "DDA02", artist: "John Oestmann", genre: "AMBIENT", duration: "1:41", seconds: 101, art: "#b8c2bc", label: "AMBIENT / 01:41", album: "Disk Drive Ambient", file: "DDA02.mp3", archive: "diskdriveambient", source: "https://archive.org/details/diskdriveambient", license: "CC0 1.0 Universal", attribution: "John Oestmann — CC0 1.0 Universal" },
    { id: "dda03", title: "DDA03", artist: "John Oestmann", genre: "AMBIENT", duration: "2:57", seconds: 177, art: "#d0bca8", label: "AMBIENT / 02:57", album: "Disk Drive Ambient", file: "DDA03.mp3", archive: "diskdriveambient", source: "https://archive.org/details/diskdriveambient", license: "CC0 1.0 Universal", attribution: "John Oestmann — CC0 1.0 Universal" },
    { id: "goals-txt", title: "goals.txt", artist: "John Oestmann", genre: "EXPERIMENTAL", duration: "3:29", seconds: 209, art: "#99a5a1", label: "EXPERIMENTAL / 03:29", album: "Disk Drive Ambient", file: "goals-dot-txt.mp3", archive: "diskdriveambient", source: "https://archive.org/details/diskdriveambient", license: "CC0 1.0 Universal", attribution: "John Oestmann — CC0 1.0 Universal" },
    { id: "wik-boom", title: "Wik (Boom Mix)", artist: "S. Abstract", genre: "ELECTRONIC", duration: "6:25", seconds: 385, art: "#e5d7a8", label: "ELECTRONIC / 06:25", album: "Free Tracks (Electro Techno Experimental)", file: "Wik%20(Boom%20Mix).mp3", archive: "free-tracks-electro-techno-experimental", source: "https://archive.org/details/free-tracks-electro-techno-experimental", license: "CC0 1.0 Universal", attribution: "S. Abstract — CC0 1.0 Universal" },
    { id: "wik", title: "Wik", artist: "S. Abstract", genre: "ELECTRONIC", duration: "6:53", seconds: 413, art: "#a7bdc0", label: "ELECTRONIC / 06:53", album: "Free Tracks (Electro Techno Experimental)", file: "Wik.mp3", archive: "free-tracks-electro-techno-experimental", source: "https://archive.org/details/free-tracks-electro-techno-experimental", license: "CC0 1.0 Universal", attribution: "S. Abstract — CC0 1.0 Universal" },
    { id: "boker-machine", title: "Boker Machine", artist: "S. Abstract", genre: "EXPERIMENTAL", duration: "6:18", seconds: 378, art: "#c5a1a1", label: "EXPERIMENTAL / 06:18", album: "Free Tracks (Electro Techno Experimental)", file: "Boker%20Machine.mp3", archive: "free-tracks-electro-techno-experimental", source: "https://archive.org/details/free-tracks-electro-techno-experimental", license: "CC0 1.0 Universal", attribution: "S. Abstract — CC0 1.0 Universal" },
    { id: "626-violin", title: "626 Violin", artist: "S. Abstract", genre: "EXPERIMENTAL", duration: "4:59", seconds: 299, art: "#c9c5e0", label: "EXPERIMENTAL / 04:59", album: "Free Tracks (Electro Techno Experimental)", file: "626%20Violin.mp3", archive: "free-tracks-electro-techno-experimental", source: "https://archive.org/details/free-tracks-electro-techno-experimental", license: "CC0 1.0 Universal", attribution: "S. Abstract — CC0 1.0 Universal" }
  ];

  const audio = document.querySelector("#audio");
  const state = {
    current: null,
    playing: false,
    error: null,
    shuffle: false,
    repeat: false,
    queue: [],
    context: null,
    source: null,
    analyser: null,
    data: null,
    audioReady: false
  };
  const $ = (selector) => document.querySelector(selector);
  const time = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  };
  const audioUrl = (track) => `https://archive.org/download/${track.archive}/${track.file}`;

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function updateTrackUI(track) {
    if (!track) return;
    setText("#player-title", track.title);
    setText("#player-artist", track.artist);
    setText("#now-title", track.title);
    setText("#now-artist", track.artist.toUpperCase());
    setText("#now-genre", `${track.genre} / ${track.album}`);
    setText("#now-duration", track.duration);
    setText("#hero-track-label", `${String(tracks.indexOf(track) + 1).padStart(2, "0")} / ${track.title} — ${track.artist.toUpperCase()}`);
    setText("#disc-track-label", track.label);
    setText("#expanded-disc-label", track.label);
    setText("#expanded-title", track.title.toUpperCase());
    setText("#expanded-artist", `${track.artist.toUpperCase()} / ${track.genre} / ${track.license}`);
    setText("#queue-current-track", `${track.title} — ${track.artist}`);
    document.querySelectorAll(".track-row").forEach((row) => row.classList.toggle("is-active", row.dataset.trackId === track.id));
    const label = $(".disc-hero .disc-label");
    if (label) label.style.background = track.art;
    const listenLabel = $(".disc-listen .disc-label");
    if (listenLabel) listenLabel.style.background = track.art;
    const expandedLabel = $(".disc-expanded .disc-label");
    if (expandedLabel) expandedLabel.style.background = track.art;
    document.querySelectorAll(".mini-art").forEach((art) => { art.style.background = track.art; art.textContent = track.title.slice(0, 3).toUpperCase(); });
    document.querySelectorAll(".track-art").forEach((art) => {
      if (art.dataset.trackId === track.id) art.textContent = track.title.slice(0, 3).toUpperCase();
    });
    renderQueue();
  }

  function updatePlaybackUI() {
    const playButton = $("#play-button");
    playButton.textContent = state.playing ? "Ⅱ" : "▶";
    playButton.setAttribute("aria-label", state.playing ? "Pause" : "Play");
    setText("#playback-state", state.error || (state.playing ? "PLAYING" : (state.current ? "PAUSED" : "STOPPED")));
    setText("#header-status", state.error || (state.playing ? "SIGNAL ACTIVE" : "SYSTEM READY"));
    document.body.classList.toggle("is-playing", state.playing);
    $("#hero-disc").setAttribute("aria-label", state.playing ? "Pause current track" : "Play current track");
    if (state.current) {
      const duration = Number.isFinite(audio.duration) ? audio.duration : state.current.seconds;
      $("#seek-bar").value = duration ? Math.round((audio.currentTime / duration) * 1000) : 0;
      setText("#current-time", time(audio.currentTime));
      setText("#duration-time", time(duration));
    }
  }

  function initAudioGraph() {
    if (state.audioReady) return true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    try {
      state.context = new AudioContext();
      state.source = state.context.createMediaElementSource(audio);
      state.analyser = state.context.createAnalyser();
      state.analyser.fftSize = 256;
      state.analyser.smoothingTimeConstant = 0.82;
      state.data = new Uint8Array(state.analyser.frequencyBinCount);
      state.source.connect(state.analyser);
      state.analyser.connect(state.context.destination);
      state.audioReady = true;
      window.dispatchEvent(new CustomEvent("obx:analyser", { detail: { analyser: state.analyser, data: state.data } }));
      return true;
    } catch (error) {
      console.warn("Audio visualization unavailable; playback remains enabled.", error);
      return false;
    }
  }

  async function playTrack(track, shouldPlay = true) {
    if (!track || !tracks.some((entry) => entry.id === track.id)) return;
    if (state.current?.id !== track.id) {
      audio.pause();
      audio.src = audioUrl(track);
      audio.load();
      state.current = track;
      state.error = null;
      updateTrackUI(track);
    }
    if (!shouldPlay) {
      state.playing = false;
      state.error = null;
      updatePlaybackUI();
      return;
    }
    initAudioGraph();
    if (state.context?.state === "suspended") {
      try { await state.context.resume(); } catch (error) { console.warn("Audio analysis could not resume.", error); }
    }
    try {
      await audio.play();
      state.playing = true;
      state.error = null;
      updatePlaybackUI();
      window.dispatchEvent(new CustomEvent("obx:playback", { detail: { playing: true, track: state.current } }));
    } catch (error) {
      state.playing = false;
      state.error = "AUDIO UNAVAILABLE";
      updatePlaybackUI();
      console.error(`Could not play "${track.title}" from ${track.source}`, error);
      window.dispatchEvent(new CustomEvent("obx:audioerror", { detail: { track, error } }));
    }
  }

  function togglePlay() {
    if (!state.current) return playTrack(tracks[0]);
    if (audio.paused) return playTrack(state.current);
    audio.pause();
  }

  function nextTrack() {
    if (!tracks.length) return;
    if (state.queue.length) {
      const next = state.queue.shift();
      renderQueue();
      return playTrack(next);
    }
    if (state.shuffle) {
      const candidates = tracks.filter((track) => track.id !== state.current?.id);
      return playTrack(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    const index = tracks.findIndex((track) => track.id === state.current?.id);
    return playTrack(tracks[(index + 1 + tracks.length) % tracks.length]);
  }

  function previousTrack() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const index = tracks.findIndex((track) => track.id === state.current?.id);
    return playTrack(tracks[(index - 1 + tracks.length) % tracks.length]);
  }

  function renderQueue() {
    const list = $("#queue-list");
    if (!list) return;
    list.replaceChildren();
    state.queue.forEach((track, index) => {
      const row = document.createElement("div");
      row.className = "queue-item";
      const play = document.createElement("button");
      play.className = "queue-play";
      play.type = "button";
      play.innerHTML = `${String(index + 1).padStart(2, "0")} / ${track.title}<span>${track.artist}</span>`;
      play.addEventListener("click", () => {
        state.queue.splice(index, 1);
        playTrack(track);
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${track.title} from queue`);
      remove.addEventListener("click", () => { state.queue.splice(index, 1); renderQueue(); });
      row.append(play, remove);
      list.append(row);
    });
    const count = String(state.queue.length).padStart(2, "0");
    setText("#queue-count", count);
    setText("#queue-panel-count", count);
  }

  function addToQueue(track) {
    if (!state.queue.some((queued) => queued.id === track.id)) state.queue.push(track);
    renderQueue();
    const panel = $("#queue-panel");
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
  }

  function renderArchive() {
    const list = $("#track-list");
    const genres = ["ALL", ...new Set(tracks.map((track) => track.genre))];
    const filters = $("#genre-filters");
    filters.replaceChildren();
    genres.forEach((genre, index) => {
      const button = document.createElement("button");
      button.className = `filter-button${index === 0 ? " is-active" : ""}`;
      button.type = "button";
      button.dataset.genre = genre;
      button.textContent = genre;
      filters.append(button);
    });
    function updateList() {
      const genre = $(".filter-button.is-active")?.dataset.genre || "ALL";
      const search = $("#track-search").value.trim().toLowerCase();
      const matches = tracks.filter((track) => (genre === "ALL" || track.genre === genre) && `${track.title} ${track.artist}`.toLowerCase().includes(search));
      list.replaceChildren();
      matches.forEach((track) => {
        const index = tracks.indexOf(track);
        const row = document.createElement("article");
        row.className = "track-row";
        row.dataset.trackId = track.id;
        row.tabIndex = 0;
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", `${track.title} by ${track.artist}, ${track.genre}, ${track.duration}`);
        const number = document.createElement("span");
        number.className = "track-number";
        number.textContent = String(index + 1).padStart(2, "0");
        const art = document.createElement("div");
        art.className = "track-art";
        art.dataset.trackId = track.id;
        art.style.setProperty("--art", track.art);
        art.textContent = track.title.slice(0, 3).toUpperCase();
        const info = document.createElement("div");
        info.className = "track-info";
        const title = document.createElement("span");
        title.className = "track-title";
        title.textContent = track.title;
        const artist = document.createElement("span");
        artist.className = "track-artist";
        artist.textContent = track.artist;
        const source = document.createElement("a");
        source.className = "track-source";
        source.href = track.source;
        source.target = "_blank";
        source.rel = "noreferrer";
        source.textContent = `${track.license} / ${track.attribution} / SOURCE ↗`;
        source.setAttribute("aria-label", `${track.title} source and license: ${track.license}. ${track.attribution}`);
        info.append(title, artist, source);
        const genreNode = document.createElement("span");
        genreNode.className = "track-genre";
        genreNode.textContent = track.genre;
        const duration = document.createElement("span");
        duration.className = "track-duration";
        duration.textContent = track.duration;
        const buttons = document.createElement("div");
        buttons.className = "track-buttons";
        const play = document.createElement("button");
        play.type = "button";
        play.textContent = "PLAY ↗";
        play.setAttribute("aria-label", `Play ${track.title} by ${track.artist}`);
        play.addEventListener("click", () => playTrack(track));
        const queue = document.createElement("button");
        queue.type = "button";
        queue.textContent = "+ QUEUE";
        queue.setAttribute("aria-label", `Add ${track.title} to queue`);
        queue.addEventListener("click", () => addToQueue(track));
        buttons.append(play, queue);
        row.append(number, art, info, genreNode, duration, buttons);
        row.addEventListener("dblclick", () => playTrack(track));
        row.addEventListener("click", (event) => {
          if (!event.target.closest("button, a")) playTrack(track);
        });
        row.addEventListener("keydown", (event) => {
          if ((event.key === "Enter" || event.key === " ") && !event.target.closest("button, a")) {
            event.preventDefault();
            playTrack(track);
          }
        });
        list.append(row);
      });
      if (!matches.length) {
        const empty = document.createElement("p");
        empty.className = "micro";
        empty.textContent = "NO FREQUENCIES MATCH. TRY ANOTHER SEARCH.";
        list.append(empty);
      }
      if (state.current) document.querySelectorAll(".track-row").forEach((row) => row.classList.toggle("is-active", row.dataset.trackId === state.current.id));
    }
    filters.addEventListener("click", (event) => {
      const button = event.target.closest(".filter-button");
      if (!button) return;
      filters.querySelectorAll(".filter-button").forEach((item) => item.classList.toggle("is-active", item === button));
      updateList();
    });
    $("#track-search").addEventListener("input", updateList);
    updateList();
  }

  $("#play-button").addEventListener("click", togglePlay);
  $("#hero-disc").addEventListener("click", togglePlay);
  $("#next-button").addEventListener("click", nextTrack);
  $("#previous-button").addEventListener("click", previousTrack);
  $("#shuffle-button").addEventListener("click", (event) => {
    state.shuffle = !state.shuffle;
    event.currentTarget.setAttribute("aria-pressed", String(state.shuffle));
  });
  $("#repeat-button").addEventListener("click", (event) => {
    state.repeat = !state.repeat;
    event.currentTarget.setAttribute("aria-pressed", String(state.repeat));
  });
  $("#seek-bar").addEventListener("input", (event) => {
    if (Number.isFinite(audio.duration)) audio.currentTime = (Number(event.target.value) / 1000) * audio.duration;
  });
  $("#volume-bar").addEventListener("input", (event) => { audio.volume = Number(event.target.value); audio.muted = false; });
  $("#mute-button").addEventListener("click", () => {
    audio.muted = !audio.muted;
    $("#mute-button").setAttribute("aria-pressed", String(audio.muted));
    $("#mute-button").setAttribute("aria-label", audio.muted ? "Unmute" : "Mute");
    setText("#mute-button", audio.muted ? "MUTED" : "VOL");
  });
  audio.addEventListener("play", () => {
    state.playing = true;
    updatePlaybackUI();
    window.dispatchEvent(new CustomEvent("obx:playback", { detail: { playing: true, track: state.current } }));
  });
  audio.addEventListener("pause", () => {
    state.playing = false;
    updatePlaybackUI();
    window.dispatchEvent(new CustomEvent("obx:playback", { detail: { playing: false, track: state.current } }));
  });
  audio.addEventListener("timeupdate", updatePlaybackUI);
  audio.addEventListener("loadedmetadata", updatePlaybackUI);
  audio.addEventListener("ended", () => {
    if (state.repeat) {
      audio.currentTime = 0;
      playTrack(state.current);
    } else nextTrack();
  });
  audio.addEventListener("error", () => {
    if (!state.current) return;
    state.playing = false;
    state.error = "SOURCE UNAVAILABLE";
    updatePlaybackUI();
    console.error(`Audio source unavailable: ${audio.currentSrc || audioUrl(state.current)}. Select another track.`);
    window.dispatchEvent(new CustomEvent("obx:audioerror", { detail: { track: state.current } }));
  });

  window.OBXPlayer = { tracks, state, playTrack, togglePlay, nextTrack, previousTrack, addToQueue, initAudioGraph, time };
  renderArchive();
  renderQueue();
})();
