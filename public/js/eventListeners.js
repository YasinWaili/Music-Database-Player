document.addEventListener('DOMContentLoaded', function () {
    const pageId = document.body.id;

    // if we are in the login.html page 
    if (pageId === "login"){
        document.getElementById('login_button').addEventListener('click', login)
        document.getElementById('signup_button').addEventListener('click', signup)
    }

    // if we are in the index.html page
    if (pageId === "index"){
        loadUserPlaylist()
        document.getElementById('search_button').addEventListener('click', getSongs);
        document.querySelector('.search-bar').addEventListener('keyup', handleKeyUp);
    }
  });

// Attach Enter-key Handler
const ENTER = 13;

function handleKeyUp(event) {
  event.preventDefault();
  if (event.keyCode === ENTER) {
    document.getElementById("search_button").click();
  }
}

