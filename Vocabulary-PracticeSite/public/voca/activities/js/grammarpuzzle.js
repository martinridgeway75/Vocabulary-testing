/*global window*/
/*global document*/

window.addEventListener('load', function() {
(function(){
    "use strict";

var gmrObj = {"time":0,"tchr":"","clss":"", "frag": "","vocaList":[],"gmr":{"list":[],"orig":[],"seq":[]}};

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
    docEl("sentence").addEventListener('click', wordClick, {capture: false, passive: true});
    docEl("nextQuestion").addEventListener('click', resetQuestion, {capture: false, passive: true});
    docEl("chgSelected").addEventListener("click", updateClss, {capture: false, passive: true});
}
    
function displayNewQ(tempArr) {
    var container = docEl("sentence");
    var frag = document.createDocumentFragment();
    
    tempArr.forEach( function (el){
        var newDiv1 = document.createElement("div");
        
        newDiv1.id = "w_" + gmrObj.gmr.orig.indexOf(el);
        newDiv1.className = "btn btn-sm btn-whiteBlue";
        newDiv1.style.margin = 5 + "px";
        newDiv1.textContent = el;
        frag.appendChild(newDiv1);
    });
    container.appendChild(frag);    
}
function grabNewQ(){
    var data;
    var tempArr = [];
    
    if (gmrObj.gmr.list.length){
        data = gmrObj.gmr.list.splice(Math.floor(Math.random() * gmrObj.gmr.list.length), 1)[0];
        tempArr = data.split(" ");
        gmrObj.gmr.orig = tempArr.slice(0);
        tempArr = shuffleAnArray(tempArr);
        displayNewQ(tempArr);
    }
    else {
        showCompleted();
    }
}
function showAnswer(){
    var orig = gmrObj.gmr.orig.join(" ");

    docEl('resultAnswer').textContent = orig + " \u2713";
    docEl('resultAnswer').style.display = "block";
    docEl("nextQuestion").style.display = 'inline-block';
    if (gmrObj.gmr.list.length) {
        docEl('arraycount').textContent = gmrObj.vocaList.length - gmrObj.gmr.list.length;
    }
    else {
        docEl('arraycount').textContent = gmrObj.vocaList.length;
    }
}
function clearSentence(){
    emptyContent(docEl("sentence"));
    docEl('resultAnswer').style.display = "none";
    docEl("nextQuestion").style.display = "none";
}
function resetQuestion(){
    gmrObj.gmr.seq = [];
    clearSentence();
    grabNewQ();
}
function showCompleted(){
    var len = gmrObj.gmr.list.length;
    var vocaLen = gmrObj.vocaList.length;

    clearSentence();
    docEl("sentence").textContent = 'Congratulations! You have completed all the examples!';
    userScored(vocaLen);
}
function checkSequence(el){    
    var i;
    
    for(i = 0; i < gmrObj.gmr.seq.length; i++){
        if( i === gmrObj.gmr.seq[i]){
            if(gmrObj.gmr.seq.length === gmrObj.gmr.orig.length && gmrObj.gmr.seq[i] === gmrObj.gmr.orig.length - 1){
                showAnswer();
                return;
            }
            else {
                continue;
            }
        }
        else {            
            gmrObj.gmr.seq = [];
            reColor(el);
            return;
        }
    }
}    
function reColor(btn) {
    var i;
    for (i=0; i<btn.children.length; i++) {
        btn.children[i].style.backgroundColor = '';
        btn.children[i].style.color = '';
        btn.children[i].style.borderColor = '';
    }
}
function wordClick(el) {
    if (el.target !== el.currentTarget) {
        var elId = Number((el.target.id).substring(2));
        
        reColor(el.target);
        (el.target).style.backgroundColor = '#337ab7';  
        (el.target).style.borderColor = '#2e6da4';
        (el.target).style.color = '#fff';
        gmrObj.gmr.seq.push(elId);
        checkSequence(el.currentTarget);
    }
    el.stopPropagation();
}
function showEmpty(){
    clearSentence();
    docEl("sentence").textContent = 'No vocabulary available.';
}
function testForDupWords(arr) {
    var temp = [];
    
    for (var i = 0; i < arr.length; i++){
        temp = arr[i].split(" ");
        temp.map(function(el, index, tempArr){
            if(index !== tempArr.indexOf(el)){
                tempArr[index] = el + "+";
            }
        });
        temp.map(function(el, index, tempArr){ //sigh...
            if(index !== tempArr.indexOf(el)){
                tempArr[index] = el + "+";
            }
        });
        arr[i] = temp.join(" ");
    }
    return arr;
}
function getSentences(voca) {
    var arr = [];
    var str;

    voca.forEach( function (el) {
        if (el.hasOwnProperty("gmr")) {
            str = el.gmr.b4 + " " + el.en + " " + el.gmr.af;
            arr.push(str);
        }
    });
    arr = testForDupWords(arr);    
    return arr;
}
function init() {
    var objExists = window.localStorage.getItem("myClss");
    var data = JSON.parse(objExists);

    if (data !== null) {
        try {
            gmrObj.tchr = data.tchr;
            gmrObj.clss = data.clss;
            if (data.hasOwnProperty("frag") && chkTrk(data.frag) === true) {
                gmrObj.frag = data.frag;
            }
            gmrObj.vocaList = getSentences(data.voca);
            gmrObj.gmr.list = gmrObj.vocaList.slice(0);
        }
        catch(e) {
            gmrObj.tchr = "";
            gmrObj.clss = "";
            gmrObj.vocaList = [];
            dataError();
        }
        docEl("slctdTchrTxt").textContent = "" + gmrObj.clss + " " + gmrObj.tchr + " " + gmrObj.frag;
    }
    else {
        dataError();
    }
    if (!gmrObj.vocaList.length) {
        showEmpty();
    }
    else {
        docEl("nextQuestion").style.display = "none";
        docEl('arrayMax').textContent = gmrObj.vocaList.length;
        grabNewQ();
        gmrObj.time = Date.now();
    }
    renderNav();
    handlersOn();
}

function userScored(scr) {
    var score = "completed: " + scr + "/" + scr;
    var timeStamp = Date.now();
    var duration = timeStamp - gmrObj.time;

    postIt({ a: timeStamp, b: gmrObj.tchr, c: gmrObj.clss, d: gmrObj.frag, e: duration, f: document.title, g: score });
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