// Mobile navigation toggle.
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
if (toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.toggleAttribute("data-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

// Publications page: filter by topic. Without JavaScript every paper shows.
const filter = document.querySelector("[data-filter]");
if (filter) {
  const entries = [...document.querySelectorAll(".pub-entry")];
  const groups = [...document.querySelectorAll("[data-year-group]")];
  const status = document.querySelector("[data-filter-status]");
  filter.hidden = false;
  filter.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;
    const topic = button.dataset.topic;
    for (const b of filter.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === button));
    for (const entry of entries) entry.hidden = Boolean(topic) && entry.dataset.topic !== topic;
    for (const group of groups) group.hidden = !group.querySelector(".pub-entry:not([hidden])");
    const shown = entries.filter((entry) => !entry.hidden).length;
    const template = topic ? filter.dataset.statusTopic : filter.dataset.statusAll;
    status.textContent = template.replace("{n}", shown).replace("{topic}", button.dataset.label);
  });
}
