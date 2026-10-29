function notFound(req, res) {
  res.status(404).json({ message: "Endpoint not found." });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err && err.name === "ZodError") {
    return res.status(400).json({
      message: "Please check the submitted information.",
      errors: err.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  if (err && err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "That record already exists." });
  }

  if (err && err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ message: "A referenced record does not exist." });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
}

module.exports = { notFound, errorHandler };
