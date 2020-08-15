/*with help from: http://www.elated.com/res/File/articles/development/javascript/jquery/drag-and-drop-with-jquery-your-essential-guide/card-game.html*/
/*global window*/
/*global document*/
/*global jQuery*/
/*global $*/

window.addEventListener('load', function() {
(function(){
    "use strict";
    
var synObj = {"time":0,"myClss":{"tchr":"","clss":"", "frag": "","voca":[]},"gameArr":[],"leftArr":[],"rightArr":[],"matched":0,"numOfCards":0};

//window.addEventListener('load', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            docEl("usrPhoto").src = user.photoURL;
            jQuery(document).ready(function(){ 
                init();
            });
        } else {
            // User is signed out...
            window.location = "../index.html";
        }
    });
//});

function signOutOfApp() {
    firebase.auth().signOut(); //thus prompting the authState observer...
}

function handlersOn() {
    navListenersOn();
    docEl("synCtx").addEventListener("click", showSyn, {capture: false, passive: true});
    docEl("transCtx").addEventListener("click", showTrans, {capture: false, passive: true});
    docEl("restart").addEventListener("click", initGame, {capture: false, passive: true});
    docEl("continueGame").addEventListener("click", continueOn, {capture: false, passive: true});
    docEl("chgSelected").addEventListener("click", updateClss, {capture: false, passive: true});
}

function makeDeck() {
    var len = synObj.gameArr.length;
    var dealtHand = [];
    var idx;

    if (len < 10) { 
        synObj.numOfCards = len;
    } else { 
        synObj.numOfCards = 10;
    }
    shuffleAnArray(synObj.gameArr);
    dealtHand = (synObj.gameArr).splice(0,synObj.numOfCards); //moves n []'s OUT OF gameArr AND INTO dealtHand (max. 10)
    dealtHand.forEach( function (el, i) {
        idx = i + 1;
        synObj.leftArr.push([idx, el[0]]);
        synObj.rightArr.push([idx, el[1], el[2]]);
    });
    synObj.leftArr = shuffleAnArray(synObj.leftArr); //lefty gets shuffled
}

function putCardsOnTheTable() {
    createUILeft();
    createUIRight();
}
function createUILeft() {
    var container = docEl("cardPile");
    
    synObj.leftArr.forEach( function (el, i) {
        var frag = document.createDocumentFragment();
        var newDiv1 = document.createElement("div");
        var jqId = "#c_" + synObj.leftArr[i][0];
        
        newDiv1.id = "c_" + synObj.leftArr[i][0];
        newDiv1.className = "ui-draggable";
        newDiv1.dataset.num = synObj.leftArr[i][0];
        newDiv1.textContent = synObj.leftArr[i][1];
        frag.appendChild(newDiv1);
        container.appendChild(frag);
        
        $(jqId).draggable({
            containment: '#content',
            stack: '#cardPile div',
            cursor: 'move',
            revert: false
        });
    });
}
function createUIRight() {    
    var container = docEl("cardSlots");
    var dropEls;
    var i;
    
    synObj.rightArr.forEach( function (el, idx) {
        var frag = document.createDocumentFragment();
        var newDiv1 = document.createElement("div");
        var newSpan1 = document.createElement("span");
        var newSpan2 = document.createElement("span");        

        newDiv1.dataset.num = synObj.rightArr[idx][0];
        newDiv1.className = "ui-droppable";
        newSpan1.className = "syn";
        newSpan1.textContent = synObj.rightArr[idx][1];
        newSpan2.className = "trans nodisplay";
        newSpan2.textContent = synObj.rightArr[idx][2];        
        newDiv1.appendChild(newSpan1);
        newDiv1.appendChild(newSpan2);
        frag.appendChild(newDiv1);
        container.appendChild(frag);
    });
    dropEls = docEl("cardSlots").querySelectorAll("div.ui-droppable");
    //iOS cant run forEach on a NodeList
    for (i = 0; i < dropEls.length; i++) {
        $(dropEls[i]).droppable({
            accept: '#cardPile div',
            hoverClass: 'hovered',
            drop: cardDrop
        });
    }
    /*
    dropEls.forEach ( function (el) {
        $(el).droppable({
            accept: '#cardPile div',
            hoverClass: 'hovered',
            drop: cardDrop
        });
    });
    */
}
function cardDrop(evt, ui) {    
    var element = this; //"this" is called within the context of a .droppable object
    var maxNum = synObj.numOfCards;
    var slotNum = $(element).data("num");
    var cardNum = ui.draggable.data("num");
    var i;
    
    if (slotNum === cardNum) {
        ui.draggable.addClass("correct");
        ui.draggable.draggable("disable");
        $(element).droppable("disable");
        ui.draggable.position({
            of: $(element),
            my: "left top",
            at: "left top"
        });
        ui.draggable.draggable("option", "revert", false);
        synObj.matched = synObj.matched + 1;
    }
    else {
        ui.draggable.position({
            of: $(element),
            my: "left top",
            at:"left top"
        });
    }
    if (synObj.matched === maxNum) {
        for (i = 1; i <= maxNum; i++){
            var elId = "#c_" + i;
            
            $(elId).position({
                of: $(elId),
                my: "right top",
                at: "left top"
            });
        }
        var dropEls = docEl("cardSlots").querySelectorAll("div.ui-droppable");
        var ii;
        //iOS cant run forEach on a NodeList
        for (ii = 0; ii < dropEls.length; ii++) {
            dropEls[ii].style.borderStyle = "solid";
        }
        //dropEls.forEach ( function (el) {
            //el.style.borderStyle = "solid";
        //});
        showEl("successMsg");
        showEl("continueGame");
    }
}
function toggleLanguage(bool) { //true: en, false: kr
    var syn = document.querySelectorAll(".syn");
    var trans = document.querySelectorAll(".trans");
    var i;
    
    if (bool === true) {
        //iOS cant run forEach on a NodeList
        for (i = 0; i < syn.length; i++) {
            syn[i].className = syn[i].className.replace(/(?:^|\s)nodisplay(?!\S)/g, '');
        }
        for (i = 0; i < trans.length; i++) {
            trans[i].className += " nodisplay";
        }
        //syn.forEach(function(el) { el.className = el.className.replace(/(?:^|\s)nodisplay(?!\S)/g, ''); });
        //trans.forEach(function(el) { el.className += " nodisplay"; });
    }
    else {
        //iOS cant run forEach on a NodeList
        for (i = 0; i < syn.length; i++) {
            syn[i].className += " nodisplay";
        }
        for (i = 0; i < trans.length; i++) {
            trans[i].className = trans[i].className.replace(/(?:^|\s)nodisplay(?!\S)/g, '');
        }
        //syn.forEach(function(el) { el.className += " nodisplay"; });
        //trans.forEach(function(el) { el.className = el.className.replace(/(?:^|\s)nodisplay(?!\S)/g, ''); });
    }
}
function showSyn() {
    toggleLanguage(true);
}
function showTrans() {
    toggleLanguage(false);
}

function playGame() {
    emptyContent(docEl("cardPile"));
    emptyContent(docEl("cardSlots"));
    synObj.matched = 0;
    synObj.leftArr = [];
    synObj.rightArr = [];
    makeDeck();
    putCardsOnTheTable();
}

function endGame() {
    hideEl("continueGame");
    docEl("successMsg").querySelectorAll("h5.winner")[0].textContent = "Great job!";
    showEl("successMsg");
    showEl("restart");
    userScored(synObj.myClss.voca.length);
}

function continueOn() {
    hideEl("successMsg");
    hideEl("restart");
    hideEl("continueGame");
    startGame();
}


function startGame() { //assumes voca length is >= 2 && gameArr is built
    if (!synObj.gameArr.length || synObj.gameArr.length < 2) {
        endGame();

    } else {
        playGame();
    }
}

//@//init & btn: restart
function initGame() {    
    var tempArr;

    hideEl("successMsg");
    hideEl("restart");
    hideEl("continueGame");
    docEl("successMsg").querySelectorAll("h5.winner")[0].textContent = "";

    if (!synObj.myClss.voca.length || synObj.myClss.voca.length < 2) {
        hideEl("content");
        document.querySelectorAll("fieldset.md-radio")[0].style.display = 'none';
        showEl("noVoca");
        return;
    } 
    synObj.gameArr = [];
    synObj.myClss.voca.forEach(function (el) {
        if (el.hasOwnProperty("syn")) {
            tempArr = [el.en, el.syn.ans, el.kr].slice(0);
            synObj.gameArr.push(tempArr);
        }
    });
    synObj.time = Date.now();
    startGame();
}

function init() {
    var objExists = window.localStorage.getItem("myClss");
    var data = JSON.parse(objExists);

    if (data !== null) {
        try {
            synObj.myClss.tchr = data.tchr;
            synObj.myClss.clss = data.clss;
            if (data.hasOwnProperty("frag") && chkTrk(data.frag) === true) {
                synObj.myClss.frag = data.frag;
            }
            synObj.myClss.voca = data.voca;
            
        }
        catch(e) {
            synObj.myClss.tchr = "";
            synObj.myClss.clss = "";
            synObj.myClss.voca = [];
            dataError();
        }
        if (!synObj.myClss.voca.length) {
            showEl("noVoca");
        }
        else {
            renderNav();
            docEl("slctdTchrTxt").textContent = "" + synObj.myClss.clss + " " + synObj.myClss.tchr + " " + synObj.myClss.frag;
            initGame();
            handlersOn();
        }
    }
    else {
        dataError();
    }
}

function userScored(scr) {
    var score = "completed: " + scr + "/" + scr;
    var timeStamp = Date.now();
    var duration = timeStamp - synObj.time;

    postIt({ a: timeStamp, b: synObj.myClss.tchr, c: synObj.myClss.clss, d: synObj.myClss.frag, e: duration, f: document.title, g: score });
}

function postIt(dataObj) {    
    var user = firebase.auth().currentUser;
    var uid = user.uid;
    var postData = { email: user.email, timestamp: dataObj.a, tchr: dataObj.b, clss: dataObj.c, frag: dataObj.d, duration: dataObj.e, activity: dataObj.f, score: dataObj.g };
    var newPostKey = firebase.database().ref().child('activities/' + uid + '/').push().key;
    var updates = {};

    updates['activities/' + uid + '/' + newPostKey] = postData;

    firebase.database().ref().update(updates, function(e) {
        if (e) {
            if (e.code === "PERMISSION_DENIED") {
                signOutOfApp();
            } else {
                window.alert('Data could not be saved.\n' + e);
            }
        } else {
            window.alert('Activity completed!');
        }
    });
}

})();
});