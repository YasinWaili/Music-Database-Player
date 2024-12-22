let currentAudio = null;
let currentSongIndex = 0; 
let playlistQueue = [];

// Function to retrieve the requested songs in the database
  function getSongs() {
    // retrieve the text from the search bar
    const searchInput = document.querySelector('.search-bar').value.trim(); 
    const url = searchInput ? `/songs?search=${encodeURIComponent(searchInput)}` : '/songs';

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    // Make a request with /signup in server.js and query the data
    xhr.onload = function () {
        if (xhr.status === 200) {
            const songs = JSON.parse(xhr.responseText);
            // Display all the songs found
            displaySongs(songs);
        } else {
            console.error("Failed to fetch songs");
        }
    };

    xhr.onerror = function () {
        console.error("Error fetching songs");
    };

    xhr.send();
}

  // function to display songs that are retrieved from the database
function displaySongs(songs) {
    const songsContainer = document.querySelector('#songs-container'); 

    songsContainer.innerHTML = '';

    // if there are no songs retrieved from the get method then no results found
    if (!songs.length) {
        songsContainer.innerHTML = "<p>No results found.</p>";
    } else {
        songs.forEach((song) => {
            const songDiv = document.createElement('div');
            songDiv.className = "song-item";

            // getting the file path for the album cover
            const albumCoverPath = `/album_covers/${encodeURIComponent(song.album_title)}.png`;

            // Format song information and include album cover, Play, Pause, and Add to Playlist buttons
            songDiv.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <img src="${albumCoverPath}" alt="Album Cover" style="width: 100px; height: 100px; object-fit: cover; margin-right: 20px;">
                    <div>
                        <h3>${song.song_title}</h3>
                        <p>Album: ${song.album_title || "Unknown"}</p>
                        <p>Length: ${formatLength(song.length)}</p>
                        <p>Year: ${song.year}</p>
                        <p>Artist: ${song.artist}</p>
                        <p>Genre: ${song.genres}</p>
                        <div>
                            <button class="play-button" onclick="playSong('${song.song_title}')">Play</button>
                            <button class="pause-button" onclick="pauseSong('${song.song_title}')">Pause</button>
                        </div>
                    </div>
                </div>
            `;

            //Adding the Add to Playlist button dynamically
            const addButton = document.createElement('button');
            addButton.className = "add-to-playlist-button";
            addButton.textContent = "Add to Playlist";
            addButton.addEventListener('click', () => addToPlaylist(song));
            

            songDiv.appendChild(addButton); // add the button to the container
            songsContainer.appendChild(songDiv); // add each song to the container
        });
    }
}
 
// Function to calculate the minutes and seconds of the song length and return it
function formatLength(lengthInSeconds) {
    const minutes = Math.floor(lengthInSeconds / 60);
    const seconds = lengthInSeconds % 60;
    const formattedTime = (`${minutes}:${seconds.toString().padStart(2, '0')}`);
    return formattedTime;
}

// Function for playing the song audio
function playSong(songTitle) {
    // find the path to the mp3 fule
    const audioFilePath = `/audio/${songTitle}.mp3`;
    
    // Stop the currently playing audio if any
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
    }

    // Creating a new audio element
    const audio = new Audio(audioFilePath);
    currentAudio = audio;

    // Playing the audio
    audio.play();
  
    // Changing the Play button to Pause
    const playButton = document.querySelector(`button[onclick="playSong('${songTitle}')"]`);
    const pauseButton = document.querySelector(`button[onclick="pauseSong('${songTitle}')"]`);
    playButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
}

// Function to pause the song
function pauseSong(songTitle) {
    // pause the song if the audio is playing
    if (currentAudio) {
        currentAudio.pause();
        
        // Change the Pause button back to Play
        const playButton = document.querySelector(`button[onclick="playSong('${songTitle}')"]`);
        const pauseButton = document.querySelector(`button[onclick="pauseSong('${songTitle}')"]`);
        playButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
    }
}

// Function to add songs to the playlist
function addToPlaylist(song) {
    const xhr = new XMLHttpRequest();

    // Make a post request to /add-to-playlist in server.js
    xhr.open('POST', '/add-to-playlist', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        if (xhr.status === 200) {
            // If successfull, add the song in the playlist queue and update the display
            console.log(xhr.responseText);
            playlistQueue.push(song);
            displayPlaylist();
        } else {
            console.error("Failed to add song to playlist.");
        }
    };

    xhr.onerror = function () {
        console.error("Error adding song to playlist.");
    };

    xhr.send(JSON.stringify({ song_id: song.song_id }));
}

// Function to remove a song from the playlist queue 
function removeFromPlaylist(songTitle) {
    const song = playlistQueue.find(song => song.song_title === songTitle);

    if (!song) {
        console.error("Song not found in the playlist.");
        return;
    }

    const xhr = new XMLHttpRequest();
    // Make a post request to ./remove-from-playlist in server.js
    xhr.open('POST', '/remove-from-playlist', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        if (xhr.status === 200) {
            // if successful remove the song from the playlist queue and display the playlist
            console.log(xhr.responseText);
            playlistQueue = playlistQueue.filter(s => s.song_title !== songTitle);
            displayPlaylist();
        } else {
            console.error("Failed to remove song from playlist.");
        }
    };

    xhr.onerror = function () {
        console.error("Error removing song from playlist.");
    };

    xhr.send(JSON.stringify({ song_id: song.song_id }));
}


// Function to display the playlist songs
function displayPlaylist() {
    const playlistContainer = document.querySelector('#playlists-container'); // Select the playlist container

    // Clear any existing content
    playlistContainer.innerHTML = '';

    if (!playlistQueue.length) {
    } else {
        // Create a container for the control buttons
        const controlsContainer = document.createElement('div');
        controlsContainer.id = "playlist-controls";
        controlsContainer.style.display = "flex";
        controlsContainer.style.justifyContent = "space-around";
        controlsContainer.style.marginBottom = "20px";

        // Create Play button
        const playButton = document.createElement('button');
        playButton.textContent = "Play";
        playButton.className = "playlist-control-button";
        playButton.addEventListener('click', () => playPlaylist());

        // Create Pause button
        const pauseButton = document.createElement('button');
        pauseButton.textContent = "Pause";
        pauseButton.className = "playlist-control-button";
        pauseButton.addEventListener('click', () => pausePlaylist());

        // Create Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = "Next";
        nextButton.className = "playlist-control-button";
        nextButton.addEventListener('click', () => playNextSong());

        // Create Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = "Previous";
        prevButton.className = "playlist-control-button";
        prevButton.addEventListener('click', () => playPreviousSong());

        // Add buttons to the controls container
        controlsContainer.appendChild(playButton);
        controlsContainer.appendChild(pauseButton);
        controlsContainer.appendChild(nextButton);
        controlsContainer.appendChild(prevButton);

        // Append the controls container to the playlist container
        playlistContainer.appendChild(controlsContainer);

        // Display each song in the playlist queue
        playlistQueue.forEach((song) => {
            const playlistItem = document.createElement('div');
            playlistItem.className = "song-item";

            // Determine the album cover file path
            const albumCoverPath = `/album_covers/${encodeURIComponent(song.album_title)}.png`;

            // Format song information and include a Remove button
            playlistItem.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <img src="${albumCoverPath}" alt="Album Cover" style="width: 100px; height: 100px; object-fit: cover; margin-right: 20px;">
                    <div>
                        <h3>${song.song_title}</h3>
                        <p>Album: ${song.album_title || "Unknown"}</p>
                        <p>Length: ${formatLength(song.length)}</p>
                        <p>Artist: ${song.artist}</p>
                        <p>Genre: ${song.genres}</p>
                    </div>
                </div>
                <button class="remove-from-playlist-button" onclick="removeFromPlaylist('${song.song_title}')">Remove</button>
            `;

            playlistContainer.appendChild(playlistItem); // Append each song to the playlist container
        });
    }
}
// Function for the play button in the playlist
function playPlaylist() {
    // plays the current index song in the playlist
    if (playlistQueue.length > 0) {
        const currentSong = playlistQueue[currentSongIndex];
        playSong(currentSong.song_title);
    }
}

// Function for pause button in the playlist
function pausePlaylist() {
    // pauses the current index song in the playlist
    const currentSong = playlistQueue[currentSongIndex];
    pauseSong(currentSong.song_title);
}

// Function for next button in the  playlist
function playNextSong() {
    // increases the index, and wraps around if its the last value
    if (playlistQueue.length > 0) {
        currentSongIndex = (currentSongIndex + 1) % playlistQueue.length; 
        playPlaylist();
    }
}

// Function for the previous button in the playlist
function playPreviousSong() {
    // decreases the index, and wraps around if its the first song in index
    if (playlistQueue.length > 0) {
        currentSongIndex = (currentSongIndex - 1 + playlistQueue.length) % playlistQueue.length; 
        playPlaylist();
    }
}

// Function to retrieve all the songs in the users playlist
function loadUserPlaylist() {
    const xhr = new XMLHttpRequest();
    // Make a request to /user-playlist in server.js to get the playlist from the database
    xhr.open('GET', '/user-playlist', true);

    xhr.onload = function () {
        if (xhr.status === 200) {
            // if found then set the playlist queue to the songs found and update the playlist
            const songs = JSON.parse(xhr.responseText);
            playlistQueue = songs;
            displayPlaylist();
        } else {
            console.error("Failed to fetch user playlist.");
        }
    };

    xhr.onerror = function () {
        console.error("Error loading user playlist.");
    };

    xhr.send();
}