import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

// Lazy Loaded Pages
const Dashboard = lazy(() => import("./Dashboard/Dashboard"));
const Maincontent = lazy(() => import("./Dashboard/Maincontent"));
const AccountSettings = lazy(() => import("./Dashboard/Pages/AccountSettings"));
const Complaints = lazy(() => import("./Dashboard/Pages/Complaints"));
const MyProfile = lazy(() => import("./Dashboard/Pages/MyProfile"));
const Tasks = lazy(() => import("./Dashboard/Pages/Tasks"));
const RecurringSuggestions = lazy(() => import("./Dashboard/Pages/RecurringSuggestions"));
const RecurringTasks = lazy(() => import("./Dashboard/Pages/RecurringTasks"));

const Login = lazy(() => import("./Login"));
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "24px",
            color: "#244034",
          }}
        >
          Loading Dashboard...
        </div>
      }
    >
      <Routes>

        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />}>
            <Route index element={<Maincontent />} />
            <Route path="Pages/AccountSettings" element={<AccountSettings />} />
            <Route path="Pages/Complaints" element={<Complaints />} />
            <Route path="Pages/MyProfile" element={<MyProfile />} />
            <Route path="Pages/Tasks" element={<Tasks />} />
            <Route
              path="Pages/RecurringSuggestions"
              element={<RecurringSuggestions />}
            />
            <Route path="Pages/RecurringTasks" element={<RecurringTasks />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div
              style={{
                width: "100%",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "24px",
                color: "#244034",
              }}
            >
              404 — Page Not Found
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
