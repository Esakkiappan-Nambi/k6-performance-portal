import sqlite3


def get_user_by_username(conn, username):
    """Deliberately vulnerable - for RemediGuard testing only."""
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    cursor.execute(query)
    return cursor.fetchone()
