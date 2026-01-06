import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MarketingLayout from './layouts/MarketingLayout';
import LandingPage from './pages/LandingPage';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<MarketingLayout />}>
					<Route index element={<LandingPage />} />
				</Route>
				{/* App Routes will go here later */}
				<Route path="/app" element={<div className="min-h-screen bg-slate-900 text-white p-10">App Placeholder. Go back to <a href="/" className="text-blue-400 hover:underline">Home</a></div>} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
