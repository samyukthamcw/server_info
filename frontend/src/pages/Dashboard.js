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
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import DrawerMenu from "../components/DropdownMenu";
import AppBarHeader from "../components/AppBarHeader";


const drawerWidth = 240;

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#04325cff",
    color: theme.palette.common.white,
    fontWeight: "bold",
    fontSize: "0.8rem",
    padding: "6px 12px",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: "0.75rem",
    padding: "6px 12px",
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
    if (!token) {
      setError("Unauthorized");
      return;
    }
    const decoded = jwtDecode(token);
    setUserRole(decoded.role);

    fetch("http://192.168.6.87:8092/api/serverinfo", {
      headers: {
        Authorization: token,
      },
    })
      .then((res) => res.json())
      .then((data) => setServers(data))
      .catch((err) => setError(err.message));
  }, []);

  // Edit and Save Handlers
  const handleEditClick = (rowData, index) => {
    setEditIndex(index);
    setEditFormData({ ...rowData });
  };

  const handleInputChange = (e, field) => {
    setEditFormData((prevData) => ({
      ...prevData,
      [field]: e.target.value,
    }));
  };

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

    fetch(`http://192.168.6.87:8092/api/serverinfo/${uuid}`, {
      method: "PUT",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(filteredData),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to update server info");
        return response.json();
      })
      .then(() => {
        alert("Server information updated successfully!");
        setEditIndex(null);
        // Refresh data
        fetch("http://192.168.6.87:8092/api/serverinfo", {
          headers: { Authorization: localStorage.getItem("token") },
        })
          .then((res) => res.json())
          .then((data) => setServers(data))
          .catch((err) => console.error("Error refreshing data:", err));
      })
      .catch((error) => {
        console.error("Error updating server info:", error);
        alert("Failed to update server info.");
      });
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditFormData({});
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top App Bar */}
      <AppBarHeader />

      {/* Permanent Drawer (Sidebar) */}
      <DrawerMenu
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
      />

      {/* Main Content Area */}
      <Box>
         
        {error && <p style={{ color: "red" }}>{error}</p>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Cluster Machine</StyledTableCell>
                <StyledTableCell align="center">Server Name</StyledTableCell>
                <StyledTableCell align="center">vCPU</StyledTableCell>
                <StyledTableCell align="center">RAM</StyledTableCell>
                <StyledTableCell align="center">RAM slots</StyledTableCell>
                <StyledTableCell align="center">Disk</StyledTableCell>
                <StyledTableCell align="center">GPU</StyledTableCell>
                <StyledTableCell align="center">GPU slots</StyledTableCell>
                <StyledTableCell align="center">IP</StyledTableCell>
                <StyledTableCell align="center">Current Owner</StyledTableCell>
                <StyledTableCell align="center">Owner</StyledTableCell>
                <StyledTableCell align="center">Project</StyledTableCell>
                {userRole === "admin" && (
                  <StyledTableCell align="center">Actions</StyledTableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {servers.map((s, index) => {
                const isEditing = editIndex === index;
                return (
                  <TableRow key={s.id || index}>
                    <StyledTableCell>
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
                    <StyledTableCell align="center">{s.server_name}</StyledTableCell>
                    <StyledTableCell align="center">{s.vcpu}</StyledTableCell>
                    <StyledTableCell align="center">{s.ram_gb}</StyledTableCell>
                    <StyledTableCell align="center">
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
                    <StyledTableCell align="center">
                      {Array.isArray(s.disks)
                        ? s.disks.map((d, i) => (
                            <div key={i}>
                              <b>{d.name}</b> ({d.model},{" "}
                              {d.size_gb ? d.size_gb.toFixed(1) : "N/A"} GB)
                            </div>
                          ))
                        : s.disks}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {Array.isArray(s.gpus)
                        ? s.gpus.map((g, i) => (
                            <div key={i}>
                              <b>{g.vendor}</b> - {g.model}
                            </div>
                          ))
                        : s.gpus}
                    </StyledTableCell>
                    <StyledTableCell align="center">
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
                    <StyledTableCell align="center">{s.ip}</StyledTableCell>
                    <StyledTableCell align="center">
                      {isEditing ? (
                        <TextField
                          value={editFormData.current_owner || ""}
                          onChange={(e) =>
                            handleInputChange(e, "current_owner")
                          }
                          variant="standard"
                        />
                      ) : (
                        s.current_owner
                      )}
                    </StyledTableCell>
                    <StyledTableCell align="center">
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
                    <StyledTableCell align="center">
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
                    {userRole === "admin" && (
                      <StyledTableCell align="center">
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
      </Box>
    </Box>
  );
};

export default Dashboard;
