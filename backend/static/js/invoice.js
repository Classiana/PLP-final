document.addEventListener('DOMContentLoaded', () => {
    const clientSelect = document.getElementById('client-select');
    const linesBody = document.querySelector('#lines tbody');
    const addLineBtn = document.getElementById('add-line');
    const discountInput = document.getElementById('discount');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const saveBtn = document.getElementById('save-invoice');

    let availableItems = [];

    // ---- Fetch clients ----
    fetch('/invoices/clients')
        .then(res => res.json())
        .then(clients => {
            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.text = c.name;
                clientSelect.add(opt);
            });
        })
        .catch(err => console.error('Error loading clients', err));

    // ---- Fetch items ----
    fetch('/invoices/items')
        .then(res => res.json())
        .then(items => {
            availableItems = items;
        })
        .catch(err => console.error('Error loading items', err));

    // ---- Add invoice line ----
    addLineBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>
                <select class="item-select">
                    <option value="">-- Select item --</option>
                    ${availableItems.map(i => `<option value="${i.id}" data-price="${i.unit_price}" data-service="${i.is_service}" data-desc="${i.description}">${i.name}</option>`).join('')}
                </select>
            </td>
            <td><input type="text" class="desc"></td>
            <td><input type="number" class="qty" value="1" min="1"></td>
            <td><input type="number" class="unit" value="0" readonly></td>
            <td><input type="number" class="tax" value="0"></td>
            <td class="line-total">0.00</td>
            <td><button class="remove">x</button></td>
        `;

        // ---- Handle item selection ----
        row.querySelector('.item-select').addEventListener('change', function() {
            const selected = availableItems.find(i => i.id == this.value);
            if (selected) {
                row.querySelector('.unit').value = selected.unit_price;
                row.querySelector('.desc').value = selected.description || '';
                updateTotals();
            }
        });

        // ---- Quantity / tax change ----
        row.querySelectorAll('.qty, .tax').forEach(input => {
            input.addEventListener('input', updateTotals);
        });

        // ---- Remove line ----
        row.querySelector('.remove').addEventListener('click', () => {
            row.remove();
            updateTotals();
        });

        linesBody.appendChild(row);
        updateTotals();
    });

    // ---- Update totals ----
    function updateTotals() {
        let subtotal = 0, tax = 0;
        linesBody.querySelectorAll('tr').forEach(row => {
            const qty = parseFloat(row.querySelector('.qty').value) || 0;
            const unit = parseFloat(row.querySelector('.unit').value) || 0;
            const lineTax = parseFloat(row.querySelector('.tax').value) || 0;
            const lineTotal = qty * unit + lineTax;
            row.querySelector('.line-total').innerText = lineTotal.toFixed(2);
            subtotal += qty * unit;
            tax += lineTax;
        });
        const discount = parseFloat(discountInput.value) || 0;
        subtotalEl.innerText = subtotal.toFixed(2);
        taxEl.innerText = tax.toFixed(2);
        totalEl.innerText = (subtotal + tax - discount).toFixed(2);
    }

    // ---- Save invoice ----
    saveBtn.addEventListener('click', () => {
        const clientId = clientSelect.value;
        if (!clientId) return alert('Select a client');

        const items = [];
        linesBody.querySelectorAll('tr').forEach(row => {
            const itemId = row.querySelector('.item-select').value;
            if (!itemId) return;
            items.push({
                item_id: itemId,
                description: row.querySelector('.desc').value,
                qty: row.querySelector('.qty').value,
                unit_price: row.querySelector('.unit').value,
                tax: row.querySelector('.tax').value
            });
        });

        fetch('/invoices/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                items: items,
                discount: discountInput.value
            })
        })
        .then(res => res.json())
        .then(resp => {
            if (resp.status === 'ok') {
                alert('Invoice saved! ID: ' + resp.invoice_id);
                window.location.reload();
            } else {
                alert('Error saving invoice');
            }
        })
        .catch(err => console.error(err));
    });
});
