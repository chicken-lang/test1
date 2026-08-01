-- Step 1: Create jwc user (or update password)
ALTER ROLE jwc WITH LOGIN PASSWORD '123456';

-- Step 2: Create database jwc_dev owned by jwc
CREATE DATABASE jwc_dev OWNER jwc;

-- Step 3: Grant privileges (run on jwc_dev database)
-- Connect to jwc_dev and grant
ALTER DATABASE jwc_dev OWNER TO jwc;