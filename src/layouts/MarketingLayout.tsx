import { Outlet, Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';

export default function MarketingLayout() {
	return (
		<div className="min-h-screen flex flex-col bg-slate-50 dark:bg-brand-darker text-slate-900 dark:text-white font-sans selection:bg-brand-orange selection:text-white transition-colors duration-300">
			<header className="border-b border-slate-200 dark:border-white/10 p-4 sticky top-0 backdrop-blur-md bg-white/80 dark:bg-brand-darker/80 z-50 transition-colors duration-300">
				<div className="container mx-auto flex justify-between items-center">
					<Link to="/" className="flex items-center gap-3 group">
						<Logo className="h-10 w-10 transition-transform group-hover:scale-105 text-brand-dark dark:text-white" />
						<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-brand-orange transition-colors">
							LaserForge
						</h1>
					</Link>
					<nav className="flex items-center gap-6">
						<Link to="/app" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors">
							App
						</Link>
						<a href="https://github.com/LaserForge/LaserForge" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors">
							GitHub
						</a>
						<ThemeToggle />
					</nav>
				</div>
			</header>
			<main className="flex-grow">
				<Outlet />
			</main>
			<footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-brand-dark py-12 text-center transition-colors duration-300">
				<div className="container mx-auto px-4">
					<div className="mb-4 flex justify-center">
						<Logo className="h-8 w-8 opacity-50 grayscale hover:grayscale-0 transition-all text-slate-500 dark:text-white" />
					</div>
					<p className="text-slate-500 dark:text-slate-400 text-sm">&copy; {new Date().getFullYear()} LaserForge Project. Open Source (GPLv3).</p>
				</div>
			</footer>
		</div>
	);
}
