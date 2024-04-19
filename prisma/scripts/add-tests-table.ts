import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export const DEFAULT_TESTS = [
  {
    name: "Factual Accuracy",
    description:
      "Evaluates the model's ability to provide factually correct answers, often involving comparison with verified data sources or databases.",
  },
  {
    name: "Adversarial Testing",
    description:
      "Present the model with intentionally tricky or misleading inputs to test its robustness and ability to handle edge cases without producing nonsensical or incorrect outputs.",
  },
  {
    name: "Consistency Checks",
    description:
      "Ensuring that the model provides consistent answers to the same question, even if phrased differently or asked at different times.",
  },
  {
    name: "Quality",
    description:
      "Better for tasks like summarization where coverage and quality of the content is important.",
  },
  {
    name: "Bias Detection",
    description:
      "Evaluating the responses for evidence of bias, including gender, racial, cultural, or ideological biases, to ensure the model's fairness and inclusivity.",
  },
];

async function addTestTable() {
  // Fetch all existing projects
  const projects = await prisma.project.findMany();

  // For each project, create default tests
  for (const project of projects) {
    const createdTests = [];
    for (const test of DEFAULT_TESTS) {
      const name = test.name?.toLowerCase() as string;
      const description = test.description;
      const result = await prisma.test.create({
        data: { name, description, projectId: project.id },
      });
      createdTests.push(result);
    }

    // Find the "Factual Accuracy" test id
    const factualAccuracyTestId = createdTests.filter(
      (test) => test.name === "factual accuracy"
    )[0].id;

    // Update all evaluations associated with the current project to use the "Factual Accuracy" testId
    await prisma.evaluation.updateMany({
      where: { projectId: project.id },
      data: { testId: factualAccuracyTestId },
    });
  }
}

addTestTable().then(() => console.log("Migration completed."));
