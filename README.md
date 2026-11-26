# OBNOXIOUS

An experimental, responsive music-player installation built with HTML, CSS, vanilla JavaScript, GSAP, ScrollTrigger, and the Web Audio API.

## Run locally

Serve this directory over HTTP (rather than opening `index.html` directly):

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. GSAP, ScrollTrigger, and the display fonts load from CDNs. Audio streams from the Internet Archive and require network access; playback begins only after a user action.

## Music and design references

The eight archive selections are CC0 1.0 releases; track titles, artists, durations, source pages, and license details are included in the archive UI and `js/player.js`.

- [Disk Drive Ambient — John Oestmann (CC0)](https://archive.org/details/diskdriveambient)
- [Free Tracks (Electro Techno Experimental) — S. Abstract (CC0)](https://archive.org/details/free-tracks-electro-techno-experimental)
- [Benjamin Righetti — Awwwards case study](https://www.awwwards.com/case-study-benjamin-righetti.html)
- [RCA Records — Awwwards](https://www.awwwards.com/sites/rca-records)
- [GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [International Typographic Style — Design Atlas](https://www.designatlas.org/en/foundations/design-history-and-criticism/international-typographic-style/)
