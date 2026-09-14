import { Outlet } from "react-router-dom";
import { AuthInitializer } from "./components/auth/AuthInitializer";

function App() {
  return (
    <AuthInitializer>
      <Outlet />
    </AuthInitializer>
  );
}

export default App;