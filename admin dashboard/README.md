# EcoTrack – Smart Complaint & Maintenance Management Dashboard

EcoTrack is an intelligent maintenance and public grievance management system designed to help administrators monitor complaints, assign work to staff, and automate recurring maintenance workflows. It combines geospatial intelligence, automated task grouping, recurring maintenance prediction, and an intuitive UI to deliver a modern, efficient operations dashboard.

---

## 🧭 Purpose

Modern environments such as university campuses, residential townships, and municipal areas generate a high volume of recurring maintenance complaints. Traditional systems rely heavily on manual tracking and assignments, leading to delays, inefficiencies, and recurring unresolved issues.

EcoTrack solves this by:

- Centralizing complaints management
- Automatically grouping related issues
- Automating recurring maintenance planning
- Providing clear visual and actionable insights
- Reducing the administrative burden significantly

---

## ✨ Features

### 1️⃣ Complaint Management
EcoTrack provides full control over all recorded complaints:
- View all complaints with detailed metadata
- Track complaints in three lifecycle stages:
  - **Pending**
  - **Ongoing**
  - **Completed**
- Sort complaints by:
  - Newest first
  - Oldest first
  - Issue type
  - Status
- Bulk delete completed complaints
- Smooth interaction-based UI controls
- Status modification with one-click transitions

---

### 2️⃣ Intelligent Task Suggestion System
EcoTrack automatically analyzes complaint datasets and generates meaningful grouped work tasks.

- Clusters complaints based on:
  - Geographical location
  - Issue similarity
- Assigns **priority score** considering:
  - Complaint density
  - Complaint urgency
- Admin can assign grouped complaints as a single work task
- Automatically updates complaint status upon task assignment
- Supports task cancellation and reassignment
- Preserves integrity of complaint states when actions are reverted

---

### 3️⃣ Worker Assignment & Task Handling
- View all field workers
- Assign tasks to a chosen worker
- Automatically link worker to all grouped complaints
- Modify task worker details anytime
- Track assigned task completion lifecycle
- Reflect resolved complaints back in complaint records

---

### 4️⃣ Recurring Maintenance Intelligence
EcoTrack intelligently detects patterns of repeated issues and assists in proactive management.

#### 🔍 Recurring Pattern Detection
- Tracks complaint recurrence in same locations
- Identifies frequently repeating tasks
- Computes frequency intervals automatically
- Stores potential recurring candidates

#### 💡 Recurring Suggestions Page
- Displays system-identified recurring maintenance opportunities
- Clearly shows:
  - Issue type
  - Location
  - Suggested recurrence frequency
- Admin can approve or discard suggestions

#### ⚙️ Recurring Tasks Manager
- Displays confirmed recurring maintenance routines
- Allows enabling / disabling recurring automation
- Tracks next scheduled execution timestamp
- Supports modifying task details

---

### 5️⃣ Automated Recurring Engine
A client-side scheduled automation engine continuously monitors confirmed recurring tasks.

- Periodically checks and executes due routines
- Automatically:
  - Finds nearby pending complaints
  - Converts them into new tasks
  - Assigns to stored default worker (if exists)
  - Moves complaints to ongoing
- Updates:
  - Last executed timestamp
  - Next execution timestamp

This ensures maintenance activity happens even if no admin manually intervenes.

---

### 6️⃣ Real-Time Visual Monitoring (Map Support)
EcoTrack integrates Google Maps to provide a powerful visual representation.

Map includes:
- Complaint markers
  - Red → Pending
  - Yellow → Ongoing
  - Green → Completed
- Recurring Maintenance Location
  - Blue markers
- Interactive zoom + navigation controls
- Helps administrators understand geographic spread instantly

---

### 7️⃣ Dashboard Insights
The dashboard provides high-level insights summarizing system state:
- Total complaints
- Resolved complaints
- Number of ongoing tasks
- Quick overview of assigned tasks
- Quick access to all major system actions

---

## 🔐 Security & Access Control
EcoTrack enforces strong Firebase-backed enforcement rules:
- Admin-only access interface
- Verified authentication required
- Sensitive Firestore collections are protected
- Prevents unauthorized read/write/delete of:
  - `tasks`
  - `complaints`
  - `workers`
  - `recurringTasks`
  - `recurringSuggestions`

Security is structured to align with real deployment and production readiness.

---

## 🛠️ Technology Stack

### Frontend
- React
- Tailwind CSS
- React Router
- Google Maps API

### Backend / Infrastructure
- Firebase Authentication
- Firebase Firestore

---

## 🧩 System Workflow Summary

1️⃣ Users submit complaints through the application  
2️⃣ Admin dashboard lists every complaint with real-time control  
3️⃣ EcoTrack intelligently groups similar complaints into actionable tasks  
4️⃣ Admin assigns tasks to field workers  
5️⃣ Workers address issues  
6️⃣ Completed tasks resolve bundled complaints  
7️⃣ System detects repeating trends  
8️⃣ Admin converts repeating issues to automated recurring tasks  
9️⃣ Recurring engine ensures maintenance continues without manual admin effort  

---

## 🎯 Outcome & Vision

EcoTrack aims to modernize maintenance operations and public grievance management by:
- Reducing administrative complexity
- Increasing maintenance response efficiency
- Providing proactive, recurring maintenance handling
- Offering transparency and real-time situational awareness

Ultimately, the system contributes toward cleaner, well-maintained environments through automation, intelligence, and thoughtful system design.

---

## 📌 Status
EcoTrack is still in **beta**, it has a minimum viable product, and future updates planned are being implemented as soon as possible.