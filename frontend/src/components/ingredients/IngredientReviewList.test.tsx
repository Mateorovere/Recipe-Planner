import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { IngredientReviewList } from "./IngredientReviewList";
import { useIngredientDraftStore } from "../../state/ingredientDraftStore";

function resetStore() {
  useIngredientDraftStore.setState({ ingredients: [], transcript: null });
}

describe("IngredientReviewList", () => {
  beforeEach(resetStore);

  it("shows an empty state when there are no ingredients", () => {
    render(<IngredientReviewList />);
    expect(screen.getByText(/no ingredients yet/i)).toBeInTheDocument();
  });

  it("adds a new ingredient via the input", async () => {
    render(<IngredientReviewList />);
    const input = screen.getByLabelText(/add an ingredient/i);
    await userEvent.type(input, "basil");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(screen.getByText("basil")).toBeInTheDocument();
    expect(useIngredientDraftStore.getState().ingredients).toHaveLength(1);
  });

  it("removes an ingredient when its chip's remove button is clicked", async () => {
    useIngredientDraftStore.setState({
      ingredients: [
        { id: "a", name: "onion", confidence: 0.8, source: "text", quantity: null, unit: null },
      ],
      transcript: null,
    });
    render(<IngredientReviewList />);

    await userEvent.click(screen.getByRole("button", { name: /remove onion/i }));

    expect(screen.queryByText("onion")).not.toBeInTheDocument();
    expect(useIngredientDraftStore.getState().ingredients).toHaveLength(0);
  });

  it("does not add duplicate ingredients", async () => {
    useIngredientDraftStore.setState({
      ingredients: [
        { id: "a", name: "onion", confidence: 0.8, source: "text", quantity: null, unit: null },
      ],
      transcript: null,
    });
    render(<IngredientReviewList />);

    await userEvent.type(screen.getByLabelText(/add an ingredient/i), "onion");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(useIngredientDraftStore.getState().ingredients).toHaveLength(1);
  });
});
