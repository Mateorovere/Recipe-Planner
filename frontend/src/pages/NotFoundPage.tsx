import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="text-5xl" aria-hidden="true">
        🍳
      </span>
      <h1 className="text-xl font-bold text-gray-900">Page not found</h1>
      <p className="text-gray-500">We couldn't find what you were looking for.</p>
      <Link to="/" className="font-medium text-brand-600 hover:underline">
        Back to Home
      </Link>
    </div>
  );
}
