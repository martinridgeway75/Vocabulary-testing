/*global window*/
/*global firebase*/
/*global document*/

window.addEventListener('load', function() {
(function(){
 "use strict";

var appEditor = { "tempIdxArr": [], "users": { "tchrs": {}, "pending":{}, "removed":{}, "absentPending":{} } };

//window.addEventListener('load', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            docEl("usrPhoto").src = user.photoURL;
            getAllUsers();
            handlersOn();
            showEl("contentsBox");
            showEl("screenButtons");
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

function getAllUsers() {
    var bossUid = firebase.auth().currentUser.uid;
    var tchrArr,
        len;

    firebase.database().ref('tchrList/pe4/pe4TchrIndex').once('value').then(function(snapshot) {
        tchrArr = snapshot.val() || [];

        if (tchrArr.indexOf(bossUid) === -1) {
            tchrArr.unshift(bossUid);
        }
        len = tchrArr.length - 1;

        if (len === 0) {
            appEditor.users.tchrs[bossUid] = {
                name: firebase.auth().currentUser.displayName, 
                isMod: true
            };
            getAllPending();
            return;
        }
        tchrArr.forEach( function(el, i) {
            getEachTchr(el, i, len);
        });
    }, function (e) {
        chkPermission(e);
    });
}

function getEachTchr(el, i, len) {
    firebase.database().ref('tchrList/pe4/' + el).once('value').then(function(snapshot) {
        if (snapshot.val() !== null) {
            appEditor.users.tchrs[el] = snapshot.val();
        }
        if (i === len) {
            getAllPending();
        }
    }, function (e) {
        chkPermission(e);
    });
}

function getAllPending() {
    firebase.database().ref('newUser/pe4').once('value').then(function(snapshot) {
        appEditor.users.pending = snapshot.val() || {};        
        buildBossOpts();
    }, function (e) {
        chkPermission(e);
    });
}

function toggleTchrBtnClass(el) {
    if (el.classList.contains("btn-success")) { //tchr -> moderator
        el.className = el.className.replace(/(?:^|\s)btn-success(?!\S)/g, '');
        el.className += " btn-primary";
        el.dataset.isMod = "yes";
        return;
    }
    if (el.classList.contains("btn-primary")) { //moderator -> pendingTchr
        el.className = el.className.replace(/(?:^|\s)btn-primary(?!\S)/g, '');
        el.className += " btn-default";        
        el.dataset.isMod = "no";
        return;
    }
    //pendingTchr -> tchr
    el.className = el.className.replace(/(?:^|\s)btn-default(?!\S)/g, '');
    el.className += " btn-success";
    el.dataset.isMod = "no";
}

function updateUsersDb() {
    var updates = {};
    var currentUids = Object.keys(appEditor.users.tchrs);
    var pendingUids = Object.keys(appEditor.users.pending);
    var absentPendingUids = Object.keys(appEditor.users.absentPending);

    currentUids.forEach( function(uid) {
        updates['tchrList/pe4/' + uid] = appEditor.users.tchrs[uid];
        updates['tchrList/pe4/pe4TchrIndex'] = Object.keys(appEditor.users.tchrs);
    });
    pendingUids.forEach( function(uid) {
        updates['newUser/pe4/' + uid] = appEditor.users.pending[uid];
    });
    absentPendingUids.forEach( function(uid) { //formerly pending, now captured as a tchr...
        updates['newUser/pe4/' + uid] = null;
    });

    firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
            window.mscAlert({
                title: '', 
                subtitle: 'Data could not be updated.\n' + e
            });
        } else {
            window.mscAlert({
                title: '',
                subtitle: 'Changes saved!'
            });
            appEditor.users.absentPending = {};
            buildBossOpts();
        }
    });
}

function unrepresentedUsersPending(pendingEls, pendObj) { //formerly pending, now captured as a tchr...
    var currentPendUids = Object.keys(pendObj);
    var futurePendObj = {};
    var returnObj = {};

    pendingEls.forEach( function (el) {
        futurePendObj[el.dataset.uid] = el.dataset.name;
    });
    currentPendUids.forEach( function (el) {
        if (!futurePendObj.hasOwnProperty(el)) {
            returnObj[el] = pendObj[el];
        }
    });
    return returnObj;
}

function optsUpdateUsers() {
    var pendObj = JSON.parse(JSON.stringify(appEditor.users.pending)); //or: pendObj = [appEditor.users.pending].slice(0)[0];
    var bossUid = firebase.auth().currentUser.uid;
    var container = docEl("manageOpts");
    var pendingEls = Array.from(container.querySelectorAll("div.btn.btn-default"));
    var tchrEls = Array.from(container.querySelectorAll("div.btn.btn-success"));
    var moderatorEls = Array.from(container.querySelectorAll("div.btn.btn-primary"));
    var futureUserEls = [tchrEls, moderatorEls].reduce( function(acc, val) { return acc.concat(val); },[] );

    appEditor.users.absentPending = unrepresentedUsersPending(pendingEls, pendObj);
    appEditor.users.removed = [];
    appEditor.users.tchrs = {};
    appEditor.users.pending = {};

    futureUserEls.forEach( function(el) {
        appEditor.users.tchrs[el.dataset.uid] = {};
        appEditor.users.tchrs[el.dataset.uid].name = el.dataset.name;

        if (el.dataset.isMod === "yes" || el.dataset.uid === bossUid) {
            appEditor.users.tchrs[el.dataset.uid].isMod = true;
        }
    });
    pendingEls.forEach( function(el) {
        if (el.dataset.uid === bossUid) {
            appEditor.users.tchrs[el.dataset.uid] = {};
            appEditor.users.tchrs[el.dataset.uid].name = el.dataset.name;
            appEditor.users.tchrs[el.dataset.uid].isMod = true;
        } else {
            appEditor.users.pending[el.dataset.uid] = el.dataset.name; //string only, not an object
        }
    });
    updateUsersDb();
}

function chkForRemovedAccess() {
    var bossUid = firebase.auth().currentUser.uid;
    var container = docEl("manageOpts");
    var tchrEls = (Array.from(container.querySelectorAll("div.btn.btn-success"))).map(function(el) { return el.dataset.uid; });
    var modEls = (Array.from(container.querySelectorAll("div.btn.btn-primary"))).map(function(el) { return el.dataset.uid; });
    var currentUids = Object.keys(appEditor.users.tchrs);
    var futureUids = [tchrEls, modEls].reduce( function(acc, val) { return acc.concat(val); },[] );

    if (futureUids.indexOf(bossUid) === -1) {
        futureUids.push(bossUid);
    }
    appEditor.users.removed = currentUids.filter( function(el) { return futureUids.indexOf(el) === -1; });

    if (appEditor.users.removed.length) {
        window.mscConfirm({
            title: 'Warning',
            subtitle: 'This action will remove access for some current users. Are you sure?',
            cancelText: 'Exit', 
            onOk: function () {
                promptRemovedUserData();
            }, 
            onCancel: function () {
                return;
            }
        });
    } else {
        optsUpdateUsers();
    }
}

function promptRemovedUserData() {
    window.mscConfirm({
        title: '',
        subtitle: 'Do you also want to delete any previous exams created by users with removed access?',
        cancelText: 'No',
        onOk: function () {
            removeCurrentUsersData(true);
        }, 
        onCancel: function () {
            removeCurrentUsersData(false);
        }
    });
}

function removeCurrentUsersData(bool) { //bool == true: delete currentUser && data under: 'data/pe4/' + uid + '/examObjs'
    var uidArr = appEditor.users.removed;
    var updates = {};

    uidArr.forEach( function (uid) {
        if (bool === true) {
            updates['data/pe4/' + uid + '/examObjs'] = null;
        }
        updates['tchrList/pe4/' + uid] = null;
    });        

    firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
            window.mscAlert({
                title: '', 
                subtitle: 'User data could not be removed.\n' + e
            });
        } else {
            optsUpdateUsers();
        }
    });
}

function purgePendingFromDb() {
    var updates = {};
    var pendingArr = Object.keys(appEditor.users.pending);

    pendingArr.forEach( function (el) {
        updates['newUser/pe4/' + el] = null;
    });
    firebase.database().ref().update(updates, function(e) {
        if (e) {
            chkPermission(e);
            window.mscAlert({
                title: '', 
                subtitle: 'Users awaiting access could not be deleted.\n' + e
            });
        } else {
            window.mscAlert({
                title: '',
                subtitle: 'No users awaiting access!'
            });
            appEditor.users.pending = {};
            buildBossOpts();
        }
    });
}

function optsDeletePending() {
    window.mscConfirm({
        title: 'Warning',
        subtitle: 'This action will delete the login attempts of all users awaiting access to the app. Proceed?',
        cancelText: 'Exit', 
        onOk: function () {
            purgePendingFromDb();
        }, 
        onCancel: function () {
            return;
        }
    });
}

function optsRevertUsers() {
    getAllUsers();
}

function identifyOptsUser(el) {
    if (el.target !== el.currentTarget) {
        if (el.target.nodeName === "DIV" && el.target.dataset.uid !== undefined) {
            toggleTchrBtnClass(el.target);
        }
        el.stopPropagation();
    }
}

function buildBossOpts() {
    var bossUid = firebase.auth().currentUser.uid;
    var container = docEl("manageOpts"); //main container
    var frag = document.createDocumentFragment();
    var tchrKeys = Object.keys(appEditor.users.tchrs);
    var pendKeys = Object.keys(appEditor.users.pending);
    var userDiv,
        pendDiv;

    emptyContent(container);

    tchrKeys.forEach( function(el) {
        userDiv = document.createElement("div");

        userDiv.dataset.uid = el;
        userDiv.dataset.name = appEditor.users.tchrs[el].name;
        userDiv.dataset.isMod = appEditor.users.tchrs[el].isMod === true ? "yes" : "no"; //undefined || true
        userDiv.textContent = appEditor.users.tchrs[el].name + "\n" + el;

        if (bossUid === el) {
            userDiv.dataset.isMod = "yes";  //boss always has moderator priviledges
            userDiv.className = "btn btn-sm btn-primary btn-fixwidth";
            userDiv.style.display = "none";
            userDiv.style.visibility = "hidden";

        } else if (userDiv.dataset.isMod === "yes") {
            userDiv.className = "btn btn-sm btn-primary btn-fixwidth";
        } else {
            userDiv.className = "btn btn-sm btn-success btn-fixwidth";
        }
        frag.appendChild(userDiv);
    });

    pendKeys.forEach( function(el) {
        pendDiv = document.createElement("div");
        pendDiv.className = "btn btn-sm btn-default btn-fixwidth";
        pendDiv.dataset.uid = el;
        pendDiv.dataset.name = appEditor.users.pending[el]; //value is string, not object!
        userDiv.dataset.isMod = "no";
        pendDiv.textContent = appEditor.users.pending[el] + "\n" + el;
        frag.appendChild(pendDiv);
    });
    container.appendChild(frag);
    showEl("manageOpts");
    showEl("optActions");
}

function handlersOn() {
    docEl("manageOpts").addEventListener("click", identifyOptsUser, {capture: false, passive: true});
    docEl("updateUsers").addEventListener("click", chkForRemovedAccess, {capture: false, passive: true});
    docEl("deleteUsers").addEventListener("click", optsDeletePending, {capture: false, passive: true});
    docEl("revertUsers").addEventListener("click", optsRevertUsers, {capture: false, passive: true});
    docEl("logout").addEventListener("click", signOutOfApp, {capture: false, passive: true});
}

})();
});