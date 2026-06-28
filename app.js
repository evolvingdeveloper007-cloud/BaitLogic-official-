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
    console.error("Supabase insert error:", data);
    throw new Error(data?.message || "Could not save. Please try again.");
  }

  return data;
}

function clean(value) {
  return String(value || "").trim();
}

function getFormData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function detectFormType(form) {
  const text = form.innerText.toLowerCase();

  if (
    text.includes("catch") ||
    text.includes("species") ||
    form.id?.toLowerCase().includes("catch")
  ) {
    return "catch";
  }

  if (
    text.includes("report") ||
    text.includes("conservation") ||
    text.includes("pollution") ||
    text.includes("issue") ||
    form.id?.toLowerCase().includes("report")
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
      water: clean(data.water || data.location || data.home_water),
      report: clean(data.report || data.description || data.message),
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

function getTableName(type) {
  if (type === "report") return "reports";
  if (type === "catch") return "catches";
  return "waitlist_signups";
}

function getSuccessMessage(type) {
  if (type === "report") {
    return "Your conservation report was saved. Thank you for helping protect our waters.";
  }

  if (type === "catch") {
    return "Your catch was logged.";
  }

  return "You're signed up for BaitLogic early access.";
}

function showMessage(form, message, success = true) {
  let box =
    form.querySelector(".form-message") ||
    document.getElementById("formMessage") ||
    document.getElementById("signupMessage");

  if (!box) {
    alert(message);
    return;
  }

  box.textContent = message;
  box.style.color = success ? "#5eff7a" : "#ff6b6b";
}

function fixAnchorLinks() {
  const sections = new Set(
    [...document.querySelectorAll("[id]")].map((el) => el.id)
  );

  document.querySelectorAll("a[href^='#']").forEach((link) => {
    const href = link.getAttribute("href");
    const id = href.replace("#", "");

    if (!id || sections.has(id)) return;

    const text = link.textContent.toLowerCase();

    if (text.includes("join") || text.includes("early")) {
      link.setAttribute("href", "#join-crew");
    } else if (text.includes("report") || text.includes("protect")) {
      link.setAttribute("href", "#local-reports");
    } else if (text.includes("weather") || text.includes("condition")) {
      link.setAttribute("href", "#weather-water");
    } else if (text.includes("catch")) {
      link.setAttribute("href", "#catch-log");
    } else if (text.includes("shop") || text.includes("business")) {
      link.setAttribute("href", "#bait-shops");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fixAnchorLinks();

  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const type = detectFormType(form);
      const table = getTableName(type);
      const data = getFormData(form);
      const payload = buildPayload(type, data);

      try {
        const submitButton = form.querySelector("button[type='submit']");
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Saving...";
        }

        await supabaseInsert(table, payload);

        showMessage(form, getSuccessMessage(type), true);
        form.reset();

        if (type === "report" || type === "catch") {
          setTimeout(() => window.location.reload(), 800);
        }
      } catch (error) {
        showMessage(form, error.message, false);
      } finally {
        const submitButton = form.querySelector("button[type='submit']");
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent =
            type === "report"
              ? "Submit Report"
              : type === "catch"
              ? "Save Catch"
              : "Get Early Access";
        }
      }
    });
  });

  console.log("BaitLogic Supabase backend connected");
});