# Cài đặt Package PayOS

## Lỗi
```
Module not found: Can't resolve '@payos/node'
```

## Giải pháp

Package `@payos/node` đã được thêm vào `package.json` nhưng chưa được cài đặt vào `node_modules`.

### Cách 1: Sử dụng npm (Khuyến nghị)

Mở terminal/PowerShell trong thư mục project và chạy:

```bash
npm install
```

Hoặc chỉ cài đặt package PayOS:

```bash
npm install @payos/node
```

### Cách 2: Nếu npm không có trong PATH

1. **Tìm đường dẫn Node.js:**
   - Thường ở: `C:\Program Files\nodejs\` hoặc `C:\Users\<username>\AppData\Roaming\npm\`
   - Hoặc cài đặt Node.js từ: https://nodejs.org/

2. **Sử dụng đường dẫn đầy đủ:**
   ```powershell
   & "C:\Program Files\nodejs\npm.cmd" install @payos/node
   ```

3. **Hoặc thêm Node.js vào PATH:**
   - Mở System Properties > Environment Variables
   - Thêm đường dẫn Node.js vào PATH

### Cách 3: Sử dụng package manager khác

Nếu bạn đang dùng yarn:
```bash
yarn add @payos/node
```

Nếu bạn đang dùng pnpm:
```bash
pnpm add @payos/node
```

## Kiểm tra cài đặt

Sau khi cài đặt, kiểm tra:

```bash
# Kiểm tra package đã được cài
ls node_modules/@payos

# Hoặc
dir node_modules\@payos
```

## Sau khi cài đặt

1. **Restart Next.js dev server:**
   ```bash
   # Dừng server (Ctrl+C)
   # Sau đó chạy lại
   npm run dev
   ```

2. **Nếu vẫn lỗi, clear cache:**
   ```bash
   # Xóa .next folder
   rm -rf .next
   # hoặc trên Windows
   rmdir /s .next
   
   # Chạy lại
   npm run dev
   ```

## Troubleshooting

### Lỗi: "npm is not recognized"

**Giải pháp:**
1. Cài đặt Node.js từ https://nodejs.org/ (bao gồm npm)
2. Hoặc sử dụng đường dẫn đầy đủ đến npm

### Lỗi: "EACCES: permission denied"

**Giải pháp:**
Chạy terminal/PowerShell với quyền Administrator

### Lỗi: "Network timeout"

**Giải pháp:**
```bash
npm install @payos/node --registry https://registry.npmjs.org/
```

## Xác nhận

Sau khi cài đặt thành công, file `lib/payos.ts` sẽ có thể import `@payos/node` mà không bị lỗi.
