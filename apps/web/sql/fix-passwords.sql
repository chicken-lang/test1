-- 修复远程数据库用户密码：明文 → bcrypt(sha256("123456"))
-- 原始密码: 123456
-- 前端 sha256("123456") = 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
-- 后端 bcrypt(sha256) = $2a$10$N0xcgc5bRtiG6ioG0OtcFerkR7ILOpFZJGrAg9N.zsZV1sHNvu8fO

UPDATE users SET password_bcrypt = '$2a$10$N0xcgc5bRtiG6ioG0OtcFerkR7ILOpFZJGrAg9N.zsZV1sHNvu8fO' WHERE username IN ('admin', 'test');
