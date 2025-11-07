package main

import (
    "log"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
	"github.com/gin-contrib/cors"

)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("Warning: .env not found, using system environment variables")
    }

    // Initialize database
    InitDB()

    // Setup Gin router
    r := gin.Default()

	r.Use(cors.New(cors.Config{
    AllowAllOrigins:  true,
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: false,
}))





    // ---------- Public routes ----------
    r.POST("/register", RegisterUser)
    r.POST("/login", LoginUser)
    

    // ---------- Protected routes ----------
    api := r.Group("/api")
    api.Use(TokenRequired())
    {
        // Machine info routes
        api.POST("/machineinfo", HandleMachineInfo)

        // Server info routes
        api.GET("/serverinfo", HandleGetServerInfo)
        api.PUT("/serverinfo/:uuid", UpdateServerInfo)
        api.GET("/gpuinfo", HandleGetGPUInfo)
        api.POST("/gpuinfo", HandleAddGPUInfo)
        api.PUT("/gpuinfo/:id", HandleUpdateGPUInfo)
        api.DELETE("/gpuinfo/:id", HandleDeleteGPUInfo)

    }


    log.Println("Server running on port 8092")
    if err := r.Run("0.0.0.0:8092"); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}
