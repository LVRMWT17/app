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
