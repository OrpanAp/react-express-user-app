import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const result = await api.getUsers();
      setUsers(result.users);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        const result = await api.getUsers();

        if (!cancelled) {
          setUsers(result.users);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  function startEditing(user) {
    setEditingUser({
      id: user.id,
      userName: user.userName,
      email: user.email,
    });
    setError("");
    setMessage("");
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!editingUser) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.updateUser(editingUser.id, {
        userName: editingUser.userName,
        email: editingUser.email,
      });

      setEditingUser(null);
      setMessage("User updated successfully.");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.userName}?`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const result = await api.deleteUser(user.id);
      setMessage(result.message);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <p>Loading users...</p>;
  }

  return (
    <section className="users-section">
      <div className="users-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h2>User management</h2>
          <p className="subtitle">View and manage registered accounts.</p>
        </div>

        <button type="button" className="secondary-button" onClick={loadUsers}>
          Refresh
        </button>
      </div>

      {error && <p className="feedback error">{error}</p>}
      {message && <p className="feedback success">{message}</p>}

      {editingUser && (
        <form className="edit-form" onSubmit={handleSave}>
          <h3>Edit user #{editingUser.id}</h3>

          <label>
            Full name
            <input
              value={editingUser.userName}
              onChange={(event) =>
                setEditingUser({
                  ...editingUser,
                  userName: event.target.value,
                })
              }
              minLength={2}
              maxLength={100}
              required
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              value={editingUser.email}
              onChange={(event) =>
                setEditingUser({
                  ...editingUser,
                  email: event.target.value,
                })
              }
              maxLength={255}
              required
            />
          </label>

          <div className="edit-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditingUser(null)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.userName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="role-label">{user.role}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => startEditing(user)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDelete(user)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
