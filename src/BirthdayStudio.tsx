import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Gift,
  LayoutGrid,
  LoaderCircle,
  Music2,
  Palette,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
  Trash2,
  Save,
  ImagePlus,
  CalendarDays,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Poster } from "./components/Poster";
import { sqliteRepository } from "./lib/repository";
import { templates, quoteFor, quotesFor } from "./lib/templates";
import { daysUntilBirthday, localDate } from "./lib/birthdays";
import type {
  Brand,
  Draft,
  Repository,
  SavedPoster,
  Student,
} from "./lib/types";
const initialBrand: Brand = {
  name: "Harmony Music Academy",
  type: "music",
  logo: "",
  accent: "#b9904e",
};
const initialDraft: Draft = {
  templateId: "midnight-sonata",
  studentId: "",
  heading: "Happy Birthday",
  name: "Aarav Sharma",
  quote: quoteFor("music", "Piano"),
  autoQuote: true,
  font: "script",
  format: "square",
  photo: "",
  emoji: "🧑‍🎤",
};
type Page = "templates" | "students" | "saved" | "brand" | "editor";
export function BirthdayStudio({
  repository = sqliteRepository,
}: {
  repository?: Repository;
}) {
  const [page, setPage] = useState<Page>("templates"),
    [students, setStudents] = useState<Student[]>([]),
    [brand, setBrand] = useState<Brand>(initialBrand),
    [draft, setDraft] = useState<Draft>(initialDraft),
    [saved, setSaved] = useState<SavedPoster[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All templates"),
    [editing, setEditing] = useState<Student | null>(null),
    [busy, setBusy] = useState(false),
    [deleteTarget, setDeleteTarget] = useState<{
      kind: "student" | "poster";
      id: string;
    } | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!editing && !deleteTarget) return;
    const previous = document.activeElement as HTMLElement;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        setEditing(null);
        setDeleteTarget(null);
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".modal button:not(:disabled), .modal input, .modal select",
          ),
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.querySelector<HTMLElement>(".modal input, .modal button")?.focus();
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [!!editing, !!deleteTarget, busy]);
  useEffect(() => {
    let active = true;
    Promise.all([
      repository.students(),
      repository.brand(),
      repository.posters(),
    ])
      .then(([s, b, p]) => {
        if (!active) return;
        setStudents(s);
        setBrand(b);
        setSaved(p);
        if (s[0])
          setDraft({
            ...initialDraft,
            studentId: s[0].id,
            name: s[0].name,
            photo: s[0].photo,
            emoji: s[0].emoji,
            quote: quoteFor(b.type, s[0].course),
          });
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repository]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const upcoming = [...students].sort(
    (a, b) => daysUntilBirthday(a.dob) - daysUntilBirthday(b.dob),
  );
  const selected = students.find((s) => s.id === draft.studentId);
  const quoteOptions = quotesFor(brand.type, selected?.course);
  const quoteIndex = (draft.quoteIndex ?? 0) % quoteOptions.length;
  const displayDraft = {
    ...draft,
    quote: draft.autoQuote ? quoteOptions[quoteIndex] : draft.quote,
  };
  function navigate(p: Page) {
    setPage(p);
    setSearch("");
  }
  function chooseStudent(s: Student) {
    setDraft((d) => ({
      ...d,
      studentId: s.id,
      name: s.name,
      photo: s.photo,
      emoji: s.emoji,
    }));
  }
  async function action(fn: () => Promise<void>, message: string) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setNotice(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined, done: (url: string) => void) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 4 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPEG or WebP image under 4 MB.");
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error("This image could not be decoded"));
        img.src = data;
      });
      done(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function download() {
    await action(async () => {
      if (!posterRef.current) throw new Error("Poster is not ready");
      await document.fonts.ready;
      const images = Array.from(posterRef.current.querySelectorAll("img"));
      await Promise.all(images.map((img) => img.decode()));
      const url = await toPng(posterRef.current, {
        pixelRatio: 1080 / 540,
        cacheBust: false,
      });
      const a = document.createElement("a");
      a.download = `birthday-${draft.name.trim().replace(/[^a-z0-9]+/gi, "-") || "poster"}.png`;
      a.href = url;
      a.click();
    }, "Your poster has been downloaded");
  }
  return (
    <div className="studio">
      <aside className="sidebar">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("templates");
          }}
        >
          <span className="wordmark-icon">
            <Gift size={23} />
          </span>
          wishwell<span className="wordmark-dot">.</span>
        </a>
        <div className="workspace">
          <div className="workspace-icon">
            <Music2 size={20} />
          </div>
          <div>
            <strong>{brand.name}</strong>
            <small>Your celebration workspace</small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {(
            [
              { id: "templates", icon: LayoutGrid, label: "Template library" },
              { id: "students", icon: Users, label: "People & birthdays" },
              { id: "saved", icon: BookOpen, label: "Saved posters" },
              { id: "brand", icon: Palette, label: "Brand settings" },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={
                page === n.id || (page === "editor" && n.id === "templates")
                  ? "active"
                  : ""
              }
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "saved" && saved.length > 0 && (
                <span className="count">{saved.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={22} />
          <h3>
            A small wish.
            <br />A lasting memory.
          </h3>
          <p>Make everyone feel a little more special on their day.</p>
          <span>Made with a little magic ✧</span>
        </div>
        <div className="profile">
          <span>HM</span>
          <div>
            <strong>Celebration studio</strong>
            <small>Local SQLite workspace</small>
          </div>
          <i />
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            Workspace <ChevronRight size={14} />{" "}
            <strong>
              {page === "editor"
                ? "Poster editor"
                : page === "templates"
                  ? "Template library"
                  : page === "students"
                    ? "People & birthdays"
                    : page === "saved"
                      ? "Saved posters"
                      : "Brand settings"}
            </strong>
          </div>
          <span className="local-badge">
            <i /> Local demo
          </span>
        </header>
        <main>
          {error && (
            <div className="alert" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={17} />
              </button>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <Check size={18} />
              {notice}
            </div>
          )}
          {loading ? (
            <div className="loading">
              <LoaderCircle className="spin" /> Opening your studio…
            </div>
          ) : (
            <>
              {page === "templates" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        THOUGHTFULLY MADE. PERSONALLY YOURS.
                      </div>
                      <h1>
                        Good wishes start here<span>.</span>
                      </h1>
                      <p>
                        Pick a little inspiration. Make it their kind of
                        birthday.
                      </p>
                    </div>
                    <Button onClick={() => navigate("editor")}>
                      <Plus size={17} />
                      Create a poster
                    </Button>
                  </div>
                  <section className="hero">
                    <div className="hero-copy">
                      <span className="hero-tag">
                        <Sparkles size={13} /> EVERY BIRTHDAY DESERVES A
                        SPOTLIGHT
                      </span>
                      <h2>
                        Celebrate the person.
                        <br />
                        <em>Make it personal.</em>
                      </h2>
                      <p>
                        Beautiful birthday posters, your own branding,
                        <br />
                        and a wish that sounds just like you.
                      </p>
                      <Button
                        onClick={() => {
                          setDraft((d) => ({
                            ...d,
                            templateId: "midnight-sonata",
                          }));
                          navigate("editor");
                        }}
                      >
                        Make a birthday wish <ArrowRight size={16} />
                      </Button>
                      <div className="hero-caption">
                        <span>✦</span> 10 artist-inspired templates. Endless
                        possibilities.
                      </div>
                    </div>
                    <div className="hero-posters" aria-hidden="true">
                      <div className="hero-poster back">
                        <Poster
                          mini
                          draft={{
                            ...displayDraft,
                            templateId: "rose-rhapsody",
                            name: "Maya Iyer",
                            emoji: "👩‍🎤",
                          }}
                          brand={brand}
                        />
                      </div>
                      <div className="hero-poster front">
                        <Poster
                          mini
                          draft={{
                            ...displayDraft,
                            templateId: "midnight-sonata",
                          }}
                          brand={brand}
                        />
                      </div>
                      <span className="hero-spark">✧</span>
                    </div>
                  </section>
                  <div className="birthday-strip">
                    <div className="birthday-icon">
                      <CalendarDays size={21} />
                    </div>
                    <div>
                      <strong>
                        {upcoming.filter((s) => daysUntilBirthday(s.dob) === 0)
                          .length
                          ? `${upcoming.filter((s) => daysUntilBirthday(s.dob) === 0).length} birthday today. A perfect reason to celebrate!`
                          : "A little heads-up for the next happy day"}
                      </strong>
                      <span>
                        {upcoming[0]
                          ? `${upcoming[0].name} · ${daysUntilBirthday(upcoming[0].dob) === 0 ? "Today" : `In ${daysUntilBirthday(upcoming[0].dob)} days`} · ${upcoming[0].course}`
                          : "Add people to see upcoming birthdays here."}
                      </span>
                    </div>
                    <button onClick={() => navigate("students")}>
                      View birthdays <ArrowRight size={16} />
                    </button>
                  </div>
                  <section className="gallery-section">
                    <div className="section-heading">
                      <div>
                        <h2>
                          Find their perfect match <span>10 templates</span>
                        </h2>
                        <p>
                          A little elegant, a little playful, and a whole lot of
                          happy.
                        </p>
                      </div>
                      <div className="search-box">
                        <Search size={16} />
                        <input
                          aria-label="Search templates"
                          placeholder="Search templates…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="filter-row">
                      {[
                        "All templates",
                        "Music",
                        "Floral",
                        "Minimal",
                        "Celebration",
                      ].map((f) => (
                        <button
                          className={filter === f ? "selected" : ""}
                          key={f}
                          onClick={() => setFilter(f)}
                        >
                          {f === "All templates" && (
                            <SlidersHorizontal size={13} />
                          )}{" "}
                          {f}
                        </button>
                      ))}
                      <span>Designed to make their day</span>
                    </div>
                    <div className="template-grid">
                      {templates
                        .filter(
                          (t) =>
                            (filter === "All templates" ||
                              t.category === filter) &&
                            t.name.toLowerCase().includes(search.toLowerCase()),
                        )
                        .map((t, i) => (
                          <button
                            className="template-card"
                            key={t.id}
                            onClick={() => {
                              setDraft((d) => ({ ...d, templateId: t.id }));
                              navigate("editor");
                            }}
                          >
                            <div className="template-preview">
                              <Poster
                                mini
                                draft={{
                                  ...displayDraft,
                                  format: "square",
                                  templateId: t.id,
                                }}
                                brand={brand}
                              />
                              {i === 0 && filter === "All templates" && (
                                <span className="popular">✦ POPULAR</span>
                              )}
                              <span className="use-template">
                                Customize template <ArrowRight size={14} />
                              </span>
                            </div>
                            <div className="template-meta">
                              <div>
                                <h3>{t.name}</h3>
                                <p>{t.category} · Square & portrait</p>
                              </div>
                              <span style={{ background: t.background }} />
                              <span style={{ background: t.foreground }} />
                            </div>
                          </button>
                        ))}
                    </div>
                    {!templates.some(
                      (t) =>
                        (filter === "All templates" || t.category === filter) &&
                        t.name.toLowerCase().includes(search.toLowerCase()),
                    ) && (
                      <div className="empty">
                        No templates found. Try another search.
                      </div>
                    )}
                  </section>
                </>
              )}
              {page === "editor" && (
                <>
                  <div className="page-heading">
                    <div>
                      <button
                        className="back-link"
                        onClick={() => navigate("templates")}
                      >
                        <ArrowLeft size={14} /> Template library
                      </button>
                      <h1>
                        Make it their own<span>.</span>
                      </h1>
                      <p>Every detail, a little more personal.</p>
                    </div>
                    <div className="actions">
                      <Button
                        variant="outline"
                        disabled={
                          busy || !draft.name.trim() || !draft.heading.trim()
                        }
                        onClick={() =>
                          action(async () => {
                            const p: SavedPoster = {
                              id: crypto.randomUUID(),
                              title: `${draft.name}’s birthday`,
                              draft: displayDraft,
                              brand: { ...brand },
                              createdAt: new Date().toISOString(),
                            };
                            await repository.savePoster(p);
                            setSaved((s) => [p, ...s]);
                          }, "Poster saved to your library")
                        }
                      >
                        <Save size={16} />
                        Save poster
                      </Button>
                      <Button
                        disabled={
                          busy || !draft.name.trim() || !draft.heading.trim()
                        }
                        onClick={download}
                      >
                        {busy ? (
                          <LoaderCircle className="spin" size={16} />
                        ) : (
                          <ArrowDownToLine size={16} />
                        )}
                        Download PNG
                      </Button>
                    </div>
                  </div>
                  <div className="editor-layout">
                    <section className="editor-controls">
                      <h3>
                        <SlidersHorizontal size={17} /> Poster details
                      </h3>
                      <label>
                        Birthday person
                        <select
                          value={draft.studentId}
                          onChange={(e) => {
                            const s = students.find(
                              (s) => s.id === e.target.value,
                            );
                            if (s) chooseStudent(s);
                            else setDraft((d) => ({ ...d, studentId: "" }));
                          }}
                        >
                          <option value="">Custom person</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Birthday greeting
                        <input
                          maxLength={50}
                          value={draft.heading}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, heading: e.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Display name
                        <input
                          maxLength={60}
                          value={draft.name}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, name: e.target.value }))
                          }
                        />
                      </label>
                      <div className="field-pair">
                        <label>
                          Name style
                          <select
                            value={draft.font}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                font: e.target.value as Draft["font"],
                              }))
                            }
                          >
                            <option value="script">Calligraphy</option>
                            <option value="serif">Classic serif</option>
                          </select>
                        </label>
                        <label>
                          Canvas size
                          <select
                            value={draft.format}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                format: e.target.value as Draft["format"],
                              }))
                            }
                          >
                            <option value="square">Square · 1:1</option>
                            <option value="portrait">Portrait · 4:5</option>
                          </select>
                        </label>
                      </div>
                      <label>
                        Portrait or emoji
                        <div className="emoji-picker">
                          {["🧑‍🎤", "👩‍🎤", "👩‍🎨", "🧑‍🦱", "🎂", "🎸"].map((e) => (
                            <button
                              key={e}
                              className={
                                draft.emoji === e && !draft.photo
                                  ? "chosen"
                                  : ""
                              }
                              onClick={() =>
                                setDraft((d) => ({ ...d, emoji: e, photo: "" }))
                              }
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </label>
                      <label className="upload">
                        <ImagePlus size={17} />
                        {draft.photo ? "Replace photo" : "Upload a photo"}
                        <input
                          aria-label="Upload portrait"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) =>
                            upload(e.target.files?.[0], (photo) =>
                              setDraft((d) => ({ ...d, photo })),
                            )
                          }
                        />
                      </label>
                      <small className="helper">
                        PNG, JPG or WebP · up to 4 MB
                      </small>
                      <hr />
                      <div className="label-row">
                        <strong>Birthday wish</strong>
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={draft.autoQuote}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                quote: displayDraft.quote,
                                autoQuote: e.target.checked,
                              }))
                            }
                          />
                          Auto quote
                        </label>
                      </div>
                      <textarea
                        aria-label="Birthday wish"
                        rows={3}
                        maxLength={180}
                        disabled={draft.autoQuote}
                        value={displayDraft.quote}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, quote: e.target.value }))
                        }
                      />
                      {draft.autoQuote && (
                        <div className="quote-options">
                          <label>
                            Suggested quotes
                            <select
                              aria-label="Suggested quotes"
                              value={quoteIndex}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  quoteIndex: Number(e.target.value),
                                }))
                              }
                            >
                              {quoteOptions.map((quote, index) => (
                                <option key={quote} value={index}>
                                  {index + 1}. {quote}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="label-row">
                            <small className="helper">
                              Quote {quoteIndex + 1} of {quoteOptions.length}
                            </small>
                            <Button
                              variant="outline"
                              onClick={() =>
                                setDraft((d) => ({
                                  ...d,
                                  quoteIndex:
                                    (quoteIndex + 1) % quoteOptions.length,
                                }))
                              }
                            >
                              Next quote <ArrowRight size={14} />
                            </Button>
                          </div>
                        </div>
                      )}
                      <small className="helper">
                        {draft.autoQuote
                          ? `Matched to ${brand.type === "music" ? selected?.course || "music learning" : brand.type}.`
                          : "Write your own wish (up to 180 characters)."}
                      </small>
                      <hr />
                      <label>
                        Template
                        <select
                          value={draft.templateId}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              templateId: e.target.value,
                            }))
                          }
                        >
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="brand-link"
                        onClick={() => navigate("brand")}
                      >
                        <Palette size={16} /> Customize company name & logo{" "}
                        <ArrowRight size={14} />
                      </button>
                    </section>
                    <section className="preview-panel">
                      <div className="preview-top">
                        <span>
                          <i /> LIVE PREVIEW
                        </span>
                        <span>
                          {draft.format === "square"
                            ? "1080 × 1080"
                            : "1080 × 1350"}{" "}
                          px
                        </span>
                      </div>
                      <div className="preview-fit">
                        <Poster draft={displayDraft} brand={brand} />
                      </div>
                      <p className="preview-note">
                        <Sparkles size={14} /> Your wish. Your people. Your
                        brand.
                      </p>
                    </section>
                  </div>
                  <div className="export-stage" aria-hidden="true">
                    <Poster
                      ref={posterRef}
                      draft={displayDraft}
                      brand={brand}
                    />
                  </div>
                </>
              )}
              {page === "students" && (
                <>
                  <div className="page-heading">
                    <div className="title-block">
                      <div className="eyebrow">NEVER MISS THEIR MOMENT</div>
                      <h1>
                        People & birthdays<span>.</span>
                      </h1>
                      <p>A thoughtful wish starts with remembering the day.</p>
                    </div>
                    <Button
                      onClick={() =>
                        setEditing({
                          id: crypto.randomUUID(),
                          name: "",
                          dob: "",
                          course: "Piano",
                          emoji: "🧑‍🎤",
                          photo: "",
                        })
                      }
                    >
                      <Plus size={16} />
                      Add person
                    </Button>
                  </div>
                  <div className="stats">
                    <div>
                      <Users />
                      <strong>{students.length}</strong>
                      <span>People in your circle</span>
                    </div>
                    <div>
                      <Gift />
                      <strong>
                        {
                          students.filter((s) => daysUntilBirthday(s.dob) === 0)
                            .length
                        }
                      </strong>
                      <span>Celebrating today</span>
                    </div>
                    <div>
                      <CalendarDays />
                      <strong>
                        {
                          students.filter((s) => daysUntilBirthday(s.dob) <= 30)
                            .length
                        }
                      </strong>
                      <span>In the next 30 days</span>
                    </div>
                  </div>
                  <div className="section-heading">
                    <h2>Your birthday calendar</h2>
                    <div className="search-box">
                      <Search size={16} />
                      <input
                        aria-label="Search people"
                        placeholder="Find a person…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="people-list">
                    {upcoming
                      .filter((s) =>
                        s.name.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((s) => (
                        <div className="person-row" key={s.id}>
                          <div className="avatar">
                            {s.photo ? <img src={s.photo} alt="" /> : s.emoji}
                          </div>
                          <div className="person-name">
                            <strong>{s.name}</strong>
                            <small>{s.course || "Team member"}</small>
                          </div>
                          <div className="person-date">
                            {new Date(s.dob + "T12:00:00").toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )}
                            <small>
                              {daysUntilBirthday(s.dob) === 0
                                ? "🎉 Today!"
                                : `In ${daysUntilBirthday(s.dob)} days`}
                            </small>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              chooseStudent(s);
                              navigate("editor");
                            }}
                          >
                            Create wish <ArrowRight size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setEditing({ ...s })}
                          >
                            Edit
                          </Button>
                          <button
                            className="icon-button"
                            aria-label={`Delete ${s.name}`}
                            onClick={() =>
                              setDeleteTarget({ kind: "student", id: s.id })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    {!upcoming.filter((s) =>
                      s.name.toLowerCase().includes(search.toLowerCase()),
                    ).length && (
                      <div className="empty">
                        No people found. Add your first person or try a
                        different search.
                      </div>
                    )}
                  </div>
                  <p className="footnote">
                    Demo profiles use emojis. February 29 birthdays are
                    celebrated on February 28 in non-leap years.
                  </p>
                </>
              )}
              {page === "brand" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        MAKE EVERY WISH RECOGNIZABLY YOURS
                      </div>
                      <h1>
                        Your brand, beautifully<span>.</span>
                      </h1>
                      <p>Set the signature that goes on every celebration.</p>
                    </div>
                  </div>
                  <div className="brand-layout">
                    <form
                      className="settings-card"
                      onSubmit={(e) => {
                        e.preventDefault();
                        action(
                          () => repository.saveBrand(brand),
                          "Brand settings saved",
                        );
                      }}
                    >
                      <h2>Brand essentials</h2>
                      <label>
                        Company or academy name
                        <input
                          required
                          maxLength={70}
                          value={brand.name}
                          onChange={(e) =>
                            setBrand((b) => ({ ...b, name: e.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Organization type
                        <select
                          value={brand.type}
                          onChange={(e) =>
                            setBrand((b) => ({
                              ...b,
                              type: e.target.value as Brand["type"],
                            }))
                          }
                        >
                          <option value="music">Music academy</option>
                          <option value="company">Company / business</option>
                          <option value="school">School / education</option>
                        </select>
                      </label>
                      <p className="helper">
                        Music academies get instrument-inspired learning quotes.
                        Companies and schools get wishes matched to their world.
                      </p>
                      <label>
                        Portrait border color
                        <div className="color-control">
                          <input
                            aria-label="Brand accent color"
                            type="color"
                            value={brand.accent}
                            onChange={(e) =>
                              setBrand((b) => ({
                                ...b,
                                accent: e.target.value,
                              }))
                            }
                          />
                          <span>{brand.accent}</span>
                        </div>
                      </label>
                      <label className="upload">
                        <ImagePlus size={17} />
                        {brand.logo
                          ? "Replace company logo"
                          : "Upload company logo"}
                        <input
                          aria-label="Upload company logo"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) =>
                            upload(e.target.files?.[0], (logo) =>
                              setBrand((b) => ({ ...b, logo })),
                            )
                          }
                        />
                      </label>
                      {brand.logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setBrand((b) => ({ ...b, logo: "" }))}
                        >
                          Remove logo
                        </Button>
                      )}
                      <small className="helper">
                        Transparent PNG recommended · up to 4 MB
                      </small>
                      <Button disabled={busy} type="submit">
                        <Check size={16} />
                        Save brand settings
                      </Button>
                    </form>
                    <div className="brand-preview">
                      <Poster mini draft={displayDraft} brand={brand} />
                      <p>Your signature, on every birthday.</p>
                      <Button
                        variant="outline"
                        onClick={() => navigate("editor")}
                      >
                        Open poster editor <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {page === "saved" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        A COLLECTION OF HAPPY MOMENTS
                      </div>
                      <h1>
                        Wishes worth keeping<span>.</span>
                      </h1>
                      <p>
                        Revisit, personalize, and download your saved posters.
                      </p>
                    </div>
                    <Button onClick={() => navigate("templates")}>
                      <Plus size={16} />
                      Create a poster
                    </Button>
                  </div>
                  {saved.length ? (
                    <div className="template-grid saved-grid">
                      {saved.map((p) => (
                        <div className="saved-card" key={p.id}>
                          <button
                            className="saved-preview"
                            aria-label={`Open ${p.title}`}
                            onClick={() => {
                              setDraft({ ...p.draft, autoQuote: false });
                              setBrand(p.brand);
                              navigate("editor");
                            }}
                          >
                            <Poster mini draft={p.draft} brand={p.brand} />
                          </button>
                          <div className="template-meta">
                            <div>
                              <h3>{p.title}</h3>
                              <p>
                                {new Date(p.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              className="icon-button"
                              aria-label={`Delete ${p.title}`}
                              onClick={() =>
                                setDeleteTarget({ kind: "poster", id: p.id })
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">
                      <BookOpen size={35} />
                      <h2>Your collection starts with a wish.</h2>
                      <p>
                        Save a poster in the editor and find it here anytime.
                      </p>
                      <Button onClick={() => navigate("templates")}>
                        Explore templates <ArrowRight size={15} />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          <footer>
            <span>
              wishwell<span className="wordmark-dot">.</span>{" "}
              <span className="footer-copy">
                Little celebrations. Lasting connections.
              </span>
            </span>
            <span>
              Made personal, with love <span className="heart">♡</span>
            </span>
          </footer>
        </main>
      </div>
      {editing && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="person-dialog-title"
            className="modal"
          >
            <div className="section-heading">
              <h2 id="person-dialog-title">
                {students.some((s) => s.id === editing.id)
                  ? "Edit person"
                  : "Add someone special"}
              </h2>
              <button
                aria-label="Close dialog"
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  const s = await repository.saveStudent({
                    ...editing,
                    name: editing.name.trim(),
                  });
                  setStudents((all) => [
                    ...all.filter((p) => p.id !== s.id),
                    s,
                  ]);
                  setEditing(null);
                }, "Person saved");
              }}
            >
              <label>
                Full name
                <input
                  autoFocus
                  required
                  maxLength={60}
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </label>
              <label>
                Date of birth
                <input
                  type="date"
                  required
                  min="1900-01-01"
                  max={localDate()}
                  value={editing.dob}
                  onChange={(e) =>
                    setEditing({ ...editing, dob: e.target.value })
                  }
                />
              </label>
              <label>
                Instrument, course or department
                <input
                  maxLength={60}
                  list="courses"
                  value={editing.course}
                  onChange={(e) =>
                    setEditing({ ...editing, course: e.target.value })
                  }
                />
                <datalist id="courses">
                  {["Piano", "Guitar", "Vocals", "Violin", "Drums"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </datalist>
              </label>
              <label>
                Demo avatar
                <select
                  value={editing.emoji}
                  onChange={(e) =>
                    setEditing({ ...editing, emoji: e.target.value })
                  }
                >
                  {["🧑‍🎤", "👩‍🎤", "👩‍🎨", "🧑‍🦱", "👩‍🦰", "👨‍🎤", "🎂"].map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </label>
              <label className="upload">
                <ImagePlus size={16} />
                {editing.photo ? "Replace photo" : "Upload optional photo"}
                <input
                  aria-label="Student photo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) =>
                    upload(e.target.files?.[0], (photo) =>
                      setEditing((s) => (s ? { ...s, photo } : s)),
                    )
                  }
                />
              </label>
              {editing.photo && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditing({ ...editing, photo: "" })}
                >
                  Remove photo
                </Button>
              )}
              <div className="actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  Save person
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
      {deleteTarget && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Delete this {deleteTarget.kind}?</h2>
            <p>This removes it from your local workspace.</p>
            <div className="actions">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    if (deleteTarget.kind === "student") {
                      await repository.deleteStudent(deleteTarget.id);
                      setStudents((s) =>
                        s.filter((x) => x.id !== deleteTarget.id),
                      );
                    } else {
                      await repository.deletePoster(deleteTarget.id);
                      setSaved((s) =>
                        s.filter((x) => x.id !== deleteTarget.id),
                      );
                    }
                    setDeleteTarget(null);
                  }, "Deleted from your workspace")
                }
              >
                Delete
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
