document.addEventListener("DOMContentLoaded", () => {
  const loginEmailInput = document.getElementById("login-email");
  const loginPasswordInput = document.getElementById("login-password");
  const loginError = document.getElementById("login-error");
  const loginBtn = document.getElementById("login-btn");

  
  let users = safeGet("users", []);
  if (!users.some(u => u.email === "admin@123.com" && u.role === "Admin")) {
    users.push({
      name: "Admin User",
      email: "admin@123.com",
      password: "admin", 
      role: "Admin",
      lastActive: new Date().toLocaleString()
    });
    safeSet("users", users);
  }

  loginBtn.addEventListener("click", () => {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();

    const user = users.find(u => u.email === email && u.password === password);

    if (user && user.role === "Admin") {
      safeSet("loggedInUser", { name: user.name, email: user.email, role: user.role });
      loginError.classList.add("hidden");
      window.location.href = "admin.html";
    } else {
      loginError.classList.remove("hidden");
    }
  });

  
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