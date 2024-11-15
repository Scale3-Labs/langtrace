import { z } from 'zod';
import { jsonToZodSchema } from '../lib/utils/schema';

describe('Complex Zod Schema Validation', () => {
  // Define the schema directly using Zod API
  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    age: z.number().int().min(0, "Age must be a positive integer"),
    address: z.object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      postalCode: z.string().regex(/^\d{5}$/, "Postal code must be a 5-digit number"),
    }),
    friends: z.array(
      z.object({
        name: z.string().min(1, "Friend's name is required"),
        email: z.string().email("Invalid friend's email address"),
      })
    ),
  });

  describe('Valid Data Tests', () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      age: 30,
      address: {
        street: "123 Main St",
        city: "Springfield",
        postalCode: "12345",
      },
      friends: [
        {
          name: "Jane Smith",
          email: "jane@example.com",
        }
      ]
    };

    test('should validate correct data structure', () => {
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Data Tests', () => {
    test('should fail with empty name', () => {
      const data = {
        name: "",
        email: "john@example.com",
        age: 30,
        address: {
          street: "123 Main St",
          city: "Springfield",
          postalCode: "12345",
        },
        friends: [{ name: "Jane", email: "jane@example.com" }]
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Name is required");
      }
    });

    test('should fail with invalid email', () => {
      const data = {
        name: "John Doe",
        email: "invalid-email",
        age: 30,
        address: {
          street: "123 Main St",
          city: "Springfield",
          postalCode: "12345",
        },
        friends: [{ name: "Jane", email: "jane@example.com" }]
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid email address");
      }
    });

    test('should fail with negative age', () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        age: -1,
        address: {
          street: "123 Main St",
          city: "Springfield",
          postalCode: "12345",
        },
        friends: [{ name: "Jane", email: "jane@example.com" }]
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Age must be a positive integer");
      }
    });

    test('should fail with invalid postal code', () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        address: {
          street: "123 Main St",
          city: "Springfield",
          postalCode: "123",
        },
        friends: [{ name: "Jane", email: "jane@example.com" }]
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Postal code must be a 5-digit number");
      }
    });

    test('should fail with invalid friend email', () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        address: {
          street: "123 Main St",
          city: "Springfield",
          postalCode: "12345",
        },
        friends: [{ name: "Jane", email: "invalid-email" }]
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid friend's email address");
      }
    });
  });
});
