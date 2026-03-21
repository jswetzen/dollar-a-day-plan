migrate((app) => {
  // foods
  const foods = new Collection({
    name: "foods",
    type: "base",
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { type: "text",   name: "name",       required: true },
      { type: "text",   name: "store" },
      { type: "text",   name: "category" },
      { type: "number", name: "weight_g",   required: true },
      { type: "number", name: "price_kr",   required: true },
      { type: "number", name: "kcal" },
      { type: "number", name: "protein" },
      { type: "number", name: "carbs" },
      { type: "number", name: "fat" },
    ],
  })
  app.save(foods)

  // recipes
  const recipes = new Collection({
    name: "recipes",
    type: "base",
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { type: "text",   name: "name",     required: true },
      { type: "number", name: "servings", required: true },
    ],
  })
  app.save(recipes)

  // recipe_ingredients (join table; ingredients cascade-delete when recipe is deleted)
  const ingredients = new Collection({
    name: "recipe_ingredients",
    type: "base",
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { type: "relation", name: "recipe", required: true, collectionId: recipes.id, cascadeDelete: true },
      { type: "relation", name: "food",   required: true, collectionId: foods.id,   cascadeDelete: false },
      { type: "number",   name: "grams",  required: true },
    ],
  })
  app.save(ingredients)

  // meal_plan
  const mealPlan = new Collection({
    name: "meal_plan",
    type: "base",
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { type: "text",     name: "week_start", required: true },  // ISO date e.g. "2025-03-17"
      { type: "text",     name: "day",        required: true },  // "Mån" … "Sön"
      { type: "text",     name: "meal_slot",  required: true },  // "Frukost"|"Lunch"|"Middag"
      { type: "relation", name: "recipe",     required: false, collectionId: recipes.id, cascadeDelete: false },
    ],
  })
  app.save(mealPlan)
}, (app) => {
  for (const name of ["meal_plan", "recipe_ingredients", "recipes", "foods"]) {
    try {
      const col = app.findCollectionByNameOrId(name)
      app.delete(col)
    } catch (_) {}
  }
})
