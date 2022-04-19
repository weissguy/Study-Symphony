// input video youtube id + info from scrape.js, display in webpage
// send ids, id#, and id to session storage; send skipped genres, artists, lengths, etc. to local storage


// establishes script tags for YT player
var tag = document.createElement('script');
tag.src = `chrome-extension://${chrome.runtime.id}/iframe_api/iframe.js`;
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// initializes variables
var player;
var playing = true;
var ended;

// defines HTML elements
var playpauseButton = document.getElementById("playpause");
var nextButton = document.getElementById("nextbutton");
var backButton = document.getElementById("backbutton");
var iframe = document.getElementById("video");
var body = document.getElementsByTagName("body")[0];

// update the body class with correct background from chrome.storage.sync
chrome.storage.sync.get("background", function(result) {
    body.classList.toggle(result.background);
});

// sets the start time for the session
var startTime = new Date().getTime();
window.sessionStorage.setItem("startTime", startTime);


// listen for messages from popup.js requesting/sending info, and respond accordingly
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "change_player_state") {
            playpause();
            sendResponse({new_playing_state: (playing)});
        } else if (request.action === "get_player_state") {
            sendResponse({new_playing_state: (playing)});
        } else if (request.action === "next_video") {
            next();
        } else if (request.action === "back_video") {
            back();
        } else if (request.action === "get_video_info") {
            sendResponse({title: ids[idNumber]["title"], artist: ids[idNumber]["artist"], confidence: ids[idNumber]["confidence"], user_review: ids[idNumber]["user_review"], idNumber: idNumber, productivity: ids[idNumber]["productivity"]});
        } else if (request.action === "update_user_review") {
            // update user review per individual song with value from popup.js
            ids[request.idNumber]["user_review"] = parseInt(request.user_review);
            window.sessionStorage.setItem("ids", JSON.stringify(ids));
            // communicate w/ scrape.js that ids has been modified
            chrome.runtime.sendMessage({greeting: "ids_updated", new_ids: ids});
        } else if (request.action === "add_productivity") {
            // update productivity per individual song with value from popup.js
            ids[request.idNumber]["productivity"] = parseInt(request.productivity);
            window.sessionStorage.setItem("ids", JSON.stringify(ids));
            // communicate w/ scrape.js that ids has been modified
            chrome.runtime.sendMessage({greeting: "ids_updated", new_ids: ids});
        }
        return true;
    }
);


function onYouTubePlayerAPIReady() {

    if (window.sessionStorage.getItem("id") === null) {
        // posts initial video idvalues to session storage
        window.sessionStorage.setItem("ids", JSON.stringify(ids));
        window.sessionStorage.setItem("id#", idNumber);
        window.sessionStorage.setItem("id", id);
    }

    // creates YT player object
    player = new YT.Player('video', {
        height: "270",
        width: "480",
        videoId: id,
        events: {
            'onStateChange': onPlayerStateChange
        }
    });

    // gets updated video id info from session storage
    ids = JSON.parse(window.sessionStorage.getItem("ids"));
    idNumber = window.sessionStorage.getItem("id#");
    id = window.sessionStorage.getItem("id");

    start();

}

function onPlayerStateChange(event) {
    playing = (event.data === 1); // YT.PlayerState.PLAYING = 1
    ended = (event.data === 0); // YT.PlayerState.ENDED = 0

    autoNextIfEnded();

    // send message to popup.js (really all extension stuff) about playing state, to update playpauseminiButton class
    chrome.runtime.sendMessage({
        new_playing_state: (playing)
    });
}


// if the video has automatically started playing, enable functionality for all buttons
playpauseButton.addEventListener("click", function() {
    playpause();
});
nextButton.addEventListener("click", function() {
    next();
});
backButton.addEventListener("click", function() {
    back();
});


function start() {
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&showinfo=0&controls=0`;
    playing = true;
    playpauseButton.classList.toggle("playing");
    playpauseButton.classList.remove("paused");
    onPlayerStateChange({data: 1});
    // update the start time for the first song
    ids[idNumber]["start_time"] = startTime;
    window.sessionStorage.setItem("ids", JSON.stringify(ids));
}

function postUpdatedIds() {
    if (changeInIds) {
        // if scrape.js has added new ids, update ids
        window.sessionStorage.setItem("ids", ids);
        changeInIds = false;
        console.log("updated ids: " + ids);
    }
}

function autoNextIfEnded() {

    if (ended) {

        // if there was a change in ids, update in session storage
        postUpdatedIds();

        // add end time
        ids[idNumber]["end_time"] = new Date().getTime();

        // get new correct video id
        if (idNumber < ids.length-1) idNumber++;
        id = ids[idNumber]["id"];

        // add start time
        ids[idNumber]["start_time"] = new Date().getTime();

        // post values to session storage
        window.sessionStorage.setItem("id#", idNumber);
        window.sessionStorage.setItem("id", id);
        window.sessionStorage.setItem("ids", JSON.stringify(ids));

        // set iframe source to correct video
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&showinfo=0&controls=0`;
        //playing = true;
        onPlayerStateChange({data: 1});

        console.log("auto next! id: " + id);

    }
}

function playpause() {

    if (playing) {
        playpauseButton.classList.toggle("paused");
        playpauseButton.classList.remove("playing");

        player.pauseVideo();
        playing = false;
        console.log("pause!");
    } else {
        playpauseButton.classList.toggle("playing");
        playpauseButton.classList.remove("paused");

        player.playVideo();
        playing = true;
        console.log("play!");
    }

}

function next() {

    // if there was a change in ids, update in session storage
    postUpdatedIds();

    // add end time
    ids[idNumber]["end_time"] = new Date().getTime();

    // update ids to reflect that video was skipped
    if (player.getDuration() - player.getCurrentTime() < 30) return;
    ids[idNumber]["skipped"] = true;

    // get new correct video id
    if (idNumber < ids.length-1) idNumber++;
    id = ids[idNumber]["id"];

    // add start time
    ids[idNumber]["start_time"] = new Date().getTime();

    // post new values to session storage
    window.sessionStorage.setItem("id#", idNumber);
    window.sessionStorage.setItem("id", id);
    window.sessionStorage.setItem("ids", JSON.stringify(ids));

    // set iframe source to correct video
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&showinfo=0&controls=0`;
    //playing = true;
    onPlayerStateChange({data: 1});

    // send message to popup.js (really all extension stuff) about playing state, to update playpauseminiButton class
    chrome.runtime.sendMessage({
        new_playing_state: (playing),
    });

    console.log("next! id: " + id);

}

function back() {

    // if there was a change in ids, update in session storage
    postUpdatedIds();

    // if user immediately goes back to previous video, assume skipping was a mistake, and correct the skipped value
    if (player.getCurrentTime() < 5 && ids[idNumber-1]["skipped"]) ids[idNumber-1]["skipped"] = false;

    // get new correct video id (from scrape.js)
    if (idNumber >= 1) idNumber--;
    id = ids[idNumber]["id"];

    // post values to session storage
    window.sessionStorage.setItem("id#", idNumber);
    window.sessionStorage.setItem("id", id);

    // set iframe source to correct video
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&showinfo=0&controls=0`;
    //playing = true;
    onPlayerStateChange({data: 1});

    // send message to popup.js (really all extension stuff) about playing state, to update playpauseminiButton class
    chrome.runtime.sendMessage({
        new_playing_state: (playing),
    });

    console.log("back! id: " + id);

}


// FIXME when session closed, post session data to csv file 
chrome.runtime.onSuspend.addListener() // FIXME check to make sure this completes asynchronously before session ends