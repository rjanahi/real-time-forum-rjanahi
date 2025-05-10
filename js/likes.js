function likeDislikeComment(commentId, isLike) {
    if (isErrorState) {
        console.warn("LIKEDIS COMMENT. Cannot send data; application is in an error state.");
        return; // Exit if in error state
    }
    console.log(` Sending Like/Dislike request for Comment ID: ${commentId}, Is Like: ${isLike}`);

    let likesElement = document.getElementById(`likesCountComment${commentId}`);
    let dislikesElement = document.getElementById(`dislikesCountComment${commentId}`);

    if (!likesElement || !dislikesElement) {
        console.error(` Elements for comment ${commentId} not found.`);
        return;
    }
    

    fetch('/likeDislikeComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, is_like: isLike }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log(" Like/Dislike Comment Response:", data);

        if (data.message === 'Interaction updated successfully') {
            likesElement.innerText = `Likes: ${data.likes}`;
            dislikesElement.innerText = `Dislikes: ${data.dislikes}`;
        } else {
            console.log(data.error || "Something went wrong.");
        }
        socket.send(JSON.stringify({ type: "new_commentLike" , comment_id: parseInt(commentId) , is_like: isLike}));
    })
    .catch(error => errorPage(500));
}

function likeDislikePost(postId, isLike) {
    if (isErrorState) {
        console.warn("LIKEDIS POST. Cannot send data; application is in an error state.");
        return; // Exit if in error state
    }
    let likesElement = document.getElementById(`likesCountPost${postId}`);
    let dislikesElement = document.getElementById(`dislikesCountPost${postId}`);

    if (!likesElement || !dislikesElement) {
        console.error(` Elements for post ${postId} not found.`);
        return;
    }

    fetch('/likeDislikePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, is_like: isLike }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log(" Like/Dislike Response:", data);

        if (data.message === 'Interaction updated successfully') {
            
            //  Update UI only after getting the correct values from backend
            likesElement.innerText = `Likes: ${data.likes}`;
            dislikesElement.innerText = `Dislikes: ${data.dislikes}`;
        } else {
            console.log(data.error || "Something went wrong.");
        }
        socket.send(JSON.stringify({ type: "new_postLike" , post_id: parseInt(postId) , is_like: isLike}));
    })
    .catch(error => {
        console.error(' Error:', error);
        errorPage(500)
    });
}

function getInteractions(postId, commentId = null) {
    if (isErrorState) {
        console.warn("GET INTER. Cannot send data; application is in an error state.");
        return; // Exit if in error state
    }
    let requestBody = commentId 
        ? { comment_id: commentId } // Fetch comment interactions
        : { post_id: postId };      // Fetch post interactions

    fetch('/getInteractions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log(" Updated Interaction Data:", data);

        if (!data || typeof data.likes === "undefined" || typeof data.dislikes === "undefined") {
            console.error(" Invalid data received:", data);
            return;
        }

        if (commentId) {
            //  Update comment likes/dislikes
            let likesElement = document.getElementById(`likesCountComment${commentId}`);
            let dislikesElement = document.getElementById(`dislikesCountComment${commentId}`);

            if (likesElement) likesElement.innerText = `Likes: ${data.likes}`;
            if (dislikesElement) dislikesElement.innerText = `Dislikes: ${data.dislikes}`;
        } else {
            //  Update post likes/dislikes
            let likesElement = document.getElementById(`likesCountPost${postId}`);
            let dislikesElement = document.getElementById(`dislikesCountPost${postId}`);

            if (likesElement) likesElement.innerText = `Likes: ${data.likes}`;
            if (dislikesElement) dislikesElement.innerText = `Dislikes: ${data.dislikes}`;
        }
    })
    .catch(error => errorPage(500));
}

window.getInteractions = getInteractions;
window.likeDislikeComment = likeDislikeComment;
window.likeDislikePost = likeDislikePost;