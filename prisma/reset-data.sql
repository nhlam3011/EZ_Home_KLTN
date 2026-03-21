-- Script xóa toàn bộ dữ liệu (trừ admin)
-- Chạy trong Prisma Studio hoặc psql

-- Xóa theo thứ tự từ con đến cha (tránh lỗi foreign key)
-- Thứ tự đúng:

DELETE FROM "Payment";
DELETE FROM "Invoice";
DELETE FROM "MeterReading";
DELETE FROM "ContractOccupant";
DELETE FROM "Contract";        -- Xóa Contract trước Room
DELETE FROM "ServiceOrder";
DELETE FROM "Issue";
DELETE FROM "Message";
DELETE FROM "Post";
DELETE FROM "Document";
DELETE FROM "Asset";
DELETE FROM "Room";           -- Xóa Room sau Contract
DELETE FROM "Building";
DELETE FROM "User" WHERE role = 'TENANT';
DELETE FROM "OwnerContract";
DELETE FROM "ContractRenewalRequest";
DELETE FROM "AiForecast";
DELETE FROM "Settings";
DELETE FROM "Service";
