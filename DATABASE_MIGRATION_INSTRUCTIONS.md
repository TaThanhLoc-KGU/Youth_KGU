# Database Migration Instructions

## Issue
The backend is running but cannot authenticate because the `taikhoan` table is missing the new columns added during the account management system implementation.

**Error**: `Unknown column 'tk1_0.ngay_phe_duyet' in 'field list'`

## Solution Options

### Option 1: Run SQL Script (Recommended)
Execute the following SQL commands in your MySQL client (MySQL Workbench, phpMyAdmin, or command line):

```sql
-- Use the correct database
USE face_attendance_activity;

-- Add missing columns to taikhoan table
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS ban_chuyen_mon VARCHAR(50);
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS ho_ten VARCHAR(255);
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS avatar LONGTEXT;
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS trang_thai_phe_duyet VARCHAR(50) DEFAULT 'CHO_PHE_DUYET';
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS ngay_phe_duyet DATETIME;
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS ghi_chu LONGTEXT;
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS so_dien_thoai VARCHAR(20);
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS ngay_sinh DATE;
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS gioi_tinh VARCHAR(20);
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Verify the columns were added
DESCRIBE taikhoan;
```

### Option 2: Use Database GUI Tool
1. **MySQL Workbench**:
   - Open MySQL Workbench
   - Connect to localhost:3306 with username `root`
   - Select database `face_attendance_activity`
   - Click "File" → "Open SQL Script"
   - Select `add_taikhoan_columns.sql` in the project root
   - Click the lightning bolt to execute

2. **phpMyAdmin**:
   - Navigate to http://localhost/phpmyadmin
   - Select database `face_attendance_activity`
   - Go to "SQL" tab
   - Copy the SQL commands above
   - Click "Go"

### Option 3: Let Hibernate Auto-Update (Less Reliable)
If you've already added the columns via Option 1, the next time the backend starts, Hibernate will verify the schema matches. However, do NOT rely on this alone for the initial migration since `ddl-auto=update` sometimes misses column additions.

## After Migration

Once the columns are added:

1. **Restart the backend**:
   ```bash
   # If running in IntelliJ/VSCode - just restart the Spring Boot application
   # Or from Maven:
   mvn spring-boot:run
   ```

2. **Test authentication**:
   - Frontend should be able to reach the login endpoint
   - Try logging in with `admin` / `admin` (or your test credentials)

3. **Verify in logs**:
   - You should no longer see "Unknown column 'tk1_0.ngay_phe_duyet'" errors
   - The login should succeed and return a JWT token

## New Columns Added

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| email | VARCHAR(255) | - | User email (@vnkgu.edu.vn) |
| ban_chuyen_mon | VARCHAR(50) | - | Department enum |
| ho_ten | VARCHAR(255) | - | Full name |
| avatar | LONGTEXT | - | Base64 encoded avatar image |
| trang_thai_phe_duyet | VARCHAR(50) | CHO_PHE_DUYET | Approval status |
| ngay_phe_duyet | DATETIME | - | Approval date |
| ghi_chu | LONGTEXT | - | Notes/comments |
| so_dien_thoai | VARCHAR(20) | - | Phone number |
| ngay_sinh | DATE | - | Date of birth |
| gioi_tinh | VARCHAR(20) | - | Gender |
| created_at | DATETIME | CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | CURRENT_TIMESTAMP | Last update timestamp |

## Related Files
- SQL Script: `d:\Youth_KGU\add_taikhoan_columns.sql`
- TaiKhoan Entity: `src/main/java/com/tathanhloc/faceattendance/Entity/TaiKhoan.java`
- Application Config: `src/main/resources/application.properties` (Line 18: `spring.jpa.hibernate.ddl-auto=update`)
