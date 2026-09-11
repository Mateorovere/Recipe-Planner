import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { RecipeCard } from "./RecipeCard";
import type { RecipeSummary } from "../../types/recipe";

const recipe: RecipeSummary = {
  id: 42,
  title: "Chicken Fried Rice",
  slug: "chicken-fried-rice",
  image_url: null,
  image_attribution: null,
  description: "Classic weeknight fried rice.",
  prep_time_minutes: 10,
  cook_time_minutes: 15,
  total_time_minutes: 25,
  difficulty: "easy",
  servings: 4,
  match_percentage: 92,
  matched_ingredient_count: 8,
  total_ingredient_count: 9,
  missing_ingredients: ["sesame oil"],
  tags: ["quick", "vegetarian"],
};

function renderCard(props: Partial<React.ComponentProps<typeof RecipeCard>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RecipeCard recipe={recipe} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RecipeCard", () => {
  it("renders the recipe summary information", () => {
    renderCard();

    expect(screen.getByText("Chicken Fried Rice")).toBeInTheDocument();
    expect(screen.getByText("92% match")).toBeInTheDocument();
    expect(screen.getByText("⏱ 25 min")).toBeInTheDocument();
    expect(screen.getByText(/you already have 8\/9 ingredients/i)).toBeInTheDocument();
    expect(screen.getByText(/missing: sesame oil/i)).toBeInTheDocument();
  });

  it("links to the recipe's persisted detail page", () => {
    renderCard();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/recipes/42");
  });
});
