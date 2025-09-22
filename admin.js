function escapeHtml(s){
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, function(c){
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
  });
}

document.addEventListener("DOMContentLoaded", () => {
  
  if (!checkAdminAuth()) {
    return;
  }
  

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "{}");
  const saved = JSON.parse(localStorage.getItem("quizData") || "{}");
  const allQuizzes = { ...(typeof quizData !== "undefined" ? quizData : {}), ...saved };

  
  let attempts = 0;
  Object.values(leaderboard).forEach(arr => { if (Array.isArray(arr)) attempts += arr.length; });

  document.getElementById("total-users").innerText = users.length;
  document.getElementById("total-quizzes").innerText = Object.keys(allQuizzes).length;
  document.getElementById("total-attempts").innerText = attempts;

  
  const recent = JSON.parse(localStorage.getItem("recentQuizzes") || "[]");
  const adminRecent = document.getElementById("admin-recent");
  if (adminRecent) {
    adminRecent.innerHTML = "";
    recent.forEach(r => {
      const div = document.createElement("div");
      div.innerHTML = `<strong>${r.course}</strong> by ${r.username} (${r.date})`;
      adminRecent.appendChild(div);
    });
  }

   const darkToggle = document.getElementById("dark-mode-toggle-login");
  if (darkToggle) {
    const mode = localStorage.getItem("darkMode");
    if (mode === "true") { document.body.classList.add("dark"); darkToggle.checked = true; }
    darkToggle.addEventListener("change", () => {
      if (darkToggle.checked) { document.body.classList.add("dark"); localStorage.setItem("darkMode", "true"); }
      else { document.body.classList.remove("dark"); localStorage.setItem("darkMode", "false"); }
    });
  }


});