from flask import Blueprint, request, session, redirect, render_template, url_for, flash
from db import get_conn
import bcrypt

auth_bp = Blueprint('auth', __name__, template_folder='templates')

@auth_bp.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password'].encode('utf-8')
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, password_hash, business_id FROM users WHERE username=%s", (username,))
        user = cur.fetchone()
        cur.close(); conn.close()
        if user and bcrypt.checkpw(password, user['password_hash'].encode('utf-8')):
            session['user_id'] = user['id']
            session['business_id'] = user['business_id']
            return redirect(url_for('dashboard'))
        flash("Invalid credentials")
    return render_template('login.html')
