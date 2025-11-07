import React from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MemoryIcon from "@mui/icons-material/Memory";

const drawerWidth = 200; // Width of the sidebar

const DrawerMenu = ({ selectedCluster, setSelectedCluster }) => {
  const navigate = useNavigate();

  const handleSelect = (value) => {
    setSelectedCluster(value);
    if (value === "gpu-info") {
      navigate("/gpu");
    } else if (value === "cluster-info") {
      navigate("/dashboard");
    }
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#04325cff",
          color: "white",
          top: 64,
          height: "calc(100% - 64px)",
        },
      }}
    >
      <Box sx={{ overflow: "auto", mt: 1 }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleSelect("cluster-info")}
              selected={selectedCluster === "cluster-info"}
              sx={{
                "&.Mui-selected": { backgroundColor: "#04325cff" },
                "&:hover": { backgroundColor: "#04325cff" },
              }}
            >
              <ListItemText primary="Cluster Machine Info" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleSelect("gpu-info")}
              selected={selectedCluster === "gpu-info"}
              sx={{
                "&.Mui-selected": { backgroundColor: "#04325cff" },
                "&:hover": { backgroundColor: "#04325cff" },
              }}
            >
              <ListItemText primary="GPU Info" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default DrawerMenu;
