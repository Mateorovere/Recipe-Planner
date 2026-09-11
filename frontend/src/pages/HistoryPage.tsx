import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { Spinner } from "../components/common/Spinner";
import { getHistory } from "../api/users";
import { useAuthStore } from "../state/authStore";
import { encodeIngredientQuery } from "../utils/ingredientQuery";

export function HistoryPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["history"],
    queryFn: getHistory,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon="🔐"
        title="Log in to see your history"
        description="We'll remember the ingredients you've searched and analyzed."
        action={
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Log in
          </Link>
        }
      />
    );
  }

  if (isLoading) return <Spinner label="Loading your history…" />;
  if (isError) return <ErrorState error={error} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="mb-3 text-xl font-bold text-gray-900">Search history</h1>
        {data.searches.length === 0 ? (
          <EmptyState icon="🔍" title="No searches yet" />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.searches.map((s) => (
              <li key={s.id} className="rounded-xl border border-gray-100 p-3 text-sm">
                <Link
                  to={`/results?q=${encodeIngredientQuery(s.query_ingredients)}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {s.query_ingredients.map((i) => i.name).join(", ")}
                </Link>
                <p className="mt-1 text-xs text-gray-400">
                  {s.results_count} recipe{s.results_count === 1 ? "" : "s"} found ·{" "}
                  {new Date(s.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-gray-900">Ingredient history</h2>
        {data.ingredients.length === 0 ? (
          <EmptyState icon="🥕" title="No ingredients analyzed yet" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.ingredients.map((i) => (
              <span
                key={i.id}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm capitalize text-gray-700"
                title={`via ${i.source}${i.confidence !== null ? ` · ${Math.round(i.confidence * 100)}% confidence` : ""}`}
              >
                {i.raw_label}
                {i.quantity !== null && (
                  <span className="text-gray-400">
                    {" "}
                    ({i.quantity} {i.unit ?? ""})
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
