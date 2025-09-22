document.addEventListener("DOMContentLoaded", () => {
  
  if (!checkAdminAuth()) {
    return;
  }


  const courseSelect = document.getElementById("course-select");
  const tableBody = document.querySelector("#leaderboard-table tbody");

  const savedQuizzes = JSON.parse(localStorage.getItem("quizData") || "{}");
  const allQuizzes = { ...(typeof quizData !== "undefined" ? quizData : {}), ...savedQuizzes };


  Object.keys(allQuizzes).forEach((course, i) => {
    const opt = document.createElement("option");
    opt.value = course;
    opt.textContent = course;
    courseSelect.appendChild(opt);
    if (i === 0) courseSelect.value = course; 
  });

  function loadLeaderboard() {
    const course = courseSelect.value;
    const allBoards = JSON.parse(localStorage.getItem("leaderboard") || "{}");
    const leaderboard = allBoards[course] || [];

    tableBody.innerHTML = "";

if (leaderboard.length === 0) {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td colspan="5">⚠ No scores yet for this course</td>`;
  tableBody.appendChild(tr);
  return;
}

leaderboard.forEach((entry, i) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${i + 1}</td>
    <td><input type="text" value="${entry.user}"></td>
    <td><input type="number" value="${entry.score}"></td>
    <td><input type="text" value="${entry.date}"></td>
    <td>
      <button class="save-btn">Save</button>
      <button class="delete-btn">Delete</button>
    </td>
  `;
  tableBody.appendChild(tr);

 
      tr.querySelector(".save-btn").addEventListener("click", () => {
        const inputs = tr.querySelectorAll("input");
        leaderboard[i] = {
          user: inputs[0].value,
          score: parseInt(inputs[1].value),
          date: inputs[2].value
        };
        saveLeaderboard(course, leaderboard);
        loadLeaderboard();
      });

    
      tr.querySelector(".delete-btn").addEventListener("click", () => {
        leaderboard.splice(i, 1);
        saveLeaderboard(course, leaderboard);
        loadLeaderboard();
      });
    });
  }

  courseSelect.addEventListener("change", loadLeaderboard);

  loadLeaderboard();

  document.getElementById("add-score").addEventListener("click", () => {
    const course = courseSelect.value;
    const user = document.getElementById("manual-user").value.trim();
    const score = parseInt(document.getElementById("manual-score").value);
    const date = document.getElementById("manual-date").value || new Date().toLocaleString();

    if (!user || isNaN(score)) return alert("Enter valid data!");

    const allBoards = JSON.parse(localStorage.getItem("leaderboard") || "{}");
    const leaderboard = allBoards[course] || [];

    leaderboard.push({ user, score, date });
    leaderboard.sort((a, b) => b.score - a.score);

    saveLeaderboard(course, leaderboard);
    loadLeaderboard();

    document.getElementById("manual-user").value = "";
    document.getElementById("manual-score").value = "";
    document.getElementById("manual-date").value = "";
  });

  function saveLeaderboard(course, leaderboard) {
    const allBoards = JSON.parse(localStorage.getItem("leaderboard") || "{}");
    allBoards[course] = leaderboard;
    localStorage.setItem("leaderboard", JSON.stringify(allBoards));
  }
});