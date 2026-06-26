import db from './db.js'

const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }

if (existing.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')

  const users = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
    { name: 'Charlie', email: 'charlie@example.com' },
  ]

  for (const u of users) {
    insertUser.run(u.name, u.email)
  }

  console.log('Seeded 3 users: alice@example.com, bob@example.com, charlie@example.com')
} else {
  console.log('Users already seeded, skipping.')
}
