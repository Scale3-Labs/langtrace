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

  try {
    // calculate the total count of traces
    const projectId = req.nextUrl.searchParams.get("id") as string;

    // get the datasets for the project
    const datasets = await prisma.dataset.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result: any[] = [];
    for (const dataset of datasets) {
      const totalData = await prisma.data.count({
        where: {
          datasetId: dataset.id,
        },
      });
      result.push({
        dataset,
        totalData,
      });
    }
    return NextResponse.json({
      result,
    });
  } catch (error) {
    return NextResponse.json(JSON.stringify({ error }), {
      status: 400,
    });
  }
}
