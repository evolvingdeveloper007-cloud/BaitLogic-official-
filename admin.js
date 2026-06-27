function getItems(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
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
      <p>${item.report || item.description || item.notes || ""}</p>
      <small>${item.createdAt || ""}</small>
    </div>
  `).join("");
}

function loadDashboard() {
  const signups = getItems("baitlogic_signups");
  const reports = getItems("baitlogic_reports");
  const catches = getItems("baitlogic_catches");

  document.getElementById("signups").textContent = signups.length;
  document.getElementById("reports").textContent = reports.length;
  document.getElementById("catches").textContent = catches.length;

  renderList("signupAdminList", signups, "No signups yet.");
  renderList("reportAdminList", reports, "No reports yet.");
  renderList("catchAdminList", catches, "No catches yet.");
}

document.addEventListener("DOMContentLoaded", loadDashboard);