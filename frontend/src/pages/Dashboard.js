import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import DropdownMenu from "../components/DropdownMenu";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#04325cff",
    color: theme.palette.common.white,
    fontWeight: "bold",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));


const Dashboard = () => {
  const [servers, setServers] = useState([]);
  const [error, setError] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedCluster, setSelectedCluster] = useState("");
  const [userRole, setUserRole] = useState("");


  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Fetch server data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);
    setUserRole(decoded.role);
    console.log("Decoded token:", decoded);
    if (!token) {
      setError("Unauthorized");
      return;
    }

    fetch("http://192.168.6.87:8092/api/serverinfo", {
      headers: {
        Authorization: token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched server data:", data);
        setServers(JSON.parse(JSON.stringify(data)));
      })
      .catch((err) => setError(err.message));
  }, []);

  const decoded = localStorage.getItem("token")
    ? jwtDecode(localStorage.getItem("token"))
    : null;

  // Start editing a row
  const handleEditClick = (rowData, index) => {
    setEditIndex(index);
    setEditFormData({ ...rowData });
  };


  // Handle input change
  const handleInputChange = (e, field) => {
    setEditFormData((prevData) => ({
      ...prevData,
      [field]: e.target.value,
    }));
  };

  // Save changes
  const handleSaveClick = () => {
    const uuid = editFormData.system_id;

    const filteredData = {
      uuid: editFormData.system_id,
      cluster_name: editFormData.cluster_name,
      owner: editFormData.owner,
      current_owner: editFormData.current_owner,
      projects: editFormData.projects,
      ram_slots: editFormData.ram_slots,
      gpu_slots: editFormData.gpu_slots,
    };

    console.log("Filtered data to be sent:", filteredData);

    fetch(`http://192.168.6.87:8092/api/serverinfo/${uuid}`, {
      method: "PUT",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`, // ✅ fixed
      },
      body: JSON.stringify(filteredData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to update server info for UUID: ${uuid}`);
        }
        return response.json();
      })
      .then(() => {
        alert("Server information updated successfully!");
        setEditIndex(null);

        // ✅ Re-fetch only the table data
        fetch("http://192.168.6.87:8092/api/serverinfo", {
          headers: { Authorization: localStorage.getItem("token") },
        })
          .then((res) => res.json())
          .then((data) => setServers(data))
          .catch((err) => console.error("Error refreshing data:", err));
      })
      .catch((error) => {
        console.error("Error updating server info:", error);
        alert("Failed to update server info. Check console for details.");
      });
  };



  const handleCancelClick = () => {
    setEditIndex(null);
    setEditFormData({});
  };


  return (
    <div className="p-8">
      <DropdownMenu
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
      />

      <h2>Cluster Machine Info</h2>
      {error && <p className="text-red-500">{error}</p>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Cluster Machine</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>Server Name</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>vCPU</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>RAM</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>RAM slots</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>Disk</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }} >GPU</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>GPU slots</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>IP</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}> Current Owner</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>Owner</StyledTableCell>
              <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>Project</StyledTableCell>
              {/* ✅ Only show for admin */}
    {userRole === "admin" && (
      <StyledTableCell align="right" sx={{ fontWeight: 'bold' }}>
        Actions
      </StyledTableCell>
    )}
            </TableRow>
          </TableHead>

          <TableBody>
            {servers.map((s, index) => {
              const isEditing = editIndex === index;

              return (
                <TableRow key={s.id || index}>
                  {/* Cluster Machine */}
                  <StyledTableCell component="th" scope="row">
                    {isEditing ? (
                      <TextField
                        value={editFormData.cluster_name || ""}
                        onChange={(e) =>
                          handleInputChange(e, "cluster_name")
                        }
                        variant="standard"
                      />
                    ) : (
                      s.cluster_name
                    )}
                  </StyledTableCell>

                  <StyledTableCell align="right">{s.server_name}</StyledTableCell>
                  <StyledTableCell align="right">{s.vcpu}</StyledTableCell>
                  <StyledTableCell align="right">{s.ram_gb}</StyledTableCell>

                  {/* RAM slots */}
                  <StyledTableCell align="right">
                    {isEditing ? (
                      <TextField
                        value={editFormData.ram_slots || ""}
                        onChange={(e) => handleInputChange(e, "ram_slots")}
                        variant="standard"
                      />
                    ) : (
                      s.ram_slots
                    )}
                  </StyledTableCell>

                  {/* Disk */}
                  <StyledTableCell align="right">
                    {Array.isArray(s.disks)
                      ? s.disks.map((d, i) => (
                        <div key={i}>
                          <b>{d.name}</b> ({d.model},{" "}
                          {d.size_gb ? d.size_gb.toFixed(1) : "N/A"} GB)
                        </div>
                      ))
                      : s.disks}
                  </StyledTableCell>

                  {/* GPU */}
                  <StyledTableCell align="right">
                    {Array.isArray(s.gpus)
                      ? s.gpus.map((g, i) => (
                        <div key={i}>
                          <b>{g.vendor}</b> - {g.model}
                        </div>
                      ))
                      : s.gpus}
                  </StyledTableCell>

                  {/* GPU slots */}
                  <StyledTableCell align="right">
                    {isEditing ? (
                      <TextField
                        value={editFormData.gpu_slots || ""}
                        onChange={(e) => handleInputChange(e, "gpu_slots")}
                        variant="standard"
                      />
                    ) : (
                      s.gpu_slots
                    )}
                  </StyledTableCell>

                  {/* IP */}
                  <StyledTableCell align="right">{s.ip}</StyledTableCell>

                  {/* Current Owner */}
                  <StyledTableCell align="right">
                    {isEditing ? (
                      <TextField
                        value={editFormData.current_owner || ""}
                        onChange={(e) => handleInputChange(e, "current_owner")}
                        variant="standard"
                      />
                    ) : (
                      s.current_owner
                    )}
                  </StyledTableCell>

                  {/* Owner */}
                  <StyledTableCell align="right">
                    {isEditing ? (
                      <TextField
                        value={editFormData.owner || ""}
                        onChange={(e) => handleInputChange(e, "owner")}
                        variant="standard"
                      />
                    ) : (
                      s.owner
                    )}
                  </StyledTableCell>

                  {/* Project */}
                  <StyledTableCell align="right">
                    {isEditing ? (
                      <TextField
                        value={editFormData.projects || ""}
                        onChange={(e) => handleInputChange(e, "projects")}
                        variant="standard"
                      />
                    ) : (
                      s.projects
                    )}
                  </StyledTableCell>

                  {/* Actions */}
                  {userRole === "admin" && (
  <StyledTableCell align="right">
    {isEditing ? (
      <>
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={() => handleSaveClick(s)}
          sx={{ mr: 1 }}
        >
          SAVE
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleCancelClick}
        >
          CANCEL
        </Button>
      </>
    ) : (
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => handleEditClick(s, index)}
        disabled={editIndex !== null}
      >
        EDIT
      </Button>
    )}
  </StyledTableCell>
)}

                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Dashboard;
