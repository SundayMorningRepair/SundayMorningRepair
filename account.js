// ======================================================
// account.js
// Handles:
// - auth check for account page
// - loading user profile from Firestore
// - saving profile updates to Firestore
// - phone formatting/display
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  // ======================================================
  // ELEMENT REFERENCES
  // ======================================================
  const welcomeEl = document.getElementById("accountWelcome");
  const form = document.getElementById("accountForm");
  const messageEl = document.getElementById("accountMessage");
  const phoneInput = document.getElementById("accountPhone");

  // ======================================================
  // FIREBASE SAFETY CHECK
  // ======================================================
  if (typeof auth === "undefined" || typeof db === "undefined") {
    console.error("Firebase auth/db not found. Make sure firebase.js loads before account.js");
    setMessage("Account services failed to load.");
    return;
  }

  // ======================================================
  // PHONE INPUT AUTO-FORMAT
  // Formats as: 123-456-7890 while typing
  // ======================================================
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");

      if (value.length > 10) {
        value = value.slice(0, 10);
      }

      if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{1,3})/, "$1-$2");
      }

      e.target.value = value;
    });
  }

  // ======================================================
  // AUTH STATE WATCHER
  // Redirects to login if user is not signed in
  // ======================================================
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", "account.html");
      window.location.replace("login.html");
      return;
    }

    if (welcomeEl) {
      welcomeEl.textContent = `Welcome, ${user.email || "Customer"}`;
    }

    await loadUserProfile(user);
  });

  // ======================================================
  // SAVE FORM CHANGES
  // ======================================================
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user = auth.currentUser;
      if (!user) {
        setMessage("You must be logged in.");
        return;
      }

      setMessage("Saving changes...");

      const firstName = getValue("accountFirstName");
      const lastName = getValue("accountLastName");
      const phone = getValue("accountPhone");
      const address1 = getValue("accountAddress1");
      const address2 = getValue("accountAddress2");
      const city = getValue("accountCity");
      const state = getValue("accountState");
      const zip = getValue("accountZip");
      const contactPreference = getSelectValue("accountContactPreference");

      const cleanedPhone = phone.replace(/\D/g, "");

      const profileData = {
        uid: user.uid,
        email: user.email || "",
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        phone: cleanedPhone,
        address1,
        address2,
        city,
        state,
        zip,
        contactPreference,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
        await db.collection("users").doc(user.uid).set(profileData, { merge: true });
        setMessage("Account updated successfully.");
      } catch (error) {
        console.error("Error saving account:", error);
        setMessage("Failed to save account changes: " + error.message);
      }
    });
  }

  // ======================================================
  // LOAD USER PROFILE FROM FIRESTORE
  // ======================================================
  async function loadUserProfile(user) {
    try {
      const docRef = db.collection("users").doc(user.uid);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const data = docSnap.data();

        setValue("accountFirstName", data.firstName || "");
        setValue("accountLastName", data.lastName || "");
        setValue("accountEmail", data.email || user.email || "");
        setValue("accountPhone", formatPhone(data.phone || ""));
        setValue("accountAddress1", data.address1 || "");
        setValue("accountAddress2", data.address2 || "");
        setValue("accountCity", data.city || "");
        setValue("accountState", data.state || "");
        setValue("accountZip", data.zip || "");
        setSelectValue("accountContactPreference", data.contactPreference || "email");

        if (welcomeEl) {
          const displayName =
            data.firstName && data.firstName.trim()
              ? data.firstName
              : (user.email || "Customer");
          welcomeEl.textContent = `Welcome, ${displayName}`;
        }
      } else {
        // No Firestore profile yet — prefill what we can
        setValue("accountEmail", user.email || "");

        // Create a starter doc so future saves are clean
        await db.collection("users").doc(user.uid).set({
          uid: user.uid,
          email: user.email || "",
          firstName: "",
          lastName: "",
          fullName: "",
          phone: "",
          address1: "",
          address2: "",
          city: "",
          state: "",
          zip: "",
          contactPreference: "email",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error loading account:", error);
      setMessage("Failed to load account details: " + error.message);
    }
  }

  // ======================================================
  // PHONE FORMATTER
  // Converts 1234567890 -> 123-456-7890
  // ======================================================
  function formatPhone(phone) {
    if (!phone) return "";

    const cleaned = phone.toString().replace(/\D/g, "");

    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }

    if (cleaned.length > 6) {
      return cleaned.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
    }

    if (cleaned.length > 3) {
      return cleaned.replace(/(\d{3})(\d+)/, "$1-$2");
    }

    return cleaned;
  }

  // ======================================================
  // HELPER FUNCTIONS
  // ======================================================
  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setSelectValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function getSelectValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  function setMessage(msg) {
    if (messageEl) {
      messageEl.textContent = msg;
    }
  }
});