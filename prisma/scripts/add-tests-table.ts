import { DEFAULT_TESTS } from "@/lib/constants";
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

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
