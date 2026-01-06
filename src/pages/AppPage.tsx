import Canvas from '../components/Canvas';

export default function AppPage() {
	return (
		<div className="w-full h-full relative">
			<Canvas />

			{/* Overlay Controls (if needed later) */}
			<div className="absolute bottom-4 right-4 bg-white dark:bg-zinc-800 p-2 rounded shadow text-xs text-slate-500 pointer-events-none select-none">
				Zoom: 100%
			</div>
		</div>
	);
}
