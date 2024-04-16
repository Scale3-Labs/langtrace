import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import json2csv from 'json2csv';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const id = req.nextUrl.searchParams.get("id") as string;
    const datasetId = req.nextUrl.searchParams.get("dataset_id") as string;
    const pageParam = req.nextUrl.searchParams.get("page");
    let page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSizeParam = req.nextUrl.searchParams.get("pageSize");
    let pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 500;
    pageSize = Math.min(pageSize, 500);

    if (!datasetId && !id) {
      return NextResponse.json(
        {
          message: "No dataset id or project id provided",
        },
        { status: 404 }
      );
    }
    let dataset;
    if (datasetId) {
      dataset = await prisma.dataset.findFirst({
        where: {
          id: datasetId,
        },
        include: {
          Data: true,
        },
      });

    }
    else if (id) {
      dataset = await prisma.dataset.findFirst({
        where: {
          projectId: id,
        },
        include: {
          Data: true,
        },
      });
    }
    if (!dataset) {
      return NextResponse.json(
        {
          message: "No datasets found",
        },
        { status: 404 }
      );
    }

    const relatedData = await prisma.data.findMany({
      where: {
        datasetId: dataset.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    const csv = json2csv.parse(relatedData);
    const datasetName = dataset.name.toLowerCase().replace(/\s+/g, '_');
    const filename = `datasets_${datasetName}.csv`;

    console.log(`CSV file '${filename}' `);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Error downloading dataset",
      },
      { status: 500 }
    );
  }
}