# Multi-stage Dockerfile cho Backend Quản Lý Sinh Viên (Node.js + pnpm + TypeScript)

# Stage 1: Build
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Kích hoạt corepack để sử dụng pnpm
RUN corepack enable

# Sao chép manifest dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Sao chép cấu hình TypeScript và mã nguồn
COPY tsconfig*.json ./
COPY src ./src
COPY docs ./docs

# Biên dịch TypeScript sang JavaScript trong thư mục dist/
RUN pnpm build

# Stage 2: Production Runtime
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
RUN corepack enable

# Cài đặt chỉ production dependencies để tối ưu kích thước image
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Sao chép artifact dist/ và tài liệu OpenAPI từ stage build
COPY --from=build /app/dist ./dist
COPY docs ./docs

# Tạo thư mục public/uploads cho tính năng lưu trữ avatar
RUN mkdir -p public/uploads

# Mở cổng 5000 cho HTTP Server
EXPOSE 5000

# Lệnh khởi chạy ứng dụng
CMD ["node", "dist/server.js"]
