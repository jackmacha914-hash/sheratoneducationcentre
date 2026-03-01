// middleware/cors.js
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  // Always set vary
  res.setHeader('Vary', 'Origin');

  // Only allow your deployed frontend
  const allowedOrigin = "https://eagles-emulators-schools.onrender.com";

  if (origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,x-auth-token,X-Requested-With,Cache-Control"
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
  }

  next();
};

module.exports = corsMiddleware;
