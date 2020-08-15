/*global window*/
/*global document*/
/*global navigator*/

window.addEventListener('load', function() {
(function(){
    "use strict";
    
var memObj = {"time": 0,"tchr":"","clss":"", "frag": "","voca":[],"gameArr":[],"currentGame":[],"isIE":false,"paused":false,"guess":null};

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
}
    
function memCardhandlersOn() { //as soon as the deck has been added to the DOM...
    var nodes = docEl("concentrate").querySelectorAll(".mem-card");
    var i;
    //iOS cant run forEach on a NodeList
    for (i = 0; i < nodes.length; i++) {
        nodes[i].addEventListener("click", isMatched, {"capture":"false", "passive":"true"});    
    }
    //nodes.forEach( function (node) {
        //node.addEventListener("click", isMatched, {"capture":"false", "passive":"true"});
    //});
}
function memCardhandlersOff() { //as soon as the game has been won...
    var nodes = docEl("concentrate").querySelectorAll(".mem-card");
    var i;
    //iOS cant run forEach on a NodeList
    for (i = 0; i < nodes.length; i++) {
        nodes[i].removeEventListener("click", isMatched, {"capture":"false", "passive":"true"});    
    }
    //nodes.forEach( function (node) {
        //node.removeEventListener("click", isMatched, {"capture":"false", "passive":"true"});
    //});
}

function convertData(data) {
    var memEl;
    
    data.forEach( function (el, idx){
        memEl = {};
        memEl.id = idx;
        memEl.en = el.en;
        memEl.kr = el.kr;
        memObj.voca.push(memEl);
    });
    playGame();
}
function resetDeck() {
    var vocaCopy;
    
    vocaCopy = memObj.voca.slice(0);
    memObj.gameArr = shuffleAnArray(vocaCopy);   
}
function makeCardEls(cardDeck){
    var container = docEl("concentrate"); 
    var frag = document.createDocumentFragment();
    
    emptyContent(container);
    cardDeck.forEach( function (el) {
        var newDiv1 = document.createElement("div");
        var newDiv2 = document.createElement("div");
        var newDiv3 = document.createElement("div");
        var newDiv4 = document.createElement("div");
        var newImg1 = document.createElement("img");

        newDiv1.className = "mem-card";
        newDiv1.dataset.num = el[0];
        newDiv2.className = "inside";
        newDiv3.className = "front";
        newDiv3.textContent = el[1];
        newDiv4.className = "back";
        newImg1.className = "qmark";
        
        if (memObj.isIE === true) {
            newImg1.className += " IEstretch";
        }
        newImg1.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAMAAABOo35HAAAAA3NCSVQICAjb4U/gAAAAM1BMVEUsPlD///9gbnvKz9OVnqc4SVrX2957hpGwtr1GVWXy8/RTYnCIkpzl5+miqrJteoa9wsglUf9UAAAACXBIWXMAAAsSAAALEgHS3X78AAAAFnRFWHRDcmVhdGlvbiBUaW1lADAxLzE3LzE26GVpqQAAAB50RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNS4xqx9I6wAAB8dJREFUeJzt3dmW2jAQRdH2xGDG///aMDSEbqySL1aVqnrd85oVYnawbMvTV8Nm91V7ASJFLCBiARELiFhAxAIiFhCxgIgFRCwgYgERC4hYQMQCIhYQsYCIBUQsIGIBEQuIWEDEAiIWELGAiAVELCBiARELiFhAxAIiFhCxgIgFRCwgYgERC4hYQMQCIhYQsYCIBUQsIGIBEQuIWEDEAnKGNXbHffvduu+PXTfWXqSXvGAdun7f7r6m2rX9ZlV7+W55wFodT8Mk02vt/lz9R1Yd67zOQz1/Y8e6v7C6WB0gdW+7P9Rb3IpY42YLSn3/vja1lrga1tijP6r/DX2d4asW1gKqelx1sLrPVsCfXPaLXQNrPC2murbtrBe8AtZ52Rr40sl4XbTH2peiujTY/risscbpQ5qPMx25jLFWxVbBR63hqmiL1RW3uuyj2h0CmWJtylNdGsy0LLF0rAy1DLE6JSs7LTus8mO7uZYZ1kHRykrLCqv0/tWblsUehBXWWtfqsgdhoGWEdZz7nYd233ddd50O7bpzf5o/PbHW/xY2WKt5UOvN+5zxYTN3juKo/jVssOYMWO059bfH47zfl/ogb4LVX1aSHJU8fzBrul592LLAuq6EmXUpP3lwnLHrsVf+IhZY2ZVwSK6BLx3avJby9JYBVnZLuJt5KjC/Sd3qfhN9rDG3/qxnDzX5IybduUB9rNw0MrLFzx8HqJ6vVsc6yF9u1nD1v6zWSelr3FLHyvyw0CF5zO2DaI7x2liZEeuDyxYyWppHPdpY8uzoR+NxZhdCcdTSxhJ3RtuPPjIzbiluEJWxRulrfToHNYrHPor7WspY4lr48XVW8v6W3vG0MlZyLRw+XQlvifvyeuuhMlbqJ7BZL9vISyvigv+ETLpYqbNfp8PC7yRuN0ot/Vu6WKk90v7yB9iu+6/EIV5t0NLFSn2n9dKNlmS17L9B/Fe1PviaNPW+bBgWsdRGeFUs6bhw2Y62iKV2xKOKJewO7ZZ9srgTr7Y51MSS9kgXnrcS5zJCYkmbrIWHu+lZsuukRJnFf08RS7rEaPEcXZ/65O3fw1p++400ahVY+MkqYS0/HSrNahVY+MnqYBWYRkmuhzGxzulvU2B7JZ0IWf7p0yliCZv3EvvYfwtLGFVK3F4pTDwU+PTJ6mCVOF8lDIkFPn2yOlglrg2ant4f9jGx0turMucUprGamFjN6tyv26mD6SLTAon5n6hY33VvDwMpMjuXGLOaoAfSPxsvaP3tQTNl5pum5zTa1Z/AKt30blzbRZ0pVW36SHroFa/xDouVujBgp3jVUVgsYRpW7d8Mi5Xe5V04vS8UFUs4y6Z3OVtULOH6P7VzrFGxpNO3ejelBMUSDtIVr1eOiSWdkVR8FFlILPESaMVbw0JiSWd2Il/arZF0Yif0TQMKCWeNlO8Li4clX6qs+qTJcFjVLoJv4mFlbq/QfYRpNCz5xp3wd7IWLXNLWPx7pAuWsVK9M7MJhpWxGrSfUR0JK3cTq/rzVQJhZR86or4EcbByVuorYSCs7AO4DJ4SHwUra2Xw+KwoWFkriwezBcHKWhkMWE0QrPwDA22e3h0Aa8az9o1eAeIfS55naK/TptoPGXvkHiszJ3OdCbTYEN7yjjXjYbB61zb8zjnWHCu7p+f7xspY7QZTK99Yvn5XvrFmWG1NXybjGGuGld0bGW75xfJn5RfLoZVfrBlju/lrIb1i5Y+dTbeD95xi5V8oVsHKKVb+DT2Wb7165hIr/2ICs2PnH7nEcjHhPpFHrOyrn2q97tchlnwFVkUrj1i5LWE1K4dYmZXQ+M2iP3KHlVkJzQ9xXnOHJV63XdfKHZb8YoK6Vu6w5F2semP7LWdY4iPRa1t5wxIfx211LjWZMyxpFkv/yr5cvrCk4d323MRkvrCktbDizugjX1jCWlh9wGqcYQnbQpMX1OZyhSXcSVh7r+GWK6z0HqnyHUwzc4WVPoZ28cNyhZUesobai3bPE1Z6yPKwKWx8YaVnZxzsY13zhJW8S9XJWugKKzm+1z8qvOcJK7kW6r6Wdn6OsNLnofWeiIXlCCt9WqfuZPL/HGGlpxxqL9kjNwsivfCk9pI9coSVPBPtZWPoCSu5m1Xpmpn3ImB52XMIgaX+vIa5RcBycmRILKgIWF72SUNg1V6wZ36WJP2ezdoL9szPkiQnHbzMZoXAcnO0EwHLzyL6WZL0RGntBXvmZ0m4NURKnY92ch6scYW1mryGZnBzGO0Kq7m9IutXbvber/nCch6xgIgFRCwgYgERC4hYQMQCIhYQsYCIBUQsIGIBEQuIWEDEAiIWkB+sffurxxnqYW3+cL9EfrCSpw2d3JnZBMHyctERsYCIBUQsIGIBEQuIWEDEAiIWELGAiAVELCBiARELiFhAxAIiFhCxgIgF5BjruNkSK9Eb1ssJHmL9iqshELGAiAV0f80xsWbFXxZQ+nf1NTi52MEP1uHt9rlnTqwcYQWIWEDEAiIWELGAiAVELCBiARELiFhAxAIiFhCxgIgFRCwgYgERC4hYQMQCIhYQsYCIBUQsIGIBEQuIWEDEAiIWELGAiAVELCBiARELiFhAxAIiFhCxgIgFRCwgYgERC4hYQMQCIhYQsYCIBUQsIGIBEQuIWEDEAiIWELGAiAX0DxErVBN08UC2AAAAAElFTkSuQmCC";
        newImg1.alt = "?";
        newDiv4.appendChild(newImg1);
        newDiv2.appendChild(newDiv3);
        newDiv2.appendChild(newDiv4);
        newDiv1.appendChild(newDiv2);
        frag.appendChild(newDiv1);
    });
    container.appendChild(frag); 
    memCardhandlersOn();
}
function createCards() {
    var len = memObj.gameArr.length;
    var deckSize = 6;
    var cardDeck = [];
    var cardEn;
    var cardKr;
    
    if(!len || len < 2) {
        resetDeck();
    }
    else if(len < 6) {
        deckSize = len;
    }
    memObj.currentGame = (memObj.gameArr).splice(0, deckSize);

    memObj.currentGame.forEach (function (el) {
        cardEn = [el.id, el.en];
        cardKr = [el.id, el.kr];
        cardDeck.push(cardEn, cardKr);
    });
    shuffleAnArray(cardDeck);
    makeCardEls(cardDeck);
}
function isCorrectGuess(bool) {
    var container = docEl("concentrate");
    var nodes = container.querySelectorAll(".picked");
    var i;
    //iOS cant run forEach on a NodeList
    for (i = 0; i < nodes.length; i++) {
        nodes[i].className = nodes[i].className.replace(/(?:^|\s)picked(?!\S)/g, '');
        if (bool === true) {
            nodes[i].className += " matched";
        }
    }
    /*
    nodes.forEach( function (node){
        node.className = node.className.replace(/(?:^|\s)picked(?!\S)/g, '');
        if (bool === true) {
            node.className += " matched";
        }
    });
    */
}
function isMatched(el){
    if (el.currentTarget.className === "mem-card") {
        var container = docEl("concentrate");
        var child = el.currentTarget.childNodes[0]; //<div class="inside"></div>
    
        if (memObj.paused === false && !child.classList.contains("picked") && !child.classList.contains("matched")) {
            child.className += " picked";

            if (!memObj.guess) {
                memObj.guess = el.currentTarget.dataset.num;
            }
            else if (memObj.guess === el.currentTarget.dataset.num) {
                isCorrectGuess(true);
                memObj.guess = null;
            }
            else {
                memObj.guess = null; 
                memObj.paused = true;
                
                var reFlip = window.setTimeout(function() {
                    isCorrectGuess(false);
                    memObj.paused = false;
                    window.clearTimeout(reFlip);
                }, 500);
            }
            if (container.querySelectorAll(".matched").length === container.querySelectorAll(".mem-card").length) {
                gameWon();
            }
        }
    }
    el.stopPropagation();
}
function playGame() {
    docEl("mem-feedback").style.display = "none";
    createCards();
    memObj.time = Date.now();
}
function gameWon() {
    var len = memObj.gameArr.length;
    var vocaLen = memObj.voca.length;

    memCardhandlersOff();

    if (len < 2) {
        docEl("mem-feedback").style.display = "block";
        userScored(vocaLen);
    } else {
        createCards();
    }
}

function init() {
    var objExists = window.localStorage.getItem("myClss");
    var data = JSON.parse(objExists);

    if (data !== null) {
        try {
            memObj.tchr = data.tchr;
            memObj.clss = data.clss;
            if (data.hasOwnProperty("frag") && chkTrk(data.frag) === true) {
                memObj.frag = data.frag;
            }
            convertData(data.voca);
        }
        catch(e) {
            memObj.tchr = "";
            memObj.clss = "";
            memObj.voca = [];
            dataError();
        }
        if(navigator.msSaveBlob) {
            memObj.isIE = true;
        }
        memObj.time = Date.now();
        docEl("restart").addEventListener("click", playGame, {"capture":"false","passive":"true"});
        docEl("slctdTchrTxt").textContent = "" + memObj.clss + " " + memObj.tchr + " " + memObj.frag;
        }
    else {
        dataError();
    }
    renderNav();
    handlersOn();
}

function userScored(scr) {
    var score = "completed: " + scr + "/" + scr;
    var timeStamp = Date.now();
    var duration = timeStamp - memObj.time;

    postIt({ a: timeStamp, b: memObj.tchr, c: memObj.clss, d: memObj.frag, e: duration, f: document.title, g: score });
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