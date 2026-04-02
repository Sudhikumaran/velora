export function validateBody(schema) {
  return (req, res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      const msg = r.error.issues.map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg || "Validation failed" });
    }
    req.validBody = r.data;
    next();
  };
}
