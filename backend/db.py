import mysql.connector
from mysql.connector import pooling
from config import Config

pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    host=Config.MYSQL_HOST,
    user=Config.MYSQL_USER,
    password=Config.MYSQL_PASSWORD,
    database=Config.MYSQL_DB,
    auth_plugin='mysql_native_password'
)

def get_db():
    return pool.get_connection()
def get_conn():
    return pool.get_connection()

# Alias for modules that call get_db()
get_db = get_conn

