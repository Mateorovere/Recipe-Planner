import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IngredientChip } from "./IngredientChip";
import type { DraftIngredient } from "../../types/ingredient";

const baseIngredient: DraftIngredient = {
  id: "1",
  name: "tomato",
  confidence: 0.9,
  source: "text",
  quantity: null,
  unit: null,
};

describe("IngredientChip", () => {
  it("renders the ingredient name", () => {
    render(
      <IngredientChip ingredient={baseIngredient} onRemove={vi.fn()} onQuantityChange={vi.fn()} />,
    );
    expect(screen.getByText("tomato")).toBeInTheDocument();
  });

  it("calls onRemove with the ingredient id when the remove button is clicked", async () => {
    const onRemove = vi.fn();
    render(
      <IngredientChip ingredient={baseIngredient} onRemove={onRemove} onQuantityChange={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /remove tomato/i }));
    expect(onRemove).toHaveBeenCalledWith("1");
  });

  it("flags low-confidence detections visually", () => {
    render(
      <IngredientChip
        ingredient={{ ...baseIngredient, confidence: 0.2 }}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    );
    expect(screen.getByTitle("Low confidence detection")).toBeInTheDocument();
  });

  it("does not flag manually-added ingredients as low confidence", () => {
    render(
      <IngredientChip
        ingredient={{ ...baseIngredient, confidence: null, source: "manual" }}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    );
    expect(screen.queryByTitle("Low confidence detection")).not.toBeInTheDocument();
  });

  it("calls onQuantityChange when the quantity input changes", async () => {
    const onQuantityChange = vi.fn();
    render(
      <IngredientChip
        ingredient={baseIngredient}
        onRemove={vi.fn()}
        onQuantityChange={onQuantityChange}
      />,
    );
    await userEvent.type(screen.getByLabelText(/quantity for tomato/i), "3");
    expect(onQuantityChange).toHaveBeenCalled();
  });
});
