package main

import (
    "context"
    "log"
    "os"

    "github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func InitDB() {
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        log.Fatal("DATABASE_URL not set in .env")
    }

    // Create connection pool
    pool, err := pgxpool.New(context.Background(), dbURL)
    if err != nil {
        log.Fatalf("Unable to connect to database: %v\n", err)
    }

    DB = pool

    // ---------- USERS TABLE ----------
    _, err = DB.Exec(context.Background(), `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `)
    if err != nil {
        log.Fatalf("Failed to create users table: %v\n", err)
    }

    // ---------- SERVER_INFO TABLE ----------
    _, err = DB.Exec(context.Background(), `
        CREATE TABLE IF NOT EXISTS server_info (
            id SERIAL PRIMARY KEY,
            cluster_name TEXT,
            server_name TEXT,
            ip TEXT,
            system_id UUID UNIQUE,
            projects TEXT,
            owner TEXT,
            current_owner TEXT,
            ram_gb NUMERIC,
            ram_slots INT,
            disks JSONB,
            vcpu INT,
            gpus JSONB,
            gpu_slots INT,
            pcie TEXT,
            collected_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)
    if err != nil {
        log.Fatalf("Failed to create server_info table: %v\n", err)
    }

    // ---------- GPU_INFO TABLE ----------
    _, err = DB.Exec(context.Background(), `
        CREATE TABLE IF NOT EXISTS gpu_info (
            id SERIAL PRIMARY KEY,
            ip TEXT NOT NULL,
            gpu_cards JSONB,
            total INT,
            status TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)
    if err != nil {
        log.Fatalf("Failed to create gpu_info table: %v\n", err)
    }

    log.Println("Database initialized successfully — tables ensured (users, server_info, gpu_info).")
}
