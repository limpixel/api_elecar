const express = require("express");
const db = require("../firebase/config");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();
router.use(verifyToken);

// CREATE - Tambah mobil
router.post("/cars/create", async (req, res) => {
  try {
    const refCar = db.ref("cars").push();
    const carData = {
      id: refCar.key,
      brand: req.body.brand,
      model: req.body.model,
      price: req.body.price,
      image_url: req.body.image_url,
      description: req.body.description,
    };
    await refCar.set(carData);
    res.json({ message: "Mobil berhasil ditambahkan", id: refCar.key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ALL - Ambil semua mobil
router.get("/cars", async (req, res) => {
  try {
    const snapshot = await db.ref("cars").once("value");
    const cars = snapshot.val();
    res.json(cars || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE - Ambil mobil berdasarkan ID
router.get("/cars/:id", async (req, res) => {
  try {
    const snapshot = await db.ref(`cars/${req.params.id}`).once("value");
    if (snapshot.exists()) {
      res.json(snapshot.val());
    } else {
      res.status(404).json({ error: "Mobil tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - Ubah data mobil
router.put("/cars/:id", async (req, res) => {
  try {
    await db.ref(`cars/${req.params.id}`).update(req.body);
    res.json({ message: "Mobil berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Hapus mobil
router.delete("/cars/:id", async (req, res) => {
  try {
    await db.ref(`cars/${req.params.id}`).remove();
    res.json({ message: "Mobil berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
