import { ERRORS } from './error-dictionary.js';

export class AppError extends Error {
  constructor(errorType, details = null, cause = null) {
    super(errorType.message, cause ? { cause } : undefined);
    this.name = 'AppError';
    this.code = errorType.code;
    this.statusCode = errorType.statusCode;
    this.details = details;
  }
}

export class InvalidIdError extends AppError {
  constructor(id) {
    super(ERRORS.INVALID_ID, { id });
  }
}

export class RouteNotFoundError extends AppError {
  constructor(method, path) {
    super(ERRORS.ROUTE_NOT_FOUND, { method, path });
  }
}

export class UserNotFoundError extends AppError {
  constructor(id) {
    super(ERRORS.USER_NOT_FOUND, { id });
  }
}

export class InvalidPasswordError extends AppError {
  constructor(minLength) {
    super(ERRORS.INVALID_PASSWORD, { minLength });
  }
}

export class ProductNotFoundError extends AppError {
  constructor(id) {
    super(ERRORS.PRODUCT_NOT_FOUND, { id });
  }
}

export class InvalidProductStatusError extends AppError {
  constructor(status) {
    super(ERRORS.INVALID_PRODUCT_STATUS, { received: status });
  }
}

export class OrderNotFoundError extends AppError {
  constructor(id) {
    super(ERRORS.ORDER_NOT_FOUND, { id });
  }
}

export class InvalidOrderUserError extends AppError {
  constructor(userId, role) {
    super(ERRORS.INVALID_ORDER_USER, { userId, role });
  }
}

export class InvalidOrderItemsError extends AppError {
  constructor() {
    super(ERRORS.INVALID_ORDER_ITEMS);
  }
}

export class InvalidOrderStatusError extends AppError {
  constructor(current, received, allowed) {
    super(ERRORS.INVALID_ORDER_STATUS, { current, received, allowed });
  }
}

export class DeliveryNotFoundError extends AppError {
  constructor(id) {
    super(ERRORS.DELIVERY_NOT_FOUND, { id });
  }
}

export class InvalidDeliveryStatusError extends AppError {
  constructor(current, received, allowed) {
    super(ERRORS.INVALID_DELIVERY_STATUS, { current, received, allowed });
  }
}

export class InvalidDeliveryDriverError extends AppError {
  constructor(driver, role = null) {
    super(ERRORS.INVALID_DELIVERY_DRIVER, { driver, role });
  }
}

export class FileRequiredError extends AppError {
  constructor(field) {
    super(ERRORS.FILE_REQUIRED, { field });
  }
}

export class InvalidFileFieldError extends AppError {
  constructor(expected, received) {
    super(ERRORS.INVALID_FILE_FIELD, { expected, received });
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(received, allowed) {
    super(ERRORS.INVALID_FILE_TYPE, { received, allowed });
  }
}

export class FileTooLargeError extends AppError {
  constructor(maxSizeMB) {
    super(ERRORS.FILE_TOO_LARGE, { maxSizeMB });
  }
}

export class InvalidDocumentTypeError extends AppError {
  constructor(received, allowed) {
    super(ERRORS.INVALID_DOCUMENT_TYPE, { received, allowed });
  }
}

export class FileUploadError extends AppError {
  constructor(reason, cause) {
    super(ERRORS.FILE_UPLOAD_ERROR, { reason }, cause);
  }
}

export class FileSaveError extends AppError {
  constructor(reason, cause) {
    super(ERRORS.FILE_SAVE_ERROR, { reason }, cause);
  }
}

export class InvalidMockQuantityError extends AppError {
  constructor(received, min, max) {
    super(ERRORS.INVALID_MOCK_QTY, { received, min, max });
  }
}

export class NegativeMockQuantityError extends AppError {
  constructor(received) {
    super(ERRORS.NEGATIVE_MOCK_QTY, { received });
  }
}

export class MockSeedForbiddenError extends AppError {
  constructor() {
    super(ERRORS.MOCK_SEED_FORBIDDEN);
  }
}

export class MockSeedError extends AppError {
  constructor(reason, cause) {
    super(ERRORS.MOCK_SEED_FAILED, { reason }, cause);
  }
}