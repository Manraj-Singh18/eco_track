import { useState } from "react";
import { loginAdmin } from "./auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e){
    e.preventDefault();
    setError("");
    setLoading(true);

    try{
      await loginAdmin(username,password);
      navigate("/");
    }catch(err){
      setError("Invalid Username or Password");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f5f3] relative overflow-hidden">

      {/* Soft blurred EcoTrack Aura */}
      <div className="absolute w-[420px] h-[420px] bg-[var(--secondary-color)] rounded-full blur-[140px] top-[-70px] left-[-80px] opacity-70"></div>
      <div className="absolute w-[420px] h-[420px] bg-[var(--primary-color)] rounded-full blur-[160px] bottom-[-120px] right-[-80px] opacity-40"></div>

      <div className="relative z-10 w-[430px] bg-white/90 shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-[30px] px-10 py-10 border border-[rgba(0,0,0,0.06)] backdrop-blur-lg">

        {/* Brand */}
        <h2 className="text-5xl font-[700] text-[var(--text-color)] text-center bricolage-font">
          Eco<span className="text-[var(--secondary-color)]">Track</span>
        </h2>

        <p className="mt-2 text-center text-[var(--text-light)] text-sm">
          Admin Dashboard Login
        </p>

        {/* Error */}
        {error && (
          <div className="mt-4 w-full px-4 py-3 bg-red-100 text-red-600 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-6">

          <div>
            <label className="text-[var(--text-color)] font-[500] text-sm">
              Username
            </label>
            <input
              placeholder="Admin"
              value={username}
              onChange={e=>setUsername(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-[rgba(0,0,0,0.05)] border border-transparent focus:border-[var(--primary-color)] outline-none text-[var(--text-color)]"
            />
          </div>

          <div>
            <label className="text-[var(--text-color)] font-[500] text-sm">
              Password
            </label>
            <input
              type="password"
              placeholder="Admin@123"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-[rgba(0,0,0,0.05)] border border-transparent focus:border-[var(--primary-color)] outline-none text-[var(--text-color)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:text-[var(--text-color)] transition-all duration-300 text-white py-3 rounded-xl text-lg font-[500]"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-6 text-[var(--text-light)] text-xs">
          Authorized Admin Access Only
        </p>

      </div>
    </div>
  );
}
