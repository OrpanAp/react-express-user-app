const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from server/.env");
}

const store = new MySQLStore({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 60 * 60 * 1000,
});

module.exports = session({
  name: "app.sid",
  secret: process.env.SESSION_SECRET,
  store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: (process.env.MODE || "development").toLowerCase() === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 1000,
    path: "/",
  },
});
