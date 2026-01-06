const features = [
	{ title: "Fully Offline", desc: "Built as a PWA. Works perfectly without an internet connection." },
	{ title: "Cross-Platform", desc: "Runs on Windows, Mac, Linux, and even Chromebooks via Chrome." },
	{ title: "Hardware Agnostic", desc: "Native support for GRBL and experimental support for Ruida (DSP)." },
	{ title: "Open Source", desc: "100% free and open. No subscription fees, ever." },
];

export default function Features() {
	return (
		<section className="py-24 bg-white dark:bg-brand-dark px-4 border-t border-slate-200 dark:border-white/10 transition-colors duration-300">
			<div className="container mx-auto">
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
					{features.map((f, i) => (
						<div key={i} className="p-8 bg-slate-50 dark:bg-brand-darker rounded-2xl border border-slate-200 dark:border-white/5 hover:border-brand-orange/50 transition-colors group shadow-sm dark:shadow-none">
							<h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-brand-orange transition-colors">{f.title}</h3>
							<p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
