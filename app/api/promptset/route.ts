import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const id = req.nextUrl.searchParams.get("id") as string;
  const promptsetId = req.nextUrl.searchParams.get("promptset_id") as string;
  if (!promptsetId && !id) {
    return NextResponse.json(
      {
        error: "No promptset id or project id provided",
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
      include: {
        Prompt: true,
      },
    });

    if (!promptset) {
      return NextResponse.json(
        {
          error: "No promptset found",
        },
        { status: 404 }
      );
    }

    // If dataset exists, fetch related Data records ordered by createdAt
    const relatedPrompt = await prisma.prompt.findMany({
      where: {
        promptsetId: promptset.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Combine dataset with its related, ordered Data
    const promptsetWithOrderedData = {
      ...promptset,
      Prompt: relatedPrompt,
    };

    return NextResponse.json({
      promptsets: promptsetWithOrderedData,
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
        error: "No projects found",
      },
      { status: 404 }
    );
  }

  // get all the datasets for this project
  const promptsets = await prisma.promptset.findMany({
    where: {
      projectId: id,
    },
    include: {
      Prompt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    promptsets: promptsets,
  });
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
