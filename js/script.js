// Get references to sections
const mainSection = document.getElementById('mainPage');
const signUpSection = document.getElementById('signUpSection');
const logInSection = document.getElementById('logInSection');
const postPageSection = document.getElementById('postPageSection');
const createPostSection = document.getElementById('createPostSection');
const aboutUsSection = document.getElementById('aboutUsSection');
const commentsSection = document.getElementById('commentsSection');
const errorSection = document.getElementById('errorSection');

// Get references to buttons
const signUpButton = document.getElementById('signUpButton');
const logInButton = document.getElementById('logInButton');
const logoutButton = document.getElementById('logoutButton');
const postsButton = document.getElementById('postsButton');
const postsPageButton = document.getElementById('postsPageButton');
const createPostButton = document.getElementById('createPostButton');
const aboutUsButton = document.getElementById('aboutUsButton');
const returnToPost = document.getElementById("return-to-post");
const sendCommentButton = document.getElementById("sendCommentButton");
const loginSignUpButton = document.getElementById('signUpButtonLogin');
const logoutPostButton = document.getElementById('logoutPostButton');
const postMyPageButton = document.getElementById('postMyPageButton');
const categoryButtons = document.querySelectorAll('#categoryOptions .button-side');
const openChatButton = document.getElementById('openChatButton');

let userID = 0;
let Chatusername;

// Function to show a section and hide others
function showSection(sectionToShow, urlSuffix) {
    errorSection.hidden = true;
    mainSection.hidden = true;
    signUpSection.hidden = true;
    logInSection.hidden = true;
    postPageSection.hidden = true;
    createPostSection.hidden = true;
    aboutUsSection.hidden = true;
    commentsSection.hidden = true;
    sectionToShow.hidden = false;

    // Update the URL
    history.pushState(null, '', urlSuffix);
}
if(isErrorState){
    console.warn("script.js! Cannot send data; application is in an error state.");
}else{
// Consolidated event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadAndInitChat(userID); // Your custom chat setup function
    // Event listeners for navigation buttons
    if (signUpButton) signUpButton.addEventListener('click', () => showSection(signUpSection, '/signup'));
    if (logInButton) logInButton.addEventListener('click', () => showSection(logInSection, '/login'));
    if (postsButton){ 
        postsButton.addEventListener('click', () => showSection(postPageSection, '/posts'));
        checkSession();
        loadPosts();
    }
    if (createPostButton) createPostButton.addEventListener('click', ()=> showSection(createPostSection, "/create-post"))
    if (aboutUsButton) aboutUsButton.addEventListener('click', () => showSection(aboutUsSection, '/about-us'));
    if (returnToPost) returnToPost.addEventListener('click', () => showSection(postPageSection, '/posts'));
    if (loginSignUpButton) loginSignUpButton.addEventListener('click', () => showSection(signUpSection, '/signup'));
    if(postMyPageButton)postMyPageButton.addEventListener('click',loadMyPosts);
    if(postsPageButton){ 
        postsPageButton.addEventListener('click', () => {
            showSection(postPageSection, '/posts');
            loadPosts();
        });  
    }
    if (logoutPostButton) {
        logoutPostButton.addEventListener('click', function () {
            fetch('/logout', {
                method: 'POST',
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                disconnectWeb();
                checkSession(); // Refresh UI
                showSection(mainSection, '/'); // Redirect to main page
            })
            .catch(error => errorPage(500));
        });
    }
    if (openChatButton) {
        openChatButton.addEventListener('click', () => {
            showSection(document.getElementById('chatSection'), '/chat');
            loadAndInitChat(userID); // Your custom chat setup function
        });
    }
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.value; // Get the category from the button's value
            loadCategoryPosts(category);
            showSection(postPageSection, '/category/' + category); // Show posts of the selected category
        });
    });

    // Registration form
    const registrationForm = document.getElementById('registrationForm');

   // Login form 
   const loginForm = document.getElementById('loginForm');
   
    // Create form submission
    const createPostForm = document.getElementById('createPostForm');

   // Registration form 
    if (registrationForm) {
        registrationForm.addEventListener('submit', function (event) {
            if (isErrorState) {
                console.warn("registrationForm! Cannot send data; application is in an error state.");
                return; // Exit if in error state
            }
            event.preventDefault(); // Prevent default form submission

            const feedbackMessage = document.getElementById('feedbackMessage');
            feedbackMessage.textContent = '';

            const formData = {
                username: document.getElementById('username').value,
                fname: document.getElementById('fname').value,
                lname: document.getElementById('lname').value,
                email: document.getElementById('email').value,
                age: parseInt(document.getElementById('age').value, 10),
                gender: document.getElementById('gender').value,
                password: document.getElementById('password').value,
            };

            
            fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
                .then(response => response.json())
                .then(data => {
                    feedbackMessage.textContent = data.success ? 'Registration successful!' : (data.message || 'Registration failed.');
                    feedbackMessage.style.color = data.success ? 'green' : 'red';
                    if (data.success) {
                        registrationForm.reset();
                        showSection(logInSection, '/login'); // Navigate to login section
                    }
                })
                .catch(error => {
                    feedbackMessage.textContent = 'An error occurred: ' + error.message;
                    feedbackMessage.style.color = 'red';
                    errorPage(500)
                });
        });
    }

    // Login form 
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            if (isErrorState) {
                console.warn("loginForm! Cannot send data; application is in an error state.");
                return; // Exit if in error state
            }
            event.preventDefault(); // Prevent default form submission
    
            const loginData = {
                userOremail: document.getElementById('userOremail').value,
                password: document.getElementById('pass').value
            };
    
            fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
                credentials: 'include' // Allows cookies to be sent with the request
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                if (data.message === "Login successful.") {
                    Chatusername = data.username;
                    checkSession(); // Refresh session check
                    loginForm.reset();
                    showSection(postPageSection, '/posts'); // Navigate to posts section
                    loadPosts(); // Load posts after navigating to the posts section
                } else {
                    const error =  document.getElementById("logerror")
                    error.innerHTML = data.message;
                    checkSession(); // Update UI based on session status
                    loginForm.reset();
                }
            })
            .catch(error => errorPage(500));
        });
    }

    //Create form
    if (createPostForm) {
        createPostForm.addEventListener('submit', function (event) {
            if (isErrorState) {
                console.warn("createPostForm! Cannot send data; application is in an error state.");
                return; // Exit if in error state
            }
            event.preventDefault(); // Prevent default form submission

            // Get selected categories (checkboxes)
            const selectedCategories = [];
            document.querySelectorAll('input[name="category"]:checked').forEach((checkbox) => {
                selectedCategories.push(checkbox.value);
            });

            const postData = {
                title: document.getElementById('title').value,
                content: document.getElementById('content').value,
                categories: selectedCategories // Send array of selected categories
            };

            fetch('/create-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
                credentials: 'include' // Ensures session cookies are sent
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data.success ? "Post created successfully!" : "Error: " + data.message);
                    if (data.success) createPostForm.reset();
                    socket.send(JSON.stringify({ type: "new_post" }));
                    showSection(postPageSection, '/posts');
                })
                .catch(error => errorPage(500));
        });
    }
    
    // Logout functionality
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            if (isErrorState) {
                console.warn("logoutButton! Cannot send data; application is in an error state.");
                return; // Exit if in error state
            }
            fetch('/logout', {
                method: 'POST',
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                checkSession(); // Refresh session check to update UI
                showSection(mainSection, '/'); // Redirect to main page after logout
            })
            .catch(error => errorPage(500));
        });
    }  

});

function toggleDropdown(id) {
    var dropdown = document.getElementById(id);
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block'; // Toggle visibility
}

}