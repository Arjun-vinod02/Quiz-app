document.addEventListener("DOMContentLoaded", () => {
  
  if (!checkAdminAuth()) {
    return; 
  }
  

  const tableBody = document.querySelector("#users-table tbody");
  const saveBtn = document.getElementById("save-user");
  const nameInput = document.getElementById("user-name");
  const emailInput = document.getElementById("user-email");
  const passInput = document.getElementById("user-password");
  const roleSelect = document.getElementById("user-role");
  const formTitle = document.getElementById("form-title");

  let users = JSON.parse(localStorage.getItem("users") || "[]");
  let editingIndex = null;

  function renderUsers() {
    tableBody.innerHTML = "";
    users.forEach((u, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${u.name}</td>
                      <td>${u.email}</td>
                      <td>${u.role}</td>
                      <td>${u.lastActive || "N/A"}</td>
                      <td>
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                      </td>`;
      tableBody.appendChild(tr);

      tr.querySelector(".edit-btn").addEventListener("click", () => editUser(i));
      tr.querySelector(".delete-btn").addEventListener("click", () => deleteUser(i));
    });
  }

  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const pass = passInput.value.trim();
    const role = roleSelect.value;
    if (!name || !email || !pass) { alert("Fill all fields"); return; }

    
    if (editingIndex === null && users.some(u => u.email === email)) {
      alert("Error: A user with this email already exists.");
      return;
    }
   
    if (editingIndex !== null && users.some((u, idx) => idx !== editingIndex && u.email === email)) {
      alert("Error: A user with this email already exists.");
      return;
    }


    if (editingIndex !== null) {
      users[editingIndex] = { ...users[editingIndex], name, email, password: pass, role, lastActive: users[editingIndex].lastActive || new Date().toLocaleString() };
      editingIndex = null;
      formTitle.innerText = "Add New User";
    } else {
      users.push({ name, email, password: pass, role, lastActive: new Date().toLocaleString() });
    }
    localStorage.setItem("users", JSON.stringify(users));
    clearForm();
    renderUsers();
  });

  function editUser(i) {
    const u = users[i];
    nameInput.value = u.name;
    emailInput.value = u.email;
    passInput.value = u.password || "";
    roleSelect.value = u.role || "User";
    editingIndex = i;
    formTitle.innerText = "Edit User";
  }

  function deleteUser(i) {
    if (!confirm("Delete user?")) return;
    users.splice(i,1);
    localStorage.setItem("users", JSON.stringify(users));
    renderUsers();
  }

  function clearForm() {
    nameInput.value = "";
    emailInput.value = "";
    passInput.value = "";
    roleSelect.value = "User";
  }

  renderUsers();
});