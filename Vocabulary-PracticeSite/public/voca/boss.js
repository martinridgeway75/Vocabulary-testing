window.addEventListener('load', function() {
(function(){
 "use strict";

//var appEditor = { "users": { "current":{}, "pending":{}, "removed":{}, "absentPending":{} } };
var appEditor = { "users": {},"records": {} };

//window.addEventListener('load', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            docEl("usrPhoto").src = user.photoURL;
            chkForOpts();
        } else {
            // User is signed out...
            window.location = "../index.html";
        }
    });
//});

function chkPermission(e) {
    if (e.code === "PERMISSION_DENIED"){
        signOutOfApp();
    }
}

function signOutOfApp() {
    firebase.auth().signOut(); //thus prompting the authState observer...
}

function docEl(id) { 
    return document.getElementById(id); 
}

function showEl(elId) {
    docEl(elId).className = docEl(elId).className.replace(/(?:^|\s)nodisplay(?!\S)/g, '');
}

function emptyContent(parentEl) {
    while (parentEl.hasChildNodes()) {
        while (parentEl.lastChild.hasChildNodes()) {
            parentEl.lastChild.removeChild(parentEl.lastChild.lastChild);
        }
        parentEl.removeChild(parentEl.lastChild);
    }
}

function isObjEmpty(obj) {
    if (obj === null) {
        return true;
    }
    else if (typeof obj !== "object") {
        return true;
    } else {
        return Object.keys(obj).length === 0; //true if obj is empty, false if has prop.s
    }
}

function chkForOpts() {
    firebase.database().ref('studentUser').once('value').then(function(snapshot) {
        //appEditor.users.current = snapshot.val() || {};
        appEditor.users = snapshot.val() || {};

        firebase.database().ref('activities').once('value').then(function(snapshot) {
            //appEditor.users.pending = snapshot.val() || {};
            appEditor.records = snapshot.val() || {};
            //buildBossOpts();
            buildUserRecords();
        });
    }, function (e) {
        chkPermission(e);
    });
}

function buildUserRecords() {
    var userKeys = Object.keys(appEditor.users);   //[email, uName]
    var container = docEl("manageOpts");
    var frag = document.createDocumentFragment();
    var userDiv,
        recFrag;

    emptyContent(container);
    
    userKeys.forEach( function(uid) {
        recFrag = createTableForRecords(uid);
        userDiv = document.createElement("div");
        userDiv.className = "btn btn-block btn-whiteBlue";
        userDiv.dataset.uid = uid;
        userDiv.textContent = "" + appEditor.users[uid].uName + " (" + appEditor.users[uid].email + ")";

        if (recFrag !== null) {
            frag.appendChild(userDiv);
            frag.appendChild(recFrag);
        }
    });
    container.appendChild(frag);
    showEl("manageOpts");
    //showEl("optActions");
}

function toTime(num, isSec) {
    var unit = isSec ? num * 1e3 : num;
    var limit = ~(4 * !!isSec);
    var format = new Date(unit).toISOString().slice(11, limit);
    var parts;

    if (unit >= 8.64e7) {  /* 8.64e7 == 24 hours */
        parts = format.split(/:(?=\d{2}:)/);
        parts[0] -= -24 * (unit / 8.64e7 | 0);
        return parts.join(':');
    }
    return format;
}

function formatFrag(frag) {
    return frag == "" ? "null" : "" + frag;
}

function createTableForRecords(uid) {
    var rcrds = appEditor.records[uid]; 
    var keys,
        props,
        headers,
        len,
        frag,
        tbl,
        tblBody,
        tblTr,
        tblHdr,
        tblTh,
        tblTd,
        i,
        dt;

    if (rcrds == undefined) {
        return null;
    }
    keys = Object.keys(rcrds);
    rcrds = keys.map( function(el) { return rcrds[el]; }).sort( function(a,b) { return b.timestamp - a.timestamp }); 
    props = ['tchr', 'clss', 'frag', 'activity', 'score', 'duration', 'timestamp'];
    headers = ['Teacher', 'Class', 'ID', 'Activity', 'Score', 'Duration', 'Date & Time'];
    len = props.length;
    frag = document.createDocumentFragment();
    tbl = document.createElement("TABLE");
    tblHdr = document.createElement("THEAD");
    tblBody = document.createElement("TBODY");
    tblTr = document.createElement("TR");

    tbl.className = "table table-condensed table-striped";

    for (i = 0; i < len; i++) {
        tblTh = document.createElement("TH");
        tblTh.textContent = headers[i];
        tblTr.appendChild(tblTh);
    }
    tblHdr.appendChild(tblTr);
    tbl.appendChild(tblHdr);

    rcrds.forEach( function(elem) {
        tblTr = document.createElement("TR");

        for (i = 0; i < len; i++) {
            tblTd = document.createElement("TD");

            if (props[i] === 'timestamp') {
                try {
                    dt = new Date(elem[props[i]]).toISOString();
                } catch (e) {
                    tblTd.textContent = "";
                }
                tblTd.textContent = dt;
            } else if (props[i] === 'duration') {
                tblTd.textContent = toTime(elem[props[i]], false);
            } else if (props[i] === 'frag') {
                tblTd.textContent = formatFrag(elem[props[i]]);
            } else {
                tblTd.textContent = elem[props[i]];
            }
            tblTr.appendChild(tblTd);
        }
        tblBody.appendChild(tblTr);
    });
    tbl.appendChild(tblBody);
    frag.appendChild(tbl);
    return frag;
}






















// function updateUsersDb() {
//     var updates = {};
//     var currentUids = Object.keys(appEditor.users.current);
//     var pendingUids = Object.keys(appEditor.users.pending);
//     var absentPendingUids = Object.keys(appEditor.users.absentPending);

//     currentUids.forEach( function(uid) {
//         updates['spkTchrList/' + uid] = appEditor.users.current[uid];
//     });
//     pendingUids.forEach( function(uid) {
//         updates['newUser/spk/' + uid] = appEditor.users.pending[uid];
//     });
//     absentPendingUids.forEach( function(uid) {
//         updates['newUser/spk/' + uid] = null;
//     });

//     firebase.database().ref().update(updates, function(e) {
//         if (e) {
//             chkPermission(e);
//             window.mscAlert({
//                 title: '', 
//                 subtitle: 'Data could not be updated.\n' + e
//             });
//         } else {
//             window.mscAlert({
//                 title: '',
//                 subtitle: 'Changes saved!'
//             });
//             appEditor.users.absentPending = {};
//             buildBossOpts();
//         }
//     });
// }

// function unrepresentedUsersPending(pendingEls, pendingObj) {
//     var currentPendingUids = Object.keys(pendingObj);
//     var proposedPending = {};
//     var returnObj = {};

//     pendingEls.forEach( function (el) {
//         proposedPending[el.dataset.uid] = el.dataset.name;
//     });
//     currentPendingUids.forEach( function (el) {
//         if (!proposedPending.hasOwnProperty(el)) {
//             returnObj[el] = pendingObj[el];
//         }
//     });
//     return returnObj;
// }

// function optsUpdateUsers() {
//     var pendingObj = JSON.parse(JSON.stringify(appEditor.users.pending));
//     var pendingEls = docEl("manageOpts").querySelectorAll(".btn-default");
//     var tchrEls = docEl("manageOpts").querySelectorAll(".btn-success");

//     appEditor.users.absentPending = unrepresentedUsersPending(pendingEls, pendingObj);
//     appEditor.users.removed = {};
//     appEditor.users.current = {};
//     appEditor.users.pending = {};

//     tchrEls.forEach( function (el) {
//         appEditor.users.current[el.dataset.uid] = el.dataset.name;
//     });
//     pendingEls.forEach( function (el) {
//         appEditor.users.pending[el.dataset.uid] = el.dataset.name;
//     });
//     updateUsersDb();
// }

// function chkForRemovedAccess() {
//     var tchrEls = docEl("manageOpts").querySelectorAll(".btn-success");
//     var currentUserUids = Object.keys(appEditor.users.current);
//     var proposedUsers = {};

//     tchrEls.forEach( function (el) {
//         proposedUsers[el.dataset.uid] = el.dataset.name;
//     });
//     currentUserUids.forEach( function (el) { //only checking for removed spkTchrList el.s
//         if (!proposedUsers.hasOwnProperty(el)) {
//             appEditor.users.removed[el] = appEditor.users.current[el];
//         }
//     });

//     if (!isObjEmpty(appEditor.users.removed)) {
//         window.mscConfirm({
//             title: 'Warning',
//             subtitle: 'This action will remove access for some current users.\nTheir data will also be permanently deleted.\nAre you sure?',
//             cancelText: 'Exit', 
//             onOk: function () {
//                 removeCurrentUsersData();
//             }, 
//             onCancel: function () {
//                 return;
//             }
//         });
//     } else {
//         optsUpdateUsers();
//     }
// }

// function removeCurrentUsersData() { //delete currentUser && data under: 'assessments/' + uid
//     var uidArr = Object.keys(appEditor.users.removed);
//     var updates = {};

//     uidArr.forEach( function (uid) {
//         updates['assessments/' + uid] = null;
//         updates['spkTchrList/' + uid] = null;
//     });        

//     firebase.database().ref().update(updates, function(e) {
//         if (e) {
//             chkPermission(e);
//             window.mscAlert({
//                 title: '', 
//                 subtitle: 'User data could not be removed.\n' + e
//             });
//         } else {
//             optsUpdateUsers();
//         }
//     });
// }

// function purgePendingFromDb() {
//     var updates = {};
//     var pendingArr = Object.keys(appEditor.users.pending);

//     pendingArr.forEach( function (el) {
//         updates['newUser/spk/' + el] = null; 
//     });
//     firebase.database().ref().update(updates, function(e) {
//         if (e) {
//             chkPermission(e);
//             window.mscAlert({
//                 title: '', 
//                 subtitle: 'Users pending access could not be cleared.\n' + e
//             });
//         } else {
//             window.mscAlert({
//                 title: '',
//                 subtitle: 'Changes saved!'
//             });
//             appEditor.users.pending = {};
//             buildBossOpts();
//         }
//     });
// }

// function optsDeletePending() {
//     window.mscConfirm({
//         title: 'Warning',
//         subtitle: 'This action will delete all users awaiting access to the app. Proceed?',
//         cancelText: 'Exit', 
//         onOk: function () {
//             purgePendingFromDb();
//         }, 
//         onCancel: function () {
//             return;
//         }
//     });
// }

// function optsRevertUsers() {
//     chkForOpts();
// }

// function toggleUserBtnClass(targetEl) {
//     if (targetEl.classList.contains("btn-success")) {
//         targetEl.className = targetEl.className.replace(/(?:^|\s)btn-success(?!\S)/g, '');
//         targetEl.className += " btn-default";
//     } else {
//         targetEl.className = targetEl.className.replace(/(?:^|\s)btn-default(?!\S)/g, '');
//         targetEl.className += " btn-success";
//     }
// }

// function identifyOptsUser(el) {
//     if (el.target !== el.currentTarget) {
//         if (el.target.nodeName === "DIV") {
//             toggleUserBtnClass(el.target);
//         }
//         el.stopPropagation();
//     }
// }

// function buildBossOpts() { 
//     var container = docEl("manageOpts"); //main container
//     var frag = document.createDocumentFragment();
//     var userKeys = Object.keys(appEditor.users.current);
//     var pendKeys = Object.keys(appEditor.users.pending);
//     var userDiv,
//         pendDiv;

//     emptyContent(container);

//     userKeys.forEach( function(uid) {
//         userDiv = document.createElement("div");
//         userDiv.className = "btn btn-sm btn-success btn-fixwidth";
//         userDiv.dataset.uid = uid;
//         userDiv.dataset.name = appEditor.users.current[uid];
//         userDiv.textContent = appEditor.users.current[uid] + "\n" + uid;
//         frag.appendChild(userDiv);
//     });
//     pendKeys.forEach( function(uid) {
//         pendDiv = document.createElement("div");
//         pendDiv.className = "btn btn-sm btn-default btn-fixwidth";
//         pendDiv.dataset.uid = uid;
//         pendDiv.dataset.name = appEditor.users.pending[uid];
//         pendDiv.textContent = appEditor.users.pending[uid] + "\n" + uid;
//         frag.appendChild(pendDiv);
//     });
//     container.appendChild(frag);
//     showEl("manageOpts");
//     showEl("optActions");
// }

// function handlersOn() {
//     //docEl("manageOpts").addEventListener("click", identifyOptsUser, {capture: false, passive: true}); //toggles: btn-default <-> btn-success 
//     //docEl("updateUsers").addEventListener("click", chkForRemovedAccess, {capture: false, passive: true});
//     //docEl("deleteUsers").addEventListener("click", optsDeletePending, {capture: false, passive: true});
//     //docEl("revertUsers").addEventListener("click", optsRevertUsers, {capture: false, passive: true});
// }

//andlersOn();

})();
});