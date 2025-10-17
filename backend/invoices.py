from flask import Blueprint, request, render_template, session, redirect, url_for, jsonify
from db import get_conn
import datetime

invoices_bp = Blueprint('invoices', __name__, template_folder='templates')

@invoices_bp.route('/create', methods=['GET','POST'])
def create_invoice():
    if 'business_id' not in session:
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        data = request.get_json()
        business_id = session['business_id']
        client_id = data.get('client_id')
        items = data.get('items', [])  # list of {item_id, description, qty, unit_price, tax}
        subtotal = sum([float(i['qty'])*float(i['unit_price']) for i in items])
        tax = sum([float(i.get('tax',0)) for i in items])
        discount = float(data.get('discount', 0))
        total = subtotal + tax - discount

        conn = get_conn()
        cur = conn.cursor()
        invoice_number = f"INV-{int(datetime.datetime.now().timestamp())}"  # simple invoice id
        cur.execute("""INSERT INTO invoices (business_id, invoice_number, client_id, subtotal, tax, discount, total, status, date)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,'issued',%s)""",
                    (business_id, invoice_number, client_id, subtotal, tax, discount, total, datetime.date.today()))
        invoice_id = cur.lastrowid

        for it in items:
            line_total = float(it['qty'])*float(it['unit_price']) + float(it.get('tax',0))
            cur.execute("""INSERT INTO invoice_items
                           (invoice_id, item_id, description, qty, unit_price, tax, line_total)
                           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                        (invoice_id, it.get('item_id'), it.get('description'), it['qty'], it['unit_price'], it.get('tax',0), line_total))
            # optional: reduce stock if item exists and not service
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status":"ok","invoice_id":invoice_id}), 201

    # GET: render the invoice create UI
    return render_template('invoice_edit.html')
