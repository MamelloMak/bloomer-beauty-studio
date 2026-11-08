// Bloomer Beauty Studio: Main JavaScript for Part 3



// ---------- Settings ------------------------------------------------------

// The studio inbox that the contact form email is addressed to.
const contactEmail = "info@bloomerbeautystudio.co.za";

// Where the enquiry form looks up service prices (fetched with AJAX).
const servicesUrl = "data/services.json";

// Trading hours, matching the footer on every page.
const hoursWeekday = "09:00 and 18:00"; // Monday to Friday
const hoursSaturday = "09:00 and 14:00"; // Saturday


// -------- Start-up ---------

// belo is the functions that run when the page loads. Each function checks if it is on the right page, and does nothing if not. This way we can put all the code
// in one file and include it on every page without errors.
document.addEventListener("DOMContentLoaded", function () {
  initEnquiryForm();
  initContactForm();
  initServicesPage();
  initGalleryPage();
  initFaqAccordion();
});


// --- Shared validation helpers ----

// Sets the error message for a field and adds or removes the "is-invalid" class. Returns true if the field is valid (no error message).
function setFieldError(field, message) {
  const errorBox = document.getElementById(field.id + "-error");
  errorBox.textContent = message;

  if (message) {
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
  } else {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
  }
  return message === "";
}

// Each check function takes the field's value and returns an error message,
// or an empty string when the value is fine.

function checkName(value) {
  const name = value.trim();
  if (name === "") return "Please enter your full name.";
  if (name.length < 2) return "Your name needs at least 2 characters.";
  if (name.length > 60) return "Your name can be 60 characters at most.";
  // Letters from any language, spaces, apostrophes and hyphens only.
  if (!/^\p{L}[\p{L} '’-]*$/u.test(name)) {
    return "Your name can only contain letters, spaces, apostrophes and hyphens.";
  }
  return "";
}

function checkEmail(value) {
  const email = value.trim();
  if (email === "") return "Please enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return "Please enter a valid email address, for example name@example.co.za.";
  }
  return "";
}

// South African phone numbers can start with +27 or 0, then a digit 1-9, then 8 more digits. Spaces and hyphens are ignored.
function checkPhone(value, required) {
  const phone = value.trim();
  if (phone === "") return required ? "Please enter your phone number." : "";
  const digitsOnly = phone.replace(/[\s-]/g, "");
  if (!/^(\+27|0)[1-9]\d{8}$/.test(digitsOnly)) {
    return "Please enter a valid South African number, for example 082 123 4567.";
  }
  return "";
}

function checkSelect(value, message) {
  return value === "" ? message : "";
}

// The date must be today or later, and not a Sunday (the studio is closed).
function checkDate(value) {
  if (value === "") return "Please choose your preferred date.";

  // Adding T00:00:00 makes the browser read the date as local time,
  // which avoids the day shifting because of time zones.
  const chosen = new Date(value + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(chosen.getTime())) return "Please enter a valid date.";
  if (chosen < today) return "Please choose today or a future date.";
  if (chosen.getDay() === 0) {
    return "We are closed on Sundays. Please choose a day from Monday to Saturday.";
  }
  return "";
}

// The message can be empty, but if it is filled in it must be between minLength and maxLength characters.
function checkMessage(value, required, minLength, maxLength) {
  const message = value.trim();
  if (message === "") return required ? "Please type your message." : "";
  if (message.length < minLength) {
    return "Your message needs at least " + minLength + " characters.";
  }
  if (message.length > maxLength) {
    return "Your message can be " + maxLength + " characters at most. You are at " + message.length + ".";
  }
  return "";
}

// the functions below are used by both the enquiry and contact forms. 
// They attach live validation to each field, and check all fields when the form is submitted.
function attachLiveValidation(rules) {
  rules.forEach(function (rule) {
    function validate() {
      setFieldError(rule.field, rule.check(rule.field.value));
    }
    rule.field.addEventListener("blur", validate);
    rule.field.addEventListener("change", validate);
    rule.field.addEventListener("input", function () {
      if (rule.field.classList.contains("is-invalid")) validate();
    });
  });
}

// Checks every field when the form is submitted. Focuses the first invalid
// field so keyboard and screen reader users land on the problem.
function validateAll(rules) {

  let firstInvalid = null;
  rules.forEach(function (rule) {
    const valid = setFieldError(rule.field, rule.check(rule.field.value));
    if (!valid && firstInvalid === null) firstInvalid = rule.field;
  });
  if (firstInvalid) firstInvalid.focus();
  return firstInvalid === null;
}

// Today's date in the format yyyy-mm-dd in local time, used for the date field's "min".
function todayAsInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// creates an element with optional text and class name, used for building the enquiry result and contact preview.
function makeElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}


// -------Enquiry form ----------

function initEnquiryForm() {
  const form = document.getElementById("enquiry-form");
  if (!form) return; // not on the enquiry page

  const nameField = document.getElementById("enquiry-name");
  const emailField = document.getElementById("enquiry-email");
  const phoneField = document.getElementById("enquiry-phone");
  const serviceField = document.getElementById("enquiry-service");
  const dateField = document.getElementById("enquiry-date");
  const messageField = document.getElementById("enquiry-message");
  const submitButton = document.getElementById("enquiry-submit");
  const resultBox = document.getElementById("enquiry-result");

  // The calendar will not let the user pick a date that has already passed.
  dateField.min = todayAsInputValue();

  const rules = [
    { field: nameField, check: checkName },
    { field: emailField, check: checkEmail },
    { field: phoneField, check: function (v) { return checkPhone(v, true); } },
    { field: serviceField, check: function (v) { return checkSelect(v, "Please choose a service."); } },
    { field: dateField, check: checkDate },
    { field: messageField, check: function (v) { return checkMessage(v, false, 0, 500); } }
  ];

  attachLiveValidation(rules);

  // "async" lets us use "await" below, so the page waits for the price
  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // stop the browser reloading the page

    resultBox.hidden = true;
    if (!validateAll(rules)) return;

    // this gives the user feedback that the form is working.
    submitButton.disabled = true;
    submitButton.textContent = "Checking availability...";

    try {
      // AJAX: fetch the services file in the background, no page reload.
      const services = await loadServices();

      const service = services.find(function (item) {
        return item.name === serviceField.value;
      });
      if (!service) throw new Error("Service not found.");

      showEnquiryResult(resultBox, {
        name: nameField.value.trim(),
        email: emailField.value.trim(),
        service: service,
        date: dateField.value
      });
    } catch (error) {
      showEnquiryProblem(resultBox);
    } finally {
      // Runs whether the request worked or failed.
      submitButton.disabled = false;
      submitButton.textContent = "Send Enquiry";
    }
  });
}

// Loads the services list from data/services.json with AJAX (fetch).
// Used by both the enquiry form and the services page.
async function loadServices() {
  const response = await fetch(servicesUrl);
  if (!response.ok) throw new Error("Could not load services.");
  return response.json();
}

// Turns a service record into a readable price, e.g. "R1,100" or "from R50 per nail".
function formatPrice(service) {
  const amount = "R" + service.price.toLocaleString("en-US");
  const prefix = service.from ? "from " : "";
  const suffix = service.unit ? " " + service.unit : "";
  return prefix + amount + suffix;
}

// Works out the opening hours for a chosen date (Sundays are already
// rejected by checkDate, so only two cases are left).
function getHoursText(dateValue) {
  const day = new Date(dateValue + "T00:00:00").getDay(); // 6 = Saturday
  return day === 6 ? hoursSaturday : hoursWeekday;
}

// Builds the response the user sees after a valid enquiry.
function showEnquiryResult(resultBox, details) {
  const dateLabel = new Date(details.date + "T00:00:00").toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  // Clear any earlier response, then build the new one.
  resultBox.replaceChildren(
    makeElement("h3", "Thank you, " + details.name),
    makeElement("p", details.service.name + " costs " + formatPrice(details.service) + "."),
    makeElement("p", dateLabel + " is open for bookings between " + getHoursText(details.date) + ". We will confirm your exact time by email."),
    makeElement("p", "We will reply to " + details.email + " within 24 hours.")
  );
  resultBox.classList.remove("is-problem");
  resultBox.hidden = false;
  resultBox.focus(); // moves keyboard and screen reader users to the response
}

// Shown if the services file cannot be loaded (for example, no connection).
function showEnquiryProblem(resultBox) {
  resultBox.replaceChildren(
    makeElement("h3", "We could not check that right now"),
    makeElement("p", "Please try again in a moment, or call us on 011 234 5678.")
  );
  resultBox.classList.add("is-problem");
  resultBox.hidden = false;
  resultBox.focus();
}


// ---Contact form (contact.html)-----

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return; // not on the contact page

  const nameField = document.getElementById("contact-name");
  const emailField = document.getElementById("contact-email");
  const phoneField = document.getElementById("contact-phone");
  const typeField = document.getElementById("contact-type");
  const messageField = document.getElementById("contact-message");
  const resultBox = document.getElementById("contact-result");

  const rules = [
    { field: nameField, check: checkName },
    { field: emailField, check: checkEmail },
    { field: phoneField, check: function (v) { return checkPhone(v, false); } },
    { field: typeField, check: function (v) { return checkSelect(v, "Please choose the type of message."); } },
    { field: messageField, check: function (v) { return checkMessage(v, true, 10, 1000); } }
  ];

  attachLiveValidation(rules);

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    resultBox.hidden = true;
    if (!validateAll(rules)) return;

    showEmailPreview(resultBox, {
      name: nameField.value.trim(),
      email: emailField.value.trim(),
      phone: phoneField.value.trim(),
      type: typeField.value,
      message: messageField.value.trim()
    });
  });
}

// Compiles the validated details into an email and shows it to the user
// with a button that opens it in their own email app, addressed to the studio.
function showEmailPreview(resultBox, details) {
  const subject = "Bloomer website message: " + details.type;

  // Each line of the email body. Phone is only added if it was filled in.
  const lines = ["Name: " + details.name, "Email: " + details.email];
  if (details.phone !== "") lines.push("Phone: " + details.phone);
  lines.push("Message type: " + details.type, "", "Message:", details.message);
  const body = lines.join("\r\n");

  // encodeURIComponent makes spaces, line breaks and symbols safe for a link.
  const mailtoLink =
    "mailto:" + contactEmail +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);

  const preview = makeElement("pre", body, "email-preview");

  const sendLink = makeElement("a", "Open in my email app", "button-link");
  sendLink.href = mailtoLink;

  resultBox.replaceChildren(
    makeElement("h3", "Your message is ready to send"),
    makeElement("p", "Check the email below, then open it in your email app. It is addressed to " + contactEmail + "."),
    preview,
    sendLink
  );
  resultBox.hidden = false;
  resultBox.focus();
}


// --------Services page (services.html)--------------

// The services page shows a list of all services, with search, category filtering and sorting. 
async function initServicesPage() {
  const list = document.getElementById("services-list");
  if (!list) return; // not on the services page

  const controls = document.getElementById("services-controls");
  const searchField = document.getElementById("services-search");
  const categoryField = document.getElementById("services-category");
  const sortField = document.getElementById("services-sort");
  const clearButton = document.getElementById("services-clear");
  const countText = document.getElementById("services-count");

  // If the file cannot be loaded, stop here. The list written in the HTML
  // stays on the page, so visitors still see every service.
  const services = await loadServices().catch(function () { return null; });
  if (services === null) return;

  // The controls only make sense when JavaScript works, so they start hidden.
  controls.hidden = false;

  // Prevent the form from submitting when the user presses Enter in the search box.
  controls.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
  });

  
  function sortServices(items, sortBy) {
    
    const copy = items.slice();
    if (sortBy === "name") {
      copy.sort(function (a, b) { return a.name.localeCompare(b.name, "en-ZA"); });
    } else if (sortBy === "price-low") {
      copy.sort(function (a, b) { return a.price - b.price; });
    } else if (sortBy === "price-high") {
      copy.sort(function (a, b) { return b.price - a.price; });
    }
    return copy;
  }

  function buildCategory(categoryName, items) {
    const section = document.createElement("section");
    const article = document.createElement("article");
    const heading = makeElement("h2", categoryName);
    const unorderedList = document.createElement("ul");

    items.forEach(function (service) {
      unorderedList.appendChild(makeElement("li", service.name + ", " + formatPrice(service)));
    });

    article.append(heading, unorderedList);
    section.appendChild(article);
    return section;
  }

  
  function render() {
    const searchTerm = searchField.value.trim().toLowerCase();
    const chosenCategory = categoryField.value;

    const matches = services.filter(function (service) {
      const matchesCategory = chosenCategory === "all" || service.category === chosenCategory;
      // The search looks at the service name and its category.
      const matchesSearch = (service.name + " " + service.category).toLowerCase().includes(searchTerm);
      return matchesCategory && matchesSearch;
    });

    const sorted = sortServices(matches, sortField.value);


    const categoryNames = [];
    services.forEach(function (service) {
      if (!categoryNames.includes(service.category)) categoryNames.push(service.category);
    });

    const blocks = [];
    categoryNames.forEach(function (categoryName) {
      const items = sorted.filter(function (service) { return service.category === categoryName; });
      if (items.length > 0) blocks.push(buildCategory(categoryName, items));
    });

    // if the services do not match the search or category, an error message is shown istead of an empty list.
    if (blocks.length === 0) {
      const section = document.createElement("section");
      const article = document.createElement("article");
      article.appendChild(makeElement("p", "No services match your search. Try a different word, or clear the filters."));
      section.appendChild(article);
      blocks.push(section);
    }

    list.replaceChildren(...blocks);
    countText.textContent = "Showing " + matches.length + " of " + services.length + " services";
  }

  // Redraws the list whenever the user types or changes a dropdown.
  searchField.addEventListener("input", render);
  categoryField.addEventListener("change", render);
  sortField.addEventListener("change", render);

  clearButton.addEventListener("click", function () {
    searchField.value = "";
    categoryField.value = "all";
    sortField.value = "default";
    render();
    searchField.focus();
  });

  render();
}


// --------Gallery page-----------

// The gallery page displays images in groups, with search and category filtering. 
// Clicking an image opens it in a lightbox, which can be closed with the Esc key or by clicking outside the image.
function initGalleryPage() {
  const groups = document.querySelectorAll(".gallery-group");
  if (groups.length === 0) return; //this is not on the gallery page

  const controls = document.getElementById("gallery-controls");
  const searchField = document.getElementById("gallery-search");
  const categoryButtons = document.querySelectorAll(".filter-btn");
  const clearButton = document.getElementById("gallery-clear");
  const countText = document.getElementById("gallery-count");
  const emptyMessage = document.getElementById("gallery-empty");
  const items = Array.from(document.querySelectorAll(".gallery-group article"));

  // The state object keeps track of the current filters and which photo is open in the lightbox.
  const state = {
    category: "all",
    searchTerm: "",
    visibleItems: items, // the photos that match the current filters
    index: 0, 
    touchStartX: 0 
  };

  // The controls only make sense when JavaScript works, so they start hidden.
  controls.hidden = false;
  controls.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault(); // Enter in the search box must not reload the page
  });


  function applyFilters() {
    const searchTerm = state.searchTerm.trim().toLowerCase();

    items.forEach(function (item) {
      const matchesCategory = state.category === "all" || item.dataset.category === state.category;
      const searchable = (item.textContent + " " + item.querySelector("img").alt + " " + item.dataset.category).toLowerCase();
      item.hidden = !(matchesCategory && searchable.includes(searchTerm));
    });

    // Hide a whole category block when none of its photos match.
    groups.forEach(function (group) {
      group.hidden = group.querySelector("article:not([hidden])") === null;
    });

    state.visibleItems = items.filter(function (item) { return !item.hidden; });
    emptyMessage.hidden = state.visibleItems.length > 0;
    countText.textContent = "Showing " + state.visibleItems.length + " of " + items.length + " photos";
  }

  categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      state.category = button.dataset.category;
      // highlights the chosen button and tells screen readers which is pressed.
      categoryButtons.forEach(function (other) {
        const isChosen = other === button;
        other.classList.toggle("active", isChosen);
        other.setAttribute("aria-pressed", String(isChosen));
      });
      applyFilters();
    });
  });

  searchField.addEventListener("input", function () {
    state.searchTerm = searchField.value;
    applyFilters();
  });

  clearButton.addEventListener("click", function () {
    searchField.value = "";
    state.searchTerm = "";
    state.category = "all";
    categoryButtons.forEach(function (button) {
      const isAll = button.dataset.category === "all";
      button.classList.toggle("active", isAll);
      button.setAttribute("aria-pressed", String(isAll));
    });
    applyFilters();
    searchField.focus();
  });

  applyFilters();


  //---- Lightbox-----


  const supportsDialog =
    typeof HTMLDialogElement === "function" &&
    typeof HTMLDialogElement.prototype.showModal === "function";
  if (!supportsDialog) return;

  const box = buildLightbox();

  // this shows the image at the given index in the lightbox, and updates the caption and counter. 
  function showImage(index) {
    const total = state.visibleItems.length;
    state.index = (index + total) % total;

    const item = state.visibleItems[state.index];
    const picture = item.querySelector("img");

    box.image.src = item.querySelector("a").href;
    box.image.alt = picture.alt;
    box.caption.textContent = item.querySelector("p").textContent;
    box.counter.textContent = (state.index + 1) + " of " + total;

    //both buttons are hidden when there is only one photo and they are shown when there are two or more images.
    box.prevButton.hidden = total < 2;
    box.nextButton.hidden = total < 2;
  }

  function openLightbox(item) {
    showImage(state.visibleItems.indexOf(item));
    box.dialog.showModal();
    document.body.classList.add("lightbox-open"); // this stops the page scrolling behind
  }

  items.forEach(function (item) {
    item.querySelector("a").addEventListener("click", function (event) {
      event.preventDefault(); // opens the lightbox instead of leaving the page
      openLightbox(item);
    });
  });

  box.prevButton.addEventListener("click", function () { showImage(state.index - 1); });
  box.nextButton.addEventListener("click", function () { showImage(state.index + 1); });
  box.closeButton.addEventListener("click", function () { box.dialog.close(); });

  // Clicking the dark area around the photo closes the lightbox.
  box.dialog.addEventListener("click", function (event) {
    if (event.target === box.dialog) box.dialog.close();
  });

  // Arrow keys move between photos. (Esc is handled by the dialog itself.)
  box.dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") showImage(state.index - 1);
    if (event.key === "ArrowRight") showImage(state.index + 1);
  });

  // Swiping left or right moves between photos on touch screens.
  box.dialog.addEventListener("touchstart", function (event) {
    state.touchStartX = event.changedTouches[0].clientX;
  });
  box.dialog.addEventListener("touchend", function (event) {
    const distance = event.changedTouches[0].clientX - state.touchStartX;
    if (distance > 50) showImage(state.index - 1); // swipe right: previous
    if (distance < -50) showImage(state.index + 1); // swipe left: next
  });

  //the lightbox function below removes the "lightbox-open" class from the body when the lightbox is closed, 
  // so the page can scroll again.
  box.dialog.addEventListener("close", function () {
    document.body.classList.remove("lightbox-open");
  });
}

//Builds the lightbox once and adds it to the page. It stays hidden until a photo is opened. 
function buildLightbox() {
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Image viewer");

  const closeButton = makeElement("button", "\u00d7", "lightbox-close");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close image viewer");

  const prevButton = makeElement("button", "\u2039", "lightbox-prev");
  prevButton.type = "button";
  prevButton.setAttribute("aria-label", "Previous image");

  const nextButton = makeElement("button", "\u203a", "lightbox-next");
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Next image");

  const figure = document.createElement("figure");
  const image = document.createElement("img");
  const caption = document.createElement("figcaption");
  figure.append(image, caption);

  // aria-live tells users which photo they have moved to.
  const counter = makeElement("p", "", "lightbox-counter");
  counter.setAttribute("aria-live", "polite");

  dialog.append(closeButton, prevButton, figure, nextButton, counter);
  document.body.appendChild(dialog);

  return {
    dialog: dialog,
    image: image,
    caption: caption,
    counter: counter,
    closeButton: closeButton,
    prevButton: prevButton,
    nextButton: nextButton
  };
}


// ------FAQ accordian(services.html) ------

//the faq section is in an accordian style, where clicking a question opens the answer. 
// The code below wraps each question in a button and hides the answer.
function initFaqAccordion() {
  const accordion = document.getElementById("faq-accordion");
  if (!accordion) return; 
  if (typeof jQuery === "undefined") return; 
  if (accordion.querySelector(".accordion-trigger")) return;

  const $accordion = $(accordion);

  // 
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $.fx.off = true;
  }

  // each question is wrapped in a button and the answer is hidden.
  $accordion.find(".accordion-question").each(function (index) {
    const $heading = $(this);
    const $panel = $heading.next(".accordion-panel");
    const triggerId = "faq-trigger-" + (index + 1);
    const panelId = "faq-panel-" + (index + 1);

    // The answer is hidden to start with and labelled by its question.
    $panel.attr({ id: panelId, role: "region", "aria-labelledby": triggerId }).hide();

    // wrapInner puts the question text inside a new button element.
    $heading.wrapInner('<button type="button" class="accordion-trigger"></button>');
    $heading.find(".accordion-trigger").attr({
      id: triggerId,
      "aria-controls": panelId,
      "aria-expanded": "false" // tells screen readers the answer is closed
    });
  });

  // One click handler on the whole accordion covers every button.
  $accordion.on("click", ".accordion-trigger", function () {
    const $trigger = $(this);
    const $panel = $("#" + $trigger.attr("aria-controls"));
    const isOpening = $trigger.attr("aria-expanded") === "false";
$trigger.attr("aria-expanded", String(isOpening));
    $panel.stop(true, true).slideToggle(250);
  });
}