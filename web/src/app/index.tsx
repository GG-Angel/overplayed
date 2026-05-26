import AppLayout from "@/components/layout/AppLayout";
import { AppProvider } from "./provider";
import { AppRouter } from "./router";

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
