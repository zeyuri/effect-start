import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div>
      <h1
        style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}
      >
        Admin Dashboard
      </h1>
      <p style={{ color: "#6b7280" }}>
        Welcome to the Effect Start admin panel.
      </p>
    </div>
  );
}
