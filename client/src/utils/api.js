// utils/api.js
export const getAuthHeaders = () => {
  const token = sessionStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Example usage:
fetch('http://localhost:3000/some-protected-route', {
  method: 'GET',
  headers: getAuthHeaders()
});
