package main

import (
    "context"
    "net/http"
    "os"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
)

var secretKey = []byte(os.Getenv("SECRET_KEY"))

// Structs for user and JWT
type User struct {
    ID       int    `json:"id"`
    Username string `json:"username"`
    Password string `json:"password"`
    Email    string `json:"email"`
    Role     string `json:"role"`
}

type Claims struct {
    UserID   int    `json:"user_id"`
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}

// ---------- Register User ----------
func RegisterUser(c *gin.Context) {
    var input User
    if err := c.BindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
        return
    }

    if input.Username == "" || input.Password == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Username and password required"})
        return
    }

    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
        return
    }

    _, err = DB.Exec(context.Background(),
        "INSERT INTO users (username, password_hash, email, role) VALUES ($1, $2, $3, $4)",
        input.Username, string(hashedPassword), input.Email, input.Role,
    )

    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

// ---------- Login User ----------
func LoginUser(c *gin.Context) {
    var input User
    if err := c.BindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
        return
    }

    var user User
    err := DB.QueryRow(context.Background(),
        "SELECT id, username, password_hash, role FROM users WHERE username=$1", input.Username,
    ).Scan(&user.ID, &user.Username, &user.Password, &user.Role)

    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }

    err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }

    // Create token
    expiration := time.Now().Add(2 * time.Hour)
    claims := &Claims{
        UserID:   user.ID,
        Username: user.Username,
        Role:     user.Role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expiration),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString(secretKey)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

// ---------- Protected Route ----------
func ProtectedRoute(c *gin.Context) {
    user, _ := c.Get("user")
    c.JSON(http.StatusOK, gin.H{
        "message": "Access granted",
        "user":    user,
    })
}
