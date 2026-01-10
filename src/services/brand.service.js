import slugify from 'slugify';
import prisma from '../config/prisma.js';

export const createBrand = async (brandData) => {
  try {  
    const {
      name,
      description,
      isActive,
      images,        // single image object
      metaTitle,
      metaDescription
    } = brandData;

    if (!name) throw new Error("Brand name is required");

    const slug = brandData.slug
      ? brandData.slug
      : slugify(name, { lower: true, strict: true });

    // ✅ Check duplicate
    const existingBrand = await prisma.brand.findFirst({
      where: {
        OR: [{ name }, { slug }]
      }
    });

    if (existingBrand) {
      throw new Error("Brand with this name or slug already exists");
    }
    // ✅ Shape data EXACTLY as Prisma expects
    const prismaData = {
      name,
      slug,
      description: description || null,
      isActive: isActive ?? true,
      metaTitle: name || null,
      metaDescription: description || null,

      ...(images && {
        image: {
          create: {
            url: images[0].url,
            publicId: images[0].public_id || images[0].publicId
          }
        }
      })
    };

    const brand = await prisma.brand.create({
      data: prismaData
    });

    return brand;
  } catch (error) {
    throw new Error(`Error creating brand: ${error.message}`);
  }
};
export const getAllBrands = async (options) => {
  const {
    page = 1,
    limit = 100,
    search = "",
    active,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = options;

  const skip = (page - 1) * limit;

  /* ===============================
     BUILD WHERE CONDITION
  ================================ */
  const where = {
    ...(active !== undefined && {
      isActive: active === "true"
    }),

    ...(search && {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          slug: {
            contains: search,
            mode: "insensitive"
          }
        }
      ]
    })
  };

  /* ===============================
     PARALLEL DB CALLS (IMPORTANT)
  ================================ */
  const [data, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        image: {
          select: {
            url: true
          }
        }
      }
    }),

    prisma.brand.count({ where })
  ]);
  /* ===============================
     RETURN SAME SHAPE
  ================================ */
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const updateBrandById = async (id, payload) => {
  try {
    const brandId = Number(id);

    // 🔹 Check existence (lightweight)
    const existing = await prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        image: { select: { id: true } }
      }
    });

    if (!existing) throw new Error("Brand not found");

    // 🔹 Build update payload safely
    const updateData = {
      ...(payload.name && { name: payload.name }),
      ...(payload.description !== undefined && {
        description: payload.description
      }),
      ...(payload.isActive !== undefined && {
        isActive: payload.isActive === true || payload.isActive === "true"
      }),
      ...(payload.metaTitle !== undefined && {
        metaTitle: payload.metaTitle
      }),
      ...(payload.metaDescription !== undefined && {
        metaDescription: payload.metaDescription
      }),

      // ✅ Image metadata only (NO UPLOAD)
      ...(payload.image && {
        image: existing.image
          ? {
              update: {
                url: payload.image.url,
                publicId:
                  payload.image.public_id || payload.image.publicId
              }
            }
          : {
              create: {
                url: payload.image.url,
                publicId:
                  payload.image.public_id || payload.image.publicId
              }
            }
      })
    };

    return await prisma.brand.update({
      where: { id: brandId },
      data: updateData
    });
  } catch (error) {
    throw new Error(`Error updating brand: ${error.message}`);
  }
};


export const getBrandById = async (id) => {
    try {
        const brand = await prisma.brand.findUnique({ where: { id: Number(id) } });
        if (!brand) throw new Error('Brand not found');
        return brand;
    } catch (error) {
        throw new Error(`Error fetching brand: ${error.message}`);
    }
};

export const deleteBrandById = async (id) => {
  const brandId = Number(id);

  try {
    return await prisma.$transaction(async (tx) => {
      // 🔹 Check brand existence (lightweight)
      const brand = await tx.brand.findUnique({
        where: { id: brandId },
        select: { id: true }
      });

      if (!brand) {
        throw new Error("Brand not found");
      }

      // 🔹 Check product dependency
      const productCount = await tx.product.count({
        where: { brandId }
      });

      if (productCount > 0) {
        throw new Error(
          `Cannot delete brand with ${productCount} associated product`
        );
      }

      // 🔹 Delete brand (DB only)
      await tx.brand.delete({
        where: { id: brandId }
      });

      return { success: true };
    });
  } catch (error) {
    throw new Error(`Error deleting brand: ${error.message}`);
  }
};
