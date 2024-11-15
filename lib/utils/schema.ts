import { z } from "zod";

export function jsonToZodSchema(jsonSchema: any): string {
  try {
    const schema = typeof jsonSchema === 'string' ? JSON.parse(jsonSchema) : jsonSchema;

    function processProperty(prop: any, key: string): [string, string] {
      let zodType = '';
      let comment = '';

      if (prop.type === 'object' && prop.properties) {
        const nestedProperties = Object.entries(prop.properties)
          .map(([nestedKey, nestedProp]: [string, any], index: number, array: any[]) => {
            const [nestedType, nestedComment] = processProperty(nestedProp, nestedKey);
            return `  ${nestedKey}: ${nestedType}${index < array.length - 1 ? ',' : ''} // ${nestedComment}`;
          })
          .join('\n');
        zodType = `z.object({\n${nestedProperties}\n})`;
        comment = 'Nested object';
      } else if (prop.type === 'array' && prop.items) {
        const [itemType, itemComment] = processProperty(prop.items, 'item');
        zodType = `z.array(${itemType})`;
        comment = `Array of ${itemComment}`;
      } else if (prop.type === 'string') {
        zodType = 'z.string()';
        if (prop.minLength) {
          zodType += `.min(${prop.minLength}, "${key} requires at least ${prop.minLength} character${prop.minLength === 1 ? '' : 's'}")`;
          comment = `Requires at least ${prop.minLength} character${prop.minLength === 1 ? '' : 's'}`;
        }
        if (prop.format === 'email') {
          zodType += `.email("Invalid email address")`;
          comment = 'Validates email format';
        }
      } else if (prop.type === 'integer') {
        zodType = 'z.number().int()';
        if (typeof prop.minimum === 'number') {
          zodType += `.min(${prop.minimum}, "${key} must be ${prop.minimum} or greater")`;
          comment = `Must be ${prop.minimum} or greater`;
        }
      } else if (prop.type === 'number') {
        zodType = 'z.number()';
        if (typeof prop.minimum === 'number') {
          zodType += `.min(${prop.minimum}, "${key} must be ${prop.minimum} or greater")`;
          comment = `Must be ${prop.minimum} or greater`;
        }
      } else if (prop.type === 'boolean') {
        zodType = 'z.boolean()';
        comment = 'Boolean value';
      }

      if (prop.required) {
        comment += ' (Required)';
      }

      return [zodType, comment];
    }

    if (schema.type !== 'object' || !schema.properties) {
      throw new Error('Invalid schema format');
    }

    const properties = Object.entries(schema.properties)
      .map(([key, prop]: [string, any], index: number, array: any[]) => {
        const [zodType, comment] = processProperty(prop, key);
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
