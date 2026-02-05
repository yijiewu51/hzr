// 共享房间数据：GET 读取，POST 保存。需要 Vercel 项目里已添加 KV 存储。
const KV_KEY_PREFIX = "hzr:room:";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const k = typeof req.query.k === "string" ? req.query.k.trim() : "";
  if (!k) return res.status(400).json({ error: "missing k" });

  try {
    const { kv } = await import("@vercel/kv");
    const key = KV_KEY_PREFIX + k;

    if (req.method === "GET") {
      const data = await kv.get(key);
      return res.status(200).json(data || { events: [] });
    }

    if (req.method === "POST") {
      const body = req.body && typeof req.body.events === "object" ? req.body : { events: [] };
      await kv.set(key, body);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    console.error("KV error", err);
    return res.status(503).json({ error: "storage unavailable" });
  }
};
