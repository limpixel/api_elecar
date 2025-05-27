const express = require("express");
const db = require("../firebase/config");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Middleware untuk semua endpoint chart
router.use(verifyToken);

// Tambahkan mobil ke chart
router.post("/chart/add", async (req, res) => {
  const userId = req.user.id;
  const { carId } = req.body;

  if (!carId) return res.status(400).json({ error: "carId harus diisi" });

  try {
    const carSnap = await db.ref(`cars/${carId}`).once("value");

    if (!carSnap.exists()) {
      return res.status(404).json({ error: "Mobil tidak ditemukan" });
    }

    const carData = carSnap.val();

    const chartRef = db.ref(`chart/${userId}`).push();
    const chartId = chartRef.key;

    await chartRef.set({
      chartId,
      carId,
      ...carData,
      status: "pending",
      createdAt: Date.now(),
    });

    res.json({ message: "Mobil ditambahkan ke chart", chartId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ambil semua item chart milik user
router.get("/chart", async (req, res) => {
  const userId = req.user.id;

  try {
    const snapshot = await db.ref(`chart/${userId}`).once("value");
    const chartItems = snapshot.val() || {};
    res.json(Object.values(chartItems));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hapus item chart (hanya jika belum dikonfirmasi)
router.delete("/chart/:chartId", async (req, res) => {
  const userId = req.user.id;
  const { chartId } = req.params;

  try {
    const itemSnap = await db.ref(`chart/${userId}/${chartId}`).once("value");

    if (!itemSnap.exists()) {
      return res.status(404).json({ error: "Item tidak ditemukan di chart" });
    }

    const item = itemSnap.val();
    if (item.status === "confirmed") {
      return res.status(403).json({ error: "Item sudah dikonfirmasi dan tidak bisa dihapus" });
    }

    await db.ref(`chart/${userId}/${chartId}`).remove();
    res.json({ message: "Item chart berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Konfirmasi pembelian mobil
router.post("/chart/:chartId/confirm", async (req, res) => {
  const userId = req.user.id;
  const { chartId } = req.params;

  try {
    const itemRef = db.ref(`chart/${userId}/${chartId}`);
    const itemSnap = await itemRef.once("value");

    if (!itemSnap.exists()) {
      return res.status(404).json({ error: "Item chart tidak ditemukan" });
    }

    const item = itemSnap.val();

    if (item.status === "confirmed") {
      return res.status(400).json({ error: "Item sudah dikonfirmasi" });
    }

    await itemRef.update({
      status: "confirmed",
      confirmedAt: Date.now(),
    });

    res.json({ message: "Pembelian berhasil dikonfirmasi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
