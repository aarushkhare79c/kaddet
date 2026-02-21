import Link from 'next/link';
import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-orange-400 text-slate-900 flex flex-col items-center p-4 font-sans selection:bg-white">
      <div className="w-full max-w-md flex flex-col gap-8 mt-8">
        
        {/* Main Header Card */}
        <header className="bg-white border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center transform -rotate-1 relative">
          {/* Decorative Badge */}
          <div className="absolute -top-4 -right-2 bg-yellow-400 border-4 border-black px-4 py-1 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-12">
            <span className="font-black text-sm uppercase">Rank #2</span>
          </div>

          <h1 className="text-4xl font-black tracking-tighter text-blue-600 uppercase mb-2">City Hunter</h1>
          <p className="font-bold text-slate-500 uppercase tracking-widest text-sm">Welcome Back, Night Owl</p>
          
          <div className="mt-4 pt-4 border-t-4 border-dashed border-slate-200">
            <p className="text-sm font-black text-slate-400 uppercase">Total Points</p>
            <p className="text-3xl font-black text-pink-500">2,450</p>
          </div>
        </header>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-6">
          
          {/* Link to the Scavenger Hunt Game */}
          <Link href="/hunt" className="group block outline-none">
            <div className="bg-yellow-300 border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 transform group-hover:-translate-y-1 group-active:translate-y-2 group-active:translate-x-2 group-active:shadow-none flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase text-black mb-1">Enter The Hunt</h2>
                <p className="font-bold text-slate-700 text-sm">Complete tasks & earn points</p>
              </div>
              <div className="text-5xl transform transition-transform group-hover:scale-110 group-hover:rotate-12">
                🏃
              </div>
            </div>
          </Link>

          {/* Link to the Radar / Group Finder */}
          <Link href="/radar" className="group block outline-none">
            <div className="bg-pink-400 border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 transform group-hover:-translate-y-1 group-active:translate-y-2 group-active:translate-x-2 group-active:shadow-none flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase text-white mb-1">Local Radar</h2>
                <p className="font-bold text-pink-900 text-sm">Find teams near you</p>
              </div>
              <div className="text-5xl transform transition-transform group-hover:scale-110 group-hover:-rotate-12">
                📡
              </div>
            </div>
          </Link>

			{/* Link to the Leaderboard */}
			<Link href="/leaderboard" className="group block outline-none">
			<div className="bg-purple-400 border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 transform group-hover:-translate-y-1 group-active:translate-y-2 group-active:translate-x-2 group-active:shadow-none flex items-center justify-between">
				<div>
				<h2 className="text-2xl font-black uppercase text-white mb-1">Leaderboard</h2>
				<p className="font-bold text-purple-900 text-sm">See global rankings</p>
				</div>
				<div className="text-5xl transform transition-transform group-hover:scale-110 group-hover:rotate-12">
				🏆
				</div>
			</div>
			</Link>

          {/* Locked / Coming Soon Feature */}
          <div className="bg-slate-300 border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] opacity-70 flex items-center justify-between cursor-not-allowed">
            <div>
              <h2 className="text-2xl font-black uppercase text-slate-500 mb-1">Rewards</h2>
              <p className="font-bold text-slate-500 text-sm">Unlocks at 5,000 points</p>
            </div>
            <div className="text-5xl grayscale">
              🎁
            </div>
          </div>

        </nav>

      </div>
    </div>
  );
}