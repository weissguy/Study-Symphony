var playpauseminiButton = document.getElementById("playpausemini");
var nextminiButton = document.getElementById("nextminibutton");
var backminiButton = document.getElementById("backminibutton");
var songInfo = document.getElementById("song_info");
var body = document.getElementsByTagName("body")[0];

var intros = ["Let's get started with some funky fresh tunes.", "Go ahead, click play. You know you wanna.", "What better time to jam out to hard rock? Or pagan chants?"];
var intro;
var html_id;
var html_open;
var lastProductivityTime;
var elapsedTime;


// update the body class with correct background from chrome.storage.sync
chrome.storage.sync.get("background", function(result) {
    body.classList.toggle(result.background);
});


chrome.tabs.query({url: "chrome-extension://*/video.html"}, function(tabs) {

    if (tabs.length === 1) { // if tabs has one entry (the video.html page),
        
        html_id = tabs[0].id; // use this id variable for all future communication with video.html
        html_open = true; // establish that video.html has been opened

        // upon start, query video.js for player state
        chrome.tabs.sendMessage(html_id, {action: "get_player_state"}, function(response) {
            if (response.new_playing_state) {
                playpauseminiButton.classList.toggle("playing");
                playpauseminiButton.classList.remove("paused");
            } else {
                playpauseminiButton.classList.toggle("paused");
                playpauseminiButton.classList.remove("playing");
            }
        });

        // query video.js for video info
        chrome.tabs.sendMessage(html_id, {action: "get_video_info"}, function(response) {
            // update song info in popup accordingly
            songInfo.innerHTML = `Playing <i>"${response.title}",</i> by <i>${response.artist}</i>`;
        });

        addUserInput();

    } else { // if tabs is empty b/c video.html is not yet open,
        
        html_open = false;

        playpauseminiButton.classList.toggle("paused");
        playpauseminiButton.classList.remove("playing");

        // post random intro message
        intro = intros[Math.floor(Math.random()*intros.length)];
        songInfo.innerHTML = intro; // `<i>${intro}</i>`;
    }

});


// when playpause button is clicked,
playpauseminiButton.addEventListener("click", function() {
    if (!html_open) { // if video.html is not yet open, then open it
        openHTML();
    } else { // otherwise, control play/pause, next, back functions
        playpausemini();
    }
});

nextminiButton.addEventListener("click", function() {
    next();
});

backminiButton.addEventListener("click", function() {
    back();
})

function addUserInput() {

    chrome.tabs.sendMessage(html_id, {action: "get_video_info"}, function(response) {

        var idNumber = response.idNumber;

        var currentTime = new Date().getTime();
        if (lastProductivityTime === undefined) lastProductivityTime = response.sessionStartTime;
        alert("time since last producitivity question: " + (currentTime-lastProductivityTime));
        elapsedTime = currentTime-lastProductivityTime;
        if ((response.confidence >= 0.5 || response.user_review !== -1) && (elapsedTime < 60000)) return;

        // increase popup height
        document.body.style.height = "240px";

        // create div at bottom of popup to hold input
        var inputDiv = document.createElement("div");
        inputDiv.style.cssText = "margin-top:20px;height:80px;width:100%;background:white";
        document.body.appendChild(inputDiv);

        // create text for question
        var inputLabel = document.createElement("label");
        inputLabel.htmlFor = "inputbox";
        inputLabel.style.cssText = "margin-left: 8px;font-size:13px;font-family: Trebuchet MS, Lucida Sans Unicode, Lucida Grande, Lucida Sans, Arial, sans-serif;margin-top: 4px;";

        // create input space for how much they enjoy the song/current productivity
        var inputInput = document.createElement("input");
        inputInput.id = "inputbox";
        inputInput.style.cssText = "margin-left:8px;outline:none;border:0;border-radius:2px;box-shadow: 0 0 15px 4px rgba(0,0,0,0.1);";
        inputInput.type = "number";
        inputInput.max = 10;
        inputInput.min = 0;
        inputInput.placeholder = 0;
        inputDiv.appendChild(inputInput);

        // create submit button to confirm input value complete
        var inputSubmit = document.createElement("input");
        inputSubmit.type = "submit";
        inputSubmit.style.cssText = "margin-left: 100px";
        inputDiv.appendChild(inputSubmit);

        if ((response.confidence < 0.5) && (response.user_review === -1)) { // if song confidence is low and user hasn't answered yet,

            inputLabel.innerHTML = "On a scale from 1-10, how much you do like this song?";
            inputDiv.insertBefore(inputLabel, inputDiv.getElementsByTagName("input")[0]);

            inputSubmit.addEventListener("click", () => {
                // if input is blank, return
                if (inputInput.value === "" || inputInput.value === "0") return;
                // update user review variable for song in session storage
                chrome.tabs.sendMessage(html_id, {action: "update_user_review", idNumber: idNumber, user_review: inputInput.value});
                // fade away div to show that input has been received
                inputDiv.style.height = "0px";
                inputDiv.style.opacity = "0";
                inputDiv.style.transition = "height 1s, opacity 1s";
                inputLabel.remove();
                inputInput.remove();
                inputSubmit.remove();
                document.body.style.height = "170px";
                document.body.style.transition = "height 1s";
            });

        } else { // if (user hasn't answered productivity in past 10 minutes)
            inputLabel.innerHTML = "On a scale from 1-10, how would you rate your current productivity?";
            inputDiv.insertBefore(inputLabel, inputDiv.getElementsByTagName("input")[0]);

            // update current productivity variable in chrome.storage.sync
            inputSubmit.addEventListener("click", () => {
                // if input is blank, return
                if (inputInput.value === "" || inputInput.value === "0") return;
                // update user review variable for song in session storage
                chrome.tabs.sendMessage(html_id, {action: "add_productivity", time: currentTime, productivity: parseInt(inputInput.value)});
                // fade away div to show that input has been received
                inputDiv.style.height = "0px";
                inputDiv.style.opacity = "0";
                inputDiv.style.transition = "height 1s, opacity 1s";
                inputLabel.remove();
                inputInput.remove();
                inputSubmit.remove();
                document.body.style.height = "170px";
                document.body.style.transition = "height 1s";
            });

            lastProductivityTime = new Date().getTime();
            elapsedTime = currentTime-lastProductivityTime;

        }

    });
}

function openHTML() {
    window.open("video.html", "_blank");
}


function playpausemini() {
    // send message to video.js that there is a change of state + update playpause
    chrome.tabs.sendMessage(html_id, {action: "change_player_state"}, function(response) {
        if (response.new_playing_state) {
            playpauseminiButton.classList.toggle("playing");
            playpauseminiButton.classList.remove("paused");
        } else {
            playpauseminiButton.classList.toggle("paused");
            playpauseminiButton.classList.remove("playing");
        }
    });
}

function next() {

    // send message to video.js that should go to next video
    chrome.tabs.sendMessage(html_id, {action: "next_video"});

    playpauseminiButton.classList.toggle("playing");
    playpauseminiButton.classList.remove("paused");

    // query for new song info
    chrome.tabs.sendMessage(html_id, {action: "get_video_info"}, function(response) {
        // update song info in popup accordingly
        songInfo.innerHTML = `Playing <i>"${response.title}",</i> by <i>${response.artist}</i>`;
    });

    // if there is no extra div yet, add a div for user input accordingly
    if (document.getElementsByTagName("div").length === 1) {removeUserInput()};

}

function back() {

    // send message to video.js that should go back to last video
    chrome.tabs.sendMessage(html_id, {action: "back_video"});

    playpauseminiButton.classList.toggle("playing");
    playpauseminiButton.classList.remove("paused");

    // query for new song info
    chrome.tabs.sendMessage(html_id, {action: "get_video_info"}, function(response) {
        // update song info in popup accordingly
        songInfo.innerHTML = `Playing <i>"${response.title}",</i> by <i>${response.artist}</i>`;
    });

    // if there is no extra div yet, add a div for user input accordingly
    if (document.getElementsByTagName("div").length === 1) {addUserInput()};

}