export default function Hero() {
	return (
		<section className="py-24 md:py-32 text-center px-4 relative overflow-hidden bg-slate-50 dark:bg-brand-darker transition-colors duration-300">
			{/* Background Glow */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/20 rounded-full blur-[120px] pointer-events-none opacity-50 dark:opacity-50"></div>

			<div className="relative z-10 max-w-4xl mx-auto">
				<h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-slate-900 dark:text-white leading-[1.1] transition-colors duration-300">
					Laser Control, <br />
					<span className="text-brand-orange">Unleashed.</span>
				</h2>
				<p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed transition-colors duration-300">
					The open-source, web-based alternative to LightBurn. Control your laser from any device, anywhere, fully offline.
				</p>
				<div className="flex justify-center gap-4 flex-wrap">
					<button className="bg-brand-orange hover:bg-slate-900 dark:hover:bg-white text-white dark:hover:text-brand-orange hover:text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(250,93,39,0.3)] hover:shadow-[0_0_30px_rgba(250,93,39,0.5)]">
						Launch App
					</button>
					<a href="https://github.com/LaserForge/LaserForge" target="_blank" rel="noopener noreferrer" className="border border-slate-300 dark:border-white/20 hover:border-slate-500 dark:hover:border-white bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-slate-900 dark:text-white px-8 py-4 rounded-full font-bold text-lg transition-all backdrop-blur-sm">
						Star on GitHub
					</a>
				</div>
			</div>
		</section>
	);
}
