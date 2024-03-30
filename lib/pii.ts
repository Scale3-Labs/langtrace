export default function detectPII(text: string): string[] {
  // Define regular expressions for various types of PII
  const patterns = {
    phoneNumber: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Simplified phone number pattern (US-centric)
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, // Email pattern
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
    dateOfBirth:
      /\b(0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?\d\d\b/g, // Date of birth pattern MM/DD/YYYY, MM-DD-YYYY, etc.
    creditCard: /\b(?:\d{4}[- ]?){3}\d{4}\b/g, // Basic credit card pattern
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, // Simplistic IP address pattern
    // Add more patterns as needed
  };

  const foundPII: string[] = [];

  // Check the text against each pattern and add matches to foundPII
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern);
    if (matches) {
      foundPII.push(...matches.map((match) => `${type}: ${match}`));
    }
  }

  return foundPII;
}
