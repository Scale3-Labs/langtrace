import { z } from "zod";

type JsonSchemaType = {
  type?: string;
  properties?: Record<string, JsonSchemaType>;
  items?: JsonSchemaType;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  enum?: any[];
  additionalProperties?: boolean | JsonSchemaType;
  oneOf?: JsonSchemaType[];
  anyOf?: JsonSchemaType[];
  allOf?: JsonSchemaType[];
  default?: any;
};

export function convertJsonSchemaToZod(schema: JsonSchemaType): z.ZodType<any> {
  if (!schema.type && schema.oneOf) {
    const unionTypes = schema.oneOf.map(subSchema => convertJsonSchemaToZod(subSchema));
    return z.union([unionTypes[0], unionTypes[1], ...unionTypes.slice(2)]);
  }

  if (!schema.type && schema.anyOf) {
    const unionTypes = schema.anyOf.map(subSchema => convertJsonSchemaToZod(subSchema));
    return z.union([unionTypes[0], unionTypes[1], ...unionTypes.slice(2)]);
  }

  if (!schema.type && schema.allOf) {
    const intersectionTypes = schema.allOf.map(subSchema => convertJsonSchemaToZod(subSchema));
    return z.intersection(intersectionTypes[0], intersectionTypes[1], ...intersectionTypes.slice(2));
  }

  switch (schema.type) {
    case 'string': {
      let zodString = z.string();

      if (schema.minLength !== undefined) {
        zodString = zodString.min(schema.minLength);
      }
      if (schema.maxLength !== undefined) {
        zodString = zodString.max(schema.maxLength);
      }
      if (schema.pattern) {
        zodString = zodString.regex(new RegExp(schema.pattern));
      }
      if (schema.format === 'email') {
        zodString = zodString.email();
      }
      if (schema.format === 'uuid') {
        zodString = zodString.uuid();
      }
      if (schema.format === 'url') {
        zodString = zodString.url();
      }
      if (schema.enum) {
        return z.enum(schema.enum as [string, ...string[]]);
      }

      return zodString;
    }

    case 'number':
    case 'integer': {
      let zodNumber = schema.type === 'integer' ? z.number().int() : z.number();

      if (schema.minimum !== undefined) {
        zodNumber = zodNumber.min(schema.minimum);
      }
      if (schema.maximum !== undefined) {
        zodNumber = zodNumber.max(schema.maximum);
      }
      if (schema.enum) {
        return z.enum(schema.enum as [string, ...string[]]);
      }

      return zodNumber;
    }

    case 'boolean':
      return z.boolean();

    case 'null':
      return z.null();

    case 'array': {
      if (!schema.items) {
        return z.array(z.unknown());
      }
      return z.array(convertJsonSchemaToZod(schema.items));
    }

    case 'object': {
      if (!schema.properties) {
        return z.record(z.unknown());
      }

      const shape: Record<string, z.ZodType<any>> = {};
      
      for (const [key, value] of Object.entries(schema.properties)) {
        const isRequired = schema.required?.includes(key);
        const zodType = convertJsonSchemaToZod(value);
        shape[key] = isRequired ? zodType : zodType.optional();
      }

      let zodObject = z.object(shape);

      if (schema.additionalProperties === false) {
        zodObject = zodObject.strict() as any;
      } else if (typeof schema.additionalProperties === 'object') {
        zodObject = zodObject.catchall(convertJsonSchemaToZod(schema.additionalProperties));
      }
      return zodObject;
    }

    default:
      return z.unknown();
  }
}


export function isJsonZodSchema(schema: string): boolean {
  try {
    const parsedSchema = JSON.parse(schema);
    // try to convert the schema to zod
    convertJsonSchemaToZod(parsedSchema);
    return true;
  } catch (error) {
    return false;
  }
}

export function zodToString(schema: z.ZodType, indent = 0): string {
  const spacing = ' '.repeat(indent);
  
  // Handle primitives
  if (schema instanceof z.ZodString) {
    const checks = schema._def.checks || [];
    const constraints = checks.map(check => {
      switch (check.kind) {
        case 'min': return `.min(${check.value})`;
        case 'max': return `.max(${check.value})`;
        case 'email': return '.email()';
        case 'url': return '.url()';
        case 'uuid': return '.uuid()';
        case 'regex': return `.regex(${check.regex})`;
        default: return '';
      }
    }).join('');
    return `z.string()${constraints}`;
  }

  if (schema instanceof z.ZodNumber) {
    const checks = schema._def.checks || [];
    const constraints = checks.map(check => {
      switch (check.kind) {
        case 'min': return `.min(${check.value})`;
        case 'max': return `.max(${check.value})`;
        case 'int': return '.int()';
        default: return '';
      }
    }).join('');
    return `z.number()${constraints}`;
  }

  if (schema instanceof z.ZodBoolean) {
    return 'z.boolean()';
  }

  if (schema instanceof z.ZodNull) {
    return 'z.null()';
  }

  if (schema instanceof z.ZodArray) {
    const elementSchema = zodToString(schema._def.type, indent);
    return `z.array(${elementSchema})`;
  }

  // Handle objects
  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();
    const entries = Object.entries(shape);
    
    if (entries.length === 0) {
      return 'z.object({})';
    }

    const properties = entries.map(([key, value]) => {
      const isOptional = value instanceof z.ZodOptional;
      const valueSchema = isOptional ? value._def.innerType : value;
      const propertySchema = zodToString(valueSchema, indent + 2);
      return `${spacing}  ${key}: ${propertySchema}${isOptional ? '.optional()' : ''}`;
    }).join(',\n');

    const isStrict = schema._def.unknownKeys === 'strict';
    const strictSuffix = isStrict ? '.strict()' : '';

    return `z.object({\n${properties}\n${spacing}})${strictSuffix}`;
  }

  // Handle unions
  if (schema instanceof z.ZodUnion) {
    const options = schema._def.options;
    return `z.union([${options.map((opt: z.ZodTypeAny) => zodToString(opt, indent)).join(', ')}])`;
  }

  // Handle enums
  if (schema instanceof z.ZodEnum) {
    const values = schema._def.values;
    return `z.enum([${values.map((v: any) => `'${v}'`).join(', ')}])`;
  }

  // Handle optional
  if (schema instanceof z.ZodOptional) {
    return `${zodToString(schema._def.innerType, indent)}.optional()`;
  }

  // Handle nullable
  if (schema instanceof z.ZodNullable) {
    return `${zodToString(schema._def.innerType, indent)}.nullable()`;
  }

  return 'z.unknown()';
  
}
