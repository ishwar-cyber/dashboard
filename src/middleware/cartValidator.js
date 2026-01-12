export const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    // overwrite with validated data
    req.body = parsed.body ?? req.body;
    req.params = parsed.params ?? req.params;
    req.query = parsed.query ?? req.query;

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors?.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }
};
