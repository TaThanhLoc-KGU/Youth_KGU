# Account Management Technical Guide

## Overview
The account management system has been rebuilt with the following components:
- Manual account creation
- Bulk account creation from Excel
- Role assignment via ChucVu (Position)
- Ban (Department) assignment
- Account approval workflow

## Architecture

### Backend Structure

#### 1. Models
**TaiKhoan (Account)**
- Long id (PK)
- String username (unique)
- String email (unique)
- String passwordHash
- VaiTroEnum vaiTro (direct role)
- ChucVu chucVu (position/role via FK)
- Ban ban (department via FK)
- SinhVien sinhVien (student link)
- GiangVien giangVien (lecturer link)
- ChuyenVien chuyenVien (specialist link)

**ChucVu (Position)**
- String maChucVu (PK, e.g., "CV001")
- String tenChucVu (name)
- String thuocBan (belongs to: DOAN, HOI, etc.)
- String vaiTroKey (enum key: BI_THU_DOAN, etc.)

**Ban (Department)**
- String maBan (PK, e.g., "BAN001")
- String tenBan (name)
- String loaiBan (type: DOAN, HOI, DOI_CLB_BAN)

#### 2. Services

**AuthService**
- login(AuthRequest) - Authenticate user
- register(TaiKhoanDTO) - Register new account with manual data
- changePassword() - Change account password
- forgotPassword() - Reset password
- refreshToken() - Refresh JWT token

**TaiKhoanService**
- getAll() - List all accounts
- getById(Long id) - Get single account
- getByUsername(String username) - Find by username
- create(TaiKhoanDTO) - Create new account
- update(Long id, TaiKhoanDTO) - Update account
- softDelete(Long id) - Deactivate account

**BulkAccountCreationService**
- createAccountsBulk(BulkAccountCreationRequest) - Process bulk creation
- getRoleFromBCH() - Get role from BCH membership
- createAccount() - Create single account with settings
- generateTempPassword() - Generate secure temporary password

**ChucVuToRoleMapper**
- mapChucVuToRole(ChucVu) - Map position to role
- getHighestRole(List<VaiTroEnum>) - Select highest priority role

#### 3. DTOs

**TaiKhoanDTO**
```java
- Long id
- String username
- String email
- String hoTen
- String passwordHash (for creation only)
- Long maChucVu (converted from "CV001" → 1)
- Long maBan (converted from "BAN001" → 1)
- String tenChucVu (display only)
- String tenBan (display only)
```

**BulkAccountCreationRequest**
```java
- List<String> maSinhVienList
- List<String> maGiangVienList
- List<String> maChuyenVienList
- Boolean assignRoleFromBCH
- Boolean sendWelcomeEmail
- String defaultPassword
```

**BulkAccountCreationResult**
```java
- int totalRequested
- int successCount
- int failedCount
- int skippedCount
- List<AccountCreationDetail> successAccounts
- List<AccountCreationError> failedAccounts
- Map<String, Integer> roleStatistics
```

### Frontend Structure

#### 1. Services

**taikhoanService.js**
- getAll() - Fetch all accounts
- getById(id) - Fetch single account
- create(data) - Create new account
- update(id, data) - Update account
- delete(id) - Delete account
- searchByUsername(keyword) - Search accounts

**bulkAccountService.js**
- createBulk(data) - Submit bulk account creation
- previewBulk(data) - Preview before creation
- downloadTemplate() - Download Excel template
- getBCHMembers() - Get BCH members for role lookup

#### 2. Components

**Taikhoan.jsx** (Main page)
- Account listing with pagination
- Search functionality
- Create/Edit/Delete modals
- Bulk upload tab
- Excel import with preview
- Role and status filtering

**CreateAccountModal**
- Form for manual account creation
- ChucVu (position) dropdown
- Ban (department) dropdown
- Link to Student/Lecturer/Specialist

**Step1DataSource.jsx**
- Choose data source (Excel/Manual/BCH)
- File upload with drag-drop
- Manual row input

**Step2Configuration.jsx**
- Role assignment options
- Email notification settings
- Default password configuration

## Data Flow

### Manual Account Creation
```
User fills form → CreateAccountModal
  ↓
Form validation (frontend)
  ↓
POST /api/taikhoan/create
  ↓
TaiKhoanService.create()
  ↓
ChucVu lookup by String ID (CV001 → CV001)
Ban lookup by String ID (BAN001 → BAN001)
  ↓
TaiKhoan entity saved
  ↓
Success response with created account
```

### Bulk Account Creation
```
Upload Excel/Select students → Step1DataSource
  ↓
Configure options → Step2Configuration
  ↓
POST /api/accounts/bulk/create
  ↓
BulkAccountCreationService.createAccountsBulk()
  ↓
For each maSinhVien:
  - Check if account exists
  - Load SinhVien entity
  - Determine role (via getRoleFromBCH or default)
  - Create TaiKhoan with vaiTro
  ↓
Return result with statistics
```

### Role Determination Priority
1. If direct vaiTro provided → use it
2. If ChucVu selected:
   - Check ChucVu.vaiTroKey → use as VaiTroEnum
   - Fallback to ChucVu.thuocBan (DOAN → THANH_VIEN_DOAN)
3. If BCH role assignment enabled:
   - Find BCH entry for student/lecturer
   - Get highest priority role from ChucVu relationships
4. Default based on entity type (SINH_VIEN, GIANG_VIEN)

## ID Conversion System

### Why Conversion is Needed
- **Backend:** ChucVu and Ban use String IDs (database design)
- **Frontend:** DTO uses Long IDs (easier for form selects)
- **Conversion:** Happens at DTO layer

### Conversion Rules

**String to Long (Backend → Frontend):**
```java
ChucVu.maChucVu = "CV001"
Extract: "001" = 1
→ DTO.maChucVu = 1L
```

**Long to String (Frontend → Backend):**
```java
DTO.maChucVu = 1L
Format: "CV" + String.format("%03d", 1) = "CV001"
→ ChucVu lookup by "CV001"
```

## API Endpoints

### Account Management
```
GET    /api/taikhoan              - List all accounts
POST   /api/taikhoan              - Create account
GET    /api/taikhoan/{id}         - Get account
PUT    /api/taikhoan/{id}         - Update account
DELETE /api/taikhoan/{id}         - Delete account (soft)
```

### Bulk Operations
```
POST   /api/accounts/bulk/create  - Create accounts in bulk
POST   /api/accounts/bulk/preview - Preview bulk data
GET    /api/accounts/bulk/template - Download Excel template
```

### Auth
```
POST   /api/auth/login            - Authenticate
POST   /api/auth/register         - Register new account
POST   /api/auth/refresh-token    - Refresh JWT
```

## Error Handling

### Frontend
- QueryClient errors caught by React Query
- API errors show toast notifications
- Form validation shows inline errors
- File upload errors display in alert

### Backend
- EntityNotFoundException for missing records
- IllegalArgumentException for validation
- GlobalExceptionHandler provides consistent error format
- Bulk creation returns partial success with error details

## Role Mapping Examples

### Example 1: Direct ChucVu
```
ChucVu("CV001", "Bí thư Đoàn", "DOAN", "BI_THU_DOAN")
→ VaiTroEnum.BI_THU_DOAN (from vaiTroKey)
```

### Example 2: Fallback thuocBan
```
ChucVu("CV002", "Phó Chủ tịch", "DOAN", null)
→ VaiTroEnum.THANH_VIEN_DOAN (from thuocBan="DOAN")
```

### Example 3: Multiple Roles (Highest Priority)
```
BCHChucVu[
  ChucVu("CV001", "Bí thư", "DOAN", "BI_THU_DOAN"),    // CAP_0
  ChucVu("CV003", "Thành viên", "DOAN", "THANH_VIEN")   // CAP_4
]
→ VaiTroEnum.BI_THU_DOAN (CAP_0 is highest)
```

## Testing Checklist

### Manual Creation
- [ ] Create account with ChucVu
- [ ] Create account with Ban
- [ ] Create account with both
- [ ] Verify account appears in list
- [ ] Edit account fields
- [ ] Change role
- [ ] Deactivate account

### Bulk Creation
- [ ] Upload Excel with 1 row
- [ ] Upload Excel with 10+ rows
- [ ] Verify all rows processed
- [ ] Check error handling
- [ ] Test with BCH role assignment
- [ ] Verify email sending (if enabled)

### Data Validation
- [ ] Email uniqueness enforced
- [ ] Username uniqueness enforced
- [ ] Password minimum length (6 chars)
- [ ] Role assignment from ChucVu works
- [ ] Ban assignment works
- [ ] Student/Lecturer/Specialist linking works

## Troubleshooting

### Issue: Only 1 row created from Excel
**Solution:** Verify excelParser.js parseExcelFile function properly parses all rows

### Issue: "No QueryClient set"
**Solution:** Ensure StudentForm imports from '@tanstack/react-query' not 'react-query'

### Issue: ChucVu/Ban not found
**Solution:** Verify ID conversion is working and records exist with correct IDs

### Issue: Role not assigned from BCH
**Solution:** Check ChucVu.vaiTroKey is properly set in database, or thuocBan has correct value
