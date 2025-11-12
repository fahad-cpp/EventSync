// EventSync JavaScript functionality

// Load navigation placeholder
function loadNavigation() {
  const navPlaceholders = document.querySelectorAll("#nav-placeholder");
  navPlaceholders.forEach((placeholder) => {
    if (placeholder) {
      placeholder.innerHTML = "";
    }
  });
}

// Attach form listeners
function attachFormListeners() {
  const createForm = document.getElementById("createEventForm");
  const joinForm = document.getElementById("joinEventForm");
  const contactForm = document.getElementById("contactForm");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const adminForm = document.getElementById("adminForm");

  if (createForm) {
    createForm.addEventListener("submit", handleCreateEvent);
  }
  if (joinForm) {
    joinForm.addEventListener("submit", handleJoinEvent);
  }
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactSubmit);
  }
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
  if (adminForm) {
    adminForm.addEventListener("submit", handleAdminLogin);
  }
}

// Handle event creation
async function handleCreateEvent(e) {
  e.preventDefault();
  const eventName = document.getElementById("eventName").value;
  const eventDate = document.getElementById("eventDate").value;
  const eventTime = document.getElementById("eventTime").value;
  const eventLocation = document.getElementById("eventLocation").value;
  const eventDescription = document.getElementById("eventDescription").value;
  const eventType = document.querySelector('input[name="eventType"]:checked').value;

  try {
    const res = await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventDate,
        eventTime,
        eventLocation,
        eventDescription,
        eventType,
      }),
    });

    const data = await res.json();
    if (data.success) {
      showMessage("createEventMessage", data.message, "success");
      e.target.reset();
      setTimeout(() => (window.location.href = "thank-you.html"), 1500);
    } else {
      showMessage("createEventMessage", data.message, "error");
    }
  } catch {
    showMessage("createEventMessage", "Server error while creating event.", "error");
  }
}


// Handle joining event
async function handleJoinEvent(e) {
  e.preventDefault();
  const eventCode = document.getElementById("eventCode").value;
  const eventId = document.getElementById("eventId").value; // add hidden input in form

  try {
    const res = await fetch("/api/events/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ eventId, code: eventCode }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("joinEventMessage", data.message, "success");
      e.target.reset();
    } else {
      showMessage("joinEventMessage", data.message, "error");
    }
  } catch {
    showMessage("joinEventMessage", "Server error joining event.", "error");
  }
}



// Load public events
async function loadPublicEvents() {
  const eventList = document.querySelector(".event-list");
  if (!eventList) return;

  try {
    const res = await fetch("/api/events/public", { method: "POST" });
    const data = await res.json();

    if (!data.success || data.events.length === 0) {
      eventList.innerHTML =
        '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1;">No events available yet.</p>';
      return;
    }

    eventList.innerHTML = data.events
      .map(
        (event) => `
        <div class="event-card">
          <div class="event-card-header">
            <h3>${event.title}</h3>
            <span class="event-type-badge ${event.is_public ? "public" : "private"}">
              ${event.is_public ? "Public" : "Private"}
            </span>
          </div>
          <p><strong>📅 Date:</strong> ${event.date.split("T")[0]}</p>
          <p><strong>⏰ Time:</strong> ${event.time}</p>
          <p><strong>📍 Location:</strong> ${event.location}</p>
        </div>
      `
      )
      .join("");
  } catch {
    eventList.innerHTML =
      '<p style="text-align:center;color:red;">Failed to load events.</p>';
  }
}


// Handle contact form
async function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const message = document.getElementById("contactMessage").value.trim();

  if (!name || !email || !message)
    return showMessage("contactMessageStatus", "All fields are required.", "error");

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("contactMessageStatus", data.message, "success");
      e.target.reset();
      setTimeout(() => (window.location.href = "thank-you.html"), 1500);
    } else {
      showMessage("contactMessageStatus", data.message, "error");
    }
  } catch {
    showMessage("contactMessageStatus", "Server error sending message.", "error");
  }
}


async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password)
    return showMessage("loginMessage", "Please enter credentials.", "error");
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ send and store cookies
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("loginMessage", data.message, "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 1000);
    } else {
      showMessage("loginMessage", data.message, "error");
    }
  } catch {
    showMessage("loginMessage", "Server error. Try again later.", "error");
  }
}



async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (password !== confirmPassword)
    return showMessage("registerMessage", "Passwords do not match.", "error");

  if (!email || !password)
    return showMessage("registerMessage", "All fields required.", "error");

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("registerMessage", data.message, "success");
      setTimeout(() => (window.location.href = "auth.html"), 1500);
    } else {
      showMessage("registerMessage", data.message, "error");
    }
  } catch {
    showMessage("registerMessage", "Server error. Try again later.", "error");
  }
}

// Handle admin login
async function handleAdminLogin(e) {
  e.preventDefault();
  const adminUsername = document.getElementById("adminUsername").value.trim();
  const adminPassword = document.getElementById("adminPassword").value.trim();

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUsername, adminPassword }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("adminLoginMessage", data.message, "success");
      setTimeout(() => (window.location.href = "index.html"), 1000);
    } else {
      showMessage("adminLoginMessage", data.message, "error");
    }
  } catch {
    showMessage("adminLoginMessage", "Server error during admin login.", "error");
  }
}


// Show message utility
function showMessage(elementId, message, type) {
  const messageEl = document.getElementById(elementId);
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
  }
}

// Store event registration
async function registerEvent(eventId) {
  const button = document.getElementById("eventRegisterButton");

  if (!button) return;
  button.addEventListener("click", async () => {
    console.log("Button Clicked");
    const joinMessageEl = document.getElementById("joinMessage");

    try {
      // Handle private event code validation
      let eventCode = null;
      const codeInput = document.getElementById("eventCodeInput");
      if (codeInput) {
        eventCode = codeInput.value.trim();
        if (!eventCode) {
          showMessage(
            "joinMessage",
            "Please enter the event code to join.",
            "error"
          );
          return;
        }
      }

      // Send join request to backend
      console.log("Passing to Server")
      const response = await fetch("/api/events/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important: sends cookies/session
        body: JSON.stringify({ eventId, code: eventCode }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage("joinMessage", data.message, "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } else {
        showMessage("joinMessage", data.message || "Failed to join event.", "error");
      }
    } catch (err) {
      console.error("Error joining event:", err);
      showMessage("joinMessage", "Server error. Please try again later.", "error");
    }
  });
}


// Load event details if on event details page
async function loadEventDetails() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("id");
  if (!eventId) return;

  try {
    const res = await fetch(`/api/events/${eventId}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    if (!data.success) throw new Error("Event not found");

    const event = data.event;
    document.getElementById("eventTitle").textContent = event.title;
    document.getElementById("eventType").textContent = event.is_public ? "Public" : "Private";
    document.getElementById("eventType").className = `event-type-badge ${event.is_public ? "public" : "private"}`;
    document.getElementById("eventDetailDate").textContent = event.date.split("T")[0];
    document.getElementById("eventDetailTime").textContent = event.time;
    document.getElementById("eventDetailLocation").textContent = event.location;
    document.getElementById("eventDetailDescription").textContent = event.description || "No description available";

    if (!event.is_public) {
      document.getElementById("privateEventCodeSection").style.display = "block";
    }


    registerEvent(eventId);
  } catch (err) {
    console.error(err);
    document.querySelector(".event-details-container").innerHTML = "<p style='color:red'>Failed to load event details.</p>";
  }
}


// Load profile information
async function loadProfilePage() {
  try {
    // ✅ Fetch logged-in user profile from backend
    const res = await fetch("/api/user/profile", {
      method: "GET",
      credentials: "include", // send session cookie
    });
    const data = await res.json();

    if (!data.success) {
      // Not logged in, redirect
      window.location.href = "auth.html";
      return;
    }

    const currentUser = data.user;

    // Set profile info
    document.getElementById("profileEmail").textContent = currentUser.email;
    document.getElementById("profileUsername").textContent =
      currentUser.username || "N/A";
    const joinDate = new Date(currentUser.createdAt || currentUser.id).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    document.getElementById(
      "profileMemberSince"
    ).textContent = `Member since ${joinDate}`;

    // Populate update fields
    document.getElementById("updateEmail").value = currentUser.email;
    document.getElementById("updateUsername").value = currentUser.username || "";

    // ✅ Fetch events created/joined by user from backend
    const eventsRes = await fetch("/api/events/user-dashboard", {
      method: "GET",
      credentials: "include",
    });
    const eventsData = await eventsRes.json();

    if (!eventsData.success) {
      console.error("Failed to fetch user events");
      return;
    }

    // Load events into the page
    loadUserCreatedEvents(eventsData.createdEvents);
    loadUserRegisteredEvents(eventsData.joinedEvents);
  } catch (err) {
    console.error("Error loading profile page:", err);
    window.location.href = "auth.html";
  }
}


// Load events created by the user
async function loadUserCreatedEvents() {
  try {
    const res = await fetch("/api/events/user-dashboard", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();

    const createdList = document.getElementById("createdEventsList");
    if (!createdList) return;

    if (!data.success || data.createdEvents.length === 0) {
      createdList.innerHTML = `
        <p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">
          You haven't created any events yet. <a href="create-event.html">Create one now!</a>
        </p>
      `;
      return;
    }
    console.log(data);
    createdList.innerHTML = data.createdEvents
      .map(
        (event) => `
        <div class="event-card">
          <h3>${event.title}</h3>
          <p><strong>📅 Date:</strong> ${event.date.split("T")[0]}</p>
          <p><strong>⏰ Time:</strong> ${event.time}</p>
          <p><strong>📍 Location:</strong> ${event.location}</p>
          <p><strong>🏷️ Code:</strong> ${event.code}</p>
          <a href="event-details.html?id=${event.event_id}" class="button secondary" style="display: inline-block; margin-top: var(--spacing-md);">View Details</a>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Failed to load user created events:", err);
  }
}


// Load events registered by the user
async function loadUserRegisteredEvents() {
  try {
    const res = await fetch("/api/events/user-dashboard", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();

    const registeredList = document.getElementById("registeredEventsList");
    if (!registeredList) return;

    if (!data.success || data.joinedEvents.length === 0) {
      registeredList.innerHTML = `
        <p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">
          You haven't registered for any events yet. <a href="join-event.html">Find events to join!</a>
        </p>
      `;
      return;
    }

    registeredList.innerHTML = data.joinedEvents
      .map(
        (event) => `
        <div class="event-card">
          <h3>${event.name}</h3>
          <p><strong>📅 Date:</strong> ${event.date.split("T")[0]}</p>
          <p><strong>⏰ Time:</strong> ${event.time}</p>
          <p><strong>📍 Location:</strong> ${event.location}</p>
          <a href="event-details.html?id=${event.id}" class="button secondary" style="display: inline-block; margin-top: var(--spacing-md);">View Details</a>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Failed to load user registered events:", err);
  }
}


// Handle profile update
async function handleUpdateProfile(e) {
  e.preventDefault();
  const newEmail = document.getElementById("updateEmail").value;
  const newUsername = document.getElementById("updateUsername").value;

  if (!newEmail || !newUsername) {
    showMessage("updateProfileMessage", "Email and username cannot be empty.", "error");
    return;
  }

  try {
    const res = await fetch("/api/user/update-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: newEmail, username: newUsername }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("updateProfileMessage", "Profile updated successfully!", "success");
      setTimeout(() => location.reload(), 1000);
    } else {
      showMessage("updateProfileMessage", data.message || "Failed to update profile.", "error");
    }
  } catch (err) {
    console.error("Profile update failed:", err);
    showMessage("updateProfileMessage", "Server error. Try again later.", "error");
  }
}


// Handle password change
async function handleChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword = document.getElementById("confirmNewPassword").value;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    showMessage("changePasswordMessage", "All fields are required.", "error");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showMessage("changePasswordMessage", "New passwords do not match.", "error");
    return;
  }

  if (newPassword.length < 6) {
    showMessage("changePasswordMessage", "New password must be at least 6 characters.", "error");
    return;
  }

  try {
    const res = await fetch("/api/user/change-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("changePasswordMessage", "Password changed successfully!", "success");
      document.getElementById("changePasswordForm").reset();
    } else {
      showMessage("changePasswordMessage", data.message || "Failed to change password.", "error");
    }
  } catch (err) {
    console.error("Password change failed:", err);
    showMessage("changePasswordMessage", "Server error. Try again later.", "error");
  }
}


// Handle logout
async function handleLogout() {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // ✅ send session cookie to destroy it
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = "index.html";
    } else {
      alert("Logout failed.");
    }
  } catch {
    alert("Server error logging out.");
  }
}



// Setup tab switching
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      // Remove active class from all
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Add active class to clicked
      btn.classList.add("active");
      document.getElementById(tabName).classList.add("active");
    });
  });
}

async function loadDashboard() {
  try {
    // ✅ Check authentication with backend
    const authRes = await fetch("/api/auth/status", {
      method: "GET",
      credentials: "include", // include session cookie
    });
    const authData = await authRes.json();

    if (!authData.userLoggedIn) {
      window.location.href = "auth.html";
      return;
    }

    // ✅ Fetch user info
    const userRes = await fetch("/api/user/profile", {
      method: "GET",
      credentials: "include",
    });
    const userData = await userRes.json();

    if (!userData.success) {
      window.location.href = "auth.html";
      return;
    }

    const currentUser = userData.user;

    // Set welcome username
    document.getElementById("dashboardUsername").textContent =
      currentUser.username || currentUser.email;

    // ✅ Fetch user-related events from backend
    const eventsRes = await fetch("/api/events/user-dashboard", {
      method: "GET",
      credentials: "include",
    });
    const eventsData = await eventsRes.json();

    if (!eventsData.success) {
      document.getElementById("recentEventsList").innerHTML =
        `<p style="color:red;text-align:center;">Failed to load events.</p>`;
      return;
    }

    const { createdEvents, joinedEvents } = eventsData;

    // Counts
    document.getElementById("createdCount").textContent = createdEvents.length;
    document.getElementById("joinedCount").textContent = joinedEvents.length;

    // Upcoming events
    const today = new Date();
    const upcomingCount = [...createdEvents, ...joinedEvents].filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today;
    }).length;
    document.getElementById("upcomingCount").textContent = upcomingCount;

    // Recent events (limit to 6)
    const allUserEvents = [...createdEvents, ...joinedEvents].slice(0, 6);
    const recentList = document.getElementById("recentEventsList");

    if (allUserEvents.length === 0) {
      recentList.innerHTML = `
        <p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">
          No events yet. <a href="create-event.html">Create one</a> or 
          <a href="join-event.html">find events to join</a>!
        </p>
      `;
      return;
    }

    recentList.innerHTML = allUserEvents
      .map(
        (event) => `
        <div class="event-card">
          <h3>${event.name}</h3>
          <p><strong>📅 Date:</strong> ${event.date.split("T")[0]}</p>
          <p><strong>⏰ Time:</strong> ${event.time}</p>
          <p><strong>📍 Location:</strong> ${event.location}</p>
          <a href="event-details.html?id=${event.id}" class="button secondary" 
             style="display: inline-block; margin-top: var(--spacing-md);">
             View Details
          </a>
        </div>
      `
      )
      .join("");
  } catch (error) {
    console.error("Dashboard load failed:", error);
    window.location.href = "auth.html";
  }
}


function setupAuthToggle() {
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (!loginTab || !registerTab) return;

  loginTab.addEventListener("change", () => {
    if (loginTab.checked) {
      loginForm.classList.add("active");
      registerForm.classList.remove("active");
    }
  });

  registerTab.addEventListener("change", () => {
    if (registerTab.checked) {
      registerForm.classList.add("active");
      loginForm.classList.remove("active");
    }
  });
}

// Update checkAuthentication to include profile page
async function checkAuthentication() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const protectedPages = [
    "create-event.html",
    "event-details.html",
    "profile.html",
    "feedbacks.html",
  ];
  const adminPages = ["admin.html"];

  try {
    const res = await fetch("/api/auth/status", {
      method: "GET",
      credentials: "include",
    });

    // 👇 Check if response is actually JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Auth status response was not JSON.");
      if (protectedPages.includes(currentPage) || adminPages.includes(currentPage)) {
        window.location.href = "auth.html";
      }
      return;
    }

    const data = await res.json();

    const userLoggedIn = data.userLoggedIn === true;
    const adminLoggedIn = data.adminLoggedIn === true;

    if (protectedPages.includes(currentPage) && !userLoggedIn) {
      window.location.href = "auth.html";
      return;
    }

    if (adminPages.includes(currentPage) && !adminLoggedIn) {
      window.location.href = "auth.html";
      return;
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    if (protectedPages.includes(currentPage) || adminPages.includes(currentPage)) {
      window.location.href = "auth.html";
    }
  }
}




async function addLogoutButton() {
  const navActions = document.querySelector(".nav-actions");
  if (!navActions) return;

  try {
    const res = await fetch("/api/auth/status", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();

    navActions.innerHTML = ""; // clear existing buttons

    if (data.userLoggedIn) {
      navActions.innerHTML = `
        <button id="userProfileBtn" class="nav-user-btn" title="Go to Profile">👤</button>
      `;
      document.getElementById("userProfileBtn").addEventListener("click", () => {
        window.location.href = "profile.html";
      });
    } else {
      navActions.innerHTML = `<a href="auth.html" class="btn btn-outline">Sign In</a>`;
    }
  } catch (err) {
    console.error("Failed to fetch auth status:", err);
  }
}


// Call addLogoutButton after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  addLogoutButton();
});

// Call auth check on page load
document.addEventListener("DOMContentLoaded", () => {
  checkAuthentication();
  loadNavigation();
  attachFormListeners();
  loadPublicEvents();
});

// Initialize profile page
if (window.location.pathname.includes("profile.html")) {
  document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
    loadProfilePage();
    setupTabs();

    // Attach form listeners
    const updateForm = document.getElementById("updateProfileForm");
    const passwordForm = document.getElementById("changePasswordForm");
    const logoutBtn = document.getElementById("logoutBtn");

    if (updateForm) updateForm.addEventListener("submit", handleUpdateProfile);
    if (passwordForm)
      passwordForm.addEventListener("submit", handleChangePassword);
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  });
}

if (window.location.pathname.includes("dashboard.html")) {
  document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
    loadDashboard();
  });
}

if (window.location.pathname.includes("auth.html")) {
  document.addEventListener("DOMContentLoaded", () => {
    setupAuthToggle();
    attachFormListeners();
  });
}

if (window.location.pathname.includes("event-details.html")) {
  document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication(); // optional, if page is protected
    loadEventDetails();     // ✅ actually call the function
  });
}
