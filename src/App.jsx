import { AppProvider } from './context/AppContext.jsx';
import AppRouter from './router/AppRouter.jsx';

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
