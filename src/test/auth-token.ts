const TEST_JWT_HEADER = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0"

export const FUTURE_ACCESS_TOKEN = `${TEST_JWT_HEADER}.eyJleHAiOjQxMDI0NDQ4MDB9.test-signature`

export const ALTERNATE_FUTURE_ACCESS_TOKEN = `${TEST_JWT_HEADER}.eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6InJlc3RvcmVkIn0.test-signature`

export const EXPIRED_ACCESS_TOKEN = `${TEST_JWT_HEADER}.eyJleHAiOjF9.test-signature`
