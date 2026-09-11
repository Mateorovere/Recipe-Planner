"""Static seed dataset: the canonical ingredient dictionary.

Recipes are no longer seeded from a fixed catalog — they're generated live by the
AI recipe generation provider and persisted as they're created (see
`services/recipe_service.py`). This starter ingredient list is still useful as a
normalization/matching dictionary; it also grows organically at runtime whenever a
generated recipe introduces an ingredient name that isn't here yet (see
`IngredientRepository.get_or_create`).

Kept as plain data (no DB/session code) so it's easy to review and extend
independently of the actual upsert logic in `seed.py`.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Ingredients: (name, category)
# ---------------------------------------------------------------------------

INGREDIENTS: list[tuple[str, str]] = [
    # produce
    ("tomato", "produce"),
    ("onion", "produce"),
    ("garlic", "produce"),
    ("bell pepper", "produce"),
    ("carrot", "produce"),
    ("celery", "produce"),
    ("broccoli", "produce"),
    ("spinach", "produce"),
    ("zucchini", "produce"),
    ("mushroom", "produce"),
    ("potato", "produce"),
    ("sweet potato", "produce"),
    ("cucumber", "produce"),
    ("lettuce", "produce"),
    ("avocado", "produce"),
    ("lime", "produce"),
    ("lemon", "produce"),
    ("ginger", "produce"),
    ("scallion", "produce"),
    ("cilantro", "produce"),
    ("parsley", "produce"),
    ("basil", "produce"),
    ("cauliflower", "produce"),
    ("corn", "produce"),
    ("kale", "produce"),
    # fruit
    ("banana", "fruit"),
    ("apple", "fruit"),
    ("blueberries", "fruit"),
    ("strawberries", "fruit"),
    ("mango", "fruit"),
    ("orange", "fruit"),
    # protein
    ("chicken breast", "protein"),
    ("chicken thigh", "protein"),
    ("ground beef", "protein"),
    ("beef steak", "protein"),
    ("pork chop", "protein"),
    ("bacon", "protein"),
    ("shrimp", "protein"),
    ("salmon", "protein"),
    ("tuna", "protein"),
    ("tofu", "protein"),
    ("egg", "protein"),
    ("chickpeas", "legume"),
    ("black beans", "legume"),
    ("lentils", "legume"),
    ("kidney beans", "legume"),
    # dairy
    ("milk", "dairy"),
    ("butter", "dairy"),
    ("cheddar cheese", "dairy"),
    ("mozzarella cheese", "dairy"),
    ("parmesan cheese", "dairy"),
    ("feta cheese", "dairy"),
    ("greek yogurt", "dairy"),
    ("cream cheese", "dairy"),
    ("heavy cream", "dairy"),
    ("sour cream", "dairy"),
    # grain / starch
    ("rice", "grain"),
    ("brown rice", "grain"),
    ("pasta", "grain"),
    ("spaghetti", "grain"),
    ("bread", "grain"),
    ("tortilla", "grain"),
    ("oats", "grain"),
    ("quinoa", "grain"),
    ("flour", "baking"),
    ("breadcrumbs", "grain"),
    # pantry / condiments
    ("olive oil", "pantry"),
    ("vegetable oil", "pantry"),
    ("soy sauce", "pantry"),
    ("vinegar", "pantry"),
    ("honey", "pantry"),
    ("sugar", "baking"),
    ("brown sugar", "baking"),
    ("salt", "spice"),
    ("black pepper", "spice"),
    ("cumin", "spice"),
    ("paprika", "spice"),
    ("chili powder", "spice"),
    ("cinnamon", "spice"),
    ("oregano", "spice"),
    ("baking powder", "baking"),
    ("baking soda", "baking"),
    ("vanilla extract", "baking"),
    ("chocolate chips", "baking"),
    ("cocoa powder", "baking"),
    ("peanut butter", "pantry"),
    ("almonds", "pantry"),
    ("walnuts", "pantry"),
    ("sesame oil", "pantry"),
    ("chicken broth", "pantry"),
    ("vegetable broth", "pantry"),
    ("coconut milk", "pantry"),
    ("curry powder", "spice"),
    ("dijon mustard", "pantry"),
    ("tomato paste", "pantry"),
    ("canned tomatoes", "pantry"),
    ("salsa", "pantry"),
]
