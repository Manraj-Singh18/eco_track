# 🌿 EcoTrack Admin Dashboard

EcoTrack Admin Dashboard is the central control system for managing public cleanliness complaints, assigning cleanup tasks, monitoring progress, and coordinating workers.  
It powers real-time decision-making with Google Maps visualization and intelligent task clustering.

---

## 🚀 Tech Stack
- **React + Vite**
- **Firebase**
  - Firestore
  - Authentication
  - Hosting (optional)
- **Google Maps Platform**
- TailwindCSS UI

---

## ✨ Features

### 👨‍💼 Admin Authentication
- Secure Firebase Email/Password login
- Only the admin can access the dashboard
- Protected routes
- Secure Firestore rules

---

### 🗺️ Dashboard Overview
- Google Maps displaying all complaint locations
- Assigned tasks panel
- Key stats & activity overview
- Real-time updates

---

### 📝 Complaints Management
- Fetch complaints from Firestore
- Sorting by:
  - newest / oldest
  - status
  - issue type
- Change complaint status:
  - Pending → Ongoing → Completed
- Delete completed complaints
- Bulk delete completed complaints + confirmation modal

---

### 🧠 Smart Task Engine
Automatically suggests cleanup tasks based on:
- Number of similar complaints
- Issue category
- Location clustering (200m radius)
- Time urgency weighting

Admin can:
- Assign tasks to registered workers
- View task details
- Reassign tasks
- Cancel tasks
- Mark tasks complete (auto updates complaints + removes task)

---

### 🧑‍🔧 Worker Integration
Supports:
- Worker profiles
- Assigning tasks by worker ID
- Displaying worker details in tasks and dashboard

---

### 🔍 Global Search
Unified global search across:
- Complaints
- Tasks
- Workers
With instant categorized dropdown results.
