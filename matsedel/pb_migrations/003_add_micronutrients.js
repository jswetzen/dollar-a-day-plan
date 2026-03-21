migrate((app) => {
  const col = app.findCollectionByNameOrId("foods");
  const names = ["fiber","sugar","sat_fat","unsat_fat","sodium",
    "vit_a","vit_b6","vit_b12","vit_c","vit_d","vit_e","vit_k","folate",
    "iron","calcium","magnesium","potassium","zinc",
    "phosphorus","selenium","iodine","omega3","omega6","cholesterol"];
  for (const name of names) col.fields.add(new NumberField({ name, required: false }));
  app.save(col);
}, (app) => {
  const col = app.findCollectionByNameOrId("foods");
  const names = ["fiber","sugar","sat_fat","unsat_fat","sodium",
    "vit_a","vit_b6","vit_b12","vit_c","vit_d","vit_e","vit_k","folate",
    "iron","calcium","magnesium","potassium","zinc",
    "phosphorus","selenium","iodine","omega3","omega6","cholesterol"];
  for (const name of names) {
    const f = col.fields.getByName(name);
    if (f) col.fields.remove(f);
  }
  app.save(col);
});
