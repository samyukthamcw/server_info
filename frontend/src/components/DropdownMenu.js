import React from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

const DropdownMenu = ({ selectedCluster, setSelectedCluster }) => {
  const navigate = useNavigate();

  const handleChange = (event) => {
    const value = event.target.value;
    setSelectedCluster(value);

    if (value === "gpu-info") {
      navigate("/gpu");
    } else if (value === "cluster-info") {
      navigate("/dashboard");
    }
  };

  return (
    <Box
    >
      <FormControl sx={{ minWidth: 200, background: "white" }}>
        <InputLabel id="cluster-select-label">Select View</InputLabel>
        <Select
          labelId="cluster-select-label"
          value={selectedCluster}
          label="Select View"
          onChange={handleChange}
        >
          <MenuItem value="cluster-info">
            <em>Cluster Machine Info</em>
          </MenuItem>
          <MenuItem value="gpu-info">
            <em>GPU Info</em>
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default DropdownMenu;
