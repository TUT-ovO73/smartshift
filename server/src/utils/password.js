import bcrypt from 'bcryptjs';

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// 同步版本（用于 seed 等场景）
export function hashPasswordSync(plain) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plain, salt);
}

export function comparePasswordSync(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}
