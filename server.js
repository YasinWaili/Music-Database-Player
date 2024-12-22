const express = require('express')
const https = require('https')
const axios = require('axios')
const sqlite3 = require('sqlite3').verbose() 
const db = new sqlite3.Database('data/db_songs')

const PORT = process.env.PORT || 3000 //allow environment variable to possible set PORT

const app = express()

//Middleware
app.use(express.static(__dirname + '/public')) //static server

app.use(express.json());

let currentUsername = null;

//Routes
app.get('/login', (request, response) => {
  response.sendFile(__dirname + '/views/login.html')
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
  });
  

//start server
app.listen(PORT, err => {
    if(err) console.log(err)
    else {
      console.log(`Server listening on port: ${PORT}`)
      console.log(`To Test:`)
      console.log(`http://localhost:3000/login`)
    }
  })
  
  
// When the user tries to login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Check the database for the username and password
    const sql = "SELECT username FROM User WHERE username = ? AND password = ?";
    db.get(sql, [username, password], (err, row) => {
      if (row) {
        // If the login was successful
        currentUsername = username;
        console.log("User:", username, "Has logged in");
        res.json({ success: true });
      } else {
        // if the login failed
        res.status(401).send("Invalid username or password");
      }
    });
  });

// When the user tries to sign up
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
  
    console.log("Signup", { username, password });
  
    // if either the username or password was not put in
    if (!username || !password) {
      console.error("Missing username or password.");
      return res.status(400).send("Both username and password are required.");
    }
  
    // insert the usernmae and password into the database.
    const insertUserSql = "INSERT INTO User (username, password) VALUES (?, ?)";
    db.run(insertUserSql, [username, password], function (err) {
      if (err) {
        console.error("Database error:", err.message); // Log detailed error
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(409).send("Username already exists.");
        }
        return res.status(500);
      }
  
      // Create a playlist for the new user
      const userId = this.lastID; // Get the id of the newly inserted user

      // insert the data for the users playlist
      const createPlaylistSql = `INSERT INTO Playlist (username) VALUES (?)`;
      db.run(createPlaylistSql, [username], function (err) {
        if (err) {
          console.error("Error creating playlist:", err.message);
          return res.status(500).send("Error creating user playlist.");
        }
  
        console.log("User and playlist created successfully:", username);
        res.send("User and playlist created successfully.");
        currentUsername = username;
      });
    });
  });
  
// When the user tries to fetch a song
app.get('/songs', (req, res) => {
    // get the search query from the search bar
    const searchQuery = req.query.search || "";
  
    // query for the song the user is trying to get
    const sql = `
        SELECT 
            Song.song_id,
            Song.title AS song_title,
            Album.title AS album_title,
            Album.year AS year, -- Fetch year from Album
            Song.length,
            Song.artist,
            GROUP_CONCAT(Genre.genre_name, ', ') AS genres
        FROM Song
        LEFT JOIN Album ON Song.album_id = Album.album_id
        LEFT JOIN CategorizedBy ON Song.song_id = CategorizedBy.song_id
        LEFT JOIN Genre ON CategorizedBy.genre_name = Genre.genre_name
        WHERE Song.title LIKE ? OR Song.artist LIKE ? OR Album.title LIKE ? OR Genre.genre_name LIKE ?
        GROUP BY Song.song_id
    `;

    // parameters we are querying for including title, artist, album name, and genre name
    const parameters = [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]; 
  
    // run through the database and find the query  
    db.all(sql, parameters, (err, rows) => {
        if (err) {
            console.error("Error fetching songs:", err.message);
            return res.status(500).send("Error fetching songs");
        }
  
        res.json(rows);
    });
});


// to add a song to the users playlist
app.post('/add-to-playlist', (req, res) => {
    const { song_id } = req.body;
    const username = currentUsername; 
    
    if (!username) {
        return res.status(401).send("User not logged in.");
    }

    // insert the song information into the users playlist
    db.serialize(() => {
        const findPlaylistSql = `SELECT playlist_id FROM Playlist WHERE username = ?`;
        db.get(findPlaylistSql, [username], (err, playlist) => {
            if (err) {
                console.error("Error finding playlist:", err.message);
                return res.status(500).send("Error finding playlist.");
            }

            const playlistId = playlist.playlist_id;

            addSongToPlaylist(playlistId, song_id, res);
        });
    });
});

// helper function to add the selected song into the playlist with the given id
function addSongToPlaylist(playlistId, songId, res) {
    const username = currentUsername;
    const insertTrackSql = `INSERT INTO Playlist_tracks (playlist_id, song_id, username) VALUES (?, ?, ?)`;
    db.run(insertTrackSql, [playlistId, songId, username], (err) => {
        if (err) {
            console.error("Error adding song to playlist:", err.message);
            return res.status(500).send("Error adding song to playlist.");
        }

        console.log(`Song ${songId} added to playlist ${playlistId}.`);
        res.send("Song added to playlist successfully.");
    });
}

// post method to remove a song from a playlist
app.post('/remove-from-playlist', (req, res) => {
    const { song_id } = req.body;
    const username = currentUsername; 

    if (!username) {
        return res.status(401).send("User not logged in.");
    }

    // get the users playlist id 
    const findPlaylistSql = `SELECT playlist_id FROM Playlist WHERE username = ?`;

    // run through the database and search for the playlist with the given id.
    db.get(findPlaylistSql, [username], (err, playlist) => {
        if (err) {
            console.error("Error finding playlist:", err.message);
            return res.status(500).send("Error finding playlist.");
        }

        if (!playlist) {
            return res.status(404).send("Playlist not found.");
        }

        const playlistId = playlist.playlist_id;

        // Remove the song from the playlist_tracks table
        const removeSongSql = `DELETE FROM Playlist_tracks WHERE playlist_id = ? AND song_id = ?`;

        db.run(removeSongSql, [playlistId, song_id], function (err) {
            if (err) {
                console.error("Error removing song from playlist:", err.message);
                return res.status(500).send("Error removing song from playlist.");
            }

            console.log(`Song ${song_id} removed from playlist ${playlistId}.`);
            res.send("Song removed from playlist successfully.");
        });
    });
});

// to retrieve a users playlist songs
app.get('/user-playlist', (req, res) => {
    const username = currentUsername; // Retrieve the currently logged-in user

    if (!username) {
        return res.status(401).send("User not logged in.");
    }

    // sql query to get all songs in the users playlist
    const sql = `
        SELECT 
            Playlist_tracks.song_id, 
            Song.title AS song_title,
            Album.title AS album_title,
            Album.year AS year, -- Fetch year from Album
            Song.length,
            Song.artist,
            GROUP_CONCAT(Genre.genre_name, ', ') AS genres
        FROM Playlist_tracks
        JOIN Song ON Playlist_tracks.song_id = Song.song_id
        JOIN Playlist ON Playlist_tracks.playlist_id = Playlist.playlist_id
        LEFT JOIN Album ON Song.album_id = Album.album_id
        LEFT JOIN CategorizedBy ON Song.song_id = CategorizedBy.song_id
        LEFT JOIN Genre ON CategorizedBy.genre_name = Genre.genre_name
        WHERE Playlist.username = ?
        GROUP BY Playlist_tracks.song_id
    `;


    // run through the database with the query and retrieve the songs as a json
    db.all(sql, [username], (err, rows) => {
        if (err) {
            console.error("Error fetching user's playlist:", err.message);
            return res.status(500).send("Error fetching user's playlist.");
        }

        res.json(rows); 
    });
});
