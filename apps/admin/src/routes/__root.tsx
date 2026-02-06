import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "1rem" }}>
      <nav
        style={{
          display: "flex",
          gap: "1rem",
          padding: "0.75rem 0",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "1.5rem",
        }}
      >
        <Link to="/" style={{ textDecoration: "none", color: "#374151" }}>
          Dashboard
        </Link>
        <Link to="/todos" style={{ textDecoration: "none", color: "#374151" }}>
          Todos
        </Link>
      </nav>
      <Outlet />
    </div>
  );
}
