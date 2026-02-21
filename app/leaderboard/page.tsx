import Link from 'next/link';
import React from 'react';

export default function LeaderboardPage() {
  // MOCK DATA: Your Architect will pull this from useQuery(api.teams.getTopTeams)
  const mockLeaderboard = [
    { rank: 1, name: "The Speedsters", points: 3100, isMe: false },
    { rank: 2, name: "Night Owls", points: 2450, isMe: true }, // The current user
    { rank: 3, name: "Team Solo", points: 1800, isMe: false },
    { rank: 4, name: "Pixel Pioneers", points: 1200, isMe: false },
    { rank: 5, name: "Urban Legends", points: 950, isMe: false },
    { rank: 6, name: "Code Crawlers", points: 400, isMe: false },
  ];

  return (
    <div className="min-h-screen bg-green-400 text-slate-900 flex flex-col items-center p-4 font-sans selection:bg-purple-300">
      <div className="w-full max-w-md flex flex-col gap-6 mt-4 pb-12">
        
        {/* Header with Back Button */}
        <header className="bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter text-purple-600 uppercase">Global Rank</h1>
          <Link 
            href="/" 
            className="bg-yellow-400 border-2 border-black px-4 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform transition-transform active:translate-y-1 active:shadow-none hover:bg-yellow-300"
          >
            ◀ Home
          </Link>
        </header>

        {/* The Leaderboard List */}
        <section className="flex flex-col gap-4">
          
          {mockLeaderboard.map((team) => {
            // Determine styles based on rank
            let rowStyle = "bg-white text-black";
            let rankBadge = "bg-slate-200 text-slate-500";
            let shadowStyle = "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
            let transformStyle = "";

            if (team.rank === 1) {
              rowStyle = "bg-yellow-300 border-yellow-500 text-black";
              rankBadge = "bg-yellow-500 text-white text-xl";
              transformStyle = "scale-105 z-10 -rotate-1"; // 1st place pops out
            } else if (team.rank === 2) {
              rowStyle = "bg-slate-100 text-black";
              rankBadge = "bg-slate-300 text-slate-600";
            } else if (team.rank === 3) {
              rowStyle = "bg-orange-200 text-black";
              rankBadge = "bg-orange-400 text-white";
            }

            // Highlight the current user's team aggressively
            if (team.isMe) {
              rowStyle = "bg-purple-500 text-white border-white";
              rankBadge = "bg-purple-300 text-purple-900";
              shadowStyle = "shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] border-4 border-black";
              transformStyle = "scale-105 z-20 rotate-1";
            }

            return (
              <div 
                key={team.rank} 
                className={`flex justify-between items-center border-4 border-black p-4 rounded-2xl transition-transform ${rowStyle} ${shadowStyle} ${transformStyle}`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 border-black font-black ${rankBadge}`}>
                    #{team.rank}
                  </div>
                  
                  {/* Team Name */}
                  <div className="flex flex-col">
                    <span className="font-black text-xl leading-none uppercase">
                      {team.name}
                    </span>
                    {team.isMe && (
                      <span className="text-xs font-bold text-yellow-300 uppercase tracking-widest mt-1">
                        That's You!
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <span className={`font-black text-2xl ${team.isMe ? 'text-white' : 'text-purple-600'}`}>
                    {team.points.toLocaleString()}
                  </span>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${team.isMe ? 'text-purple-200' : 'text-slate-500'}`}>
                    PTS
                  </p>
                </div>
              </div>
            );
          })}

        </section>
      </div>
    </div>
  );
}