
function safeGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch(e) { return fallback; }
}
function safeSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function escapeHtml(s){
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, function(c){
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
  });
}


function checkAdminAuth() {
  const loggedInUser = safeGet("loggedInUser", null);
  if (!loggedInUser || loggedInUser.role !== "Admin") {
    alert("Access Denied: You must be logged in as an Admin to view this page.");
    window.location.href = "login.html"; 
    return false;
  }
  return true;
}


function getAllQuizzesMerged() {
  const saved = safeGet("quizData", {});
  return { ...quizData, ...saved };
}


function renderCourses() {
  const coursesDiv = document.getElementById("courses");
  if (!coursesDiv) return;

  coursesDiv.innerHTML = "";

  const allQuizzes = getAllQuizzesMerged();

  Object.keys(allQuizzes).forEach(courseName => {
    const card = document.createElement("div");
    card.className = "course-card";

    card.innerHTML = `
      <h2>${escapeHtml(courseName)}</h2>
      <p>Take this quiz to test your knowledge</p>
      <input type="text" class="username" placeholder="Enter your name">
      <button class="start-btn" data-course="${escapeHtml(courseName)}">Start Quiz</button>
      <p class="error hidden">⚠ Please enter your name!</p>
    `;

    coursesDiv.appendChild(card);
  });

  
  coursesDiv.querySelectorAll(".start-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.parentElement;
      const usernameInput = card.querySelector(".username");
      const errorMsg = card.querySelector(".error");
      const username = (usernameInput && usernameInput.value || "").trim();
      const course = btn.dataset.course;

      if (!username) {
        errorMsg?.classList.remove("hidden");
        return;
      }
      errorMsg?.classList.add("hidden");

      localStorage.setItem("quizUser", username);
      localStorage.setItem("quizCourse", course);

      let recent = safeGet("recentQuizzes", []);
      recent.unshift({ course, username, date: new Date().toLocaleString() });
      recent = recent.slice(0, 3);
      safeSet("recentQuizzes", recent);

      // add to users list if not present, or update last active
      let users = safeGet("users", []);
      let existingUser = users.find(u => u.name === username);
      if (existingUser) {
        existingUser.lastActive = new Date().toLocaleString();
      } else {
        users.push({ name: username, email: "", password: "", role: "User", lastActive: new Date().toLocaleString() });
      }
      safeSet("users", users);

      window.location.href = "quiz.html";
    });
  });
}


document.addEventListener("DOMContentLoaded", () => {

  renderCourses();

  const recentData = safeGet("recentQuizzes", []);
  if (recentData.length > 0 && document.getElementById("recent-quizzes")) {
    document.getElementById("recent").classList.remove("hidden");
    const recentDiv = document.getElementById("recent-quizzes");
    recentDiv.innerHTML = "";
    recentData.forEach(q => {
      const card = document.createElement("div");
      card.className = "course-card";
      card.innerHTML = `<h3>${escapeHtml(q.course)}</h3>
                        <p>User: ${escapeHtml(q.username)}</p>
                        <p>Taken: ${escapeHtml(q.date)}</p>
                        <button class="quick-start">Quick Start</button>`;
      card.querySelector(".quick-start").addEventListener("click", () => {
        localStorage.setItem("quizUser", q.username);
        localStorage.setItem("quizCourse", q.course);
        window.location.href = "quiz.html";
      });
      recentDiv.appendChild(card);
    });
  }

  
  const darkToggle = document.getElementById("dark-mode-toggle");
  if (darkToggle) {
    const mode = localStorage.getItem("darkMode");
    if (mode === "true") { document.body.classList.add("dark"); darkToggle.checked = true; }
    darkToggle.addEventListener("change", () => {
      if (darkToggle.checked) { document.body.classList.add("dark"); localStorage.setItem("darkMode", "true"); }
      else { document.body.classList.remove("dark"); localStorage.setItem("darkMode", "false"); }
    });
  }

  
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("quizUser");
      localStorage.removeItem("quizCourse");
      localStorage.removeItem("quizScore");
      localStorage.removeItem("quizAnswers");
      localStorage.removeItem("loggedInUser"); 
      alert("Logged out");
      window.location.href = "index.html";
    });
  }
});


let currentQ = 0;
let selectedAnswers = [];
let quizTimer = null;
let timeLeft = 60;
let questions = [];

document.addEventListener("DOMContentLoaded", () => {

  if (!document.getElementById("quiz-container")) return;

  currentQ = 0;
  selectedAnswers = [];
  clearInterval(quizTimer);

  const user = localStorage.getItem("quizUser") || "Guest";
  const course = localStorage.getItem("quizCourse") || "";

  document.getElementById("user-name").innerText = user;
  document.getElementById("course-name").innerText = course;

  const allQuizzes = getAllQuizzesMerged();
  questions = allQuizzes[course] || [];

  if (!questions.length) {
    alert("No questions found for this course. Contact admin.");
    window.location.href = "index.html";
    return;
  }

  timeLeft = 60 * Math.max(1, Math.ceil(questions.length / 2));
  startTimer();

  document.getElementById("next-btn").addEventListener("click", () => { nextQuestion(); });
  document.getElementById("back-btn").addEventListener("click", () => { prevQuestion(); });

  renderQuestion();
  updateProgress();
});

function renderQuestion() {
  const q = questions[currentQ];
  document.getElementById("question-text").innerText = `Q${currentQ + 1}. ${q.question}`;
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.type = "button";
    if (selectedAnswers[currentQ] === opt) {
      btn.style.background = "#4CAF50";
      btn.style.color = "#fff";
    }
    btn.addEventListener("click", () => {
      selectedAnswers[currentQ] = opt;
      optionsDiv.querySelectorAll("button").forEach(b => { b.style.background = "#eee"; b.style.color = "#333"; });
      btn.style.background = "#4CAF50"; btn.style.color = "#fff";
    });
    optionsDiv.appendChild(btn);
  });

  document.getElementById("back-btn").classList.toggle("hidden", currentQ === 0);
}

function nextQuestion() {
  if (currentQ < questions.length - 1) {
    currentQ++;
    renderQuestion();
    updateProgress();
  } else {
    finishQuiz();
  }
}

function prevQuestion() {
  if (currentQ > 0) {
    currentQ--;
    renderQuestion();
    updateProgress();
  }
}

function updateProgress() {
  const pct = ((currentQ + 1) / questions.length) * 100;
  document.getElementById("progress-bar").style.width = pct + "%";
}

function startTimer() {
  clearInterval(quizTimer);
  document.getElementById("timer").innerText = `Time left: ${timeLeft}s`;
  quizTimer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = `Time left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(quizTimer);
      finishQuiz();
    }
  }, 1000);
}

function finishQuiz() {
  clearInterval(quizTimer);
  const score = questions.reduce((acc, q, idx) => acc + ((selectedAnswers[idx] === q.answer) ? 1 : 0), 0);
  localStorage.setItem("quizScore", String(score));
  localStorage.setItem("quizAnswers", JSON.stringify(selectedAnswers || []));
  saveToLeaderboard(localStorage.getItem("quizUser") || "Guest", localStorage.getItem("quizCourse"), score);
  window.location.href = "result.html";
}


function saveToLeaderboard(user, course, score) {
  let allBoards = safeGet("leaderboard", {});
  if (!allBoards[course]) allBoards[course] = [];
  allBoards[course].push({ user, score, date: new Date().toLocaleString() });
  allBoards[course].sort((a, b) => b.score - a.score);
  allBoards[course] = allBoards[course].slice(0, 50);
  safeSet("leaderboard", allBoards);
}


document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("score")) return;

  const user = localStorage.getItem("quizUser") || "Guest";
  const course = localStorage.getItem("quizCourse") || "";
  const score = parseInt(localStorage.getItem("quizScore") || "0", 10);
  const answers = safeGet("quizAnswers", []);

  const allQuizzes = getAllQuizzesMerged();
  const questions = allQuizzes[course] || [];
  const total = questions.length;

  document.getElementById("user-name").innerText = user;
  document.getElementById("course-name").innerText = course;
  document.getElementById("score").innerText = `Score: ${score} / ${total}`;
  document.getElementById("percentage").innerText = `Percentage: ${total ? ((score/total)*100).toFixed(1) : 0}%`;

  const breakdownDiv = document.getElementById("breakdown");
  breakdownDiv.innerHTML = "";
  questions.forEach((q, i) => {
    const userAns = answers[i] ?? "Not answered";
    const correct = q.answer;
    const isCorrect = userAns === correct;
    const p = document.createElement("div");
    p.style.marginBottom = "0.6rem";
    p.innerHTML = `<strong>Q${i+1}:</strong> ${escapeHtml(q.question)}<br>
                   Your answer: <span style="color:${isCorrect ? 'green' : 'red'}">${escapeHtml(userAns)}</span><br>
                   Correct answer: ${escapeHtml(correct)}`;
    breakdownDiv.appendChild(p);
  });

  const allBoards = safeGet("leaderboard", {});
  const board = allBoards[course] || [];
  if (board.length) {
    document.getElementById("leaderboard-section").classList.remove("hidden");
    const table = document.getElementById("leaderboard");
    table.querySelectorAll("tr.app-row").forEach(r => r.remove());
    board.forEach((entry, i) => {
      const tr = document.createElement("tr");
      tr.className = "app-row";
      tr.innerHTML = `<td>${i+1}</td><td>${escapeHtml(entry.user)}</td><td>${entry.score}</td><td>${escapeHtml(entry.date)}</td>`;
      if (entry.user === user && entry.score === score) tr.style.background = "#dff0d8";
      table.appendChild(tr);
    });
  }
});

function retakeQuiz() { window.location.href = "quiz.html"; }


document.addEventListener("DOMContentLoaded", () => {
  
  ['dark-mode-toggle', 'dark-mode-toggle-quiz', 'dark-mode-toggle-result'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (localStorage.getItem("darkMode") === "true") { document.body.classList.add("dark"); el.checked = true; }
    el.addEventListener("change", () => {
      if (el.checked) { document.body.classList.add("dark"); localStorage.setItem("darkMode", "true"); }
      else { document.body.classList.remove("dark"); localStorage.setItem("darkMode", "false"); }
    });
  });

  
  ['logout-btn', 'logout-btn-quiz', 'logout-btn-result'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", () => {
      localStorage.removeItem("quizUser");
      localStorage.removeItem("quizCourse");
      localStorage.removeItem("quizScore");
      localStorage.removeItem("quizAnswers");
      localStorage.removeItem("loggedInUser"); 
      alert("Logged out");
      window.location.href = "index.html";
    });
  });
});