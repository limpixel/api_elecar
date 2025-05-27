const express = require("express");
const db = require("../firebase/config"); // Firebase Admin SDK
const verifyToken = require("../middleware/verifyToken"); // Middleware auth
const jwt = require("jsonwebtoken")

const router = express.Router();

// Gunakan middleware token untuk semua route
router.use(verifyToken);

// CREATE - Tambah user
// Signup - Register user
router.post("/users/create", async (req, res) => {
  try {
    const { name, password, confirm_password, url_profile_image } = req.body;

    if (!name || !password || !confirm_password) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: "Password tidak cocok" });
    }

    // Buat ID dan token
    const refUser = db.ref("users").push(); // generate ID otomatis
    const id = refUser.key;

    const token = jwt.sign({ id, name }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1h",
    });

    const userData = {
      id,
      name,
      password, // NOTE: sebaiknya di-hash, ini hanya untuk testing awal
      url_profile_image: url_profile_image || "",
      image_url_profile: url_profile_image || "",
      auth_token: token,
    };

    await refUser.set(userData);

    res.status(201).json({
      message: "User created successfully",
      id,
      auth_token: token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ALL - Ambil semua user
router.get("/users", async (req, res) => {
  try {
    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val();
    if (users) {
      res.json(users);
    } else {
      res.status(404).json({ message: "Tidak ada user ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE - Ambil user berdasarkan ID
router.get("/users/:id", async (req, res) => {
  try {
    const snapshot = await db.ref("users/" + req.params.id).once("value");
    if (snapshot.exists()) {
      res.json(snapshot.val());
    } else {
      res.status(404).json({ error: "User tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - Ubah data user
router.put("/users/:id", async (req, res) => {
  try {
    await db.ref("users/" + req.params.id).update(req.body);
    res.json({ message: "User berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Hapus user
router.delete("/users/:id", async (req, res) => {
  try {
    await db.ref("users/" + req.params.id).remove();
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
