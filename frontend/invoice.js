// invoice editor: dynamic rows, calculation, POST json to /invoices/create
document.addEventListener('DOMContentLoaded', ()=> {
  const linesTbody = document.querySelector('#lines tbody');
  const addLineBtn = document.getElementById('add-line');
  const subtotalEl = document.getElementById('subtotal');
  const taxEl = document.getElementById('tax');
  const totalEl = document.getElementById('total');
  const discountEl = document.getElementById('discount');

  function createRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="item-name" /></td>
      <td><input class="item-desc" /></td>
      <td><input class="item-qty" type="number" step="0.01" value="1" /></td>
      <td><input class="item-price" type="number" step="0.01" value="0" /></td>
      <td><input class="item-tax" type="number" step="0.01" value="0" /></td>
      <td class="line-total">0.00</td>
      <td><button class="remove-line">x</button></td>
    `;
    linesTbody.appendChild(tr);

    tr.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', recalc);
    });
    tr.querySelector('.remove-line').addEventListener('click', (e)=> {
      e.preventDefault();
      tr.remove();
      recalc();
    });
    return tr;
  }

  function recalc() {
    let subtotal = 0;
    let tax = 0;
    linesTbody.querySelectorAll('tr').forEach(tr => {
      const qty = parseFloat(tr.querySelector('.item-qty').value || 0);
      const price = parseFloat(tr.querySelector('.item-price').value || 0);
      const t = parseFloat(tr.querySelector('.item-tax').value || 0);
      const lineTotal = qty * price + t;
      tr.querySelector('.line-total').textContent = lineTotal.toFixed(2);
      subtotal += qty * price;
      tax += t;
    });
    const discount = parseFloat(discountEl.value || 0);
    const total = subtotal + tax - discount;
    subtotalEl.textContent = subtotal.toFixed(2);
    taxEl.textContent = tax.toFixed(2);
    totalEl.textContent = total.toFixed(2);
  }

  addLineBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    createRow();
  });

  document.getElementById('save-invoice').addEventListener('click', async (e) => {
    e.preventDefault();
    const items = [];
    linesTbody.querySelectorAll('tr').forEach(tr => {
      items.push({
        description: tr.querySelector('.item-desc').value,
        qty: tr.querySelector('.item-qty').value,
        unit_price: tr.querySelector('.item-price').value,
        tax: tr.querySelector('.item-tax').value
      });
    });
    const payload = {
      client_id: document.getElementById('client-select').value || null,
      items,
      discount: parseFloat(discountEl.value || 0)
    };
    const res = await fetch('/invoices/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      alert('Invoice saved ID: ' + data.invoice_id);
      window.location.href = '/invoices/' + data.invoice_id;
    } else {
      alert('Failed to save invoice');
    }
  });

  // start with one empty line
  createRow();
  recalc();
});
