# ============================================================
# Dockerfile for Spring Boot Backend (Face Attendance System)
# ============================================================

# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code
COPY src src

# Build the application
RUN mvn clean package -DskipTests

# ============================================================
# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Create uploads directory for file uploads and QR codes
RUN mkdir -p /app/uploads/qrcodes /app/uploads/temp

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

# You can also use these options if needed:
# ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-jar", "app.jar"]
