//Handling Forms
const formMappings = [
	{formId:"adminForm",		apiUrl:"/api/admin/login",	messageId:"adminLoginMessage",	 redirectUrl:"feedbacks.html"},
	{formId:"loginForm",		apiUrl:"/api/auth/login",	messageId:"loginMessage",		 redirectUrl:"index.html"},
	{formId:"registerForm",		apiUrl:"/api/auth/register",messageId:"registerMessage",	 redirectUrl:"auth.html"},
	{formId:"createEventForm",	apiUrl:"/api/events/create",messageId:"createEventMessage",	 redirectUrl:"thank-you.html"},
	{formId:"joinEventForm",	apiUrl:"/api/events/join",	messageId:"joinEventMessage",	 redirectUrl:"thank-you.html"},
	{formId:"contactForm",		apiUrl:"/api/contact",		messageId:"contactMessageStatus",redirectUrl:"thank-you.html"},
];
formMappings.forEach(({formId,apiUrl,messageId,redirectUrl}) => {
	const form = document.getElementById(formId);
	if(form){
		form.addEventListener("submit",(event) => handleFormSubmit(event,apiUrl,messageId,redirectUrl));
	}
});
document.addEventListener("DOMContentLoaded", () => {
	loadNavbar();
	setEventRegisterButton();
	loadPublicEvents();
	setEventDetails();
});
//---Page setup---
//Navbar
async function loadNavbar(){
	fetch("navbar.html")
		.then(response => response.text())
		.then(data => {
			document.getElementById("nav-placeholder").innerHTML = data;
		})
		.catch(err => console.error("Error loading navbar:", err));
}
async function getEventDetails() {
	const eventDate = document.getElementById("eventDetailDate").textContent;
	const eventTime = document.getElementById("eventDetailTime").textContent;
	const eventLocation = document.getElementById("eventDetailLocation").textContent;
	const eventDescription = document.getElementById("eventDetailDescription").textContent;
	const bodyObj = {
		date: eventDate,
		time: eventTime,
		location: eventLocation,
		description: eventDescription
	}
	return bodyObj;
}
//Event Register Button
async function setEventRegisterButton() {
	const regButton = document.getElementById("eventRegisterButton");
	if(!regButton){
		return;
	}
	regButton.onclick = async () => {
		const bodyobj = await getEventDetails();
		const messageElement = document.getElementById("joinMessage");
		try {
			const response = await fetch("/api/events/join", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(bodyobj)
			})
			const result = await response.json();
			if (result.success) {
				updateMessage(messageElement,result.message,"success");
			} else {
				updateMessage(messageElement,result.message,"error");
			}
		} catch (error) {
			console.error("Error:", error)
			updateMessage(messageElement,"Network error. Please try again.","error");
		}
	}
}
//set event-detais page data
async function setEventDetails() {
	const eventTitle = document.getElementById("eventTitle")
	//if its the event details page
	if (eventTitle) {
		const urlParams = new URLSearchParams(window.location.search)
		const eventId = urlParams.get("id")
		if (eventId) {
			const date = document.getElementById("eventDetailDate");
			const time = document.getElementById("eventDetailTime");
			const location = document.getElementById("eventDetailLocation");
			const description = document.getElementById("eventDetailDescription");
			const response = await fetch(`/api/events/${eventId}`, { method: "POST" });
			const jsonResponse = await response.json();
			const event = jsonResponse.event[0];
			eventTitle.textContent = event.title;
			date.textContent = event.date;
			time.textContent = event.time;
			location.textContent = event.location;
			description.textContent = event.description;
		}
	}
}
//---Helpers---
//Message Update
function updateMessage(messageElement,messageText,messageClass,isAssign=false){
	if(messageElement){
		messageElement.textContent = messageText;
		if(isAssign){
			messageElement.className = messageClass;
		}else{
			if(!messageElement.classList.contains(messageClass)){
				messageElement.classList.add(messageClass);
			}
		}
	}
}
//Form submission
async function handleFormSubmit(event, apiUrl, successMessageElementId, redirectUrl = null) {
	event.preventDefault()
	const form = event.target
	const formData = new FormData(form)
	const data = Object.fromEntries(formData.entries());
	const messageElement = document.getElementById(successMessageElementId)

	updateMessage(messageElement,"Processing...","message",true);

	//Client side checks
	if(form == document.getElementById("registerForm")){
		if (data.password !== data.confirmPassword) {
			updateMessage(messageElement,"Passwords do not match!","message error",true);
			return
		}
	}

	//Send request to server
	try {
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body:JSON.stringify(data),
		})
		const result = await response.json()
		if (result.success) {
			updateMessage(messageElement,result.message,"success");
			form.reset()
			if (redirectUrl) {
				setTimeout(() => {
					window.location.href = redirectUrl
				}, 1500)
			}
		} else {
			updateMessage(messageElement,result.message || "An error occurred.","error");
		}
	} catch (error) {
		console.error("Error:", error)
		updateMessage(messageElement,"Network error. Please try again.","error");
	}
}
//Public events fetch
async function loadPublicEvents() {
	const response = await fetch("/api/events/public", { method: "POST" });
	let jsonResponse = await response.json();
	const events = jsonResponse.events;
	const eventListContainer = document.getElementsByClassName("event-list");
	for (let i = 0; i < eventListContainer.length; i++) {
		const container = eventListContainer[i];
		container.innerHTML = "";
		if (events.length == 0) {
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
			<hr>`;

			const button = document.createElement("button");
			button.textContent = "View details"
			button.onclick = async () => {
				window.location.href = `/event-details.html?id=${event.event_id}`;
				console.log("Button pressed ID:", event.event_id);
			};
			button.classList.add("button", "primary");
			container.appendChild(div);
			div.appendChild(button);
		});
	}
}