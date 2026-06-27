const $ = (id) => document.getElementById(id);

function saveItem(key, item) {
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.unshift({
    ...item,
    id: Date.now(),
    createdAt: new Date().toLocaleString()
  });
  localStorage.setItem(key, JSON.stringify(existing));
}

function getItems(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = $("signupForm");
  const reportForm = $("reportForm");
  const catchForm = $("catchForm");

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(signupForm));
      saveItem("baitlogic_signups", data);
      alert("You are on the BaitLogic early access list.");
      signupForm.reset();
    });
  }

  if (reportForm) {
    reportForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(reportForm));
      saveItem("baitlogic_reports", data);
      alert("Report saved. Thank you for helping protect our waters.");
      reportForm.reset();
      location.reload();
    });
  }

  if (catchForm) {
    catchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(catchForm));
      saveItem("baitlogic_catches", data);
      alert("Catch logged.");
      catchForm.reset();
      location.reload();
    });
  }

  const reports = getItems("baitlogic_reports");
  const reportArea = $("reportList") || $("reports") || document.querySelector("[data-reports]");

  if (reportArea && reports.length) {
    reportArea.innerHTML = reports.map(r => `
      <div class="card">
        <h3>${r.category || "Community Report"}</h3>
        <p><strong>Water:</strong> ${r.water || r.location || "Not listed"}</p>
        <p>${r.report || r.description || ""}</p>
        <small>${r.createdAt}</small>
      </div>
    `).join("");
  }

  const catches = getItems("baitlogic_catches");
  const catchArea = $("catchList") || $("catches") || document.querySelector("[data-catches]");

  if (catchArea && catches.length) {
    catchArea.innerHTML = catches.map(c => `
      <div class="card">
        <h3>${c.species || "Catch"}</h3>
        <p><strong>Location:</strong> ${c.location || "Not listed"}</p>
        <p>${c.notes || ""}</p>
        <small>${c.createdAt}</small>
      </div>
    `).join("");
  }
});