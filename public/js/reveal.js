
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('inView');
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.reveal_img_item').forEach(product => {
  observer.observe(product);
});



document.querySelectorAll('.wrap_p').forEach(product => {
  observer.observe(product);
});

document.querySelectorAll('[animate]').forEach((product) => {
  observer.observe(product);
});