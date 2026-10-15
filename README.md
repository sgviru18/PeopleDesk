# PeopleDesk — Employee Management System

PeopleDesk is a full-stack Employee Management System designed to manage employee information through a simple and user-friendly dashboard.

The application allows users to view employee records, search and filter employees, add new employees, update employee details, and delete records.

## Features

- **Dashboard:** View employee statistics and charts.
- **Employee Directory:** View and manage employee records.
- **Search and Filtering:** Find employees by name and filter records.
- **Add Employee:** Add new employees with their details.
- **Edit Employee:** Update existing employee information.
- **Delete Employee:** Remove employee records.
- **Employee Profile:** View individual employee information.
- **CSV Import:** Import employee data from a CSV file.
- **CSV Export:** Export employee records to a CSV file.
- **REST API:** Connect the frontend to the Spring Boot backend.
- **MySQL Database:** Store employee information persistently.

## Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Java
- Spring Boot
- Spring Data JPA
- Maven
- REST API

### Database
- MySQL

### Tools
- Visual Studio Code
- IntelliJ IDEA or Spring Tool Suite
- MySQL Workbench
- Git and GitHub

## Project Structure

```text
PeopleDesk/
├── index.html
├── employees.html
├── employee-profile.html
├── script.js
├── employee-profile.js
├── style.css
└── peopledesk/
    ├── pom.xml
    ├── mvnw
    ├── mvnw.cmd
    └── src/
        ├── main/
        │   ├── java/
        │   │   └── com/peopledesk/peopledesk/
        │   │       ├── PeopledeskApplication.java
        │   │       └── employee/
        │   │           ├── Employee.java
        │   │           ├── EmployeeController.java
        │   │           └── EmployeeRepository.java
        │   └── resources/
        │       └── application.properties
        └── test/
```

## Prerequisites

Install the following before running the project:

- Java JDK compatible with the version configured in `pom.xml`
- MySQL Server
- Visual Studio Code or another Java IDE
- A modern web browser
- Live Server extension for VS Code (recommended)

## Database Setup

1. Start your MySQL server.
2. Create the database:

```sql
CREATE DATABASE peopledesk_db;
```

3. Create the `employees` table using the schema configured for the application.
4. Configure your MySQL connection using environment variables.

Example configuration:

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/peopledesk_db}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

Set `DB_USERNAME` and `DB_PASSWORD` to your own MySQL credentials before starting the backend. Never commit real passwords or other secrets to GitHub.

## How to Run the Project

### 1. Start the Backend

Open a terminal in the backend directory:

```powershell
cd peopledesk
```

Set the database environment variables in your terminal. For example, in Windows PowerShell:

```powershell
$env:DB_USERNAME = "your_mysql_username"
$env:DB_PASSWORD = "your_mysql_password"
```

Start the Spring Boot application:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs at:

`http://localhost:8080`

### 2. Start the Frontend

1. Open the main project folder in Visual Studio Code.
2. Open `index.html`.
3. Right-click the file and select **Open with Live Server**.

The frontend should open in your browser, typically at:

`http://127.0.0.1:5500/index.html`

Keep the backend running while using features that access employee data.

## REST API Endpoints

Base URL: `http://localhost:8080/api/employees`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees` | Retrieve all employees |
| GET | `/api/employees/{id}` | Retrieve an employee by ID |
| POST | `/api/employees` | Create an employee |
| PUT | `/api/employees/{id}` | Update an employee |
| DELETE | `/api/employees/{id}` | Delete an employee |

## GitHub Repository

Source code: [PeopleDesk on GitHub](https://github.com/sgviru18/PeopleDesk)

## Future Improvements

- User authentication and role-based access
- Employee photo uploads
- Improved form validation and error handling
- Pagination and reporting improvements
- Cloud deployment for the frontend, backend, and database
- Automated testing and continuous integration

## Author

Developed as a full-stack Employee Management System project to practice frontend development, Java, Spring Boot, REST APIs, and MySQL integration.
