// chat.js
let socket = null;
let loggedInUserId = null;
let selectedUserId = null;
let typingTimeout = null;
let currentOffset = 0;
let throttle = false;

let Myusername;
let Theirname;
let isErrorState = false;

const chatWindow = document.getElementById("chatWindow");
let currentHeight = 150; // Starting height
const maxHeight = 200; // Maximum height

function connectWebSocket(userId) {
  if (isErrorState) {
    console.warn(
      "connectWebSocket! Cannot send data; application is in an error state."
    );
    return; // Exit if in error state
  }

  socket = new WebSocket(`ws://localhost:8888/ws?user_id=${userId}`);

  socket.onerror = () => {
    console.log("WebSocket error occurred");
  };

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log(msg.type);
    if (msg.type === "typing") {
      if (msg.from === selectedUserId) {
        showTypingIndicator(Theirname);
      }
      return;
    }

    if (msg.type === "message") {
      appendMessageToChat(msg);
      updateUserPreview(msg);
      return;
    }

    if (msg.type === "status_update") {
      updateUserStatus(msg.username, msg.status);
    }

    if (msg.type === "new_user") {
      fetchUserList(); // Fetch updated user list when a new user is created
      return;
    }
    if (msg.type === "new_post") {
      if (window.location.pathname === "/posts") {
        loadPosts();
      }
      return;
    }

    if (msg.type === "new_comment") {
      console.log("Post ID:", msg.post_id);
      if (window.location.pathname.includes(`${msg.post_id}`)) {
        // If the user is already on the comments page for this post, reload comments 
        loadCommentsForPost(msg.post_id);
        return;
      }
    };

    if (msg.type === "new_postLike") {
  
        getInteractions(msg.post_id);
      
      return;
    }

    if (msg.type === "new_commentLike") {
  
      getInteractions(null,msg.comment_id);
    
    return;
  }

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };
  }
}
function updateUserStatus(username, status) {
  const userList = document
    .getElementById("userList")
    .getElementsByTagName("li");
  for (let li of userList) {
    const userItem = li.querySelector(".username");
    if (userItem && userItem.textContent === username) {
      const statusDot = li.querySelector(".status-dot");
      if (status === "online") {
        statusDot.classList.add("online");
        statusDot.classList.remove("offline");
      } else {
        statusDot.classList.add("offline");
        statusDot.classList.remove("online");
      }
      break; // User found and updated, break the loop
    }
  }
}

function sendMessage(toId, content) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  const message = {
    type: "message",
    from: loggedInUserId,
    to: toId,
    content: content,
    timestamp: new Date().toISOString(),
  };

  socket.send(JSON.stringify(message));
  appendMessageToChat(message);
}

function sendTypingSignal() {
  if (!socket || !selectedUserId) return;

  const signal = {
    type: "typing",
    from: loggedInUserId,
    username: Myusername, // Ensure this has the correct username
    to: selectedUserId,
  };

  socket.send(JSON.stringify(signal));
}

function showTypingIndicator(username) {
  const container = document.getElementById("chatWindow");

  // Check if the typing indicator already exists
  const existingTypingMsg = container.querySelector(".typing-message");
  if (!existingTypingMsg) {
    const typingNode = document.createElement("div");
    typingNode.classList.add("typing-message");
    typingNode.textContent = `${username} is typing...`;
    container.appendChild(typingNode);
    container.scrollTop = container.scrollHeight; // Scroll to the bottom
  }

  // Reset the timeout for hiding the indicator
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    if (existingTypingMsg) {
      existingTypingMsg.remove(); // Remove typing message
    }
  }, 1000); // Hide after 1 second of inactivity
}

function loadMessages(withId, offset = 0) {
  if (isErrorState) {
    console.warn(
      "loadMessages! Cannot send data; application is in an error state."
    );
    return; // Exit if in error state
  }
  fetch(`/messages?with=${withId}&offset=${offset}`, { credentials: "include" })
    .then((res) => res.json())
    .then((messages) => {
      if (!messages || !Array.isArray(messages)) {
        console.warn("⚠️ No messages received or invalid format.");
        return;
      }

      messages.forEach((msg) => prependMessageToChat(msg));
      throttle = false;
    })
    .catch((err) => errorPage(500));
}

function appendMessageToChat(msg) {
  const messagesContainer = document.getElementById("chatWindow");
  const newMessage = document.createElement("div");
  newMessage.classList.add("chat-message");

  if (msg.from === loggedInUserId) {
    newMessage.classList.add("my-message"); // User's message
    newMessage.innerHTML = `<strong>${Myusername}</strong> <strong>${new Date(
      msg.timestamp
    ).toLocaleString()}:</strong><br> ${msg.content}`;
  } else {
    newMessage.classList.add("received-message"); // Received message
    newMessage.innerHTML = `<strong>${Theirname}</strong> <strong>${new Date(
      msg.timestamp
    ).toLocaleString()}:</strong><br> ${msg.content}`;
  }

  // Append the new message instead of prepending
  messagesContainer.append(newMessage); // Use append() instead of prepend()
  messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
}

function prependMessageToChat(msg) {
  const container = document.getElementById("chatWindow");
  const node = document.createElement("div");
  node.classList.add("chat-message");

  // Determine the alignment based on the sender
  if (msg.from === loggedInUserId) {
    node.classList.add("my-message"); // User's message
    node.innerHTML = `<strong>${Myusername}</strong> <strong>${new Date(
      msg.timestamp
    ).toLocaleString()}:</strong><br> ${msg.content}`;
  } else {
    node.classList.add("received-message"); // Received message
    node.innerHTML = `<strong>${Theirname}</strong> <strong>${new Date(
      msg.timestamp
    ).toLocaleString()}:</strong><br> ${msg.content}`;
  }

  // Insert the new message at the top
  container.insertBefore(node, container.firstChild);
}

function setupScroll(chatUserId) {
  const container = document.getElementsByClassName("chat-window")[0];
  container.addEventListener("scroll", () => {
    if (container.scrollTop === 0 && !throttle) {
      throttle = true;
      if (currentHeight < maxHeight) {
        currentHeight += 10; // Increase height by 10
        container.style.height = `${currentHeight}px`; // Apply new height
      }
      currentOffset += 10;
      loadMessages(chatUserId, currentOffset);
      // Reset throttle after loading messages
      setTimeout(() => {
        throttle = false; // Allow scrolling again after a short delay
      }, 1500); // Adjust the delay as needed
    }
  });
}

function updateUserPreview(msg) {
  const userList = document
    .getElementById("userList")
    .getElementsByTagName("li");
  for (let li of userList) {
    if (li.dataset.userId == msg.from || li.dataset.userId == msg.to) {
      li.classList.add("has-new-message");
    }
  }
}

// --- UI Integration ---
function showChatSection() {
  hideAllSections();
  document.getElementById("chatSection").hidden = false;
}

function hideAllSections() {
  document.getElementById("mainPage").hidden = true;
  document.getElementById("signUpSection").hidden = true;
  document.getElementById("logInSection").hidden = true;
  document.getElementById("postPageSection").hidden = true;
  document.getElementById("createPostSection").hidden = true;
  document.getElementById("aboutUsSection").hidden = true;
  document.getElementById("commentsSection").hidden = true;
  document.getElementById("chatSection").hidden = true;
}

function returnToPosts() {
  hideAllSections();
  document.getElementById("postPageSection").hidden = false;
  history.pushState(null, "", "/posts");
}

function loadAndInitChat(userId) {
  if (isErrorState) {
    console.warn(
      "loadAndInitChat! Cannot send data; application is in an error state."
    );
    return; // Exit if in error state
  }
  loggedInUserId = userId;
  connectWebSocket(userId);
  fetchUserList();
  setupChatForm();
  updateUserListPeriodically();
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function fetchUserList() {
  if (isErrorState) {
    console.warn(
      "fetchUserList! Cannot send data; application is in an error state."
    );
    return; // Exit if in error state
  }
  fetch("/get-users", {
    method: "GET",
    credentials: "include",
  })
    .then((res) => {
      if (res.status === 401) {
        console.error("Unauthorized access. Please log in.");
        return;
      }
      if (res.status === 404) {
        errorPage(404); // Handle user list not found
        return;
      }
      return res.json();
    })
    .then((users) => {
      const userList = document.getElementById("userList");
      userList.innerHTML = "";

      if (users == null) {
        // console.log("No users found."); // Optional: Log a message if no users
        return; // Exit the function if no users are present
      } else {
        users.forEach((user) => {
          if (user.id !== loggedInUserId) {
            const li = document.createElement("li");
            li.dataset.userId = user.id;
            li.classList.add("user-item");

            // Create username span
            const usernameSpan = document.createElement("span");
            usernameSpan.textContent = user.username;

            // Create status dot
            const statusDot = document.createElement("span");
            statusDot.classList.add("status-dot");
            statusDot.classList.add(user.online ? "online" : "offline");

            // Append elements
            li.appendChild(usernameSpan);
            li.appendChild(statusDot);
            li.onclick = () => openChatWith(user.id, user.username);

            userList.appendChild(li);
          } else {
            Myusername = user.username; // Set your username here
          }
        });
      }
    })
    .catch((err) => errorPage(500));
}

function openChatWith(userId, username) {
  Theirname = username;
  selectedUserId = userId;
  currentOffset = 0;
  chatWindow.style.display = "flex";
  document.getElementById("chatWindow").innerHTML = "";
  document.getElementById(
    "chatWithLabel"
  ).textContent = `Chat with ${username}`;
  showChatSection();

  const chatForm = document.getElementById("chatForm");
  chatForm.style.display = "flex";

  loadMessages(userId);
  setupScroll(userId);
}

function setupChatForm() {
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevents page reload
    const content = chatInput.value.trim();
    if (content && selectedUserId) {
      sendMessage(selectedUserId, content);
      chatInput.value = ""; // Clear input after sending
    }
  });

  chatInput.addEventListener("input", () => {
    sendTypingSignal();
  });
}

function updateUserListPeriodically() {
  if (isErrorState) {
    console.warn("Cannot send data; application is in an error state.");
    return; // Exit if in error state
  }

  setInterval(() => {
    fetchUserList(); // Fetch the updated user list
  }, 300); // Update every 5 seconds (adjust as needed)
}

function disconnectWeb() {
  socket.close();
  console.log("Socket closed.");
}

function showSection(sectionToShow, urlSuffix) {
  hideAllSections();
  sectionToShow.hidden = false;

  // Update the URL
  history.pushState(null, "", urlSuffix);
}

function errorPage(errNum) {
  const errorSection = document.getElementById("errorSection");
  const errorContainer = document.getElementById("errorContainer");

  fetch("/error/" + errNum, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => {
      return res.text(); // Handle HTML response
    })
    .then((html) => {
      console.log(html);
      // Show the appropriate error section based on the error number
      switch (errNum) {
        case 400:
          showSection(errorSection, "/error/400");
          errorContainer.innerHTML =
            "<h1>400 Bad Request</h1><p>Your request could not be understood.</p>";
          isErrorState = true;
          break;
        case 404:
          showSection(errorSection, "/error/404");
          errorContainer.innerHTML =
            "<h1>404 Not Found</h1><p>The resource you are looking for could not be found.</p>";
          isErrorState = true;
          break;
        case 500:
          showSection(errorSection, "/error/500");
          errorContainer.innerHTML =
            "<h1>500 Internal Server Error</h1><p>Something went wrong.</p>";
          isErrorState = true;
          break;
        default:
          showSection(errorSection, "/error/404");
          errorContainer.innerHTML =
            "<h1>404 Not Found</h1><p>The resource you are looking for could not be found.</p>";
          isErrorState = true;
          break;
      }
    })
    .catch((err) => {
      console.error("Failed to fetch error details:", err);
    });
}

// Expose functions globally
window.showChatSection = showChatSection;
window.returnToPosts = returnToPosts;
window.loadAndInitChat = loadAndInitChat;
window.disconnectWeb = disconnectWeb;
window.errorPage = errorPage;
window.isErrorState = isErrorState;
