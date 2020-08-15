window.addEventListener('load', function() {
(function(){
    "use strict";

var cwObj = {"time":0,"tchr":"","clss":"", "frag": "","words":[],"clues":[],"countedLetters":0,"cellulose":0};    

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

/*https://github.com/satchamo/Crossword-Generator License MIT*/
// Each cell on the crossword grid is null or one of these
function CrosswordCell(letter){
    this.char = letter; // the actual letter for the cell on the crossword
    // If a word hits this cell going in the "across" direction, this will be a CrosswordCellNode
    this.across = null; 
    // If a word hits this cell going in the "down" direction, this will be a CrosswordCellNode
    this.down = null;
}

// You can tell if the Node is the start of a word (which is needed if you want to number the cells)
// and what word and clue it corresponds to (using the index)
function CrosswordCellNode(is_start_of_word, index){
    this.is_start_of_word = is_start_of_word;
    this.index = index; // use to map this node to its word or clue
}

function WordElement(word, index){
    this.word = word; // the actual word
    this.index = index; // use to map this node to its word or clue
}

function Crossword(words_in, clues_in, num_rows, num_cols){
    var GRID_ROWS = num_rows;
    var GRID_COLS = num_cols;
    // This is an index of the positions of the char in the crossword (so we know where we can potentially place words)
    // example {"a" : [{'row' : 10, 'col' : 5}, {'row' : 62, 'col' :17}], {'row' : 54, 'col' : 12}], "b" : [{'row' : 3, 'col' : 13}]} 
    // where the two item arrays are the row and column of where the letter occurs
    var char_index = {};
    // these words are the words that can't be placed on the crossword
    var bad_words;

    // returns the crossword grid that has the ratio closest to 1 or null if it can't build one
    this.getSquareGrid = function(max_tries){
        var best_grid = null;
        var best_ratio = 0;
        var ratio,
            a_grid,
            i;

        for( i = 0; i < max_tries; i++){
            a_grid = this.getGrid(1);

            if (a_grid == null) {continue;}
            ratio = Math.min(a_grid.length, a_grid[0].length) * 1.0 / Math.max(a_grid.length, a_grid[0].length);

            if (ratio > best_ratio) {
                best_grid = a_grid;
                best_ratio = ratio;
            }
            if(best_ratio == 1) {break;}
        }
        return best_grid;
    };

    // returns an abitrary grid, or null if it can't build one
    this.getGrid = function(max_tries){
        var start_dir,
            r, 
            rr,
            c, 
            cc,
            g,
            i,
            dir,
            word_element,
            groups,
            word_has_been_added_to_grid,
            word_el,
            best_position,
            tries;

        for (tries = 0; tries < max_tries; tries++) {
            clear(); // always start with a fresh grid and char_index
            // place the first word in the middle of the grid
            start_dir = randomDirection();
            r = Math.floor(grid.length / 2);
            c = Math.floor(grid[0].length / 2);
            word_element = word_elements[0];

            if(start_dir == "across"){
                c -= Math.floor(word_element.word.length/2);
            } else {
                r -= Math.floor(word_element.word.length/2);
            }

            if(canPlaceWordAt(word_element.word, r, c, start_dir) !== false){
                placeWordAt(word_element.word, word_element.index, r, c, start_dir);
            } else {
                bad_words = [word_element];
                return null;
            }
            // start with a group containing all the words (except the first)
            // as we go, we try to place each word in the group onto the grid
            // if the word can't go on the grid, we add that word to the next group 
            groups = [];
            groups.push(word_elements.slice(1));

            for (g = 0; g < groups.length; g++) {
                word_has_been_added_to_grid = false;
                // try to add all the words in this group to the grid
                for (i = 0; i < groups[g].length; i++) {
                    word_el = groups[g][i]; 
                    best_position = findPositionForWord(word_el.word);

                    if (!best_position) { 
                        // make the new group (if needed)
                        if (groups.length - 1 == g) {groups.push([]);}
                        // place the word in the next group
                        groups[g+1].push(word_el);
                    } else {
                        rr = best_position.row;
                        cc = best_position.col;
                        dir = best_position.direction;
                        placeWordAt(word_el.word, word_el.index, rr, cc, dir);
                        word_has_been_added_to_grid = true;						
                    }
                }
                // if we haven't made any progress, there is no point in going on to the next group
                if(!word_has_been_added_to_grid) {break;}
            }
            // no need to try again
            if (word_has_been_added_to_grid) {return minimizeGrid(); }
        }
        bad_words = groups[groups.length - 1];
        return null;
    };

    // returns the list of WordElements that can't fit on the crossword
    this.getBadWords = function(){
        return bad_words;
    };

    // get two arrays ("across" and "down") that contain objects describing the
    // topological position of the word (e.g. 1 is the first word starting from
    // the top left, going to the bottom right), the index of the word (in the
    // original input list), the clue, and the word itself
    this.getLegend = function(grid){
        var groups = {"across" : [], "down" : []};
        var position = 1;
        var r,
            c,
            cell,
            increment_position,
            index;

        for (r = 0; r < grid.length; r++) {	
            for (c = 0; c < grid[r].length; c++) {
                cell = grid[r][c];
                increment_position = false;
                // check across and down
                for (var k in groups) {
                    // does a word start here? (make sure the cell isn't null, first)
                    if (cell && cell[k] && cell[k].is_start_of_word) {
                        index = cell[k].index;
                        groups[k].push({"position" : position, "index" : index, "clue" : clues_in[index], "word" : words_in[index]});
                        increment_position = true;
                    }
                }
                if (increment_position) {position++;}
            }
        }
        return groups;
    };

    // move the grid onto the smallest grid that will fit it
    var minimizeGrid = function(){
        // find bounds
        var r_min = GRID_ROWS-1,
            r_max = 0,
            c_min = GRID_COLS-1,
            c_max = 0,
            r,
            r2,
            c,
            c2,
            cell,
            rows,
            cols,
            new_grid;

        for (r = 0; r < GRID_ROWS; r++) {
            for (c = 0; c < GRID_COLS; c++) {
                cell = grid[r][c];

                if (cell != null) {
                    if(r < r_min) r_min = r;
                    if(r > r_max) r_max = r;
                    if(c < c_min) c_min = c;
                    if(c > c_max) c_max = c;
                }
            }
        }
        // initialize new grid
        rows = r_max - r_min + 1; 
        cols = c_max - c_min + 1; 
        new_grid = new Array(rows);

        for (r = 0; r < rows; r++) {
            for ( c = 0; c < cols; c++) {
                new_grid[r] = new Array(cols);
            }
        }
        // copy the grid onto the smaller grid
        for (r = r_min, r2 = 0; r2 < rows; r++, r2++) {
            for (c = c_min, c2 = 0; c2 < cols; c++, c2++) {
                new_grid[r2][c2] = grid[r][c];
            }
        }
        return new_grid;        
    };

    // helper for placeWordAt();
    var addCellToGrid = function(word, index_of_word_in_input_list, index_of_char, r, c, direction){
        var char = word.charAt(index_of_char);
        var is_start_of_word;

        if(grid[r][c] == null){
            grid[r][c] = new CrosswordCell(char);
            // init the char_index for that character if needed
            if(!char_index[char]) {char_index[char] = [];}
            // add to index
            char_index[char].push({"row" : r, "col" : c});
        }
        is_start_of_word = index_of_char == 0;
        grid[r][c][direction] = new CrosswordCellNode(is_start_of_word, index_of_word_in_input_list);
    };

    // place the word at the row and col indicated (the first char goes there)
    // the next chars go to the right (across) or below (down), depending on the direction
    var placeWordAt = function(word, index_of_word_in_input_list, row, col, direction){
        var r,
            c,
            i;

        if (direction == "across") {
            for (c = col, i = 0; c < col + word.length; c++, i++) {
                addCellToGrid(word, index_of_word_in_input_list, i, row, c, direction);
            }
        } else if (direction == "down") {
            for (r = row, i = 0; r < row + word.length; r++, i++) {
                addCellToGrid(word, index_of_word_in_input_list, i, r, col, direction);
            }			
        } else {
            throw "Invalid Direction";	
        }
    };

    // you can only place a char where the space is blank, or when the same
    // character exists there already
    // returns false, if you can't place the char
    // 0 if you can place the char, but there is no intersection
    // 1 if you can place the char, and there is an intersection
    var canPlaceCharAt = function(char, row, col){
        // no intersection
        if(grid[row][col] == null) {return 0;}
        // intersection!
        if(grid[row][col].char == char) {return 1;}

        return false;
    };

    // determines if you can place a word at the row, column in the direction
    var canPlaceWordAt = function(word, row, col, direction){
        var intersections,
            is_empty,
            is_intersection,
            can_place_here,
            r,
            c,
            i,
            result;

        // out of bounds
        if(row < 0 || row >= grid.length || col < 0 || col >= grid[row].length) {return false;}

        if(direction == "across"){
            // out of bounds (word too long)
            if(col + word.length > grid[row].length) {return false;}
            // can't have a word directly to the left
            if(col - 1 >= 0 && grid[row][col - 1] != null) {return false;}
            // can't have word directly to the right
            if(col + word.length < grid[row].length && grid[row][col+word.length] != null) {return false;}

            // check the row above to make sure there isn't another word
            // running parallel. It is ok if there is a character above, only if
            // the character below it intersects with the current word
            for(r = row - 1, c = col, i = 0; r >= 0 && c < col + word.length; c++, i++){
                is_empty = grid[r][c] == null;
                is_intersection = grid[row][c] != null && grid[row][c].char == word.charAt(i);
                can_place_here = is_empty || is_intersection;
                if(!can_place_here) {return false;}
            }

            // same deal as above, we just search in the row below the word
            for(r = row + 1, c = col, i = 0; r < grid.length && c < col + word.length; c++, i++){
                is_empty = grid[r][c] == null;
                is_intersection = grid[row][c] != null && grid[row][c].char == word.charAt(i);
                can_place_here = is_empty || is_intersection;
                if(!can_place_here) {return false;}
            }

            // check to make sure we aren't overlapping a char (that doesn't match)
            // and get the count of intersections
            intersections = 0;
            for(c = col, i = 0; c < col + word.length; c++, i++){
                result = canPlaceCharAt(word.charAt(i), row, c);
                if(result === false) {return false;}
                intersections += result;
            }
        } else if(direction == "down"){
            // out of bounds
            if(row + word.length > grid.length) {return false;}
            // can't have a word directly above
            if(row - 1 >= 0 && grid[row - 1][col] != null) {return false;}
            // can't have a word directly below
            if(row + word.length < grid.length && grid[row+word.length][col] != null) {return false;}

            // check the column to the left to make sure there isn't another
            // word running parallel. It is ok if there is a character to the
            // left, only if the character to the right intersects with the
            // current word
            for(c = col - 1, r = row, i = 0; c >= 0 && r < row + word.length; r++, i++){
                is_empty = grid[r][c] == null;
                is_intersection = grid[r][col] != null && grid[r][col].char == word.charAt(i);
                can_place_here = is_empty || is_intersection;
                if(!can_place_here) {return false;}
            }

            // same deal, but look at the column to the right
            for(c = col + 1, r = row, i = 0; r < row + word.length && c < grid[r].length; r++, i++){
                is_empty = grid[r][c] == null;
                is_intersection = grid[r][col] != null && grid[r][col].char == word.charAt(i);
                can_place_here = is_empty || is_intersection;
                if(!can_place_here) {return false;}
            }

            // check to make sure we aren't overlapping a char (that doesn't match)
            // and get the count of intersections
            intersections = 0;
            for(r = row, i = 0; r < row + word.length; r++, i++){
                result = canPlaceCharAt(word.charAt(i, 1), r, col);
                if(result === false) {return false;}
                intersections += result;
            }
        } else {
            throw "Invalid Direction";	
        }
        return intersections;
    };

    var randomDirection = function(){
        return Math.floor(Math.random()*2) ? "across" : "down";
    };

    var findPositionForWord = function(word){ // check the char_index for every letter, and see if we can put it there in a direction
        var bests = [];
        var i,
            j,
            point,
            r,
            c,
            possible_locations_on_grid,
            intersections_across,
            intersections_down;

        for (i = 0; i < word.length; i++) {
            possible_locations_on_grid = char_index[word.charAt(i)];
            if (!possible_locations_on_grid) { continue; }
            for (j = 0; j < possible_locations_on_grid.length; j++) {
                point = possible_locations_on_grid[j];
                r = point.row;
                c = point.col;
                // the c - i, and r - i here compensate for the offset of character in the word
                intersections_across = canPlaceWordAt(word, r, c - i, "across");
                intersections_down = canPlaceWordAt(word, r - i, c, "down");

                if(intersections_across !== false)
                    bests.push({"intersections" : intersections_across, "row" : r, "col" : c - i, "direction" : "across"});
                if(intersections_down !== false)
                    bests.push({"intersections" : intersections_down, "row" : r - i, "col" : c, "direction" : "down"});
            }
        }

        if(bests.length == 0) return false;

        // find a good random position
        var best = bests[Math.floor(Math.random()*bests.length)];

        return best;
    };

    var clear = function(){
        var r, c;
        for (r = 0; r < grid.length; r++){
            for (c = 0; c < grid[r].length; c++){
                grid[r][c] = null;
            }
        }
        char_index = {};
    };

    // constructor
    if(words_in.length < 2) { throw new Error("A crossword must have at least 2 words");}
    if(words_in.length != clues_in.length) { throw new Error("The number of words must equal the number of clues"); }

    // build the grid;
    var grid = new Array(GRID_ROWS);
    var i;

    for (i = 0; i < GRID_ROWS; i++) {
        grid[i] = new Array(GRID_COLS);	
    }
    // build the element list (need to keep track of indexes in the originial input arrays)
    var word_elements = [];	
    for (i = 0; i < words_in.length; i++) {
        word_elements.push(new WordElement(words_in[i], i));
    }
    // I got this sorting idea from http://stackoverflow.com/questions/943113/algorithm-to-generate-a-crossword/1021800#1021800
    // seems to work well
    word_elements.sort(function(a, b){ return b.word.length - a.word.length; });
}

 var CrosswordUtils = {
    toHtml : function(grid){
        if(grid == null) { return; }
        
        var label = 1;
        var frag = document.createDocumentFragment();
        var newTbl = document.createElement("table");
        var r, 
            c,
            cell,
            is_start_of_word,
            char,
            css_class;
   
        newTbl.id = "xword";
        newTbl.className = "crossword";
        
        for (r = 0; r < grid.length; r++) {
            var newTr = document.createElement("tr");
            
            for (c = 0; c < grid[r].length; c++) {
                cell = grid[r][c];
                is_start_of_word = false;
                
                if (cell === null) {
                    char = " ";
                    css_class = "no-border";
                } 
                else {
                    char = cell.char;
                    css_class = "xword-cell";
                    is_start_of_word = (cell.across && cell.across.is_start_of_word) || (cell.down && cell.down.is_start_of_word);
                    cwObj.cellulose += 1;
                }
                var newTd = document.createElement("td");
                
                newTd.className = css_class;

                if(is_start_of_word) {
                    var newSpan = document.createElement("span");
                    
                    newSpan.textContent = label;
                    newTd.appendChild(newSpan);                    
                    label++;
                }
                if (cell !== null){
                    var newInput = document.createElement("input");
                    
                    newInput.dataset.alpha = char;
                    newInput.maxLength = "1";
                    newTd.appendChild(newInput);
                }
                newTr.appendChild(newTd);
            }
            newTbl.appendChild(newTr);
        }
        frag.appendChild(newTbl);
        return frag;
    }
};
   
function addLegendToPage(groups){
    var i;

    for(var k in groups){ //k is either: the string "across" or the string "down" (which happen to be the doc element id.s)
        var frag = document.createDocumentFragment();
        var len = groups[k].length;

        for(i = 0; i < len; i++){
            var newLi = document.createElement("li");
            var newSpan = document.createElement("span");
            var newTxtPos = document.createTextNode("" + groups[k][i].position + ". ");
            var newTxtClue = document.createTextNode("" + groups[k][i].clue);
            
            newSpan.style.fontWeight = 700;
            newSpan.appendChild(newTxtPos);
            newLi.appendChild(newSpan);
            newLi.appendChild(newTxtClue);
            frag.appendChild(newLi);
        }
        docEl(k).appendChild(frag);
    }
}    

function increaseCount() {
    cwObj.countedLetters += 1;

    if (cwObj.countedLetters === cwObj.cellulose) {
        cwObj.countedLetters = 0;
        userScored(cwObj.words.length);
    }
}

function chkInputChange(el) {
    if (el.target === el.currentTarget && el.target.nodeName === "INPUT") {
        if (el.target.attributes[0].value === el.target.value.toLowerCase()) { //data-alpha value
            el.target.removeEventListener("change", chkInputChange, {"capture":false, "passive": true});
            el.target.className += " done";
            el.target.disabled = "true";
            increaseCount();
        }
    }
    el.stopPropagation();    
}
  
function handlersOn() {
    navListenersOn();
    docEl("chgSelected").addEventListener("click", updateClss, {capture: false, passive: true});
    //need to attach to every input...
    var nodes = docEl("xword").querySelectorAll("input");
    var i;

    //iOS cant run forEach on a NodeList
    for (i = 0; i < nodes.length; i++) {
        nodes[i].addEventListener("change", chkInputChange, {"capture":false, "passive": true});
    }
}    
   
function tryAgain() {
    var idxOfLongestWord = 0;
    
    cwObj.words.forEach( function (el, i) { //splice the longest word and try again
       if (cwObj.words[idxOfLongestWord].length < cwObj.words[i].length) {
           idxOfLongestWord = i;
       } 
    });
    cwObj.words.splice(idxOfLongestWord, 1);
    cwObj.clues.splice(idxOfLongestWord, 1);
    buildXword();
}     
    
function showH3s() {
    var nodes = docEl("puzzle-hints").querySelectorAll("h3.nodisplay");
    var i;
    
    for (i = 0; i < nodes.length; i++) {
        nodes[i].className = "";
    }
}    
    
function buildXword() {
    // Create crossword object with the cwObj.words and cwObj.clues
    var cw = new Crossword(cwObj.words, cwObj.clues, 13, 13);
    // create the crossword grid (try to make it have a 1:1 width to height ratio in n tries)
    var tries = 100; 
    var grid = cw.getSquareGrid(tries);

    if (grid !== null) {
        //render the UI...
        var frag = CrosswordUtils.toHtml(grid, true);
        
        docEl("puzzle-holder").appendChild(frag);
        addLegendToPage(cw.getLegend(grid));
        showH3s();
        cwObj.time = Date.now();
    } else {
        if (cwObj.words.length > 5) { //just an arbitary number!
            tryAgain();
        }
        else {
            showEmpty();
        }
    }
}
  
function prepData(voca) {
    voca.forEach (function (el) {
        if (el.hasOwnProperty("syn")) {
            cwObj.words.push(el.en);
            cwObj.clues.push(el.syn.b4 + " ____ " + el.syn.af);
        }
    });
}    
    
function showEmpty() {
    docEl("puzzle-wrapper").style.display = "none";
    docEl("novoca").style.display = "block";
    cwObj.countedLetters = -1;
}    
    
function init() {
    var objExists = window.localStorage.getItem("myClss");
    var data = JSON.parse(objExists);

    if (data !== null) {
        try {
            prepData(data.voca);
            cwObj.tchr = data.tchr;
            cwObj.clss = data.clss;
            if (data.hasOwnProperty("frag") && chkTrk(data.frag) === true) {
                cwObj.frag = data.frag;
            } 
        }
        catch(e) {
            cwObj.tchr = "";
            cwObj.clss = "";
            cwObj.words = [];
            cwObj.clues = [];            
            dataError();
        }
        docEl("slctdTchrTxt").textContent = "" + cwObj.clss + " " + cwObj.tchr + " " + cwObj.frag;
    }
    else {
        dataError();
    }
    if (!cwObj.words.length || !cwObj.clues.length) {
        showEmpty();
    }
    else {
        buildXword();
    }    
    renderNav();
    handlersOn();
}

function userScored(scr) {
    var score = "completed: " + scr + "/" + scr;
    var timeStamp = Date.now();
    var duration = timeStamp - cwObj.time;

    postIt({ a: timeStamp, b: cwObj.tchr, c: cwObj.clss, d: cwObj.frag, e: duration, f: document.title, g: score });
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

//TODO: slice from main array and "continue..." until main array is depleted
    
})();
});