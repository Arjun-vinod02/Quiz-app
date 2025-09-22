
(function(){
  
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


  document.addEventListener("DOMContentLoaded", () => {
   
    if (!checkAdminAuth()) { 
      return; 
    }
   

    const quizSelect = document.getElementById("quiz-select");
    const questionList = document.getElementById("question-list");
    const saveBtn = document.getElementById("save-question");
    const saveQuizBtn = document.getElementById("save-quiz");
    const newQuizBtn = document.getElementById("new-quiz");

    
    let savedQuizzes = safeGet("quizData", {});
    const defaults = (typeof quizData !== "undefined") ? quizData : {};
    let allQuizzes = { ...defaults, ...savedQuizzes };

    let currentQuiz = Object.keys(allQuizzes)[0] || null;
    let editingIndex = null;

    
    function refreshQuizSelect() {
      quizSelect.innerHTML = "";
      const names = Object.keys(allQuizzes);
      if (!names.length) {
        quizSelect.innerHTML = "<option>-- No quizzes --</option>";
        return;
      }
      names.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        quizSelect.appendChild(opt);
      });
      if (!currentQuiz || !allQuizzes[currentQuiz]) {
        currentQuiz = names[0];
      }
      quizSelect.value = currentQuiz;
    }

  
    function renderQuestions() {
      questionList.innerHTML = "";
      if (!currentQuiz) return;
      const qs = allQuizzes[currentQuiz] || [];
      if (!qs.length) {
        questionList.innerHTML = "<li><em>No questions yet</em></li>";
        return;
      }

      qs.forEach((q, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${q.question}</span> 
  <span class="options">Options: ${q.options.join(', ')}</span>
  <span class="answer">Answer: ${q.answer}</span>
  <div>
    <button class="edit-btn">Edit</button>
    <button class="delete-btn">Delete</button>
  </div>`;
        questionList.appendChild(li);

        
        li.querySelector(".edit-btn").addEventListener("click", () => {
          document.getElementById("q-text").value = q.question;
          document.getElementById("q-options").value = q.options.join(", ");
          document.getElementById("q-answer").value = q.answer;
          editingIndex = i;
        });

        
        li.querySelector(".delete-btn").addEventListener("click", () => {
          if (!confirm("Delete this question?")) return;

          if (!savedQuizzes[currentQuiz]) {
            savedQuizzes[currentQuiz] = [...qs];
          }
          savedQuizzes[currentQuiz].splice(i, 1);
          allQuizzes[currentQuiz] = savedQuizzes[currentQuiz];
          safeSet("quizData", savedQuizzes);
          renderQuestions();
        });
      });
    }

    
    saveBtn.addEventListener("click", () => {
      const qText = document.getElementById("q-text").value.trim();
      const qOptions = document.getElementById("q-options").value.split(",").map(s => s.trim()).filter(Boolean);
      const qAnswer = document.getElementById("q-answer").value.trim();

      if (!qText || qOptions.length < 2 || !qAnswer) {
        alert("Fill all fields (min 2 options).");
        return;
      }
      if (!currentQuiz) {
        alert("Select or create a quiz first.");
        return;
      }

      if (!savedQuizzes[currentQuiz]) {
        savedQuizzes[currentQuiz] = [...(defaults[currentQuiz] || [])];
      }

      if (editingIndex !== null) {
        savedQuizzes[currentQuiz][editingIndex] = { question: qText, options: qOptions, answer: qAnswer };
        editingIndex = null;
      } else {
        savedQuizzes[currentQuiz].push({ question: qText, options: qOptions, answer: qAnswer });
      }

      allQuizzes[currentQuiz] = savedQuizzes[currentQuiz];
      safeSet("quizData", savedQuizzes);

      renderQuestions();
      document.getElementById("q-text").value = "";
      document.getElementById("q-options").value = "";
      document.getElementById("q-answer").value = "";
    });

   
    saveQuizBtn.addEventListener("click", () => {
      safeSet("quizData", savedQuizzes);
      allQuizzes = { ...defaults, ...savedQuizzes };
      refreshQuizSelect();
      renderQuestions();
      alert("Quiz saved!");
    });

    
    quizSelect.addEventListener("change", () => {
      currentQuiz = quizSelect.value;
      editingIndex = null;
      renderQuestions();
    });

 
    newQuizBtn.addEventListener("click", () => {
      let name = prompt("Enter new quiz name:").trim();
      if (!name) return;
      if (allQuizzes[name]) {
        alert("Quiz already exists!");
        return;
      }
      savedQuizzes[name] = [];
      allQuizzes = { ...defaults, ...savedQuizzes };
      currentQuiz = name;
      safeSet("quizData", savedQuizzes);
      refreshQuizSelect();
      renderQuestions();
    });

    
    refreshQuizSelect();
    renderQuestions();
  });
})();