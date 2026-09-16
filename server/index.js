import express from "express";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validDob, localDate } from "../src/lib/birthdays.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(path.join(root, "data"), { recursive: true });
const db = new DatabaseSync(
  process.env.DB_PATH || path.join(root, "data/birthdays.sqlite"),
);
db.exec(
  "CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS posters (id TEXT PRIMARY KEY,payload TEXT NOT NULL);",
);
if (!db.prepare("SELECT id FROM settings WHERE id='seeded'").get()) {
  const names = [
    ["Aarav Sharma", "Piano", "🧑‍🎤"],
    ["Maya Iyer", "Vocals", "👩‍🎤"],
    ["Ethan Thomas", "Guitar", "🧑‍🦱"],
    ["Ananya Rao", "Violin", "👩‍🦰"],
    ["Noah James", "Drums", "👨‍🎤"],
    ["Zara Khan", "Piano", "👩‍🎨"],
  ];
  names.forEach(([name, course, emoji], i) => {
    const date = new Date();
    date.setDate(date.getDate() + [0, 2, 5, 9, 16, 27][i]);
    const dob = `${2005 + i}-${localDate(date).slice(5)}`;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO students VALUES (?,?)").run(
      id,
      JSON.stringify({ id, name, course, emoji, dob, photo: "" }),
    );
  });
  db.prepare("INSERT INTO settings VALUES (?,?)").run("seeded", "true");
  db.prepare("INSERT INTO settings VALUES (?,?)").run(
    "brand",
    JSON.stringify({
      name: "Harmony Music Academy",
      type: "music",
      logo: "",
      accent: "#b9904e",
    }),
  );
}
const app = express();
app.use(express.json({ limit: "12mb" }));
const imageOK = (v) =>
  typeof v === "string" &&
  (v === "" ||
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) &&
  v.length < 7_000_000;
const textOK = (v, max) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
app.get("/api/students", (_, res) =>
  res.json(
    db
      .prepare("SELECT payload FROM students")
      .all()
      .map((r) => JSON.parse(r.payload)),
  ),
);
app.put("/api/students/:id", (req, res) => {
  const s = req.body;
  if (
    s.id !== req.params.id ||
    !textOK(s.name, 60) ||
    !validDob(s.dob) ||
    typeof s.course !== "string" ||
    s.course.length > 60 ||
    !textOK(s.emoji, 20) ||
    !imageOK(s.photo)
  )
    return res
      .status(400)
      .json({
        error:
          "Enter a name, valid past date of birth, and a PNG, JPEG or WebP image under 4 MB.",
      });
  db.prepare("INSERT OR REPLACE INTO students VALUES (?,?)").run(
    s.id,
    JSON.stringify(s),
  );
  res.json(s);
});
app.delete("/api/students/:id", (req, res) => {
  db.prepare("DELETE FROM students WHERE id=?").run(req.params.id);
  res.sendStatus(204);
});
app.get("/api/brand", (_, res) =>
  res.json(
    JSON.parse(
      db.prepare("SELECT payload FROM settings WHERE id='brand'").get().payload,
    ),
  ),
);
app.put("/api/brand", (req, res) => {
  const b = req.body;
  if (
    !textOK(b.name, 70) ||
    !["music", "company", "school"].includes(b.type) ||
    !/^#[a-fA-F0-9]{6}$/.test(b.accent) ||
    !imageOK(b.logo)
  )
    return res.status(400).json({ error: "Invalid brand settings" });
  db.prepare("UPDATE settings SET payload=? WHERE id='brand'").run(
    JSON.stringify(b),
  );
  res.sendStatus(204);
});
app.get("/api/posters", (_, res) =>
  res.json(
    db
      .prepare("SELECT payload FROM posters ORDER BY rowid DESC")
      .all()
      .map((r) => JSON.parse(r.payload)),
  ),
);
app.put("/api/posters/:id", (req, res) => {
  const p = req.body;
  if (
    p.id !== req.params.id ||
    !textOK(p.title, 100) ||
    !p.draft ||
    !p.brand ||
    !textOK(p.draft.name, 60) ||
    !textOK(p.draft.heading, 50) ||
    typeof p.draft.quote !== "string" ||
    p.draft.quote.length > 180 ||
    !["square", "portrait"].includes(p.draft.format) ||
    !["script", "serif"].includes(p.draft.font) ||
    !imageOK(p.draft.photo) ||
    !imageOK(p.brand.logo)
  )
    return res.status(400).json({ error: "Invalid poster data" });
  db.prepare("INSERT OR REPLACE INTO posters VALUES (?,?)").run(
    p.id,
    JSON.stringify(p),
  );
  res.sendStatus(204);
});
app.delete("/api/posters/:id", (req, res) => {
  db.prepare("DELETE FROM posters WHERE id=?").run(req.params.id);
  res.sendStatus(204);
});
app.use("/api", (_, res) =>
  res.status(404).json({ error: "Endpoint not found" }),
);
app.use(express.static(path.join(root, "dist")));
app.get("/{*path}", (_, res) =>
  res.sendFile(path.join(root, "dist/index.html")),
);
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(err.status || 500)
    .json({
      error:
        err.status === 413
          ? "Image is too large"
          : "Unable to complete request",
    });
});
app.listen(Number(process.env.PORT) || 3001, "127.0.0.1", () =>
  console.log("Birthday API: http://127.0.0.1:3001"),
);
