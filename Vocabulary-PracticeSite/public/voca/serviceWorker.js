/*global self*/
/*global caches*/
/*global fetch*/

var CACHE_NAME = "voca-practice-cache-v1.0";
var urlsToCache = [
    "../voca/activities/js/app.min.js",
    "../voca/activities/js/collocations.min.js",
    "../voca/activities/js/collocationsquiz.min.js",
    "../voca/activities/js/crossword.min.js",
    "../voca/activities/js/flashcards.min.js",
    "../voca/activities/js/galaga.min.js",
    "../voca/activities/js/grammarpuzzle.min.js",
    "../voca/activities/js/grammarquiz.min.js",
    "../voca/activities/js/hangman.min.js",
    "../voca/activities/js/interact.js",
    "../voca/activities/js/jquery-1.11.2.min.js",
    "../voca/activities/js/jquery.cycle2.min.js",
    "../voca/activities/js/jquery-ui.min.js",
    "../voca/activities/js/jquery-ui.touch-punch.min.js",
    "../voca/activities/js/matching.min.js",
    "../voca/activities/js/memory.min.js",
    "../voca/activities/js/slickquiz.min.js",
    "../voca/activities/js/studyguide.min.js",
    "../voca/activities/js/synonymsquiz.min.js",
    "../voca/activities/js/translations.min.js",
    "../voca/activities/js/utils.min.js",
    "../voca/activities/css/flashcards.min.css",
    "../voca/activities/css/matching.min.css",
    "../voca/activities/css/memory.css",
    "../voca/activities/css/slickquiz.css",
    "../voca/activities/css/twbs3.3.4.min.css",
    "../voca/activities/css/font/fontello.eot",
    "../voca/activities/css/font/fontello.svg",
    "../voca/activities/css/font/fontello.ttf",
    "../voca/activities/css/font/fontello.woff",
    "../voca/activities/css/font/fontello.woff2",
    "../voca/activities/images/enemy.png",
    "../voca/activities/images/enemychoice.png",
    "../voca/activities/images/enemychoiceselected.png",
    "../voca/activities/images/enemylaser.png",
    "../voca/activities/images/enemystem.png",
    "../voca/activities/images/enemystemselected.png",
    "../voca/activities/images/laser.png",
    "../voca/activities/images/planet.png",
    "../voca/activities/images/questionmark.png",
    "../voca/activities/images/ship.png",
    "../voca/activities/images/whiteBG.png",
    "../voca/activities/sound/deflect.mp3",
    "../voca/activities/sound/done.mp3",
    "../voca/activities/sound/enemylaser.mp3",
    "../voca/activities/sound/explosion.mp3",
    "../voca/activities/sound/laser.mp3",
    "../voca/activities/collocations.html",
    "../voca/activities/collocationsquiz.html",
    "../voca/activities/crossword.html",
    "../voca/activities/flashcards.html",
    "../voca/activities/galaga.html",
    "../voca/activities/grammarpuzzle.html",
    "../voca/activities/grammarquiz.html",
    "../voca/activities/h_ngm_n.html",
    "../voca/activities/matching.html",
    "../voca/activities/memory.html",
    "../voca/activities/studyguide.html",
    "../voca/activities/synonymsquiz.html",
    "../voca/activities/translations.html"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});