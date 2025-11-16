function showMessage(elementId, message, type) {
  const messageEl = document.getElementById(elementId);
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("loginMessage", "Login successful!", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 1000);
    } else {
      showMessage("loginMessage", data.message, "error");
    }
  } catch (err) {
    showMessage("loginMessage", "Server error", "error");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const fullName = document.getElementById("registerFullName").value.trim();
  const phone = document.getElementById("registerPhone").value.trim();

  if (password !== confirmPassword) {
    return showMessage("registerMessage", "Passwords do not match", "error");
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, fullName, phone }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("registerMessage", "Registration successful! Login to continue.", "success");
      setTimeout(() => {
        document.getElementById("registerForm").reset();
        document.getElementById("loginTab").checked = true;
        // Trigger form display update
        const loginTab = document.getElementById("loginTab");
        loginTab.dispatchEvent(new Event('change'));
      }, 1000);
    } else {
      showMessage("registerMessage", data.message, "error");
    }
  } catch (err) {
    showMessage("registerMessage", "Server error", "error");
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  try {
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success) {
      showMessage("adminMessage", "Admin login successful!", "success");
      setTimeout(() => (window.location.href = "admin-dashboard.html"), 1000);
    } else {
      showMessage("adminMessage", data.message, "error");
    }
  } catch (err) {
    showMessage("adminMessage", "Server error", "error");
  }
}

async function handleLogout() {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = "index.html";
    }
  } catch (err) {
    alert("Logout failed");
  }
}

async function checkAuthentication() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const protectedPages = ["dashboard.html", "venues.html", "my-bookings.html", "profile.html", "venue-details.html", "booking-payment.html"];
  const adminPages = ["admin-dashboard.html", "admin-users.html", "admin-venues.html", "admin-bookings.html"];

  try {
    const res = await fetch("/api/auth/status", {
      credentials: "include",
    });
    const data = await res.json();

    if (protectedPages.includes(currentPage) && !data.loggedIn) {
      window.location.href = "auth.html";
    }

    if (adminPages.includes(currentPage) && !data.isAdmin) {
      window.location.href = "auth.html";
    }
  } catch (err) {
    console.error("Auth check failed:", err);
  }
}

async function loadVenues() {
  try {
    const res = await fetch("/api/venues");
    const data = await res.json();

    if (!data.success || !data.venues) return;

    window.allVenues = data.venues;
    displayVenues(data.venues);
  } catch (err) {
    console.error("Error loading venues:", err);
  }
}

function displayVenues(venues) {
  const venuesList = document.getElementById("venuesList");
  if (!venuesList) return;

  if (venues.length === 0) {
    venuesList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No venues found</p>';
    return;
  }

  venuesList.innerHTML = venues.map(venue => `
    <div class="venue-card">
      <h3>${venue.venue_name}</h3>
      <p><strong>Location:</strong> ${venue.location}, ${venue.city}</p>
      <p><strong>Capacity:</strong> <span class="capacity">${venue.capacity} guests</span></p>
      <p class="price">₹${venue.price_per_event} per event</p>
      <p><strong>Amenities:</strong> ${venue.amenities || "N/A"}</p>
      <a href="venue-details.html?id=${venue.venue_id}" class="btn btn-primary" style="display: inline-block; margin-top: var(--spacing-md);">View & Book</a>
    </div>
  `).join("");
}

function filterVenues() {
  if (!window.allVenues) return;

  const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const city = document.getElementById("cityFilter")?.value || "";
  const capacity = parseInt(document.getElementById("capacityFilter")?.value) || 0;

  const filtered = window.allVenues.filter(venue => {
    const matchesSearch = venue.venue_name.toLowerCase().includes(searchTerm) || venue.location.toLowerCase().includes(searchTerm);
    const matchesCity = !city || venue.city === city;
    const matchesCapacity = venue.capacity >= capacity;

    return matchesSearch && matchesCity && matchesCapacity;
  });

  displayVenues(filtered);
}

async function loadVenueDetails() {
  const params = new URLSearchParams(window.location.search);
  const venueId = params.get("id");

  if (!venueId) {
    window.location.href = "venues.html";
    return;
  }

  try {
    const res = await fetch(`/api/venues/${venueId}`);
    const data = await res.json();

    if (!data.success) throw new Error("Venue not found");

    const venue = data.venue;
    window.currentVenue = venue;

    document.getElementById("venueName").textContent = venue.venue_name;
    document.getElementById("venueLocation").textContent = venue.location;
    document.getElementById("venueCity").textContent = venue.city;
    document.getElementById("venueState").textContent = venue.state;
    document.getElementById("venueCapacity").textContent = venue.capacity;
    document.getElementById("bookingAdvance").textContent = venue.booking_advance_days;
    document.getElementById("venuePrice").textContent = venue.price_per_event;
    document.getElementById("venueAmenities").textContent = venue.amenities || "N/A";
    document.getElementById("venueDescription").textContent = venue.description;
    document.getElementById("ownerName").textContent = venue.full_name;
    document.getElementById("ownerPhone").textContent = venue.contact_phone;
    document.getElementById("ownerEmail").textContent = venue.contact_email;

    const imageContainer = document.getElementById("venueImageContainer");
    if (venue.images_url) {
      const imageData = venue.images_url.startsWith('data:') ? venue.images_url : `data:image/jpeg;base64,${venue.images_url}`;
      imageContainer.style.backgroundImage = `url('${imageData}')`;
      imageContainer.style.backgroundSize = 'cover';
      imageContainer.style.backgroundPosition = 'center';
    } else {
      imageContainer.style.backgroundColor = 'var(--surface-light)';
    }
  } catch (err) {
    console.error("Error loading venue:", err);
    document.querySelector(".venue-details-container").innerHTML = "<p>Failed to load venue details</p>";
  }
}

async function handleBooking(e) {
  e.preventDefault();

  const eventType = document.getElementById("eventType").value;
  const eventDate = document.getElementById("eventDate").value;
  const eventTime = document.getElementById("eventTime").value;
  const guestCount = parseInt(document.getElementById("guestCount").value);
  const specialRequests = document.getElementById("specialRequests").value;

  if (!window.currentVenue) {
    showMessage("bookingMessage", "Venue not found", "error");
    return;
  }

  try {
    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        venueId: window.currentVenue.venue_id,
        eventType,
        eventDate,
        eventTime,
        guestCount,
        specialRequests,
      }),
    });

    const data = await res.json();

    if (data.success) {
      window.currentBooking = {
        bookingId: data.bookingId,
        totalAmount: data.totalAmount,
        venueName: window.currentVenue.venue_name,
        eventType,
        eventDate,
        guestCount,
      };

      setTimeout(() => (window.location.href = "booking-payment.html"), 1500);
    } else {
      showMessage("bookingMessage", data.message, "error");
    }
  } catch (err) {
    showMessage("bookingMessage", "Booking error", "error");
  }
}

function updateTotalPrice() {
  if (window.currentVenue) {
    const totalEl = document.getElementById("totalPrice");
    if (totalEl) {
      totalEl.textContent = `₹${window.currentVenue.price_per_event}`;
    }
  }
}

async function handlePayment(e) {
  e.preventDefault();

  if (!window.currentBooking) {
    showMessage("paymentMessage", "Booking not found", "error");
    return;
  }

  const paymentMethod = document.getElementById("paymentMethod").value;

  try {
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        bookingId: window.currentBooking.bookingId,
        paymentMethod,
      }),
    });

    const data = await res.json();

    if (data.success) {
      showMessage("paymentMessage", "Payment successful! Booking confirmed.", "success");
      setTimeout(() => (window.location.href = "my-bookings.html"), 2000);
    } else {
      showMessage("paymentMessage", data.message, "error");
    }
  } catch (err) {
    showMessage("paymentMessage", "Payment error", "error");
  }
}

function initPaymentForm() {
  const booking = window.currentBooking;
  if (!booking) {
    window.location.href = "venues.html";
    return;
  }

  document.getElementById("summaryVenue").textContent = booking.venueName;
  document.getElementById("summaryDate").textContent = booking.eventDate;
  document.getElementById("summaryType").textContent = booking.eventType;
  document.getElementById("summaryGuests").textContent = booking.guestCount;
  document.getElementById("summaryAmount").textContent = `₹${booking.totalAmount}`;
}

async function loadMyBookings(status = "all") {
  try {
    const res = await fetch("/api/bookings/user", {
      credentials: "include",
    });

    const data = await res.json();
    if (!data.success) {
      window.location.href = "auth.html";
      return;
    }

    let bookings = data.bookings;

    if (status !== "all") {
      bookings = bookings.filter(b => b.booking_status === status);
    }

    displayMyBookings(bookings);
  } catch (err) {
    console.error("Error loading bookings:", err);
  }
}

function displayMyBookings(bookings) {
  const bookingsList = document.getElementById("bookingsList");
  if (!bookingsList) return;

  if (bookings.length === 0) {
    bookingsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No bookings found</p>';
    return;
  }

  bookingsList.innerHTML = bookings.map(booking => `
    <div class="event-card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
        <h3>${booking.venue_name}</h3>
        <span class="status-badge ${booking.booking_status}">${booking.booking_status.toUpperCase()}</span>
      </div>
      <p><strong>Event Type:</strong> ${booking.event_type}</p>
      <p><strong>Date:</strong> ${new Date(booking.event_date).toLocaleDateString()}</p>
      <p><strong>Guests:</strong> ${booking.guest_count}</p>
      <p><strong>Amount:</strong> ₹${booking.total_amount}</p>
      ${booking.booking_status === "confirmed" || booking.booking_status === "pending" ? `
        <button class="btn btn-danger" onclick="cancelBooking(${booking.booking_id})" style="margin-top: var(--spacing-md);">Cancel Booking</button>
      ` : ""}
    </div>
  `).join("");
}

async function cancelBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  try {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "PUT",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      alert("Booking cancelled successfully");
      loadMyBookings("all");
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Error cancelling booking");
  }
}

async function loadDashboard() {
  try {
    const authRes = await fetch("/api/auth/status", {
      credentials: "include",
    });
    const authData = await authRes.json();

    if (!authData.loggedIn) {
      window.location.href = "auth.html";
      return;
    }

    const userRes = await fetch("/api/user/profile", {
      credentials: "include",
    });
    const userData = await userRes.json();

    if (userData.success) {
      document.getElementById("dashboardUsername").textContent = userData.user.username;
    }

    const bookingsRes = await fetch("/api/bookings/user", {
      credentials: "include",
    });
    const bookingsData = await bookingsRes.json();

    if (bookingsData.success) {
      const bookings = bookingsData.bookings;
      document.getElementById("totalBookings").textContent = bookings.length;
      document.getElementById("confirmedBookings").textContent = bookings.filter(b => b.booking_status === "confirmed").length;
      
      const totalSpent = bookings
        .filter(b => b.booking_status !== "cancelled")
        .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
      document.getElementById("totalSpent").textContent = `₹${totalSpent}`;

      const recentList = document.getElementById("recentBookingsList");
      const recent = bookings.slice(0, 3);

      if (recent.length === 0) {
        recentList.innerHTML = `
          <p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">
            No bookings yet. <a href="venues.html">Browse venues</a>
          </p>
        `;
      } else {
        recentList.innerHTML = recent.map(booking => `
          <div class="event-card">
            <h3>${booking.venue_name}</h3>
            <p><strong>Date:</strong> ${new Date(booking.event_date).toLocaleDateString()}</p>
            <p><strong>Type:</strong> ${booking.event_type}</p>
            <p><strong>Status:</strong> <span class="status-badge ${booking.booking_status}">${booking.booking_status}</span></p>
          </div>
        `).join("");
      }
    }
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

async function loadProfile() {
  try {
    const res = await fetch("/api/user/profile", {
      credentials: "include",
    });
    const data = await res.json();

    if (!data.success) {
      window.location.href = "auth.html";
      return;
    }

    const user = data.user;
    document.getElementById("profileUsername").textContent = user.username;
    document.getElementById("profileEmail").textContent = user.email;
    document.getElementById("profileFullName").textContent = user.full_name || "Not provided";
    document.getElementById("profilePhone").textContent = user.phone || "Not provided";

    document.getElementById("editUsername").value = user.username;
    document.getElementById("editEmail").value = user.email;
    document.getElementById("editFullName").value = user.full_name || "";
    document.getElementById("editPhone").value = user.phone || "";

    const bookingsRes = await fetch("/api/bookings/user", {
      credentials: "include",
    });
    const bookingsData = await bookingsRes.json();

    if (bookingsData.success) {
      const bookings = bookingsData.bookings;
      const confirmed = bookings.filter(b => b.booking_status === "confirmed").length;
      const pending = bookings.filter(b => b.booking_status === "pending").length;
      const totalSpent = bookings
        .filter(b => b.booking_status !== "cancelled")
        .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

      document.getElementById("statTotalBookings").textContent = bookings.length;
      document.getElementById("statConfirmed").textContent = confirmed;
      document.getElementById("statPending").textContent = pending;
      document.getElementById("statTotalSpent").textContent = `₹${totalSpent}`;
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

function toggleEditMode() {
  const viewMode = document.querySelector(".profile-card:not(#editProfileForm)");
  const editForm = document.getElementById("editProfileForm");

  viewMode.style.display = viewMode.style.display === "none" ? "block" : "none";
  editForm.style.display = editForm.style.display === "none" ? "block" : "none";
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const email = document.getElementById("editEmail").value;
  const username = document.getElementById("editUsername").value;
  const fullName = document.getElementById("editFullName").value;
  const phone = document.getElementById("editPhone").value;

  try {
    const res = await fetch("/api/user/update-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, username, fullName, phone, address: "" }),
    });

    const data = await res.json();

    if (data.success) {
      showMessage("updateMessage", "Profile updated successfully!", "success");
      setTimeout(() => {
        toggleEditMode();
        loadProfile();
      }, 1000);
    } else {
      showMessage("updateMessage", data.message, "error");
    }
  } catch (err) {
    showMessage("updateMessage", "Error updating profile", "error");
  }
}

async function loadAdminDashboard() {
  try {
    const res = await fetch("/api/admin/reports", {
      credentials: "include",
    });
    const data = await res.json();

    if (data.success) {
      const stats = data.stats;
      document.getElementById("totalVenues").textContent = stats.totalVenues;
      document.getElementById("totalUsers").textContent = stats.totalUsers;
      document.getElementById("totalBookings").textContent = stats.totalBookings;
      document.getElementById("confirmedBookings").textContent = stats.confirmedBookings;
      document.getElementById("totalRevenue").textContent = `₹${stats.totalRevenue}`;
    }

    const bookingsRes = await fetch("/api/admin/bookings", {
      credentials: "include",
    });
    const bookingsData = await bookingsRes.json();

    if (bookingsData.success) {
      const recent = bookingsData.bookings.slice(0, 5);
      const activityHtml = recent.map(booking => `
        <div style="padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
          <p><strong>${booking.username}</strong> booked ${booking.venue_name}</p>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">
            ${new Date(booking.created_at).toLocaleDateString()} - <span class="status-badge ${booking.booking_status}">${booking.booking_status}</span>
          </p>
        </div>
      `).join("");
      document.getElementById("recentActivity").innerHTML = activityHtml || "<p>No recent activity</p>";
    }
  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

async function loadAdminVenues() {
  try {
    const res = await fetch("/api/venues");
    const data = await res.json();

    if (data.success) {
      displayAdminVenues(data.venues);
    }
  } catch (err) {
    console.error("Error loading venues:", err);
  }
}

function displayAdminVenues(venues) {
  const venuesList = document.getElementById("venuesList");
  if (!venuesList) return;

  if (venues.length === 0) {
    venuesList.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No venues</p>';
    return;
  }

  venuesList.innerHTML = venues.map(venue => `
    <div class="venue-card">
      <h3>${venue.venue_name}</h3>
      <p><strong>Location:</strong> ${venue.location}, ${venue.city}</p>
      <p><strong>Capacity:</strong> ${venue.capacity} guests</p>
      <p class="price">₹${venue.price_per_event}</p>
      <p><strong>Owner Contact:</strong> ${venue.contact_phone}</p>
      <div style="margin-top: var(--spacing-md);">
        <button class="btn btn-secondary" onclick="editVenue(${venue.venue_id})" style="margin-right: var(--spacing-sm);">Edit</button>
        <button class="btn btn-danger" onclick="deleteVenue(${venue.venue_id})">Delete</button>
      </div>
    </div>
  `).join("");
}

function toggleVenueForm() {
  const form = document.getElementById("venueFormContainer");
  form.style.display = form.style.display === "none" ? "block" : "none";
  if (form.style.display === "block") {
    document.getElementById("venueForm").reset();
    document.getElementById("formTitle").textContent = "Add New Venue";
    window.editingVenueId = null;
  }
}

async function editVenue(venueId) {
  try {
    const res = await fetch(`/api/venues/${venueId}`);
    const data = await res.json();
    
    if (!data.success) {
      alert("Failed to load venue");
      return;
    }

    const venue = data.venue;
    window.editingVenueId = venueId;

    document.getElementById("formTitle").textContent = "Edit Venue";
    document.getElementById("venueName").value = venue.venue_name;
    document.getElementById("location").value = venue.location;
    document.getElementById("city").value = venue.city;
    document.getElementById("state").value = venue.state;
    document.getElementById("zipCode").value = venue.zip_code || "";
    document.getElementById("description").value = venue.description;
    document.getElementById("capacity").value = venue.capacity;
    document.getElementById("pricePerEvent").value = venue.price_per_event;
    document.getElementById("amenities").value = venue.amenities || "";
    document.getElementById("contactName").value = venue.contact_name || "";
    document.getElementById("contactPhone").value = venue.contact_phone || "";
    document.getElementById("contactEmail").value = venue.contact_email || "";
    document.getElementById("bookingAdvanceDays").value = venue.booking_advance_days;
    document.getElementById("venueImage").value = "";

    document.getElementById("venueFormContainer").style.display = "block";
    window.scrollTo(0, 0);
  } catch (err) {
    alert("Error loading venue");
  }
}

async function handleCreateVenue(e) {
  e.preventDefault();

  const venueData = {
    venueName: document.getElementById("venueName").value,
    location: document.getElementById("location").value,
    city: document.getElementById("city").value,
    state: document.getElementById("state").value,
    zipCode: document.getElementById("zipCode").value,
    description: document.getElementById("description").value,
    capacity: parseInt(document.getElementById("capacity").value),
    pricePerEvent: parseFloat(document.getElementById("pricePerEvent").value),
    amenities: document.getElementById("amenities").value,
    contactName: document.getElementById("contactName").value,
    contactPhone: document.getElementById("contactPhone").value,
    contactEmail: document.getElementById("contactEmail").value,
    bookingAdvanceDays: parseInt(document.getElementById("bookingAdvanceDays").value),
  };

  const imageFile = document.getElementById("venueImage")?.files[0];
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = async function(event) {
      const base64Image = event.target.result;
      venueData.images_url = base64Image;

      try {
        const res = await fetch(window.editingVenueId ? `/api/venues/${window.editingVenueId}` : "/api/venues/create", {
          method: window.editingVenueId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(venueData),
        });

        const data = await res.json();

        if (data.success) {
          showMessage("venueFormMessage", window.editingVenueId ? "Venue updated successfully!" : "Venue created successfully!", "success");
          setTimeout(() => {
            toggleVenueForm();
            document.getElementById("venueForm").reset();
            window.editingVenueId = null;
            loadAdminVenues();
          }, 1000);
        } else {
          showMessage("venueFormMessage", data.message, "error");
        }
      } catch (err) {
        showMessage("venueFormMessage", "Error saving venue", "error");
      }
    };
    reader.readAsDataURL(imageFile);
  } else {
    try {
      const res = await fetch(window.editingVenueId ? `/api/venues/${window.editingVenueId}` : "/api/venues/create", {
        method: window.editingVenueId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(venueData),
      });

      const data = await res.json();

      if (data.success) {
        showMessage("venueFormMessage", window.editingVenueId ? "Venue updated successfully!" : "Venue created successfully!", "success");
        setTimeout(() => {
          toggleVenueForm();
          document.getElementById("venueForm").reset();
          window.editingVenueId = null;
          loadAdminVenues();
        }, 1000);
      } else {
        showMessage("venueFormMessage", data.message, "error");
      }
    } catch (err) {
      showMessage("venueFormMessage", "Error saving venue", "error");
    }
  }
}

async function deleteVenue(venueId) {
  if (!confirm("Are you sure?")) return;

  try {
    const res = await fetch(`/api/venues/${venueId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      alert("Venue deleted");
      loadAdminVenues();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Error deleting venue");
  }
}

async function loadAdminBookings(status = "all") {
  try {
    const res = await fetch("/api/admin/bookings", {
      credentials: "include",
    });

    const data = await res.json();
    if (!data.success) return;

    let bookings = data.bookings;

    if (status !== "all") {
      bookings = bookings.filter(b => b.booking_status === status);
    }

    displayAdminBookings(bookings);
  } catch (err) {
    console.error("Error loading bookings:", err);
  }
}

function displayAdminBookings(bookings) {
  const tbody = document.getElementById("bookingsTable");
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No bookings</td></tr>';
    return;
  }

  tbody.innerHTML = bookings.map(booking => `
    <tr>
      <td>#${booking.booking_id}</td>
      <td>${booking.username}</td>
      <td>${booking.venue_name}</td>
      <td>${new Date(booking.event_date).toLocaleDateString()}</td>
      <td>${booking.event_type}</td>
      <td>${booking.guest_count}</td>
      <td><span class="status-badge ${booking.booking_status}">${booking.booking_status}</span></td>
      <td>₹${booking.total_amount}</td>
      <td>
        ${booking.booking_status === "pending" ? `
          <button class="btn btn-primary" onclick="confirmBooking(${booking.booking_id})" style="padding: var(--spacing-xs) var(--spacing-sm); font-size: 0.85rem; margin-right: 4px;">Confirm</button>
        ` : ""}
        ${booking.booking_status !== "cancelled" ? `
          <button class="btn btn-danger" onclick="adminCancelBooking(${booking.booking_id})" style="padding: var(--spacing-xs) var(--spacing-sm); font-size: 0.85rem;">Cancel</button>
        ` : ""}
      </td>
    </tr>
  `).join("");
}

async function confirmBooking(bookingId) {
  if (!confirm("Confirm this booking?")) return;

  try {
    const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
      method: "PUT",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      alert("Booking confirmed");
      loadAdminBookings("all");
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Error confirming booking");
  }
}

async function adminCancelBooking(bookingId) {
  if (!confirm("Cancel this booking?")) return;

  try {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "PUT",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      alert("Booking cancelled");
      loadAdminBookings("all");
    } else {
      alert("Error");
    }
  } catch (err) {
    alert("Error");
  }
}

async function loadAdminUsers() {
  try {
    const res = await fetch("/api/admin/users", {
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      displayAdminUsers(data.users);
    }
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

function displayAdminUsers(users) {
  const tbody = document.getElementById("usersTable");
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No users</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>#${user.user_id}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.full_name || "-"}</td>
      <td>${user.phone || "-"}</td>
      <td>${new Date(user.created_at).toLocaleDateString()}</td>
      <td>
        ${user.role === 'user' ? `
          <button class="btn btn-danger" onclick="deleteUser(${user.user_id})" style="padding: var(--spacing-xs) var(--spacing-sm); font-size: 0.85rem;">Delete</button>
        ` : ""}
      </td>
    </tr>
  `).join("");
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      alert("User deleted successfully");
      loadAdminUsers();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Error deleting user");
  }
}

function setupAuthTabs() {
  const tabs = document.querySelectorAll(".auth-tabs input");
  const forms = document.querySelectorAll(".auth-tabs ~ .form");

  tabs.forEach((tab, index) => {
    tab.addEventListener("change", () => {
      forms.forEach(f => f.classList.remove("active"));
      if (tab.checked && forms[index]) {
        forms[index].classList.add("active");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  async function updateNav() {
    const navActions = document.getElementById("navActions");
    const navLinks = document.getElementById("navLinks");
    if (!navActions || !navLinks) return;
    try {
      const res = await fetch("/api/auth/status", {
        credentials: "include",
      });
      const data = await res.json();

      if (data.loggedIn) {
        navActions.innerHTML = `
          <a href="profile.html" class="btn btn-secondary">Profile</a>
          <button id="logoutBtn" class="btn btn-outline">Logout</button>
        `;
        navLinks.innerHTML = `
          <a href="dashboard.html" class="nav-link">Dashboard</a>
          <a href="venues.html" class="nav-link">Venues</a>
        `
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
          logoutBtn.addEventListener("click", handleLogout);
        }
      }
    } catch (err) {
      console.error("Error updating nav:", err);
    }
  }

  updateNav();

  if (currentPage === "auth.html") {
    setupAuthTabs();
    document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
    document.getElementById("registerForm")?.addEventListener("submit", handleRegister);
    document.getElementById("adminForm")?.addEventListener("submit", handleAdminLogin);
  }

  if (currentPage === "dashboard.html") {
    checkAuthentication();
    loadDashboard();
  }

  if (currentPage === "venues.html") {
    checkAuthentication();
    loadVenues();
    document.getElementById("searchInput")?.addEventListener("input", filterVenues);
    document.getElementById("cityFilter")?.addEventListener("change", filterVenues);
    document.getElementById("capacityFilter")?.addEventListener("input", filterVenues);
  }

  if (currentPage === "venue-details.html") {
    checkAuthentication();
    loadVenueDetails();
    updateTotalPrice();
    document.getElementById("bookingForm")?.addEventListener("submit", handleBooking);
  }

  if (currentPage === "booking-payment.html") {
    checkAuthentication();
    initPaymentForm();
    document.getElementById("paymentForm")?.addEventListener("submit", handlePayment);
    document.getElementById("paymentMethod")?.addEventListener("change", function() {
      const cardDetails = document.getElementById("cardDetails");
      if (this.value === "credit_card" || this.value === "debit_card") {
        cardDetails.style.display = "block";
      } else {
        cardDetails.style.display = "none";
      }
    });
  }

  if (currentPage === "my-bookings.html") {
    checkAuthentication();
    loadMyBookings("all");
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadMyBookings(btn.dataset.status);
      });
    });
  }

  if (currentPage === "profile.html") {
    checkAuthentication();
    loadProfile();
    document.getElementById("updateForm")?.addEventListener("submit", handleUpdateProfile);
  }

  if (currentPage === "admin-dashboard.html") {
    checkAuthentication();
    loadAdminDashboard();
  }

  if (currentPage === "admin-venues.html") {
    checkAuthentication();
    loadAdminVenues();
    document.getElementById("venueForm")?.addEventListener("submit", handleCreateVenue);
  }

  if (currentPage === "admin-bookings.html") {
    checkAuthentication();
    loadAdminBookings("all");
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        loadAdminBookings(btn.dataset.status);
      });
    });
  }

  if (currentPage === "admin-users.html") {
    checkAuthentication();
    loadAdminUsers();
  }

  document.querySelectorAll("#logoutBtn").forEach(btn => {
    btn.addEventListener("click", handleLogout);
  });

  if (currentPage === "index.html" || !currentPage) {
    loadHeroStats();
  }
});

async function loadHeroStats() {
  try {
    const res = await fetch("/api/stats");
    const data = await res.json();

    if (!data.success) return;

    const venuesEl = document.getElementById("statsVenues");
    const bookingsEl = document.getElementById("statsBookings");
    const usersEl = document.getElementById("statsUsers");

    if (venuesEl) venuesEl.textContent = data.totalVenues || 0;
    if (bookingsEl) bookingsEl.textContent = data.totalBookings || 0;
    if (usersEl) usersEl.textContent = data.totalUsers || 0;
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}
