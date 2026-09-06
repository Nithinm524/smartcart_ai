(function () {
  const section = document.querySelector('.cinema-scroll');
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const track = document.querySelector('.sights-track');
  const sightsControls = document.querySelector('.sights-controls');
  const sightPrev = document.querySelector('.sight-prev');
  const sightNext = document.querySelector('.sight-next');
  const launchBtn = document.querySelector('.note-button');

  let targetMouseX = 0;
  let targetMouseY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetScroll = 0;
  let smoothScroll = 0;
  let initialized = false;
  let isRunning = false;
  let isVisible = true;
  let lastTime = performance.now();
  let sightCards = [];
  let originalSightCount = 0;
  let activeSight = 0;

  // Cached layout metrics to eliminate forced synchronous reflows in the animation loop
  let cachedSectionTop = 0;
  let cachedMaxScroll = 0;
  let cachedInnerWidth = window.innerWidth || 1920;
  let cachedInnerHeight = window.innerHeight || 1080;
  let cachedCardWidth = 0;
  let cachedGap = 0;
  let cachedSightsScreenTop = 150;
  let cachedSightsParentTop = 200;

  // Property cache to prevent redundant CSS variable writes and entire-tree style recalcs
  const propCache = new Map();
  function setProp(name, value) {
    if (propCache.get(name) !== value) {
      propCache.set(name, value);
      root.style.setProperty(name, value);
    }
  }

  function updateMetrics() {
    if (!section) return;
    cachedInnerWidth = window.innerWidth;
    cachedInnerHeight = window.innerHeight;
    const rect = section.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    cachedSectionTop = rect.top + scrollTop;
    cachedMaxScroll = Math.max(0, section.offsetHeight - cachedInnerHeight);

    cachedSightsScreenTop = Math.min(220, Math.max(112, cachedInnerHeight * 0.19)) - 50;
    cachedSightsParentTop = cachedInnerHeight - (cachedInnerHeight - cachedSightsScreenTop) / 0.85;

    if (track && sightCards.length) {
      cachedCardWidth = sightCards[0].offsetWidth;
      cachedGap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap || '0') || 0;
    }
  }

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smoothstep = (e0, e1, v) => {
    const x = clamp((v - e0) / (e1 - e0));
    return x * x * (3 - 2 * x);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const segmentInOut = (s, a, b, c, d) => {
    const enter = smoothstep(a, b, s);
    const exit = smoothstep(c, d, s);
    return { enter, exit, active: enter * (1 - exit) };
  };

  // Pure scroll measurement without touching layout properties or triggering reflow
  const getScrollDistance = () => {
    const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    return clamp(currentY - cachedSectionTop, 0, cachedMaxScroll);
  };

  function update(now) {
    if (!isVisible) {
      isRunning = false;
      return;
    }

    const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = now;

    targetScroll = getScrollDistance();
    if (!initialized || reduceMotion.matches) {
      smoothScroll = targetScroll;
      initialized = true;
    } else {
      // Frame-rate independent exponential decay (consistent on 60Hz, 90Hz, 120Hz)
      const scrollDecay = 1 - Math.exp(-10.5 * dt);
      smoothScroll = lerp(smoothScroll, targetScroll, scrollDecay);
    }
    if (Math.abs(smoothScroll - targetScroll) < 0.05) smoothScroll = targetScroll;

    if (cachedInnerWidth >= 768 && !reduceMotion.matches) {
      const mouseDecay = 1 - Math.exp(-8.0 * dt);
      mouseX = lerp(mouseX, targetMouseX, mouseDecay);
      mouseY = lerp(mouseY, targetMouseY, mouseDecay);
      if (Math.abs(mouseX - targetMouseX) < 0.0002) mouseX = targetMouseX;
      if (Math.abs(mouseY - targetMouseY) < 0.0002) mouseY = targetMouseY;
    } else {
      mouseX = 0;
      mouseY = 0;
    }

    const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
    const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
    const progress = clamp(smoothScroll / 2700);
    const introExit = smoothstep(90, 650, smoothScroll);
    const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
    const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
    const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
    const blurActive = clamp(frame2.active + frame3.active);
    const frame2Opacity = frame2.active * (1 - frame3.enter);
    const splitDrift = Math.pow(frame2.enter, 1.5);
    const panel2Opacity = frame2.active * (1 - frame2.exit);
    const panel3Opacity = frame3.active * (1 - frame3.exit);
    const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
    const sharedHeroY = progress * -74;
    const sharedHeroScale = progress * 0.23;

    setProp('--mx', mouseX.toFixed(4));
    setProp('--my', mouseY.toFixed(4));

    setProp('--back-opacity', (1 - frame2.active * 0.06).toFixed(4));
    setProp('--back-x', `${(mouseX * -12).toFixed(2)}px`);
    setProp('--back-y', `${(mouseY * -4).toFixed(2)}px`);
    setProp('--back-scale', backScale.toFixed(4));
    setProp('--four-y', `${(10 + progress * 10).toFixed(2)}vh`);
    setProp('--four-scale', (0.78 + progress * 0.16).toFixed(4));
    setProp('--bazaar-y', `${(20 - progress * 8).toFixed(2)}vh`);
    setProp('--back-brightness', (1 - blurActive * 0.22).toFixed(4));
    setProp('--bazaar-brightness', (1 - frame2.active * 0.22 - frame3.active * 0.06).toFixed(4));
    setProp('--bazaar-saturation', (1 + frame3.active * 0.18).toFixed(4));
    setProp('--shade-opacity', '1');
    setProp('--shade-z', frame2.active > 0.02 ? '2' : '0');
    setProp('--shade-top-alpha', (blurActive * 0.465).toFixed(4));
    setProp('--shade-mid-alpha', (blurActive * 0.42).toFixed(4));
    setProp('--shade-bottom-alpha', (blurActive * 0.51).toFixed(4));

    setProp('--title-y', `${(introExit * -210).toFixed(2)}px`);
    setProp('--title-scale', (1 - introExit * 0.08).toFixed(4));
    setProp('--title-opacity', (1 - introExit).toFixed(4));

    // Pure GPU transform for bridge: avoid mutating width or bottom to prevent forced reflows
    setProp('--bridge-x', `calc(-50% + ${(mouseX * 18).toFixed(2)}px)`);
    setProp('--bridge-y', `${(mouseY * 8 + sharedHeroY - frame2.exit * 760 - frame2.enter * 90).toFixed(2)}px`);
    setProp('--bridge-scale', (1.02 + sharedHeroScale + frame2.enter * 0.54 + frame2.exit * 0.46).toFixed(4));

    setProp('--split-left-x', `calc(-50% + ${(-splitDrift * 46).toFixed(2)}vw + ${(mouseX * 22).toFixed(2)}px)`);
    setProp('--split-left-y', `${(mouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
    setProp('--split-left-scale', (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));
    setProp('--split-right-x', `calc(-50% + ${(splitDrift * 46).toFixed(2)}vw + ${(mouseX * 22).toFixed(2)}px)`);
    setProp('--split-right-y', `${(mouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
    setProp('--split-right-scale', (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));

    setProp('--frame2-opacity', frame2Opacity.toFixed(4));
    setProp('--frame2-x', `calc(-50% + ${(mouseX * 10).toFixed(2)}px)`);
    setProp('--frame2-y', `calc(-50% + ${(mouseY * 8 - frame2.exit * 150).toFixed(2)}px)`);
    setProp('--frame2-scale', (1.06 + frame2.enter * 0.08 + frame2.exit * 0.08).toFixed(4));

    setProp('--intro-copy-y', `${(introExit * 90).toFixed(2)}px`);
    setProp('--intro-copy-opacity', (1 - introExit).toFixed(4));
    setProp('--panel2-opacity', panel2Opacity.toFixed(4));
    setProp('--panel2-y', `calc(-50% + ${(-frame2.exit * 86 + (1 - frame2.enter) * 58).toFixed(2)}px)`);
    setProp('--panel3-opacity', panel3Opacity.toFixed(4));
    setProp('--panel3-y', `calc(-50% + ${(-frame3.exit * 86 + (1 - frame3.enter) * 58).toFixed(2)}px)`);

    setProp('--sights-opacity', sightsEnter.toFixed(4));
    setProp('--sights-controls-opacity', sightsControlsEnter.toFixed(4));
    if (sightsControls) {
      sightsControls.classList.toggle('is-ready', sightsControlsEnter > 0.98);
    }
    setProp('--sights-visibility', sightsEnter > 0.01 ? 'visible' : 'hidden');
    setProp('--sights-y', '0px');
    setProp('--sights-enter-x', `${((1 - sightsEnter) * 420).toFixed(2)}vw`);
    setProp('--sights-scale', (1 / backScale).toFixed(4));
    setProp('--sights-top', `${cachedSightsParentTop.toFixed(2)}px`);
    setProp('--sights-screen-top', `${cachedSightsScreenTop.toFixed(2)}px`);

    const hasScrollMotion = Math.abs(smoothScroll - targetScroll) > 0.05;
    const hasMouseMotion = Math.abs(mouseX - targetMouseX) > 0.0002 || Math.abs(mouseY - targetMouseY) > 0.0002;

    if (hasScrollMotion || hasMouseMotion) {
      requestAnimationFrame(update);
    } else {
      isRunning = false;
    }
  }

  function requestTick() {
    if (!isRunning && isVisible) {
      isRunning = true;
      lastTime = performance.now();
      requestAnimationFrame(update);
    }
  }

  // IntersectionObserver to pause the animation loop completely when offscreen
  if ('IntersectionObserver' in window && section) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          requestTick();
        }
      });
    }, { rootMargin: '100px 0px' });
    observer.observe(section);
  }

  function setupSightSlider() {
    if (!track) return;
    const originalCards = Array.from(track.querySelectorAll('.sight-card'));
    originalSightCount = originalCards.length;
    if (!originalSightCount) return;

    track.replaceChildren();

    for (let setIndex = 0; setIndex < 3; setIndex++) {
      originalCards.forEach((card, cardIndex) => {
        const clone = card.cloneNode(true);
        clone.dataset.sightIndex = String(setIndex * originalSightCount + cardIndex);
        track.appendChild(clone);
      });
    }

    sightCards = Array.from(track.querySelectorAll('.sight-card'));
    activeSight = originalSightCount; // start in middle set

    sightCards.forEach(card => {
      card.addEventListener('click', () => selectSightCard(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectSightCard(card);
        }
      });
    });

    track.addEventListener('transitionend', normalizeSightSlider);
    updateMetrics();
    updateSightSlider();
  }

  function updateSightSlider() {
    if (!track || !sightCards.length) return;
    setProp('--sights-shift', `${-(cachedCardWidth + cachedGap) * activeSight}px`);
    sightCards.forEach(card => {
      card.classList.toggle('is-active', Number(card.dataset.sightIndex) === activeSight);
    });
  }

  function moveSightSlider(dir) {
    activeSight += dir;
    updateSightSlider();
  }

  function selectSightCard(card) {
    const idx = Number(card.dataset.sightIndex);
    if (Number.isFinite(idx)) {
      activeSight = idx;
      updateSightSlider();
    }
  }

  function jumpSightSlider(i) {
    if (!track) return;
    track.classList.add('is-jumping');
    activeSight = i;
    updateSightSlider();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (track) {
          track.classList.remove('is-jumping');
        }
      });
    });
  }

  function normalizeSightSlider() {
    if (activeSight >= originalSightCount * 2) {
      jumpSightSlider(activeSight - originalSightCount);
    } else if (activeSight < originalSightCount) {
      jumpSightSlider(activeSight + originalSightCount);
    }
  }

  // Pre-decode scene images asynchronously to eliminate first-scroll freezing
  function predecodeImages() {
    if ('decode' in HTMLImageElement.prototype) {
      document.querySelectorAll('.scene-img').forEach(img => {
        if (img.complete) return;
        img.decode().catch(() => {});
      });
    }
  }

  // Passive event listeners
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', () => {
    updateMetrics();
    updateSightSlider();
    requestTick();
  }, { passive: true });

  window.addEventListener('pointermove', (e) => {
    if (cachedInnerWidth < 768 || reduceMotion.matches) return;
    targetMouseX = e.clientX / cachedInnerWidth - 0.5;
    targetMouseY = e.clientY / cachedInnerHeight - 0.5;
    requestTick();
  }, { passive: true });

  if (sightPrev) {
    sightPrev.addEventListener('click', () => moveSightSlider(-1));
  }
  if (sightNext) {
    sightNext.addEventListener('click', () => moveSightSlider(1));
  }

  if (launchBtn) {
    launchBtn.addEventListener('click', () => {
      window.location.hash = '/dashboard';
    });
  }

  function init() {
    updateMetrics();
    setupSightSlider();
    predecodeImages();
    requestTick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
