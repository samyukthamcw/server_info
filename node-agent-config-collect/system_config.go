package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/jaypipes/ghw"
)

type DiskInfo struct {
	Name       string  `json:"name"`
	Vendor     string  `json:"vendor"`
	Model      string  `json:"model"`
	SizeGB     float64 `json:"size_gb"`
	DriveType  string  `json:"drive_type"`
	IsExternal bool    `json:"is_external"`
}

type CPUInfo struct {
	Vendor string `json:"vendor"`
	Model  string `json:"model"`
	Cores  int    `json:"cores"`
}

type GPUInfo struct {
	Vendor string `json:"vendor"`
	Model  string `json:"model"`
}

type NetworkInfo struct {
	Name       string `json:"name"`
	MACAddress string `json:"mac_address"`
	// IPAddresses []string `json:"ip_addresses"`
	IsVirtual bool `json:"is_virtual"`
}

type HardwareInfo struct {
	Hostname  string        `json:"hostname"`
	UUID      string        `json:"uuid"`
	MemoryGB  float64       `json:"memory_gb"`
	CPUs      []CPUInfo     `json:"cpus"`
	GPUs      []GPUInfo     `json:"gpus"`
	Disks     []DiskInfo    `json:"disks"`
	Network   []NetworkInfo `json:"network"`
	Collected string        `json:"collected_at"`
}

func getSystemUUID() string {
	out, err := exec.Command("bash", "-c", "dmidecode -s system-uuid 2>/dev/null").Output()
	if err != nil {
		return "unknown"
	}
	uuid := strings.TrimSpace(string(out))
	if uuid == "" || strings.Contains(uuid, "Permission denied") {
		return "unknown"
	}
	return uuid
}

func collectSystemInfo() HardwareInfo {
	var hw HardwareInfo

	// Hostname
	if hn, err := os.Hostname(); err == nil {
		hw.Hostname = hn
	}

	// UUID
	hw.UUID = getSystemUUID()

	// Memory
	if mem, err := ghw.Memory(); err == nil {
		hw.MemoryGB = float64(mem.TotalPhysicalBytes) / (1024 * 1024 * 1024)
	}

	// CPU
	if cpu, err := ghw.CPU(); err == nil {
		for _, proc := range cpu.Processors {
			hw.CPUs = append(hw.CPUs, CPUInfo{
				Vendor: proc.Vendor,
				Model:  proc.Model,
				Cores:  int(proc.NumCores),
			})
		}
	}

	// GPU
	if gpu, err := ghw.GPU(); err == nil {
		for _, card := range gpu.GraphicsCards {
			if card.DeviceInfo != nil {
				hw.GPUs = append(hw.GPUs, GPUInfo{
					Vendor: card.DeviceInfo.Vendor.Name,
					Model:  card.DeviceInfo.Product.Name,
				})
			}
		}
	}

	// Disks — only physical (sd*)
	if block, err := ghw.Block(); err == nil {
		for _, disk := range block.Disks {
			if strings.HasPrefix(disk.Name, "sd") {
				ctrl := strings.ToLower(disk.StorageController.String())
				isExternal := strings.Contains(ctrl, "usb")

				hw.Disks = append(hw.Disks, DiskInfo{
					Name:       disk.Name,
					Vendor:     disk.Vendor,
					Model:      disk.Model,
					SizeGB:     float64(disk.SizeBytes) / (1024 * 1024 * 1024),
					DriveType:  disk.DriveType.String(),
					IsExternal: isExternal,
				})
			}
		}
	}

	// Network — only physical
	if netInfo, err := ghw.Network(); err == nil {
		for _, nic := range netInfo.NICs {
			if !nic.IsVirtual && nic.MacAddress != "" &&
				(strings.HasPrefix(nic.Name, "en") || strings.HasPrefix(nic.Name, "eth")) {

				// var ips []string
				// if iface, err := net.InterfaceByName(nic.Name); err == nil {
				// 	if addrs, err := iface.Addrs(); err == nil {
				// 		for _, addr := range addrs {
				// 			ips = append(ips, addr.String())
				// 		}
				// 	}
				// }

				hw.Network = append(hw.Network, NetworkInfo{
					Name:       nic.Name,
					MACAddress: nic.MacAddress,
					// IPAddresses: ips,
					IsVirtual: nic.IsVirtual,
				})
			}
		}
	}

	hw.Collected = time.Now().Format(time.RFC3339)
	return hw
}

func sendToBackend(hw HardwareInfo) {
	jsonData, _ := json.MarshalIndent(hw, "", "  ")

	//  Replace with your backend endpoint:
	url := "http://localhost:8092/machineinfo"

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Failed to send data to backend: %v\n", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("Data sent successfully (status: %s)\n", resp.Status)
}

func main() {
	for {
		hw := collectSystemInfo()
		fmt.Println("Collected hardware info:")
		jsonData, _ := json.MarshalIndent(hw, "", "  ")
		fmt.Println(string(jsonData))

		// Send to backend
		sendToBackend(hw)

		// Sleep for 4 hours
		time.Sleep(4 * time.Hour)
	}
}
