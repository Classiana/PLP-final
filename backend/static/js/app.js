document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("invoice-form");
    const addLineBtn = document.getElementById("add-line");
    const tbody = document.querySelector("#lines tbody");

    // --- Add new line item row ---
    addLineBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const row = document.createElement("tr");
        row.innerHTML = `
      <td><input type="text" class="item-desc" placeholder="Item description"></td>
      <td><input type="number" class="qty" value="1" step="1"></td>
      <td><input type="number" class="unit-price" value="0" step="0.01"></td>
      <td><input type="number" class="tax" value="0" step="0.01"></td>
      <td class="line-total">0.00</td>
      <td><button class="remove">X</button></td>
    `;
        tbody.appendChild(row);
    });

    // --- Remove a line item ---
    tbody.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove")) {
            e.target.closest("tr").remove();
            updateTotals();
        }
    });

    // --- Recalculate totals when inputs change ---
    tbody.addEventListener("input", (e) => {
        if (["qty", "unit-price", "tax"].includes(e.target.className)) {
            const row = e.target.closest("tr");
            const qty = parseFloat(row.querySelector(".qty").value) || 0;
            const unit = parseFloat(row.querySelector(".unit-price").value) || 0;
            const tax = parseFloat(row.querySelector(".tax").value) || 0;
            const lineTotal = qty * unit + tax;
            row.querySelector(".line-total").textContent = lineTotal.toFixed(2);
            updateTotals();
        }
    });

    // --- Totals Calculation ---
    function updateTotals() {
        let subtotal = 0;
        let tax = 0;
        document.querySelectorAll("#lines tbody tr").forEach((row) => {
            subtotal += (parseFloat(row.querySelector(".qty").value) || 0) * (parseFloat(row.querySelector(".unit-price").value) || 0);
            tax += parseFloat(row.querySelector(".tax").value) || 0;
        });
        const discount = parseFloat(document.getElementById("discount").value) || 0;
        const total = subtotal + tax - discount;
        document.getElementById("subtotal").textContent = subtotal.toFixed(2);
        document.getElementById("tax").textContent = tax.toFixed(2);
        document.getElementById("total").textContent = total.toFixed(2);
    }

    // --- Submit Invoice ---
    form.addEventListener("submit", async(e) => {
        e.preventDefault();

        const client_id = document.getElementById("client-select").value;
        const discount = parseFloat(document.getElementById("discount").value) || 0;
        const items = [];

        document.querySelectorAll("#lines tbody tr").forEach((row) => {
            items.push({
                description: row.querySelector(".item-desc").value,
                qty: parseFloat(row.querySelector(".qty").value),
                unit_price: parseFloat(row.querySelector(".unit-price").value),
                tax: parseFloat(row.querySelector(".tax").value),
            });
        });

        const data = { client_id, discount, items };

        try {
            const res = await fetch("/invoices/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();
            if (res.ok) {
                alert("✅ Invoice created successfully!");
                console.log(result);
                form.reset();
                tbody.innerHTML = ""; // clear old items
                updateTotals();
            } else {
                alert("❌ Error creating invoice: " + (result.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("⚠️ Network error, could not reach server.");
        }
    });
});