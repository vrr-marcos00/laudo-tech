-- Corrige hash bcrypt do admin (senha: admin123)
UPDATE engenheiro
SET senha_hash = '$2y$10$nAkHPElRgPH3O3EKVhVZCuQbEhK.9U8UeDEFfv8DD8aIo5spgn6fK'
WHERE email = 'admin@laudotech.com';
