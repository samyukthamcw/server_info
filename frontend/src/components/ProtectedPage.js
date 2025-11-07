import React from "react";

export default function ProtectedPage() {
  const handleCheck = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://192.168.6.87:8092/protected", {
      headers: { Authorization: token },
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <h3>Protected Page</h3>
      <button onClick={handleCheck}>Access Protected API</button>
    </div>
  );
}
