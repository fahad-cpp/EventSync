document.addEventListener("DOMContentLoaded", () => {
  //load navbar
  fetch("navbar.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("nav-placeholder").innerHTML = data;
  })
  .catch(err => console.error("Error loading navbar:", err));
   //Public events fetch
  async function loadEvents(){
    const response = await fetch("/api/events/public",{method:"POST"});
    let jsonResponse = await response.json();
    const events = jsonResponse.events;
    const eventListContainer = document.getElementsByClassName("event-list");
    for(i=0;i<eventListContainer.length;i++){
      let container = eventListContainer[i];
      container.innerHTML = "";
      if(events.length == 0){
        const div = document.createElement("div");
        div.innerHTML = `
        <h3>No Public Events.</h3>
        `;
        container.appendChild(div);
      }
      events.forEach(event => {
        const div = document.createElement("div");
        div.classList.add("event-card");
        div.innerHTML = `
        <h3>${event.title}</h3>
        <p>Date : ${event.date}</p>
        <p>Location : ${event.location}</p>
        <p>Description : ${event.description}</p>
        <hr>
        `;
        const button = document.createElement("button");
        button.textContent = "View details"
        button.onclick =  () => {
          window.location.href = `/event-details.html?id=${event.event_id}`;
          console.log("Button pressed ID:",event.event_id);
        };
        button.classList.add("button","primary");
        container.appendChild(div);
        div.appendChild(button);
      });
    }
  }
  loadEvents();
  // Helper function to handle form submissions
  async function handleFormSubmit(event, apiUrl, successMessageElementId, redirectUrl = null) {
    event.preventDefault()
    const form = event.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())
    console.log(data);
    const messageElement = document.getElementById(successMessageElementId)

    messageElement.textContent = "Processing..."
    messageElement.className = "message" // Reset class

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        messageElement.textContent = result.message
        messageElement.classList.add("success")
        form.reset() // Clear form on success
        if (redirectUrl) {
          setTimeout(() => {
            window.location.href = redirectUrl
          }, 1500) // Redirect after 1.5 seconds
        }
      } else {
        messageElement.textContent = result.message || "An error occurred."
        messageElement.classList.add("error")
      }
    } catch (error) {
      console.error("Error:", error)
      messageElement.textContent = "Network error. Please try again."
      messageElement.classList.add("error")
    }
  }


 
  // Authentication Forms
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      handleFormSubmit(event, "/api/auth/login", "loginMessage", "index.html") // Redirect to home on successful login
    })
  }

  const registerForm = document.getElementById("registerForm")
  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      const password = document.getElementById("registerPassword").value
      const confirmPassword = document.getElementById("confirmPassword").value
      const registerMessage = document.getElementById("registerMessage")

      if (password !== confirmPassword) {
        registerMessage.textContent = "Passwords do not match!"
        registerMessage.className = "message error"
        event.preventDefault() // Prevent form submission
        return
      }
      handleFormSubmit(event, "/api/auth/register", "registerMessage", "auth.html") // Stay on auth page after register
    })
  }

  // Event Creation Form
  const createEventForm = document.getElementById("createEventForm")
  if (createEventForm) {
    createEventForm.addEventListener("submit", (event) => {
      handleFormSubmit(event, "/api/events/create", "createEventMessage", "thank-you.html")
    })
  }

  // Event Joining Form
  const joinEventForm = document.getElementById("joinEventForm")
  if (joinEventForm) {
    joinEventForm.addEventListener("submit", (event) => {
      handleFormSubmit(event, "/api/events/join", "joinEventMessage", "thank-you.html")
    })
  }

  // Contact Form
  const contactForm = document.getElementById("contactForm")
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      handleFormSubmit(event, "/api/contact", "contactMessageStatus", "thank-you.html")
    })
  }

  // Event Details Page - Basic dynamic content (example)
  // In a real app, you'd fetch details from the backend based on a URL parameter
  async function loadEventDetails(){
    const eventTitle = document.getElementById("eventTitle")
    if (eventTitle) {
      const urlParams = new URLSearchParams(window.location.search)
      const eventId = urlParams.get("id")
      if (eventId) {
        const date = document.getElementById("eventDetailDate");
        const time = document.getElementById("eventDetailTime");
        const location = document.getElementById("eventDetailLocation");
        const description = document.getElementById("eventDetailDescription");
        const response = await fetch(`/api/events/${eventId}`,{method:"POST"});
        const jsonResponse = await response.json();
        const event = jsonResponse.event[0];
        console.log("Event:",event);
        eventTitle.textContent = event.title;
        date.textContent = event.date;
        time.textContent = event.time;
        location.textContent = event.location;
        description.textContent = event.description;
      }
    }
  }
  loadEventDetails();
})
