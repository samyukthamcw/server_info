import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Snackbar, Alert, Typography
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { jwtDecode } from "jwt-decode";
import DropdownMenu from "../components/DropdownMenu";
import AppBarHeader from "../components/AppBarHeader";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${theme.tableCellClasses?.head || "MuiTableCell-head"}`]: {
    backgroundColor: "#04325cff",
    color: theme.palette.common.white,
    fontWeight: "bold",
  },
  [`&.${theme.tableCellClasses?.body || "MuiTableCell-body"}`]: {
    fontSize: 14,
  },
}));

const API_BASE = "http://localhost:8092/api/gpuinfo";

const GPU = () => {
  const [gpuData, setGpuData] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const [form, setForm] = useState({
    status: "",
    total: "",
    gpu_cards: [{ model: "", memory_gb: "" }],
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });
  const [role, setRole] = useState("");

  const token = localStorage.getItem("token");

  // Decode JWT to extract role
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setRole(decoded.role || "user");
      } catch (err) {
        console.error("Failed to decode token:", err);
        setRole("user");
      }
    }
  }, [token]);

  // Fetch GPU data
  useEffect(() => {
    if (!token) return;
    fetch(API_BASE, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch GPU info");
        return res.json();
      })
      .then((data) => setGpuData(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setToast({ open: true, msg: "Failed to load GPU info", severity: "error" });
      });
  }, [token]);

  // Add Dialog control
  const handleAddOpen = () => {
    setForm({
      status: "",
      total: "",
      gpu_cards: [{ model: "", memory_gb: "" }],
    });
    setOpen(true);
  };

  const handleClose = () => !saving && setOpen(false);

  // GPU Card Handlers
  const handleCardChange = (idx, key, value) => {
    setForm((prev) => {
      const cards = [...prev.gpu_cards];
      cards[idx] = { ...cards[idx], [key]: value };
      return { ...prev, gpu_cards: cards };
    });
  };

  const addGpuCardField = () =>
    setForm((prev) => ({
      ...prev,
      gpu_cards: [...prev.gpu_cards, { model: "", memory_gb: "" }],
    }));

  const removeGpuCardField = (idx) =>
    setForm((prev) => ({
      ...prev,
      gpu_cards: prev.gpu_cards.filter((_, i) => i !== idx),
    }));

  // Save New Record
  const handleSave = async () => {
    if (role !== "admin") {
      setToast({ open: true, msg: "Permission denied", severity: "error" });
      return;
    }

    const sanitizedCards = form.gpu_cards
      .map((c) => ({ model: c.model.trim(), memory_gb: Number(c.memory_gb) || 0 }))
      .filter((c) => c.model);

    const payload = {
      status: form.status.trim() || "unknown",
      gpu_cards: sanitizedCards,
      total:
        form.total !== "" && !Number.isNaN(Number(form.total))
          ? Number(form.total)
          : sanitizedCards.length,
    };

    setSaving(true);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("POST failed");
      const newItem = await res.json();

      // Append new row with returned id
      setGpuData((prev) => [{ id: newItem.id, ...payload }, ...prev]);
      setToast({ open: true, msg: "Row added successfully", severity: "success" });
      setOpen(false);
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to add row", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Delete Handlers
  const handleDeleteClick = (id) => {
    setSelectedID(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    if (!selectedID) return;

    try {
      const res = await fetch(API_BASE, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: selectedID }),
      });

      if (!res.ok) throw new Error("Failed to delete record");

      setGpuData((prev) => prev.filter((row) => row.id !== selectedID));
      setToast({ open: true, msg: "Record deleted successfully", severity: "success" });
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to delete record", severity: "error" });
    } finally {
      setSelectedID(null);
    }
  };

  return (
    <div>
      <AppBarHeader />
      <DropdownMenu selectedCluster={selectedCluster} setSelectedCluster={setSelectedCluster} />

      <Box
        sx={{
          position: "absolute",
          top: "80px",         // below AppBar
          left: "270px",       // right of sidebar
          width: "70%",        // adjust as needed
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <h2 style={{ margin: 0 }}></h2>
          {role === "admin" && (
            <Tooltip title="Add GPU Record">
              <IconButton onClick={handleAddOpen}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <TableContainer component={Paper} sx={{ width: "100%" }}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">ID</StyledTableCell>
                <StyledTableCell align="center">GPU Cards</StyledTableCell>
                <StyledTableCell align="center">Total</StyledTableCell>
                <StyledTableCell align="center">Status</StyledTableCell>
                {role === "admin" && <StyledTableCell align="center">Actions</StyledTableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {gpuData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === "admin" ? 5 : 4} align="center">
                    No GPU data available.
                  </TableCell>
                </TableRow>
              ) : (
                gpuData.map((row, index) => (
                  <TableRow key={index}>
                    <StyledTableCell align="center">{row.id}</StyledTableCell>
                    <StyledTableCell align="center">
                      {Array.isArray(row.gpu_cards) && row.gpu_cards.length > 0
                        ? row.gpu_cards.map((gpu, i) => (
                          <div key={i}>
                            {gpu.model} ({gpu.memory_gb} GB)
                          </div>
                        ))
                        : "N/A"}
                    </StyledTableCell>
                    <StyledTableCell align="center">{row.total ?? 0}</StyledTableCell>
                    <StyledTableCell align="center">{row.status || "-"}</StyledTableCell>

                    {role === "admin" && (
                      <StyledTableCell align="center">
                        <Tooltip title="Delete Record">
                          <IconButton
                            onClick={() => handleDeleteClick(row.id)}
                            sx={{
                              color: "grey.600",
                              "&:hover": { color: "red" },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </StyledTableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Add GPU Row</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Total"
              value={form.total}
              onChange={(e) => setForm((p) => ({ ...p, total: e.target.value }))}
              fullWidth
              type="number"
            />

            <Box sx={{ fontWeight: 600, mt: 1 }}>GPU Cards</Box>
            {form.gpu_cards.map((card, idx) => (
              <Stack key={idx} direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Model"
                  value={card.model}
                  onChange={(e) => handleCardChange(idx, "model", e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Memory (GB)"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={card.memory_gb}
                  onChange={(e) => handleCardChange(idx, "memory_gb", e.target.value)}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={() => removeGpuCardField(idx)}
                  disabled={form.gpu_cards.length === 1}
                >
                  Remove
                </Button>
              </Stack>
            ))}
            <Button variant="text" onClick={addGpuCardField}>
              + Add GPU Card
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="contained">
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete GPU entry with ID: {selectedID}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleConfirmDelete} variant="contained">
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
    </div>
  );
};

export default GPU;
