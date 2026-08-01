export const hash = jest.fn().mockResolvedValue('bcrypt-hashed-password')
export const compare = jest.fn().mockResolvedValue(true)
export default { hash, compare }
