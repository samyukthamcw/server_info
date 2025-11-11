# Use official Go image
FROM golang:1.25

WORKDIR /app

# Copy Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod tidy

# Copy the source code
COPY . .

# Build the Go binary
RUN go build -o main .

EXPOSE 8092

# Run the binary directly
CMD ["./main"]
