#!/bin/sh
# MinIO 初始化: 创建默认 bucket jwc-attachments
# 由 docker-compose 中的 minio-init 服务执行(一次性)
set -e

echo "[minio-init] 开始创建 bucket: $MINIO_BUCKET"
mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mb local/"$MINIO_BUCKET" --ignore-existing
mc anonymous set download local/"$MINIO_BUCKET" 2>/dev/null || true
echo "[minio-init] bucket 创建完成: $MINIO_BUCKET"
