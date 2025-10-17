from flask import Blueprint, request, render_template, session, redirect, url_for, jsonify
from db import get_conn
import datetime

invoices_bp = Blueprint('invoices', __name__, template_folder='templates')

# ---- Invoice creation page ----
@invoices_bp.route('/create', methods=['GET','POST'])
def create_invoice():
    # TEMPORARY: skip login check for testing
    # if 'business_id' not in session:
    #     return redirect(url_for('auth.login'))
    business_id = 1  # remove/comment after login is implemented

    if request.method == 'POST':
        data = request.get_json()
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
    return render_template('edit_invoice.html')


# ---- Test DB connection route ----
@invoices_bp.route('/test', methods=['GET'])
def test_db():
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT DATABASE();")
        db_name = cursor.fetchone()
        cursor.close()
        conn.close()
        return {"message": f"Connected successfully to {db_name[0]}"}
    except Exception as e:
        return {"error": str(e)}, 500


# ---- Fetch clients for dropdown ----
@invoices_bp.route('/clients', methods=['GET'])
def get_clients():

    try:
        business_id = 1
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, name FROM clients WHERE business_id=%s", (business_id,))
        clients = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(clients)
    except Exception as e:
        return {"error": str(e)}, 500
