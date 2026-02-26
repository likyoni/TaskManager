import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;

// Database Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize Database
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT DEFAULT 'user'
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'todo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
};

const app = express();

app.use(express.json());
app.use(cookieParser());

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, ACCESS_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const countRes = await pool.query('SELECT COUNT(*) as count FROM users');
    const role = parseInt(countRes.rows[0].count) === 0 ? 'admin' : 'user';
    
    const insertRes = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, hashedPassword, name, role]
    );
    
    res.status(201).json({ id: insertRes.rows[0].id, message: 'User registered', role });
  } catch (e: any) {
    if (e.message.includes('unique constraint')) return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  jwt.verify(refreshToken, REFRESH_SECRET, async (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Invalid refresh token' });
    
    const userRes = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [decoded.id]);
    const user = userRes.rows[0];
    
    if (!user) return res.status(403).json({ error: 'User not found' });

    const accessToken = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' });
    res.json({ accessToken, user });
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('refreshToken', { secure: true, sameSite: 'none' });
  res.json({ message: 'Logged out' });
});

// --- Task Routes ---

app.get('/api/tasks', authenticateToken, async (req: any, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  
  let query = 'SELECT * FROM tasks WHERE user_id = $1';
  const params: any[] = [req.user.id];
  let paramIndex = 2;

  if (status && status !== 'all') {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  if (search) {
    query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++ } OFFSET $${paramIndex++}`;
  params.push(Number(limit), offset);

  const tasksRes = await pool.query(query, params);
  
  let countQuery = 'SELECT COUNT(*) as total FROM tasks WHERE user_id = $1';
  const countParams: any[] = [req.user.id];
  let countParamIndex = 2;
  
  if (status && status !== 'all') {
    countQuery += ` AND status = $${countParamIndex++}`;
    countParams.push(status);
  }
  if (search) {
    countQuery += ` AND (title ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
    countParams.push(`%${search}%`);
    countParamIndex++;
  }
  
  const countRes = await pool.query(countQuery, countParams);
  const total = parseInt(countRes.rows[0].total);

  res.json({ tasks: tasksRes.rows, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

app.post('/api/tasks', authenticateToken, async (req: any, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const insertRes = await pool.query(
    'INSERT INTO tasks (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
    [req.user.id, title, description || '']
  );
  res.status(201).json(insertRes.rows[0]);
});

app.patch('/api/tasks/:id', authenticateToken, async (req: any, res) => {
  const { title, description, status } = req.body;
  const { id } = req.params;

  const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  const task = taskRes.rows[0];
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const updateRes = await pool.query(
    'UPDATE tasks SET title = $1, description = $2, status = $3 WHERE id = $4 RETURNING *',
    [title || task.title, description !== undefined ? description : task.description, status || task.status, id]
  );

  res.json(updateRes.rows[0]);
});

app.patch('/api/tasks/:id/toggle', authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  const task = taskRes.rows[0];
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const newStatus = task.status === 'completed' ? 'todo' : 'completed';
  const updateRes = await pool.query('UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *', [newStatus, id]);
  res.json(updateRes.rows[0]);
});

app.delete('/api/tasks/:id', authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  const deleteRes = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  if (deleteRes.rowCount === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ message: 'Task deleted' });
});

// --- Admin Routes ---

app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  const userCountRes = await pool.query('SELECT COUNT(*) as count FROM users');
  const taskCountRes = await pool.query('SELECT COUNT(*) as count FROM tasks');
  const completedTasksRes = await pool.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'");
  
  res.json({
    users: parseInt(userCountRes.rows[0].count),
    tasks: parseInt(taskCountRes.rows[0].count),
    completedTasks: parseInt(completedTasksRes.rows[0].count)
  });
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  const usersRes = await pool.query('SELECT id, email, name, role FROM users');
  res.json(usersRes.rows);
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req: any, res) => {
  const { id } = req.params;
  if (Number(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  
  await pool.query('DELETE FROM tasks WHERE user_id = $1', [id]);
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ message: 'User and their tasks deleted' });
});

// Initialize DB on first request
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (err) {
      console.error('DB Init Error:', err);
    }
  }
  next();
});

export default app;
