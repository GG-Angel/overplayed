import { AppLayout } from "@/components/Layout";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";

function App() {
  return (
    <AppProviders>
      <AppLayout>
        <AppRouter />
      </AppLayout>
    </AppProviders>
  );
}

export default App;
