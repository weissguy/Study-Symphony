let genreButtons = document.getElementsByClassName("genre");
let genres;

let artistInputs = document.getElementsByTagName("input");
let artists;

let backgroundButtons = document.getElementsByClassName("background");
let background;


initGenres();
initArtists();
initBackgrounds();


function initGenres() {
    chrome.storage.sync.get("genres", function(result) {

        genres = result.genres;
        console.log("genres: " + genres);

        for (let i = 0; i < genreButtons.length; i++) {

            let genreButton = genreButtons[i];
            let genre = genres[i];
    
            if (genre) {
                genreButton.classList.toggle("likes");
            } else {
                genreButton.classList.toggle("nope");
            }
        }

        changeGenres();

    });
}

function initArtists() {
    chrome.storage.sync.get("artists", function(result) {

        artists = result.artists;
        console.log("artists: " + artists);

        for (let i = 0; i < artistInputs.length; i++) {

            let artistInput = artistInputs[i];
            let artist = artists[i];

            if (typeof artistInput.value !== undefined) { artistInput.value = artist; }
    
        }

        changeArtists();

    });
}

function initBackgrounds() {
    chrome.storage.sync.get("background", function(result) {

        background = result.background;
        console.log("background: " + background);

        for (let i = 0; i < backgroundButtons.length; i++) {

            let backgroundButton = backgroundButtons[i];

            if (backgroundButton.id === background) {
                backgroundButton.classList.toggle("selected");
                changeBackgrounds();
            }

        }

    });
}


function changeGenres() {

    for (let i = 0; i < genreButtons.length; i++) {

        let genreButton = genreButtons[i];
        let genre = genres[i];

        genreButton.addEventListener("click", function() { // when button clicked,
            if (genreButton.className === "genre nope") {
                genreButton.classList.toggle("likes"); // change css class
                genreButton.classList.remove("nope");

                genre = true; // set genre boolean value to match
            } else {
                genreButton.classList.toggle("nope");
                genreButton.classList.remove("likes");

                genre = false;
            }

            genres[i] = genre; // update options.js local "genres" variable
            chrome.storage.sync.set({ "genres" : genres }); // update "genres" variable in chrome.storage.sync

        })

    }
}

function changeArtists() {

    for (let i = 0; i < artistInputs.length; i++) {

        let artistInput = artistInputs[i];
        let artist = artists[i];

        artistInput.addEventListener("change", function() { // when input value changed,

            artist = artistInput.value; // set artist string value to match

            artists[i] = artist; // update options.js local "artists" variable
            chrome.storage.sync.set({ "artists" : artists }); // upadte "artists" variable in chrome.storage.sync

        })

    }
}

function changeBackgrounds() {

    for (let i = 0; i < backgroundButtons.length; i++) {

        let newBackgroundButton = backgroundButtons[i];

        newBackgroundButton.addEventListener("click", function() {

            let oldBackgroundButton = document.getElementsByClassName("selected")[0];
            oldBackgroundButton.classList.remove("selected");

            newBackgroundButton.classList.toggle("selected");
            background = newBackgroundButton.id;
            chrome.storage.sync.set({ "background" : background});

        })
    }
}