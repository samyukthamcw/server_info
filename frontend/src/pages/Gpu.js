import React, { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
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

const GPU = () => {
  const [gpuData, setGpuData] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState("");

  // ✅ Fetch GPU info from backend
  useEffect(() => {
  const token = localStorage.getItem("token"); 

  fetch("http://192.168.6.87:8092/api/gpuinfo", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, 
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch GPU info");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Fetched GPU Data:", data);
      setGpuData(data);
    })
    .catch((error) => {
      console.error("Error fetching GPU info:", error);
    });
}, []); // ✅ empty dependency array ensures it runs once


  return (
    <div>
      {/* Dropdown */}
      <DropdownMenu
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
      />
    <div className="p-8">
      <h2>GPU Information</h2>

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
                <TableCell colSpan={5} align="center">
                  No GPU data available.
                </TableCell>
              </TableRow>
            ) : (
              gpuData.map((row, index) => (
                <TableRow key={index}>
                  <StyledTableCell>{row.ip || "-"}</StyledTableCell>
                  <StyledTableCell align="right">
                    {Array.isArray(row.gpu_cards)
                      ? row.gpu_cards.map((gpu, i) => (
                          <div key={i}>
                            {gpu.model} ({gpu.memory_gb} GB)
                          </div>
                        ))
                      : "N/A"}
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    {row.total || 0}
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    {row.status || "-"}
                  </StyledTableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
    </div>
  );
};

export default GPU;
