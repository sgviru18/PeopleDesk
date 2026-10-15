"use strict";

// 1. CONFIGURATION
const API_URL = "http://localhost:8080/api/employees";
const PAGE_SIZE = 10;
const MAX_PHOTO_SIZE = 1024 * 1024;

const allowedDepartments = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Sales",
  "Operations"
];

let employees = [];
let currentPage = 1;
let sortOption = "name-asc";
let selectedPhoto = "";
let viewingEmployeeId = null;

// 2. BACKEND API
function mapEmployee(employee) {
  return {
    ...employee,
    id: Number(employee.id),
    salary: Number(employee.salary),
    photo: employee.photoUrl || ""
  };
}

async function loadEmployees() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Unable to load employees from the server.");
  }
  return (await response.json()).map(mapEmployee);
}

async function saveEmployeeToAPI(data, id) {
  const payload = {
    name: data.name,
    email: data.email,
    department: data.department,
    jobTitle: data.jobTitle,
    salary: data.salary,
    status: data.status,
    photoUrl: selectedPhoto || null
  };

  const response = await fetch(
    id ? `${API_URL}/${id}` : API_URL,
    {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    throw new Error(await response.text() || "Unable to save employee.");
  }

  return mapEmployee(await response.json());
}

async function deleteEmployeeFromAPI(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(await response.text() || "Unable to delete employee.");
  }
}

// 3. HTML ELEMENT REFERENCES
const tableBody = document.getElementById("employee-table-body");
const searchInput = document.getElementById("search-input");
const departmentFilter = document.getElementById("department-filter");
const statusFilter = document.getElementById("status-filter");
const sortSelect = document.getElementById("sort-select");

const exportCsvButton = document.getElementById("export-csv-btn");
const previousPageButton = document.getElementById("prev-page-btn");
const nextPageButton = document.getElementById("next-page-btn");
const pageInfo = document.getElementById("page-info");

const dialog = document.getElementById("employee-dialog");
const employeeForm = document.getElementById("employee-form");
const formError = document.getElementById("form-error");

const photoInput = document.getElementById("employee-photo");
const photoPreview = document.getElementById("photo-preview");
const removePhotoButton = document.getElementById("remove-photo-btn");

// 4. HELPER FUNCTIONS
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[character];
  });
}

function getInitials(name) {
  return String(name || "").trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("");
}

// 5. PHOTO PREVIEW
function updatePhotoPreview(photo = "") {
  selectedPhoto = photo;

  if (!photoPreview || !removePhotoButton) return;

  if (photo) {
    photoPreview.src = photo;
    photoPreview.hidden = false;
    removePhotoButton.hidden = false;
  } else {
    photoPreview.removeAttribute("src");
    photoPreview.hidden = true;
    removePhotoButton.hidden = true;
  }
}

if (photoInput) {
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please select a JPG, PNG, or WebP image.");
      photoInput.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      alert("The photo must be 1 MB or smaller.");
      photoInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updatePhotoPreview(reader.result);
      }
    };
    reader.onerror = () => {
      alert("Unable to read the selected photo.");
      photoInput.value = "";
    };
    reader.readAsDataURL(file);
  });
}

if (removePhotoButton) {
  removePhotoButton.addEventListener("click", () => {
    if (photoInput) photoInput.value = "";
    updatePhotoPreview("");
  });
}

// 6. DASHBOARD STATISTICS
function updateStatistics() {
  const total = employees.length;
  const active = employees.filter(
    employee => employee.status === "Active"
  ).length;

  const departments = new Set(
    employees.map(employee => employee.department)
  );

  const totalSalary = employees.reduce(
    (sum, employee) => sum + employee.salary, 0
  );

  const averageSalary = total ? totalSalary / total : 0;

  document.getElementById("total-employees").textContent = total;
  document.getElementById("active-employees").textContent = active;
  document.getElementById("department-count").textContent = departments.size;
  document.getElementById("average-salary").textContent =
    formatCurrency(averageSalary);
}

// 7. DEPARTMENT FILTER
function updateDepartmentOptions() {
  const previousSelection = departmentFilter.value;

  const departments = [
    ...new Set(employees.map(employee => employee.department))
  ].sort((a, b) => a.localeCompare(b));

  departmentFilter.innerHTML =
    '<option value="">All Departments</option>' +
    departments.map(department =>
      `<option value="${escapeHTML(department)}">${escapeHTML(department)}</option>`
    ).join("");

  if (departments.includes(previousSelection)) {
    departmentFilter.value = previousSelection;
  }
}

// 8. SEARCH, FILTER AND SORT
function getFilteredEmployees() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedDepartment = departmentFilter.value;
  const selectedStatus = statusFilter.value;

  const filtered = employees.filter(employee => {
    const matchesSearch = [
      employee.name,
      employee.email,
      employee.jobTitle,
      employee.department
    ].some(value =>
      String(value || "").toLowerCase().includes(searchTerm)
    );

    const matchesDepartment =
      !selectedDepartment || employee.department === selectedDepartment;

    const matchesStatus =
      !selectedStatus || employee.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const [field, direction] = sortOption.split("-");
  const multiplier = direction === "asc" ? 1 : -1;

  filtered.sort((a, b) => {
    let comparison;

    if (field === "salary") {
      comparison = a.salary - b.salary;
    } else {
      comparison = String(a[field] ?? "").localeCompare(
        String(b[field] ?? ""),
        undefined,
        { sensitivity: "base" }
      );
    }

    return comparison === 0
      ? a.id - b.id
      : comparison * multiplier;
  });

  return filtered;
}

// 9. EMPLOYEE TABLE AND PAGINATION
function renderEmployees() {
  const filteredEmployees = getFilteredEmployees();
  const total = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  currentPage = Math.max(1, Math.min(currentPage, totalPages));

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, total);

  const pageEmployees = filteredEmployees.slice(startIndex, endIndex);

  tableBody.innerHTML = pageEmployees.map(employee => `
    <tr>
      <td>
        <div class="employee-cell">
          <div class="employee-avatar ${employee.photo ? "photo-avatar" : ""}">
            ${
              employee.photo
                ? `<img src="${escapeHTML(employee.photo)}" alt="">`
                : escapeHTML(getInitials(employee.name))
            }
          </div>
          <div>
            <div class="employee-name">${escapeHTML(employee.name)}</div>
            <div class="employee-email">${escapeHTML(employee.email)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHTML(employee.department)}</td>
      <td>${escapeHTML(employee.jobTitle)}</td>
      <td>${formatCurrency(employee.salary)}</td>
      <td><span class="status ${escapeHTML(employee.status)}">${escapeHTML(employee.status)}</span></td>
      <td>
        <div class="action-buttons">
          <button type="button" class="action-btn" data-action="view" data-id="${employee.id}">View</button>
          <button type="button" class="action-btn" data-action="edit" data-id="${employee.id}">Edit</button>
          <button type="button" class="action-btn delete" data-action="delete" data-id="${employee.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  document.getElementById("empty-state").hidden = total !== 0;
  document.getElementById("record-count").textContent =
    `${total} employee${total === 1 ? "" : "s"}`;

  const firstRecord = total === 0 ? 0 : startIndex + 1;
  document.getElementById("table-summary").textContent =
    `Showing ${firstRecord}-${endIndex} of ${total} filtered employees`;

  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  previousPageButton.disabled = currentPage === 1;
  nextPageButton.disabled = currentPage === totalPages;
}

function renderApp() {
  updateStatistics();
  updateDepartmentOptions();
  renderEmployees();
  renderDashboardCharts();
}

function renderDashboardCharts() {
  const departmentChart = document.getElementById("department-chart");
  const statusChart = document.getElementById("status-chart");

  if (!departmentChart || !statusChart) return;

  const departmentCounts = {};

  employees.forEach(employee => {
    departmentCounts[employee.department] =
      (departmentCounts[employee.department] || 0) + 1;
  });

  const maxDepartmentCount = Math.max(
    1,
    ...Object.values(departmentCounts)
  );

  departmentChart.innerHTML = Object.entries(departmentCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([department, count]) => `
      <div class="chart-row">
        <span class="chart-label">${escapeHTML(department)}</span>
        <div class="chart-track">
          <div class="chart-bar"
               style="width:${(count / maxDepartmentCount) * 100}%">
          </div>
        </div>
        <span class="chart-count">${count}</span>
      </div>
    `).join("");

  const activeCount = employees.filter(
    employee => employee.status === "Active"
  ).length;

  const inactiveCount = employees.filter(
    employee => employee.status === "Inactive"
  ).length;

  const total = employees.length || 1;

  statusChart.innerHTML = `
    <div class="chart-row">
      <span class="chart-label">Active</span>
      <div class="chart-track">
        <div class="chart-bar status-active"
             style="width:${(activeCount / total) * 100}%">
        </div>
      </div>
      <span class="chart-count">${activeCount}</span>
    </div>

    <div class="chart-row">
      <span class="chart-label">Inactive</span>
      <div class="chart-track">
        <div class="chart-bar status-inactive"
             style="width:${(inactiveCount / total) * 100}%">
        </div>
      </div>
      <span class="chart-count">${inactiveCount}</span>
    </div>
  `;
}
// 10. ADD EMPLOYEE DIALOG
function openAddDialog() {
  employeeForm.reset();

  document.getElementById("employee-id").value = "";
  document.getElementById("dialog-title").textContent = "Add Employee";
  document.getElementById("save-btn").textContent = "Save Employee";

  formError.textContent = "";
  updatePhotoPreview("");

  dialog.showModal();
}

// 11. EDIT EMPLOYEE DIALOG
function openEditDialog(id) {
  const employee = employees.find(item => item.id === id);
  if (!employee) return;

  employeeForm.reset();

  document.getElementById("employee-id").value = employee.id;
  document.getElementById("full-name").value = employee.name;
  document.getElementById("email").value = employee.email;
  document.getElementById("department").value = employee.department;
  document.getElementById("job-title").value = employee.jobTitle;
  document.getElementById("salary").value = employee.salary;
  document.getElementById("status").value = employee.status;

  document.getElementById("dialog-title").textContent = "Edit Employee";
  document.getElementById("save-btn").textContent = "Update Employee";

  formError.textContent = "";
  updatePhotoPreview(employee.photo || "");

  dialog.showModal();
}

// 12. SAVE NEW OR UPDATED EMPLOYEE
employeeForm.addEventListener("submit", async event => {
  event.preventDefault();
  formError.textContent = "";

  const idValue = document.getElementById("employee-id").value;
  const name = document.getElementById("full-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const department = document.getElementById("department").value;
  const jobTitle = document.getElementById("job-title").value.trim();
  const salaryText = document.getElementById("salary").value;
  const salary = Number(salaryText);
  const status = document.getElementById("status").value;

  if (!name || !email || !department || !jobTitle || !salaryText) {
    formError.textContent = "Please complete all required fields.";
    return;
  }

  if (
    name.length < 2 ||
    name.length > 80 ||
    jobTitle.length > 80 ||
    email.length > 120
  ) {
    formError.textContent = "Please check the length of your input.";
    return;
  }

  if (
    !allowedDepartments.includes(department) ||
    !["Active", "Inactive"].includes(status)
  ) {
    formError.textContent = "Please select a valid department and status.";
    return;
  }

  if (
    !Number.isFinite(salary) ||
    salary < 0 ||
    salary > 100000000 ||
    !Number.isInteger(salary)
  ) {
    formError.textContent =
      "Enter a valid non-negative whole-number salary.";
    return;
  }

  const normalizedEmail = email.toLowerCase();

  const duplicateEmail = employees.some(employee =>
    employee.email.trim().toLowerCase() === normalizedEmail &&
    employee.id !== Number(idValue)
  );

  if (duplicateEmail) {
    formError.textContent =
      "An employee with this email already exists.";
    return;
  }

  try {
    const employeeData = {
      name,
      email,
      department,
      jobTitle,
      salary,
      status
    };

    await saveEmployeeToAPI(employeeData, idValue);
    employees = await loadEmployees();

    currentPage = 1;
    renderApp();
    dialog.close();
  } catch (error) {
    console.error("Unable to save employee:", error);
    formError.textContent =
      "Could not save employee. Check that the backend is running and the email is unique.";
  }
});

// 13. DELETE EMPLOYEE
async function deleteEmployee(id) {
  const employee = employees.find(item => item.id === id);
  if (!employee) return;

  const confirmed = confirm(
    `Are you sure you want to delete ${employee.name}?`
  );

  if (!confirmed) return;

  try {
    await deleteEmployeeFromAPI(id);
    employees = await loadEmployees();
    renderApp();
  } catch (error) {
    console.error("Unable to delete employee:", error);
    alert("Could not delete employee. Please check that the backend is running.");
  }
}
// 14. SEARCH, FILTER, SORT AND PAGINATION EVENTS
searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderEmployees();
});

departmentFilter.addEventListener("change", () => {
  currentPage = 1;
  renderEmployees();
});

statusFilter.addEventListener("change", () => {
  currentPage = 1;
  renderEmployees();
});

// Sorting dropdown connection
if (sortSelect) {
  sortSelect.value = sortOption;

  sortSelect.addEventListener("change", () => {
    sortOption = sortSelect.value || "name-asc";
    currentPage = 1;
    renderEmployees();
  });
}

previousPageButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderEmployees();
  }
});

nextPageButton.addEventListener("click", () => {
  const totalPages = Math.max(
    1,
    Math.ceil(getFilteredEmployees().length / PAGE_SIZE)
  );

  if (currentPage < totalPages) {
    currentPage++;
    renderEmployees();
  }
});

document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
  searchInput.value = "";
  departmentFilter.value = "";
  statusFilter.value = "";
  sortOption = "name-asc";

  if (sortSelect) {
    sortSelect.value = "name-asc";
  }

  currentPage = 1;
  renderApp();
});

// 15. EMPLOYEE ACTION BUTTONS
tableBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "edit") {
    openEditDialog(id);
  } else if (action === "delete") {
    deleteEmployee(id);
  } else if (action === "view") {
    const employee = employees.find(item => item.id === id);
    if (!employee) return;

    alert(
      `Employee Details\n\n` +
      `Name: ${employee.name}\n` +
      `Email: ${employee.email}\n` +
      `Department: ${employee.department}\n` +
      `Job Title: ${employee.jobTitle}\n` +
      `Salary: ${formatCurrency(employee.salary)}\n` +
      `Status: ${employee.status}`
    );
  }
});

// 16. DIALOG BUTTONS
document.getElementById("add-employee-btn").addEventListener("click", openAddDialog);

document.getElementById("close-dialog").addEventListener("click", () => {
  dialog.close();
});

document.getElementById("cancel-btn").addEventListener("click", () => {
  dialog.close();
});

// 17. EXPORT CSV
function exportEmployeesToCSV() {
  const rows = getFilteredEmployees();
  const headers = [
    "Name",
    "Email",
    "Department",
    "Job Title",
    "Salary",
    "Status"
  ];

  const csvEscape = value => {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map(employee => [
      employee.name,
      employee.email,
      employee.department,
      employee.jobTitle,
      employee.salary,
      employee.status
    ].map(csvEscape).join(","))
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "peopledesk-employees.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

exportCsvButton.addEventListener("click", exportEmployeesToCSV);

// 18. START APPLICATION
async function startApplication() {
  try {
    employees = await loadEmployees();
    renderApp();
  } catch (error) {
    console.error("Unable to start PeopleDesk:", error);
    alert(
      "Could not load employees. Please make sure Spring Boot is running on port 8080 and MySQL is connected."
    );
  }
}

startApplication();
// Sidebar navigation
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    // Update the active sidebar link
    document.querySelectorAll(".nav-link").forEach(item => {
      item.classList.remove("active");
    });

    link.classList.add("active");

    const page = link.dataset.page;

    if (page === "employees") {
      document.getElementById("page-title").textContent = "Employees";
      document.getElementById("breadcrumb").textContent = "EMPLOYEES";

      // Bring the employee directory into view
      document.getElementById("employee-panel").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } else {
      document.getElementById("page-title").textContent = "Dashboard";
      document.getElementById("breadcrumb").textContent = "OVERVIEW";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  });
});
// ============================================
// IMPORT EMPLOYEES FROM CSV
// ============================================

const importCsvButton = document.getElementById("import-csv-btn");
const importCsvInput = document.getElementById("import-csv-input");

if (importCsvButton && importCsvInput) {
  importCsvButton.addEventListener("click", () => {
    importCsvInput.click();
  });

  importCsvInput.addEventListener("change", async () => {
    const file = importCsvInput.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());

      if (lines.length < 2) {
        alert("The CSV file has no employee records.");
        return;
      }

      function parseCsvLine(line) {
        const values = [];
        let value = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"' && inQuotes && line[i + 1] === '"') {
            value += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(value.trim());
            value = "";
          } else {
            value += char;
          }
        }

        values.push(value.trim());
        return values;
      }

      const headers = parseCsvLine(lines[0]).map(header =>
        header.toLowerCase().replace(/[^a-z]/g, "")
      );

      const column = name => headers.indexOf(name);

      const nameIndex = column("name");
      const emailIndex = column("email");
      const departmentIndex = column("department");
      const jobTitleIndex = column("jobtitle");
      const salaryIndex = column("salary");
      const statusIndex = column("status");

      if ([nameIndex, emailIndex, departmentIndex, jobTitleIndex, salaryIndex, statusIndex].some(index => index < 0)) {
        alert("CSV headers must include Name, Email, Department, Job Title, Salary, and Status.");
        return;
      }

      const existingEmails = new Set(
        employees.map(employee => employee.email.toLowerCase())
      );

      let imported = 0;
      let skipped = 0;

      for (const line of lines.slice(1)) {
        const values = parseCsvLine(line);

        const employee = {
          name: values[nameIndex] || "",
          email: values[emailIndex] || "",
          department: values[departmentIndex] || "",
          jobTitle: values[jobTitleIndex] || "",
          salary: Number(values[salaryIndex]),
          status: values[statusIndex] || ""
        };

        const emailKey = employee.email.toLowerCase();

        if (
          !employee.name ||
          !employee.email ||
          !employee.jobTitle ||
          !allowedDepartments.includes(employee.department) ||
          !["Active", "Inactive"].includes(employee.status) ||
          !Number.isFinite(employee.salary) ||
          employee.salary < 0 ||
          !Number.isInteger(employee.salary) ||
          existingEmails.has(emailKey)
        ) {
          skipped++;
          continue;
        }

        try {
          await saveEmployeeToAPI(employee, null);
          existingEmails.add(emailKey);
          imported++;
        } catch (error) {
          console.error("Could not import employee:", employee.email, error);
          skipped++;
        }
      }

      employees = await loadEmployees();
      currentPage = 1;
      renderApp();

      alert(
        `CSV import finished!\n\nImported: ${imported}\nSkipped: ${skipped}`
      );
    } catch (error) {
      console.error("CSV import failed:", error);
      alert("Unable to read the CSV file. Please check its format.");
    } finally {
      importCsvInput.value = "";
    }
  });
}
