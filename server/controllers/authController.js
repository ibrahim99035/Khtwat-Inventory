import jwt from 'jsonwebtoken'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const login = (req, res) => {
  const { username, password } = req.body

  if (
    username !== process.env.LOGIN_USERNAME ||
    password !== process.env.LOGIN_PASSWORD
  ) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.cookie('token', token, COOKIE_OPTS)
  res.json({ username })
}

export const logout = (_, res) => {
  res.clearCookie('token')
  res.json({ message: 'Logged out' })
}

export const me = (req, res) => {
  res.json({ username: req.user.username })
}
