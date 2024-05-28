class ImageSlider {
  constructor() {
    this.track = document.getElementById("image-track");
    this.itemContent = document.querySelectorAll('.image-item');
    this.trackItem = document.querySelectorAll('.image-content');
    this.speedWheel = 0.02;
    this.speedDrag = -0.1;
    this.progress = 0;
    this.startX = 0;
    this.isDown = false;

    this.initialize();
  }


  resizeItemOnScroll() {
    this.trackItem.forEach((item) => {
      const timeoutScale = item.getAttribute('data-timeout-scale');
      clearTimeout(timeoutScale);

      item.style.transform = 'scale(.97)';
      item.setAttribute('data-timeout-scale', setTimeout(() => {
        item.style.transform = 'scale(1)';
      }, 300));
    });
  }


  animate() {
    this.resizeItemOnScroll();
    this.progress = Math.min(Math.max(this.progress, 0), 100);

    this.track.animate({ transform: `translate(-${this.progress}%, -50%)` }, { duration: 1200, fill: "forwards" });
    

    for (const image of this.track.querySelectorAll(".image")) {
      image.animate({ objectPosition: `${this.progress}% center` }, { duration: 1200, fill: "forwards" });
    }
  }

  mouseWheel(e) {
    const wheelProgress = e.deltaY * this.speedWheel;
    this.progress += wheelProgress;
    this.animate();
  }

  mouseMove(e) {
    if (!this.isDown) return;

    const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const mouseProgress = (x - this.startX) * this.speedDrag;
    this.progress += mouseProgress;
    this.startX = x;
    this.animate();
  }

  mouseDown(e) {
    this.isDown = true;
    this.startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  }

  mouseUp() {
    this.isDown = false;
  }

  initialize() {
    this.animate();

    document.addEventListener('mousewheel', this.mouseWheel.bind(this));

    document.addEventListener('mousedown', this.mouseDown.bind(this));
    document.addEventListener('touchstart', this.mouseDown.bind(this));

    document.addEventListener('mousemove', this.mouseMove.bind(this));
    document.addEventListener('touchmove', this.mouseMove.bind(this));

    document.addEventListener('mouseup', this.mouseUp.bind(this));
    document.addEventListener('touchend', this.mouseUp.bind(this));
  }
}

 new ImageSlider();