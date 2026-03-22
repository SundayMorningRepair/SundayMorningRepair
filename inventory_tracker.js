const INVENTORY_API_URL = "https://script.google.com/macros/s/AKfycbxD9epsAq1rjeNVykY8RRb0xSzDnQQm_NULbGuFsUG8csCxp5-96Cy90l-wjAnD6_2J/exec";

let inventoryRows = [];

async function initInventoryTracker() {
  await loadInventoryRows();
}

async function loadInventoryRows() {
  const tbody = document.getElementById("inventory-table-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="9">Loading inventory...</td></tr>`;

  try {
    const res = await fetch(`${INVENTORY_API_URL}?action=getInventory`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to load inventory.");
    }

    inventoryRows = data.rows || [];
    drawInventoryTable(inventoryRows);
    updateInventorySummaryCards(inventoryRows);
  } catch (err) {
    console.error("Inventory load error:", err);
    tbody.innerHTML = `<tr><td colspan="9">Failed to load inventory.</td></tr>`;
  }
}

function updateInventorySummaryCards(rows) {
  let totals = {
    modchips: 0,
    sdcards: 0,
    screens: 0,
    shells: 0,
    batteries: 0,
    joyconparts: 0
  };

  rows.forEach(row => {
    const stock = parseInt(row.stock || 0, 10) || 0;
    const type = (row.type || "").trim();

    if (type === "Modchips") totals.modchips += stock;
    if (type === "SD Cards") totals.sdcards += stock;
    if (type === "Batteries") totals.batteries += stock;
    if (type === "Joy-Con Parts") totals.joyconparts += stock;

    if (["V1/V2 Screens", "Lite Screens", "OLED Screens"].includes(type)) {
      totals.screens += stock;
    }

    if (["Console Shells", "JoyCon Shells", "Controller Shells"].includes(type)) {
      totals.shells += stock;
    }
  });

  document.getElementById("inv-modchips").textContent = totals.modchips;
  document.getElementById("inv-sdcards").textContent = totals.sdcards;
  document.getElementById("inv-screens").textContent = totals.screens;
  document.getElementById("inv-shells").textContent = totals.shells;
  document.getElementById("inv-batteries").textContent = totals.batteries;
  document.getElementById("inv-joyconparts").textContent = totals.joyconparts;
}

function drawInventoryTable(rows) {
  const tbody = document.getElementById("inventory-table-body");
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9">No inventory items found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((row, index) => {
    const stock = parseInt(row.stock || 0, 10) || 0;
    const stockClass = stock === 0 ? "stock-zero" : stock <= 3 ? "stock-low" : "stock-ok";

    return `
      <tr>
        <td>${escapeHtml(row.itemId || "")}</td>
        <td>${escapeHtml(row.itemName || "")}</td>
        <td>${escapeHtml(row.type || "")}</td>

        <td>
          <input type="text" class="inventory-input" id="storePrice-${index}" value="${escapeAttr(row.storePrice || "")}">
        </td>

        <td>
          <input type="text" class="inventory-input" id="soldPrice-${index}" value="${escapeAttr(row.soldPrice || "")}">
        </td>

        <td>
          <input
  type="number"
  class="inventory-input ${stockClass}"
  id="stock-${index}"
  value="${stock}"
  min="0"
  oninput="updateStockFieldClass(this)"
>
        </td>

        <td>
          <select class="inventory-select" id="status-${index}">
            ${renderStatusOptions(row.status || "")}
          </select>
        </td>

        <td>
          <input type="text" class="inventory-input" id="notes-${index}" value="${escapeAttr(row.notes || "")}">
        </td>

        <td>
          <button class="save-row-btn" onclick="saveInventoryRow(${index})">Save</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderStatusOptions(currentStatus) {
  const options = [
    "In stock",
    "Temporarily unavailable",
    "Re-purchase needed",
    "Sold out"
  ];

  return options.map(option => {
    const selected = option === currentStatus ? "selected" : "";
    return `<option value="${option}" ${selected}>${option}</option>`;
  }).join("");
}

async function saveInventoryRow(index) {
  const row = inventoryRows[index];
  if (!row) return;

  const button = document.querySelector(`button[onclick="saveInventoryRow(${index})"]`);
  if (button) {
    button.disabled = true;
    button.textContent = "Saving...";
  }

  const payload = {
    action: "updateInventoryRow",
    rowNumber: row.rowNumber,
    itemId: row.itemId,
    itemName: row.itemName,
    type: row.type,
    storePrice: document.getElementById(`storePrice-${index}`).value.trim(),
    soldPrice: document.getElementById(`soldPrice-${index}`).value.trim(),
    stock: document.getElementById(`stock-${index}`).value.trim(),
    status: document.getElementById(`status-${index}`).value,
    notes: document.getElementById(`notes-${index}`).value.trim()
  };

  try {
    const res = await fetch(INVENTORY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to save row.");
    }

    if (button) {
      button.textContent = "Saved";
    }

    await loadInventoryRows();
  } catch (err) {
    console.error("Save inventory row error:", err);
    alert("Failed to save inventory row.");

    if (button) {
      button.textContent = "Save";
      button.disabled = false;
    }
    return;
  }

  if (button) {
    button.textContent = "Save";
    button.disabled = false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function updateStockFieldClass(input) {
  const value = parseInt(input.value || "0", 10) || 0;

  input.classList.remove("stock-zero", "stock-low", "stock-ok");

  if (value === 0) {
    input.classList.add("stock-zero");
  } else if (value <= 3) {
    input.classList.add("stock-low");
  } else {
    input.classList.add("stock-ok");
  }
}