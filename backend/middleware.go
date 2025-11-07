package main

import (
    "net/http"
	"fmt"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

// Middleware: verify JWT token
func TokenRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenHeader := c.GetHeader("Authorization")
        if tokenHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing token"})
            c.Abort()
            return
        }
		fmt.Println("Authorization header:", c.GetHeader("Authorization"))

        tokenStr := strings.TrimPrefix(tokenHeader, "Bearer ")
        claims := &Claims{}
        token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
            return secretKey, nil
        })
		fmt.Printf("secretKey length: %d\n", len(secretKey))


        if err != nil || !token.Valid {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
            c.Abort()
            return
        }

        // attach user info to request
        c.Set("user", claims)
        c.Next()
    }
}


