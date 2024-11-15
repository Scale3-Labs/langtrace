import { z } from "zod";

export function jsonToZodSchema(jsonSchema: any): string {
  try {
    const schema = typeof jsonSchema === 'string' ? JSON.parse(jsonSchema) : jsonSchema;

    if (schema.type !== 'object' || !schema.properties) {
      throw new Error('Invalid schema format');
    }

    const properties = Object.entries(schema.properties)
      .map(([key, prop]: [string, any], index: number, array: any[]) => {
        let zodType = '';
        let comment = '';

        if (prop.type === 'string') {
          zodType = 'z.string()';
          if (prop.minLength) {
            zodType += `.min(${prop.minLength}, "Name is required")`;
            comment = 'Requires at least 1 character';
          }
          if (prop.format === 'email') {
            zodType += `.email("Invalid email address")`;
            comment = 'Validates email format';
          }
        } else if (prop.type === 'integer') {
          zodType = 'z.number().int()';
          if (typeof prop.minimum === 'number') {
            zodType += `.min(${prop.minimum}, "Age must be a positive integer")`;
            comment = 'Ensures a positive integer';
          }
        } else if (prop.type === 'number') {
          zodType = 'z.number()';
          if (typeof prop.minimum === 'number') {
            zodType += `.min(${prop.minimum}, "${key} must be ${prop.minimum} or greater")`;
            comment = `Must be ${prop.minimum} or greater`;
          }
        }

        return `  ${key}: ${zodType}${index < array.length - 1 ? ',' : ''} // ${comment}`;
      })
      .join('\n');

    return `z.object({\n${properties}\n});`;
  } catch (error) {
    console.error('Error converting JSON to Zod schema:', error);
    return '';
  }
}

export function isJsonSchema(value: string): boolean {
  try {
    const schema = JSON.parse(value);
    return (
      schema &&
      typeof schema === 'object' &&
      schema.type === 'object' &&
      typeof schema.properties === 'object'
    );
  } catch {
    return false;
  }
}
