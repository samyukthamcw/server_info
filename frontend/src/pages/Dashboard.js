import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { styled } from "@mui/material/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AppBarHeader from "../components/AppBarHeader";
import DrawerMenu from "../components/DropdownMenu";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${theme.tableCellClasses?.head || "MuiTableCell-head"}`]: {
    backgroundColor: "#04325cff",
    color: theme.palette.common.white,
    fontWeight: "bold",
    fontSize: "0.8rem",
    padding: "6px 12px",
  },
  [`&.${theme.tableCellClasses?.body || "MuiTableCell-body"}`]: {
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const API_BASE = "http://localhost:8092/api/serverinfo";

  // Fetch server data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized");
      return;
    }
    const decoded = jwtDecode(token);
    setUserRole(decoded.role);

    fetch(API_BASE, {
      headers: {
        Authorization: token,
      },
    })
      .then((res) => res.json())
      .then((data) => setServers(data))
      .catch((err) => setError(err.message));
  }, []);

  // Edit Handlers
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

    fetch(`${API_BASE}/${uuid}`, {
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
        setToast({ open: true, msg: "Server info updated successfully", severity: "success" });
        setEditIndex(null);
        fetch(API_BASE, {
          headers: { Authorization: localStorage.getItem("token") },
        })
          .then((res) => res.json())
          .then((data) => setServers(data))
          .catch((err) => console.error("Error refreshing data:", err));
      })
      .catch(() => {
        setToast({ open: true, msg: "Failed to update server info", severity: "error" });
      });
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditFormData({});
  };

  // Delete Handlers
  const handleDeleteClick = (server) => {
    setSelectedServer(server);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    if (!selectedServer) return;

    try {
      const res = await fetch(API_BASE, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ system_id: selectedServer.system_id }),
      });

      if (!res.ok) throw new Error("Failed to delete record");

      setServers((prev) =>
        prev.filter((srv) => srv.system_id !== selectedServer.system_id)
      );
      setToast({ open: true, msg: "Server deleted successfully", severity: "success" });
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to delete server", severity: "error" });
    } finally {
      setSelectedServer(null);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top App Bar */}
      <AppBarHeader />

      {/* Sidebar */}
      <DrawerMenu
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
      />

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          position: "absolute",
          top: "150px",  
          left: "270px",      
          width: "calc(100% - 300px)", 
          paddingRight: "40px",
        }}
      >
        {error && <p style={{ color: "red" }}>{error}</p>}

        <TableContainer component={Paper} sx={{
          width: "100%",
          overflowX: "hidden", 
          overflowY: "hidden",
          scrollbarWidth: "none", 
          "&::-webkit-scrollbar": { display: "none" }, 
        }}>
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
                  <TableRow key={s.system_id || index}>
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
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleEditClick(s, index)}
                              sx={{ mr: 1 }}
                              disabled={editIndex !== null}
                            >
                              EDIT
                            </Button>
                            <Tooltip title="Delete Server">
                              <IconButton
                                onClick={() => handleDeleteClick(s)}
                                sx={{
                                  color: "grey.600",
                                  "&:hover": { color: "red" },
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
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

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent dividers>
          Are you sure you want to delete{" "}
          <b>{selectedServer?.server_name}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
