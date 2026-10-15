
"use strict";

const API_URL = "http://localhost:8080/api/employees";

const params = new URLSearchParams(window.location.search);
const employeeId = params.get("id");

const profileError = document.getElementById("profile-error");
const editButton = document.getElementById("edit-profile-btn");

function formatSalary(salary) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(salary) || 0);
}

function setText(id, value) {
  document.getElementById(id).textContent = value ?? "—";
}

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("");
}

async function loadEmployeeProfile() {
  if (!employeeId || !/^\d+$/.test(employeeId)) {
    throw new Error("No valid employee ID was provided.");
  }

  const response = await fetch(`${API_URL}/${employeeId}`);

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "Employee not found."
        : "Unable to load employee details."
    );
  }

  const employee = await response.json();

  setText("profile-name", employee.name);
  setText("profile-job-title", employee.jobTitle);
  setText("profile-job-detail", employee.jobTitle);
  setText("profile-email", employee.email);
  setText("profile-department", employee.department);
  setText("profile-salary", formatSalary(employee.salary));
  setText("profile-id", employee.id);

  setText(
    "profile-created-at",
    employee.createdAt
      ? new Date(employee.createdAt).toLocaleString()
      : "Not available"
  );

  const initials = getInitials(employee.name);
  setText("profile-initials", initials || "--");

  const statusElement = document.getElementById("profile-status");
  statusElement.textContent = employee.status || "Unknown";
  statusElement.className = "status " + (employee.status || "");

  document.title = `PeopleDesk | ${employee.name}`;

  editButton.addEventListener("click", () => {
    window.location.href =
      `employees.html?edit=${encodeURIComponent(employee.id)}`;
  });
}

document.getElementById("back-button").addEventListener("click", () => {
  window.location.href = "employees.html";
});

loadEmployeeProfile().catch(error => {
  console.error(error);
  setText("profile-name", "Unable to load profile");
  setText("profile-job-title", "");
  profileError.textContent = error.message;
  editButton.disabled = true;
});
