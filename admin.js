const SUPABASE_URL = "https://gibaaxzltpdizayvicgf.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYmFheHpsdHBkaXpheXZpY2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzAyMzEsImV4cCI6MjA5NDkwNjIzMX0.eJvwEaQ27cu8UZDZMUC-p_WXa9lJrd9DHoaHbSmGG_A";

async function supabaseSelect(table) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Could not load ${table}`);
  }

  return response.json();
}

function renderList(id, items, emptyText) {
  const box = document.getElementById(id);
  if (!box) return;

  if (!items.length) {
    box.innerHTML = `<p>${emptyText}</p>`;
    return;
  }

  box.innerHTML = items.map(item => `
    <div class="stat">
      <strong>${item.name || item.species || item.category || "Entry"}</strong>
      <p>${item.email || item.water || item.location || ""}</p>
      <p>${item.report || item.notes || item.interest || ""}</p>
      <small>${new Date(item.created_at).toLocaleString()}</small>
    </div>
  `).join("");
}

async function loadDashboard() {
  try {
    const [signups, reports, catches] = await Promise.all([
      supabaseSelect("signups"),
      supabaseSelect("reports"),
      supabaseSelect("catches")
    ]);

    document.getElementById("signups").textContent = signups.length;
    document.getElementById("reports").textContent = reports.length;
    document.getElementById("catches").textContent = catches.length;

    renderList("signupAdminList", signups, "No signups yet.");
    renderList("reportAdminList", reports, "No reports yet.");
    renderList("catchAdminList", catches, "No catches yet.");
  } catch (error) {
    alert(error.message);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);