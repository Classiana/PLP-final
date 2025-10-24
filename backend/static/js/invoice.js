document.addEventListener("DOMContentLoaded", () => {
    const clientSelect = document.getElementById("client-select");
    const addLineBtn = document.getElementById("add-line");
    const saveBtn = document.getElementById("save-invoice");
    const linesTable = document.getElementById("lines").querySelector("tbody");
    const subtotalEl = document.getElementById("subtotal");
    const taxEl = document.getElementById("tax");
    const totalEl = document.getElementById("total");
    const discountEl = document.getElementById("discount");

    // --- 1. Load clients into dropdown ---
    fetch("/invoices/clients")
        .then((res) => res.json())
        .then((clients) => {
            clients.forEach((c) => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = c.name;
                clientSelect.appendChild(opt);
            });
        })
        .catch((err) => console.error("Error loading clients:", err));

    // --- 2. Add new line item ---
    addLineBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td><input class="item" type="text" placeholder="Item name"></td>
      <td><input class="desc" type="text" placeholder="Description"></td>
      <td><input class="qty" type="number" value="1" step="1"></td>
      <td><input class="unit" type="number" value="0" step="0.01"></td>
      <td>
        <select class="tax">
          <option value="0">Exempt</option>
          <option value="0.16">16%</option>
        </select>
      </td>
      <td class="line-total">0.00</td>
      <td><button class="remove">x</button></td>
    `;

        linesTable.appendChild(tr);
        updateTotals();
    });

    // --- 3. Remove a line ---
    linesTable.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove")) {
            e.preventDefault();
            e.target.closest("tr").remove();
            updateTotals();
        }
    });

    // --- 4. Recalculate when inputs change ---
    linesTable.addEventListener("input", (e) => {
        if (["qty", "unit", "tax"].some(cls => e.target.classList.contains(cls))) {
            updateTotals();
        }
    });
    discountEl.addEventListener("input", updateTotals);

    // --- 5. Save invoice ---
    saveBtn.addEventListener("click", async(e) => {
        e.preventDefault();

        const clientId = clientSelect.value;
        if (!clientId) return alert("Select a client first!");

        const lines = [...linesTable.querySelectorAll("tr")].map((tr) => {
            const item = tr.querySelector(".item").value;
            const desc = tr.querySelector(".desc").value;
            const qty = parseFloat(tr.querySelector(".qty").value) || 0;
            const unit = parseFloat(tr.querySelector(".unit").value) || 0;
            const tax = parseFloat(tr.querySelector(".tax").value) || 0;
            const total = qty * unit * (1 + tax);
            return { item, desc, qty, unit, tax, total };
        });

        const discount = parseFloat(discountEl.value) || 0;
        const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unit, 0);
        const tax = lines.reduce((sum, l) => sum + (l.qty * l.unit * l.tax), 0);
        const grandTotal = subtotal + tax - discount;

        const invoice = {
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
                body: JSON.stringify(invoice),
            });
            const data = await res.json();
            alert(data.message || "Invoice saved!");
        } catch (err) {
            console.error(err);
            alert("Failed to save invoice.");
        }
    });

    // --- 6. Totals calculator ---
    function updateTotals() {
        let subtotal = 0;
        let tax = 0;

        [...linesTable.querySelectorAll("tr")].forEach((tr) => {
            const qty = parseFloat(tr.querySelector(".qty") ? .value) || 0;
            const unit = parseFloat(tr.querySelector(".unit") ? .value) || 0;
            const rate = parseFloat(tr.querySelector(".tax") ? .value) || 0;
            const lineTotal = qty * unit * (1 + rate);
            tr.querySelector(".line-total").textContent = lineTotal.toFixed(2);
            subtotal += qty * unit;
            tax += qty * unit * rate;
        });

        const discount = parseFloat(discountEl.value) || 0;
        const total = subtotal + tax - discount;

        subtotalEl.textContent = subtotal.toFixed(2);
        taxEl.textContent = tax.toFixed(2);
        totalEl.textContent = total.toFixed(2);
    }
});