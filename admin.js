const SUPABASE_URL = "https://khhishscjirjxhsulniq.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_d-MPFEIo3g9ORJXFzHiKtA_sIBHHD_7";

async function supabaseSelect(table) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    console.error("Supabase select error:", data);
    throw new Error(data?.message || `Could not load ${table}`);
  }

  return data;
}

function $(id) {
  return document.getElementById(id);
}

function safe(value) {
  return String(value || "");
}

function renderList(id, items, emptyText, type) {
  const box = $(id);
  if (!box) return;

  if (!items.length) {
    box.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }

  box.innerHTML = items
    .map((item) => {
      let title = item.name || item.species || item.category || "Entry";
      let line1 = "";
      let line2 = "";

      if (type === "signup") {
        line1 = item.email || "";
        line2 = `${item.home_water || "No home water"} · ${
          item.main_interest || "No interest listed"
        }`;
      }

      if (type === "report") {
        line1 = item.water || "No water listed";
        line2 = item.report || "";
        title = `${item.category || "Report"} · ${item.name || "Community Member"}`;
      }

      if (type === "catch") {
        line1 = item.location || "No location listed";
        line2 = `${item.weight || "No weight"} · ${item.notes || "No notes"}`;
      }

      return `
        <article class="report-card">
          <div class="report-avatar">${safe(title).charAt(0).toUpperCase()}</div>
          <div>
            <div class="report-meta">
              <strong>${safe(title)}</strong>
              <span>${new Date(item.created_at).toLocaleString()}</span>
            </div>
            <p>${safe(line1)}</p>
            <div class="subtle">${safe(line2)}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadDashboard() {
  try {
    const [signups, reports, catches] = await Promise.all([
      supabaseSelect("waitlist_signups"),
      supabaseSelect("reports"),
      supabaseSelect("catches")
    ]);

    if ($("signups")) $("signups").textContent = signups.length;
    if ($("reports")) $("reports").textContent = reports.length;
    if ($("catches")) $("catches").textContent = catches.length;

    if ($("statSignups")) $("statSignups").textContent = signups.length;
    if ($("statReports")) $("statReports").textContent = reports.length;
    if ($("statCatches")) $("statCatches").textContent = catches.length;

    renderList("signupAdminList", signups, "No signups yet.", "signup");
    renderList("reportAdminList", reports, "No reports yet.", "report");
    renderList("catchAdminList", catches, "No catches yet.", "catch");

    const status = $("adminStatus");
    if (status) status.textContent = "Dashboard loaded.";
  } catch (error) {
    const status = $("adminStatus");
    if (status) status.textContent = error.message;
    else alert(error.message);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);