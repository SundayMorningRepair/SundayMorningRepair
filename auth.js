const ADMIN_EMAIL = "andrewpoe04@gmail.com";

function initAuthUI() {
  const body = document.body;
  const userEmail = document.getElementById("userEmail");
  const accountLink = document.getElementById("accountLink");

  const isProtectedPage = body.dataset.protected === "true";
  const isAdminPage = body.dataset.adminOnly === "true";
  const loginPage = body.dataset.loginPage || "login.html";

  auth.onAuthStateChanged((user) => {
    if (user) {
      const isAdmin =
        user.email &&
        user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (userEmail) {
        userEmail.innerText = user.email;
      }

      if (accountLink) {
        accountLink.href = "account.html";
        accountLink.onclick = null;
      }

      showLoggedInUI();
      showAdminUI(isAdmin);

      if (isAdminPage && !isAdmin) {
        window.location.replace("index.html");
      }
    } else {
      if (userEmail) {
        userEmail.innerText = "";
      }

      if (accountLink) {
        accountLink.href = "login.html";
        accountLink.onclick = function () {
          sessionStorage.setItem("redirectAfterLogin", "account.html");
        };
      }

      showLoggedOutUI();
      showAdminUI(false);

      if (isProtectedPage || isAdminPage) {
        sessionStorage.setItem("redirectAfterLogin", window.location.href);
        window.location.replace(loginPage);
      }
    }
  });
}

function logout() {
  auth.signOut()
    .then(() => {
      const userEmail = document.getElementById("userEmail");
      if (userEmail) userEmail.innerText = "";

      showLoggedOutUI();
      showAdminUI(false);
      location.reload();
    })
    .catch((error) => {
      console.error("Logout error:", error.message);
      alert("Error logging out: " + error.message);
    });
}

function showLoggedInUI() {
  document.querySelectorAll(".logged-in-only").forEach((el) => {
    el.style.display = "inline-block";
  });

  document.querySelectorAll(".logged-out-only").forEach((el) => {
    el.style.display = "none";
  });
}

function showLoggedOutUI() {
  document.querySelectorAll(".logged-in-only").forEach((el) => {
    el.style.display = "none";
  });

  document.querySelectorAll(".logged-out-only").forEach((el) => {
    el.style.display = "inline-block";
  });
}

function showAdminUI(isAdmin) {
  document.querySelectorAll(".admin-only").forEach((el) => {
    el.style.display = isAdmin ? "inline-block" : "none";
  });
}

function saveRedirect() {
  sessionStorage.setItem("redirectAfterLogin", window.location.href);
}

initAuthUI();