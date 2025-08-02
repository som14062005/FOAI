import { getUserFromToken } from '../utils/auth';

const AdminDashboard = () => {
  const user = getUserFromToken();

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-green-700">Welcome, Admin!</h1>
      {user && (
        <p className="text-lg mt-2 text-gray-600">
          Logged in as: <strong>{user.name}</strong> (<em>{user.role}</em>)
        </p>
      )}
      <button
        onClick={() => {
          sessionStorage.removeItem("authToken");
          window.location.href = "/";
        }}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default AdminDashboard;
