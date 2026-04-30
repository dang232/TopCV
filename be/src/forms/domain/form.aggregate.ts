import type { CreateFormCommand, FormSnapshot, UpdateFormCommand } from './form-snapshot';
import type { FormField } from './form-field';
import type { FormStatus } from './form-status';

export class DynamicForm {
  private constructor(
    private readonly id: string,
    private title: string,
    private description: string,
    private order: number,
    private status: FormStatus,
    private fields: FormField[],
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(id: string, input: CreateFormCommand, now = new Date()): DynamicForm {
    return new DynamicForm(
      id,
      input.title,
      input.description,
      input.order,
      input.status,
      input.fields,
      now,
      now,
    );
  }

  static restore(snapshot: FormSnapshot): DynamicForm {
    return new DynamicForm(
      snapshot.id,
      snapshot.title,
      snapshot.description,
      snapshot.order,
      snapshot.status,
      snapshot.fields,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  update(input: UpdateFormCommand, now = new Date()): void {
    if (input.title !== undefined) {
      this.title = input.title;
    }

    if (input.description !== undefined) {
      this.description = input.description;
    }

    if (input.order !== undefined) {
      this.order = input.order;
    }

    if (input.status !== undefined) {
      this.status = input.status;
    }

    if (input.fields !== undefined) {
      this.fields = input.fields;
    }

    this.updatedAt = now;
  }

  toSnapshot(): FormSnapshot {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      order: this.order,
      status: this.status,
      fields: [...this.fields].sort((left, right) => left.order - right.order),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
