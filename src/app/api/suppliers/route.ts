import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Supplier from "@/src/models/Supplier";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { contactPerson: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const queryObj = Supplier.find(query).sort({ name: 1 });

    if (pageParam) {
      const page = parseInt(pageParam) || 1;
      const limit = parseInt(limitParam || "20");

      const totalCount = await Supplier.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);

      queryObj.skip((page - 1) * limit).limit(limit);
      const suppliers = await queryObj;

      return NextResponse.json({
        data: suppliers,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit
        }
      });
    } else {
      const suppliers = await queryObj;
      return NextResponse.json(suppliers);
    }
  } catch (error) {
    console.error("FAILED TO FETCH SUPPLIERS:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    // Check if supplier name already exists (case-insensitive)
    const existingSupplier = await Supplier.findOne({
      name: { $regex: `^${data.name.trim()}$`, $options: "i" },
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: "A supplier with this name already exists" },
        { status: 400 }
      );
    }

    const supplier = await Supplier.create({
      name: data.name.trim(),
      contactPerson: data.contactPerson || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      gstin: data.gstin || "",
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("FAILED TO CREATE SUPPLIER:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const { _id, ...updateData } = data;

    if (!_id) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
    }

    if (updateData.name && !updateData.name.trim()) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    // Check name uniqueness if name is changing
    if (updateData.name) {
      const existingWithName = await Supplier.findOne({
        _id: { $ne: _id },
        name: { $regex: `^${updateData.name.trim()}$`, $options: "i" },
      });
      if (existingWithName) {
        return NextResponse.json(
          { error: "A supplier with this name already exists" },
          { status: 400 }
        );
      }
      updateData.name = updateData.name.trim();
    }

    const supplier = await Supplier.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true }
    );

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("FAILED TO UPDATE SUPPLIER:", error);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
    }

    const supplier = await Supplier.findByIdAndDelete(id);

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("FAILED TO DELETE SUPPLIER:", error);
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
