import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";
import { useIngredientDraftStore } from "../state/ingredientDraftStore";

vi.mock("../api/ingredients", () => ({
  extractFromText: vi.fn(),
  extractFromImage: vi.fn(),
  extractFromAudio: vi.fn(),
}));
vi.mock("../api/recipes", () => ({
  searchRecipes: vi.fn(),
  getRecipe: vi.fn(),
  favoriteRecipe: vi.fn(),
  unfavoriteRecipe: vi.fn(),
}));

import { extractFromText } from "../api/ingredients";
import { searchRecipes } from "../api/recipes";

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("text ingredient -> review -> results flow", () => {
  beforeEach(() => {
    useIngredientDraftStore.setState({ ingredients: [], transcript: null });
    vi.mocked(extractFromText).mockReset();
    vi.mocked(searchRecipes).mockReset();
  });

  it("lets a user type ingredients, review them, and see ranked recipes", async () => {
    const user = userEvent.setup();

    vi.mocked(extractFromText).mockResolvedValue({
      ingredients: [
        { name: "chicken", confidence: 0.95, source: "text" },
        { name: "rice", confidence: 0.9, source: "text" },
      ],
      transcript: null,
    });
    vi.mocked(searchRecipes).mockResolvedValue({
      ai_reranked: false,
      recipes: [
        {
          id: 1,
          title: "Chicken Fried Rice",
          slug: "chicken-fried-rice",
          image_url: null,
          description: "Classic weeknight fried rice.",
          prep_time_minutes: 10,
          cook_time_minutes: 15,
          total_time_minutes: 25,
          difficulty: "easy",
          servings: 4,
          match_percentage: 100,
          matched_ingredient_count: 2,
          total_ingredient_count: 2,
          missing_ingredients: [],
        },
      ],
    });

    renderApp();

    await user.click(screen.getByRole("button", { name: /enter ingredients/i }));
    await user.type(screen.getByLabelText(/what do you have on hand/i), "I have chicken and rice");
    await user.click(screen.getByRole("button", { name: /find my ingredients/i }));

    await waitFor(() => expect(screen.getByText("Your ingredients")).toBeInTheDocument());
    expect(screen.getByText("chicken")).toBeInTheDocument();
    expect(screen.getByText("rice")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /find recipes/i }));

    await waitFor(() => expect(screen.getByText("Chicken Fried Rice")).toBeInTheDocument());
    expect(searchRecipes).toHaveBeenCalledWith(["chicken", "rice"], undefined);
  });

  it("shows an error state when ingredient extraction fails", async () => {
    const user = userEvent.setup();
    vi.mocked(extractFromText).mockRejectedValue(new Error("boom"));

    renderApp();

    await user.click(screen.getByRole("button", { name: /enter ingredients/i }));
    await user.type(screen.getByLabelText(/what do you have on hand/i), "asdf");
    await user.click(screen.getByRole("button", { name: /find my ingredients/i }));

    await waitFor(() =>
      expect(screen.getByText(/couldn't read your ingredients/i)).toBeInTheDocument(),
    );
  });
});
