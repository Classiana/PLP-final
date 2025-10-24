document.addEventListener("DOMContentLoaded", () => {
  const clientSelect = document.getElementById("clientSelect");
  const addItemBtn = document.getElementById("addItemBtn");
  const invoiceTable = document
    .getElementById("invoiceTable")
    .querySelector("tbody");
  const discountInput = document.getElementById("discount");
  const subtotalEl = document.getElementById("subtotal");
  const taxEl = document.getElementById("tax");
  const totalEl = document.getElementById("total");
  const saveBtn = document.getElementById("saveInvoiceBtn");

  // --- Load clients ---
  fetch("/invoices/clients")
    .then((res) => res.json())
    .then((clients) => {
      clients.forEach((client) => {
        const opt = document.createElement("option");
        opt.value = client.id;
        opt.textContent = client.name;
        clientSelect.appendChild(opt);
      });
    })
    .catch((err) => console.error("Error loading clients:", err));

  // --- Add new item row ---
  addItemBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" class="item" placeholder="Item name" /></td>
      <td><input type="text" class="desc" placeholder="Description" /></td>
      <td><input type="number" class="qty" value="1" min="1" /></td>
      <td><input type="number" class="unit" value="0" step="0.01" /></td>
      <td>
        <select class="tax">
          <option value="0">Exempt</option>
          <option value="0.16">16%</option>
        </select>
      </td>
      <td class="line-total">0.00</td>
      <td><button class="remove">×</button></td>
    `;
    invoiceTable.appendChild(row);
    updateTotals();
  });

  // --- Remove item row ---
  invoiceTable.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove")) {
      e.preventDefault();
      e.target.closest("tr").remove();
      updateTotals();
    }
  });

  // --- Recalculate totals on input changes ---
  invoiceTable.addEventListener("input", (e) => {
    if (
      e.target.classList.contains("qty") ||
      e.target.classList.contains("unit") ||
      e.target.classList.contains("tax")
    ) {
      updateTotals();
    }
  });
  discountInput.addEventListener("input", updateTotals);

  // --- Save invoice ---
  saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const clientId = clientSelect.value;
    if (!clientId) return alert("Please select a client first.");

    const lines = [...invoiceTable.querySelectorAll("tr")].map((tr) => {
      const item = tr.querySelector(".item").value.trim();
      const desc = tr.querySelector(".desc").value.trim();
      const qty = parseFloat(tr.querySelector(".qty").value) || 0;
      const unit = parseFloat(tr.querySelector(".unit").value) || 0;
      const tax = parseFloat(tr.querySelector(".tax").value) || 0;
      const total = qty * unit * (1 + tax);
      return { item, desc, qty, unit, tax, total };
    });

    if (lines.length === 0) return alert("Add at least one item.");

    const discount = parseFloat(discountInput.value) || 0;
    const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unit, 0);
    const tax = lines.reduce((sum, l) => sum + l.qty * l.unit * l.tax, 0);
    const grandTotal = subtotal + tax - discount;

    const invoiceData = {
      client_id: clientId,
      lines,
      discount,
      subtotal,
      tax,
      total: grandTotal,
    };

    try {
      const res = await fetch("/invoices/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });
      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Invoice saved successfully!");
        window.location.reload();
      } else {
        alert(data.error || "Error saving invoice.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server.");
    }
  });

  // --- Totals calculation ---
  function updateTotals() {
    let subtotal = 0,
      tax = 0;

    [...invoiceTable.querySelectorAll("tr")].forEach((tr) => {
      const qty = parseFloat(tr.querySelector(".qty")?.value) || 0;
      const unit = parseFloat(tr.querySelector(".unit")?.value) || 0;
      const rate = parseFloat(tr.querySelector(".tax")?.value) || 0;
      const lineTotal = qty * unit * (1 + rate);
      tr.querySelector(".line-total").textContent = lineTotal.toFixed(2);
      subtotal += qty * unit;
      tax += qty * unit * rate;
    });

    const discount = parseFloat(discountInput.value) || 0;
    const total = subtotal + tax - discount;

    subtotalEl.textContent = subtotal.toFixed(2);
    taxEl.textContent = tax.toFixed(2);
    totalEl.textContent = total.toFixed(2);
  }
});
