import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AuthInitializer } from "./components/auth/AuthInitializer";

function App() {
  useEffect(() => {
    document.title = "Subvia";

    const existingIcon = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"]',
    );
    const icon = existingIcon ?? document.createElement("link");

    icon.rel = "icon";
    icon.href = "/branding/subvia-logo.png";

    if (!existingIcon) {
      document.head.appendChild(icon);
    }
  }, []);

  return (
    <AuthInitializer>
      <Outlet />
    </AuthInitializer>
  );
}

export default App;
