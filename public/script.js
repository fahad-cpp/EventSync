document.addEventListener("DOMContentLoaded", () => {
  //load navbar
  fetch("navbar.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("nav-placeholder").innerHTML = data;
  })
  .catch(err => console.error("Error loading navbar:", err));
  
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
  const eventTitle = document.getElementById("eventTitle")
  if (eventTitle) {
    const urlParams = new URLSearchParams(window.location.search)
    const eventId = urlParams.get("id")
    if (eventId) {
      // This is a static example. In a real app, you'd fetch data:
      // fetch(`/api/events/${eventId}`).then(res => res.json()).then(data => {
      //     eventTitle.textContent = data.name;
      //     document.getElementById('eventDetailDate').textContent = data.date;
      //     // ... and so on
      // });
      eventTitle.textContent = `Event ID: ${eventId} Details`
    }
  }
})
