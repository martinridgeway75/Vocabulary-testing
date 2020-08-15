/*global document*/
/*global window*/
/*global XMLHttpRequest*/

window.addEventListener('load', function() {
    (function(){
         "use strict";
    
    var vocaObj = {/*baseUrl:"https://__api-path__",allTchrs:[],*/myClss:{/*isIos: false,*/tchr:"Martin Ridgeway",clss:"PE4",frag:"",voca:[]}};
    
    function docEl(elId) {
        return document.getElementById(elId);
    }
 
//window.addEventListener('load', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            docEl("usrPhoto").src = user.photoURL;
            chkUserExists(user.uid, user.displayName);
        } else {
            // User is signed out...
            window.location = "../index.html";
        }
    });
//});

function signOutOfApp() {
    firebase.auth().signOut(); //thus prompting the authState observer...
}

function chkUserExists() {
    firebase.database().ref('chkUserPermission').once('value').then(function(snapshot) {
        init();
    }, function (err) {
        logNewUser(err, true);
        return;
    });
}

function buildRegElapsedMsg(name) {
    var container = docEl("infoTxt");
    var frag = document.createDocumentFragment();
    var newDiv0 = document.createElement("DIV");
    var newDiv1 = document.createElement("DIV");
    var newH2 = document.createElement("H2");
    var newP = document.createElement("P");

    emptyContent(container);

    newDiv0.className = "row contentBox";
    newDiv0.style.marginTop = 80 + "px";
    newDiv1.className = "col-lg-12 text-left";
    newH2.textContent = "Hello";
    newP.textContent = "Hello " + name + "! We're sorry but the registration period has elapsed.\r\nPlease contact your teacher directly.";
    newDiv1.appendChild(newH2);
    newDiv1.appendChild(newP);
    newDiv0.appendChild(newDiv1);
    frag.appendChild(newDiv0);
    container.appendChild(frag);
}

function buildWelcomeMsg(name) {
    var container = docEl("infoTxt");
    var frag = document.createDocumentFragment();
    var newDiv0 = document.createElement("DIV");
    var newDiv1 = document.createElement("DIV");
    var newH2 = document.createElement("H2");
    var newP = document.createElement("P");

    emptyContent(container);

    newDiv0.className = "row contentBox";
    newDiv0.style.marginTop = 80 + "px";
    newDiv1.className = "col-lg-12 text-left";
    newH2.textContent = "Welcome";
    newP.textContent = "Hello " + name + "! Thank you for registering.\r\nPlease sign in again to use the site.";
    newDiv1.appendChild(newH2);
    newDiv1.appendChild(newP);
    newDiv0.appendChild(newDiv1);
    frag.appendChild(newDiv0);
    container.appendChild(frag);
}

//TODO: remove this once signup period has elapsed
function logNewUser(err, bool) {
    var user, 
        updates;

    if (err.code === "PERMISSION_DENIED"){
        user = firebase.auth().currentUser;

        if (user) {
            //For when the window for registration elapses:
            //buildRegElapsedMsg(user.displayName);
            //window.setTimeout( signOutOfApp, 5000 );

            buildWelcomeMsg(user.displayName);
            updates = {};
            updates['studentUser/' + user.uid] = {'email': user.email, 'uName': user.displayName};
            firebase.database().ref().update( updates ).then( window.setTimeout( signOutOfApp, 5000 ) );
        } else {
            signOutOfApp(); //window.location = "../index.html";
        }
    }
}

    function uiHandlersOn() {
        // docEl("tchrBtns").addEventListener("click", identifyTchr, {"capture":"false", "passive":"true"});
        // docEl("clssBtns").addEventListener("click", identifyClss, {"capture":"false", "passive":"true"});
        docEl("chgSelected").addEventListener("click", changeTchr, {"capture":"false", "passive":"true"});
        docEl("trckBtn").addEventListener("click", addTrkr, {"capture":"false", "passive":"true"});
    }
    
    function emptyContent(parentEl) {
        while (parentEl.hasChildNodes()) {
            while (parentEl.lastChild.hasChildNodes()) {
                parentEl.lastChild.removeChild(parentEl.lastChild.lastChild);
            }
            parentEl.removeChild(parentEl.lastChild);
        }
    }
    
    function simpleHttpRequest(url, successFn) {
        var request;
        
        try {
            request = new XMLHttpRequest();
        }
        catch(e) {
            return;
        }
        request.open("GET", url, true);
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    successFn(request.responseText);
                }
                else {
                    failInfo();
                }
            }
        };
        request.send(); //request.send(null);
    }
    
    function hideEl(elId) {
        if (!docEl(elId).classList.contains('nodisplay')) {
            docEl(elId).className += ' nodisplay';
        }
    }
    
    function showEl(elId) {
        docEl(elId).className = docEl(elId).className.replace(/(?:^|\s)nodisplay(?!\S)/g, '');
    }
    
    // function createTchrBtns() {
    //     var container = docEl("tchrBtns");
    //     var frag = document.createDocumentFragment();
    //     var len = vocaObj.allTchrs.length;
    //     var i;
        
    //     emptyContent(container);
        
    //     for (i = 0; i < len; i++) {
    //         var newDiv1 = document.createElement("div");        
            
    //         newDiv1.id = "t_" + i;
    //         newDiv1.className = "btn btn-default btn-block";
    //         newDiv1.style.marginBottom = 5 + "px";
    //         newDiv1.textContent = vocaObj.allTchrs[i].teacher;
    //         frag.appendChild(newDiv1);
    //     }
    //     container.appendChild(frag);
    // }
    
    // function createClssBtns(idx) { //idx = Number (index of obj. in vocaObj.allTchrs array)
    //     var container = docEl("clssBtns");
    //     var frag = document.createDocumentFragment();
    //     var len = vocaObj.allTchrs[idx].clsses.length;
    //     var i;
        
    //     emptyContent(container);
        
    //     for (i = 0; i < len; i++) {
    //         var newDiv1 = document.createElement("div");
            
    //         newDiv1.id = "c_" + i;
    //         newDiv1.className = "btn btn-whiteBlue btn-block";        
    //         newDiv1.style.marginBottom = 5 + "px";
    //         newDiv1.textContent = "Class: " + vocaObj.allTchrs[idx].clsses[i];
    //         frag.appendChild(newDiv1);
    //     }
    //     container.appendChild(frag);
    // }
    
    function changeTchr() {
        // vocaObj.myClss.tchr = "";
        // vocaObj.myClss.clss = "";
        // vocaObj.myClss.voca = [];
        // getInfo();
        docEl("vocaTxt").textContent = "";
        //hideEl("slctdTchr");
        //hideEl("chgSelected");
        hideEl("clssBtns");
        hideEl("myVoca");
        hideEl("trckBtn");
        hideEl("trckr");
        showEl("tchrBtns");        
        getVoca(vocaObj.myClss.tchr, vocaObj.myClss.clss);
    }
    
    // function switchObjForIdx(elId){
    //     var subStr = elId.substring(0, 2);
    //     var idx = Number(elId.substring(2));
    //     if (subStr === "t_") {
    //         showClssesToSelect(idx);
    //     }
    //     else if (subStr === "c_") {
    //         setMyClss(idx);
    //     }
    // }
    
    //@onclick handler
    // function identifyTchr(el) {
    //     if (el.target !== el.currentTarget) {
    //         switchObjForIdx(el.target.id);
    //         el.stopPropagation();
    //     }
    // }
    
    // function identifyClss(el) {
    //     if (el.target !== el.currentTarget) {
    //         switchObjForIdx(el.target.id);
    //         el.stopPropagation();
    //     }
    // }
    
    //onclick @tchrBtns  
    // function showClssesToSelect(idx) {
    //     var tchr = vocaObj.allTchrs[idx].teacher;
        
    //     createClssBtns(idx);
    //     vocaObj.myClss.tchr = tchr;
    //     docEl("slctdTchrTxt").textContent = tchr;    
    //     hideEl("tchrBtns");
    //     showEl("slctdTchr");
    //     showEl("chgSelected");
    //     showEl("clssBtns");
    // } 
    
    //onclick @clssBtns
    // function setMyClss(idx) {
    //     vocaObj.myClss.clss = vocaObj.allTchrs.filter( function (el) {
    //         return el.teacher.indexOf(vocaObj.myClss.tchr) !== -1;
    //     }).map( function (el) {
    //         return el.clsses[idx];
    //     })[0];
    //     getVoca(vocaObj.myClss.tchr, vocaObj.myClss.clss);
    // }
    
    function failInfo() {
        var container = docEl("tchrBtns");
        
        emptyContent(container);
        container.textContent = "Cannot retrieve the information.";
    }
    
    // function successInfo(response) {
    //     vocaObj.allTchrs = JSON.parse(response);
    //     createTchrBtns();
    //     hideEl("loadup");
    //     showEl("myVoca");
    // }
    
    function successVoca(response) {
        var myVoca = JSON.parse(response);
    
        // if (vocaObj.myClss.isIos === true) {
            myVoca = myVoca[0].data;
        // }
        if (myVoca !== null) {
            filterVocaSubsetByUserClss(myVoca);
        }
    }
    
    function getVoca(tchr, clss) {
        // var url = vocaObj.baseUrl + "?tchr=" + encodeURIComponent(tchr) + "&clss=" + clss;
        var url;

        tchr = tchr.replace(" ", "_");
        url = "../voca/activities/js/ios/" + tchr + ".json"; //TODO: add timeStamp queryString
    
        // if (vocaObj.myClss.isIos === true) {
        //     tchr = tchr.replace(" ", "_");
        //    url = "../voca/activities/js/ios/" + tchr + ".json";
        // }
        hideEl("myVoca");
        showEl("loadup");
        //docEl("infoTxt").textContent = "updating vocabulary for your class...";        
        simpleHttpRequest(url, successVoca);
    }
    
    // function getInfo() {
    //     var url = vocaObj.baseUrl + "?info";
    
    //     if (vocaObj.myClss.isIos === true) {
    //         url = "../voca/activities/js/ios/info.json";
    //     }
    //     hideEl("myVoca");
    //     showEl("loadup");
    //     docEl("infoTxt").textContent = "updating teacher list...";
    //     simpleHttpRequest(url, successInfo);
    // }
    
    // function toggleIsIos() {
    //     var theIosBtn = docEl("iosBtn");
    
    //     if (theIosBtn.textContent === "WEB") {
    //         vocaObj.myClss.isIos = true;
    //         theIosBtn.textContent = "IOS";
    //     } else {
    //         vocaObj.myClss.isIos = false;
    //         theIosBtn.textContent = "WEB";
    //     }
    //     changeTchr();
    // }
    
    function renderNav() {
        var container = docEl("myVoca");
        var frag = document.createDocumentFragment();
        var navDef = [
            { 
                cat: "Information", 
                links: [
                    {ref: "/voca/activities/studyguide.html", name: "Study guide"},
                    {ref: "/voca/activities/translations.html", name: "Translations"},
                    {ref: "/voca/activities/flashcards.html", name: "Flashcards"},
                    {ref: "/voca/activities/js/ios/Martin_Ridgeway_PE4_VOCA_PracticeTest_Spring2020.pdf", name: "Paper Practice Test"}
                ]
            },{ 
                cat: "Activities", 
                links: [
                    {ref: "/voca/activities/matching.html", name: "Word Match"},
                    {ref: "/voca/activities/memory.html", name: "Memory"},
                    {ref: "/voca/activities/grammarpuzzle.html", name: "Grammar Puzzle"},
                    {ref: "/voca/activities/collocations.html", name: "Collocation drop"},
                    {ref: "/voca/activities/galaga.html", name: "Galaga"},
                    {ref: "/voca/activities/h_ngm_n.html", name: "Hangman"},
                    {ref: "/voca/activities/crossword.html", name: "Crossword"}
                ]
            },{ 
                cat: "Quizzes", 
                links: [
                    {ref: "/voca/activities/synonymsquiz.html", name: "Synonyms"},
                    {ref: "/voca/activities/grammarquiz.html", name: "Grammar"},
                    {ref: "/voca/activities/collocationsquiz.html", name: "Collocations"}
                ]
            }
        ];
        var newA0,
            newDiv0,
            newDiv1,
            newDiv2;
    
        emptyContent(container);
    
        navDef.forEach( function(elem) {
            newDiv0 = document.createElement("DIV");
            newDiv1 = document.createElement("DIV");
            newDiv2 = document.createElement("DIV");
    
            newDiv0.className = "partition";
            newDiv0.textContent = elem.cat;
            newDiv1.className = "row";
            newDiv2.className = "col-lg-12";
    
            elem.links.forEach( function(el) {
                newA0 = document.createElement("A");
                
                newA0.href = el.ref || "#";
                newA0.target = "_parent";
                newA0.className = "btn btn-purple btn-half";
                newA0.textContent = el.name;
    
                newDiv2.appendChild(newA0);
            });
            newDiv1.appendChild(newDiv2);
            frag.appendChild(newDiv0);
            frag.appendChild(newDiv1);
    
        });
        container.appendChild(frag);
    }
    
    function saveMyClss() {
        if (vocaObj.myClss.tchr !=="" && vocaObj.myClss.clss !=="" ) {
            var data = JSON.stringify(vocaObj.myClss); //not changed during activities...
            
            window.localStorage.setItem("myClss", data);
        }
    }
    
    function navSelected() {
        var nav = document.querySelectorAll(".navbar.navbar-default.navbar-unslctd")[0];
    
        if (nav !== undefined) {
            nav.className = nav.className.replace(/(?:^|\s)navbar-unslctd(?!\S)/g, '');
        }
    }
    
    function addTrkr() {
        docEl("cfrmTrkr").addEventListener("click", confirmTrkr, {"capture":"false", "passive":"true"});    
        docEl("clrTrkr").addEventListener("click", clearTrkr, {"capture":"false", "passive":"true"});
        showEl("trckr");
        hideEl("trckBtn");
    }
    
    function trkVal() {
        var els = Array.from(document.querySelectorAll("input[type='text']"));
        var vals = els.map( function(el) { return el.value; });
        var frag = vals.join("");
        var n = nChars(frag);
    
        if (vals[4] ==="" && n.length && n.length === 4) {
            return frag;
        }
        return "";
    }
    
    function nChars(str) {
        return (str.replace(/[^0-9]/gmi, '')).replace(/[\s\t]+/, '');
    }
    
    function revertInputs() {    
        var els = Array.from(document.querySelectorAll("input[type='text']"));
    
        els.forEach( function(el) {
            el.value = "";
        });
        docEl("trckBtn").textContent = "ID";
    }
    
    function confirmTrkr() {
        var frag = trkVal();
    
        if (frag !== "") {
            vocaObj.myClss.frag = frag;
            docEl("trckBtn").textContent = frag;
        } else {
            revertInputs();
        }
        docEl("cfrmTrkr").removeEventListener("click", confirmTrkr, {"capture":"false", "passive":"true"});    
        docEl("clrTrkr").removeEventListener("click", clearTrkr, {"capture":"false", "passive":"true"});
        hideEl("trckr");
        showEl("trckBtn");
    }
    
    function clearTrkr() {
        vocaObj.myClss.frag = "";
        revertInputs();
    }
    
    function readySetGo() {
        docEl("infoTxt").textContent = " ";
    
        if (vocaObj.myClss.voca.length) {
            renderNav();        
            navSelected();
            showEl("myVoca");
            docEl("vocaTxt").textContent = "Ready!";
            showEl("trckBtn");
            showEl("myVoca");
            saveMyClss();
        }
        else {
            docEl("vocaTxt").textContent = "No vocabulary available for this class.";
        }
        docEl("slctdTchrTxt").textContent = "" + vocaObj.myClss.clss + " " + vocaObj.myClss.tchr;
        hideEl("clssBtns");
        hideEl("loadup");
    }
    
    function filterVocaSubsetByUserClss(vocaList) {
        var today;
    
        if (vocaList !== null && Array.isArray(vocaList)) {
            today = Date.now();
            vocaObj.myClss.voca = vocaList.filter( function(el) { 
                return el.forClss.indexOf(vocaObj.myClss.clss) !== -1 && today >= el.availFrom && today <= el.availTo; 
            });
        }
        readySetGo();
    }
    
    function populateFragInputs() {
        var frag = vocaObj.myClss.frag;
        var fragChars,
            els;
    
        if (frag ==="") {
            docEl("trckBtn").textContent = "ID";
            return;
        }
        fragChars = frag.split("");
        els = Array.from(docEl("trckr").querySelectorAll("input[type='text']"));
        docEl("trckBtn").textContent = frag;
        els.forEach( function(el, idx) {
            el.value = fragChars[idx] || "";
        });
    }
    
    function init() {
        var objExists = window.localStorage.getItem("myClss");
        var data = JSON.parse(objExists);
    
        if (data !== null) {
            try {
                vocaObj.myClss.tchr = data.tchr;
                vocaObj.myClss.clss = data.clss;
                if (data.hasOwnProperty("frag")) {
                    vocaObj.myClss.frag = data.frag;
                }
                vocaObj.myClss.clss = data.clss;
                //vocaObj.myClss.isIos = data.isIos;
            }
            catch(e) {
                //vocaObj.myClss.tchr = "";
                //vocaObj.myClss.clss = "";
                //vocaObj.myClss.isIos = false;
                //getInfo();
                vocaObj.myClss.voca = [];
            }
            showEl("slctdTchr");
            showEl("chgSelected");
            //getVoca(vocaObj.myClss.tchr, vocaObj.myClss.clss);
        }
        // else {
        //     getInfo();
        // }        
        getVoca(vocaObj.myClss.tchr, vocaObj.myClss.clss);
        uiHandlersOn();
        populateFragInputs();
        // if (vocaObj.myClss.isIos === true) {
        //     docEl("iosBtn").textContent = "IOS";
        // } else {
        //     docEl("iosBtn").textContent = "WEB";
        // }
        if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/voca/serviceWorker.js'); } //required for PWA install
        if (vocaObj.myClss.hasOwnProperty("voca")) {
            if ("onpagehide" in window ) { //iOS doesn't understand "onbeforeunload"
                window.addEventListener("pagehide", saveMyClss, false);
            } else {
                window.addEventListener("beforeunload", saveMyClss, false);
            }
        }
    }
    
    //init();
    })();
    });