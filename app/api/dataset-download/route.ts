import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import json2csv from 'json2csv';
import fs from 'fs';

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
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10;

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
      });

      const csv = json2csv.parse(relatedData);
      const timestamp = new Date().toISOString().replace(/[-:]/g, '');
    const filename = `datasets_${timestamp}.csv`;

    // Write CSV to file with unique filename
    console.log(`CSV file '${filename}' `);

    fs.writeFileSync(filename, csv);
    console.log(`CSV file '${filename}' saved successfully.`);


    // Read the CSV file
    const fileContents = fs.readFileSync(filename, 'utf-8');

    // Send the file as response with appropriate headers
    return new Response(fileContents, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
    }  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
