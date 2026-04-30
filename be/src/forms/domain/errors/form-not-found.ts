/**
 * Domain invariant: a referenced form aggregate does not exist.
 * Transport (HTTP status, oRPC code) is decided in the interface layer.
 */
export class FormNotFound extends Error {
  constructor(public readonly formId: string) {
    super(`Form ${formId} was not found`);
    this.name = 'FormNotFound';
  }
}
