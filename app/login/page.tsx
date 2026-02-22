// Create this file at app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../my-app/convex/_generated/api";
import { hashPassword } from "../../lib/hash";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");

  // Convex Hooks
  const teamExists = useQuery(api.users.checkTeam, { teamName }) || false;
  const signUp = useMutation(api.users.signUp);
  const login = useMutation(api.users.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const hashedPassword = await hashPassword(password);

      if (isLogin) {
        // LOGIN FLOW
        const userData = await login({ username, password: hashedPassword });
        localStorage.setItem("username", userData.username);
        localStorage.setItem("teamName", userData.teamName);
        router.push("/"); // Redirect to home
      } else {
        // SIGNUP FLOW
        if (!teamName) {
          setError("Team name is required for sign up!");
          return;
        }
        await signUp({ username, password: hashedPassword, teamName });
        localStorage.setItem("username", username);
        localStorage.setItem("teamName", teamName);
        router.push("/"); // Redirect to home
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-orange-400 flex flex-col items-center justify-center p-4 font-sans selection:bg-white">
      <div className="w-full max-w-md bg-white border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        <h1 className="text-4xl font-black tracking-tighter text-blue-600 uppercase mb-6 text-center">
          {isLogin ? "Welcome Back" : "Join The Hunt"}
        </h1>

        {error && (
          <div className="bg-red-400 border-2 border-black p-3 mb-4 rounded-xl text-white font-bold text-sm">
            🚨 {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-bold text-slate-700 uppercase text-xs mb-1 block">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-4 border-black p-3 rounded-xl font-bold outline-none focus:bg-yellow-100 transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase text-xs mb-1 block">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-4 border-black p-3 rounded-xl font-bold outline-none focus:bg-yellow-100 transition-colors"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="font-bold text-slate-700 uppercase text-xs mb-1 block">Team Name</label>
              <input 
                type="text" 
                required={!isLogin}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full border-4 border-black p-3 rounded-xl font-bold outline-none focus:bg-yellow-100 transition-colors"
              />
            </div>
          )}

          <button 
            type="submit"
            className="mt-4 bg-pink-500 text-white border-4 border-black p-4 rounded-2xl font-black uppercase tracking-widest text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            {isLogin 
              ? "Login" 
              : (teamName ? (teamExists ? `Join ${teamName}` : `Create ${teamName}`) : "Sign Up")}
          </button>
        </form>

        <button 
          onClick={() => { setIsLogin(!isLogin); setError(""); }}
          className="mt-6 w-full text-center font-bold text-slate-500 uppercase text-sm hover:text-blue-600 underline"
        >
          {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}