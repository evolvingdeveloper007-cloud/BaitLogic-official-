const SUPABASE_URL = "https://gibaaxzltpdizayvicgf.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYmFheHpsdHBkaXpheXZpY2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzAyMzEsImV4cCI6MjA5NDkwNjIzMX0.eJvwEaQ27cu8UZDZMUC-p_WXa9lJrd9DHoaHbSmGG_A";

async function supabaseInsert(table, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
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

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formText = form.innerText.toLowerCase();
      const data = Object.fromEntries(new FormData(form));

      let table = "signups";
      let payload = {
        name: data.name || data.Name || "BaitLogic User",
        email: data.email || data.Email || "",
        water: data.water || data.home_water || data["Home Water"] || "",
        interest: data.interest || data.Interest || "Early Access"
      };

      let message = "You're signed up for BaitLogic early access.";

      if (formText.includes("report") || formText.includes("conservation") || formText.includes("issue")) {
        table = "reports";
        payload = {
          category: data.category || data.type || "Conservation",
          name: data.name || "Community Member",
          water: data.water || data.location || "",
          report: data.report || data.description || data.message || "",
          gps: data.gps || ""
        };
        message = "Your report was saved. Thank you for helping protect our waters.";
      }

      if (formText.includes("catch") || formText.includes("species")) {
        table = "catches";
        payload = {
          species: data.species || "",
          weight: data.weight || "",
          location: data.location || data.water || "",
          notes: data.notes || data.description || ""
        };
        message = "Your catch was logged.";
      }

      try {
        await supabaseInsert(table, payload);
        alert(message);
        form.reset();
      } catch (error) {
        alert(error.message);
      }
    });
  });
});