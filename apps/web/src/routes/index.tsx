import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">Effect Start</h1>
      <p className="text-gray-600 mb-8">
        A starter kit with Effect, TanStack, and PostgreSQL
      </p>
      <Link
        to="/todos"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Todos
      </Link>
    </div>
  );
}
