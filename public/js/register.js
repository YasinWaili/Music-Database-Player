// Function for logging in
function login() {
    // get the username and password typed in
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    

    var xhr = new XMLHttpRequest();
    // Make a call to the /login method in server.js
    xhr.open("POST", "/login", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        if (response.success) {
          window.location.href = '/';
        } else {
          alert('Login failed: ' + xhr.responseText);
        }
      }
    };
    var data = JSON.stringify({"username": username, "password": password});
    xhr.send(data);
  }

function signup() {
  // Get the values entered by the user
  const username = document.getElementById('signup_username').value;
  const password = document.getElementById('signup_password').value;

  var xhr = new XMLHttpRequest();
  
   // Make a call to the /signup method in server.js
  xhr.open("POST", "/signup", true);
  xhr.setRequestHeader("Content-Type", "application/json");

  // Define what happens on state change
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 ) { 
      // if we successfully logged in
      if (xhr.status === 200) { 
        alert(xhr.responseText); 
        // Redirect to the login page
        window.location.href = '/';
      } else if (xhr.status === 409) {
        // if username already exists
        alert("Username already exists");
      } else { 
        alert("Signup failed: " + xhr.responseText);
      }
    }
  };

  // Send the request with the username and password as a JSON
  var data = JSON.stringify({ username: username, password: password });
  xhr.send(data);
}
