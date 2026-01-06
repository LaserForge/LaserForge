import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import MachineControl from '../components/MachineControl';
import ThemeToggle from '../components/ThemeToggle';

export default function AppLayout() {
	return (
		<div className="h-screen w-screen bg-slate-100 dark:bg-zinc-900 flex overflow-hidden font-sans text-slate-900 dark:text-slate-100">
			{/* Sidebar - Tools */}
			<aside className="w-16 bg-white dark:bg-zinc-800 border-r border-slate-200 dark:border-white/10 flex flex-col items-center py-4 z-20 shadow-sm">
				<div className="mb-6">
					<Logo className="h-8 w-8 text-brand-dark dark:text-white" />
				</div>
				<nav className="flex flex-col gap-4 w-full px-2">
					{/* Placeholder Tools */}
					<div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-brand-orange/10 hover:text-brand-orange flex items-center justify-center cursor-pointer transition-colors">
						<span className="font-bold text-xs">SEL</span>
					</div>
					<div className="h-10 w-10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center cursor-pointer transition-colors">
						<span className="font-bold text-xs">PEN</span>
					</div>
					<div className="h-10 w-10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center cursor-pointer transition-colors">
						<span className="font-bold text-xs">RECT</span>
					</div>
				</nav>
			</aside>

			<div className="flex-grow flex flex-col h-full relative">
				{/* Top Bar */}
				<header className="h-12 bg-white dark:bg-zinc-800 border-b border-slate-200 dark:border-white/10 flex items-center px-4 justify-between z-10 shadow-sm">
					<div className="flex items-center gap-4">
						<span className="font-medium text-sm text-slate-500 dark:text-slate-400">Untitled Project</span>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
					</div>
				</header>

				{/* Main Canvas Area */}
				<main className="flex-grow bg-slate-50 dark:bg-zinc-900 overflow-hidden relative">
					<Outlet />
				</main>
			</div>

			{/* Right Properties Panel / Machine Control */}
			<MachineControl />
		</div>
	);
}
