const { z } = require("zod");

const positiveMoney = z.coerce.number().finite().positive().max(999999999);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

function parseOrThrow(schema, value) {
  return schema.parse(value);
}

module.exports = { z, positiveMoney, dateString, parseOrThrow };
