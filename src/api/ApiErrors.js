
export class WiotpError extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = this.constructor.name;
  }
}

export class InvalidServiceCredentials extends WiotpError {}

export class ServiceNotFound extends WiotpError {}


export const handleError = (err, errorMappings) => {
  if(err && err.response && err.response.data && err.response.data.exception && err.response.data.exception.id) {
    if(errorMappings && errorMappings[err.response.data.exception.id]) {
      throw new errorMappings[err.response.data.exception.id](err.response.data.message, err);
    } else {
      throw new WiotpError(err.response.data.message, err);
    }
  } else {
    throw err;
  }
}
