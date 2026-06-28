const SUPABASE_URL = "https://khhishscjirjxhsulniq.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_d-MPFEIo3g9ORJXFzHiKtA_sIBHHD_7";

async function supabaseInsert(table, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Supabase error:", data);
    throw new Error(data?.message || "Could not save. Please try again.");
  }

  return data;
}

function clean(value) {
  return String(value || "").trim();
}

function showMessage(form, message, success = true) {
  let box =
    form.querySelector(".form-message") ||
    form.querySelector(".message") ||
    document.getElementById("formMessage") ||
    document.getElementById("signupMessage");

  if (!box) {
    box = document.createElement("div");
    box.className = "form-message";
    form.appendChild(box);
  }

  box.textContent = message;
  box.style.color = success ? "#5eff7a" : "#ff6b6b";
  box.style.marginTop = "14px";
  box.style.fontWeight = "700";
}

function getFormData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function detectFormType(form) {
  const id = (form.id || "").toLowerCase();
  const text = (form.innerText || "").toLowerCase();

  if (id.includes("catch") || text.includes("species")) return "catch";

  if (
    id.includes("report") ||
    text.includes("report") ||
    text.includes("pollution") ||
    text.includes("conservation")
  ) {
    return "report";
  }

  return "signup";
}

function buildPayload(type, data) {
  if (type === "report") {
    return {
      category: clean(data.category || data.type || "Conservation"),
      name: clean(data.name || "Community Member"),
      water: clean(data.water || data.location || data.home_water || ""),
      report: clean(data.report || data.description || data.message || ""),
      gps: clean(data.gps || data.coordinates || "")
    };
  }

  if (type === "catch") {
    return {
      species: clean(data.species || data.fish || ""),
      weight: clean(data.weight || ""),
      location: clean(data.location || data.water || ""),
      notes: clean(data.notes || data.description || "")
    };
  }

  return {
    name: clean(data.name || data.full_name || ""),
    email: clean(data.email || ""),
    home_water: clean(data.home_water || data.water || ""),
    main_interest: clean(data.main_interest || data.interest || "Early Access")
  };
}

function tableFor(type) {
  if (type === "report") return "reports";
  if (type === "catch") return "catches";
  return "waitlist_signups";
}

function successFor(type) {
  if (type === "report") {
    return "Report saved. Thank you for helping protect our waters.";
  }

  if (type === "catch") {
    return "Catch saved.";
  }

  return "You're signed up for BaitLogic early access.";
}

function setButtonLoading(button, loading, type) {
  if (!button) return;

  button.disabled = loading;

  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = "Saving...";
    return;
  }

  button.textContent =
    button.dataset.originalText ||
    (type === "report"
      ? "Submit Report"
      : type === "catch"
      ? "Save Catch"
      : "Get Early Access");
}

function setupForms() {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const type = detectFormType(form);
      const table = tableFor(type);
      const data = getFormData(form);
      const payload = buildPayload(type, data);
      const button = form.querySelector("button[type='submit'], button");

      if (type === "signup" && !payload.email) {
        showMessage(form, "Please enter an email address.", false);
        return;
      }

      try {
        setButtonLoading(button, true, type);
        await supabaseInsert(table, payload);
        showMessage(form, successFor(type), true);
        form.reset();
      } catch (error) {
        showMessage(form, error.message, false);
      } finally {
        setButtonLoading(button, false, type);
      }
    });
  });
}

function fixScrollButtons() {
  document.querySelectorAll("a[href^='#'], button[data-target]").forEach((el) => {
    el.addEventListener("click", (event) => {
      const target =
        el.getAttribute("href")?.replace("#", "") ||
        el.dataset.target ||
        "";

      if (!target) return;

      const section = document.getElementById(target);

      if (section) {
        event.preventDefault();
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupForms();
  fixScrollButtons();
  console.log("BaitLogic connected to Supabase:", SUPABASE_URL);
});