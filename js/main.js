// Bloomer Beauty Studio: Main JavaScript (Part 3)



// ---------- Settings ---------------------

// The studio inbox that the contact form email is addressed to.
const CONTACT_EMAIL = "info@bloomerbeautystudio.co.za";

// Where the enquiry form looks up service prices (fetched with AJAX).
const SERVICES_URL = "data/services.json";

// Trading hours, matching the footer on every page.
const HOURS_WEEKDAY = "09:00 and 18:00"; // Monday to Friday
const HOURS_SATURDAY = "09:00 and 14:00"; // Saturday


// ------ start-up ---------------

// the forms and services wll only be initialised when the page has finished loading, so the elements exist.
document.addEventListener("DOMContentLoaded", function () {
  initEnquiryForm();
  initContactForm();
  initServicesPage();
});


// ---------- Shared validation helpers -----------

// Sets the error message for a field, and adds or removes the "is-invalid" class.
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

// South African numbers: 0 or +27, then 9 digits (spaces and hyphens allowed).
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

// The date must be today or later, and not on a Sunday, the studio is closed.
function checkDate(value) {
  if (value === "") return "Please choose your preferred date.";

  // the "T00:00:00" makes the date local, not UTC, so the comparison with today works correctly.
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

// checks the length of a message. If "required" is false, empty is fine.
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

// below is the code that attaches the validation to each field, and checks all fields when the form is submitted
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

// Today's date as yyyy-mm-dd in local time, used for the date field's "min".
function todayAsInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

function makeElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}


// ---------- Enquiry form (enquiry.html) -------------

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

  // The calendar will not let the user pick a date in the past.
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

  // async is a function that can use await inside it, so the code waits for the AJAX request to finish.
  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // stop the browser reloading the page

    resultBox.hidden = true;
    if (!validateAll(rules)) return;

    // Gives the user feedback while the request is running.
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
      // this runs whether the request worked or failed.
      submitButton.disabled = false;
      submitButton.textContent = "Send Enquiry";
    }
  });
}

// Loads the services file with AJAX. Returns a promise that resolves to the JSON data.
async function loadServices() {
  const response = await fetch(SERVICES_URL);
  if (!response.ok) throw new Error("Could not load services.");
  return response.json();
}

// Formats the price of a service for display.
function formatPrice(service) {
  const amount = "R" + service.price.toLocaleString("en-US");
  const prefix = service.from ? "from " : "";
  const suffix = service.unit ? " " + service.unit : "";
  return prefix + amount + suffix;
}

// below is the text that tells the user what hours the studio is open on the chosen date
function getHoursText(dateValue) {
  const day = new Date(dateValue + "T00:00:00").getDay(); // 6 = Saturday
  return day === 6 ? HOURS_SATURDAY : HOURS_WEEKDAY;
}

// Builds the response the user sees after a valid enquiry.
function showEnquiryResult(resultBox, details) {
  const dateLabel = new Date(details.date + "T00:00:00").toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  // Builds the response.
  resultBox.replaceChildren(
    makeElement("h3", "Thank you, " + details.name),
    makeElement("p", details.service.name + " costs " + formatPrice(details.service) + "."),
    makeElement("p", dateLabel + " is open for bookings between " + getHoursText(details.date) + ". We will confirm your exact time by email."),
    makeElement("p", "We will reply to " + details.email + " within 24 hours.")
  );
  resultBox.classList.remove("is-problem");
  resultBox.hidden = false;
  resultBox.focus(); 
}

// this shows a generic problem message when the enquiry cannot be checked (e.g. the services file cannot be loaded)
function showEnquiryProblem(resultBox) {
  resultBox.replaceChildren(
    makeElement("h3", "We could not check that right now"),
    makeElement("p", "Please try again in a moment, or call us on 011 234 5678.")
  );
  resultBox.classList.add("is-problem");
  resultBox.hidden = false;
  resultBox.focus();
}


// ---------- Contact form (contact.html) -----------

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
    "mailto:" + CONTACT_EMAIL +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);

  const preview = makeElement("pre", body, "email-preview");

  const sendLink = makeElement("a", "Open in my email app", "button-link");
  sendLink.href = mailtoLink;

  resultBox.replaceChildren(
    makeElement("h3", "Your message is ready to send"),
    makeElement("p", "Check the email below, then open it in your email app. It is addressed to " + CONTACT_EMAIL + "."),
    preview,
    sendLink
  );
  resultBox.hidden = false;
  resultBox.focus();
}


// ------Services page (services.html) -----

// The services page is built from the JSON file, so it can be filtered and sorted without reloading the page.
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

  // Returns a sorted copy. slice() copies the list so the original order is never changed.
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

  // Builds one category block, using the same structure as the original
  // HTML (section, article, heading, list) so the Part 2 CSS still applies.
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

  // Redraws the list of services according to the current search, category and sort.
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

    // Keep the categories in the order they first appear in the file.
    const categoryNames = [];
    services.forEach(function (service) {
      if (!categoryNames.includes(service.category)) categoryNames.push(service.category);
    });

    const blocks = [];
    categoryNames.forEach(function (categoryName) {
      const items = sorted.filter(function (service) { return service.category === categoryName; });
      if (items.length > 0) blocks.push(buildCategory(categoryName, items));
    });

    // If no services match, a message will display instead of an empty list.
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

  // Redraw whenever the user types or changes a dropdown.
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