/*global window*/
/*global document*/
/*global docEl*/

window.addEventListener('load', function() {
(function(){
     "use strict";

    var trObj = {"tchr":"","clss":"", "frag": "","vocaList": [] };

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

    function handlersOn() {
        navListenersOn();
        docEl("chgSelected").addEventListener("click", updateClss, {capture: false, passive: true});
    }

    function buildVocaTable(vocaObjArr) {
        var container = docEl("translationsTbl");
        var frag = document.createDocumentFragment();
        var today = Date.now();
        var tblTr,
            tblEn,
            tblKr;

        vocaObjArr.forEach( function (el) {
            if (today >= el.availFrom && today <= el.availTo) {
                tblTr = document.createElement("tr");
                tblEn = document.createElement("td");
                tblKr = document.createElement("td");

                tblEn.textContent = el.en;
                tblKr.textContent = el.kr;

                tblTr.appendChild(tblEn);
                tblTr.appendChild(tblKr);
                frag.appendChild(tblTr);
            }
        });
        container.appendChild(frag);          
    }
    
function dataError() {
    docEl("slctdTchrTxt").textContent = "Class unknown!";
}

function init() {
    var objExists = window.localStorage.getItem("myClss");
    var data = JSON.parse(objExists);

    if (data !== null) {
        try {
            trObj.tchr = data.tchr;
            trObj.clss = data.clss;
            if (data.hasOwnProperty("frag") && chkTrk(data.frag) === true) {
                trObj.frag = data.frag;
            }
            trObj.vocaList = data.voca;
            buildVocaTable(trObj.vocaList);
        }
        catch(e) {
            trObj.tchr = "";
            trObj.clss = "";
            trObj.vocaList = [];
            dataError();
        }
        docEl("slctdTchrTxt").textContent = "" + trObj.clss + " " + trObj.tchr + " " + trObj.frag;
        renderNav();
    }
    else {
        dataError();
        return;
    }
    handlersOn();
}

})();
});