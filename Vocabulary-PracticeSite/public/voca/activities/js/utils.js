/*global window*/
/*global document*/

function docEl(elId) {
    'use strict';
    return document.getElementById(elId);
}

// Toggle if navbar menu is open or closed
function toggleMenu() {
    'use strict';
    var collapse = document.getElementsByClassName('navbar-collapse')[0];
    
    collapse.classList.toggle('collapse');
    collapse.classList.toggle('in');
}

// Close dropdowns when screen becomes big enough to switch to open by hover
function closeMenusOnResize() {
    'use strict';
    var collapse = document.getElementsByClassName('navbar-collapse')[0];
    
    if (document.body.clientWidth >= 768) {
        closeMenus();
        collapse.classList.add('collapse');
        collapse.classList.remove('in');
    }
}    
    
// Close all dropdown menus
function closeMenus() {
    'use strict';
    var dropdowns = document.getElementsByClassName('dropdown');
    var j;
    
    for (j = 0; j < dropdowns.length; j++) {
        dropdowns[j].getElementsByClassName('dropdown-toggle')[0].classList.remove('dropdown-open');
        dropdowns[j].classList.remove('open');
    }
}

function navListenersOn() { // Navbar and dropdowns        
    'use strict';
    var toggle = Array.from(document.getElementsByClassName('navbar-toggle'))[0];
    var dropdowns = Array.from(document.getElementsByClassName('dropdown'));

    dropdowns.forEach( function(el){
        el.addEventListener('click', clickHandlerForDropdown, {capture: false, passive: true});
    });
    window.addEventListener('resize', closeMenusOnResize, false);
    toggle.addEventListener('click', toggleMenu, false);    
}

function clickHandlerForDropdown(el) {
    'use strict';
    if (document.body.clientWidth < 768) {
        closeMenus();

        if (!el.currentTarget.classList.contains('open')) {
            el.currentTarget.parentElement.getElementsByClassName('dropdown-toggle')[0].classList.toggle('dropdown-open');
            el.currentTarget.classList.toggle('open');
        }
        el.stopPropagation();
    }
}

function emptyContent(parentEl) {
    'use strict';
    while (parentEl.hasChildNodes()) {
        while (parentEl.lastChild.hasChildNodes()) {
            parentEl.lastChild.removeChild(parentEl.lastChild.lastChild);
        }
        parentEl.removeChild(parentEl.lastChild);
    }
}

function updateClss() { //renamed from -> chgClss()
    'use strict';
    //window.localStorage.removeItem("myClss");
    window.location = "https://" + window.location.hostname + "/index.html";
}

function dataError() {
    'use strict';
    docEl("slctdTchrTxt").textContent = "Class unknown";
}

function hideEl(elId) {
    'use strict';
    if (!docEl(elId).classList.contains('nodisplay')) {
        docEl(elId).className += ' nodisplay';
    }
}

function showEl(elId) {
    'use strict';
    docEl(elId).className = docEl(elId).className.replace(/(?:^|\s)nodisplay(?!\S)/g, '');
}

function uniqueValues(arr) {
    'use strict';
    var arrArr = arr.sort();
    var filtered = [];
    var len = arrArr.length;
    for (var i = 0; i < len; i++) {
        for (var j = i + 1; j < len; j++) {
            if (arrArr[i] === arrArr[j]) { // If a[i] is found later in the array...
                j = ++i;
            }
        }
        filtered.push(arrArr[i]);
    }
    return filtered;
}
//Knuth Shuffle    
function shuffleAnArray(someArr) {
    'use strict';
    var currentIdx = someArr.length; 
    var tempVal;
    var randomIdx;
    while (0 !== currentIdx) {
        randomIdx = Math.floor(Math.random()*currentIdx);
        currentIdx -= 1;
        tempVal = someArr[currentIdx];
        someArr[currentIdx] = someArr[randomIdx];
        someArr[randomIdx] = tempVal;
    }                   
    return someArr;
}

function chkTrk(str) {
    'use strict';
    var n = nChars(str);

    if (n.length && n.length === 4) {
        return true;
    }
    return false;
}

function nChars(str) {
    'use strict';
    return (str.replace(/[^0-9]/gmi, '')).replace(/[\s\t]+/, '');
}

function renderNav() {
    'use strict';
    var container = docEl("renderedNav");
    var frag = document.createDocumentFragment();
    var navDef = [
        { 
            cat: "Information", 
            links: [
                {ref: "studyguide.html", name: "Study guide"},
                {ref: "translations.html", name: "Translations"},
                {ref: "flashcards.html", name: "Flashcards"},
                {ref: "js/ios/Martin_Ridgeway_PE4_VOCA_PracticeTest_Fall2020.pdf", name: "Paper Practice Test"}
            ]
        },{ 
            cat: "Activities",
            links: [
                {ref: "matching.html", name: "Word Match"},
                {ref: "memory.html", name: "Memory"},
                {ref: "grammarpuzzle.html", name: "Grammar Puzzle"},
                {ref: "collocations.html", name: "Collocation drop"},
                {ref: "galaga.html", name: "Galaga"},
                {ref: "h_ngm_n.html", name: "Hangman"},
                {ref: "crossword.html", name: "Crossword"}
            ]
        },{ 
            cat: "Quizzes", 
            links: [
                {ref: "synonymsquiz.html", name: "Synonyms"},
                {ref: "grammarquiz.html", name: "Grammar"},
                {ref: "collocationsquiz.html", name: "Collocations"}
            ]
        }
    ];
    var newLi0,
        newLi1,
        newA1,
        newDiv0,
        newSpan0,
        newUl0,
        newTxtNd;

    navDef.forEach( function(elem) {
        newLi0 = document.createElement("LI");
        newDiv0 = document.createElement("DIV");
        newSpan0 = document.createElement("SPAN");
        newUl0 = document.createElement("UL");
        newTxtNd = document.createTextNode(elem.cat + " ");

        newLi0.className = "dropdown";
        newDiv0.className = "dropdown-toggle";
        newDiv0.dataset.toggle = "dropdown"; //role="button" aria-expanded="false"
        newSpan0.className = "caret";
        newUl0.className = "dropdown-menu"; //role="menu"

        elem.links.forEach( function(el) {
            newLi1 = document.createElement("LI");
            newA1 = document.createElement("A");
            
            newA1.href = el.ref || "#";
            newA1.target = "_parent";
            newA1.textContent = el.name;

            newLi1.appendChild(newA1);
            newUl0.appendChild(newLi1);
        });
        newDiv0.appendChild(newTxtNd);
        newDiv0.appendChild(newSpan0);
        newLi0.appendChild(newDiv0);
        newLi0.appendChild(newUl0);
        frag.appendChild(newLi0);
    });
    container.appendChild(frag);
}