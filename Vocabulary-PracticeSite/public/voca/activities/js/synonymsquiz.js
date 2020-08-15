/*global $*/
/*global document*/
/*global window*/

window.addEventListener('load', function() {
(function(){
    "use strict";
    
var quizObj = {"time": 0,"tchr":"","clss":"", "frag": "","data":{"info":{"name":"Synonyms Quiz","main":"","results":"","level1":"well done! You know your synonyms!","level2":"you know a lot about synonyms!","level3":"you have some knowledge of synonyms. Keep studying!","level4":"practice more synonyms!","level5":"please practice more!"},"questions":[]}};

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
    
function convertObj(el) {
    var qObj = {};
    
    qObj.q = el.syn.b4 + " *" + el.en + "* " + el.syn.af;
    qObj.imc = "<p>&#x2713;&nbsp;&nbsp;Correct!</p>";
    qObj.inc = "<p>&#x2717;&nbsp;&nbsp;Incorrect!</p>";
    qObj.a = [
        {
            "option": el.syn.dis1,
            "imc": false
        },{
            "option": el.syn.dis2,
            "imc": false
        },{
            "option": el.syn.dis3,
            "imc":false
        },{
            "option":el.syn.ans,
            "imc":true
        }
    ];
    qObj.a = shuffleAnArray(qObj.a);
    return qObj;
}

function convertData(data) {
    var qObj;
    
    data.forEach (function (el){
        if(el.hasOwnProperty("syn")) {
            qObj = convertObj(el);
            quizObj.data.questions.push(qObj);
        }
    });
}
   
function init() {
    var objExists = window.localStorage.getItem("myClss");
    var data = JSON.parse(objExists);

    if (data !== null) {
        try {
            quizObj.tchr = data.tchr;
            quizObj.clss = data.clss;
            if (data.hasOwnProperty("frag") && chkTrk(data.frag) === true) {
                quizObj.frag = data.frag;
            }
            convertData(data.voca);
        }
        catch(e) {
            quizObj.tchr = "";
            quizObj.clss = "";
            quizObj.data.questions = [];
            dataError();
        }
        docEl("slctdTchrTxt").textContent = "" + quizObj.clss + " " + quizObj.tchr +  " " + quizObj.frag;
        
        if (!quizObj.data.questions.length) {
            $(function(){$('#slickQuiz').slickQuiz();});
        }
        else {
            quizObj.time = Date.now();
            $(function(){$('#slickQuiz').slickQuiz(
                { json:quizObj.data, events: { onCompleteQuiz: userScored } });
            });
        }
    }
    else {
        dataError();
    }
    renderNav();
    handlersOn();
}

function userScored(obj) {
    var score = "completed: " + obj.score + "/" + obj.questionCount;
    var timeStamp = Date.now();
    var duration = timeStamp - quizObj.time;

    postIt({ a: timeStamp, b: quizObj.tchr, c: quizObj.clss, d: quizObj.frag, e: duration, f: document.title, g: score });
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