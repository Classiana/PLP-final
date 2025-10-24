from flask import Blueprint, request, render_template, jsonify
from db import get_conn
import datetime

invoices_bp = Blueprint('invoices', __name__, template_folder='templates')

# ---- Invoice creation page ----
@invoices_bp.route('/create', methods=['GET', 'POST'])
def create_invoice():
    business_id = 1  # Temporary for testing

    if request.method == 'POST':
        data = request.get_json()
        client_id = data.get('client_id')
        lines = data.get('lines', [])  # aligned with frontend key

        if not client_id or not lines:
            return jsonify({"error": "Missing client or line items"}), 400

        subtotal = sum(float(i['qty']) * float(i['unit']) for i in lines)
        tax = sum(float(i['qty']) * float(i['unit']) * float(i.get('tax', 0)) for i in lines)
        discount = float(data.get('discount', 0))
        total = subtotal + tax - discount

        try:
            conn = get_conn()
            cur = conn.cursor()
            invoice_number = f"INV-{int(datetime.datetime.now().timestamp())}"

            # Insert invoice header
            cur.execute("""
                INSERT INTO invoices (business_id, invoice_number, client_id, subtotal, tax, discount, total, status, date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'issued', %s)
            """, (business_id, invoice_number, client_id, subtotal, tax, discount, total, datetime.date.today()))
            invoice_id = cur.lastrowid

            # Insert each line item
            for l in lines:
                line_total = float(l['qty']) * float(l['unit']) * (1 + float(l.get('tax', 0)))
                cur.execute("""
                    INSERT INTO invoice_items (invoice_id, item_name, description, qty, unit_price, tax_rate, line_total)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (invoice_id, l['item'], l['desc'], l['qty'], l['unit'], l['tax'], line_total))

            conn.commit()
            cur.close()
            conn.close()

            return jsonify({"message": f"Invoice #{invoice_number} saved successfully!"}), 201

        except Exception as e:
            print("Error saving invoice:", e)
            return jsonify({"error": "Failed to save invoice"}), 500

    # GET request → render UI
    return render_template('edit_invoice.html')


# ---- Test DB connection ----
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


# ---- Fetch all invoices ----
@invoices_bp.route('/all', methods=['GET'])
def get_all_invoices():
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT i.id, i.invoice_number, c.name AS client_name, i.total, i.status, i.date
            FROM invoices i
            JOIN clients c ON i.client_id = c.id
            ORDER BY i.date DESC
        """)
        invoices = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(invoices)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
