# Room Booking System - AGH Faculty of Management

A modern, full-stack web application designed to streamline the process of booking and managing lecture rooms at the AGH University Faculty of Management. This project replaces a manual, error-prone system with a transparent, digital-first solution.

---

## Table of Contents

- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Running](#installation--running)
- [Project Structure](#project-structure)
- [Usage](#usage)

---

## About The Project

The current process for rescheduling classes or booking rooms for make-up sessions at the AGH Faculty of Management is time-consuming, non-transparent, and prone to errors. It relies on a series of manual arrangements, emails, and direct contact with a faculty coordinator, with limited visibility into room availability.

This **Room Booking System** is an intuitive web application that solves this problem by:

- Providing **instant access** to up-to-date room schedules and specifications.
- Enabling a **collaborative search** for suitable time slots based on the availability of both the lecturer and the student group.
- Streamlining the booking process through **digital coordination** and a mutual confirmation mechanism (lecturer + student representative).
- **Reducing manual workload** and minimizing the risk of scheduling conflicts.

The ultimate goal is to deliver a flexible and user-friendly tool that genuinely simplifies the daily organization of teaching activities at the Faculty.

---

## Built With

This project is built with a modern, robust, and scalable technology stack.

**Frontend:**

- ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
- ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
- ![Material-UI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white)
- ![TanStack Query](https://img.shields.io/badge/-React%20Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)
- ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) (Implicitly, via `react-scripts`)

**Backend:**

- ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
- ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
- ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-CC3434?style=for-the-badge&logo=sqlalchemy&logoColor=white)
- ![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
- ![Poetry](https://img.shields.io/badge/Poetry-60A5FA?style=for-the-badge&logo=poetry&logoColor=white)

**Infrastructure:**

- ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
- ![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)

---

## Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

You need to have **Docker** and **Docker Compose** installed on your machine.

- [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Installation & Running

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/mplazax/booking-system-agh.git
    cd booking-system-agh
    ```

2.  **Build and run the application with Docker Compose:**
    This single command will build the frontend and backend images, start all containers (frontend, backend, database), and set up the necessary network.

    ```bash
    docker-compose up --build
    ```

    The application will be available at `http://localhost`.

3.  **(Optional) Populate the database with sample data:**
    To test the application with pre-filled data (users, rooms, courses, etc.), open a new terminal window and run the following commands:

    - First, create the database schema:
      ```bash
      docker-compose exec backend python create_tables.py --force
      ```
    - Then, populate the tables with example data:
      ```bash
      docker-compose exec backend python populate.py --force
      ```

---

## Project Structure

The project is organized as a monorepo with two main packages: `frontend` and `backend`.

```
.
├── backend/ # FastAPI application
│ ├── routers/ # API endpoint definitions
│ ├── model.py # SQLAlchemy database models
│ ├── schemas.py # Pydantic data schemas
│ ├── Dockerfile # Instructions to build the backend image
│ └── ...
├── frontend/ # React application
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── features/ # Components related to specific features
│ │ ├── pages/ # Top-level page components
│ │ ├── hooks/ # Custom React hooks
│ │ └── ...
│ ├── nginx/ # Nginx configuration
│ └── Dockerfile # Instructions to build the frontend image
├── docker-compose.yml # Defines and orchestrates all services
└── README.md # You are here
```

---

## Usage

If you have populated the database using the script, you can log in with the following sample accounts to test different roles and functionalities:

| Role            | Email                    | Password   |
| --------------- | ------------------------ | ---------- |
| **Admin**       | `admin@example.com`      | `admin123` |
| **Coordinator** | `koord@example.com`      | `koord123` |
| **Lecturer**    | `j.kowalski@example.com` | `teach123` |
| **Student Rep** | `a.nowak@example.com`    | `stud123`  |

**To test the core feature (requesting a change):**

1.  Log in as a **Student Rep** (`a.nowak@example.com`).
2.  Go to the **Calendar**, select an event, and create a change request.
3.  Go to the **Recommendations** page, select the newly created request, and propose a few available time slots.
4.  Log out and log in as the corresponding **Lecturer** (`j.kowalski@example.com`).
5.  Go to the **Recommendations** page, select the same request, and propose your availability, making sure at least one slot overlaps with the Student Rep's proposal.
6.  The "Recommended Terms" section should now display the common slot, ready for approval.
