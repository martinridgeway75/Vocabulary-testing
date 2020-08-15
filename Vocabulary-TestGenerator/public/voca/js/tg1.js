/* Copyright (C) 2019 Martin C. Ridgeway - You may use, distribute and modify this code under the terms of the MIT license */
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
    errorObjs: {},
    examObjs: {
        current: {},
        currentUids: {},
        previous: {}
    },
    pending: {
        userCreated: {},
        isSelected: {
            pending: false,
            exam: false
        },
        enCache: []
    },
    settings: {
        type: "",
        version: "",
        user: "",
        date: "",
        bookUnits: [],
        editMode: true,
        isMod: false,
        refresh: {
            uid: "",
            cat: ""
        }
    },
    data: {}, //{ allowTsk:[], book: "", en: "", exam: {}, practice: {} }
    texts: {} //{ ctx: "", tgts: [], exam: {}, practice: {} }
};

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

function handlersOn() {
    docEl('foo-filters').addEventListener('click', filterVoca, {capture: false, passive: true});
    docEl('canPreviewDiv').addEventListener('click', previewTsksFromLi, {capture: false, passive: true});
    docEl('bop').addEventListener('click', previewTsksFromLi, {capture: false, passive: true});
    docEl('foo2').addEventListener('click', identifyTsk5Li, {capture: false, passive: true});
    docEl('rTbar').addEventListener('click', identifyElForTskBoxSwitch, {capture: false, passive: true});
    docEl('rTbaz').addEventListener('click', identifyElForTskBoxSwitch, {capture: false, passive: true});
    docEl('rTurbaz').addEventListener('click', identifyElForTskBoxSwitch, {capture: false, passive: true});
    docEl('rTcolin').addEventListener('click', identifyElForTskBoxSwitch, {capture: false, passive: true});
    docEl('screenButtons').addEventListener('click', identifyScreenBtn, {capture: false, passive: true});
    docEl('reportError').addEventListener('click', reportErrorInData, {capture: false, passive: true});
    docEl('newVocaBtn').addEventListener('click', newWordRequest, {capture: false, passive: true});
    docEl('previousExamsContainer').addEventListener('click', identifyDeletePreviousTestEl, {capture: false, passive: true});
    docEl('logout').addEventListener('click', signOutOfApp, {capture: false, passive: true});
    docEl('cls-filters').addEventListener('click', filterByClss, {capture: false, passive: true});
}

function newReqHandlersOn() {
    docEl('newTargetWord').addEventListener('keyup', keyUpOnNewTargetWord, {capture: false, passive: true});
    docEl('nGmrTgt0').addEventListener('keyup', updatenGmrTgt0Drone, {capture: false, passive: true});
    docEl('nGmrTgt1').addEventListener('keyup', updatenGmrTgt1Drone, {capture: false, passive: true});
    docEl('nGmrTgt2').addEventListener('keyup', updatenGmrTgt2Drone, {capture: false, passive: true});
    docEl('colPos0').addEventListener('click', leaveColRight, {capture: false, passive: true});
    docEl('colPos1').addEventListener('click', pullColLeft, {capture: false, passive: true});
    docEl('awaitingBucket').addEventListener('click', identifyPendingListEl, {capture: false, passive: true});
    docEl('clearLoadedPendingWord').addEventListener('click', clearForNewPendingWord, {capture: false, passive: true});
    docEl("allColDistractors").addEventListener('click', viewColDistractors, {capture: false, passive: true});
    docEl("reqSectionAllCols").addEventListener('click', identifyColDisSelected, {capture: false, passive: true});
    docEl("loadSelectedColDis").addEventListener('click', loadSelectedColDistractors, {capture: false, passive: true});
    docEl("exitColDisDiv").addEventListener('click', exitColDistractors, {capture: false, passive: true});
}

function newReqHandlersOff() {
    docEl('newTargetWord').removeEventListener('keyup', keyUpOnNewTargetWord, {capture: false, passive: true});
    docEl('nGmrTgt0').removeEventListener('keyup', updatenGmrTgt0Drone, {capture: false, passive: true});
    docEl('nGmrTgt1').removeEventListener('keyup', updatenGmrTgt1Drone, {capture: false, passive: true});
    docEl('nGmrTgt2').removeEventListener('keyup', updatenGmrTgt2Drone, {capture: false, passive: true});
    docEl('colPos0').removeEventListener('click', leaveColRight, {capture: false, passive: true});
    docEl('colPos1').removeEventListener('click', pullColLeft, {capture: false, passive: true});
    docEl('awaitingBucket').removeEventListener('click', identifyPendingListEl, {capture: false, passive: true});
    docEl('clearLoadedPendingWord').removeEventListener('click', clearForNewPendingWord, {capture: false, passive: true});
    docEl("allColDistractors").removeEventListener('click', viewColDistractors, {capture: false, passive: true});
    docEl("reqSectionAllCols").removeEventListener('click', identifyColDisSelected, {capture: false, passive: true});
    docEl("loadSelectedColDis").removeEventListener('click', loadSelectedColDistractors, {capture: false, passive: true});
    docEl("exitColDisDiv").removeEventListener('click', exitColDistractors, {capture: false, passive: true});
}

function emptyContent(parentEl) {
    while (parentEl.hasChildNodes()) {
        while (parentEl.lastChild.hasChildNodes()) {
            parentEl.lastChild.removeChild(parentEl.lastChild.lastChild);
        }
        parentEl.removeChild(parentEl.lastChild);
    }
}

function shuffleArray(arr) {
    var crtIdx = arr.length; 
    var tmpVal,
        rndIdx;

    while ( 0 !== crtIdx ) {
        rndIdx = Math.floor( Math.random() * crtIdx );
        crtIdx -= 1;
        tmpVal = arr[crtIdx];
        arr[crtIdx] = arr[rndIdx];
        arr[rndIdx] = tmpVal;
    }                   
    return arr;
}

function uniqueValuesFromArray(anArr) {
    return anArr.filter( function(el, idx, arr){ return arr.indexOf(el) === idx; });
}

function hideEl(elId) {
    if (!docEl(elId).classList.contains('nodisplay')) {
        docEl(elId).className += ' nodisplay';
    }
}

function showEl(elId) {
    docEl(elId).className = docEl(elId).className.replace(/(?:^|\s)nodisplay(?!\S)/g, '');
}

// function isEmptyObj(obj) {
//     if (obj === null) {
//         return true;
//     } else if (typeof obj !== "object") {
//         return true;
//     } else {
//         return Object.keys(obj).length === 0; //true if obj is empty, false if has prop.s
//     }
// }

function isNormalInteger(str) {
    var test = {};
    var val;

    test.val = val;
    test.bool = false;
    str = str.trim();

    if (!str) {
        return test;
    } else {
        str = str.replace(/^0+/, "") || "0";
        val = Math.floor(Number(str));
        
        if (String(val) === str && val > 0) {
            test.val = (val).toString();
            test.bool = true;
        }}
    return test;
}

function capitalizeUserName(str) {
    return str.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

/********************************* user reporting error in data  **************************************/

function exitErrorInData() {    
    hideEl("errorFbk");
    hideEl("errorFbkCancel");
    docEl("errorFbk").value = "";
    docEl("reportError").textContent = "Report error";    
    return;
}

function reportErrorInData() {
    var errorObj = {};
    var reportedEl1To4 = Array.from(docEl("canPreviewDiv").querySelectorAll("li.previewSelected"));
    var reportedEl5 = Array.from(docEl("bop").querySelectorAll("li.previewSelected"));
    var refUid;

    if (reportedEl1To4.length) {
        refUid = reportedEl1To4[0];
        errorObj.task = refUid.parentElement.dataset.task || "unknown";
    } else if (reportedEl5.length) {
        refUid = reportedEl5[0];
        errorObj.task = "tsk5";
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

/********************************* populate vocabulary lists  **************************************/

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

function dropCondition(evt) {
    return appVoca.data[evt.item.dataset.uid].allowTsk.indexOf(evt.to.dataset.task) !== -1;
}

function resetDroppedEl(elItem, elFrom) {
    var elClone = elItem.cloneNode(true);

    elItem.parentElement.removeChild(elItem);     
    elFrom.appendChild(elClone);

    if (elClone.classList.contains("previewSelected")) {
        elClone.className = elClone.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');    
    }
}

function allowDropOrNo(evt) {
    if (dropCondition(evt) !== true) { 
        resetDroppedEl(evt.item, evt.from);
    }
    evt.stopPropagation();
}

function makeSortables() {
    Sortable.create(docEl("foo"), { group: "omega", animation: 0, sort: false, multiDrag: false });
    Sortable.create(docEl("bar"), { group: "omega", animation: 0, onEnd: function(evt) { clearThisPreviewEl(evt); }, onAdd: function(evt) { allowDropOrNo(evt); }});
    Sortable.create(docEl("baz"), { group: "omega", animation: 0, onEnd: function(evt) { clearThisPreviewEl(evt); }, onAdd: function(evt) { allowDropOrNo(evt); }});
    Sortable.create(docEl("baz2"), { group: "omega", animation: 0, onEnd: function(evt) { clearThisPreviewEl(evt); }, onAdd: function(evt) { allowDropOrNo(evt); }});
    Sortable.create(docEl("urbaz"), { group: "omega", animation: 0, onEnd: function(evt) { clearThisPreviewEl(evt); }, onAdd: function(evt) { allowDropOrNo(evt); }});
    Sortable.create(docEl("colin"), { group: "omega", animation: 0, onEnd: function(evt) { clearThisPreviewEl(evt); }, onAdd: function(evt) { allowDropOrNo(evt); }});
    Sortable.create(docEl("foo2"), { group: "alpha", animation: 0, sort: false, multiDrag: false });
    Sortable.create(docEl("bop"), { group: "alpha", animation: 0, onEnd: function(evt) { clearThisPreviewEl(evt); } });
}

/********************************* setup  **************************************/

function setExamDate() {
    var today = new Date();
    var month = today.getUTCMonth();
    
    if (month <= 5 ) {
        appVoca.settings.date = "Spring " + today.getUTCFullYear();
        return;
    }
    appVoca.settings.date = "Fall " + today.getUTCFullYear();
}

function populateFooFilters() {
    var container = docEl("foo-filters");
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

function setBookFilters() {
    var dataKeys = Object.keys(appVoca.data);

    appVoca.settings.bookUnits = dataKeys.map( function(el) { return appVoca.data[el].book; }).filter( function(el, idx, arr){ return arr.indexOf(el) === idx && el !== undefined && el !== "" && el !== "0"; });
    appVoca.settings.bookUnits.sort( function(a,b) { return a - b; });
    populateFooFilters();
}

function calculateSettings() {
    setExamDate();
    setBookFilters();
}

/********************************* filter foo elements by checked book units  **************************************/

function getRelevantElsForFooFilter(els, book) {
    if (book === "0") {
        return els.filter( function(el){ return !el.classList.contains("purplerain"); }); //therefore not in book
    }
    return els.filter( function(el){ return el.classList.contains("purplerain") && appVoca.data[el.dataset.uid].book === book; });
}

function filterVoca() {
    var els = Array.from((docEl("foo")).querySelectorAll("li.category"));
    var chkArr = getChkBoxForVoca();
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

function getChkBoxForVoca() {
    var els = Array.from((docEl("foo-filters")).querySelectorAll('input[type="checkbox"]'));

    return els.filter( function(el) { return el.dataset.book !== undefined && el.checked === true; }).map( function(elem) { return elem.dataset.book; });
}

/*********************** preview example on exam  *******************/

function previewTsksFromLi(el) {
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "LI" && el.target.dataset.uid !== undefined) {
            triggerPreviewEx(el.target);
        } else if (el.target.nodeName === "SPAN" && el.target.parentElement.dataset.uid !== undefined) {
            triggerPreviewEx(el.target.parentElement);
        }
        el.stopPropagation();
    }
}

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

function renderTsk5PreviewExamExmpl(uid) {
    var textTxt = appVoca.texts[uid].exam.txt;
    var container = docEl("previewExamExmpl");
    var frag = document.createDocumentFragment();
    var newDiv0 = document.createElement("DIV");

    emptyContent(container);

    newDiv0.textContent = textTxt;
    frag.appendChild(newDiv0);
    container.appendChild(frag);
}

function renderTsk5PreviewPracticeExmpl(uid) {
    var txtPrt1 = appVoca.texts[uid].practice.txtPrt1;
    var txtPrt2 = appVoca.texts[uid].practice.txtPrt2;
    var container = docEl("previewPracticeExmpl");
    var frag = document.createDocumentFragment();
    var newLbl0 = document.createElement("LABEL");
    var newLbl1 = document.createElement("LABEL");
    var newTxtEl0 = document.createTextNode(txtPrt1);
    var newTxtEl1 = document.createTextNode(txtPrt2);
    var newBr = document.createElement("BR");

    emptyContent(container);

    newLbl0.className = "label label-xs label-color777";
    newLbl0.textContent = "Practice";
    newLbl1.className = "label label-xs label-color777";
    newLbl1.textContent = "Practice";

    frag.appendChild(newLbl0);
    frag.appendChild(newTxtEl0);
    frag.appendChild(newBr);
    frag.appendChild(newLbl1);
    frag.appendChild(newTxtEl1);
    container.appendChild(frag);
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

function clearThisPreviewEl(evt) {
    if (evt.item.classList.contains("previewSelected")) {
        evt.item.className = evt.item.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
        emptyContent(docEl("previewExamExmpl"));
        emptyContent(docEl("previewPracticeExmpl"));
        exitErrorInData();
    }
    evt.stopPropagation();
}

function clearAllPreviewEls() {
    var els = Array.from((docEl("tsks1To4Divs")).querySelectorAll("li.category.previewSelected"));
    var t5Els = Array.from((docEl("tsk5Divs")).querySelectorAll("li.category.previewSelected"));

    els.forEach( function(el) {
        el.className = el.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
    });
    t5Els.forEach( function(el) {
        el.className = el.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
    });
    emptyContent(docEl("previewExamExmpl"));
    emptyContent(docEl("previewPracticeExmpl"));
    exitErrorInData();
}

function triggerPreviewEx(el) { //from LI only
    var uid = el.dataset.uid;
    var task = el.parentElement.dataset.task;
    var isTsk1 = (el.parentElement.id === "bar");
    var isTsk5 = (el.parentElement.id === "bop");
    var bool = el.classList.contains("previewSelected");

    clearAllPreviewEls();

    if (uid === undefined || (!isTsk5 && (task === undefined || !appVoca.data[uid].exam.hasOwnProperty(task)))) {
        return;
    }
    if (bool) {
        el.className = el.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
    } else {
        el.className += " previewSelected";

        if (isTsk5 !== true) {
            createTsk1To4PreviewRenderObj(uid, task, isTsk1, "exam");
            createTsk1To4PreviewRenderObj(uid, task, isTsk1, "practice");
        } else {
            triggerTsk5Borders(el); //identifyTsk5Li(el) conflicted with previewTsksFromLi(el) because of stopPropagation()...moved handler to "foo2" && added: "bop" here
            renderTsk5PreviewExamExmpl(uid);
            renderTsk5PreviewPracticeExmpl(uid);
        }
    }
}

/*********************** highlight elements that are part of task 5 (#foo2 && #bop)  *******************/

function identifyTsk5Li(el) { //to avoid stopPropagation(), added to "foo2" here, && added triggerTsk5Borders() in: triggerPreviewEx() to "bop"
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "LI" && el.target.dataset.uid !== undefined) {
            triggerTsk5Borders(el.target);
        } else if (el.target.nodeName === "SPAN" && el.target.parentElement.dataset.uid !== undefined) {
            triggerTsk5Borders(el.target.parentElement);
        }
        el.stopPropagation();
    }
}
    
function triggerTsk5Borders(elTgt) {
    var t5tgtsArr = appVoca.texts[elTgt.dataset.uid].tgts || [];

    clearAllTsk5Borders();
    highlightTsk5VocaInTsks1To4(t5tgtsArr);
    if (!elTgt.classList.contains("purpleborder")) {
        elTgt.className += " purpleborder";
    }
}    

function clearAllTsk5Borders() {
    var els = Array.from((docEl("fullVocaLists")).querySelectorAll("li.category.purpleborder"));
    
    els.forEach( function(el) {
        el.className = el.className.replace(/(?:^|\s)purpleborder(?!\S)/g, '');
    });
}

function highlightTsk5VocaInTsks1To4(tsk5tgtsArr) {
    var els1To4Arr = Array.from((docEl("tsks1To4Divs")).querySelectorAll("li.category"));
    var idx;
    
    els1To4Arr.forEach( function(el) {
        idx = tsk5tgtsArr.indexOf(appVoca.data[el.dataset.uid].en);

        if (idx !== -1) {
            el.className += " purpleborder";
        }
    });
}

/*********************** randomize order of Li.s in taskBoxes  *******************/

function reOrderTskBox(elId) {
    var container = docEl(elId);
    var els = Array.from(container.querySelectorAll("li.category"));
    var elsArrClone = [];
    var elClone;

    if (els.length <= 1) {
        return;
    }
    els.forEach( function(el) {
        elClone = el.cloneNode(true);
        elsArrClone.push(elClone);
    });
    shuffleArray(elsArrClone);
    emptyContent(container);

    elsArrClone.forEach( function(el) {
        container.appendChild(el);
    });
}

function reOrderTskBox2() { 
    reOrderTskBox("baz"); 
    reOrderTskBox("baz2");
}

function switchForReOrderTskBox(elId) {
    switch(elId) {
        case "rTbar": reOrderTskBox("bar");
        break;
        case "rTbaz": reOrderTskBox2();
        break;
        case "rTurbaz":reOrderTskBox("urbaz");
        break;
        case "rTcolin":reOrderTskBox("colin");
        break;
        default: return;
    }    
}

function identifyElForTskBoxSwitch(el) {
        if (el.target.nodeName === "BUTTON") {
            switchForReOrderTskBox(el.target.id);
        }
        el.stopPropagation();
}

/********************************* toggle between screens w/ menu buttons **************************************/

function identifyScreenBtn(el) {
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "A" && el.target.dataset.func !== undefined) {
            switchForToggleScreenBtns(el.target.dataset.func);
        }
        el.stopPropagation();
    }
}

function switchForToggleScreenBtns(func) {
    switch(func) {
        case "gen": chkUserDefForErrors();
        break;
        case "prv": showPreviousTests();
        break;
        case "edt": clickToggleBetweenEditScreens();
        break;
        case "dwl": initSaveAndDownload();
        break;
        case "loa": identifyCheckedPreviousTest();
        break;
        case "exi": clickToggleBetweenEditScreens();
        break;
        case "udp": createOrUpdateNewPendingObj();
        break;
        case "exp": leaveRequestScreen();
        break;
        default: return;
    }
}

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

function clickToggleBetweenEditScreens() {
    var btnObj = {a0: {func: "gen", txt: "GENERATE"}, a1: {func: "prv", txt: "PREVIOUS TESTS"}};

    appVoca.settings.editMode = true;
    toggleBetweenScreens(btnObj);
}

function toggleBetweenScreens(btnObj) {
    var func = btnObj.a0.func;

    hideAllContainers();
    repopulateMenu(btnObj);

    if (func === "gen") { showEl("fullVocaLists"); return; }
    if (func === "dwl") { showEl("fullLayout"); return; }
    if (func === "exp") { showEl("fullRequest"); return; }
    if (func === "exi") { showEl("fullPrevious"); }
}

function hideAllContainers() {
    hideEl("fullRequest");
    hideEl("fullPrevious");
    hideEl("fullVocaLists");
    hideEl("fullLayout");
}

/********************************* get content defined by user **************************************/

function chkUserDefForErrors() {
    var test1 = getTypeOfExam();
    var test2 = getVersionOfExam();

    if (test1 === false || test2 === false ) {
        return;
    }
    chkLiChoices1To4ForUserErrors();
}

function setUserDef(chkObj) {
    var chkObjKeys = Object.keys(chkObj);
    var tskKeys = ["tsk1","tsk2a","tsk2b","tsk3","tsk4", "tsk5"];
    var btnObj,
        newKey;

    chkObjKeys.forEach( function(oldKey, i) {
        newKey = tskKeys[i];

        if (oldKey !== newKey) {
            Object.defineProperty(chkObj, newKey, Object.getOwnPropertyDescriptor(chkObj, oldKey));
            delete chkObj[oldKey];
        }
    });
    renderMainExamPreview(chkObj);
    btnObj = {a0: {func: "dwl", txt: "DOWNLOAD"}, a1: {func: "edt", txt: "EDIT"}};
    appVoca.settings.editMode = false;
    toggleBetweenScreens(btnObj);
}

function getUidsOfChildLiNodes(elId) {
    var ndLst = Array.from(docEl(elId).querySelectorAll("li.category"));

    return ndLst.map( function(el) { return el.dataset.uid; }).filter( function(elem) { return elem !== undefined; });
}

function showUserChoiceErrors(num, allowed) {
    var txt;

    if (num === false) {
        txt = "Please check that each task contains the required number of words!";
    } else if (allowed === false) {
            txt = "You are attempting to assign some words that are disallowed!";
    } else {
        return;
    }
    window.mscAlert({ title: "", subtitle: txt });
    return;
}

function chkLiChoices5ForUserErrors(chkObj) {
    var tsks1To4Containers = Object.keys(chkObj);
    var num = true;
    var allowed = true;
    var tsk5,
        eng;

    chkObj.bop = getUidsOfChildLiNodes("bop");

    if (chkObj.bop.length !== 1) {
        showUserChoiceErrors(false, allowed);
        return;
    }
    tsk5 = appVoca.texts[chkObj.bop[0]].tgts;

    tsks1To4Containers.forEach( function (el) {
        chkObj[el].forEach( function (elem) {
            eng = appVoca.data[elem].en;

            if (tsk5.indexOf(eng) !== -1) {
                allowed = false;
            }
        });
    });

    if (/*num === false ||*/ allowed === false) {
        showUserChoiceErrors(num, allowed);
        return;
    }
    setUserDef(chkObj);
}

function getLiChoices1To4(containers) {
    var chkObj = {};

    containers.forEach( function (el) {
        chkObj[el] = getUidsOfChildLiNodes(el);
    });
    return chkObj;
}

function getVersionOfExam() {
    var test = isNormalInteger(docEl("examVersion").value);

    if (test.bool === false) {
        appVoca.settings.version = "";
        window.mscAlert({ title: "", subtitle: "Please select a number for the test version!" });
    } else {
        appVoca.settings.version = test.val;
    }
    return test.bool;
}

function getTypeOfExam() {
    var test = docEl("examType").options[docEl("examType").selectedIndex].value;

    if (test === "0") {
        appVoca.settings.type = "";
        window.mscAlert({ title: "", subtitle: "Please choose whether the test is for MIDTERM or FINAL!" });
        return false;
    }
    appVoca.settings.type = test;
    return true;
}

function chkLiChoices1To4ForUserErrors() {
    var containers = ["bar", "baz", "baz2", "urbaz", "colin"];
    var chkObj = getLiChoices1To4(containers);
    var num = true;
    var allowed = true;
    var task,
        len;

    containers.forEach( function (el) { 
        len = chkObj[el].length;
        
        if (el !== "baz" && el !== "baz2") {
            if (len !== 8) {
                num = false;
            }
        } else if (el !== "baz" || el !== "baz2") {
            if (len !== 4) {
                num = false;                
            }
        }
    });

    containers.forEach( function (el) {   
        chkObj[el].forEach( function (idx) {
            task = docEl(el).dataset.task;

            if (appVoca.data[idx].allowTsk.indexOf(task) === -1) {
                allowed = false;
            }
        });
    });

    if (num === false || allowed === false) {
        showUserChoiceErrors(num, allowed);
        return;
    }
    chkLiChoices5ForUserErrors(chkObj);
}

/*********************** build main preview screen  *******************/

function mapColDistractors(refObj) {
    var optsObj = {};
    
    optsObj.a = refObj.dis1 + " | " + refObj.dis2 + " | " + refObj.ans1;
    optsObj.b = refObj.ans2 + " | " + refObj.ans3 + " | " + refObj.dis3;
    optsObj.c = refObj.dis3 + " | " + refObj.dis1 + " | " + refObj.dis2;
    optsObj.d = refObj.ans1 + " | " + refObj.ans2 + " | " + refObj.ans3;
    return optsObj;
}

function mapEachTskObj1To4ForExamRender(num, type, el, tsk) {
    var refObj = appVoca.data[el].exam[type];
    var qObj = {};
    var optKeys = ["a", "b", "c", "d"];
    var tempOpts = [];
    var colOpts,
        tempAns;

    qObj.qnum = num;
    qObj.qtgt = appVoca.data[el].en;
    qObj.qb4 = refObj.b4;
    qObj.qaf = refObj.af;

    if (tsk === "tsk2a" || tsk === "tsk2b") {
        qObj.qtgt = "_____";
        qObj.ans = appVoca.data[el].en; // !opts {} for task 2
    } else {
        qObj.opts = {};

        if (tsk === "tsk1") {
            tempOpts[0] = refObj.dis1;
            tempOpts[1] = refObj.dis2;
            tempOpts[2] = refObj.dis3;
            tempOpts[3] = refObj.ans;
        }
        if (tsk === "tsk3") {
            qObj.qtgt = "_____";
            tempOpts[0] = refObj.dis1;
            tempOpts[1] = refObj.dis2;
            tempOpts[2] = appVoca.data[el].en;
            tempOpts[3] = refObj.ans;
        } 
        if (tsk === "tsk4") { 
            qObj.qb4 = "";
            qObj.qaf = "";
            qObj["q" + refObj.pos] = "_____";
            colOpts = mapColDistractors(refObj);
            tempOpts[0] = colOpts.a;
            tempOpts[1] = colOpts.b;
            tempOpts[2] = colOpts.c;
            tempOpts[3] = colOpts.d;
        }
        tempAns = "" + tempOpts[3];

        shuffleArray(tempOpts);

        qObj.opts.a = tempOpts[0];
        qObj.opts.b = tempOpts[1];
        qObj.opts.c = tempOpts[2];
        qObj.opts.d = tempOpts[3];
        qObj.ans = optKeys[tempOpts.indexOf(tempAns)];
    }
    return qObj;
}

function mapArrOfTskObjs1To4ForExamRender(objRef, tsk, type, numStart) {
    var num = numStart;
    var qArr = [];
    var qObj;
    
    objRef[tsk].forEach( function(el) { //el = the appVoca.data record id
        num++;
        qObj = mapEachTskObj1To4ForExamRender(num, type, el, tsk);
        qArr.push(qObj);
    });
    return qArr;
}

function mapTsk2AnsPosWithinExamObj(prop) {
    var refObj = appVoca.examObjs.current[prop];
    var tempArr = [];
    var boxObj = {};
    var optKeys = ["a", "b", "c", "d"];

    tempArr = refObj.qstns.map( function(el) { return el.ans; });

    shuffleArray(tempArr);

    boxObj.a = tempArr[0];
    boxObj.b = tempArr[1];
    boxObj.c = tempArr[2];
    boxObj.d = tempArr[3];

    refObj.qstns.forEach( function(el) {
        el.ansPos = "" + optKeys[tempArr.indexOf(el.ans)];
    });
    refObj.box = boxObj;
}

function mapTskObj5ForExamRender(objRef, numStart) {
    var refObj = appVoca.texts[objRef.tsk5[0]].exam;
    var optQstns = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];
    var optKeys = ["a", "b", "c", "d"];
    var num = numStart;
    var tempOpts = [];
    var qObj = {};
    var tempAns,
        optsObj;

    qObj.box = refObj.txt;
    qObj.qstns = [];

    optQstns.forEach( function(el) {
        num++;
        optsObj = {};
        optsObj.qnum = num;
        optsObj.qb4 = refObj[el].qstn;
        tempOpts[0] = refObj[el].dis1;
        tempOpts[1] = refObj[el].dis2;
        tempOpts[2] = refObj[el].dis3;
        tempOpts[3] = refObj[el].ans;
        tempAns = "" + tempOpts[3];

        shuffleArray(tempOpts);

        optsObj.opts = {};
        optsObj.opts.a = tempOpts[0];
        optsObj.opts.b = tempOpts[1];
        optsObj.opts.c = tempOpts[2];
        optsObj.opts.d = tempOpts[3];
        optsObj.ans = optKeys[tempOpts.indexOf(tempAns)];
        qObj.qstns.push(optsObj);
    });
    return qObj;
}

function clearRenderedExamPreview() {
    var arr = ["rendertsk1", "rendertsk2a", "rendertsk2b", "rendertsk3", "rendertsk4", "rendertsk5", "task2aOptBox", "task2bOptBox", "task5OptBox"];
    var len = arr.length;
    var i;

    for (i = 0; i < len; i++) {
        emptyContent(docEl(arr[i]));
    }
    // emptyContent(docEl("rendertsk1"));
    // emptyContent(docEl("rendertsk2a"));
    // emptyContent(docEl("rendertsk2b"));
    // emptyContent(docEl("rendertsk3"));
    // emptyContent(docEl("rendertsk4"));
    // emptyContent(docEl("rendertsk5"));
    // emptyContent(docEl("task2aOptBox"));
    // emptyContent(docEl("task2bOptBox"));
    // emptyContent(docEl("task5OptBox"));
}

function renderMainExamPreview(chkObj) {
    appVoca.examObjs.current = {};
    appVoca.examObjs.currentUids = {};
    appVoca.examObjs.currentUids = chkObj;
    appVoca.examObjs.current.tsk1 = mapArrOfTskObjs1To4ForExamRender(appVoca.examObjs.currentUids, "tsk1", "syn", 0);    
    appVoca.examObjs.current.tsk2a = {};
    appVoca.examObjs.current.tsk2a.qstns = mapArrOfTskObjs1To4ForExamRender(appVoca.examObjs.currentUids, "tsk2a", "syn", 8);
    appVoca.examObjs.current.tsk2b = {};
    appVoca.examObjs.current.tsk2b.qstns = mapArrOfTskObjs1To4ForExamRender(appVoca.examObjs.currentUids, "tsk2b", "syn", 12);
    appVoca.examObjs.current.tsk3 = mapArrOfTskObjs1To4ForExamRender(appVoca.examObjs.currentUids, "tsk3", "gmr", 16);
    appVoca.examObjs.current.tsk4 = mapArrOfTskObjs1To4ForExamRender(appVoca.examObjs.currentUids, "tsk4", "col", 24);
    appVoca.examObjs.current.tsk5 = mapTskObj5ForExamRender(appVoca.examObjs.currentUids, 32);
    mapTsk2AnsPosWithinExamObj("tsk2a");
    mapTsk2AnsPosWithinExamObj("tsk2b");

    clearRenderedExamPreview();

    renderDOMForExamPreview("tsk1", true, false);
    renderDOMForExamPreview("tsk2a", true, true);
    renderDOMForExamPreview("tsk2b", true, true);
    renderDOMForExamPreview("tsk3", true, false);
    renderDOMForExamPreview("tsk4", false, false);
    fragTsk2Box(appVoca.examObjs.current.tsk2a.box, "task2aOptBox");
    fragTsk2Box(appVoca.examObjs.current.tsk2b.box, "task2bOptBox");
    fragBuild5AndAttach();
}

function fragBuild5AndAttach() {
    var container = docEl("rendertsk5");
    var frag;

    appVoca.examObjs.current.tsk5.qstns.forEach( function(el) {
        frag = fragQWithFourOpts(el, false, "tsk5");
        container.appendChild(frag);
    });
    docEl("task5OptBox").textContent = appVoca.examObjs.current.tsk5.box;
}

function fragBuildAndAttach(task, qObj, optInline, isTsk2) {
    var elId = "render" + task;
    var container = docEl(elId);
    var frag;

    if (isTsk2 === false) {
        frag = fragQWithFourOpts(qObj, optInline, task);
    } else {
        frag = fragQWithNoOpts(qObj, task);
    }
    container.appendChild(frag);
}

function renderDOMForExamPreview(task, bool1, bool2) {
    var tskObj;

    if(bool2 === true) {
        tskObj = appVoca.examObjs.current[task].qstns;
    } else {
        tskObj = appVoca.examObjs.current[task];
    }
    tskObj.forEach( function(el) {
        fragBuildAndAttach(task, el, bool1, bool2);
    });
}

function fragTsk2Box(boxObj, ctnr) {
    var container = docEl(ctnr);
    var frag = document.createDocumentFragment();
    var span0 = document.createElement("SPAN");
    var span1 = document.createElement("SPAN");
    var span2 = document.createElement("SPAN");
    var span3 = document.createElement("SPAN");

    span0.textContent = "(a.) " + boxObj.a;
    span1.textContent = "(b.) " + boxObj.b;
    span2.textContent = "(c.) " + boxObj.c;
    span3.textContent = "(d.) " + boxObj.d;

    frag.appendChild(span0);
    frag.appendChild(span1);
    frag.appendChild(span2);
    frag.appendChild(span3);
    container.appendChild(frag);
}

function fragQWithFourOpts(qObj, bool, task) { //true: opts 4 x 1, false: opts 2 x 2
    var frag = document.createDocumentFragment();
    var div0 = document.createElement("DIV");
    var div1 = document.createElement("DIV");
    var div2 = document.createElement("DIV");
    var div3 = document.createElement("DIV");
    var div4 = document.createElement("DIV");
    var span0 = document.createElement("SPAN");
    var span1 = document.createElement("SPAN");
    var span2 = document.createElement("SPAN");
    var span3 = document.createElement("SPAN");
    var span4 = document.createElement("SPAN");
    var div3a,
        newSpanU,
        newTxtNd0,
        newTxtNd1;
    
    div0.className = "row";
    div1.className = "col-lg-12 expand padB6";
    div2.className = "expand";

    if (task === "tsk1") {
        newSpanU = document.createElement("SPAN");
        newTxtNd0 = document.createTextNode(qObj.qnum + ". " + qObj.qb4 + " ");
        newTxtNd1 = document.createTextNode(" " + qObj.qaf);
        newSpanU.textContent = qObj.qtgt;
        newSpanU.style.textDecoration = "underline";
        
        div2.appendChild(newTxtNd0);
        div2.appendChild(newSpanU);
        div2.appendChild(newTxtNd1);
    } else {
        div2.textContent = qObj.qnum + ". " + qObj.qb4;
        if (task !== "tsk5") {
            div2.textContent += " " + qObj.qtgt + " " + qObj.qaf;
        }
    }    
    div3.className = "answeroptions";
    div4.className ="answergrid";
    div4.textContent = qObj.qnum + ". ";
    span0.textContent = "a. " + qObj.opts.a;
    span1.textContent = "b. " + qObj.opts.b;
    span2.textContent = "c. " + qObj.opts.c;
    span3.textContent = "d. " + qObj.opts.d;
    span4.className = "answerkey hidden-print";
    span4.textContent = qObj.ans;

    if (bool === false) {
        div3a = document.createElement("DIV");
        div3a.className = "answeroptions";
    } else {
        div3.className += " pull-left";
    }   
    div3.appendChild(span0);
    div3.appendChild(span1);

    if (bool === false) {
        div3a.appendChild(span2);
        div3a.appendChild(span3);
    } else {
        div3.appendChild(span2);
        div3.appendChild(span3);
    }
    div4.appendChild(span4);
    div1.appendChild(div2);
    div1.appendChild(div3);

    if (bool === false) {
        div1.appendChild(div3a);
    }
    div1.appendChild(div4);
    div0.appendChild(div1);
    frag.appendChild(div0);
    return frag;
}

function fragQWithNoOpts(qObj) { //only tsk2a && tsk2b
    var frag = document.createDocumentFragment();
    var div0 = document.createElement("DIV");
    var div1 = document.createElement("DIV");
    var div2 = document.createElement("DIV");
    var div3 = document.createElement("DIV");
    var span0 = document.createElement("SPAN");

    div0.className = "row";
    div1.className = "col-lg-12 expand";
    div2.className = "pull-left expand padB16";
    div2.textContent = qObj.qnum + ". " + qObj.qb4 + " " + qObj.qtgt + " " + qObj.qaf;
    div3.className = "answergrid";
    div3.textContent = qObj.qnum + ". ";    
    span0.className = "answerkey hidden-print";
    span0.textContent = qObj.ansPos;
    
    div3.appendChild(span0);
    div1.appendChild(div2);
    div1.appendChild(div3);
    div0.appendChild(div1);
    frag.appendChild(div0);
    return frag;
}

/*********************** pdf.s and zip download  *******************/

function pdfMakePromise(dwnldObjContent) {
    var pdfDocGenerator = pdfMake.createPdf(dwnldObjContent);

    return new window.Promise(function(resolve) {
        pdfDocGenerator.getBase64(function (pdfBase64) {
            resolve(pdfBase64);
        });
    });
}

function pdfObjPromise(dwnldObj) {
    return new window.Promise(function(resolve) {
        pdfMakePromise(dwnldObj.content).then(function(result) {
            dwnldObj.content = {};
            dwnldObj.content.base64 = result;
            resolve(dwnldObj);
        });
    });  
}
    
function toAddToZip(pdfObjArr) {
    var allPromises = [];
    
    pdfObjArr.forEach( function(pdfObj) {
        allPromises.push(pdfObjPromise(pdfObj));        
    });    
    window.Promise.all(allPromises).then(function(resolvedArr) {
        makeZipDownloadAndSave(resolvedArr);
    });
}
 
function downloadSuccessful() {
    var btnObj = {a0: {func: "gen", txt: "GENERATE"}, a1: {func: "prv", txt: "PREVIOUS TESTS"}};

    appVoca.settings.editMode = true;
    toggleBetweenScreens(btnObj);
}

function makeZipDownloadAndSave(resolvedArr) {
    var zip = new JSZip();
    var zipName = getFileName(appVoca.settings.user, appVoca.settings.type, appVoca.settings.version, "zip");
    var translations = makeTranslationsCsv();

    resolvedArr.forEach( function(pdfObj) {
        zip.file(pdfObj.name, pdfObj.content.base64, {base64:true, mimeType:"application/pdf"});
    });
    zip.file("PE4_Translations.csv", translations, {mimeType:"text/csv"});
    zip.generateAsync({type:"blob"}).then(function(data){
        downloadSuccessful();
        window.saveAs(data, zipName);
    });
}

function getFileName(user, type, version, ext) {
    return "" + user + "_PE4_VOCA_" + type + "_v" + version + "_" + (appVoca.settings.date).replace(' ', '') + "." + ext;
}

function initSaveAndDownload() {
    var test1 = getTypeOfExam();
    var test2 = getVersionOfExam();

    if (test1 === false || test2 === false || appVoca.settings.editMode === true) { //user subverts display
        return;
    }
    saveAsNewPreviousTest();
    doZipDownload();
}

function doZipDownload() {
    var pdfObjArr = [];
    var pdfObjExam = {};
    var pdfObjMock = {};

    try {
        pdfObjExam.content = buildExamDocDefinition();
        pdfObjExam.name = getFileName(appVoca.settings.user, appVoca.settings.type, appVoca.settings.version, "pdf");
        pdfObjMock.content = buildMockTestDocDefinition();
        pdfObjMock.name = getFileName(appVoca.settings.user, "PracticeTests", appVoca.settings.version, "pdf");
    } catch(e) {
        window.mscAlert({ title: "", subtitle: "There was an internal error. The test cannot be rendered.\n" + e });
        return;
    }
    pdfObjArr.push(pdfObjExam);
    pdfObjArr.push(pdfObjMock);

    if (pdfObjArr.length === 2) {
        toAddToZip(pdfObjArr);
    }
}

/*********************** pdf document definition: EXAM *******************/

function examDocDefShell() {
    var docDefShell = {
        pageSize: "B4",
        pageOrientation: "landscape",
        pageMargins: [ 20, 20, 10, 20 ],
        content: [ { columns: [ [], [] ] }, { pageBreak: "before", columns: [ [], [] ] } ],
        styles: { 
            qstnTbl: { margin: [ 0, 0, 0, 0 ], fontSize: 12 },
            t5nestedTbl: { margin: [ 4, -5, 0, 0 ], fontSize: 10 },
            nestedTable: { margin: [ 8, -5, 0, 0 ], fontSize: 11 }, 
            header: { fontSize: 14, margin: [ 4, 0, 0, 0 ] },
            subheader: { fontSize: 12, margin: [ 5, 0, 0, 10 ] },
            defaultStyle: { columnGap: 10 }
        }
    };
    return docDefShell;
}

function examDocDefExamHeader() {
    var arrShell = [];
    var docDefExamHeader = {
        layout: { defaultBorder: false },
        table: {
            body: [ [ 
                { text: "PE4", fontSize: 34, margin: [ 0, -5, 0, 0 ] },
                { text: [ 
                    { text: "VOCABULARY " +  appVoca.settings.type + " v" + appVoca.settings.version + "\n" },
                    { text: appVoca.settings.user + " " + appVoca.settings.date }
                ]}, [
                    { layout: { defaultBorder: false },
                    table: { body: [ [
                        { text: "", margin: [ 0, -4, 0, 0 ] },
                        { text: "Student Name:", fontSize: 10, margin: [ -4, -5, 0, 0 ] },
                        { text: "", margin: [ 0, -4, 0, 0 ] },
                        { text: "Student Number: ", fontSize: 10, margin: [ -4, -5, 0, 0 ] }
                    ], [  
                        " ",  
                        { text: " ", border: [ true,true, true, true ] },
                        " ",
                        { text: " ", border: [ true, true, true, true ] }
                    ]]}}]
                ]]
            }
        };

    arrShell.push(docDefExamHeader);
    return arrShell;
}

function examDocDefTsk1Header() {
    var docDefTskHeader = [];

    docDefTskHeader[0] = { text: "\nTask One", style: "header", bold: true };
    docDefTskHeader[1] = { columns: [[{ style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [[{ margin: [ 0, -3, 0, 0 ], bold: true, text: ["Choose the best definition of the ", { text: "underlined", decoration: "underline" }, " word" ]}]]}}], { width: 70, fontSize: 8, table: { body: [[{ text: "ANSWER", margin: [ 0, 4, 0, 0 ], border: [ false, false, false, false ]}]]}}]};
    return docDefTskHeader;
}

function examDocDefTsk2Header(prop) {
    var docDefTskHeader = [];
    var box = appVoca.examObjs.current[prop].box;
    var opta = "(a.) " + box.a;
    var optb = "(b.) " + box.b;
    var optc = "(c.) " + box.c;
    var optd = "(d.) " + box.d;
    var tskText = "\nTask Two (i)";
    
    if(prop === "tsk2b") {
        tskText = "\nTask Two (ii)";
    }
    docDefTskHeader[0] = { text: tskText, style: "header", bold: true };
    docDefTskHeader[1] = { text: "Choose a correct word to complete each sentence. CHOOSE EACH WORD ONCE.\n", style: "subheader", bold: true };
    docDefTskHeader[2] = { width: ["*"], margin: [ 4, 0, 20, 0 ], style: "qstnTbl", table:  
        { fontSize: 12, layout: { defaultBorder: false }, noWrap: true, widths: ["*", "*", "*", "*"], body: [[ 
                { text: opta, margin: [ 2, 2, 0, 0 ], border: [ true, true, false, true ] }, 
                { text: optb, margin: [ 0, 2, 0, 2 ], border: [ false, true, false, true ] },
                { text: optc, margin: [ 0, 2, 0, 2 ], border: [ false, true, false, true ] },
                { text: optd, margin: [ 0, 2, 0, 2 ], border: [ false, true, true, true ] }
            ]]
        }
    };
    docDefTskHeader[3] = { columns: [[{ style: "qstnTbl", width: ["*"], noWrap: true, layout: { defaultBorder: false }, table: { body: [[]]}}], { width: 60, fontSize: 8, table: { body: [[{ text: "ANSWER", margin: [ -4, 4, 0, 0 ], border: [ false, false, false, false ]}]]}}]};
    return docDefTskHeader;
}

function examDocDefTsk3Header() {
    var docDefTskHeader = [];

    docDefTskHeader[0] = { text: "Task Three", style: "header", bold: true };
    docDefTskHeader[1] = { columns: [[{ style: "qstnTbl", width: ["*"], noWrap: true, layout: { defaultBorder: false }, table: { body: [[{ text: "Choose the correct grammar form to complete each sentence.", margin: [ 0, -3, 0, 0 ], bold: true }]]}}], { width: 60, fontSize: 8, table: { body: [[{ text: "ANSWER", margin: [ -4, 4, 0, 0 ], border: [ false, false, false, false ]}]]}}]};
    return docDefTskHeader;
}

function examDocDefTsk4Header() {
    var docDefTskHeader = [];

    docDefTskHeader[0] = { text: "Task Four", style: "header", bold: true };
    docDefTskHeader[1] = { columns: [[{ style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [[{ text: "Choose the three strongest collocates to the given word.", margin: [ 0, -3, 0, 0 ], bold: true }]]}}],{ width: 60, fontSize: 8, table: { body: [[{ text: "ANSWER", margin: [ -4, 4, 0, 0 ], border: [ false, false, false, false ]}]]}}]};
    return docDefTskHeader;
}

function examDocDefTsk5Header() {
    var docDefTskHeader = [];
    var txtbox = appVoca.examObjs.current.tsk5.box;

    docDefTskHeader[0] = { text: "Task Five", style: "header", bold: true };
    docDefTskHeader[1] = { text: "Read the text below and answer the questions that follow.\n", style: "subheader", bold: true };
    docDefTskHeader[2] = { width: [ "*" ], margin: [ 4, 0, 20, 0 ], style: "qstnTbl", table: { body: [[
        { style: "qstnTbl", fontSize: 11, layout: { defaultBorder: false }, noWrap: false, table: { body: [[{ text: txtbox, margin: [ 4, 4, 4, 4 ]}]]}}]]}
    };
    docDefTskHeader[3] = { columns: [[{ style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [[]]}}], { width: 60, fontSize: 8, table: { body: [[{ text: "ANSWER", margin: [ -4, 4, 0, 0 ], border: [ false, false, false, false ]}]]}}]};
    return docDefTskHeader;
}

function examDocDefTsk1Qstns() {
    var docDefTskQstns = [];
    var refArr = appVoca.examObjs.current.tsk1;
    var len = refArr.length - 1;
    var lastBorder,
        qObj,
        b4tgt,
        aftgt,
        numWithDot,
        opta,
        optb,
        optc,
        optd;
    
    refArr.forEach( function(el, i) {
        lastBorder = false;

        if (i === len) {
            lastBorder = true;
        }
        opta = "a. " + el.opts.a;
        optb = "b. " + el.opts.b;
        optc = "c. " + el.opts.c;
        optd = "d. " + el.opts.d;
        numWithDot = el.qnum + ".";
        b4tgt = numWithDot + " " + el.qb4 + " ";
        aftgt = " " + el.qaf;
        qObj = { columns: [[
            { style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                [{ text: [ b4tgt, { text: el.qtgt, decoration: "underline" }, aftgt ]}],
                [{ style: "nestedTable", widths: [ "*", "*", "*", "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                    [ { text: opta }, { text: optb, margin: [ 4, 0, 0, 0 ]}, { text: optc, margin: [ 4, 0, 0, 0 ]}, { text: optd, margin: [ 4, 0, 0, 0 ]}
                    ]]}
                }]]}
            }], { width: 70, table: { body: [[{ text: numWithDot, margin: [ 0, 0, 25, 20 ], border: [ true, true, true, lastBorder ]}]]}}
        ]};
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function examDocDefTsk2Qstns(prop) { //tsk2a && 2b
    var docDefTskQstns = [];
    var refArr = appVoca.examObjs.current[prop].qstns;
    var len = refArr.length - 1;
    var fixWidth,
        lastBorder,
        qObj,
        qstn,
        numWithDot;
    
    refArr.forEach( function(el, i) {
        lastBorder = false;
        fixWidth = 18;

        if (i === len) {
            lastBorder = true;
        }
        if (el.qnum <= 9) {
            fixWidth = 25;
        }        
        numWithDot = el.qnum + ".";
        qstn = numWithDot + " " + el.qb4 + " " + el.qtgt + " " + el.qaf;
        qObj = { columns: [[{ style: "qstnTbl", width: ["*"], noWrap: true, layout: { defaultBorder: false }, table: { body: [
            [ qstn ]]}}],{ width: 65, table: { body: [[{ text: numWithDot, margin: [ 0, 0, fixWidth, 16 ], border: [ true, true, true, lastBorder ]}]]}}]
        };
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function examDocDefTsk3Qstns() {
    var docDefTskQstns = [];
    var refArr = appVoca.examObjs.current.tsk3;
    var len = refArr.length - 1;
    var lastBorder,
        qObj,
        qstn,
        numWithDot,
        opta,
        optb,
        optc,
        optd;
    
    refArr.forEach( function(el, i) {
        lastBorder = false;

        if (i === len) {
            lastBorder = true;
        }
        opta = "a. " + el.opts.a;
        optb = "b. " + el.opts.b;
        optc = "c. " + el.opts.c;
        optd = "d. " + el.opts.d;
        numWithDot = el.qnum + ".";
        qstn = numWithDot + " " + el.qb4 + " " + el.qtgt + " " + el.qaf;
        qObj = { columns: [[
            { style: "qstnTbl", width: ["*"], noWrap: true, layout: { defaultBorder: false }, table: { body: [
            [ qstn ],
            [{ style: "nestedTable", widths: [ "*", "*", "*", "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                [
                    { text: opta },
                    { text: optb, margin: [ 4, 0, 0, 0 ]},
                    { text: optc, margin: [ 4, 0, 0, 0 ]},
                    { text: optd, margin: [ 4, 0, 0, 0 ]}
                ]]}
            }]]}
        }], { width: 65, table: { body: [[{ text: numWithDot, margin: [ 0, 0, 18, 20 ], border: [ true, true, true, lastBorder ]}]]}}]};
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function examDocDefTsk4Qstns() {
    var docDefTskQstns = [];
    var refObj = appVoca.examObjs.current.tsk4;
    var len = refObj.length - 1;
    var lastBorder,
        qObj,
        qstn,
        numWithDot,
        opta,
        optb,
        optc,
        optd;
    
    refObj.forEach( function(el, i) {
        lastBorder = false;

        if (i === len) {
            lastBorder = true;
        }
        opta = "a. " + el.opts.a;
        optb = "b. " + el.opts.b;
        optc = "c. " + el.opts.c;
        optd = "d. " + el.opts.d;
        numWithDot = el.qnum + ".";
        qstn = numWithDot + " " + el.qb4 + " " + el.qtgt + " " + el.qaf;
        qObj = { columns: [[
            { style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
            [ qstn ], 
            [{ style: "nestedTable", widths: [ "*", "*", "*", "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                [{ text: opta }, { text: optb, margin: [ 4, 0, 0, 0 ]}],
                [{ text: optc }, { text: optd, margin: [ 4, 0, 0, 0 ]}]]}}]
            ]}
        }], { width: 65, table: { body: [[{ text: numWithDot, margin: [ 0, 0, 18, 37 ], border: [ true, true, true, lastBorder ]}]]}}]};
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function examDocDefTsk5Qstns() {
    var docDefTskQstns = [];
    var refArr = appVoca.examObjs.current.tsk5.qstns;
    var len = refArr.length - 1;
    var lastBorder,
        qObj,
        qstn,
        numWithDot,
        opta,
        optb,
        optc,
        optd;
    
    refArr.forEach( function(el, i) {
        lastBorder = false;

        if (i === len) {
            lastBorder = true;
        }
        opta = "a. " + el.opts.a;
        optb = "b. " + el.opts.b;
        optc = "c. " + el.opts.c;
        optd = "d. " + el.opts.d;
        numWithDot = el.qnum + ".";
        qstn = numWithDot + " " + el.qb4;
        qObj = { columns: [[{ style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [ 
            [ qstn ],
            [{ style: "t5nestedTbl", widths: [ "*", "*", "*", "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                [{ text: opta }, { text: optb, margin: [ 4, 0, 0, 0 ]}],
                [{ text: optc }, { text: optd, margin: [ 4, 0, 0, 0 ]}]]}}
            ]]}}], { width: 65, table: { body: [[{ text: numWithDot, margin: [ 0, 0, 18, 37 ], border: [ true, true, true, lastBorder ]}]]}}]
        };
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function buildExamDocDefinition() {
    var docDef = examDocDefShell();
    var pg1Left = [];
    var pg1Right = [];
    var pg2Left = [];
    var pg2Right = [];

    pg1Left[0] = examDocDefExamHeader();
    pg1Left[1] = examDocDefTsk1Header();
    pg1Left[2] = examDocDefTsk1Qstns();
    pg1Left[3] = examDocDefTsk2Header("tsk2a");
    pg1Left[4] = examDocDefTsk2Qstns("tsk2a");
    pg1Right[0] = examDocDefTsk2Header("tsk2b");
    pg1Right[1] = examDocDefTsk2Qstns("tsk2b");
    pg1Right[2] = examDocDefTsk3Header();
    pg1Right[3] = examDocDefTsk3Qstns();
    pg2Left[0] = examDocDefTsk4Header();
    pg2Left[1] = examDocDefTsk4Qstns();
    pg2Right[0] = examDocDefTsk5Header();
    pg2Right[1] = examDocDefTsk5Qstns();

    pushElsToDocDefinition(pg1Left, docDef.content[0], 0);
    pushElsToDocDefinition(pg1Right, docDef.content[0], 1);
    pushElsToDocDefinition(pg2Left, docDef.content[1], 0);
    pushElsToDocDefinition(pg2Right, docDef.content[1], 1);

    // pg1Left.forEach( function(elem) {
    //     elem.forEach( function(el) {
    //         docDef.content[0].columns[0].push(el);
    //     });
    // });
    // pg1Right.forEach( function(elem) {
    //     elem.forEach( function(el) {
    //         docDef.content[0].columns[1].push(el);
    //     });
    // });
    // pg2Left.forEach( function(elem) {
    //     elem.forEach( function(el) {
    //         docDef.content[1].columns[0].push(el);
    //     });
    // });
    // pg2Right.forEach( function(elem) {
    //     elem.forEach( function(el) {
    //         docDef.content[1].columns[1].push(el);
    //     });
    // });
    return docDef;
}

/*********************** pdf document definition: MOCK TEST *******************/

function mockTestDocDefShell() {
    var docDefShell = {
        pageSize: "B4",
        pageOrientation: "landscape",
        pageMargins: [ 15, 10, 10, 10 ],
        content: [ { columns: [ [], [] ] }, { pageBreak: "before", columns: [ [], [] ] } ],
        styles: { 
            qstnTbl: { margin: [ 0, 0, 0, 0 ], fontSize: 12 },
            t5nestedTbl: { margin: [ 4, -5, 0, 0 ], fontSize: 10 },
            nestedTable: { margin: [ 8, -5, 0, 0 ], fontSize: 11 }, 
            header: { fontSize: 14, margin: [ 4, 0, 0, 0 ] },
            subheader: { fontSize: 12, margin: [ 5, 0, 0, 10 ] },
            defaultStyle: { columnGap: 10 }
        }
    };
    return docDefShell;
}

function mockTestDocDefExamHeader(strNum) {
    var arrShell = [];
    var txt = "Practice test (" + strNum + ") for VOCABULARY " +  appVoca.settings.type + " v" + appVoca.settings.version + "\n";
    var docDefExamHeader = {
        layout: { defaultBorder: false },
        margin: [ 4, 0, 0, -10 ],
        table: {
             body: [ [
                { text: [ 
                    { text: txt },
                    { text: appVoca.settings.user + " " + appVoca.settings.date }
                ]}, [
                    { layout: { defaultBorder: false },
                    table: { body: [ [
                        { text: "", margin: [ 0, -4, 0, 0 ] },
                        { text: "Student Name:", fontSize: 10, margin: [ -4, -5, 0, 0 ] },
                        { text: "", margin: [ 0, -4, 0, 0 ] },
                        { text: "Student Number: ", fontSize: 10, margin: [ -4, -5, 0, 0 ] }
                    ], [  
                        " ",  
                        { text: " ", border: [ true,true, true, true ] },
                        " ",
                        { text: " ", border: [ true, true, true, true ] }
                    ]]}}]
                ]]
            }
        };
    arrShell.push(docDefExamHeader);
    return arrShell;
}

function mockTestDocDefTsk2Header(uidArr) {
    var docDefTskHeader = [];
    var boxArr = uidArr.map( function (el) { return appVoca.data[el].en; });

    shuffleArray(boxArr);

    docDefTskHeader[0] = { text: "\nTask Two", style: "header", bold: true, margin: [ 4, -5, 0, 0 ] };
    docDefTskHeader[1] = { text: "Choose a correct word to complete each sentence. CHOOSE EACH WORD ONCE.\n", style: "subheader", bold: true };
    docDefTskHeader[2] = { width: ["*"], margin: [ 4, 0, 20, 0 ], style: "qstnTbl", table:  
        { fontSize: 12, layout: { defaultBorder: false }, noWrap: true, widths: ["*", "*", "*", "*"], body: [[ 
                { text: "(a.) " + boxArr[0], margin: [ 2, 2, 0, 0 ], border: [ true, true, false, true ] }, 
                { text: "(b.) " + boxArr[1], margin: [ 0, 2, 0, 2 ], border: [ false, true, false, true ] },
                { text: "(c.) " + boxArr[2], margin: [ 0, 2, 0, 2 ], border: [ false, true, false, true ] },
                { text: "(d.) " + boxArr[3], margin: [ 0, 2, 0, 2 ], border: [ false, true, true, true ] }
            ]]
        }
    };
    docDefTskHeader[3] = { columns: [[{ style: "qstnTbl", width: ["*"], noWrap: true, layout: { defaultBorder: false }, table: { body: [[]]}}], { width: 60, fontSize: 8, table: { body: [[{ text: "ANSWER", margin: [ -4, 4, 0, 0 ], border: [ false, false, false, false ]}]]}}]};
    return docDefTskHeader;
}

function mockTestDocDefTsk5Header(prop) {
    var docDefTskHeader = [];
    var txtbox = appVoca.texts[appVoca.examObjs.currentUids.tsk5[0]].practice[prop];

    docDefTskHeader[0] = { text: "Task Five", style: "header", bold: true, margin: [ 4, 10, 0, 0 ] };
    docDefTskHeader[1] = { text: "Read the text below and answer the questions that follow.\n", style: "subheader", bold: true };
    docDefTskHeader[2] = { width: [ "*" ], margin: [ 4, 0, 20, 0 ], style: "qstnTbl", table: { body: [[
        { style: "qstnTbl", fontSize: 11, layout: { defaultBorder: false }, noWrap: false, table: { body: [[{ text: txtbox, margin: [ 4, 4, 4, 4 ]}]]}}]]}
    };
    docDefTskHeader[3] = { columns: [[{ style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [[]]}}], { width: 60, fontSize: 8, table: { body: [[{ text: "ANSWER", margin: [ -4, 4, 0, 0 ], border: [ false, false, false, false ]}]]}}]};
    return docDefTskHeader;
}

function mockTestDocDefTsk1Qstns(uidArr) {
    var docDefTskQstns = [];
    var refArr = uidArr.map( function (el) { return appVoca.data[el].practice.syn; });
    var len = refArr.length - 1;
    var lastBorder,
        qObj,
        tgt,
        b4tgt,
        aftgt,
        qnum,
        numWithDot,
        optsArr;
    
    refArr.forEach( function(el, i) {
        lastBorder = false;

        if (i === len) {
            lastBorder = true;
        }
        qnum = i + 1;
        numWithDot = qnum + ".";
        tgt = appVoca.data[uidArr[i]].en;
        b4tgt = numWithDot + " " + el.b4 + " ";
        aftgt = " " + el.af;
        optsArr = [ el.dis1, el.dis2, el.dis3, el.ans ];

        shuffleArray(optsArr);

        qObj = { columns: [[
            { style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                [{ text: [ b4tgt, { text: tgt, decoration: "underline" }, aftgt ]}],
                [{ style: "nestedTable", widths: [ "*", "*", "*", "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                    [ { text: "a. " + optsArr[0] }, { text: "b. " + optsArr[1], margin: [ 4, 0, 0, 0 ]}, { text: "c. " + optsArr[2], margin: [ 4, 0, 0, 0 ]}, { text: "d. " + optsArr[3], margin: [ 4, 0, 0, 0 ]}
                    ]]}
                }]]}
            }], { width: 70, table: { body: [[{ text: numWithDot, margin: [ 0, 0, 25, 20 ], border: [ true, true, true, lastBorder ]}]]}}
        ]};
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function mockTestDocDefTsk2Qstns(uidArr) {
    var docDefTskQstns = [];
    var refArr = uidArr.map( function (el) { return appVoca.data[el].practice.syn; });
    var len = refArr.length - 1;
    var lastBorder,
        qObj,
        qnum,
        qstn,
        numWithDot;
    
    refArr.forEach( function(el, i) {
        lastBorder = false;

        if (i === len) {
            lastBorder = true;
        }
        qnum = i + 5;
        numWithDot = qnum + ".";
        qstn = numWithDot + " " + el.b4 + " _____ " + el.af;

        qObj = { columns: [[{ style: "qstnTbl", width: ["*"], noWrap: true, layout: { defaultBorder: false }, table: { body: [
            [ qstn ]]}}],{ width: 65, table: { body: [[{ text: numWithDot, margin: [ 0, 0, 25, 16 ], border: [ true, true, true, lastBorder ]}]]}}]
        };
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function mockTestDocDefTsk3Qstns(uidArr) {
    var docDefTskQstns = [];
    var refArr = uidArr.map( function (el) { return appVoca.data[el].practice.gmr; });
    var len = refArr.length - 1;
    var fixWidth,
        lastBorder,
        qObj,
        tgt,
        qstn,
        qnum,
        numWithDot,
        optsArr;

    refArr.forEach( function(el, i) {
        lastBorder = false;
        fixWidth = 18;

        if (i === len) {
            lastBorder = true;
        }
        qnum = i + 9;

        if (qnum <= 9) {
            fixWidth = 25;
        }
        numWithDot = qnum + ".";
        tgt = appVoca.data[uidArr[i]].en;
        qstn = numWithDot + " " + el.b4 + " _____ " + el.af;
        optsArr = [ el.dis1, el.dis2, el.dis3, tgt ];

        shuffleArray(optsArr);

        qObj = { columns: [[
            { style: "qstnTbl", width: ["*"], noWrap: true, layout: { defaultBorder: false }, table: { body: [
            [ qstn ],
            [{ style: "nestedTable", widths: [ "*", "*", "*", "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                [ { text: "a. " + optsArr[0] }, { text: "b. " + optsArr[1], margin: [ 4, 0, 0, 0 ]}, { text: "c. " + optsArr[2], margin: [ 4, 0, 0, 0 ]}, { text: "d. " + optsArr[3], margin: [ 4, 0, 0, 0 ]}
                ]]}
            }]]}
        }], { width: 65, table: { body: [[{ text: numWithDot, margin: [ 0, 0, fixWidth, 20 ], border: [ true, true, true, lastBorder ]}]]}}]};
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function mockTestDocDefTsk4Qstns(uidArr) {
    var docDefTskQstns = [];
    var refObj = uidArr.map( function (el) { return appVoca.data[el].practice.col; });
    var len = refObj.length - 1;
    var lastBorder,
        qObj,
        mappedCols,
        qstn,
        qnum,
        numWithDot,
        optsArr;

    refObj.forEach( function(el, i) {
        lastBorder = false;

        if (i === len) {
            lastBorder = true;
        }
        qnum = i + 13;
        numWithDot = qnum + ".";

        if (el.pos === "b4") {
            qstn = numWithDot + " _____ " + appVoca.data[uidArr[i]].en;
        } else {
            qstn = numWithDot + " " + appVoca.data[uidArr[i]].en + " _____ ";
        }
        mappedCols = mapColDistractors(el);
        optsArr = [mappedCols.a, mappedCols.b, mappedCols.c, mappedCols.d];

        shuffleArray(optsArr);

        qObj = { columns: [[
            { style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
            [ qstn ], [{ style: "nestedTable", widths: [ "*", "*", "*", "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                [{ text: "a. " + optsArr[0] }, { text: "b. " + optsArr[1], margin: [ 4, 0, 0, 0 ]}],
                [{ text: "c. " + optsArr[2] }, { text: "d. " + optsArr[3], margin: [ 4, 0, 0, 0 ]}]]}}]
            ]}}], { width: 65, table: { body: [[{ text: numWithDot, margin: [ 0, 0, 18, 37 ], border: [ true, true, true, lastBorder ]}]]}}]};
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function mockTestDocDefTsk5Qstns(num) {
    var docDefTskQstns = [];
    var refObj = appVoca.texts[appVoca.examObjs.currentUids.tsk5[0]].practice;
    var refArr,
        len,
        lastBorder,
        qObj,
        qnum,
        qstn,
        numWithDot,
        optsArr;

    if (num === 1) {
        refArr = [refObj.q1, refObj.q2, refObj.q3, refObj.q4 ];
    } else {
        refArr = [refObj.q5, refObj.q6, refObj.q7, refObj.q8 ];
    }
    len = refArr.length - 1;

    refArr.forEach( function(el, i) {
        lastBorder = false;

        if (i === len) {
            lastBorder = true;
        }
        qnum = i + 17;
        numWithDot = qnum + ".";
        qstn = numWithDot + " " + el.qstn;
        optsArr = [ el.dis1, el.dis2, el.dis3, el.ans ];

        shuffleArray(optsArr);

        qObj = { columns: [[{ style: "qstnTbl", width: [ "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [ 
            [ qstn ], [{ style: "t5nestedTbl", widths: [ "*", "*", "*", "*" ], noWrap: true, layout: { defaultBorder: false }, table: { body: [
                [{ text: "a. " + optsArr[0] }, { text: "b. " + optsArr[1], margin: [ 4, 0, 0, 0 ]}],
                [{ text: "c. " + optsArr[2] }, { text: "d. " + optsArr[3], margin: [ 4, 0, 0, 0 ]}]]}}
            ]]}}], { width: 65, table: { body: [[{ text: numWithDot, margin: [ 0, 0, 18, 37 ], border: [ true, true, true, lastBorder ]}]]}}]
        };
        docDefTskQstns[i] = qObj;
    });
    return docDefTskQstns;
}

function buildMockTestDocDefinition() {
    var docDef = mockTestDocDefShell();
    var pg1Left = [];
    var pg1Right = [];
    var pg2Left = [];
    var pg2Right = [];
    var randTsk1wordOrder = shuffleArray((appVoca.examObjs.currentUids.tsk1).slice(0));
    var randTsk2a_wordOrder = shuffleArray((appVoca.examObjs.currentUids.tsk2a).slice(0));
    var randTsk2b_wordOrder = shuffleArray((appVoca.examObjs.currentUids.tsk2b).slice(0));
    var randTsk3wordOrder = shuffleArray((appVoca.examObjs.currentUids.tsk3).slice(0));
    var randTsk4wordOrder = shuffleArray((appVoca.examObjs.currentUids.tsk4).slice(0));

    pg1Left[0] = mockTestDocDefExamHeader("1");
    pg1Left[1] = examDocDefTsk1Header();
    pg1Left[2] = mockTestDocDefTsk1Qstns(randTsk1wordOrder.slice(0,4)); //appVoca.examObjs.currentUids.tsk1
    pg1Left[3] = mockTestDocDefTsk2Header(randTsk2a_wordOrder); //appVoca.examObjs.currentUids.tsk2a
    pg1Left[4] = mockTestDocDefTsk2Qstns(randTsk2a_wordOrder); //appVoca.examObjs.currentUids.tsk2a
    pg1Left[5] = examDocDefTsk3Header();
    pg1Left[6] = mockTestDocDefTsk3Qstns(randTsk3wordOrder.slice(0,4)); //appVoca.examObjs.currentUids.tsk3
    pg1Right[0] = examDocDefTsk4Header();
    pg1Right[1] = mockTestDocDefTsk4Qstns(randTsk4wordOrder.slice(0,4)); //appVoca.examObjs.currentUids.tsk4
    pg1Right[2] = mockTestDocDefTsk5Header("txtPrt1");
    pg1Right[3] = mockTestDocDefTsk5Qstns(1);
    pg2Left[0] = mockTestDocDefExamHeader("2");
    pg2Left[1] = examDocDefTsk1Header();
    pg2Left[2] = mockTestDocDefTsk1Qstns(randTsk1wordOrder.slice(4)); //appVoca.examObjs.currentUids.tsk1
    pg2Left[3] = mockTestDocDefTsk2Header(randTsk2b_wordOrder); //appVoca.examObjs.currentUids.tsk2b
    pg2Left[4] = mockTestDocDefTsk2Qstns(randTsk2b_wordOrder); //appVoca.examObjs.currentUids.tsk2b
    pg2Left[5] = examDocDefTsk3Header();
    pg2Left[6] = mockTestDocDefTsk3Qstns(randTsk3wordOrder.slice(4)); //appVoca.examObjs.currentUids.tsk3
    pg2Right[0] = examDocDefTsk4Header();
    pg2Right[1] = mockTestDocDefTsk4Qstns(randTsk4wordOrder.slice(4)); //appVoca.examObjs.currentUids.tsk4
    pg2Right[2] = mockTestDocDefTsk5Header("txtPrt2");
    pg2Right[3] = mockTestDocDefTsk5Qstns(2);

    pushElsToDocDefinition(pg1Left, docDef.content[0], 0);
    pushElsToDocDefinition(pg1Right, docDef.content[0], 1);
    pushElsToDocDefinition(pg2Left, docDef.content[1], 0);
    pushElsToDocDefinition(pg2Right, docDef.content[1], 1);

    // pg1Left.forEach( function(elem) {
    //     elem.forEach( function(el) {
    //         docDef.content[0].columns[0].push(el);
    //     });
    // });
    // pg1Right.forEach( function(elem) {
    //     elem.forEach( function(el) {
    //         docDef.content[0].columns[1].push(el);
    //     });
    // });
    // pg2Left.forEach( function(elem) {
    //     elem.forEach( function(el) {
    //         docDef.content[1].columns[0].push(el);
    //     });
    // });
    // pg2Right.forEach( function(elem) {
    //     elem.forEach( function(el) {
    //         docDef.content[1].columns[1].push(el);
    //     });
    // });
    return docDef;
}

function pushElsToDocDefinition(fromArr, toArr, idx) {
    fromArr.forEach( function(elem) {
        elem.forEach( function(el) {
            toArr.columns[idx].push(el);
        });
    });
}

/*********************** translations .csv  *******************/

function getKeysGivenArrOfValuesViaProp(prop, valsArr) {
    var keys = Object.keys(appVoca.data);
    
    return keys.filter( function(el) { return valsArr.indexOf(appVoca.data[el][prop]) !== -1; });
}

function getTranslationsArr() {
    var tsks1To4 = ["tsk1", "tsk2a", "tsk2b", "tsk3", "tsk4"];
    var tsk5 = getKeysGivenArrOfValuesViaProp("en", appVoca.texts[appVoca.examObjs.currentUids.tsk5[0]].tgts);
    var enKrArr = [];
    var enKrObj,
        refObj;

    tsks1To4.forEach( function(elem) {
        appVoca.examObjs.currentUids[elem].forEach( function(el) {
            refObj = appVoca.data[el];
            enKrObj = {};
            enKrObj.en = refObj.en;
            enKrObj.kr = refObj.practice.kr; //prop exists, empty string possible
            //TODO
            //enKrObj.ctxKr = refObj.practice.ctxKr; //prop exists, empty string possible

            // if (refObj.allowTsk.indexOf("syn") !== -1) {
            //     enKrObj.ctxEn = refObj.practice.syn.b4 + " " + refObj.en + " " + refObj.practice.syn.af;
            // } else {
            //     enKrObj.ctxEn = ""; //TODO: we really should have a ctxEn field separate from the syn example! 
            // }
            enKrArr.push(enKrObj);
        });
    });
    tsk5.forEach( function(el) {
        refObj = appVoca.data[el];
        enKrObj = {};
        enKrObj.en = refObj.en;
        enKrObj.kr = refObj.practice.kr;
        //TODO
        // enKrObj.ctxKr = refObj.practice.ctxKr;
        // enKrObj.ctxEn = refObj.practice.syn.b4 + " " + refObj.en + " " + refObj.practice.syn.af;
        enKrArr.push(enKrObj);
    });
    return enKrArr;
}

function makeTranslationsCsv() {
    var enKrArr = getTranslationsArr();
    var tsv = "\"TRANSLATIONS\"\r\n" + "\"" + appVoca.settings.user + " Vocabulary " + appVoca.settings.type + " v."  + appVoca.settings.version + " " + appVoca.settings.date + "\"\r\n\"EN\"\t\"KR\""/*\t\"contextEN\"\t\"contextKR\"\r\n"*/;

    enKrArr.forEach( function(el) {
        tsv += "\"" + el.en + "\"\t\"" + el.kr + "\""/*\t\"" + el.ctxEn + "\"\t\"" + el.ctxKr + "\"\r\n"*/;
    });
   return tsv;
}

/*********************** saved as previous test at download *******************/

function saveAsNewPreviousTest() {
    var path = "data/pe4/" + firebase.auth().currentUser.uid + "/examObjs/";
    var newTestObj = {};

    newTestObj.def = appVoca.examObjs.currentUids;
    newTestObj.type = appVoca.settings.type;
    newTestObj.version = appVoca.settings.version;
    newTestObj.user = appVoca.settings.user;
    newTestObj.date = appVoca.settings.date;
    newTestObj.timeStamp = Date.now();
    pushNewObjToDb(newTestObj, path, appVoca.examObjs.previous, "The exam has been saved successfully.");
}

/*********************** view and load previous tests *******************/

function populatePreviousTests() {
    var container = docEl("previousExamsContainer");
    var prvsKeys = Object.keys(appVoca.examObjs.previous);
    var prvsObj;
    var timeStr;
    var frag = document.createDocumentFragment();
    var newDiv0,
        newInput0,
        newLbl0,
        newSpan0;

    emptyContent(container);

    if(!prvsKeys.length) {
        newDiv0 = document.createElement("DIV");
        newDiv0.textContent = "No previously saved exams.";

        frag.appendChild(newDiv0);
    } else {
        prvsKeys.forEach( function (el, i) {
            newDiv0 = document.createElement("DIV");
            newInput0 = document.createElement("INPUT");
            newLbl0 = document.createElement("LABEL");
            newSpan0 = document.createElement("SPAN");
            prvsObj = appVoca.examObjs.previous[el];
            timeStr = new Date(prvsObj.timeStamp).toLocaleString();
            newInput0.type = "radio";
            newInput0.id = "prEx" + i;
            newInput0.name = "prvsDrone";
            newInput0.value = el;
            newLbl0.htmlFor = "prEx" + i;
            newLbl0.textContent = " " + prvsObj.type + " v" + prvsObj.version + " " + prvsObj.date + " - " + timeStr;
            newSpan0.className = "btn btn-xs btn-default pdeL-btn";
            newSpan0.textContent = "X";
            newSpan0.dataset.uid = el;

            newDiv0.appendChild(newInput0);
            newDiv0.appendChild(newLbl0);
            newDiv0.appendChild(newSpan0);
            frag.appendChild(newDiv0);
        });
    }
    container.appendChild(frag);
}

function showPreviousTests() {
    var btnObj = {a0: {func: "exi", txt: "EXIT"}, a1: {func: "loa", txt: "LOAD SELECTED"}};

    populatePreviousTests();
    appVoca.settings.editMode = true;
    toggleBetweenScreens(btnObj);
}


function identifyDeletePreviousTestEl(el) {
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "SPAN" && el.target.dataset.uid !== undefined) {            
            triggerDeletePreviousTest(el.target.dataset.uid);
        }
        el.stopPropagation();
    }
}

function triggerDeletePreviousTest(testUid) {
    deletePreviousTestFromDb(testUid);
}

function identifyCheckedPreviousTest() {
    var els = Array.from(docEl("previousExamsContainer").querySelectorAll("input[type='radio']:checked"));
    var uid;

    if (els.length) {
        uid = els[0].value;
        clearAllPreviewEls();
        loadCheckedPreviousTest(appVoca.examObjs.previous[uid].def);
        clickToggleBetweenEditScreens();
    }
}

function loadCheckedPreviousTest(refObj) {
    var vocaDataKeys = Object.keys(appVoca.data);
    var vocaTextsKeys = Object.keys(appVoca.texts);
    var prvsObj = {};    
    var keyMap = [
        {a: "tsk1", b: "syn", c: "bar"},
        {a: "tsk2a", b: "syn", c: "baz"},
        {a: "tsk2b", b: "syn", c: "baz2"},
        {a: "tsk3", b: "gmr", c: "urbaz"},
        {a: "tsk4", b: "col", c: "colin"}    
    ];
    var els = Array.from((docEl("foo-filters")).querySelectorAll('input[type="checkbox"]'));

    els.forEach( function(chkBx) { chkBx.checked = true; }); //check = true all the "foo-filters"
    keyMap.forEach( function(elem, i) {
        prvsObj[elem.a] = refObj[elem.a].filter( function (el) { 
            return appVoca.data[el] !== undefined && appVoca.data[el].allowTsk.indexOf(keyMap[i].b) !== -1;
        });
        vocaDataKeys = vocaDataKeys.filter( function(ex) { 
            return prvsObj[elem.a].indexOf(ex) === -1; //appVoca.data MINUS any "previous" uid.s that passed the tests above
        });
    });
    prvsObj.tsk5 = refObj.tsk5.filter( function (el) { 
        return appVoca.texts[el] !== undefined; 
    });
    vocaTextsKeys = vocaTextsKeys.filter( function (ex) { 
        return prvsObj.tsk5.indexOf(ex) === -1; //appVoca.texts MINUS the "previous" uid  that passed the test above
    });
    renderCheckedPreviousTest(prvsObj, vocaTextsKeys, vocaDataKeys, keyMap);
}

function resetFooContainers() {
    var arr = ["foo2", "foo", "bar", "baz", "baz2", "urbaz", "colin", "bop"];
    var len = arr.length;
    var i;

    for (i = 0; i < len; i++) {
        emptyContent(docEl(arr[i]));
    }
    // emptyContent(docEl("foo2"));
    // emptyContent(docEl("foo"));
    // emptyContent(docEl("bar"));
    // emptyContent(docEl("baz"));
    // emptyContent(docEl("baz2"));
    // emptyContent(docEl("urbaz"));
    // emptyContent(docEl("colin"));
    // emptyContent(docEl("bop"));
}

function renderCheckedPreviousTest(prvsObj, vocaTextsKeys, vocaDataKeys, keyMap) {
    resetFooContainers();

    vocaTextsKeys.forEach(function(el) {
        createLiForFoo("foo2", el, appVoca.texts[el].ctx.toLocaleUpperCase(), "0");
    });
    vocaDataKeys.forEach(function(el) {
        createLiForFoo("foo", el, appVoca.data[el].en, appVoca.data[el].book);
    });
    keyMap.forEach( function(elem, i) {
        prvsObj[elem.a].forEach( function(el) {
            createLiForFoo(keyMap[i].c, el, appVoca.data[el].en, appVoca.data[el].book);
        });
    });

    if (prvsObj.tsk5.length) {
        createLiForFoo("bop", prvsObj.tsk5[0], appVoca.texts[prvsObj.tsk5[0]].ctx.toLocaleUpperCase(), "0");
    }    
}

/*********************** request a new word/example  *******************/

function newWordRequest() {
    hideEl("examType");
    hideEl("spanB4examVersion");
    hideEl("examVersion");
    hideEl("currentDate");
    makePendingWordMenuBtns();
    newReqHandlersOn();
}

function exitNewWordRequest() {
    newReqHandlersOff();
    showEl("examType");
    showEl("spanB4examVersion");
    showEl("examVersion");
    showEl("currentDate");
    clickToggleBetweenEditScreens();
}

function makePendingWordMenuBtns() {
    var btnObj = {a0: {func: "exp", txt: "EXIT"}, a1: {func: "udp", txt: "SAVE EDIT"}};
    
    appVoca.settings.editMode = true;
    toggleBetweenScreens(btnObj);
}

function getAllInputsForNewWordRequest(newTarget) {
    var newDataObj  = { 
        //allowTsk: [], //absence of prop "allowTsk" will make the obj unable to be used in an exam (good: it is pending!)
        book: "",
        en: newTarget,
        exam: { syn: {}, gmr: {}, col: {} }, 
        practice: { kr: "", /*ctxKr: "",*/ syn: {}, gmr: {}, col: {} } 
    };
    newDataObj.book = getBkUnitOfNewRequest();
    newDataObj.exam.syn = mapValuesFromRequestSyn(newDataObj.exam.syn, getValuesFromRequestInputs("requestSyn-exam"), "exam");
    newDataObj.practice.syn = mapValuesFromRequestSyn(newDataObj.practice.syn, getValuesFromRequestInputs("requestSyn-practice"), "practice");
    newDataObj.practice.kr = getValuesFromRequestInputs("requestSyn-practice")[6] || "";
    //TODO
    //newDataObj.practice.ctxKr = getValuesFromRequestInputs("requestSyn-practice")[7] || "";
    newDataObj.exam.gmr = mapValuesFromRequestGmr(newDataObj.exam.gmr, getValuesFromRequestInputs("requestGmr-exam"), "exam");
    newDataObj.practice.gmr = mapValuesFromRequestGmr(newDataObj.practice.gmr, getValuesFromRequestInputs("requestGmr-practice"), "practice");
    newDataObj.exam.col = mapValuesFromRequestCol(newDataObj.exam.col, getValuesFromRequestInputs("requestCol-exam"));
    newDataObj.practice.col = mapValuesFromRequestCol(newDataObj.practice.col, getValuesFromRequestInputs("requestCol-practice"));
    return newDataObj;
}

function getBkUnitOfNewRequest() {
    var test = isNormalInteger(docEl("newTargetBkUnit").value);

    if (test.bool === false) {
        test.val = "0";
    }
    return test.val;
}

function getValuesFromRequestInputs(container) {
    var els = Array.from(docEl(container).querySelectorAll("input[type='text']"));

    els = els.map( function(el) { return el.value; });
    return els;
}

function mapValuesFromRequestSyn(refObj, els) {
    var keys,
        len;

    refObj.b4 = els[0].charAt(0).toUpperCase() + els[0].slice(1) || "";
    refObj.af = els[1] || "";
    len = refObj.af.length;

    if (len && (refObj.af.charAt(len - 1) !== "?" && refObj.af.charAt(len - 1) !== ".")) {
        refObj.af = refObj.af + ".";
    }
    refObj.dis1 = els[2] || "";
    refObj.dis2 = els[3] || "";
    refObj.dis3 = els[4] || "";
    refObj.ans = els[5] || "";
   
    keys = Object.keys(refObj);
    keys.forEach( function(el) {
        refObj[el] = refObj[el].replace(/[\s\t]+/, ' ').replace(/^\s+|\s+$/g, ''); //deal with whitespaces
    });
    return refObj;
}

function mapValuesFromRequestGmr(refObj, els, dest) {
    var keys,
        len;

    refObj.b4 = els[0].charAt(0).toUpperCase() + els[0].slice(1) || "";
    refObj.af = els[1] || "";
    len = refObj.af.length;

    if (len && (refObj.af.charAt(len - 1) !== "?" && refObj.af.charAt(len - 1) !== ".")) {
        refObj.af = refObj.af + ".";
    }
    if (dest === "practice") {
        refObj.dis3 = els[2] || "";
    }
    refObj.dis1 = els[3] || "";
    refObj.dis2 = els[4] || "";

    if (dest === "exam") {
        refObj.ans = els[5] || "";
    }
    keys = Object.keys(refObj);
    keys.forEach( function(el) {
        refObj[el] = refObj[el].replace(/[\s\t]+/, ' ').replace(/^\s+|\s+$/g, ''); //deal with whitespaces
    });
    return refObj;
}

function mapValuesFromRequestCol(refObj, els) {
    var keys;

    refObj.pos = "b4";

    if (docEl("colPos1").checked) {
        refObj.pos = "af";
    }
    refObj.dis1 = els[0] || "";
    refObj.dis2 = els[1] || "";
    refObj.dis3 = els[2] || "";
    refObj.ans1 = els[3] || "";
    refObj.ans2 = els[4] || "";
    refObj.ans3 = els[5] || "";
    keys = Object.keys(refObj);
    keys.forEach( function(el) {
        refObj[el] = refObj[el].replace(/[\s\t]+/, ' ').replace(/^\s+|\s+$/g, ''); //deal with whitespaces
    });
    return refObj;
}

function basicChksForNewTarget(newTarget) {
    var chkObj = { bool: false, errorMsg: "", isExam: false };
    var cleanTarget,
        isInDb;

    newTarget = (newTarget.toLowerCase()).replace(/[\s\t]+/, ' '); //lowercase && reduce any combination of ws to a single ws char
    cleanTarget = newTarget.replace(/[^a-zA-Z\s]/g, ''); //compare when non-English alphabet chars are removed

    if (cleanTarget !== newTarget) {
        chkObj.errorMsg = "Please use English alphabet characters only.";
        return chkObj;
    }
    newTarget = (newTarget.replace(/[^a-zA-Z\s]/g, '')).replace(/^\s+|\s+$/g, ''); //remove non-English alphabet chars && then: leading and trailing ws
    
    if (newTarget === "") {
        chkObj.errorMsg = "Please enter a word in English.";
        return chkObj;
    }
    isInDb = (Object.keys(appVoca.data)).filter( function(el) { return appVoca.data[el].en === newTarget; }) || [];

    if (isInDb.length) {
        if (appVoca.settings.isMod === true) {
            chkObj.bool = true;
        }
        chkObj.isExam = true;
        chkObj.errorMsg = "The word you are requesting is already in the database."; //field is ignored if this is a moderator
    } else {
        chkObj.bool = true;
    }
    return chkObj;
}

function allowTskChkboxesAreChecked() {
    var chkd = false;
    var mapArr = ["modSynAllowTsk", "modGmrAllowTsk", "modColAllowTsk"];

    mapArr.forEach( function(el) {
        if (docEl(el).childNodes[0].checked === true) {
            chkd = true;
        }
    });
    return chkd;
}

function finalizeNewExamObj(newExamObj) { //inputs for ALL tasks are recieved from the DOM via: getAllInputsForNewWordRequest(), remove surplus here
    var mapObj = {syn: "modSynAllowTsk", gmr: "modGmrAllowTsk", col: "modColAllowTsk"};

    newExamObj.allowTsk = ["syn", "gmr", "col"];

    (Object.keys(mapObj)).forEach( function(el) {
        if (docEl(mapObj[el]).childNodes[0].checked === false) {
            newExamObj.allowTsk.splice(newExamObj.allowTsk.indexOf(el), 1);
            delete newExamObj[el];
        }
    });
    return newExamObj;
}

function tgtExistsInCtx(ctxStr, tgtStr) {
    if (!tgtStr.length || !ctxStr.length) {
        return false;
    }     
    var tgtLwr = tgtStr.toLowerCase();
    var ctxLwr = ctxStr.toLowerCase();
    
    return new RegExp("\\b" + tgtLwr + "\\b").test(ctxLwr);
}

function wordExistsInSentence(ctxStr, tgtArr) {
    var exists = false;

    tgtArr.forEach( function(el) {
        if (tgtExistsInCtx(ctxStr, el)) {
            exists = true;
        }
    });
    return exists;
}

function rigorousModChksForSyn(newExamObj) {
    var chkSyn = true;
    var tempArr = [];
    var isUnique,
        ctxStr,
        tgtArr;

    if (newExamObj.exam.syn.af === "") { chkSyn = false; }
    if (newExamObj.practice.syn.af === "") { chkSyn = false; }

    tempArr = [ newExamObj.exam.syn.dis1, newExamObj.exam.syn.dis2, newExamObj.exam.syn.dis3, newExamObj.exam.syn.ans, newExamObj.practice.syn.dis1, newExamObj.practice.syn.dis2, newExamObj.practice.syn.dis3, newExamObj.practice.syn.ans ];
    if (tempArr.indexOf("") !== -1) { chkSyn = false; }
    if (tempArr.indexOf(newExamObj.en) !== -1) { chkSyn = false; }

    isUnique = uniqueValuesFromArray(tempArr);
    if (tempArr.length !== isUnique.length) { chkSyn = false; }

    ctxStr = "" + newExamObj.exam.syn.b4 + " " + newExamObj.exam.syn.af;
    tgtArr = [newExamObj.en, newExamObj.exam.syn.ans];
    if (true === wordExistsInSentence(ctxStr, tgtArr)) { chkSyn = false; }

    ctxStr = "" + newExamObj.practice.syn.b4 + " " + newExamObj.practice.syn.af;
    tgtArr = [newExamObj.en, newExamObj.practice.syn.ans];
    if (true === wordExistsInSentence(ctxStr, tgtArr)) { chkSyn = false; }

    return chkSyn;
}

function rigorousModChksForGmr(newExamObj) {
    var chkGmr = true;
    var tempArr = [];
    var isUnique,
        ctxStr,
        tgtArr;

    if (newExamObj.exam.gmr.af === "") { chkGmr = false; }
    if (newExamObj.practice.gmr.af === "") { chkGmr = false; }

    tempArr = [ newExamObj.exam.gmr.dis1, newExamObj.exam.gmr.dis2, newExamObj.exam.gmr.ans ];
    if (newExamObj.exam.gmr.ans !== newExamObj.practice.gmr.dis3) { chkGmr = false; }
    if (newExamObj.exam.gmr.dis1 !== newExamObj.practice.gmr.dis1 && newExamObj.exam.gmr.dis1 !== newExamObj.practice.gmr.dis2) { chkGmr = false; }
    if (newExamObj.exam.gmr.dis2 !== newExamObj.practice.gmr.dis1 && newExamObj.exam.gmr.dis2 !== newExamObj.practice.gmr.dis2) { chkGmr = false; }
    if (tempArr.indexOf("") !== -1) { chkGmr = false; }
    if (tempArr.indexOf(newExamObj.en) !== -1) { chkGmr = false; }

    isUnique = uniqueValuesFromArray(tempArr);
    if (tempArr.length !== isUnique.length) { chkGmr = false; }

    ctxStr = "" + newExamObj.exam.gmr.b4 + " " + newExamObj.exam.gmr.af;
    tgtArr = [newExamObj.en, newExamObj.exam.gmr.ans];
    if (true === wordExistsInSentence(ctxStr, tgtArr)) { chkGmr = false; }

    ctxStr = "" + newExamObj.practice.gmr.b4 + " " + newExamObj.practice.gmr.af;
    tgtArr = [newExamObj.en, newExamObj.practice.gmr.dis3];
    if (true === wordExistsInSentence(ctxStr, tgtArr)) { chkGmr = false; }

    return chkGmr;
}

function rigorousModChksForCol(newExamObj) {
    var chkCol = true;
    var tempArr = [];
    var isUnique;
    
    if (newExamObj.exam.col.pos !== "b4" && newExamObj.exam.col.pos !== "af") { chkCol = false; }
    if (newExamObj.practice.col.pos !== "b4" && newExamObj.practice.col.pos !== "af") { chkCol = false; }

    tempArr = [ newExamObj.exam.col.dis1, newExamObj.exam.col.dis2, newExamObj.exam.col.dis3, newExamObj.exam.col.ans1, newExamObj.exam.col.ans2, newExamObj.exam.col.ans3, newExamObj.practice.col.dis1, newExamObj.practice.col.dis2, newExamObj.practice.col.dis3, newExamObj.practice.col.ans1, newExamObj.practice.col.ans2, newExamObj.practice.col.ans3 ];
    isUnique = uniqueValuesFromArray(tempArr);

    if (tempArr.length !== isUnique.length) { chkCol = false; }
    if (tempArr.indexOf("") !== -1) { chkCol = false; }
    if (tempArr.indexOf(newExamObj.en) !== -1) { chkCol = false; }
    
    return chkCol;
}

function modChksForNewTargetUpgradeToExam(newExamObj) { //surplus props were removed @finalizeNewExamObj()
    var chkVal = true;

    if (!newExamObj.hasOwnProperty("allowTsk")) { return false; }
    if (!newExamObj.allowTsk.length) { return false; }
    if (newExamObj.en === "") { return false; }

    if (newExamObj.allowTsk.indexOf("syn") !== -1) {
        if (false === rigorousModChksForSyn(newExamObj)) {
            chkVal = false;
        }
    }
    if (newExamObj.allowTsk.indexOf("gmr") !== -1) {
        if (false === rigorousModChksForGmr(newExamObj)) {
            chkVal = false;
        }
    } 
    if (newExamObj.allowTsk.indexOf("col") !== -1) {
        if (false === rigorousModChksForCol(newExamObj)) {
            chkVal = false;
        }
    }
    return chkVal;
}

function getChkdStateOfResolvedErrs(refErrObj) { // refErrObj: appVoca.data[uid].hasError
    var chkBxArr = Array.from(docEl("errorInfo").querySelectorAll("input[type='checkbox']"));

    chkBxArr.forEach( function(el) {
        refErrObj[el.dataset.errUid] = {};
        refErrObj[el.dataset.errUid].resolved = el.checked;
    });
    return refErrObj;
}

function modToSaveChangesToEditedExamWord(newTarget) {
    var allowChkbxChkd = allowTskChkboxesAreChecked();
    var rigorousChks,
        newExamObj,
        uid;

    if (allowChkbxChkd === false) {
        window.mscAlert({ title: "", subtitle: "Please ensure that at least one task checkbox is checked!\nIf your intent is to remove the word from the exam, please delete it from the list." });
        return;
    }
    newExamObj = finalizeNewExamObj(getAllInputsForNewWordRequest(newTarget));
    rigorousChks = modChksForNewTargetUpgradeToExam(newExamObj);
    uid = (Object.keys(appVoca.data)).filter( function(el) { return appVoca.data[el] && appVoca.data[el].en === newTarget; })[0];

    if (uid === undefined) { return; }
    if (appVoca.data[uid].hasOwnProperty("hasError")) {
        newExamObj.hasError = getChkdStateOfResolvedErrs(appVoca.data[uid].hasError);
    }
    if (rigorousChks === true) {
        window.mscConfirm({
            title: '',
            subtitle: 'Do you want to update this exam word?',
            cancelText: 'Cancel',
            onOk: function () {
                overwriteExistingExamObjInDb(uid, newExamObj);
                return;
            }, 
            onCancel: function () {
                return;
            }
        });
    } else {
        window.mscAlert({ title: "", subtitle: "There are some issues in the data for the tasks you are attempting to add to the exam.\nPlease check carefully for errors and\nplease use the study guide if you are unsure about the necessary restrictions placed on new vocabulary." });
        return;
    }
}

function modUpgradePendingToExamWordOrNewExamWord(newTarget) {    
    var user = firebase.auth().currentUser.displayName;
    var rigorousChks,
        newExamObj,
        uid;

    newExamObj = finalizeNewExamObj(getAllInputsForNewWordRequest(newTarget));
    rigorousChks = modChksForNewTargetUpgradeToExam(newExamObj);
    uid = (Object.keys(appVoca.pending.userCreated)).filter( function(el) { return appVoca.pending.userCreated[el] && appVoca.pending.userCreated[el].en === newTarget; })[0];

    if (rigorousChks === true) {
        window.mscConfirm({
            title: '',
            subtitle: 'Do you want this word to be available on the exam?',
            cancelText: 'No, not yet!',
            onOk: function () {
                modCreateNewExamObj(uid, newExamObj);
                return;
            }, 
            onCancel: function () {
                delete newExamObj.allowTsk;
                clearAllowTskBfgChkboxes();
                modSaveUpdatesToPendingWord(newTarget, user);
                return;
            }
        });
    } else {
        window.mscAlert({ title: "", subtitle: "There are some issues in the data for the tasks you are attempting to add to the exam.\nPlease check carefully for errors and\nplease use the study guide if you are unsure about the necessary restrictions placed on new vocabulary." });
        return;
    }
}

function modCreatesOrUpdatesNewPendingObj(newTarget, basicChks) {
    var user = firebase.auth().currentUser.displayName;
    var allowChkbxChkd = allowTskChkboxesAreChecked();

    if (basicChks.isExam === true) {
        modToSaveChangesToEditedExamWord(newTarget);
    } else if (allowChkbxChkd === true) {
        modUpgradePendingToExamWordOrNewExamWord(newTarget);
    } else {
        modSaveUpdatesToPendingWord(newTarget, user);
    }
}

function modSaveUpdatesToPendingWord(newTarget, user) {
    var isPending = (Object.keys(appVoca.pending.userCreated)).filter( function(el) { return appVoca.pending.userCreated[el].en === newTarget; }) || [];
    var newPendingObj = getAllInputsForNewWordRequest(newTarget);
    var existingUid;

    newPendingObj.lastModBy = user;

    if (!isPending.length) {
        newPendingObj.requestBy = user;
        pushNewObjToDb(newPendingObj, "data/pe4/pending/", appVoca.pending.userCreated, "Thank you for your contribution!");
    } else {
        existingUid = isPending[0];
        updateExistingPendingInDb(newPendingObj, existingUid, true);
    }
}

function createOrUpdateNewPendingObj() {
    var newTarget = docEl("newTargetWord").value;
    var basicChks = basicChksForNewTarget(newTarget);

    if (basicChks.bool === false) {
        window.mscAlert({ title: "", subtitle: basicChks.errorMsg });
        return;
    }
    if (appVoca.settings.isMod === true) {
        modCreatesOrUpdatesNewPendingObj(newTarget, basicChks);
    } else { //a tchr creating a new request, or editing an existing request
        updateEditsToNewPendingObj(newTarget);
    }
}

function updateEditsToNewPendingObj(newTarget) { //could be a new request or edits to an existing request
    var user = firebase.auth().currentUser.displayName;
    var isPending = (Object.keys(appVoca.pending.userCreated)).filter( function(el) { return appVoca.pending.userCreated[el].en === newTarget; }) || [];
    var newPendingObj = getAllInputsForNewWordRequest(newTarget);
    var existingUid;

    newPendingObj.lastModBy = user;

    if (!isPending.length) {
        newPendingObj.requestBy = user;
        pushNewObjToDb(newPendingObj, "data/pe4/pending/", appVoca.pending.userCreated, "Thank you for your contribution!");
    } else {
        existingUid = isPending[0];
        updateExistingPendingInDb(newPendingObj, existingUid, true);
    }
}

function updatenGmrTgt0Drone() {
    var val = docEl("nGmrTgt0").value;

    docEl("pGmrTgt0").value = val;
}

function updatenGmrTgt1Drone() {
    var val = docEl("nGmrTgt1").value;

    docEl("pGmrTgt1").value = val;
}

function updatenGmrTgt2Drone() {
    var val = docEl("nGmrTgt2").value;

    docEl("pGmrTgt2").value = val;
}

function pullColLeft() {
    if (!docEl('nTgt4').classList.contains('pull-left')) {
        docEl('nTgt4').className += ' pull-left';
    }
    if (!docEl('nTgt5').classList.contains('pull-left')) {
        docEl('nTgt5').className += ' pull-left';
    }
}

function leaveColRight() { 
    docEl('nTgt4').className = docEl('nTgt4').className.replace(/(?:^|\s)pull-left(?!\S)/g, '');
    docEl('nTgt5').className = docEl('nTgt5').className.replace(/(?:^|\s)pull-left(?!\S)/g, '');
}

function updateTargetWordDrones() {
    var val = docEl("newTargetWord").value;

    docEl("nTgt0").textContent = val;
    docEl("nTgt1").textContent = val;
    docEl("nTgt2").value = val;
    docEl("nTgt3").value = val;
    docEl("nTgt4").textContent = val;
    docEl("nTgt5").textContent = val;
    chkForHighlightedPendingWordInList();
}

function keyUpOnNewTargetWord(evt) {
    updateTargetWordDrones();
    searchPendingListElForMatch(evt.target.value);

    if (appVoca.settings.isMod === true) {
        clearAllowTskBfgChkboxes();    
        clearErrorInfo();
    }
}

function renderLoadingSelectedPendingWordRequestInfo(refObj) { //refObj = appVoca.pending.userCreated[el.dataset.uid];
    var container = docEl("errorInfo");
    var frag = document.createDocumentFragment();
    var newDiv = document.createElement("DIV");
    var newSpan0 = document.createElement("SPAN");

    emptyContent(container);
    
    newDiv.className = "col-lg-12";
    newSpan0.style.color = "#333";
    newSpan0.textContent = "Requested by: " + refObj.requestBy + " / Last edited by: " + refObj.lastModBy;

    newDiv.appendChild(newSpan0);
    frag.appendChild(newDiv);
    container.appendChild(frag);
}

function clearErrorInfo() {
    if (docEl("errorInfo").hasChildNodes()) {
        emptyContent(docEl("errorInfo"));
    }
}

function resetAllInputsForUpdatedPending() {
    var containers = [ "requestSyn-exam", "requestSyn-practice", "requestGmr-exam", "requestGmr-practice", "requestCol-exam", "requestCol-practice" ];

    docEl("newTargetWord").value = "";
    docEl("newTargetBkUnit").value = "";
    updateTargetWordDrones();
    containers.forEach( function(el) {
        clearInputsForUpdatedPending(el);
    });
}

function clearInputsForUpdatedPending(container) {
    var els = Array.from(docEl(container).querySelectorAll("input[type='text']"));

    els.forEach( function(el) {
        el.value = "";
    });
}

function populatePendingList() {
    var user = firebase.auth().currentUser.uid;
    var uidsArr = Object.keys(appVoca.pending.userCreated);
    var container = docEl("pendingList");
    var frag = document.createDocumentFragment();
    var newDiv,
        newSpan,
        modCache,
        pendingCache;

    emptyContent(container);

    pendingCache = uidsArr.map( function(el) { return appVoca.pending.userCreated[el].en; });

    if (appVoca.settings.isMod === true) { //add all exam words to the cache if this is a moderator
        modCache = (Object.keys(appVoca.data)).map( function(el) { 
            return appVoca.data[el].en;
        });
        appVoca.pending.enCache = [pendingCache, modCache].reduce( function(acc, val) { 
            return acc.concat(val); 
        },[] ).filter( function(el, idx, arr){ 
            return arr.indexOf(el) === idx; 
        });
    } else {
        appVoca.pending.enCache = pendingCache;
    }
    uidsArr.forEach( function(el){
        newDiv = document.createElement("DIV");

        newDiv.className = "btn btn-sm btn-default btn-block";
        newDiv.dataset.uid = el;
        newDiv.textContent = appVoca.pending.userCreated[el].en;

        if (appVoca.settings.isMod === true || user === appVoca.pending.userCreated[el].requestBy) { //moderators can delete any pending request
            newSpan = document.createElement("SPAN");

            newSpan.dataset.uid = el;
            newSpan.className = "btn btn-xs btn-default absR-btn";
            newSpan.textContent = "X";

            newDiv.appendChild(newSpan);
        }
        frag.appendChild(newDiv);
    });
    container.appendChild(frag);

    if (appVoca.settings.isMod !== true) {
        touchPendingListElForMatch();
    }
}

function identifyPendingListEl(el) {
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "DIV" && el.target.dataset.uid !== undefined) {
            pendingListElIsWordBtn(el.target);
            return;
        }
        if (el.target.nodeName === "SPAN" && el.target.parentElement.dataset.uid !== undefined) {
            pendingListElIsDeleteSpan(el.target.parentElement);
            return;
        }
        el.stopPropagation();
    }
}

function pendingListElIsWordBtn(el) {
    if (el.parentElement.id === "currentVocaErrors" ) {
        loadSelectedPendingWord(el, true);
        return;
    }
    if (el.parentElement.id === "pendingList" ) {
        loadSelectedPendingWord(el, false);
    }
}

function pendingListElIsDeleteSpan(elParent) {
    if (elParent.parentElement.id === "pendingList" ) {
        deletePendingListEl(elParent.dataset.uid);
        return;
    }
    if (elParent.parentElement.id === "currentVocaErrors" ) {
        window.mscConfirm({
            title: 'Warning',
            subtitle: 'The exam word will be moved to \"awaiting moderation\"\nand will not be available on the exam. Proceed?',
            cancelText: 'Cancel', 
            onOk: function () {                
                downgradeExamWordIntoPendingList(elParent, elParent.dataset.uid);
                return;
            }, 
            onCancel: function () {
                return;
            }
        });        
    }
}

function populateSynInputsLoadingPendingWord(refObj) {
    var els;
    
    els = Array.from(docEl("requestSyn-exam").querySelectorAll("input[type='text']"));
    els[0].value = refObj.exam.syn.b4;
    els[1].value = refObj.exam.syn.af;
    els[2].value = refObj.exam.syn.dis1;
    els[3].value = refObj.exam.syn.dis2;
    els[4].value = refObj.exam.syn.dis3;
    els[5].value = refObj.exam.syn.ans;
    els = Array.from(docEl("requestSyn-practice").querySelectorAll("input[type='text']"));
    els[0].value = refObj.practice.syn.b4;
    els[1].value = refObj.practice.syn.af;
    els[2].value = refObj.practice.syn.dis1;
    els[3].value = refObj.practice.syn.dis2;
    els[4].value = refObj.practice.syn.dis3;
    els[5].value = refObj.practice.syn.ans;
    els[6].value = refObj.practice.kr;
    //TODO
    //els[7].value = refObj.practice.ctxKr;
}

function populateGmrInputsLoadingPendingWord(refObj) {
    var els;

    els = Array.from(docEl("requestGmr-exam").querySelectorAll("input[type='text']"));
    els[0].value = refObj.exam.gmr.b4;
    els[1].value = refObj.exam.gmr.af;
    els[2].value = refObj.en;
    els[3].value = refObj.exam.gmr.dis1;
    els[4].value = refObj.exam.gmr.dis2;
    els[5].value = refObj.exam.gmr.ans;
    els = Array.from(docEl("requestGmr-practice").querySelectorAll("input[type='text']"));
    els[0].value = refObj.practice.gmr.b4;
    els[1].value = refObj.practice.gmr.af;
    //don't trust these values! MUST always reference the exam data...
    //if there is an error in the data, then user would need to touch each input of the exam data otherwise these values would not change && prompt fail @ update
    // els[2].value = refObj.practice.gmr.dis3;
    // els[3].value = refObj.practice.gmr.dis1;
    // els[4].value = refObj.practice.gmr.dis2;
    els[2].value = refObj.exam.gmr.ans;
    els[3].value = refObj.exam.gmr.dis1;
    els[4].value = refObj.exam.gmr.dis2;
    els[5].value = refObj.en;
}

function populateColInputsLoadingPendingWord(refObj) {
    var els;

    if (refObj.exam.col.pos === "b4") {
        docEl("colPos0").checked = true;
        leaveColRight();
    } else {
        docEl("colPos1").checked = true;
        pullColLeft();
    }
    els = Array.from(docEl("requestCol-exam").querySelectorAll("input[type='text']"));
    els[0].value = refObj.exam.col.dis1;
    els[1].value = refObj.exam.col.dis2;
    els[2].value = refObj.exam.col.dis3;
    els[3].value = refObj.exam.col.ans1;
    els[4].value = refObj.exam.col.ans2;
    els[5].value = refObj.exam.col.ans3;
    els = Array.from(docEl("requestCol-practice").querySelectorAll("input[type='text']"));
    els[0].value = refObj.practice.col.dis1;
    els[1].value = refObj.practice.col.dis2;
    els[2].value = refObj.practice.col.dis3;
    els[3].value = refObj.practice.col.ans1;
    els[4].value = refObj.practice.col.ans2;
    els[5].value = refObj.practice.col.ans3;
}

function loadSelectedPendingWord(el, bool) {
    var refObj;

    clearForNewPendingWord();

    el.className += " previewSelected";
    appVoca.pending.isSelected.pending = false;
    appVoca.pending.isSelected.exam = false;

    if (bool === false) { //we're loading a pending word
        refObj = appVoca.pending.userCreated[el.dataset.uid];
        appVoca.pending.isSelected.pending = true;
        populateSynInputsLoadingPendingWord(refObj);
        populateGmrInputsLoadingPendingWord(refObj);
        populateColInputsLoadingPendingWord(refObj);
        renderLoadingSelectedPendingWordRequestInfo(refObj);
    } else { //we're loading an exam word...some sections may not be allowed by prop: allowTsk []
        refObj = appVoca.data[el.dataset.uid];
        appVoca.pending.isSelected.exam = true;

        if (refObj.allowTsk.indexOf("syn") !== -1) {
            populateSynInputsLoadingPendingWord(refObj);
        }
        if (refObj.allowTsk.indexOf("gmr") !== -1) {
            populateGmrInputsLoadingPendingWord(refObj);
        }
        if (refObj.allowTsk.indexOf("col") !== -1) {
            populateColInputsLoadingPendingWord(refObj);
        }
        finishLoadingSelectedExamWord(refObj);
    }
    docEl("newTargetWord").value = refObj.en;
    docEl("newTargetBkUnit").value = refObj.book === "0" ? "" : refObj.book;
    docEl("nTgt0").textContent = refObj.en;
    docEl("nTgt1").textContent = refObj.en;
    docEl("nTgt2").textContent = refObj.en;
    docEl("nTgt3").textContent = refObj.en;
    docEl("nTgt4").textContent = refObj.en;
    docEl("nTgt5").textContent = refObj.en;
}

function clearHighlightedPendingWords() {
    var els = Array.from(docEl("awaitingBucket").querySelectorAll("div.previewSelected"));

    appVoca.pending.isSelected.pending = false;
    appVoca.pending.isSelected.exam = false;

    els.forEach( function(elem) {
        elem.className = elem.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
    });
}

function chkForHighlightedPendingWordInList() {
    if (appVoca.pending.isSelected.pending === false && appVoca.pending.isSelected.exam === false) {
        return;
    }
    clearHighlightedPendingWords();
}

function clearForNewPendingWord() {
    resetAllInputsForUpdatedPending();
    clearHighlightedPendingWords();

    if (appVoca.settings.isMod === true) {
        clearAllowTskBfgChkboxes();    
        clearErrorInfo();
    }
}

function leaveRequestScreen() {
    clearForNewPendingWord();
    exitNewWordRequest();
}

function searchPendingListElForMatch(tgtEn) { //NOTE: .isSelected is only used to exit highlighting early, so we dont waste cycles on the keyup fn
    var idx;

    if (appVoca.pending.isSelected.pending === true || appVoca.pending.isSelected.exam === true) {
        return;
    }
    idx = appVoca.pending.enCache.indexOf(tgtEn);

    if (idx === -1) {
        return;
    }
    foundMatchInPendingListEl(tgtEn);
}

function foundMatchInPendingListEl(tgtEn) {
    var canExit = false;
    var refkey,
        els,
        len,
        i;

    refkey = (Object.keys(appVoca.pending.userCreated)).filter( function(el){ return appVoca.pending.userCreated[el].en === tgtEn; })[0];
    els = Array.from(docEl("pendingList").querySelectorAll("div.btn"));
    len = els.length;

    for (i = 0; i < len; i++) {
        if (refkey === els[i].dataset.uid) {
            highlightMatchInPendingList(els[i], "pending");
            canExit = true;
            break;
        }
    }
    if (canExit === true) {
        return;
    }
    refkey = (Object.keys(appVoca.data)).filter( function(el){ return appVoca.data[el].en === tgtEn; })[0];
    els = Array.from(docEl("currentVocaErrors").querySelectorAll("div.btn"));
    len = els.length;

    for (i = 0; i < len; i++) {
        if (refkey === els[i].dataset.uid) {
            highlightMatchInPendingList(els[i], "exam");
            break;
        }
    }
}

function highlightMatchInPendingList(el, prop) {
    appVoca.pending.isSelected[prop] = true;
    el.className += " previewSelected";
    scrollToEl(el);
}

function scrollToEl(el) {
    if (document.body.scrollIntoView) {
        el.scrollIntoView();
    }    
}

function deletePendingListEl(uid) {
    var user = firebase.auth().currentUser.uid;
    var refObj = appVoca.pending.userCreated[uid];
    var refTgtWord = "" + refObj.en;

    if (refObj.requestBy === user || appVoca.settings.isMod === true) {
        window.mscConfirm({
            title: 'Warning',
            subtitle: 'This action will permanently delete the word and all its data. Proceed?',
            cancelText: 'Cancel', 
            onOk: function () {
                updateExistingPendingInDb(null, uid, false);  //deletes node from db with update: null

                if (docEl("newTargetWord").value === refTgtWord) {
                    docEl("newTargetWord").value = "";
                    updateTargetWordDrones();
                }
                return;
            }, 
            onCancel: function () {
                return;
            }
        });
    }
}

/*********************** view and select distractors for collocations  *******************/

function createColDistractors() {
    var keys = Object.keys(appVoca.data);
    var colDisArr = keys.map( function(elem) { 
        return [ 
            appVoca.data[elem].exam.col.dis1, 
            appVoca.data[elem].exam.col.dis2, 
            appVoca.data[elem].exam.col.dis3,
            appVoca.data[elem].practice.col.dis1, 
            appVoca.data[elem].practice.col.dis2, 
            appVoca.data[elem].practice.col.dis3
        ];
    }).reduce( function(acc, val) { 
        return acc.concat(val); 
    },[] ).filter( function(el, idx, arr){ 
        return arr.indexOf(el) === idx && el !== undefined && el !== ""; 
    }).sort( function(a,b) {
        return a.localeCompare(b);
    });
    populateColDistractors(colDisArr);
}

function populateColDistractors(colDisArr) {
    var container = docEl("reqSectionAllCols");
    var frag = document.createDocumentFragment();
    var newDiv;

    colDisArr.forEach( function(el) {
        newDiv = document.createElement("DIV");

        newDiv.className = "btn btn-xs btn-default";
        newDiv.textContent = el;
        frag.appendChild(newDiv);
    });
    container.appendChild(frag);
        
}

function identifyColDisSelected(el) {
    if (el.target !== el.currentTarget) {
        toggleSelectedOnColDis(el.target);
    }
    el.stopPropagation();
}

function toggleSelectedOnColDis(el) {
    if (el.classList.contains("selectedColDis")) {
        el.className = el.className.replace(/(?:^|\s)selectedColDis(?!\S)/g, '');
        return;
    }
    el.className += " selectedColDis";
}    

function loadSelectedColDistractors() {
    var els = Array.from(docEl("reqSectionAllCols").querySelectorAll("div.btn.selectedColDis"));
    var examTgts = (Array.from(docEl("requestCol-exam").querySelectorAll("input[type='text']"))).splice(0, 3);
    var practiceTgts = (Array.from(docEl("requestCol-practice").querySelectorAll("input[type='text']"))).splice(0, 3);

    examTgts.forEach( function(el){
        if (els.length) {
            if (el.value === "") {
                el.value = els[0].textContent;
                els.splice(0, 1);
            }
        }
    });
    practiceTgts.forEach( function(el){
        if (els.length) {
            if (el.value === "") {
                el.value = els[0].textContent;
                els.splice(0, 1);
            }
        }
    });
    exitColDistractors();
}

function viewColDistractors() {
    hideEl("fullRequest");
    hideEl("screenButtons");
    showEl("reqAllColDistractors");
}

function exitColDistractors() {
    var els = Array.from(docEl("reqSectionAllCols").querySelectorAll("div.btn.selectedColDis"));

    els.forEach( function(el) {
        if (el.classList.contains("selectedColDis")) {
            el.className = el.className.replace(/(?:^|\s)selectedColDis(?!\S)/g, '');
        }
    });
    hideEl("reqAllColDistractors");
    showEl("screenButtons");
    showEl("fullRequest");
}

/*********************** db communication  *******************/

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

            if (path === "data/pe4/pending/") {
                if (newObj !== null) {
                    appVoca.settings.refresh.uid = newPostKey;
                    appVoca.settings.refresh.cat = "pending";
                }
                populatePendingList();
            }
            if (path === "data/pe4/errors/" && appVoca.settings.isMod === true) {
                refreshVocaFromDbForMod();
            }
        }
    });
}

function deletePreviousTestFromDb(testUid) {
    var userUid = firebase.auth().currentUser.uid;
    var updates = {};

    updates['data/pe4/' + userUid + '/examObjs/' + testUid] = null;
    firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
        } else {
            delete appVoca.examObjs.previous[testUid];
            window.mscAlert({ title: "", subtitle: "The previous test was deleted." });
            populatePreviousTests();
        }
    });
}

function updateExistingPendingInDb(newObj, uid, bool) { //use: newObj = null && bool = false to delete
    var updates = {};

    if (newObj !== null && newObj.hasOwnProperty("allowTsk")) { //a pending obj CANNOT have an allowTsk prop
        delete newObj.allowTsk;
    }
    updates['data/pe4/pending/' + uid] = newObj;
    firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
        } else {
            if (bool === true) {
                appVoca.pending.userCreated[uid] = newObj;
                window.mscAlert({ title: "", subtitle: "Thank you for your contribution!" });
                return;
            }
            if (bool === false) {
                delete appVoca.pending.userCreated[uid];
                window.mscAlert({ title: "", subtitle: "The requested word has been deleted." });
            }
            populatePendingList();
        }
    });
}

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

function getPendingVocaFromDb() {
    firebase.database().ref('data/pe4/pending').once('value').then(function(snapshot) {
        appVoca.pending.userCreated = snapshot.val() || {};
        populatePendingList();
    }, function (e) {
        chkPermission(e);
        return;
    });
}

function getPreviousExamsFromDb() {
    var uid = firebase.auth().currentUser.uid;

    firebase.database().ref('data/pe4/' + uid + '/examObjs').once('value').then(function(snapshot) {
        appVoca.examObjs.previous = snapshot.val() || {};
    }, function (e) {
        chkPermission(e);
        return;
    });
}

function getVocaFromDb() {
    var pe4exams;
    
    firebase.database().ref('data/pe4/exams').once('value').then(function(snapshot) {
        pe4exams = snapshot.val();

        if (pe4exams !== null) {
            appVoca.data = pe4exams.ledata || {};
            appVoca.texts = pe4exams.letexts || {};
            hasModAccess();
            getPreviousExamsFromDb();
            getPendingVocaFromDb();
            createColDistractors();
            startApp();
        }
    }, function (e) {
        initFailed(e);
        return;
    });
}

function hasModAccess() {
    var uid = firebase.auth().currentUser.uid;
    var tchrObj;

    firebase.database().ref('tchrList/pe4/' + uid + '/').once('value').then(function(snapshot) {
        tchrObj = snapshot.val() || {};

        if (tchrObj.hasOwnProperty("isMod")) {
            getReportedErrors();
            appVoca.settings.isMod = tchrObj.isMod;
            docEl("newVocaBtn").textContent = "Edit vocabulary";
            renderModEditingAllowTskChkboxes();
            showEl("currentVocaErrorsHdr");
            showEl("currentVocaErrors");
        }
    }, function (e) {
        chkPermission(e);
    });
}

function getReportedErrors() {
    firebase.database().ref('data/pe4/errors').once('value').then(function(snapshot) {
        appVoca.errorObjs = snapshot.val() || {};
        mapErrorsToAppVocaData(appVoca.errorObjs);
    }, function (e) {
        chkPermission(e);
    });
}

function refreshVocaFromDbForMod() { //every time a moderator changes data in the exam
    var pe4exams;
    
    firebase.database().ref('data/pe4/exams').once('value').then(function(snapshot) {
        pe4exams = snapshot.val();

        if (pe4exams !== null) {
            appVoca.data = pe4exams.ledata || {};
            appVoca.texts = pe4exams.letexts || {};
        }
        firebase.database().ref('data/pe4/pending').once('value').then(function(snapshot) {
            appVoca.pending.userCreated = snapshot.val() || {};
            populatePendingList();
            getReportedErrors();
        }, function (e) {
            chkPermission(e);
            return;
        });
    }, function (e) {
        chkPermission(e);
        return;
    });
}

function overwriteExistingExamObjInDb(uid, newExamObj) { //a moderator overwrites the uid @ data.exams with new data NO DELETE! (:use downgrade)
    var updates = {};
    var errKeys,
        errUid;
        
    if (!newExamObj.hasOwnProperty("allowTsk")) { return; } //an exam obj MUST have an allowTsk prop (false is delete)
    if (!newExamObj.allowTsk.length) { return; } //an allowTsk prop must have length
    if (newExamObj.hasOwnProperty("hasError")) {
        errKeys = Object.keys(newExamObj.hasError);
        errKeys.forEach( function (el) {
            if (newExamObj.hasError[el].resolved === true) {
                errUid = "" + el;
                updates['data/pe4/errors/' + errUid] = null;
                delete newExamObj.hasError[el];
            }
        });
        if (Object.keys(newExamObj.hasError).length === 0) {
            delete newExamObj.hasError;
        }
    }
    updates['data/pe4/exams/ledata/' + uid] = newExamObj;

    firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
        } else {
            window.mscAlert({ title: "", subtitle: "The exam has been updated!" });

            if (newExamObj.hasError !== undefined) { 
                renderLoadingSelectedExamWordHasError(newExamObj);
            }
            touchFooContainersToRemoveEl(uid, false);
            appVoca.settings.refresh.uid = uid;
            appVoca.settings.refresh.cat = "exam";
            refreshVocaFromDbForMod();
        }
    });
}

function modCreateNewExamObj(uid, newExamObj) {  //a moderator pushes an upgraded pending word or a new exam word (uid == undefined) to the exam
    var updates = {};
    var newPostKey;

    if (!newExamObj.hasOwnProperty("allowTsk")) { return; } //an exam obj MUST have an allowTsk prop
    if (!newExamObj.allowTsk.length) { return; } //an allowTsk prop must have length
    if (uid !== undefined) {
        updates['data/pe4/pending/' + uid] = null;
    }
    newPostKey = firebase.database().ref().child('data/pe4/exams/ledata/').push().key;
    updates['data/pe4/exams/ledata/' + newPostKey] = newExamObj;

    firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
        } else {
            window.mscAlert({ title: "", subtitle: "The exam has been updated!" });
            touchFooContainersToAddEl(newPostKey, newExamObj.en, newExamObj.book);
            appVoca.settings.refresh.uid = newPostKey;
            appVoca.settings.refresh.cat = "exam";
            refreshVocaFromDbForMod();
        }
    });
}

function touchPendingListElForMatch() {
    var uid = appVoca.settings.refresh.uid;
    var cat = appVoca.settings.refresh.cat;
    var elId,
        els,
        len,
        i;

    if (cat !== "exam" && cat !== "pending") { return; }
    if (cat === "exam") { elId = "currentVocaErrors"; }
    if (cat === "pending") { elId = "pendingList"; }

    els = Array.from(docEl(elId).querySelectorAll("div.btn"));
    len = els.length;

    for (i = 0; i < len; i++) {
        if (uid === els[i].dataset.uid) {
            highlightMatchInPendingList(els[i], cat);
            break;
        }
    }
    appVoca.settings.refresh.uid = "";
    appVoca.settings.refresh.cat = "";
}

function downgradeExistingExamObjInDb(uid, newPendingObj) {
    var updates = {};
    var newPostKey,
        errKeys,
        errUid;

    if (newPendingObj.hasOwnProperty("allowTsk")) { return; } //a pending obj MUST NOT have an allowTsk prop
    if (newPendingObj.hasOwnProperty("hasError")) {
        errKeys = Object.keys(newPendingObj.hasError);
        errKeys.forEach( function (el) {
            errUid = "" + el;
            updates['data/pe4/errors/' + errUid] = null;
        });
        delete newPendingObj.hasError;
    }
    newPostKey = firebase.database().ref().child('data/pe4/pending/').push().key;
    updates['data/pe4/pending/' + newPostKey] = newPendingObj;
    updates['data/pe4/exams/ledata/' + uid] = null;

    firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
        } else {
            window.mscAlert({ title: "", subtitle: "The exam has been updated!" });
            touchFooContainersToRemoveEl(uid, true);
            clearAllowTskBfgChkboxes();
            clearErrorInfo();
            appVoca.settings.refresh.uid = newPostKey;
            appVoca.settings.refresh.cat = "pending";
            refreshVocaFromDbForMod();
        }
    });
}

/*********************** moderator functionality *******************/

//TODO: when searching for matched elements by typing into TARGET WORD, use .previewHighlighted class (opacity 0.7)
//- .previewSelected is for when the element is clicked 

//NEXT TODO! very important!!
//TODO: when exam voca is updated, all li.s in tsk boxes 1-4 need to be rechecked for allowTsk, and moved back into "foo" if !allowed


function downgradeExamWordIntoPendingList(elParent, uid) { //from delete btn on moderator list
    var isTsk5tgt = wordIsTsk5Tgt(appVoca.data[uid].en);
    var newPendingObj;

    elParent.style.display = "none";

    if (isTsk5tgt === true) {
        elParent.style.display = "block";
        window.mscAlert({ title: "", subtitle: "The word cannot be removed from the exam because it is being used in task 5!" });
        return;
    }
    newPendingObj = finalizeNewDowngradedExamObj(appVoca.data[uid]);
    downgradeExistingExamObjInDb(uid, newPendingObj);
}

function finalizeNewDowngradedExamObj(refObj) {
    var user = firebase.auth().currentUser.displayName;
    var newPendingObj = JSON.parse(JSON.stringify(refObj)); 
    
    delete newPendingObj.allowTsk;
    newPendingObj.requestBy = user;
    newPendingObj.lastModBy = user;

    if (!newPendingObj.exam.hasOwnProperty("syn")) {
        newPendingObj.exam.syn = { af: "", ans: "", b4: "", dis1: "", dis2: "", di3: "" };
    }
    if (!newPendingObj.practice.hasOwnProperty("syn")) {
        newPendingObj.practice.syn = { af: "", ans: "", b4: "", dis1: "", dis2: "", di3: "" };
    }
    if (!newPendingObj.exam.hasOwnProperty("gmr")) {
        newPendingObj.exam.gmr = { af: "", ans: "", b4: "", dis1: "", dis2: "" };
    }
    if (!newPendingObj.practice.hasOwnProperty("gmr")) {
        newPendingObj.practice.gmr = { af: "", b4: "", dis1: "", dis2: "", di3: "" };
    }    
    if (!newPendingObj.exam.hasOwnProperty("col")) {
        newPendingObj.exam.col = { pos: "", ans1: "", ans2: "", ans3: "", dis1: "", dis2: "", di3: "" };
    }
    if (!newPendingObj.practice.hasOwnProperty("col")) {
        newPendingObj.practice.col = { pos: "", ans1: "", ans2: "", ans3: "", dis1: "", dis2: "", di3: "" };
    }
    return newPendingObj; 
}

function wordIsTsk5Tgt(propEn) {
    var textKeys = Object.keys(appVoca.texts);
    var bool = false;

    textKeys.forEach( function(el) {
        if (appVoca.texts[el].tgts.indexOf(propEn) !== -1) {
            bool = true;
        }
    });
    return bool;
}

function finishLoadingSelectedExamWord(refObj) {
    var mapObj = {syn: "modSynAllowTsk", gmr: "modGmrAllowTsk", col: "modColAllowTsk"};
    var containerKeys = Object.keys(mapObj);

    if (refObj.hasOwnProperty("hasError")) {
        renderLoadingSelectedExamWordHasError(refObj);
    }
    containerKeys.forEach( function(el) { //set the chkboxes for the exam word that is being loaded for editing
        if (refObj.allowTsk.indexOf(el) !== -1 && refObj.exam.hasOwnProperty(el)) {
            docEl(mapObj[el]).childNodes[0].checked = true;
        }
    });
}

function clearAllowTskBfgChkboxes() {
    docEl("modSynAllowTsk").childNodes[0].checked = false;
    docEl("modGmrAllowTsk").childNodes[0].checked = false;
    docEl("modColAllowTsk").childNodes[0].checked = false;
}

function renderLoadingSelectedExamWordHasError(refObj) { //refObj: appVoca.data[uid]
    var container = docEl("errorInfo");
    var errKeys = Object.keys(refObj.hasError);
    var frag = document.createDocumentFragment();
    var newDiv,
        newSpan0,
        newSpan1,
        newBr,
        newInput,
        newLabel;

    emptyContent(container);
    
    errKeys.forEach( function(el, i) {
        newDiv = document.createElement("DIV");
        newSpan0 = document.createElement("SPAN");
        newSpan1 = document.createElement("SPAN");
        newBr = document.createElement("BR");
        newInput = document.createElement("INPUT");
        newLabel = document.createElement("LABEL");

        newDiv.className = "col-lg-12";
        newSpan0.textContent = "*Possible error ";
        newSpan1.textContent = "" + calcErrorTaskTxtContent(appVoca.errorObjs[el].task) + " " + appVoca.errorObjs[el].user + " reports: \"" + appVoca.errorObjs[el].descr + "\"";
        newInput.type = "checkbox";
        newInput.id = "errResolvChkbx-" + i;
        newInput.checked = refObj.hasError[el].resolved; //true || false ...should not exist if true!
        newInput.dataset.errUid = el;
        newInput.style.marginRight = 5 + "px";
        newLabel.htmlFor = "errResolvChkbx-" + i;
        newLabel.textContent = "Resolve";
    
        newDiv.appendChild(newSpan0);
        newDiv.appendChild(newSpan1);
        newDiv.appendChild(newBr);
        newDiv.appendChild(newInput);
        newDiv.appendChild(newLabel);
        frag.appendChild(newDiv);
    });
    container.appendChild(frag);
}

function calcErrorTaskTxtContent(tskStr) {
    var mappd = {syn: "in Task 1/Task 2 (synomyms/sentences). ", gmr: "in Task 3 (grammar). ", col: "in Task 4 (collocations). "};

    return mappd[tskStr] || "";
}

function mapErrorsToAppVocaData(refObj) { //refObj = appVoca.errorObjs
    var keys = Object.keys(refObj);
    var tgtObj;

    if (!keys.length) {
        populateModeratorList();
        return;
    }
    keys.forEach( function(el) { //{ uid: {resolved: false}, uid: {resolved: false}, uid: {resolved: false}... }
        tgtObj = appVoca.data[refObj[el].uid];
        if (tgtObj !== undefined){
            if (!tgtObj.hasOwnProperty("hasError")) {
                tgtObj.hasError = {};
            }
            tgtObj.hasError[el] = {resolved: false};
        }
    });
    populateModeratorList();
}

function populateModeratorList() { 
    var uids = Object.keys(appVoca.data).sort( function(a,b) { return (appVoca.data[a].en).localeCompare(appVoca.data[b].en); });
    var container = docEl("currentVocaErrors");
    var frag = document.createDocumentFragment();
    var uidsWithErrorsArr,
        uidsOkArr,
        newDiv,
        newSpan;

    emptyContent(container);

    uidsWithErrorsArr = uids.filter( function(el){ return appVoca.data[el].hasOwnProperty("hasError"); });
    uidsOkArr = uids.filter( function(el){ return !appVoca.data[el].hasOwnProperty("hasError"); });
    
    uidsWithErrorsArr.forEach( function(el){
        newDiv = document.createElement("DIV");
        newSpan = document.createElement("SPAN");

        newDiv.className = "btn btn-sm btn-error btn-block";
        newDiv.dataset.uid = el;
        newDiv.textContent = "*" + appVoca.data[el].en;
        newSpan.dataset.uid = el;
        newSpan.className = "btn btn-xs btn-default absR-btn";
        newSpan.textContent = "X";

        newDiv.appendChild(newSpan);
        frag.appendChild(newDiv);
    });
    uidsOkArr.forEach( function(el){
        newDiv = document.createElement("DIV");
        newSpan = document.createElement("SPAN");

        newDiv.className = "btn btn-sm btn-default btn-block";
        newDiv.dataset.uid = el;
        newDiv.textContent = appVoca.data[el].en;
        newSpan.dataset.uid = el;
        newSpan.className = "btn btn-xs btn-default absR-btn";
        newSpan.textContent = "X";

        newDiv.appendChild(newSpan);
        frag.appendChild(newDiv);
    });
    container.appendChild(frag);
    touchPendingListElForMatch();
}

function renderModEditingAllowTskChkboxes() {
    var containers = ["modSynAllowTsk", "modGmrAllowTsk", "modColAllowTsk"];
    var frag,
        newInput;

    containers.forEach( function(el) {
        frag = document.createDocumentFragment();
        newInput = document.createElement("INPUT");

        newInput.type = "checkbox";

        frag.appendChild(newInput);
        docEl(el).appendChild(frag);
    });
}

function touchFooContainersToAddEl(newPostKey, eng, book) {
    var tgtUid = "" + newPostKey;

    createLiForFoo("foo", tgtUid, eng, book);
}

function touchFooContainersToRemoveEl(uid, bool) {
    var tgtUid = "" + uid;
    var tgtEl = (Array.from(docEl("tsks1To4Divs").querySelectorAll("li.category"))).filter( function(el) { return el.dataset.uid === tgtUid; })[0];

    if (tgtEl !== undefined) {
        if (tgtEl.classList.contains("previewSelected")) {
            emptyContent(docEl("previewExamExmpl"));
            emptyContent(docEl("previewPracticeExmpl"));
            exitErrorInData();
        }
        if (bool === true) {
            tgtEl.parentElement.removeChild(tgtEl);
        } else {
            tgtEl.className = tgtEl.className.replace(/(?:^|\s)previewSelected(?!\S)/g, '');
        }
    }
}

/************************ class filters (from online practice) **********************************/

function setDatesForClssFilters() {
    var today = Date.now();
    var before = today - 13148719167; //-5 months
    var future = today + 13148719167; //+5 months

    return { a: new Date(before).toISOString().substring(0, 10), b: new Date(future).toISOString().substring(0, 10) };
}

function renderClssFilters(clsses) {
    var container = docEl("cls-filters");
    var frag = document.createDocumentFragment();
    var defaultDates = setDatesForClssFilters();
    var newBtn0;
    var newDiv0 = document.createElement("DIV");
    var newInput0 = document.createElement("INPUT");
    var newLbl0 = document.createElement("LABEL");
    var newInput1 = document.createElement("INPUT");
    var newLbl1 = document.createElement("LABEL");
    var newInput2 = document.createElement("INPUT");
    var newLbl2 = document.createElement("LABEL");
    var newInput3 = document.createElement("INPUT");
    var newInput4 = document.createElement("INPUT");

    clsses.forEach( function(el) {
        newBtn0 = document.createElement("BUTTON");
        newBtn0.dataset.cls = el;
        newBtn0.className = "btn btn-xs btn-onlineClss";
        newBtn0.textContent = el;
        frag.appendChild(newBtn0);
    });
    newDiv0.className = "cls-filter-tsks";
    newInput0.type = "radio";
    newInput0.id = "cFd0";
    newInput0.name = "clsFltrDrone";
    newInput0.value = "syn";
    newInput0.checked = "true";
    newLbl0.htmlFor = "cFd0";
    newLbl0.textContent = "Task I, II";
    newInput1.type = "radio";
    newInput1.id = "cFd1";
    newInput1.name = "clsFltrDrone";
    newInput1.value = "gmr";
    newLbl1.htmlFor = "cFd1";
    newLbl1.textContent = "Task III";
    newInput2.type = "radio";
    newInput2.id = "cFd2";
    newInput2.name = "clsFltrDrone";
    newInput2.value = "col";
    newLbl2.htmlFor = "cFd2";
    newLbl2.textContent = "Task IV";
    newInput3.type = "date";
    newInput3.value = defaultDates.a;
    newInput4.type = "date";
    newInput4.value = defaultDates.b;

    newDiv0.appendChild(newInput0);
    newDiv0.appendChild(newLbl0);
    newDiv0.appendChild(newInput1);
    newDiv0.appendChild(newLbl1);
    newDiv0.appendChild(newInput2);
    newDiv0.appendChild(newLbl2);
    newDiv0.appendChild(newInput3);
    newDiv0.appendChild(newInput4);
    frag.appendChild(newDiv0);
    container.appendChild(frag);
}

function triggerClssFilters(arr) {
    var dataKeys,
        clsses,
        tempEnArr;

    if (!arr.length) { return; }
   
    dataKeys = Object.keys(appVoca.data);
    appVoca.practiceArr = arr.map(function (el) { return { en: el.en, forClss: el.forClss, availFrom: el.availFrom, availTo: el.availTo, practiceTsk: el.practiceTsk }; });
    tempEnArr = appVoca.practiceArr.map(function (el) { return el.en; });

    dataKeys.forEach( function(elem) {
        tempEnArr.forEach( function(el, i) {
            if (appVoca.data[elem].en === el) {
                appVoca.practiceArr[i].key = elem;
            }
        });
    });
    clsses = appVoca.practiceArr.map( function(el) { 
        return el.forClss; 
    }).reduce( function(acc, val) { 
        return acc.concat(val);
    },[] ).filter( function(el, idx, arr){ 
        return el !== undefined && arr.indexOf(el) === idx; 
    });
    renderClssFilters(clsses);
}

//orig. MOD
function getPracticeFromDb() {
    var user = firebase.auth().currentUser;
    var arr;
    
    firebase.database().ref('practice/' + user.uid).once('value').then(function(snapshot) {
        arr = snapshot.val() || [];
        triggerClssFilters(arr);
    }, function (e) {
        chkPermission(e);
        return;
    });
}

function filterByClss(el) {
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "BUTTON") {
            toggleOnlineClssBtn(el.target);
        } else if (el.target.nodeName === "INPUT" && el.target.type === "radio") {
            triggerClssHighlighting(undefined, el.target.value);
        }
    }
    el.stopPropagation();
}

function clearClssHighlightingInTasksAndFoo() {
    var els = Array.from(docEl("tsks1To4Divs").querySelectorAll("li.category.btn-onlineClss"));

    els.forEach(function (elem) {
        elem.className = elem.className.replace(/(?:^|\s)btn-onlineClss(?!\S)/g, '');
    });
}

function toggleOnlineClssBtn(el) {
    var elsActive;

    if (el.classList.contains("active")) {
        el.className = el.className.replace(/(?:^|\s)active(?!\S)/g, '');
        clearClssHighlightingInTasksAndFoo();
    } else {
        elsActive = Array.from(docEl("cls-filters").querySelectorAll("button.active"));

        elsActive.forEach(function (elem) {
            elem.className = elem.className.replace(/(?:^|\s)active(?!\S)/g, '');
        });
        el.className += " active";
        triggerClssHighlighting(el.dataset.cls, undefined);
    }
}

function triggerClssHighlighting(clss, tsk) {
    var arg,
        dates;

    clearClssHighlightingInTasksAndFoo();

    if (clss == undefined) {
        arg = Array.from(docEl("cls-filters").querySelectorAll("button.active"));

        if (!arg.length) { return; }
        clss = arg[0].dataset.cls;
    }
    if (tsk == undefined) {
        arg = Array.from(docEl("cls-filters").querySelectorAll("input[type='radio']:checked"));

        if (!arg.length) { return; }
        tsk = arg[0].value; 
    }
    arg = Array.from(docEl("cls-filters").querySelectorAll("input[type='date']"));

    try { 
        dates = {a: Date.parse(arg[0].value), b: Date.parse(arg[1].value)};
    }
    catch(e) {
        dates = setDatesForClssFilters();
    }
    highlightOnlinePracticeByClss(clss, tsk, dates.a, dates.b);
}

function highlightOnlinePracticeByClss(clss, tsk, availFrom, availTo) {
    var liEls = Array.from(docEl("tsks1To4Divs").querySelectorAll("li.category"));
    var uidsArr = appVoca.practiceArr.filter( function(el) {
        return el.forClss.indexOf(clss) !== -1 && el.practiceTsk.indexOf(tsk) !== -1 && availFrom <= el.availFrom && availTo >= el.availTo;
      }).map( function(elem) {
        return elem.key;
      }).filter( function(ele, idx, arr){ return arr.indexOf(ele) === idx; });

    liEls.forEach( function(el) {
        if (uidsArr.indexOf(el.dataset.uid) !== -1) {
            el.className += " btn-onlineClss";
        }
    });
}

/*********************** init  *******************/

function initFailed(e) {
    var user,
        updates;

    emptyContent(docEl("fullNav"));
    emptyContent(docEl("fullVocaLists"));
    emptyContent(docEl("fullLayout"));
    emptyContent(docEl("fullRequest"));
    emptyContent(docEl("reqAllColDistractors"));
    emptyContent(docEl("fullPrevious"));
    showEl("welcomeMsg");

    if (e.code === "PERMISSION_DENIED"){
        user = firebase.auth().currentUser;

        if (user) {
            buildWelcomeMsg(user.displayName);
            updates = {};
            updates['newUser/pe4/' + user.uid] = user.displayName;
            firebase.database().ref().update( updates ).then( window.setTimeout( signOutOfApp, 7000 ) );
        } else {
            signOutOfApp(); //window.location = "../index.html";
        }
    }
}

function buildWelcomeMsg(name) {
    var container = docEl("welcomeMsg");
    var frag = document.createDocumentFragment();
    var newDiv0 = document.createElement("DIV");
    var newDiv1 = document.createElement("DIV");
    var newH2 = document.createElement("H2");
    var newP = document.createElement("P");
    var nme = capitalizeUserName(name);

    newDiv0.className = "row contentBox";
    newDiv0.style.marginTop = 80 + "px";
    newDiv1.className = "col-lg-12 text-left";
    newH2.textContent = "Access denied";
    newP.textContent = "Hello " + nme + "! If you are known to us, access will soon be granted.";

    newDiv1.appendChild(newH2);
    newDiv1.appendChild(newP);
    newDiv0.appendChild(newDiv1);
    frag.appendChild(newDiv0);
    container.appendChild(frag);
}

function initApp() {
    getVocaFromDb();
}

function startApp() {
    populateFoo("foo", appVoca.data);
    populateFoo("foo2", appVoca.texts);
    makeSortables();
    calculateSettings();
    docEl("currentDate").textContent = appVoca.settings.date;
    handlersOn();
    showEl("fullVocaLists");
    showEl("screenButtons");
    showEl("examType");
    showEl("spanB4examVersion");
    showEl("examVersion");
    showEl("currentDate");
    getPracticeFromDb();
}

})();
});