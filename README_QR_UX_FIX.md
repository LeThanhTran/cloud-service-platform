# QR Management UX Fix

Tách rõ ba thao tác trong Admin Service QR modal:

- **Sinh lại QR**: gọi endpoint regenerate, cập nhật preview, không tải file.
- **Tải PNG**: lấy QR hiện tại dạng PNG và tải xuống.
- **Tải SVG**: lấy QR hiện tại dạng SVG và tải xuống.

Không thay đổi database hoặc backend API, không cần migration.
