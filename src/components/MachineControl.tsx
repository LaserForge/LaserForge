import { useGrblStore, grblController } from '../lib/drivers/grbl/GrblController';
import { useEffect, useRef } from 'react';

export default function MachineControl() {
	const { status, mpos, connectionState, logs } = useGrblStore();
	const logContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (logContainerRef.current) {
			logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
		}
	}, [logs]);

	const handleConnect = () => {
		grblController.connect();
	};

	const handleDisconnect = () => {
		grblController.disconnect();
	};

	const handleJog = (axis: 'X' | 'Y' | 'Z', dist: number) => {
		// Example Jog Command: $J=G91 X10 F1000
		grblController.sendGCode(`$J=G91 ${axis}${dist} F2000`);
	};

	const handleHome = () => {
		grblController.sendGCode('$H');
	};

	return (
		<div className="flex flex-col h-full bg-gray-900 text-white p-4 border-l border-gray-700 w-80">
			<div className="mb-6">
				<h2 className="text-xl font-bold mb-4 text-primary-400">Machine Control</h2>
				<div className="flex gap-2 mb-4">
					<button
						onClick={connectionState === 'connected' ? handleDisconnect : handleConnect}
						className={`flex-1 px-4 py-2 rounded font-bold transition-colors ${connectionState === 'connected'
							? 'bg-red-600 hover:bg-red-700'
							: 'bg-green-600 hover:bg-green-700'
							}`}
					>
						{connectionState === 'connected' ? 'Disconnect' : 'Connect'}
					</button>
				</div>
				<div className="grid grid-cols-2 gap-2 text-sm bg-gray-800 p-3 rounded">
					<div className="text-gray-400">Status:</div>
					<div className={`font-mono ${status === 'Alarm' ? 'text-red-500' : 'text-green-500'}`}>
						{status}
					</div>
					<div className="text-gray-400">X:</div>
					<div className="font-mono">{mpos.x.toFixed(3)}</div>
					<div className="text-gray-400">Y:</div>
					<div className="font-mono">{mpos.y.toFixed(3)}</div>
					<div className="text-gray-400">Z:</div>
					<div className="font-mono">{mpos.z.toFixed(3)}</div>
				</div>
			</div>

			<div className="mb-6">
				<h3 className="text-sm font-semibold mb-2 text-gray-400 uppercase tracking-wider">Jog</h3>
				<div className="grid grid-cols-3 gap-2 justify-items-center">
					<div></div>
					<button onClick={() => handleJog('Y', 10)} className="p-3 bg-gray-700 rounded hover:bg-gray-600">▲</button>
					<div></div>
					<button onClick={() => handleJog('X', -10)} className="p-3 bg-gray-700 rounded hover:bg-gray-600">◀</button>
					<button onClick={handleHome} className="p-3 bg-blue-600 rounded hover:bg-blue-700" title="Home">⌂</button>
					<button onClick={() => handleJog('X', 10)} className="p-3 bg-gray-700 rounded hover:bg-gray-600">▶</button>
					<div></div>
					<button onClick={() => handleJog('Y', -10)} className="p-3 bg-gray-700 rounded hover:bg-gray-600">▼</button>
					<div></div>
				</div>
			</div>

			<div className="flex-1 flex flex-col min-h-0 bg-black rounded border border-gray-700">
				<div className="p-2 border-b border-gray-700 text-xs text-gray-400 font-mono">Console</div>
				<div ref={logContainerRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
					{logs.map((log, i) => (
						<div key={i} className={log.startsWith('>') ? 'text-blue-400' : 'text-gray-300'}>
							{log}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
