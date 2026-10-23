import UsersTable from "./UsersTable";

export default function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard-layout">
      <section className="dashboard-card">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>Welcome, {user.userName}!</h1>

        <p className="subtitle">You are successfully signed in.</p>

        <div className="user-details">
          <p>
            <strong>Name</strong>
            <span>{user.userName}</span>
          </p>

          <p>
            <strong>Email</strong>
            <span>{user.email}</span>
          </p>

          <p>
            <strong>Role</strong>
            <span>{user.role}</span>
          </p>
        </div>

        <button type="button" onClick={onLogout}>
          Sign out
        </button>
      </section>

      {user.role === "admin" && <UsersTable />}
    </div>
  );
}
