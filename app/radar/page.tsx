"use client";

import Link from 'next/link';
import React, { useState } from 'react';

export default function GroupFinderPage() {
  // MOCK STATE: In reality, you'd get this from useQuery(api.users.me)
  const [hasTeam, setHasTeam] = useState(false);
  const [joinedTeamId, setJoinedTeamId] = useState<string | null>(null);

  // MOCK DATA: Nearby open teams
  const mockNearbyTeams = [
    { id: "1", name: "The Speedsters", distance: "0.1 mi", members: 3 },
    { id: "2", name: "Team Solo", distance: "0.3 mi", members: 1 },
  ];

  // MOCK DATA: Nearby solo players (only shown if you are ALREADY in a team)
  const mockNearbySolos = [
    { id: "99", name: "Alex_Hunts", distance: "0.1 mi" },
    { id: "98", name: "SarahSmash", distance: "0.4 mi" },
  ];

  const handleCreateTeam = () => {
    // TODO: Trigger Convex mutation -> api.teams.create
    setHasTeam(true);
  };

  const handleJoinTeam = (teamId: string) => {
    // TODO: Trigger Convex mutation -> api.teams.join({ teamId })
    setJoinedTeamId(teamId);
    setTimeout(() => setHasTeam(true), 1000); // Fake network delay for the UI
  };

  return (
    <div className="min-h-screen bg-pink-100 text-slate-900 flex flex-col items-center p-4 font-sans selection:bg-yellow-300">
      <div className="w-full max-w-md flex flex-col gap-6 mt-4">
        
        {/* Header */}
        <header className="bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter text-pink-600 uppercase">Local Radar</h1>
          <Link href="/" className="bg-yellow-400 border-2 border-black px-4 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform transition-transform active:translate-y-1 active:shadow-none">
            Back
          </Link>
        </header>

        {/* Conditional View: Solo vs Team */}
        {!hasTeam ? (
          <>
            {/* SOLO VIEW: Call to Action */}
            <section className="bg-blue-500 border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center transform -rotate-1">
              <h2 className="text-white font-black text-2xl uppercase mb-2">You are flying solo!</h2>
              <p className="text-blue-100 font-bold text-sm mb-6">Tasks yield 2x points when completed with a squad.</p>
              
              <button 
                onClick={handleCreateTeam}
                className="w-full bg-yellow-400 border-4 border-black py-4 rounded-2xl font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none hover:bg-yellow-300"
              >
                🔥 Start New Squad
              </button>
            </section>

            {/* SOLO VIEW: List of Teams to Join */}
            <section className="flex flex-col gap-4">
              <h3 className="font-black text-slate-500 uppercase tracking-widest text-sm px-2">
                Or Join Nearby Teams
              </h3>

              {mockNearbyTeams.map((team) => (
                <div key={team.id} className="bg-white border-4 border-black p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-lg leading-none mb-1">{team.name}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      👥 {team.members}/5 • 📍 {team.distance}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleJoinTeam(team.id)}
                    className={`border-4 border-black px-4 py-2 rounded-xl font-black text-sm uppercase transition-all ${
                      joinedTeamId === team.id 
                        ? 'bg-green-400 text-black shadow-none translate-y-1 translate-x-1' 
                        : 'bg-pink-400 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-300'
                    }`}
                  >
                    {joinedTeamId === team.id ? 'Joined!' : 'Join'}
                  </button>
                </div>
              ))}
            </section>
          </>
        ) : (
          <>
            {/* TEAM VIEW: Already in a squad */}
            <section className="bg-green-400 border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center transform rotate-1">
              <h2 className="text-black font-black text-2xl uppercase mb-2">Squad Assembled</h2>
              <p className="text-green-900 font-bold text-sm mb-4">You are currently leading a team.</p>
              
              <Link href="/hunt" className="inline-block bg-black text-white border-4 border-black px-8 py-3 rounded-2xl font-black text-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none hover:bg-slate-800">
                Start Hunting
              </Link>
            </section>

            {/* TEAM VIEW: Recruit Solo Players */}
            <section className="flex flex-col gap-4 mt-4">
              <h3 className="font-black text-slate-500 uppercase tracking-widest text-sm px-2">
                Recruit Nearby Solos
              </h3>
              {mockNearbySolos.map((solo) => (
                <div key={solo.id} className="bg-white border-4 border-black p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-lg leading-none mb-1">{solo.name}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase">📍 {solo.distance}</p>
                  </div>
                  <button className="bg-blue-500 text-white border-4 border-black px-4 py-2 rounded-xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 active:translate-y-1 active:translate-x-1 active:shadow-none">
                    Recruit
                  </button>
                </div>
              ))}
            </section>
          </>
        )}

      </div>
    </div>
  );
}