# Docker Setup Guide - Face Attendance System

Hướng dẫn chi tiết để chạy project bằng Docker.

## Prerequisites

- Docker Desktop (hoặc Docker Engine)
- Docker Compose

## Cấu trúc Docker

```
├── Dockerfile                    # Backend Spring Boot
├── frontend-react/Dockerfile     # Frontend React
├── docker-compose.yml            # Orchestration
├── .dockerignore                 # Ignore files for backend
└── frontend-react/.dockerignore  # Ignore files for frontend
```

## 🚀 Chạy toàn bộ hệ thống

### 1. Build và khởi chạy tất cả services

```bash
docker-compose up --build
```

### 2. Chỉ khởi chạy (nếu đã build)

```bash
docker-compose up
```

### 3. Chạy ở background

```bash
docker-compose up -d
```

## 📋 URLs truy cập

- **Frontend (React):** http://localhost:3000
- **Backend (Spring Boot):** http://localhost:8080
- **API Docs:** http://localhost:8080/swagger-ui.html
- **MySQL:** localhost:3306

## 🛠️ Các lệnh hữu ích

### Xem logs

```bash
# Tất cả services
docker-compose logs -f

# Chỉ backend
docker-compose logs -f backend

# Chỉ frontend
docker-compose logs -f frontend

# Chỉ database
docker-compose logs -f mysql
```

### Dừng services

```bash
# Dừng tất cả
docker-compose down

# Dừng và xóa volumes (xóa toàn bộ data)
docker-compose down -v
```

### Restart services

```bash
docker-compose restart
```

### Xem trạng thái

```bash
docker-compose ps
```

### Truy cập container

```bash
# Backend
docker-compose exec backend /bin/sh

# Frontend
docker-compose exec frontend /bin/sh

# MySQL
docker-compose exec mysql mysql -u root -p
```

## 📦 Build riêng từng service

### Build backend

```bash
docker build -t face-attendance-backend:latest .
```

### Build frontend

```bash
docker build -t face-attendance-frontend:latest ./frontend-react
```

### Chạy backend container riêng

```bash
docker run --name face-attendance-backend \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/face_attendance_activity \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e SPRING_DATASOURCE_PASSWORD=yourpassword \
  -p 8080:8080 \
  face-attendance-backend:latest
```

## 🐛 Troubleshooting

### MySQL connection refused

```bash
# Kiểm tra MySQL running
docker-compose ps

# Xem logs MySQL
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Backend không kết nối được database

```bash
# Kiểm tra backend logs
docker-compose logs -f backend

# Verify database name và credentials trong docker-compose.yml
```

### Frontend không load

```bash
# Check frontend logs
docker-compose logs -f frontend

# Verify port 3000 không bị dùng
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

### Xóa toàn bộ dữ liệu và rebuild

```bash
docker-compose down -v
docker-compose up --build
```

## 🔐 Security Notes (Production)

Trước khi deploy to production:

1. **JWT Secret:** Thay đổi giá trị `JWT_SECRET` trong docker-compose.yml
2. **Database Password:** Đặt password mạnh cho `MYSQL_ROOT_PASSWORD` và `MYSQL_PASSWORD`
3. **Environment Variables:** Sử dụng `.env` file thay vì hardcode

Tạo file `.env`:

```env
MYSQL_ROOT_PASSWORD=your_strong_password
MYSQL_PASSWORD=your_user_password
JWT_SECRET=your_jwt_secret_key
```

Cập nhật docker-compose.yml:

```yaml
environment:
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
  MYSQL_PASSWORD: ${MYSQL_PASSWORD}
  JWT_SECRET: ${JWT_SECRET}
```

## 📊 Performance Tips

1. **Memory allocation:** Docker Desktop → Settings → Resources
2. **Optimize images:** Sử dụng multi-stage builds (đã làm)
3. **Caching:** Arrange Dockerfile layers efficiently
4. **Network:** Sử dụng named networks (đã làm)

## 🔄 CI/CD Integration

Có thể thêm vào GitHub Actions, GitLab CI, v.v:

```bash
# Build images
docker-compose build

# Push to registry
docker tag face-attendance-backend:latest your-registry/backend:latest
docker push your-registry/backend:latest
```

## 📝 Monitoring

### Sử dụng Portainer (Optional)

```bash
docker run -d -p 8000:8000 -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  portainer/portainer-ce
```

Truy cập: http://localhost:9000

---

**Chúc bạn thành công! 🚀**
