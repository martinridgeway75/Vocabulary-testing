/*global window*/
/*global document*/

window.addEventListener('load', function() {
(function(){
     "use strict";

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

    function init() {
        var objExists = window.localStorage.getItem("myClss");
        var data = JSON.parse(objExists);
        var txt;

        if (data !== null) {
            try {
                txt = "" + (data.clss || "") + " " + (data.tchr || "");
            }
            catch(e) {
                dataError();
            }
            docEl("slctdTchrTxt").textContent = txt;
        }
        else {
            dataError();
        }
        renderNav();
        handlersOn();
    }

})();
});