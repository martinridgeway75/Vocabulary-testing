/*global window*/
/*global document*/

window.addEventListener('load', function() {
(function(){
    "use strict";
    
var colObj = {"time":0,"tchr":"","clss":"", "frag": "", "voca":[],"gameArr":[],"current":null};

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
    docEl("chgSelected").addEventListener("click", updateClss, {capture: false, passive: true});
    docEl("restart").addEventListener("click", continueGame, {"capture":"false","passive":"true"});
} 
function dragMoveListener(event) {
    var target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}
function setInteractable() {
    window.interact('.drag-drop').draggable({
        inertia: true,
        restrict: {
            restriction: "#exA",
            endOnly: true,
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        },
        autoScroll: true,
        onmove: dragMoveListener
    });
}

function setCompletedCollocation(col) {
    var container = docEl("completedcollocations");
    var frag = document.createDocumentFragment();
    var newP = document.createElement("p");

    if (colObj.current.colPos === "b4") {
        newP.textContent += col + " " + colObj.current.en;
    }
    else {
        newP.textContent += colObj.current.en + " " + col;
    }
    frag.appendChild(newP);
    //container.appendChild(frag);
    container.insertBefore(frag, container.firstChild);
}
function promptReset() {
    var len;

    colObj.gameArr = colObj.voca.slice(0); 
    len = colObj.gameArr.length; 
    shuffleAnArray(colObj.gameArr);    
    docEl("exA").style.display = "none";
    docEl("mem-feedback").style.display = "block";
    userScored(len);
}
function continueGame() {
    emptyContent(docEl("completedcollocations"));
    docEl("exA").style.display = "block";
    docEl("mem-feedback").style.display = "none";
    prepNextExample();
    colObj.time = Date.now();
}
function prepNextExample() {
    if (!colObj.gameArr.length) {
        promptReset();
    }
    else {
        colObj.current = (colObj.gameArr).splice(0,1)[0]; //{}
        window.interact('.drag-drop').unset();
        resetExample();
    }
}

function resetExample(){
    var container = docEl("exB");
    var targetSpan = docEl("targetWord");
    var colAll = colObj.current.colOpts;
    var colCorrect = colObj.current.colOptAns;
    var lenAll = colAll.length;
    var frag = document.createDocumentFragment();
    var i;

    emptyContent(container);
    targetSpan.textContent = colObj.current.en;
    shuffleAnArray(colAll);
    
    if(colObj.current.colPos === "b4") {
       targetSpan.className = "pull-right";
    }
    else {
       targetSpan.className = "pull-left";
    }   
    
    for (i = 0; i < lenAll; i++) {
        var newDiv = document.createElement("div");
        
        newDiv.className = "drag-drop";
        newDiv.textContent = colAll[i];

        if (colCorrect.indexOf(colAll[i]) !== -1) {
            newDiv.className += " yes";
        }
        else {
            newDiv.className += " no";
        }
        frag.appendChild(newDiv);
    }
    container.appendChild(frag);
    setInteractable();
}
function checkComplete(){
    //if 3 childElements of #exA have classes === "drag-drop" + "yes" + "can-drop"
    var foo = docEl('exB');
    var count = 0;
    var i;
    var thisChild;
    
    for (i = 0; i < foo.children.length; i++) {
        thisChild = foo.children[i];
        if (thisChild.classList.contains("drag-drop")) {
            if (thisChild.classList.contains("yes") && thisChild.classList.contains("can-drop")) {
                count++;
            }
        }
        if (count >= 3) {
            addLineBreak();
            prepNextExample();
            break;
        }
    }
}
function addLineBreak() {
    var container = docEl("completedcollocations");
    var frag = document.createDocumentFragment();
    var newBr = document.createElement("br");
    
    frag.appendChild(newBr);
    //container.appendChild(frag);
    container.insertBefore(frag, container.firstChild);
}
function initGame() {
    colObj.gameArr = colObj.voca.slice(0); 
    shuffleAnArray(colObj.gameArr);
    colObj.current = (colObj.gameArr).splice(0,1)[0]; //{}
    resetExample();    
}

function convertData(data) {
    var colEl;
    var colOptsArr;

    data.forEach( function (el){
        if (el.hasOwnProperty("col")) {
            colEl = {};
            colEl.en = el.en;
            colEl.colPos = el.col.pos;
            colOptsArr = [ el.col.dis1, el.col.dis2,  el.col.dis3, el.col.ans1,  el.col.ans2,  el.col.ans3 ];
            colEl.colOptAns = [ el.col.ans1,  el.col.ans2,  el.col.ans3 ];
            colEl.colOpts = shuffleAnArray(colOptsArr);
            colObj.voca.push(colEl);
        }
    });
    initGame();
    colObj.time = Date.now();
}

function dummyLoadNoData() {
    var dummyObj = { en: "No", colPos: "af", colOptAns: ["collocations", "words", "data"], colOpts: [ "problem", "wait", "attempt", "data", "words", "collocations" ] };

    colObj.voca.push(dummyObj);
    initGame();
}

function init() {
    var objExists = window.localStorage.getItem("myClss");
    var data = JSON.parse(objExists);

    if (data !== null) {
        try {
            colObj.tchr = data.tchr;
            colObj.clss = data.clss;
            if (data.hasOwnProperty("frag") && chkTrk(data.frag) === true) {
                colObj.frag = data.frag;
            }
            convertData(data.voca);
        }
        catch(e) {
            colObj.tchr = "";
            colObj.clss = "";
            colObj.voca = [];
            dataError();
            dummyLoadNoData();
        }
        docEl("slctdTchrTxt").textContent = "" + colObj.clss + " " + colObj.tchr + " " + colObj.frag;
    }
    else {
        dataError();
        dummyLoadNoData();
    }
    renderNav();
    handlersOn();
}

window.interact('.dropzone').dropzone({ 
    accept: '.yes',  
    overlap: 0.75,
    ondropactivate: function(event) {
        event.target.classList.add('drop-active');
    },
    ondragenter: function (event) {
        var draggableElement = event.relatedTarget,
            dropzoneElement = event.target;
    
        dropzoneElement.classList.add('drop-target');
        draggableElement.classList.add('can-drop');
    },
    ondragleave: function(event) {
        event.target.classList.remove('drop-target');
        event.relatedTarget.classList.remove('can-drop');
    },
    ondrop: function(event) {
        event.relatedTarget.style.display = "none";
        setCompletedCollocation(event.relatedTarget.textContent);
    },
    ondropdeactivate: function(event) {
        event.target.classList.remove('drop-active');
        event.target.classList.remove('drop-target');
        checkComplete();
    }
});
window.dragMoveListener = dragMoveListener;    

function userScored(scr) {
    var score = "completed: " + scr + "/" + scr;
    var timeStamp = Date.now();
    var duration = timeStamp - colObj.time;

    postIt({ a: timeStamp, b: colObj.tchr, c: colObj.clss, d: colObj.frag, e: duration, f: document.title, g: score });
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