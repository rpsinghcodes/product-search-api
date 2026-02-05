const errorHandler = (err, req, res, next) => {
	console.error("Error:", err);

	let statusCode = err.statusCode || 500;
	let message = err.message || "Internal Server Error";

	if (err.name === "ValidationError") {
		statusCode = 400;
		message = err.message;
	}

	if (err.name === "CastError") {
		statusCode = 400;
		message = "Invalid ID format";
	}

	res.status(statusCode).json({
		success: false,
		error: {
			message: message,
			...(process.env.NODE_ENV === "development" && { stack: err.stack }),
		},
	});
};

const notFoundHandler = (req, res) => {
	res.status(404).json({
		success: false,
		error: {
			message: `Route ${req.originalUrl} not found`,
		},
	});
};

export { errorHandler, notFoundHandler };
