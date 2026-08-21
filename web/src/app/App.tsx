import AppLayout from "@/components/layout/AppLayout";
import { AppProvider } from "./AppProvider";
import { AppRouter } from "./AppRouter";

function App() {
  return (
    <AppProvider>
      <AppLayout>
        <AppRouter />
      </AppLayout>
    </AppProvider>
  );
}

export default App;
