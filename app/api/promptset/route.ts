import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import {
  authApiKey,
  fillPromptStringTemplate,
  parseQueryString,
} from "@/lib/utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== null) {
      const response = await authApiKey(apiKey);
      if (response.status !== 200) {
        return response;
      }
      const { promptset_id, variables, version } = parseQueryString(req.url);

      const projectData = await response.json();
      const projectId = projectData.data.project.id;
      const promptSet = await prisma.promptset.findFirst({
        where: {
          projectId: projectId,
          id: promptset_id as string,
        },
        include: {
          Prompt: {
            where: {
              OR:
                version !== undefined
                  ? [{ version: version }]
                  : [{ live: true }],
            },
          },
        },
      });
      let prompts = promptSet?.Prompt ?? [];
      if (prompts.length === 0 && version === undefined) {
        return NextResponse.json(
          {
            error: "No live prompts found. A prompt version must be specified",
          },
          { status: 400 }
        );
      } else if (prompts.length === 0 && version !== undefined) {
        return NextResponse.json(
          {
            error: "No prompts found with the specified version",
          },
          { status: 404 }
        );
      }
      if (variables !== undefined) {
        const errors: string[] = [];
        const variablesSet = new Set(
          Object.entries(variables as Record<string, string>).map((variable) =>
            variable.join(",")
          )
        );
        const livePromptVariables = prompts[0].variables;

        livePromptVariables.forEach((key) => {
          const value =
            variables !== null
              ? variables[key as keyof typeof variables] ?? ""
              : "";
          if (
            !variablesSet.has(
              `${key},${value.length > 0 ? value : "undefined"}`
            )
          ) {
            errors.push(key);
          }
        });
        if (errors.length > 0) {
          const moreThanOneError = errors.length > 1;
          return NextResponse.json(
            {
              error: `${
                moreThanOneError ? "Variables" : "Variable"
              } ${errors.join(", ")} ${
                moreThanOneError ? "are" : "is"
              } missing`,
            },
            { status: 400 }
          );
        }
        prompts[0].value = fillPromptStringTemplate(
          prompts[0].value,
          variables as Record<string, string>
        );
      }
      return NextResponse.json({
        ...promptSet,
        Prompt: undefined,
        prompts: prompts,
      });
    } else {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json(
          {
            message: "Unauthorized",
          },
          { status: 401 }
        );
      }

      const id = req.nextUrl.searchParams.get("id") as string;
      const promptsetId = req.nextUrl.searchParams.get(
        "promptset_id"
      ) as string;
      const pageParam = req.nextUrl.searchParams.get("page");

      let page = pageParam ? parseInt(pageParam, 10) : 1;
      const pageSizeParam = req.nextUrl.searchParams.get("pageSize");
      const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10;

      if (!promptsetId && !id) {
        return NextResponse.json(
          {
            message: "No promptset id or project id provided",
          },
          { status: 404 }
        );
      }

      if (promptsetId) {
        // get the dataset and all the data for this dataset and sort them by createdAt
        const promptset = await prisma.promptset.findFirst({
          where: {
            id: promptsetId,
          },
        });

        if (!promptset) {
          return NextResponse.json(
            {
              message: "No promptset found",
            },
            { status: 404 }
          );
        }

        const totalLen = await prisma.prompt.count({
          where: {
            promptsetId: promptset.id,
          },
        });

        const totalPages =
          Math.ceil(totalLen / pageSize) === 0
            ? 1
            : Math.ceil(totalLen / pageSize);
        const md = { page, page_size: pageSize, total_pages: totalPages };

        if (page! > totalPages) {
          page = totalPages;
        }

        const relatedPrompt = await prisma.prompt.findMany({
          where: {
            promptsetId: promptset.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: pageSize,
          skip: (page - 1) * pageSize,
        });

        // Combine dataset with its related, ordered Data
        const promptsetWithOrderedData = {
          ...promptset,
          prompts: relatedPrompt,
        };

        return NextResponse.json({
          promptsets: promptsetWithOrderedData,
          metadata: md,
        });
      }

      const project = await prisma.project.findFirst({
        where: {
          id,
        },
      });
      if (!project) {
        return NextResponse.json(
          {
            message: "No projects found",
          },
          { status: 404 }
        );
      }
      // get all the datasets for this project
      const promptsets = await prisma.promptset.findMany({
        where: {
          projectId: id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              Prompt: true,
            },
          },
        },
      });
      return NextResponse.json({
        promptsets: promptsets,
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { name, description, projectId } = data;

  const promptset = await prisma.promptset.create({
    data: {
      name,
      description,
      projectId,
    },
  });

  return NextResponse.json({
    promptset: promptset,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id, name, description } = data;

  const promptset = await prisma.promptset.update({
    where: {
      id,
    },
    data: {
      name,
      description,
    },
  });

  return NextResponse.json({
    promptset: promptset,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id } = data;

  const promptset = await prisma.promptset.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({});
}
