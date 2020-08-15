/*global window*/
/*global document*/
/*global Sortable*/
/*global firebase*/
/*global Blob*/
/*global JSZip*/
/*global pdfMake*/

window.addEventListener('load', function() {
(function(){
     "use strict";

var appVoca = {
    practiceArr: [],
    settings: {
        user: "",
        bookUnits: [],
        defaultNow: "",
        defaultFuture: ""
    },
    data: {}, //{ allowTsk:[], book: "", en: "", exam: {}, practice: {} }
    texts: {} //{ ctx: "", tgts: [], exam: {}, practice: {} }
};

function prac_setDates() {
    var today = Date.now();
    var future = today + 13148719167; //+5 months

    appVoca.settings.defaultNow = new Date(today).toISOString().substring(0, 10);
    appVoca.settings.defaultFuture = new Date(future).toISOString().substring(0, 10);
}

//window.addEventListener('load', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            docEl("usrPhoto").src = user.photoURL;
            appVoca.settings.user = capitalizeUserName(user.displayName);
            initApp();
        } else {
            // User is signed out...
            window.location = "../index.html";
        }
    });
//});

function signOutOfApp() {
    firebase.auth().signOut(); //thus prompting the authState observer...
}

function docEl(elId) {
    return document.getElementById(elId);
}

function prac_handlersOn() {
    docEl('foo3-filters').addEventListener('click', prac_filterVoca, {capture: false, passive: true});
    docEl('foo4').addEventListener('click', prac_identifyTsk5Li, {capture: false, passive: true});
    docEl('screenButtons').addEventListener('click', identifyScreenBtn, {capture: false, passive: true});
    docEl('addNewClssBtn').addEventListener('click', addNewDefaultClss, {capture: false, passive: true});
    docEl('classBuckets').addEventListener('click', prac_identifyClssBtn, {capture: false, passive: true});
    docEl('logout').addEventListener('click', signOutOfApp, {capture: false, passive: true});
    docEl('reportError').addEventListener('click', prac_reportErrorInData, {capture: false, passive: true});
}

function emptyContent(parentEl) {
    while (parentEl.hasChildNodes()) {
        while (parentEl.lastChild.hasChildNodes()) {
            parentEl.lastChild.removeChild(parentEl.lastChild.lastChild);
        }
        parentEl.removeChild(parentEl.lastChild);
    }
}

function hideEl(elId) {
    if (!docEl(elId).classList.contains('nodisplay')) {
        docEl(elId).className += ' nodisplay';
    }
}

function showEl(elId) {
    docEl(elId).className = docEl(elId).className.replace(/(?:^|\s)nodisplay(?!\S)/g, '');
}

function capitalizeUserName(str) {
    return str.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

/********************************* user reporting error in data  **************************************/
//orig.
function exitErrorInData() {    
    hideEl("errorFbk");
    hideEl("errorFbkCancel");
    docEl("errorFbk").value = "";
    docEl("reportError").textContent = "Report error";    
    return;
}

function prac_reportErrorInData() {
    var errorObj = {};
    var reportedElOnline = Array.from(docEl("classBuckets").querySelectorAll("li.previewSelected"));
    var refUid;

    if (reportedElOnline.length) {
        refUid = reportedElOnline[0];
        errorObj.task = refUid.parentElement.dataset.task || "unknown";
    } else {
        return;
    }
    if (docEl("errorFbk").classList.contains("nodisplay")) {
        docEl("reportError").textContent = "Confirm error";
        showEl("errorFbk");
        return;
    }
    confirmErrorInData(errorObj, refUid);
}
//orig.
function confirmErrorInData(errorObj, refUid) {
    var descr = docEl("errorFbk").value;

    if (descr === "") {
        window.mscAlert({ title: "", subtitle: "Please describe the issue briefly." });
        return;
    }
    errorObj.descr = descr;
    errorObj.uid = refUid.dataset.uid;
    errorObj.user = appVoca.settings.user;

    if (errorObj.uid !== undefined) {
        pushNewObjToDb(errorObj, "data/pe4/errors/", null, "Thank you! The error was reported.");
    } else {
        window.mscAlert({ title: "", subtitle: "Cannot identify the record. The error cannot be reported." });
    }    
    exitErrorInData();
}

/*********************** preview example on exam  *******************/

function prac_identifyClssBtn(el) { //el.currentTarget -> "clssBuckets"
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "SPAN") {
            if (el.target.id !== "") {
                switchForBucketBtns(el.target.id);
            } else if (el.target.classList.contains("pvR-btn")) {
                removeSingleLiFromOneTskInDOM(el.target);
            } else {
                prac_triggerPreviewEx(el.target.parentElement);
            }
        } else {
            prac_previewTsksFromLi(el.target);
        }
        el.stopPropagation();
    }
}

function prac_previewTsksFromLi(el) {
    if (el.nodeName === "LI" && el.dataset.uid !== undefined) {
        prac_triggerPreviewEx(el);
    }
}
//orig.
function createTsk1To4PreviewRenderObj(uid, task, isTsk1, refProp) {
    var tgtEn = appVoca.data[uid].en;
    var sourceObj = appVoca.data[uid][refProp][task];
    var renderObj = {"b4": "", "en": "", "af": "", "opts": { "a": "", "b": "", "c": "", "d": "" }};
    var isCol = false;
    var isTsk2 = false;

    if (task === "col") {
        isCol = true;
        renderObj.en = tgtEn;
        renderObj[sourceObj.pos] = "_____";
        renderObj.opts.a = "a. " + sourceObj.dis1 + " | " + sourceObj.dis2 + " | " + sourceObj.ans1;
        renderObj.opts.b = "b. " + sourceObj.ans2 + " | " + sourceObj.ans3 + " | " + sourceObj.dis3;
        renderObj.opts.c = "c. " + sourceObj.dis3 + " | " + sourceObj.dis1 + " | " + sourceObj.dis2;
        renderObj.opts.d = "d. " + sourceObj.ans1 + " | " + sourceObj.ans2 + " | " + sourceObj.ans3;
    } else {
        renderObj.b4 = sourceObj.b4;
        renderObj.af = sourceObj.af;
        renderObj.opts.b = "b. " + sourceObj.dis1;
        renderObj.opts.c = "c. " + sourceObj.dis2;
        renderObj.opts.d = "d. " + sourceObj.ans;

        if (isTsk1 === false) {
            renderObj.en = "_____";  
            
            if (task === "syn") {
                isTsk2 = true;
            } else { // is "gmr"
                if (refProp === "practice") {
                    renderObj.opts.a = "a. " + sourceObj.dis3;
                    renderObj.opts.d = "d. " + tgtEn;
                } else {
                    renderObj.opts.a = "a. " + tgtEn;
                }
            }
        } else {
            renderObj.en = tgtEn;
            renderObj.opts.a = "a. " + sourceObj.dis3;
        }
    }
    renderTsk1To4PreviewExmpl(renderObj, isCol, isTsk2, isTsk1, refProp);
}

function renderTsk1To4PreviewExmpl(renderObj, isCol, isTsk2, isTsk1, refProp) {
    var container;
    var frag = document.createDocumentFragment();
    var newDiv0 = document.createElement("DIV");
    var newDiv1 = document.createElement("DIV");
    var newSpan0 = document.createElement("SPAN");
    var newSpan1 = document.createElement("SPAN");
    var newSpan2 = document.createElement("SPAN");
    var newSpan3 = document.createElement("SPAN");
    var newBr,
        newSpanU,
        newTxtNd0,        
        newTxtNd1,
        newLbl0;

    if (refProp === "exam") {
        container = docEl("previewExamExmpl");
    } else {
        container = docEl("previewPracticeExmpl");
        newLbl0 = document.createElement("LABEL");
        newLbl0.className = "label label-xs label-color777";
        newLbl0.textContent = "Practice";
        newDiv0.appendChild(newLbl0);
    }
    emptyContent(container);

    if (isTsk2 === true) { 
        newDiv1.style.display = "none";
    }    
    newDiv0.className = "previewExmplDiv";

    if (refProp === "practice") {
        newDiv0.appendChild(newLbl0);
    }
    if (isTsk1 === true) {
        newSpanU = document.createElement("SPAN");
        newTxtNd0 = document.createTextNode(renderObj.b4 + " ");
        newTxtNd1 = document.createTextNode(" " + renderObj.af);
        newSpanU.textContent = renderObj.en;
        newSpanU.style.textDecoration = "underline";

        newDiv0.appendChild(newTxtNd0);
        newDiv0.appendChild(newSpanU);
        newDiv0.appendChild(newTxtNd1);
    } else {        
        newTxtNd0 = document.createTextNode(renderObj.b4 + " " + renderObj.en + " " + renderObj.af);

        newDiv0.appendChild(newTxtNd0);
    }
    newSpan0.className = "previewExmplSpan";
    newSpan1.className = "previewExmplSpan";
    newSpan2.className = "previewExmplSpan";
    newSpan3.className = "previewExmplSpan encircled";
    newSpan0.textContent = renderObj.opts.a;
    newSpan1.textContent = renderObj.opts.b;
    newSpan2.textContent = renderObj.opts.c;
    newSpan3.textContent = renderObj.opts.d;

    newDiv1.appendChild(newSpan0);
    newDiv1.appendChild(newSpan1);

    if (isCol === true) { 
        newBr = document.createElement("BR");
        newDiv1.appendChild(newBr);
    }
    newDiv1.appendChild(newSpan2);
    newDiv1.appendChild(newSpan3);
    frag.appendChild(newDiv0);
    frag.appendChild(newDiv1);
    container.appendChild(frag);
}

function prac_clearThisPreviewEl(evt) {
    if (evt.item.classList.contains("previewSelected")) {
        evt.item.className = evt.item.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
        emptyContent(docEl("previewExamExmpl"));
        emptyContent(docEl("previewPracticeExmpl"));
        exitErrorInData();
    }
    evt.stopPropagation();
}

function prac_clearAllPreviewEls() {
    var els = Array.from((docEl("classBuckets")).querySelectorAll("li.category.previewSelected"));

    els.forEach( function(el) {
        el.className = el.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
    });
    emptyContent(docEl("previewExamExmpl"));
    emptyContent(docEl("previewPracticeExmpl"));
    exitErrorInData();
}

function prac_triggerPreviewEx(el) { //from LI only
    var uid = el.dataset.uid;
    var task = el.parentElement.dataset.task;
    var isTsk1 = (task === "syn");
    var bool = el.classList.contains("previewSelected");

    if (uid === undefined || !appVoca.data[uid].exam.hasOwnProperty(task)) {
        return;
    }
    if (bool) {
        prac_clearAllPreviewEls();
        el.className = el.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
    } else {
        prac_clearAllPreviewEls();
        el.className += " previewSelected";
        createTsk1To4PreviewRenderObj(uid, task, isTsk1, "exam");
        createTsk1To4PreviewRenderObj(uid, task, isTsk1, "practice");
    }
}


/********************************* populate vocabulary lists  **************************************/
//orig.
function createLiForFoo(fooId, uid, eng, book) {
    var container = docEl(fooId);
    var frag = document.createDocumentFragment();    
    var newLi = document.createElement("LI");
    var newTxtNd = document.createTextNode(eng);
    var newSpan;
    
    newLi.className = "category";
    newLi.dataset.uid = uid;
    newLi.appendChild(newTxtNd);
    
    if (book !== "0") {
        newSpan = document.createElement("SPAN");
        newSpan.className = "encircled";
        newSpan.textContent = book;
        newLi.className += " purplerain";
        newLi.appendChild(newSpan);
    } else if (fooId === "foo2" || fooId === "bop") {
        newSpan = document.createElement("SPAN");
        newSpan.textContent = appVoca.texts[uid].tgts.join(", ");
        newSpan.className += " t5tgtsList";
        newLi.appendChild(newSpan);
    }
    frag.appendChild(newLi);
    container.appendChild(frag);    
}

//orig.
function populateFoo(fooId, dataObj) {
    var dataKeys = Object.keys(dataObj);

    if (fooId === "foo2") { //appVoca.texts
        dataKeys.sort( function(a,b) { return (dataObj[a].ctx).localeCompare(dataObj[b].ctx); });
        dataKeys.forEach(function(elem) {
            createLiForFoo(fooId, elem, dataObj[elem].ctx.toLocaleUpperCase(), "0");
        });
        return;
    }
    dataKeys.sort( function(a,b) { return (dataObj[a].en).localeCompare(dataObj[b].en); });
    dataKeys.forEach(function(el) {
        if (dataObj[el].hasOwnProperty("allowTsk")) { //disallow any "pending" requests
            createLiForFoo(fooId, el, dataObj[el].en, dataObj[el].book);
        }
    });
}

/********************************* setup  **************************************/

//TODO: enable and disable  these in tg1 also....w/ disableSortableInstanceOnActiveEl(tgtUl);
//if integrated with main app: need to refresh foo3 when an exam word is deleted and...
//...remove all instances of that word from the classBuckets

//TODO: when exam voca is updated by a moderator (&& user is a moderator), all li.s in classBuckets need to be rechecked for allowTsk, and removed if !allowed

// function resetFooContainers() {
//     emptyContent(docEl("foo2"));
//     emptyContent(docEl("foo")); 
//     emptyContent(docEl("bar"));
//     emptyContent(docEl("baz"));
//     emptyContent(docEl("baz2"));
//     emptyContent(docEl("urbaz"));
//     emptyContent(docEl("colin"));
//     emptyContent(docEl("bop"));   
// }

function prac_populateFoo3Filters() {
    var container = docEl("foo3-filters");
    var frag = document.createDocumentFragment();
    var newInput0 = document.createElement("INPUT");
    var newLabel0 = document.createElement("Label");
    var newInput;
    var newLabel;

    emptyContent(container);

    newInput0.type = "checkbox";
    newInput0.id = "fltrX";    
    newInput0.checked = "true";
    newInput0.dataset.book = "0";
    newLabel0.htmlFor = "fltrX";
    newLabel0.textContent = "Not in book";

    frag.appendChild(newInput0);
    frag.appendChild(newLabel0);

    appVoca.settings.bookUnits.forEach( function(el, i) {
        newInput = document.createElement("INPUT");
        newLabel = document.createElement("Label");
        newInput.type = "checkbox";
        newInput.id = "fltr" + i;
        newInput.checked = "true";
        newInput.dataset.book = el;
        newLabel.htmlFor = "fltr" + i;
        newLabel.textContent = "Unit " + el;
        frag.appendChild(newInput);
        frag.appendChild(newLabel);
    });
    container.appendChild(frag);
}

function prac_setBookFilters() {
    var dataKeys = Object.keys(appVoca.data);

    appVoca.settings.bookUnits = dataKeys.map( function(el) { return appVoca.data[el].book; }).filter( function(el, idx, arr){ return arr.indexOf(el) === idx && el !== undefined && el !== "" && el !== "0"; });
    appVoca.settings.bookUnits.sort( function(a,b) { return a - b; });
    prac_populateFoo3Filters();
}

function prac_calculateSettings() {
    prac_setBookFilters();
    prac_setDates();
}

/********************************* filter foo elements by checked book units  **************************************/
//orig.
function getRelevantElsForFooFilter(els, book) {
    if (book === "0") {
        return els.filter( function(el){ return !el.classList.contains("purplerain"); }); //therefore not in book
    }
    return els.filter( function(el){ return el.classList.contains("purplerain") && appVoca.data[el.dataset.uid].book === book; });
}

function prac_filterVoca() {
    var els = Array.from((docEl("foo3")).querySelectorAll("li.category"));
    var chkArr = prac_getChkBoxForVoca();
    var relvEls;

    els.forEach ( function (el){ //hide all els
        if (!el.classList.contains("filteredOut")) {
            el.className += " filteredOut";
        }
    });
    chkArr.forEach( function(elem) { //bring up all el.s that match checked filters
        relvEls = getRelevantElsForFooFilter(els, elem);
        relvEls.forEach(function (eleme) {
            if (eleme.classList.contains("filteredOut")) {
                eleme.className = eleme.className.replace(/(?:^|\s)filteredOut(?!\S)/g, '');
            }
        });
    });
}

function prac_getChkBoxForVoca() {
    var els = Array.from((docEl("foo3-filters")).querySelectorAll('input[type="checkbox"]'));

    return els.filter( function(el) { return el.dataset.book !== undefined && el.checked === true; }).map( function(elem) { return elem.dataset.book; });
}

/*********************** highlight elements that are part of task 5 (#foo3 && classBuckets)  *******************/

function prac_identifyTsk5Li(el) {
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "LI" && el.target.dataset.uid !== undefined) {
            prac_triggerTsk5Borders(el.target);
        } else if (el.target.nodeName === "SPAN" && el.target.parentElement.dataset.uid !== undefined) {
            prac_triggerTsk5Borders(el.target.parentElement);
        }
        el.stopPropagation();
    }
}

function prac_triggerTsk5Borders(elTgt) {
    var t5tgtsArr = appVoca.texts[elTgt.dataset.uid].tgts || [];

    prac_clearAllTsk5Borders();
    prac_highlightTsk5VocaInTsks1To4(t5tgtsArr);

    if (!elTgt.classList.contains("purpleborder")) {
        elTgt.className += " purpleborder";
    }
}    

function prac_clearAllTsk5Borders() {
    var els = Array.from((docEl("fullClassLists")).querySelectorAll("li.category.purpleborder"));
    
    els.forEach( function(el) {
        el.className = el.className.replace(/(?:^|\s)purpleborder(?!\S)/g, '');
    });

}

function prac_highlightTsk5VocaInTsks1To4(tsk5tgtsArr) {
    var elsFoo3 = Array.from((docEl("foo3")).querySelectorAll("li.category"));    
    var elsBkts = Array.from((docEl("classBuckets")).querySelectorAll("li.category"));
    var idx;

    elsFoo3.forEach( function(el) {
        idx = tsk5tgtsArr.indexOf(appVoca.data[el.dataset.uid].en);

        if (idx !== -1) {
            el.className += " purpleborder";
        }
    });
    elsBkts.forEach( function(el) {
        idx = tsk5tgtsArr.indexOf(appVoca.data[el.dataset.uid].en);

        if (idx !== -1) {
            el.className += " purpleborder";
        }
    });
}


/********************************* menu button functions **************************************/
//orig.
function identifyScreenBtn(el) {
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "A" && el.target.dataset.func !== undefined) {
            switchForToggleScreenBtns(el.target.dataset.func);
        }
        el.stopPropagation();
    }
}

//orig. MOD
function switchForToggleScreenBtns(func) {
    switch(func) {
        //prac_
        case "olp": triggerUpdateOnlinePrac();
        break;
        case "oxt": exitOnlinePracticeEnterTestGen();
        break;
        //end: prac_
        default: return;
    }
}

//orig.
function repopulateMenu(btnObj) {
    var container = docEl("screenButtons");
    var frag = document.createDocumentFragment();
    var newA0 = document.createElement("A");
    var newA1 = document.createElement("A");

    emptyContent(container);

    newA0.href = "#";
    newA0.className = "btn-whitePurple pull-right";
    newA1.href = "#";
    newA1.className = "btn-whitePurple pull-right";
    newA0.dataset.func = btnObj.a0.func;
    newA0.textContent = btnObj.a0.txt;
    newA1.dataset.func = btnObj.a1.func;
    newA1.textContent = btnObj.a1.txt;

    frag.appendChild(newA0);
    frag.appendChild(newA1);
    container.appendChild(frag);
}

function clickEnterOnlinePracScreen() {
    var btnObj = { a0: {func: "oxt", txt: "TEST GENERATOR"}, a1: {func: "olp", txt: "UPDATE ONLINE CLASSES"} };

    appVoca.settings.editMode = true;
    toggleBetweenScreens(btnObj);
}

//orig. MOD
function toggleBetweenScreens(btnObj) {
    var func = btnObj.a0.func;

    repopulateMenu(btnObj);

    if (func === "gen") { showEl("fullVocaLists"); return; }
    if (func === "dwl") { showEl("fullLayout"); return; }
    if (func === "exp") { showEl("fullRequest"); return; }
    if (func === "exi") { showEl("fullPrevious"); return; }
    //prac_
    if (func === "olp") { showEl("fullClassLists"); return; }
}

function triggerUpdateOnlinePrac() {
    var allClssNmes = (Array.from(docEl("classBuckets").querySelectorAll("input[type='text']"))).filter( function (el) { return el.dataset.removed == undefined; }).map( function (el) { return el.value; });

    if (allClssNmes.indexOf("") !== - 1) {
        window.mscConfirm({
            title: '',
            subtitle: 'Classes that are left unnamed will be discarded. Proceed?',
            cancelText: 'Cancel',
            onOk: function () {
                updateOnlinePrac();
                return;
            }, 
            onCancel: function () {
                return;
            }
        });
        return;
    }
    updateOnlinePrac();
}

//I would have never of thought of this! many thx to: stckoverflow...
function stringifyArrayToRemoveDups(tgtArr) {
    return tgtArr.map(function(ar) { return JSON.stringify(ar); }).filter(function(el, idx, arr) { return arr.indexOf(el) === idx; }).map(function(str) { return JSON.parse(str); });
}

function isEqualArray(arr1, arr2) {
    var i;

    if (arr1.length !== arr2.length) { return false; }
    for (i = 0; i < arr1.length; i++) { if (arr1[i] !== arr2[i]) { return false; } }
	return true;
}

function updateOnlinePrac() {
    var tmp1Arr = getAllClssesInDOM() || []; //TODO: HASH! ->  [ [ uid, from, to, tsk, clss  ],... ]
    var onlineArr = [];
    var clssNmeArr = tmp1Arr.map( function (elem) { return elem[4]; }).filter( function(el, idx, arr) { return arr.indexOf(el) === idx; });
    var onlineObj,
        tmp2Arr,
        i;

    tmp2Arr = tmp1Arr.map( function (el) { return [ el[0], el[1], el[2], [], [el[4]] ]; }); //NOTE: [3] is an empty arr, NOT el[3] && el[4] is nested !
    tmp2Arr = stringifyArrayToRemoveDups(tmp2Arr);
    tmp2Arr.forEach( function(elem) { //merge the tsks within each clss <- available times are identical
        tmp1Arr.forEach( function(el) {
            if (el[0] === elem[0] && el[1] === elem[1] && el[2] === elem[2] && el[4] === elem[4][0]) {
                if (elem[3].indexOf(el[3]) === - 1) {
                    elem[3].push(el[3]);
                    if (elem[3].length > 1) {    
                        elem[3].sort( function(a,b) { return a.localeCompare(b); }); //or dup will not be removed
                    }
                }
            }
        });
    });
    tmp1Arr = stringifyArrayToRemoveDups(tmp2Arr.slice(0));
    tmp1Arr.forEach( function(elem) { //merge clsses <- identical practiceTsks && available times
        tmp2Arr.forEach( function(el) {
            if (el[0] === elem[0] && el[1] === elem[1] && el[2] === elem[2]) {
                if (isEqualArray(el[3], elem[3]) && elem[4].indexOf(el[4][0]) === - 1) {
                    elem[4].push(el[4][0]);
                    if (elem[4].length > 1) {
                        elem[4].sort( function(a,b) { return a.localeCompare(b); }); //or dup will not be removed
                    }
                }
            }
        });
    });
    tmp2Arr = stringifyArrayToRemoveDups(tmp1Arr.slice(0));
    tmp2Arr.forEach( function(elem) {
        onlineObj = {
            availFrom: elem[1],
            availTo: elem[2],
            practiceTsk: elem[3],
            forClss: elem[4],
            en: appVoca.data[elem[0]].en,
            kr: appVoca.data[elem[0]].practice.kr,
            ctxEn: appVoca.data[elem[0]].practice.enCtx || ""
            //TODO
            //ctxKr: appVoca.data[elem[0]].practice.ctxKr
        };
        for (i = elem[3].length - 1; i >= 0; i--) {
            if ( appVoca.data[elem[0]].allowTsk.indexOf(elem[3][i]) !== -1 ) {
                onlineObj[elem[3][i]] = appVoca.data[elem[0]].practice[elem[3][i]];
            } else {
                elem[3].splice(i, 1); // !allowTsk
            }
        }
        if (elem[3].length) {
            onlineArr.push(onlineObj);
        }
    });
    prac_overwriteObjInDb(onlineArr, clssNmeArr);
}

function exitOnlinePracticeEnterTestGen() {
    //disable all active sortables for the practice screen
//TOGGLE INTO test GENERATOR
    window.location = 'index.html';
}


/************************** to work around the max field size ***************************/

function chunkSubstr(str) {
    var len = str.length;
    var numChunks = 6; //Math.ceil(len / size);
    var size = Math.ceil(len / numChunks);
    var chunks = new Array(numChunks);
    var i,
        o;

    for (i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }  
    return chunks;
  }

/*********************** db communication  *******************/

function prac_overwriteObjInDb(newObj, clssNmeArr) { //update (or null) practice obj for the current user
    var user = firebase.auth().currentUser;
    var updates = {};
    var data = chunkSubstr(JSON.stringify(newObj));

    updates['practice/' + user.uid] = newObj;
    updates['practice/tchrIndex/' + user.uid] = { name: user.displayName, clsses: clssNmeArr };
    updates['practice/gsheets/' + user.uid] = {
        displayName: user.displayName, clsses: JSON.stringify(clssNmeArr), pta: data[0] || "", ptb: data[1] || "", ptc: data[2] || "", ptd: data[3] || "", pte: data[4] || "", ptf: data[5] || "", timeStamp: (Date.now()).toString()
    };
     firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
        } else {
            appVoca.practiceArr = newObj; //there is only one arr of obj.s.
            window.mscAlert({ title: "", subtitle: "Your online vocabulary has been updated!" });
        }
    });
}

//orig. MOD
function pushNewObjToDb(newObj, path, saveToObj, msg) { //generic add something to db
    var newPostKey = firebase.database().ref().child(path).push().key;
    var updates = {};

    updates[path + newPostKey] = newObj;
    firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
        } else {
            if (saveToObj !== null) {
                saveToObj[newPostKey] = newObj;
            }
            window.mscAlert({ title: "", subtitle: msg });

            // if (path === "data/pe4/pending/") {
            //     if (newObj !== null) {
            //         appVoca.settings.refresh.uid = newPostKey;
            //         appVoca.settings.refresh.cat = "pending";
            //     }
            //     populatePendingList();
            // }
            // if (path === "data/pe4/errors/" && appVoca.settings.isMod === true) {
            //     refreshVocaFromDbForMod();
            // }
        }
    });
}

//orig.
function chkPermission(e) {
    var user,
        updates;
        
    if (e.code === "PERMISSION_DENIED"){
        user = firebase.auth().currentUser;

        if (user) {
            updates = {};
            updates['newUser/pe4/' + user.uid] = user.displayName;
            firebase.database().ref().update( updates ).then( signOutOfApp() );
        } else {
            signOutOfApp(); //window.location = "../index.html";
        }
    }
}
//orig.
function getVocaFromDb() {
    var pe4exams;
    
    firebase.database().ref('data/pe4/exams').once('value').then(function(snapshot) {
        pe4exams = snapshot.val();

        if (pe4exams !== null) {
            appVoca.data = pe4exams.ledata || {};
            appVoca.texts = pe4exams.letexts || {};
            startApp();
        }
    }, function (e) {
        chkPermission(e);
        return;
    });
}

function getPracticeFromDb() {
    var user = firebase.auth().currentUser;
    
    firebase.database().ref('practice/' + user.uid).once('value').then(function(snapshot) {
        appVoca.practiceArr = snapshot.val() || [];
        initPractice();
    }, function (e) {
        chkPermission(e);
        return;
    });
}


/************************* online practice class buckets **************************/

function addNewDefaultClss() {
    renderClssBucket("", false);
}

function renderClssBucket(clssNme, bool) {
    var container = docEl("classBuckets");
    var frag = document.createDocumentFragment();
    var newDiv0 = document.createElement("DIV");
    var newDiv1 = document.createElement("DIV");
    var newDiv2 = document.createElement("DIV");
    var newDiv3 = document.createElement("DIV");
    var newDiv4 = document.createElement("DIV");
    var newDiv5 = document.createElement("DIV");
    var newDiv6 = document.createElement("DIV");
    var newDiv7 = document.createElement("DIV");
    var newDiv8 = document.createElement("DIV");
    var newDiv9 = document.createElement("DIV");
    var newDiv10 = document.createElement("DIV");
    var newDiv11 = document.createElement("DIV");
    var newSpan0 = document.createElement("SPAN");
    var newSpan2 = document.createElement("SPAN");
    var newInput0 = document.createElement("INPUT");
    var newUl0 = document.createElement("UL");
    var newUl1 = document.createElement("UL");
    var newUl2 = document.createElement("UL");
    var i = (Array.from(docEl("classBuckets").children).length - 1) + 1;

    newDiv0.id = "bkt_" + i;
    newDiv0.className = "col-lg-12";
    newDiv0.style.marginBottom = 40 + "px";
    newDiv1.className = "row pink2bg";
    newDiv2.className = "col-lg-12";
    newDiv3.style.padding = "2px 0";
    newInput0.type = "text";
    newInput0.value = clssNme;
    newInput0.placeholder = "class name";
    newSpan0.id = "clp_" + i;
    newSpan0.className = "caret";
    newSpan2.id = "del_" + i;
    newSpan2.className = "btn btn-xs btn-default pvR1-btn pull-right";
    newSpan2.textContent = "X";
    newDiv4.className = "row text-center";
    newDiv5.className = "col-lg-4 col-md-4 col-sm-4 col-xs-4";
    newDiv5.textContent = "Synonyms";
    newDiv6.className = "col-lg-4 col-md-4 col-sm-4 col-xs-4";
    newDiv6.textContent = "Grammar";
    newDiv7.className = "col-lg-4 col-md-4 col-sm-4 col-xs-4";
    newDiv7.textContent = "Collocations";
    newDiv8.className = "row";
    newDiv9.className = "col-lg-4 col-md-4 col-sm-4 col-xs-4 pinkbg";
    newDiv10.className = "col-lg-4 col-md-4 col-sm-4 col-xs-4 pinkbg";
    newDiv11.className = "col-lg-4 col-md-4 col-sm-4 col-xs-4 pinkbg";
    newUl0.id = "syn_" + i;
    newUl0.dataset.task = "syn";
    newUl1.id = "gmr_" + i;
    newUl1.dataset.task = "gmr";
    newUl2.id = "col_" + i;
    newUl2.dataset.task = "col";

    newDiv3.appendChild(newSpan0);
    newDiv3.appendChild(newInput0);
    newDiv3.appendChild(newSpan2);
    newDiv2.appendChild(newDiv3);
    newDiv1.appendChild(newDiv2);
    newDiv4.appendChild(newDiv5);
    newDiv4.appendChild(newDiv6);
    newDiv4.appendChild(newDiv7);
    newDiv9.appendChild(newUl0);
    newDiv10.appendChild(newUl1);
    newDiv11.appendChild(newUl2);
    newDiv8.appendChild(newDiv9);
    newDiv8.appendChild(newDiv10);
    newDiv8.appendChild(newDiv11);
    newDiv0.appendChild(newDiv1);    
    newDiv0.appendChild(newDiv4);
    newDiv0.appendChild(newDiv8);
    frag.appendChild(newDiv0);
    container.appendChild(frag);
  
    Sortable.create(docEl("syn_" + i), { group: "qux", animation: 0, multiDrag: true, onEnd: function(evt) { prac_clearThisPreviewEl(evt); }, onAdd: function(evt) { prac_singleOrMultiDrop(evt); }});
    Sortable.create(docEl("gmr_" + i), { group: "qux", animation: 0, multiDrag: true, onEnd: function(evt) { prac_clearThisPreviewEl(evt); }, onAdd: function(evt) { prac_singleOrMultiDrop(evt); }});
    Sortable.create(docEl("col_" + i), { group: "qux", animation: 0, multiDrag: true, onEnd: function(evt) { prac_clearThisPreviewEl(evt); }, onAdd: function(evt) { prac_singleOrMultiDrop(evt); }});
    if (bool === true) { return i; }
}

function populateClssBucketsFromDbObj() {
    var clssNmes = appVoca.practiceArr.map(function(elem) { return elem.forClss; }).reduce( function(acc, val) { return acc.concat(val); },[] ).filter(function (el, idx, arr) { return arr.indexOf(el) === idx; });
    var refObjArr,
        i;

    clssNmes.forEach(function(elem) {
        refObjArr = appVoca.practiceArr.filter( function(el) { return el.forClss.indexOf(elem) !== -1;  });
        i = renderClssBucket(elem, true);

        refObjArr.forEach( function(el) {
            if (el.practiceTsk.indexOf("syn") !== -1) {
                populateUlForClssBucket(el, "syn", i);
            }
            if (el.practiceTsk.indexOf("gmr") !== -1) {
                populateUlForClssBucket(el, "gmr", i);
            }
            if (el.practiceTsk.indexOf("col") !== -1) {
                populateUlForClssBucket(el, "col", i);
            }
        });
    });
}

function populateUlForClssBucket(el, tsk, i) {
    var tgtUl = docEl("" + tsk + "_" + i);
    var uid,
        availFrom,
        availTo;

    if (tgtUl !== null) {
        uid = getUidFromTgtEn(el.en);

        if (uid !== undefined && appVoca.data[uid].allowTsk.indexOf(tsk) !== -1) { //always chk against allowTsk in appVoca.data!
            try {
                availFrom = new Date(el.availFrom).toISOString().substring(0, 10) || appVoca.settings.defaultNow;
                availTo = new Date(el.availTo).toISOString().substring(0, 10) || appVoca.settings.defaultFuture;
            } catch(e) {
                renderLiForPractice(tgtUl, uid, appVoca.settings.defaultNow, appVoca.settings.defaultFuture);
            }
            renderLiForPractice(tgtUl, uid, availFrom, availTo);
        }
    }
}

function getUidFromTgtEn(eng) {
    return (Object.keys(appVoca.data)).filter( function(el) { return appVoca.data[el].en === eng; })[0];
}

function renderLiForPractice(tgtUl, uid, availFrom, availTo) { //NOTE: tgtUl must be the ul element!
    if (tgtUl === null) { return; }
    var frag = document.createDocumentFragment();
    var newLi = document.createElement("LI");
    var newDiv = document.createElement("DIV");
    var newInput0 = document.createElement("INPUT");
    var newInput1 = document.createElement("INPUT");
    var newSpan0 = document.createElement("SPAN");
    var newTxtNd = document.createTextNode(appVoca.data[uid].en);
    var newSpan1;

    newLi.className = "category";
    newLi.dataset.uid = uid;
    newDiv.className = "pull-right";
    newInput0.type = "date";
    newInput0.value = availFrom;
    newInput1.type = "date";
    newInput1.value = availTo;
    newSpan0.className = "btn btn-xs btn-default pvR-btn";
    newSpan0.textContent = "X";

    newDiv.appendChild(newInput0);
    newDiv.appendChild(newInput1);
    newDiv.appendChild(newSpan0);
    newLi.appendChild(newTxtNd);

    if (appVoca.data[uid].book !== "0") {
        newSpan1 = document.createElement("SPAN");
        newSpan1.className = "encircled";
        newSpan1.textContent = appVoca.data[uid].book;
        newLi.className += " purplerain";
        newLi.appendChild(newSpan1);
    }
    newLi.appendChild(newDiv);
    frag.appendChild(newLi);
    tgtUl.appendChild(frag);
}

function getAllClssesInDOM() {
    var chldsArr = Array.from(docEl("classBuckets").children);
    var tskNmes = ["syn", "gmr", "col"];
    var tskArr = [];
    var i,
        clssEl,
        clssNme,
        tskData,
        liArr;

    chldsArr.forEach( function(el) {
        if (el.id !== undefined && el.id !== "") {
            i = (el.id).split("_")[1];
            tskData = [];
            clssEl = Array.from(el.querySelectorAll("input[type='text']"))[0];

            if (clssEl !== undefined) { 
                clssNme = clssEl.value || "";
            }
            if (clssNme !== "") {
                tskNmes.forEach( function(el) {
                    liArr = getValuesFromOneTskInDOM(el, i, clssNme);

                    if (liArr !== undefined && liArr.length) { 
                        liArr.forEach( function (elem) {
                            tskData.push(elem); 
                        });
                    }
                });
                tskArr.push(tskData);
            }            
        }
    });
    tskArr = tskArr.reduce( function(acc, val) { return acc.concat(val); },[] );
    return tskArr;
}

function getValuesFromOneTskInDOM(tsk, i, clssNme) { //once this works: hash 
    var tgtUl = docEl("" + tsk + "_" + i);
    var tskArr,
        tskSubArr,
        tskLiEls,
        tskAvailArr;

    if (tgtUl !== null) {
        tskLiEls = Array.from(tgtUl.querySelectorAll("li.category"));

        if (tskLiEls.length) {
            tskArr = [];
            tskLiEls.forEach( function(el) {
                tskSubArr = [el.dataset.uid];
                tskAvailArr = Array.from(el.querySelectorAll("input[type='date']"));

                if (tskAvailArr[0] !== undefined && tskAvailArr[1] !== undefined) {
                    try {
                        tskSubArr[1] = Date.parse(tskAvailArr[0].value) || appVoca.settings.defaultNow;
                        tskSubArr[2] = Date.parse(tskAvailArr[1].value) || appVoca.settings.defaultFuture;
                    } catch(e) {
                        tskSubArr[1] = appVoca.settings.defaultNow;
                        tskSubArr[2] = appVoca.settings.defaultFuture; 
                    }
                } else {
                    tskSubArr[1] = appVoca.settings.defaultNow;
                    tskSubArr[2] = appVoca.settings.defaultFuture;                
                }
                tskSubArr[3] = tsk;
                tskSubArr[4] = clssNme;
                //a DOM error sometimes caused by dragging elements -> a dup uid can get through and then its dates don't get parsed...
                //...we can't allow dup uid.s within the smae tsk && clss, so:
                if (tskSubArr[1].toString().length === 13 && tskSubArr[2].toString().length === 13) { 
                    tskArr.push(tskSubArr);
                }               
            });
        }
    }
    return tskArr;
}

function clearClssInDOM(i) {
    var bkt = docEl("bkt_" + i);
    var clssInput;

    if (bkt !== null) {
        clssInput = Array.from(bkt.querySelectorAll("input[type='text']"))[0];
        
        if (clssInput !== undefined) { //should exist!
            clssInput.value = "";
            clssInput.dataset.removed = "true";
        }
        disableClssInDOM(docEl("syn_" + i));
        disableClssInDOM(docEl("gmr_" + i));
        disableClssInDOM(docEl("col_" + i));
        hideEl("bkt_" + i);        
    }
}

function disableClssInDOM(tgtUl) {
    if (tgtUl !== null) {
        emptyContent(tgtUl);
        disableSortableInstanceOnActiveEl(tgtUl);
    }
}

function removeSingleLiFromOneTskInDOM(el) {
    var liEl = el.parentElement.parentElement;

    if (liEl.classList.contains("category")) {
        liEl.parentNode.removeChild(liEl);
        emptyContent(docEl("previewExamExmpl"));
        emptyContent(docEl("previewPracticeExmpl"));
        exitErrorInData();
    }
}

function switchForBucketBtns(elId) {
    var i = elId.split("_");

    switch(i[0]) {
        case "del": clearClssInDOM(i[1]); 
        break;
        case "clp": toggleCollapseClss(i[1]);
        break;
        default: return;
    }
}

function toggleCollapseClss(i) {
    var bkt = docEl("bkt_" + i);
    var bktChilds = Array.from(bkt.children);
    var clpEl;

    if (bkt !== null) {
        clpEl = docEl("clp_" + i);

        if (!clpEl.classList.contains("collapsed")) {
            clpEl.className += " collapsed";
        } else {
            clpEl.className = clpEl.className.replace(/(?:^|\s)collapsed(?!\S)/g, '');
        }
        bktChilds.forEach( function(el) {
            if (!el.classList.contains("pink2bg")) {
                if (el.classList.contains("nodisplay")) {
                    el.className = el.className.replace(/(?:^|\s)nodisplay(?!\S)/g, '');
                } else {
                    el.className += " nodisplay";
                }
            }
        });
    }
}

function updateLiElMovedFromFoo3(el, availFrom, availTo) {
    var frag = document.createDocumentFragment();
    var newDiv = document.createElement("DIV");
    var newInput0 = document.createElement("INPUT");
    var newInput1 = document.createElement("INPUT");
    var newSpan = document.createElement("SPAN");

    newDiv.className = "pull-right";
    newInput0.type = "date";
    newInput0.value = availFrom;
    newInput1.type = "date";
    newInput1.value = availTo;
    newSpan.className = "btn btn-xs btn-default pvR-btn";
    newSpan.textContent = "X";

    newDiv.appendChild(newInput0);
    newDiv.appendChild(newInput1);
    newDiv.appendChild(newSpan);
    frag.appendChild(newDiv);
    el.appendChild(frag);
}

function prac_singleOrMultiDrop(evt) {
    if (!evt.items.length) {
        prac_allowDropOrNo(evt, evt.item); //is a single element being dragged
        return;
    }
    evt.items.forEach( function(item) {
        prac_allowDropOrNo(evt, item);
    });
}

function prac_allowDropOrNo(evt, item) {
    prac_clearAllPreviewEls();

    if (prac_dropCondition(evt, item) === true) {
        var clone = item.cloneNode(true);

        if (evt.from.id === "foo3"){
            updateLiElMovedFromFoo3(item, appVoca.settings.defaultNow, appVoca.settings.defaultFuture);
            clone.className = clone.className.replace(/(?:^|\s)sortable-selected(?!\S)/g, '');
            evt.from.insertBefore(clone, evt.from.firstChild);
            return;
        }
        clone.className = clone.className.replace(/(?:^|\s)sortable-selected(?!\S)/g, '');
        evt.from.appendChild(clone);
        // evt.stopPropagation();
        return;
    } //else: failed the drop test
    prac_resetDroppedEl(item, evt.from);
    // evt.stopPropagation();
}

function prac_dropCondition(evt, item) { //disallow drop if bucket already contains the tgt word or is disallowed by allowTsk
    var tgtUl = docEl(evt.to.id);
    var liArr = (Array.from(tgtUl.querySelectorAll("li.category"))).filter( function (el) { return el.dataset.uid === item.dataset.uid; });
    var bool = true;

    if (liArr.length > 1) { bool = false; }
    if (appVoca.data[item.dataset.uid].allowTsk.indexOf(evt.to.dataset.task) === -1) { bool = false; }
    return bool;
}

function prac_resetDroppedEl(elItem, elFrom) {
    var elClone = elItem.cloneNode(true);

    elItem.parentElement.removeChild(elItem);     
    elFrom.appendChild(elClone);
    elClone.className = elClone.className.replace(/(?:^|\s)sortable-selected(?!\S)/g, '');

    if (elClone.classList.contains("previewSelected")) {
        elClone.className = elClone.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
    }
}

function prac_makeSortables() {
    Sortable.create(docEl("foo3"), { group: "qux", animation: 0, sort: false, multiDrag: false, onAdd: function(evt) { prac_resetDroppedEl(evt.item, evt.from); }});
}

function populateFoo4() {
    var dataObj = appVoca.texts;
    var dataKeys = Object.keys(dataObj);

    dataKeys.sort( function(a,b) { return (dataObj[a].ctx).localeCompare(dataObj[b].ctx); });
    dataKeys.forEach(function(elem) {
        createLiForFoo("foo4", elem, dataObj[elem].ctx.toLocaleUpperCase(), "0");
    });
}

function disableSortableInstanceOnActiveEl(el) {
    var tgtInstance = Sortable.get(el);

    tgtInstance.option("disabled", true);    
}

/*********************** init  *******************/

function initPractice() {
    populateFoo("foo3", appVoca.data);
    populateFoo4();
    populateClssBucketsFromDbObj();
    prac_calculateSettings();
    prac_makeSortables();
    prac_handlersOn();
    showEl("addNewClssBtn");
}

//orig.
function initApp() {
    getVocaFromDb();
}

//orig. MOD
function startApp() {
    showEl("screenButtons");
    //prac_
    getPracticeFromDb();
}

})();
});