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
    AllowOrigins:     []string{"http://localhost:3000", "http://192.168.5.113:3001", "http://192.168.56.1:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: true,
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

    }

    // Admin-only route example
    api.GET("/admin", RoleRequired("admin"), func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Welcome Admin!"})
    })

    log.Println("Server running on port 8092")
    if err := r.Run("0.0.0.0:8092"); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}
