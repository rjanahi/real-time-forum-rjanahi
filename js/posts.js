//load all the posts
function loadPosts() {
    if (isErrorState) {
        console.warn("loadPosts! Cannot send data; application is in an error state.");
        return; // Exit if in error state
    }
    fetch('/get-posts', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    })
        .then(response => {
            if (response.status === 404) {
                errorPage(404); // Handle posts not found
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            return response.json();
        })
        .then(posts => {
            const postContainer = document.querySelector('.container-post');
            postContainer.innerHTML = '';
            postContainer.innerHTML = '<h1>Posts</h1>';


            if (posts == null) {
                postContainer.innerHTML += "<p>No posts available.</p>";
                return;
            }

            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post-post');
                postElement.innerHTML = `
            <div class="comment-post">
                <h2>${post.title}</h2>
                <p>${post.content}</p>
                <small>Posted by <strong>${post.username}</strong> on ${post.createdAt}</small><br>
                <small>Category: ${post.categories.join(", ")}</small>
                <br><br>
                <button class="commentsButton button-main" data-post-id="${post.id}">See comments</button>
                <br><br>
                <span class="material-icons" onclick="likeDislikePost(${post.id}, true); "> thumb_up </span>
                <span class="material-icons" onclick="likeDislikePost(${post.id}, false); "> thumb_down </span>
            <small>
                <span id="likesCountPost${post.id}">Likes: 0</span>
                <span id="dislikesCountPost${post.id}">Dislikes: 0</span>
            </small>                    </div>
        `;
                postContainer.appendChild(postElement);
                //  Fetch updated likes/dislikes for this post
                getInteractions(post.id);
            });

            document.querySelectorAll('.commentsButton').forEach(button => {
                button.addEventListener('click', () => loadCommentsForPost(button.dataset.postId));
            });

        })
        .catch(error => errorPage(500));
}

//load only user posts
function loadMyPosts() {
    if (isErrorState) {
        console.warn("loadMyPosts! Cannot send data; application is in an error state.");
        return; // Exit if in error state
    }
    fetch('/get-myPosts', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    })
        .then(response => {
            if (response.status === 404) {
                errorPage(404); // Handle posts not found
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            return response.json();
        })
        .then(posts => {
            const postContainer = document.querySelector('.container-post');
            postContainer.innerHTML = '';
            postContainer.innerHTML += '<h1>Posts</h1>';


            if (posts == null) {
                postContainer.innerHTML += "<p>No posts available.</p>";
                return;
            }

            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post-post');
                postElement.innerHTML = `
                    <div class="comment-post">
                        <h2>${post.title}</h2>
                        <p>${post.content}</p>
                        <small>Posted by <strong>${post.username}</strong> on ${post.createdAt}</small><br>
                        <small>Category: ${post.categories.join(", ")}</small>
                        <br><br>
                        <button class="commentsButton button-main" data-post-id="${post.id}">See comments</button>
                        <br><br>
                        <span class="material-icons" onclick="likeDislikePost(${post.id}, true);"> thumb_up </span>
                        <span class="material-icons" onclick="likeDislikePost(${post.id}, false);"> thumb_down </span>
                        <small>
                            <span id="likesCountPost${post.id}">Likes: 0</span>
                            <span id="dislikesCountPost${post.id}">Dislikes: 0</span>
                        </small>                    
                    </div>
                `;
                postContainer.appendChild(postElement);
                //  Fetch updated likes/dislikes for this post
                getInteractions(post.id);
            });

            document.querySelectorAll('.commentsButton').forEach(button => {
                button.addEventListener('click', () => loadCommentsForPost(button.dataset.postId));
            });

        })
        .catch(error => errorPage(500));
}

//load posts with specific category
function loadCategoryPosts(category) {
    if (isErrorState) {
        console.warn("loadCategoryPosts! Cannot send data; application is in an error state.");
        return; // Exit if in error state
    }
    fetch('/category/' + category, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    })
        .then(response => {
            if (response.status === 404) {
                errorPage(404); // Handle category not found
                return;
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(posts => {
            const postContainer = document.querySelector('.container-post');

            // Debugging: Log the postContainer to check if it's null
            console.log('Post container:', postContainer);

            // Check if postContainer is null
            if (!postContainer) {
                console.error("Post container not found!");
                return;
            }

            postContainer.innerHTML = ''; // Clear previous posts
            postContainer.innerHTML += '<h1>Posts</h1>';

            if (!Array.isArray(posts)) {
                console.error("Expected posts to be an array, but got:", posts);
                postContainer.innerHTML += "<p>Error loading posts.</p>";
                return;
            }

            if (posts.length === 0) {
                postContainer.innerHTML += "<p>No posts available.</p>";
                return;
            }

            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post-post');
                postElement.innerHTML = `
            <div class="comment-post">
                <h2>${post.title}</h2>
                <p>${post.content}</p>
                <small>Posted by <strong>${post.username}</strong> on ${post.createdAt}</small><br>
                <small>Category: ${post.categories.join(", ")}</small>
                <br><br>
                <button class="commentsButton button-main" data-post-id="${post.id}">See comments</button>
                <br><br>
                <span class="material-icons" onclick="likeDislikePost(${post.id}, true);"> thumb_up </span>
                <span class="material-icons" onclick="likeDislikePost(${post.id}, false);"> thumb_down </span><small>
                <span id="likesCountPost${post.id}">Likes: 0</span>
                <span id="dislikesCountPost${post.id}">Dislikes: 0</span></small>
                </div>
                `;
                postContainer.appendChild(postElement);
                //  Fetch updated likes/dislikes for this post
                getInteractions(post.id);
            });

            document.querySelectorAll('.commentsButton').forEach(button => {
                button.addEventListener('click', () => loadCommentsForPost(button.dataset.postId));
            });
        })
        .catch(error => errorPage(500));
}

window.loadPosts = loadPosts;
window.loadMyPosts = loadMyPosts;
window.loadCategoryPosts = loadCategoryPosts;
