var getStartedBtn = document.querySelector("button")
var toFilterBtn = document.getElementById("to-filter")
var toSupercutBtn = document.getElementById("to-supercut")

var btns = [getStartedBtn, toFilterBtn, toSupercutBtn]
var firstInput = document.getElementById("find-video")
var filterInput = document.getElementById("filter-subs")
var supercut = document.getElementById("create-supercut")

var inputs = [firstInput, filterInput, supercut]
var scrollTop = window.pageYOffset
console.log(inputs.length)
btns.forEach((btn, i) => {
  var inp = inputs[i]
  // var scrollFunc = inp.scrollIntoView({behavior: "smooth"})
  // btn.addEventListener('click', scrollFunc)
  const finalOffset = inp.getBoundingClientRect().top + scrollTop
  btn.addEventListener('click', () => {
    window.scrollTo({
      top: finalOffset,
      behavior: 'auto'
    })
  })
})

var scrollToFirstInput = function() {
    var firstInput = document.getElementById("find-video")
    firstInput.scrollIntoView({behavior: "smooth"})
}

// var scrollToFilterInput = function() {
//     var filterInput = document.getElementById("filter-subs")
//     filterInput.scrollIntoView({behavior: "smooth"})
// }

// var scrollToSupercut = function() {
//     var supercut = document.getElementById("create-supercut")
//     supercut.scrollIntoView({behavior: "smooth"})
// }


// getStartedBtn.addEventListener("click", scrollToFirstInput)
// toFilterBtn.addEventListener("click", scrollToFilterInput)
// toSupercutBtn.addEventListener("click", scrollToSupercut)

const sections = document.querySelectorAll('.search-group');
const ioConfig = {
    // root: document.body,
    rootMargin: '-1px',
    threshold: .1
  };
let currentRatio = null;
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
      console.table(entry.target.id, entry.intersectionRatio);
      if (entry.intersectionRatio > 0 && !entry.target.classList.contains('disabled')) {
        currentRatio = entry.intersectionRatio;
        entry.target.classList.add('slide-anim');
        if (entry.target.children[1].querySelector('input')){
            entry.target.children[1].querySelector('input').focus();
        }
        if (entry.target.id === 'create-supercut') {
          var startOverBtn = document.getElementById("start-over")
          startOverBtn.addEventListener("click", scrollToFirstInput)
        }
        
          observer.unobserve(entry.target);
        } else {
            console.log('out of view');
        }
  });
}, ioConfig);

sections.forEach(section => {
  observer.observe(section);
});

  





// // scroll indicator
// function scrollHandler(element = null) {
// 	return {
// 		height: 0,
// 		element: element,
// 		calculateHeight(position) {
// 			const distanceFromTop = this.element.offsetTop
// 			const contentHeight = this.element.clientHeight
// 			const visibleContent = contentHeight - window.innerHeight
// 			const start = Math.max(0, position - distanceFromTop)
// 			const percent = (start / visibleContent) * 100;
// 			requestAnimationFrame(() => {
// 				this.height = percent;
// 			});
// 		},
// 		init() {
// 			this.element = this.element || document.body;
// 			this.calculateHeight(window.scrollY);
// 		}
// 	};
// }

// var swap = function() {
//  var vcr = document.querySelector('.highlighted') ; vcr.classList.remove('highlighted');
//  var sib = vcr.nextElementSibling
//   if (sib !== null) {sib.classList.add('highlighted')  }
//   else {    document.querySelector('p').classList.add('highlighted')
//   }
// }
//  setInterval(function(){ swap(); }, 1500);