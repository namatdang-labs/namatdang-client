#!/usr/bin/env bash

set -Eeuo pipefail

readonly DIST_DIR="${DIST_DIR:-dist}"

if [[ -z "${S3_BUCKET_NAME:-}" ]]; then
  echo "S3_BUCKET_NAME이 설정되지 않았습니다." >&2
  exit 1
fi

if [[ "${S3_BUCKET_NAME}" == s3://* ]]; then
  echo "S3_BUCKET_NAME에는 s3:// 없이 버킷 이름만 입력해야 합니다." >&2
  exit 1
fi

if [[ ! -f "${DIST_DIR}/index.html" ]]; then
  echo "${DIST_DIR}/index.html을 찾을 수 없습니다. 먼저 프론트엔드를 빌드하세요." >&2
  exit 1
fi

command -v aws >/dev/null 2>&1 || {
  echo "AWS CLI를 찾을 수 없습니다." >&2
  exit 1
}

readonly S3_URI="s3://${S3_BUCKET_NAME}"

echo "S3 버킷 접근 권한을 확인합니다."
aws s3api head-bucket --bucket "${S3_BUCKET_NAME}"

echo "일반 정적 파일을 업로드합니다."
aws s3 sync "${DIST_DIR}/" "${S3_URI}/" \
  --exclude "index.html" \
  --exclude "assets/*" \
  --cache-control "public,max-age=300" \
  --only-show-errors

if [[ -d "${DIST_DIR}/assets" ]]; then
  echo "해시된 빌드 자산을 업로드합니다."
  aws s3 sync "${DIST_DIR}/assets/" "${S3_URI}/assets/" \
    --cache-control "public,max-age=31536000,immutable" \
    --only-show-errors
fi

echo "새 index.html을 마지막에 반영합니다."
aws s3 cp "${DIST_DIR}/index.html" "${S3_URI}/index.html" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "no-cache,max-age=0,must-revalidate" \
  --only-show-errors

echo "S3 배포가 완료됐습니다."
