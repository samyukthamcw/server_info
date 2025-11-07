import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Snackbar, Alert
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/AddCircleOutline";
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

const API_BASE = "http://192.168.6.87:8092/api/gpuinfo";

const GET_URL = `${API_BASE}`;
const POST_URL = `${API_BASE}`;

const emptyForm = {
  ip: "",
  status: "",
  total: "",
  gpu_cards: [{ model: "", memory_gb: "" }],
};

const GPU = () => {
  const [gpuData, setGpuData] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
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
    fetch(GET_URL, {
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

  // Dialog control
  const handleAddOpen = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const handleClose = () => {
    if (!saving) setOpen(false);
  };

  // Form handling
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

  // Save (POST only)
  const handleSave = async () => {
    if (role !== "admin") {
      setToast({ open: true, msg: "Permission denied", severity: "error" });
      return;
    }

    if (!form.ip.trim()) {
      setToast({ open: true, msg: "IP address is required", severity: "warning" });
      return;
    }

    const sanitizedCards = form.gpu_cards
      .map((c) => ({ model: c.model.trim(), memory_gb: Number(c.memory_gb) || 0 }))
      .filter((c) => c.model);

    const payload = {
      ip: form.ip.trim(),
      status: form.status.trim() || "unknown",
      gpu_cards: sanitizedCards,
      total:
        form.total !== "" && !Number.isNaN(Number(form.total))
          ? Number(form.total)
          : sanitizedCards.length,
    };

    setSaving(true);
    try {
      const res = await fetch(POST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("POST failed");

      // Optimistic update
      setGpuData((prev) => [payload, ...prev]);
      setToast({ open: true, msg: "Row added successfully", severity: "success" });
      setOpen(false);
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to add row", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AppBarHeader />
      <DropdownMenu
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
      />

      <div className="p-8">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <h2 style={{ margin: 0 }}>GPU Information</h2>
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
                <StyledTableCell align="center">IP Address</StyledTableCell>
                <StyledTableCell align="center">GPU Cards</StyledTableCell>
                <StyledTableCell align="center">Total</StyledTableCell>
                <StyledTableCell align="center">Status</StyledTableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {gpuData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No GPU data available.
                  </TableCell>
                </TableRow>
              ) : (
                gpuData.map((row, index) => (
                  <TableRow key={index}>
                    <StyledTableCell align="center">{row.ip || "-"}</StyledTableCell>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Add Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Add GPU Row</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="IP Address"
              value={form.ip}
              onChange={(e) => setForm((p) => ({ ...p, ip: e.target.value }))}
              fullWidth
              required
            />
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
