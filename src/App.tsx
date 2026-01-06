import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MarketingLayout from './layouts/MarketingLayout';
import LandingPage from './pages/LandingPage';
import AppLayout from './layouts/AppLayout';
import AppPage from './pages/AppPage';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<MarketingLayout />}>
					<Route index element={<LandingPage />} />
				</Route>

				{/* Main Application Routes */}
				<Route path="/app" element={<AppLayout />}>
					<Route index element={<AppPage />} />
				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
