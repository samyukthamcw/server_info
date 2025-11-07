package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
)

// ---------- Structs for Incoming Data ----------

type CPUInfo struct {
    Vendor string `json:"vendor"`
    Model  string `json:"model"`
    Cores  int    `json:"cores"`
}

type GPUInfo struct {
    Vendor string `json:"vendor"`
    Model  string `json:"model"`
}

type DiskInfo struct {
    Name       string  `json:"name"`
    Vendor     string  `json:"vendor"`
    Model      string  `json:"model"`
    SizeGB     float64 `json:"size_gb"`
    DriveType  string  `json:"drive_type"`
    IsExternal bool    `json:"is_external"`
}

type NetworkInfo struct {
    Name       string `json:"name"`
    MACAddress string `json:"mac_address"`
    IsVirtual  bool   `json:"is_virtual"`
}

type MachineInfo struct {
    Hostname    string        `json:"hostname"`
    UUID        string        `json:"uuid"`
    MemoryGB    float64       `json:"memory_gb"`
    CPUs        []CPUInfo     `json:"cpus"`
    GPUs        []GPUInfo     `json:"gpus"`
    Disks       []DiskInfo    `json:"disks"`
    Network     []NetworkInfo `json:"network"`
    CollectedAt time.Time     `json:"collected_at"`
}

// ---------- Flexible Int Type (accepts number or string) ----------

type FlexibleInt int

func (f *FlexibleInt) UnmarshalJSON(b []byte) error {
    var v interface{}
    if err := json.Unmarshal(b, &v); err != nil {
        return err
    }
    switch val := v.(type) {
    case float64:
        *f = FlexibleInt(int(val))
    case string:
        if val == "" {
            *f = 0
            return nil
        }
        i, err := strconv.Atoi(val)
        if err != nil {
            return fmt.Errorf("invalid int value: %v", val)
        }
        *f = FlexibleInt(i)
    default:
        return fmt.Errorf("unsupported type for FlexibleInt: %T", v)
    }
    return nil
}

// ---------- Struct for Editable Data ----------

type ServerUpdate struct {
    UUID         string      `json:"uuid"`
    ClusterName  string      `json:"cluster_name"`
    Owner        string      `json:"owner"`
    CurrentOwner string      `json:"current_owner"`
    Projects     string      `json:"projects"`
    RamSlots     FlexibleInt `json:"ram_slots"`
    GPUSlots     FlexibleInt `json:"gpu_slots"`
}


// ---------- Handlers ----------

func HandleMachineInfo(c *gin.Context) {
    var data MachineInfo
    if err := c.ShouldBindJSON(&data); err != nil {
        log.Printf("Error parsing JSON: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    clientIP := c.ClientIP()
    disksJSON, _ := json.Marshal(data.Disks)
    gpusJSON, _ := json.Marshal(data.GPUs)

    vcpu := 0
    if len(data.CPUs) > 0 {
        vcpu = data.CPUs[0].Cores
    }

    query := `
    INSERT INTO server_info (
        cluster_name, server_name, ip, system_id,
        projects, owner, current_owner,
        ram_gb, ram_slots, disks,
        vcpu, gpus, gpu_slots, pcie, collected_at
    )
    VALUES (
        NULL, $1, $2, $3,
        NULL, NULL, NULL,
        $4, NULL, $5,
        $6, $7, NULL, NULL, $8
    )
    ON CONFLICT (system_id) DO UPDATE SET
        server_name = EXCLUDED.server_name,
        ip = EXCLUDED.ip,
        ram_gb = EXCLUDED.ram_gb,
        disks = EXCLUDED.disks,
        vcpu = EXCLUDED.vcpu,
        gpus = EXCLUDED.gpus,
        collected_at = EXCLUDED.collected_at;`

    _, err := DB.Exec(
        context.Background(),
        query,
        data.Hostname,
        clientIP,
        data.UUID,
        data.MemoryGB,
        disksJSON,
        vcpu,
        gpusJSON,
        data.CollectedAt,
    )

    if err != nil {
        log.Printf("DB insert/update error: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
        return
    }

    log.Printf("Received data from %s (%s)", data.Hostname, clientIP)
    c.JSON(http.StatusOK, gin.H{"status": "success"})
}

// ---------- PUT /api/serverinfo/:uuid ----------
func UpdateServerInfo(c *gin.Context) {
    uuid := c.Param("uuid")

    var updateData ServerUpdate
    if err := c.ShouldBindJSON(&updateData); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error":   "Invalid JSON payload",
            "details": err.Error(),
        })
        return
    }

    query := `
        UPDATE server_info
        SET
            cluster_name = $1,
            owner = $2,
            current_owner = $3,
            projects = $4,
            ram_slots = $5,
            gpu_slots = $6
        WHERE system_id = $7
        RETURNING id;
    `

    var updatedID int
    err := DB.QueryRow(context.Background(), query,
        updateData.ClusterName,
        updateData.Owner,
        updateData.CurrentOwner,
        updateData.Projects,
        int(updateData.RamSlots),
        int(updateData.GPUSlots),
        uuid,
    ).Scan(&updatedID)

    if err != nil {
        log.Printf("Failed to update server info for UUID %s: %v", uuid, err)
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": fmt.Sprintf("Failed to update server info for UUID %s", uuid),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Server info updated successfully",
        "uuid":    uuid,
        "id":      updatedID,
    })
}

func HandleGetServerInfo(c *gin.Context) {
    rows, err := DB.Query(context.Background(), `
        SELECT
            cluster_name, server_name, ip, system_id,
            projects, owner, current_owner,
            ram_gb, ram_slots, disks,
            vcpu, gpus, gpu_slots, pcie, collected_at
        FROM server_info ORDER BY collected_at DESC;
    `)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var servers []map[string]interface{}

    for rows.Next() {
        var (
            clusterName, serverName, ip, systemID, projects, owner, currentOwner, pcie *string
            ramGB                                                                     *float64
            ramSlots, vcpu, gpuSlots                                                  *int
            disks, gpus                                                               []byte
            collectedAt                                                               time.Time
        )
        err := rows.Scan(
            &clusterName, &serverName, &ip, &systemID,
            &projects, &owner, &currentOwner,
            &ramGB, &ramSlots, &disks,
            &vcpu, &gpus, &gpuSlots, &pcie, &collectedAt,
        )
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        var diskData, gpuData interface{}
        json.Unmarshal(disks, &diskData)
        json.Unmarshal(gpus, &gpuData)

        server := map[string]interface{}{
            "cluster_name":  clusterName,
            "server_name":   serverName,
            "ip":            ip,
            "system_id":     systemID,
            "projects":      projects,
            "owner":         owner,
            "current_owner": currentOwner,
            "ram_gb":        ramGB,
            "ram_slots":     ramSlots,
            "disks":         diskData,
            "vcpu":          vcpu,
            "gpus":          gpuData,
            "gpu_slots":     gpuSlots,
            "pcie":          pcie,
            "collected_at":  collectedAt,
        }
        servers = append(servers, server)
    }

    c.JSON(http.StatusOK, servers)
}

//---------- GET /api/gpuinfo ----------

func HandleGetGPUInfo(c *gin.Context) {
    rows, err := DB.Query(context.Background(), `
        SELECT 
            ip, gpu_cards, total, status, created_at
        FROM gpu_info
        ORDER BY created_at DESC;
    `)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var gpuInfos []map[string]interface{}

    for rows.Next() {
        var (
            ip         *string
            gpuCards   []byte
            total      *int
            status     *string
            createdAt  time.Time
        )

        err := rows.Scan(&ip, &gpuCards, &total, &status, &createdAt)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        var gpuData interface{}
        json.Unmarshal(gpuCards, &gpuData)

        gpuInfo := map[string]interface{}{
            "ip":         ip,
            "gpu_cards":  gpuData,
            "total":      total,
            "status":     status,
            "created_at": createdAt,
        }

        gpuInfos = append(gpuInfos, gpuInfo)
    }

    c.JSON(http.StatusOK, gpuInfos)
}




