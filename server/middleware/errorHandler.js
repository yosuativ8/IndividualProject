// errorHandler middleware untuk menangani error secara global.

module.exports = function errorHandler(err, req, res, next) {
    console.error('Error occurred:', err); // Log error ke console untuk debugging
    console.error('Error stack:', err.stack); // Log stack trace

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: err.errors[0].message });
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Invalid token' });
    }

    if (err.name === 'Unauthorized') {
        return res.status(401).json({ message: err.message });
    }

    if (err.name === 'NotFound') {
        return res.status(404).json({ message: err.message });
    }

    if (err.name === 'Forbidden') {
        return res.status(403).json({ message: err.message });
    }

    if (err.name === 'BadRequest') {
        return res.status(400).json({ message: err.message });
    }

    if (err.name === 'ExternalAPIError') {
        return res.status(502).json({ message: err.message });
    }

    // Jika error tidak dikenali, kembalikan 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
}