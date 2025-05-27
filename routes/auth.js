const express = require("express");
const generateToken = require("../auth/generateToken");
const jwt = require("jsonwebtoken");
const db = require("../firebase/config"); 


// ENV Secret
const SECRET = process.env.JWT_SECRET;
const router = express.Router();

// Sign Up
router.post("/signup", async (req, res) => {
  const { name, password, confirm_password, url_profile_image } = req.body;

  if (!name || !password || !confirm_password) {
    return res
      .status(400)
      .json({ error: "Nama, Password, Dan Konfirmasi Pasword wajib diisi" });
  }

  if (password !== confirm_password) {
    return res
      .status(400)
      .json({ error: "Password dan konfirmasi password anda tidak sama!" });
  }

  try {
    // Cek apakah user dengan nama tersebut sudah ada
    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val() || {};
    const userExists = Object.values(users).some((u) => u.name === name);

    if (userExists) {
      return res.status(409).json({ error: "User sudah terdaftar" });
    }

    const refUser = db.ref("users").push();
    const userId = refUser.key;

    const userData = {
      id: userId,
      name,
      password, // Disarankan hash di versi produksi
      url_profile_image: url_profile_image || "",
      auth_token: "",
      image_url_profile: url_profile_image || "",
    };

    await refUser.set(userData);
    res
      .status(201)
      .json({ message: "User berhasil dibuat", user: { id: userId, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { name, password } = req.body;

  try {
    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val();

    const userEntry = Object.entries(users || {}).find(([_, user]) => user.name === name);

    if (!userEntry) return res.status(404).json({ error: "User tidak ditemukan" });

    const [userId, userData] = userEntry;

    if (userData.password !== password) {
      return res.status(401).json({ error: "Password salah" });
    }

    const token = jwt.sign({ id: userData.id, name: userData.name }, SECRET, {
      expiresIn: "1h"
    });

    // Simpan token
    await db.ref(`users/${userId}/auth_token`).set(token);

    res.json({
      message: "Login berhasil",
      auth_token: token,
      user: {
        id: userData.id,
        name: userData.name,
        url_profile_image: userData.url_profile_image
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  const { name } = req.body;

  try {
    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val();

    const userEntry = Object.entries(users || {}).find(([_, user]) => user.name === name);

    if (!userEntry) return res.status(404).json({ error: "User tidak ditemukan" });

    const [userId, _] = userEntry;

    await db.ref(`users/${userId}/auth_token`).set("");
    res.json({ message: "Logout berhasil" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// endpoint untuk generate token
router.post("/token", (req, res) => {
  const { username, password } = req.body;

  // kamu bisa ganti ini dengan validasi dari database
  if (username === "admin" && password === "rahasia") {
    const token = generateToken({ username });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Username atau password salah" });
  }
});

module.exports = router;
