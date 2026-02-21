# ============================================================
# Dockerfile for React Frontend (Fixed for Rollup/Vite)
# ============================================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./

# SỬA LỖI: Buộc cài đặt binary Rollup tương thích với Linux Alpine
# Sử dụng --save-optional để đảm bảo Vite tìm thấy đúng module khi build
RUN npm install @rollup/rollup-linux-x64-musl --save-optional
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================================
# Stage 2: Runtime stage (Khuyên dùng Nginx để chạy Frontend nhẹ hơn)
# ============================================================
FROM node:20-alpine

WORKDIR /app

# Cài đặt serve để chạy file tĩnh
RUN npm install -g serve

# Copy các file đã build từ stage builder
COPY --from=builder /build/dist ./dist

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Chạy ứng dụng
CMD ["serve", "-s", "dist", "-l", "3000"]