/*global window*/
/*global document*/

window.addEventListener('load', function() {
(function(){
    "use strict";

var hgmObj = {"time":0,"tchr":"","clss":"", "frag": "","voca":[],"gameArr":[],"currentWrd":[],"count":0};

//window.addEventListener('load', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            docEl("usrPhoto").src = user.photoURL;
            init();
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
    docEl("restart").addEventListener("click", initGame, {"capture":"false","passive":"true"});
    docEl("nxtBtn").addEventListener("click", getNextWord, {"capture":"false","passive":"true"});
    docEl("chgSelected").addEventListener("click", updateClss, {capture: false, passive: true});
}
    
function matchGuess(letter) {
    var lwrCs = letter.toLowerCase();
    var idxArr = [];
    var i;
    
    for (i = 0; i < hgmObj.currentWrd.length; i++) {
        if (lwrCs === hgmObj.currentWrd[i]) {
            idxArr.push(i); //NO BREAK: there could be more than 1 index
        }
    }
    return idxArr;
}
function isComplete(num) {
    hgmObj.count += num;
    
    if(hgmObj.count >= hgmObj.currentWrd.length) {
        docEl("hangmanBox").className += " win";
    }
}
function chkGuess(letter) {
    var indexes = matchGuess(letter);

    if (indexes.length) {
        indexes.forEach( function (idx) {
            docEl("w_" + idx).className = "";
            docEl("w_" + idx).textContent = hgmObj.currentWrd[idx];
        });
        isComplete(indexes.length);
    }    
}
function identifyKybd(e) {    
    if (e.target !== e.currentTarget) {
        if(e.target.classList.contains("btn")) {
            chkGuess(e.target.textContent);
            e.target.className += " strikeOut";
        }
    }
    e.stopPropagation();
}
function populateHangmanBox() {
    var container = docEl("hangmanBox");
    var frag = document.createDocumentFragment();
    
    container.className = container.className.replace(/(?:^|\s)win(?!\S)/g, '');
    emptyContent(container);
    
    hgmObj.currentWrd.forEach( function (el, idx) {
        var newDiv1 = document.createElement("div");
        var newSpan1 = document.createElement("span");
                
        newSpan1.id = "w_" + idx;
        
        if (el === " ") {
            newSpan1.className = "isWhitespace";
            hgmObj.count += 1;
        }        
        else {
            newSpan1.className = "nonVisible";
            newSpan1.textContent = "?";
        }
        
        newDiv1.appendChild(newSpan1);
        frag.appendChild(newDiv1);
    });
    container.appendChild(frag);
}
function getNextWord() {
    var nextObj;
    var nextWrd;
    var cols;
    
    kybdOff();
    hgmObj.count = 0;
    
    if (hgmObj.gameArr.length) {
        nextObj = (hgmObj.gameArr).splice(0,1)[0];
        nextWrd = (nextObj.en).toLowerCase();
        hgmObj.currentWrd = nextWrd.split("");
        cols = nextObj.colOptAns;
        
        docEl("synHint").textContent = nextObj.synOptAns;
        docEl("ctxHint").textContent = nextObj.ctxB4 + " _____ " + nextObj.ctxAf;
        
        if (nextObj.colPos === "af") {
            docEl("colHint").textContent = "~ " + cols[0] + " / ";
            docEl("colHint").textContent += " ~ " + cols[1] + " / ";
            docEl("colHint").textContent += " ~ " + cols[2];
        }
        else {
            docEl("colHint").textContent = cols[0] + " ~ / ";
            docEl("colHint").textContent += cols[1] + " ~ / ";
            docEl("colHint").textContent += cols[2] + " ~";
        }
        populateHangmanBox();
        kybdOn();
    }
    else {
        allComplete();
    }
}
function kybdOn() {
    docEl("kybd").addEventListener("click", identifyKybd, {"capture":"false","passive":"true"});
}
function kybdOff() {
    var kybdEls = docEl("kybd").querySelectorAll(".btn");
    var i;
    
    docEl("kybd").removeEventListener("click", identifyKybd, {"capture":"false","passive":"true"});
    //iOS cant run forEach on a NodeList
    for (i = 0; i < kybdEls.length; i++) {
        kybdEls[i].className = kybdEls[i].className.replace(/(?:^|\s)strikeOut(?!\S)/g, '');
    }
    //kybdEls.forEach( function (el){
       //el.className = el.className.replace(/(?:^|\s)strikeOut(?!\S)/g, '');
    //});
}
function allComplete() {
    var len = hgmObj.voca.length;

    emptyContent(docEl("hangmanBox"));
    docEl("nxtBtn").style.display = "none";
    docEl("hints").style.display = "none";
    docEl("mem-feedback").style.display = "block";
    userScored(len, len);
}
//@restart btn
function initGame() {
    kybdOn();
    hgmObj.gameArr = hgmObj.voca.slice(0);
    
    shuffleAnArray(hgmObj.gameArr);
    
    docEl("mem-feedback").style.display = "none";
    getNextWord();
    docEl("nxtBtn").style.display = "inline-block";
    docEl("hints").style.display = "block";
    hgmObj.time = Date.now();
}
function convertData(data) {
    var colEl;
    
    data.forEach( function (el){
        if (el.hasOwnProperty("syn") && el.hasOwnProperty("col")) {
            colEl = {};
            colEl.en = el.en;        
            colEl.ctxB4 = el.syn.b4;
            colEl.ctxAf = el.syn.af;
            colEl.synOptAns = el.syn.ans;
            colEl.colPos = el.col.pos;
            colEl.colOptAns = [el.col.ans1, el.col.ans2, el.col.ans3 ]; 
            hgmObj.voca.push(colEl);
        }
    });
    initGame();
}

function init() {
    var objExists = window.localStorage.getItem("myClss");
    var data = JSON.parse(objExists);

    if (data !== null) {
        try {
            hgmObj.tchr = data.tchr;
            hgmObj.clss = data.clss;
            if (data.hasOwnProperty("frag") && chkTrk(data.frag) === true) {
                hgmObj.frag = data.frag;
            }
            convertData(data.voca);
        }
        catch(e) {
            hgmObj.tchr = "";
            hgmObj.clss = "";
            hgmObj.voca = [];
            dataError();
        }
        docEl("slctdTchrTxt").textContent = "" + hgmObj.clss + " " + hgmObj.tchr + " " + hgmObj.frag;
    }
    else {
        dataError();
    }
    renderNav();
    handlersOn();
}

function userScored(scr, max) {
    var score = "completed: " + scr + "/" + max;
    var timeStamp = Date.now();
    var duration = timeStamp - hgmObj.time;

    postIt({ a: timeStamp, b: hgmObj.tchr, c: hgmObj.clss, d: hgmObj.frag, e: duration, f: document.title, g: score });
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