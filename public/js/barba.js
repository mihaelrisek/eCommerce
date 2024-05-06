function delay(n) {
  n = n || 2000;
  return new Promise((done) => {
      setTimeout(() => {
          done();
      }, n);
  });
}

const animatedElements = document.querySelectorAll('[data-animate]');

let isAnimating1 = false;

const pageTransition = ()  => {
  
if ( isAnimating1 ) return;
isAnimating1 = true;
gsap.timeline({
        onComplete: () => isAnimating1 = false
    })
    .set(overlayPath, {
        attr: { d: 'M 0 100 V 100 Q 50 100 100 100 V 100 z' }
    })
    .to(overlayPath, { 
        duration: 0.8,
        ease: 'power4.in',
        attr: { d: 'M 0 100 V 50 Q 50 0 100 50 V 100 z' }
    }, 0)
    
    .to(overlayPath, { 
        duration: 0.3,
        ease: 'power2',
        attr: { d: 'M 0 100 V 0 Q 50 0 100 0 V 100 z' },
    })
    .set(overlayPath, { 
        attr: { d: 'M 0 0 V 100 Q 50 100 100 100 V 0 z' }
    })
    .to(overlayPath, { 
        duration: 0.3,
        ease: 'power2.in',
        attr: { d: 'M 0 0 V 50 Q 50 0 100 50 V 0 z' }
    })
    .to(overlayPath, { 
        duration: 0.8,
        ease: 'power4',
        attr: { d: 'M 0 0 V 0 Q 50 0 100 0 V 0 z' }
    })
}




const contentFadeIn = () => {
  var tl = gsap.timeline();
  tl.fromTo(animatedElements, { duration: 1, y: -30, opacity: 0, stagger: 0.1, delay: 0.2 },
                              { duration: 1, y: 0, opacity: 1, stagger: 0.1, delay: 0.2 });
}

const contentFadeOut = () => {
  var tl = gsap.timeline();
  tl.fromTo(animatedElements, { duration: .5, y: 0, opacity: 1, stagger: 0.1, delay: 0.2 },
                              { duration: .5, y: -30, opacity: 0, stagger: 0.1, delay: 0.2 });
}




  barba.init({
      // sync: true,

      // transitions: [
      //     {
              
      //         async leave(data) {
      //             const done = this.async();
      //             contentFadeOut();
      //             // pageTransition();
      //             await delay(1000);
      //             done();
      //         },
      //         // async enter(data) {
      //         //     contentFadeIn();
      //         // },

      //         async once(data) {
      //             contentFadeIn();
      //         },
      //     }
          
      // ],
  });



  // Define a function to load CSS file dynamically
function loadCSS(url) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

barba.hooks.before(() => {
  // This will be executed before every transition
  let nextPage = barba.history.current.url.split(window.location.origin)[1];
  let productRegex = /^\/product\/(.*)/;
  console.log("productRegex.test(nextPage)", productRegex.test(nextPage))
  switch (nextPage) {
    case '/login':
      loadCSS('/css/login.css');
      break;
    case '/products':
      loadCSS('/css/products.css');
      break;
  
    case '/cart':
      loadCSS('/css/cart.css');
      break;
}
});

