class SmoothScroll {
  constructor(target, speed, smooth) {
    if (target === document)
      target = document.scrollingElement ||
               document.documentElement ||
               document.body.parentNode ||
               document.body;

    this.moving = false;
    this.pos = target.scrollTop;
    this.frame = target === document.body && document.documentElement
      ? document.documentElement
      : target;


    target.addEventListener('wheel', this.scrolled.bind(this), { passive: false });
    target.addEventListener('touchmove', this.scrolled.bind(this), { passive: false });

    this.speed = speed;
    this.smooth = smooth;
  }

  scrolled(e) {
    e.preventDefault();
    let delta = this.normalizeWheelDelta(e);
    this.pos += -delta * this.speed;
    this.pos = Math.max(0, Math.min(this.pos, this.frame.scrollHeight - this.frame.clientHeight));

    if (!this.moving) this.update();
  }

  normalizeWheelDelta(e) {
    if (e.detail) {
      if (e.wheelDelta)
        return e.wheelDelta / e.detail / 40 * (e.detail > 0 ? 1 : -1);
      else
        return -e.detail / 3;
    } else
      return e.wheelDelta / 120;
  }

  scrollToTop() {
    this.pos = 0;
    this.update();
  }

  update() {
    this.moving = true;
    let delta = (this.pos - this.frame.scrollTop) / this.smooth;
    this.frame.scrollTop += delta;

    if (Math.abs(delta) > 0.5)
      requestAnimationFrame(this.update.bind(this));
    else
      this.moving = false;
  }
}

function init() {
  const smoothScroll = new SmoothScroll(document, 100, 16);
  // smoothScroll.scrollToTop();
}
window.addEventListener('DOMContentLoaded',  init())
