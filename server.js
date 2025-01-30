import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConnection } from 'mysql2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'Login.html')); // Или перенаправьте на другую страницу
});
app.get('/login', (_req, res) => {
    res.sendFile(path.join(__dirname, 'Login.html'));
});
app.get('/register', (_req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

const connection = createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect(err => {
    if (err) {
        console.error('An error', err);
        return;
    }
    console.log('Successfully');
});
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users2 WHERE email = ?', [email], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Server error.' });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'No such user.' });
        }
        const user = results[0];

        if (1 !== user.is_active) {
            return res.status(403).json({ message: 'Access denied. Your account is blocked.' });
        }
        if (password !== user.password) {
            return res.status(401).json({ message: 'Wrong password. Please, try again.' });
        }
        const registrationTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const updateQuery = 'UPDATE users2 SET last_visit = ? WHERE email = ?';
        db.execute(updateQuery, [registrationTime, email], (err, results) => {
            if (err) {
                console.error('An error', err);
                return res.status(500).json({ message: 'Authentication failed.' });
            }
            return res.json({ message: 'Successfully'})
    });
});
})
app.post('/register', (req, res) => {
    const { email, password, firstName, lastName, registrationTime } = req.body;
    const checkQuery = 'SELECT * FROM users2 WHERE email = ?';
    db.execute(checkQuery, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error. Try again.' });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'A user with such email already exists.' });
        }
    const query = 'INSERT INTO users2 (email, password, first_name, last_name, last_visit) VALUES (?, ?, ?, ?, ?)';
    db.execute(query, [email, password, firstName, lastName, registrationTime], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'An error during registration. Try again.' });
        }
        return res.json({message: 'Successfully'})
    });
});
});

app.get('/table.html', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'table.html'));
});

app.get('/table/users', async (_req, res) => {
        try {
            const [users] = await db.promise().query('SELECT * FROM users2 ORDER BY last_visit DESC');
            res.json(users);
        } catch (err) {
            console.error('An error during searching users.', err);
            res.status(500).json({ message: 'An error during searching users.' });
        }
});
app.post('/delall', (_req, res) => {
    const query = 'TRUNCATE TABLE users2';
    db.query(query, (err, results) => {
        if (err) {
            console.error('An error during deleting users.', err);
            return res.status(500).json({ message: 'An error during deleting users.' });
        }
        const checkQuery = 'SELECT COUNT(*) AS count FROM users2';
            db.query(checkQuery, (err, countResults) => {
                if (err) {
                    console.error('An error', err);
                    return res.status(500).json({ message: 'An error during searching users.' });
                }
            const remainingUsers = countResults[0].count;
            if (remainingUsers === 0) {
                return res.json({ message: 'Users are deleted.', redirect: true });
            }

            res.json({ message: 'Users are deleted.', redirect: false }); })
    });
});
app.post('/blockall', (_req, res) => {
    db.query('UPDATE users2 SET is_active = ?', [false], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'An error' });
        }
        res.status(200).json({ message: 'Users are blocked', redirect: true });
    });
});

app.post('/unblockall', (_req, res) => {
    db.query('UPDATE users2 SET is_active = ?', [true], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'An error' });
        }
        res.status(200).json({ message: 'Users are unblocked', redirect: false  });
    });
});
app.post('/table/block', (_req, res) => {
    const { userIds } = _req.body;
    const query = 'UPDATE users2 SET is_active = ? WHERE id IN (?)';
    db.query(query, [false, userIds], (err, results) => {
        if (err) {
            console.error('An error', err);
            return res.status(500).json({ message: 'Error during blocking users.' });
        }
        res.json({ message: 'Users are blocked.' });
    });
});
app.post('/table/unblock', (_req, res) => {
    const { userIds } = _req.body;
    const query = 'UPDATE users2 SET is_active = ? WHERE id IN (?)';
    db.query(query, [true, userIds], (err, _results) => {
        if (err) {
            console.error('Error during unblocking users.', err);
            return res.status(500).json({ message: ' An error during unblocking users.' });
        }
        res.json({ message: 'Users are unblocked.' });
    });
});
app.post('/table/del', (_req, res) => {
    const { userIds } = _req.body;
    const query = 'DELETE FROM users2 WHERE id IN (?)';
    db.query(query, [userIds], (err, results) => {
        if (err) {
            console.error('Ошибка при удалении пользователей:', err);
            return res.status(500).json({ message: 'An error during deleting users.' });
            }

            const checkQuery = 'SELECT COUNT(*) AS count FROM users2';
            db.query(checkQuery, (err, countResults) => {
                if (err) {
                    console.error('Ошибка при проверке пользователей:', err);
                    return res.status(500).json({ message: 'An error during searching users.' });
                }
            const remainingUsers = countResults[0].count;
            if (remainingUsers === 0) {
                return res.json({ message: 'Users are deleted.', redirect: true });
            }

            res.json({ message: 'Users are deleted.', redirect: false });
    });
});
})
app.listen(PORT, () => { console.log(`Сервер запущен на http://localhost:${PORT}`);
})
