1. Overview

The Habit Tracker App helps users build and maintain daily habits through a simple, visual, and motivating interface. Users can register, log in, create habits, track daily completion, and monitor streaks over time. The frontend will be deployed on Vercel and the backend on Render.

This PRD defines the core features, user flows, functional requirements, and future enhancements.

2. Goals & Objectives

Enable users to consistently track daily habits

Provide clear visual feedback on progress and streaks

Keep the UI minimal, fast, and distraction-free

Support scalable authentication and data storage

3. Tech Stack

Frontend

Next.js (React)

Tailwind CSS (or equivalent styling framework)

Deployed on Vercel

Backend

Node.js with Express

REST APIs

JWT-based authentication (HTTP-only cookies)

MongoDB (cloud-hosted)

Deployed on Render

4. User Roles

4.1 Guest

Can view login and registration pages

4.2 Authenticated User

Can manage personal habits

Can track daily habit completion

Can view streaks and progress

5. User Authentication

5.1 Registration

User can register with:

Name

Email

Password

Validation for existing email

Password hashing on backend

5.2 Login

Existing users can log in using email and password

Successful login creates an authenticated session

5.3 Logout

Logout button available at the top of the app

Clears authentication session

6. Main App Layout

Header Section

Display current Day, Date, and Month

Display: Welcome, {User Name}

Logout button

Habit Controls

Input field to add a new habit

“Add Habit” button

7. Habit Management

7.1 Add Habit

User can add a habit with a name

Habit is added to the list immediately

7.2 Remove Habit

Each habit has a delete (❌) button

Deleting a habit removes all its associated data

7.3 Reorder Habits

Each habit has:

Move Up button

Move Down button

Order is persisted in the database

8. Daily Tracking

8.1 Daily Completion

Each habit has a checkbox/tick for the current day

Ticking marks the habit as completed for today

Unticking removes completion

8.2 Calendar View

Monthly grid showing days of the current month

Each habit has a row with day-wise completion cells

9. Streak System

Each habit tracks its own streak

Streak increases when completed on consecutive days

Streak resets if a day is missed

Display streak count next to habit name

10. Progress Tracking

Overall completion percentage for the current month

Display total checks completed vs total possible checks

11. Data Model (High Level)

User

id

name

email

passwordHash

createdAt

Habit

id

userId

name

order

streak

createdAt

HabitCompletion

habitId

date

completed (boolean)

12. Non-Functional Requirements

Fast page loads (< 2s)

Mobile-responsive design

Secure authentication

Scalable backend APIs

13. Future Feature Ideas

Productivity & Motivation

🔔 Daily reminders via email or notifications

🏆 Achievements & badges for streak milestones

📊 Weekly and yearly analytics

Customization

🎨 Theme switching (dark/light/custom colors)

🗂️ Habit categories (Health, Study, Fitness, etc.)

⏰ Time-based habits (morning/night)

Advanced Tracking

🔥 Streak freeze (miss one day without reset)

📅 Weekly habit mode (e.g., 3 times per week)

📝 Notes or comments per habit per day

Social & Gamification

👥 Public or private leaderboards

🤝 Habit sharing with friends

📤 Export data (CSV / PDF)

14. Success Metrics

Daily active users (DAU)

Habit completion rate

Average streak length

User retention (7-day, 30-day)

15. Out of Scope (For Now)

Native mobile apps

Offline-first support

Paid subscriptions
