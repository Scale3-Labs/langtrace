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
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 500;

    if (!datasetId && !id) {
      return NextResponse.json(
        {
          message: "No dataset id or project id provided",
        },
        { status: 404 }
      );
    }

    if (datasetId) {
      // get the dataset and all the data for this dataset and sort them by createdAt
      console.log(`Fetching dataset with id: ${datasetId}`);
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: datasetId,
        },
        include: {
          Data: true,
        },
      });

      if (!dataset) {
        return NextResponse.json(
          {
            message: "No datasets found",
          },
          { status: 404 }
        );
      }

      const totalLen = await prisma.data.count({
        where: {
          datasetId: dataset.id,
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

      // If dataset exists, fetch related Data records ordered by createdAt
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

      // Combine dataset with its related, ordered Data
      const datasetWithOrderedData = {
        ...dataset,
        Data: relatedData,
      };

      const csv = json2csv.parse(relatedData);

    const timestamp = new Date().toISOString().replace(/[-:]/g, '');
    const filename = `datasets_${timestamp}.csv`;

    // Write CSV to file with unique filename
    console.log(`CSV file '${filename}' `);

    

    // Send the file as response with appropriate headers
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
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

    // get all the datasets for this project and sort them by createdAt
    const datasets = await prisma.dataset.findMany({
      where: {
        projectId: id,
      },
      include: {
        Data: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const data = Array.isArray(datasets) ? datasets.flatMap(d => d.Data) : datasets;

    const csv = json2csv.parse(data);

    const timestamp = new Date().toISOString().replace(/[-:]/g, '');
    const filename = `datasets_${timestamp}.csv`;

    console.log(`CSV file '${filename}' `);

        return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
