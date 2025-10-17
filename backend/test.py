from db import get_conn

try:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT DATABASE();")
    print("Connected to:", cursor.fetchone())
    conn.close()
except Exception as e:
    print("Error:", e)