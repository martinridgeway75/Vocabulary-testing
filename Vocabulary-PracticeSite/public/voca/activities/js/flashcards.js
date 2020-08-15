/*global document*/
/*global window*/
/*global $*/

window.addEventListener('load', function() {
(function(){
    "use strict";
    
var fcObj = {"time":0,"tchr":"","clss":"", "frag": "","voca":[],"diy":[],"idx":-1};

//window.addEventListener('load', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            docEl("usrPhoto").src = user.photoURL;
            $(document).ready(function(){ 
                init(); 
            });
        } else {
            // User is signed out...
            window.location = "../index.html";
        }
    });
//});

function handlersOn() {
    navListenersOn();
    docEl("flipper").addEventListener("click", flipCard, {"capture":"false", "passive":"true"});
    docEl("clssVoca").addEventListener("click", restartWithClssVoca, {"capture":"false", "passive":"true"});
    docEl("hideCRUDdiv").addEventListener("click", restartWithDIY, {"capture":"false", "passive":"true"});
    docEl("myFlashCards").addEventListener("click", restartWithDIY, {"capture":"false", "passive":"true"});
    docEl("showCRUDdiv").addEventListener("click", doCRUD, {"capture":"false", "passive":"true"});
    docEl("chgSelected").addEventListener("click", updateClss, {capture: false, passive: true});
    docEl("submit").addEventListener('click', onRegisterPressed, {capture:false, passive: true});
    docEl("clear").addEventListener('click', onClarPressed, {capture:false, passive: true});
    docEl("tablerows").addEventListener('click', identifyEl, {capture:false, passive: true});
}
function createCards(arr) {
    var container = docEl("deck");
    var frag = document.createDocumentFragment();
    
    arr.forEach( function (el) {
        var newLi = document.createElement("li");
        var newDiv1 = document.createElement("div");
        var newDiv2 = document.createElement("div");
        var newP1 = document.createElement("p");
        var newP2 = document.createElement("p");
        
        newLi.className = "card";
        newDiv1.className = "side_one";
        newDiv2.className = "side_two";
        newP1.textContent = el.en;
        newP2.textContent = el.kr;
        newDiv1.appendChild(newP1);
        newDiv2.appendChild(newP2);
        newLi.appendChild(newDiv1);
        newLi.appendChild(newDiv2);
        frag.appendChild(newLi);
    });
    container.appendChild(frag);
}
function buildDeck(propName) {  //arrRef either: fcObj.voca or fcObj.diy
    var arr;
    var arrRef = fcObj[propName];
    
    emptyContent(docEl("deck"));

    if (arrRef.length) {
        arr = shuffleAnArray(arrRef);
    }
    else {
        if (propName !== "voca") {
            arr = [{"en":"Add some cards!","kr":"카드 를 추가!"}];
        }
        else {
            arr = [{"en":"No vocabulary available","kr":"데이터가 없습니다!"}];
        }
    }
    createCards(arr);
}
function flipCard() {
    $('.card.cycle-slide-active').toggleClass('flip');
}
function restartCycle(propName) {
    buildDeck(propName);
    $(".cycle-slideshow").cycle({ 
        fx: "shuffle", 
        timeout: 0, 
        sync: false, 
        manualFx: "shuffle", 
        shuffleTop: -200, 
        shuffleRight: -200, 
        next: "#next", 
        prev: "#prev", 
        speed: 650, 
        slides: "li", 
        log: false
    }); 
}
function restartWithClssVoca() {
    var txt;
    
    if (fcObj.clss === "") {
        txt = "Class unknown";
    }
    else {
        txt = "" + fcObj.clss + " " + fcObj.tchr + " " + fcObj.frag;
    }
    $(".cycle-slideshow").cycle("destroy");
    hideEl("showCRUD");
    showEl("showCRUDdiv");
    docEl("slctdTchrTxt").textContent = txt;
    docEl("nav_deck").style.zIndex = 1;
    restartCycle("voca");
}
function restartWithDIY() {
    $(".cycle-slideshow").cycle("destroy");
    hideEl("showCRUD");
    hideEl("hideCRUDdiv");
    showEl("showCRUDdiv");
    docEl("slctdTchrTxt").textContent = "My flashcards";
    docEl("nav_deck").style.zIndex = 1;
    saveMyFlashcards();
    restartCycle("diy");
}
function doCRUD() {
    hideEl("showCRUDdiv");
    showEl("showCRUD");
    showEl("hideCRUDdiv");
    initTable();
}

function initTable() {
    emptyContent(docEl("tablerows"));
    
    if (fcObj.diy.length) {
        fcObj.diy.forEach (function (el, i) {
            prepareTableCell(i, el.en, el.kr);
        });
    }
}

function onRegisterPressed() {
    var eng = docEl("firstname").value;
    var kor = docEl("lastname").value;
    var newObj = {"en": eng, "kr": kor};

    if (fcObj.idx === -1) {
        fcObj.diy.push(newObj);
    } 
    else {
        fcObj.diy.splice(fcObj.idx, 1, newObj);
    }
    initTable();
    onClarPressed();
}
function prepareTableCell(index, firstName, lastName) {
    var table = docEl("tablerows");
    var frag = document.createDocumentFragment();
    var row = document.createElement("tr");
    var engCell = document.createElement("td");
    var korCell = document.createElement("td");
    var actionCell = document.createElement("td");
    var a1 = document.createElement("span");
    var a2 = document.createElement("span");

    engCell.textContent = firstName;
    korCell.textContent = lastName;
    a1.className = "btn btn-xs btn-warning";
    a1.id = "e_" + index;
    a1.textContent = "Edit";
    a2.className = "btn btn-xs btn-danger";
    a2.id = "d_" + index;
    a2.textContent = "Delete";    

    actionCell.appendChild(a1);
    actionCell.appendChild(a2);
    row.appendChild(engCell);
    row.appendChild(korCell);
    row.appendChild(actionCell);
    frag.appendChild(row);
    table.appendChild(frag);
}

function identifyEl(e) {
    var index;
    var el_;
    
    if (e.target !== e.currentTarget) {
        el_ = e.target.id.substring(0,2);
        
        if(el_ === "e_") {
            index = Number(e.target.id.substring(2));
            onEditPressed(index);
        } else if (el_ === "d_") {
            index = Number(e.target.id.substring(2));
            deleteTableRow(index);            
        }
    }
    e.stopPropagation();
}    

function deleteTableRow(index) {
    fcObj.diy.splice(index, 1);
    initTable();
}
function onClarPressed() {
    fcObj.idx = -1;
    docEl("firstname").value = "";
    docEl("lastname").value = "";
    docEl("submit").textContent = "Insert";
}
function onEditPressed(index) {
    fcObj.idx = index;

    var newObj = fcObj.diy[index];
    
    docEl("firstname").value = newObj.en;
    docEl("lastname").value = newObj.kr;
    docEl("submit").textContent = "Update";
}

function initMyFlashcards() {
    var objExists = window.localStorage.getItem("myFlashcards");
    var data = JSON.parse(objExists);
    
    if (data !== null) {
        try {
            fcObj.diy = data;
        }
        catch(e) {
            fcObj.diy = [];
        }
    }
}

function saveMyFlashcards() {
    var data;
    var i;
    
    if (fcObj.diy.length) {
        //strip empty el.s -> en === "" && kr === ""
        
        for (i = fcObj.diy.length - 1; i >= 0; i--) {
            if(fcObj.diy[i].en === "" && fcObj.diy[i].kr === "") {
               fcObj.diy.splice(i, 1);
            }
        }
        data = JSON.stringify(fcObj.diy);
        window.localStorage.setItem("myFlashcards", data);
    }
}


function init() {
    var objExists = window.localStorage.getItem("myClss");
    var data = JSON.parse(objExists);

    if (data !== null) {
        try {
            fcObj.tchr = data.tchr;
            fcObj.clss = data.clss;
            if (data.hasOwnProperty("frag") && chkTrk(data.frag) === true) {
                fcObj.frag = data.frag;
            }
            fcObj.voca = data.voca;
        }
        catch(e) {
            fcObj.tchr = "";
            fcObj.clss = "";
            fcObj.voca = [];
            dataError();
        }
    }
    renderNav();
    restartWithClssVoca();
    initMyFlashcards();
    handlersOn();
}

//iOS doesn't understand "onbeforeunload" -> check for: window.onpagehide
if ("onpagehide" in window) {
   window.addEventListener("pagehide", saveMyFlashcards, false);
} else {
   window.addEventListener("beforeunload", saveMyFlashcards, false);
}

})();
});